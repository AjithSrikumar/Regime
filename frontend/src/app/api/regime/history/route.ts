import { NextResponse } from "next/server";
import { queryRegimeHistory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const days = Number(new URL(req.url).searchParams.get("days") ?? "90");
    return NextResponse.json(await queryRegimeHistory(days));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
