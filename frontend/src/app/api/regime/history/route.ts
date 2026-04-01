import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "90");

  const { data: rows, error } = await supabase
    .from("regime")
    .select("date, regime, regime_score, confidence, regime_changed")
    .order("date", { ascending: false })
    .limit(days);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch corresponding NIFTY / VIX
  const dates = (rows ?? []).map((r) => r.date);
  const { data: mds } = await supabase
    .from("market_data")
    .select("date, nifty, vix")
    .in("date", dates);

  const mdMap = Object.fromEntries((mds ?? []).map((m) => [m.date, m]));

  const result = (rows ?? [])
    .map((r) => ({
      ...r,
      nifty: mdMap[r.date]?.nifty ?? null,
      vix:   mdMap[r.date]?.vix   ?? null,
    }))
    .reverse();

  return NextResponse.json(result);
}
