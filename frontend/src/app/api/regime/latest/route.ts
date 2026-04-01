import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: regime, error: rErr } = await supabase
    .from("regime")
    .select("date, regime, regime_score, confidence, prev_regime, regime_changed")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (rErr || !regime) {
    return NextResponse.json({ error: "No regime data" }, { status: 404 });
  }

  const { data: md } = await supabase
    .from("market_data")
    .select("nifty, vix, gsec_10y")
    .eq("date", regime.date)
    .single();

  return NextResponse.json({
    ...regime,
    nifty:    md?.nifty    ?? null,
    vix:      md?.vix      ?? null,
    gsec_10y: md?.gsec_10y ?? null,
  });
}
