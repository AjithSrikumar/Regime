import { NextResponse } from "next/server";
import { queryRegimeChanges } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const limit = Number(new URL(req.url).searchParams.get("limit") ?? "15");
    return NextResponse.json(await queryRegimeChanges(limit));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
