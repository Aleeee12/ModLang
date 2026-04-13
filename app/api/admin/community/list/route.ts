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
    console.error("Admin community list error:", error);

    return NextResponse.json(
      {
        ok: false,
        items: [],
        error: "No se pudo cargar la comunidad.",
      },
      { status: 500 }
    );
  }
}
