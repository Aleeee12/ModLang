import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getCommunityById, deleteCommunityTranslationById } from "@/app/community/lib/queries";

export const runtime = "nodejs";

async function assertAdminSession() {
  return true;
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await assertAdminSession();

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json(
        { ok: false, error: "ID inválido." },
        { status: 400 }
      );
    }

    const existing = await getCommunityById(numericId);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Registro no encontrado." },
        { status: 404 }
      );
    }

    try {
      if (existing.file_path && fs.existsSync(existing.file_path)) {
        fs.unlinkSync(existing.file_path);
      }
    } catch (fileError) {
      console.error("Error deleting community file:", fileError);
    }

    await deleteCommunityTranslationById(numericId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Admin community delete error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo eliminar la traducción.",
      },
      { status: 500 }
    );
  }
}