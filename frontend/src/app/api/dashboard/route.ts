import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Fan out to the individual route handlers
export async function GET(req: NextRequest) {
  const base = req.nextUrl.origin;

  const [regime, allocation, factors, perf] = await Promise.all([
    fetch(`${base}/api/regime/latest`).then((r) => r.json()),
    fetch(`${base}/api/allocation/latest`).then((r) => r.json()),
    fetch(`${base}/api/factors/latest`).then((r) => r.json()),
    fetch(`${base}/api/performance?chart_days=500`).then((r) => r.json()),
  ]);

  return NextResponse.json({
    regime,
    allocation,
    factors,
    performance_summary: perf.metrics,
  });
}
