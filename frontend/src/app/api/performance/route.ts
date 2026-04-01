import { NextResponse } from "next/server";
import { queryPerformance } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const chartDays = Number(new URL(req.url).searchParams.get("chart_days") ?? "500");
    return NextResponse.json(await queryPerformance(chartDays));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
