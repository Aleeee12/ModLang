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
  } catch (error) {
    console.error("Community list route error:", error);

    return NextResponse.json(
      { ok: false, items: [] },
      { status: 500 }
    );
  }
}
