import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function buildInsights(f: Record<string, number | null>) {
  const { trend_signal, vol_signal, liq_signal, dual_mom_signal,
          nifty, nifty_200dma, vix, vix_20d_ma, gsec_10y, gsec_60d_ma } = f;

  const fmt = (n: number | null, d = 0) => n != null ? n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";

  return [
    trend_signal
      ? { signal: "trend",      status: "bullish", label: "Trend: Bullish",          description: `NIFTY ${fmt(nifty)} above 200DMA ${fmt(nifty_200dma)} — uptrend intact` }
      : { signal: "trend",      status: "bearish", label: "Trend: Bearish",          description: `NIFTY ${fmt(nifty)} below 200DMA ${fmt(nifty_200dma)} — downtrend risk` },
    vol_signal
      ? { signal: "volatility", status: "bullish", label: "Volatility: Low",         description: `VIX ${fmt(vix, 1)} below 20d avg ${fmt(vix_20d_ma, 1)} — volatility subsiding` }
      : { signal: "volatility", status: "bearish", label: "Volatility: High",        description: `VIX ${fmt(vix, 1)} above 20d avg ${fmt(vix_20d_ma, 1)} — elevated market stress` },
    liq_signal
      ? { signal: "liquidity",  status: "bullish", label: "Liquidity: Easing",       description: `G-Sec ${fmt(gsec_10y, 2)}% falling below 60d avg ${fmt(gsec_60d_ma, 2)}% — liquidity easing` }
      : { signal: "liquidity",  status: "bearish", label: "Liquidity: Tightening",   description: `G-Sec ${fmt(gsec_10y, 2)}% above 60d avg ${fmt(gsec_60d_ma, 2)}% — yields rising` },
    dual_mom_signal
      ? { signal: "momentum",   status: "bullish", label: "Momentum: Strong",        description: "Absolute & relative momentum both positive" }
      : { signal: "momentum",   status: "warning", label: "Momentum: Weak",          description: "Dual momentum signal reduced — defensive tilt" },
  ];
}

export async function GET() {
  const { data: f, error } = await supabase
    .from("factors")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error || !f) return NextResponse.json({ error: "No factor data" }, { status: 404 });

  const { data: md } = await supabase
    .from("market_data")
    .select("nifty, vix, gsec_10y")
    .eq("date", f.date)
    .single();

  const row = { ...f, nifty: md?.nifty ?? null, vix: md?.vix ?? null, gsec_10y: md?.gsec_10y ?? null };

  return NextResponse.json({
    date:             f.date,
    nifty:            md?.nifty       ?? null,
    nifty_200dma:     f.nifty_200dma,
    trend_signal:     f.trend_signal,
    vix:              md?.vix         ?? null,
    vix_20d_ma:       f.vix_20d_ma,
    vol_signal:       f.vol_signal,
    gsec_10y:         md?.gsec_10y    ?? null,
    gsec_60d_ma:      f.gsec_60d_ma,
    liq_signal:       f.liq_signal,
    dual_mom_signal:  f.dual_mom_signal,
    regime_score:     f.regime_score,
    insights:         buildInsights(row),
  });
}
