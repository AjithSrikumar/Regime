import { NextResponse } from "next/server";
import { queryRegimeLatest } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await queryRegimeLatest());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
