import { NextResponse } from "next/server";
import {
  queryRegimeLatest,
  queryAllocationLatest,
  queryFactorsLatest,
  queryPerformance,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [regime, allocation, factors, perf] = await Promise.all([
      queryRegimeLatest(),
      queryAllocationLatest(),
      queryFactorsLatest(),
      queryPerformance(500),
    ]);
    return NextResponse.json({
      regime,
      allocation,
      factors,
      performance_summary: perf.metrics,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
