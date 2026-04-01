/**
 * Direct Supabase query functions.
 * Used by page.tsx (server component) AND the API route handlers.
 * No HTTP self-fetch — avoids Vercel Deployment Protection 401s.
 */
import { getSupabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export type RegimeData = {
  date: string; regime: string; regime_score: number; confidence: number;
  prev_regime: string | null; regime_changed: boolean;
  nifty: number | null; vix: number | null; gsec_10y: number | null;
};
export type AllocationData = {
  date: string; regime: string; equity_pct: number;
  gold_pct: number; debt_pct: number; description: string;
};
export type FactorsData = {
  date: string; nifty: number | null; nifty_200dma: number | null;
  trend_signal: number; vix: number | null; vix_20d_ma: number | null;
  vol_signal: number; gsec_10y: number | null; gsec_60d_ma: number | null;
  liq_signal: number; dual_mom_signal: number; regime_score: number;
  insights: Insight[];
};
export type Insight = { signal: string; status: string; label: string; description: string };
export type PerformanceMetrics = {
  strategy_cagr: number; benchmark_cagr: number; gold_cagr: number;
  annual_vol: number; sharpe_ratio: number; max_drawdown: number;
  calmar_ratio: number; win_rate: number; best_day: number;
  worst_day: number; years_of_data: number; final_nav: number;
};
export type RegimeDistribution = {
  risk_on_days: number; risk_on_pct: number; neutral_days: number;
  neutral_pct: number; risk_off_days: number; risk_off_pct: number;
};
export type ChartPoint = {
  date: string; portfolio_nav: number; benchmark_nav: number;
  gold_bh_nav: number; portfolio_dd: number; regime: string;
};
export type PerformanceData = {
  metrics: PerformanceMetrics; regime_distribution: RegimeDistribution;
  chart_data: ChartPoint[];
};
export type RegimeHistoryPoint = {
  date: string; regime: string; regime_score: number;
  confidence: number; regime_changed: boolean;
  nifty: number | null; vix: number | null;
};
export type AllocationHistoryPoint = {
  date: string; equity_pct: number; gold_pct: number;
  debt_pct: number; base_equity: number; drawdown: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function allocDesc(eq: number, gld: number, regime: string) {
  if (regime === "Risk ON")  return `Strong market — ${eq.toFixed(0)}% equity, ${gld.toFixed(0)}% gold`;
  if (regime === "Neutral")  return `Mixed signals — ${eq.toFixed(0)}% equity / ${gld.toFixed(0)}% gold`;
  return `Defensive — ${gld.toFixed(0)}% gold, ${eq.toFixed(0)}% equity`;
}

function buildInsights(f: any, md: any): Insight[] {
  const n  = (v: any, d = 0) => v != null ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
  const { trend_signal: tr, vol_signal: vo, liq_signal: li, dual_mom_signal: dm,
          nifty_200dma, vix_20d_ma, gsec_60d_ma } = f;
  const { nifty, vix, gsec_10y } = md ?? {};
  return [
    tr ? { signal:"trend",      status:"bullish", label:"Trend: Bullish",        description:`NIFTY ${n(nifty)} above 200DMA ${n(nifty_200dma)} — uptrend intact` }
       : { signal:"trend",      status:"bearish", label:"Trend: Bearish",        description:`NIFTY ${n(nifty)} below 200DMA ${n(nifty_200dma)} — downtrend risk` },
    vo ? { signal:"volatility", status:"bullish", label:"Volatility: Low",       description:`VIX ${n(vix,1)} below 20d avg ${n(vix_20d_ma,1)} — subsiding` }
       : { signal:"volatility", status:"bearish", label:"Volatility: High",      description:`VIX ${n(vix,1)} above 20d avg ${n(vix_20d_ma,1)} — elevated stress` },
    li ? { signal:"liquidity",  status:"bullish", label:"Liquidity: Easing",     description:`G-Sec ${n(gsec_10y,2)}% falling below 60d avg ${n(gsec_60d_ma,2)}%` }
       : { signal:"liquidity",  status:"bearish", label:"Liquidity: Tightening", description:`G-Sec ${n(gsec_10y,2)}% above 60d avg ${n(gsec_60d_ma,2)}% — rising` },
    dm ? { signal:"momentum",   status:"bullish", label:"Momentum: Strong",      description:"Absolute & relative momentum both positive" }
       : { signal:"momentum",   status:"warning", label:"Momentum: Weak",        description:"Dual momentum signal reduced — defensive tilt" },
  ];
}

const TRADING_DAYS = 252;
const START_NAV    = 100;

function stdDev(arr: number[]) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function computeMetrics(rows: any[]): PerformanceMetrics {
  const rets  = rows.map(r => r.portfolio_return ?? 0);
  const navs  = rows.map(r => r.portfolio_nav    ?? START_NAV);
  const dds   = rows.map(r => r.portfolio_drawdown ?? 0);
  const bm    = rows.map(r => r.benchmark_nav    ?? START_NAV);
  const gld   = rows.map(r => r.gold_bh_nav      ?? START_NAV);
  const years = rets.length / TRADING_DAYS;
  const final = navs.at(-1)!;
  const cagr  = (final / START_NAV) ** (1 / years) - 1;
  const vol   = stdDev(rets) * Math.sqrt(TRADING_DAYS);
  return {
    strategy_cagr:  +(cagr * 100).toFixed(2),
    benchmark_cagr: +((bm.at(-1)! / START_NAV) ** (1 / years) - 1 * 100).toFixed(2),
    gold_cagr:      +((gld.at(-1)! / START_NAV) ** (1 / years) - 1 * 100).toFixed(2),
    annual_vol:     +(vol * 100).toFixed(2),
    sharpe_ratio:   +(vol > 0 ? cagr / vol : 0).toFixed(2),
    max_drawdown:   +(Math.min(...dds) * 100).toFixed(2),
    calmar_ratio:   +(Math.min(...dds) < 0 ? cagr / Math.abs(Math.min(...dds)) : 0).toFixed(2),
    win_rate:       +(rets.filter(r => r > 0).length / rets.length * 100).toFixed(2),
    best_day:       +(Math.max(...rets) * 100).toFixed(2),
    worst_day:      +(Math.min(...rets) * 100).toFixed(2),
    years_of_data:  +years.toFixed(1),
    final_nav:      +final.toFixed(2),
  };
}

function computeDist(rows: any[]): RegimeDistribution {
  const t = rows.length || 1;
  const on  = rows.filter(r => r.regime === "Risk ON").length;
  const neu = rows.filter(r => r.regime === "Neutral").length;
  const off = rows.filter(r => r.regime === "Risk OFF").length;
  return {
    risk_on_days: on,  risk_on_pct:  +(on  / t * 100).toFixed(1),
    neutral_days: neu, neutral_pct:  +(neu / t * 100).toFixed(1),
    risk_off_days:off, risk_off_pct: +(off / t * 100).toFixed(1),
  };
}

// ── Public query functions ────────────────────────────────────────────────

export async function queryRegimeLatest(): Promise<RegimeData> {
  const sb = getSupabase();
  const { data: r } = await sb.from("regime")
    .select("date,regime,regime_score,confidence,prev_regime,regime_changed")
    .order("date", { ascending: false }).limit(1).single();
  const { data: md } = await sb.from("market_data")
    .select("nifty,vix,gsec_10y").eq("date", r.date).single();
  return { ...r, nifty: md?.nifty ?? null, vix: md?.vix ?? null, gsec_10y: md?.gsec_10y ?? null };
}

export async function queryRegimeHistory(days = 90): Promise<RegimeHistoryPoint[]> {
  const sb = getSupabase();
  const { data } = await sb.from("regime")
    .select("date,regime,regime_score,confidence,regime_changed")
    .order("date", { ascending: false }).limit(days);
  const dates = (data ?? []).map(r => r.date);
  const { data: mds } = await sb.from("market_data").select("date,nifty,vix").in("date", dates);
  const map = Object.fromEntries((mds ?? []).map(m => [m.date, m]));
  return (data ?? []).reverse().map(r => ({ ...r, nifty: map[r.date]?.nifty ?? null, vix: map[r.date]?.vix ?? null }));
}

export async function queryRegimeChanges(limit = 15) {
  const { data } = await getSupabase().from("regime")
    .select("date,regime,prev_regime,regime_score")
    .eq("regime_changed", true).order("date", { ascending: false }).limit(limit);
  return (data ?? []).map(r => ({ date: r.date, new_regime: r.regime, old_regime: r.prev_regime, score: r.regime_score }));
}

export async function queryAllocationLatest(): Promise<AllocationData> {
  const sb = getSupabase();
  const { data: a } = await sb.from("allocation")
    .select("date,dd_adj_mom_weight,dd_adj_gold_weight")
    .order("date", { ascending: false }).limit(1).single();
  const { data: reg } = await sb.from("regime").select("regime").eq("date", a.date).single();
  const eq  = +((a.dd_adj_mom_weight  ?? 0) * 100).toFixed(1);
  const gld = +((a.dd_adj_gold_weight ?? 0) * 100).toFixed(1);
  const rl  = reg?.regime ?? "Risk OFF";
  return { date: a.date, regime: rl, equity_pct: eq, gold_pct: gld,
           debt_pct: +Math.max(0, 100 - eq - gld).toFixed(1), description: allocDesc(eq, gld, rl) };
}

export async function queryAllocationHistory(days = 365): Promise<AllocationHistoryPoint[]> {
  const { data } = await getSupabase().from("allocation")
    .select("date,dd_adj_mom_weight,dd_adj_gold_weight,base_mom_weight,momentum_drawdown")
    .order("date", { ascending: false }).limit(days);
  return (data ?? []).reverse().map(r => ({
    date:       r.date,
    equity_pct: +((r.dd_adj_mom_weight  ?? 0) * 100).toFixed(1),
    gold_pct:   +((r.dd_adj_gold_weight ?? 0) * 100).toFixed(1),
    debt_pct:   0,
    base_equity:+((r.base_mom_weight    ?? 0) * 100).toFixed(1),
    drawdown:   +((r.momentum_drawdown  ?? 0) * 100).toFixed(2),
  }));
}

export async function queryFactorsLatest(): Promise<FactorsData> {
  const sb = getSupabase();
  const { data: f } = await sb.from("factors").select("*").order("date", { ascending: false }).limit(1).single();
  const { data: md } = await sb.from("market_data").select("nifty,vix,gsec_10y").eq("date", f.date).single();
  return {
    date: f.date, nifty: md?.nifty ?? null, nifty_200dma: f.nifty_200dma,
    trend_signal: f.trend_signal, vix: md?.vix ?? null, vix_20d_ma: f.vix_20d_ma,
    vol_signal: f.vol_signal, gsec_10y: md?.gsec_10y ?? null, gsec_60d_ma: f.gsec_60d_ma,
    liq_signal: f.liq_signal, dual_mom_signal: f.dual_mom_signal, regime_score: f.regime_score,
    insights: buildInsights(f, md),
  };
}

export async function queryPerformance(chartDays = 500): Promise<PerformanceData> {
  const sb = getSupabase();
  const { data: all } = await sb.from("performance")
    .select("portfolio_return,portfolio_nav,portfolio_drawdown,benchmark_nav,gold_bh_nav")
    .order("date", { ascending: true });
  const { data: regimes } = await sb.from("regime").select("regime");
  const { data: chart }   = await sb.from("performance")
    .select("date,portfolio_nav,benchmark_nav,gold_bh_nav,portfolio_drawdown,regime")
    .order("date", { ascending: false }).limit(chartDays);
  return {
    metrics:             computeMetrics(all ?? []),
    regime_distribution: computeDist(regimes ?? []),
    chart_data:          (chart ?? []).reverse().map(r => ({
      date: r.date, portfolio_nav: +(r.portfolio_nav ?? 100).toFixed(2),
      benchmark_nav: +(r.benchmark_nav ?? 100).toFixed(2), gold_bh_nav: +(r.gold_bh_nav ?? 100).toFixed(2),
      portfolio_dd: +((r.portfolio_drawdown ?? 0) * 100).toFixed(2), regime: r.regime,
    })),
  };
}
