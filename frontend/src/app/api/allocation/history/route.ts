import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "365");

  const { data, error } = await supabase
    .from("allocation")
    .select("date, dd_adj_mom_weight, dd_adj_gold_weight, base_mom_weight, momentum_drawdown")
    .order("date", { ascending: false })
    .limit(days);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data ?? []).reverse().map((r) => ({
    date:         r.date,
    equity_pct:   +((r.dd_adj_mom_weight  ?? 0) * 100).toFixed(1),
    gold_pct:     +((r.dd_adj_gold_weight ?? 0) * 100).toFixed(1),
    debt_pct:     0,
    base_equity:  +((r.base_mom_weight    ?? 0) * 100).toFixed(1),
    drawdown:     +((r.momentum_drawdown  ?? 0) * 100).toFixed(2),
  }));

  return NextResponse.json(result);
}
