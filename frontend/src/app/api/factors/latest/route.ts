import { NextResponse } from "next/server";
import { queryFactorsLatest } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await queryFactorsLatest());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
