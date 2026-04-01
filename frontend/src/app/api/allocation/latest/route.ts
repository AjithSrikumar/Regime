import { NextResponse } from "next/server";
import { queryAllocationLatest } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await queryAllocationLatest());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
