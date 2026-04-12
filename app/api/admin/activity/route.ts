import { NextResponse } from "next/server";
import { getActivityLogs } from "@/app/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getActivityLogs();

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    console.error("GET /api/admin/activity error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo cargar la actividad." },
      { status: 500 }
    );
  }
}