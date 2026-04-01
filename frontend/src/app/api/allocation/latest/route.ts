import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function description(equity: number, gold: number, regime: string) {
  if (regime === "Risk ON")  return `Strong market conditions — ${equity.toFixed(0)}% equity, ${gold.toFixed(0)}% gold for growth`;
  if (regime === "Neutral")  return `Mixed signals — balanced ${equity.toFixed(0)}% equity / ${gold.toFixed(0)}% gold exposure`;
  return `Defensive posture — ${gold.toFixed(0)}% gold protection, ${equity.toFixed(0)}% equity`;
}

export async function GET() {
  const { data: alloc, error } = await supabase
    .from("allocation")
    .select("date, dd_adj_mom_weight, dd_adj_gold_weight")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error || !alloc) {
    return NextResponse.json({ error: "No allocation data" }, { status: 404 });
  }

  const { data: regime } = await supabase
    .from("regime")
    .select("regime")
    .eq("date", alloc.date)
    .single();

  const equity  = +((alloc.dd_adj_mom_weight  ?? 0) * 100).toFixed(1);
  const gold    = +((alloc.dd_adj_gold_weight ?? 0) * 100).toFixed(1);
  const debt    = +(Math.max(0, 100 - equity - gold)).toFixed(1);
  const regLabel = regime?.regime ?? "Risk OFF";

  return NextResponse.json({
    date:        alloc.date,
    regime:      regLabel,
    equity_pct:  equity,
    gold_pct:    gold,
    debt_pct:    debt,
    description: description(equity, gold, regLabel),
  });
}
