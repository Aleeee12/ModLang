import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import {
  deleteCommunityTranslationById,
  findExistingCommunityTranslation,
  insertCommunityTranslation,
} from "@/app/community/lib/queries";
import { saveCommunityZip } from "@/app/community/lib/storage";
import { normalizeModName } from "@/app/community/lib/normalize";
import { extractTranslatedModsFromResourcePack } from "@/app/community/lib/extract-mods";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const rawModName = String(formData.get("modName") || "").trim();
    const modVersion = String(formData.get("modVersion") || "").trim();
    const targetLang = String(formData.get("targetLang") || "").trim();
    const outputType = String(formData.get("outputType") || "").trim();
    const file = formData.get("file");

    if (outputType !== "resourcepack") {
      return NextResponse.json(
        { ok: false, error: "Solo resource pack permitido." },
        { status: 400 }
      );
    }

    if (!rawModName || !modVersion || !targetLang) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Archivo inválido." },
        { status: 400 }
      );
    }

    const modName = normalizeModName(rawModName);
    const buffer = Buffer.from(await file.arrayBuffer());

    const translatedMods = await extractTranslatedModsFromResourcePack(buffer);
    const translatedModsJson = JSON.stringify(translatedMods);

    const existing = await findExistingCommunityTranslation({
      modName,
      modVersion,
      targetLang,
    });

    if (existing) {
      try {
        if (existing.file_path && fs.existsSync(existing.file_path)) {
          fs.unlinkSync(existing.file_path);
        }
      } catch (fileError) {
        console.error("Error deleting old community file:", fileError);
      }

      await deleteCommunityTranslationById(existing.id);
    }

    const saved = saveCommunityZip({
      modName,
      modVersion,
      targetLang,
      buffer,
    });

    const id = await insertCommunityTranslation({
      modName,
      modVersion,
      targetLang,
      fileName: saved.fileName,
      filePath: saved.absolutePath,
      fileSize: saved.fileSize,
      translatedModsJson,
    });

    return NextResponse.json({
      ok: true,
      id,
      replaced: !!existing,
    });
  } catch (err) {
    console.error("Community upload error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al subir." },
      { status: 500 }
    );
  }
}