import { NextResponse } from "next/server";
import { queryAllocationHistory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const days = Number(new URL(req.url).searchParams.get("days") ?? "365");
    return NextResponse.json(await queryAllocationHistory(days));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
