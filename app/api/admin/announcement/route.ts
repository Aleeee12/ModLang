import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAnnouncement,
  saveAdminAnnouncement,
} from "@/app/lib/admin-announcement";
import { addActivityLog } from "@/app/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAdminAnnouncement();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/announcement error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo cargar el anuncio." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const message = String(body?.message ?? "");
    const enabled = Boolean(body?.enabled);

    const saved = await saveAdminAnnouncement({
      message,
      enabled,
    });

    await addActivityLog({
      type: "announcement",
      message: enabled
        ? "Se actualizó y activó un anuncio del sistema."
        : "Se actualizó un anuncio, pero quedó desactivado.",
    });

    return NextResponse.json({
      ok: true,
      ...saved,
    });
  } catch (error) {
    console.error("POST /api/admin/announcement error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el anuncio." },
      { status: 500 }
    );
  }
}