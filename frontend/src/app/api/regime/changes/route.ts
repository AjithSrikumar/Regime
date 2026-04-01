import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "15");

  const { data, error } = await supabase
    .from("regime")
    .select("date, regime, prev_regime, regime_score")
    .eq("regime_changed", true)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((r) => ({
      date:       r.date,
      new_regime: r.regime,
      old_regime: r.prev_regime,
      score:      r.regime_score,
    }))
  );
}
