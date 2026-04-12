import { NextResponse } from "next/server";
import { getCommunityList } from "@/app/community/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getCommunityList();

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, items: [] },
      { status: 500 }
    );
  }
}