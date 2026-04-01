import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TRADING_DAYS = 252;
const START_NAV    = 100;

export async function GET(req: Request) {
  const chartDays = Number(new URL(req.url).searchParams.get("chart_days") ?? "500");

  // All rows for metrics
  const { data: all, error } = await supabase
    .from("performance")
    .select("portfolio_return, portfolio_nav, portfolio_drawdown, mom_return:momentum_return, gold_return, benchmark_nav, gold_bh_nav")
    .order("date", { ascending: true });

  if (error || !all?.length) {
    return NextResponse.json({ metrics: emptyMetrics(), regime_distribution: emptyDist(), chart_data: [] });
  }

  const metrics = computeMetrics(all);

  // Regime distribution from regime table
  const { data: regimes } = await supabase.from("regime").select("regime");
  const dist = computeDist(regimes ?? []);

  // Chart data — last N rows
  const { data: chart, error: cErr } = await supabase
    .from("performance")
    .select("date, portfolio_nav, benchmark_nav, gold_bh_nav, portfolio_drawdown, regime")
    .order("date", { ascending: false })
    .limit(chartDays);

  const chartData = (chart ?? []).reverse().map((r) => ({
    date:           r.date,
    portfolio_nav:  +(r.portfolio_nav       ?? 100).toFixed(2),
    benchmark_nav:  +(r.benchmark_nav       ?? 100).toFixed(2),
    gold_bh_nav:    +(r.gold_bh_nav         ?? 100).toFixed(2),
    portfolio_dd:   +((r.portfolio_drawdown ?? 0) * 100).toFixed(2),
    regime:         r.regime,
  }));

  return NextResponse.json({ metrics, regime_distribution: dist, chart_data: chartData });
}

function computeMetrics(rows: any[]) {
  const rets   = rows.map((r) => r.portfolio_return ?? 0);
  const navs   = rows.map((r) => r.portfolio_nav    ?? START_NAV);
  const dds    = rows.map((r) => r.portfolio_drawdown ?? 0);
  const bmNavs = rows.map((r) => r.benchmark_nav    ?? START_NAV);
  const gldNavs= rows.map((r) => r.gold_bh_nav      ?? START_NAV);

  const years   = rets.length / TRADING_DAYS;
  const finalNav= navs.at(-1)!;
  const cagr    = (finalNav / START_NAV) ** (1 / years) - 1;
  const std     = stdDev(rets);
  const annVol  = std * Math.sqrt(TRADING_DAYS);
  const sharpe  = annVol > 0 ? cagr / annVol : 0;
  const maxDD   = Math.min(...dds);
  const calmar  = maxDD < 0 ? cagr / Math.abs(maxDD) : 0;
  const winRate = rets.filter((r) => r > 0).length / rets.length;
  const bmCagr  = (bmNavs.at(-1)! / START_NAV) ** (1 / years) - 1;
  const gldCagr = (gldNavs.at(-1)! / START_NAV) ** (1 / years) - 1;

  return {
    strategy_cagr:  +(cagr   * 100).toFixed(2),
    benchmark_cagr: +(bmCagr * 100).toFixed(2),
    gold_cagr:      +(gldCagr* 100).toFixed(2),
    annual_vol:     +(annVol * 100).toFixed(2),
    sharpe_ratio:   +sharpe.toFixed(2),
    max_drawdown:   +(maxDD  * 100).toFixed(2),
    calmar_ratio:   +calmar.toFixed(2),
    win_rate:       +(winRate* 100).toFixed(2),
    best_day:       +(Math.max(...rets) * 100).toFixed(2),
    worst_day:      +(Math.min(...rets) * 100).toFixed(2),
    years_of_data:  +years.toFixed(1),
    final_nav:      +finalNav.toFixed(2),
  };
}

function computeDist(regimes: { regime: string }[]) {
  const total = regimes.length || 1;
  const on  = regimes.filter((r) => r.regime === "Risk ON").length;
  const neu = regimes.filter((r) => r.regime === "Neutral").length;
  const off = regimes.filter((r) => r.regime === "Risk OFF").length;
  return {
    risk_on_days:   on,   risk_on_pct:  +(on  / total * 100).toFixed(1),
    neutral_days:   neu,  neutral_pct:  +(neu / total * 100).toFixed(1),
    risk_off_days:  off,  risk_off_pct: +(off / total * 100).toFixed(1),
  };
}

function stdDev(arr: number[]) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

function emptyMetrics() {
  return { strategy_cagr:0, benchmark_cagr:0, gold_cagr:0, annual_vol:0,
           sharpe_ratio:0, max_drawdown:0, calmar_ratio:0, win_rate:0,
           best_day:0, worst_day:0, years_of_data:0, final_nav:100 };
}
function emptyDist() {
  return { risk_on_days:0, risk_on_pct:0, neutral_days:0, neutral_pct:0,
           risk_off_days:0, risk_off_pct:0 };
}
