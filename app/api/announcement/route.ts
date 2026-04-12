import { NextResponse } from "next/server";
import { getPublicAnnouncement } from "@/app/lib/admin-announcement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcement = await getPublicAnnouncement();

    return NextResponse.json({
      ok: true,
      announcement,
    });
  } catch (error) {
    console.error("GET /api/announcement error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo cargar el anuncio público." },
      { status: 500 }
    );
  }
}