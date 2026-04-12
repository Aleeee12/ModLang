import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getCommunityById } from "@/app/community/lib/queries";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      return new Response("ID inválido", { status: 400 });
    }

    const item = await getCommunityById(numericId);

    if (!item) {
      return new Response("No encontrado", { status: 404 });
    }

    if (!fs.existsSync(item.file_path)) {
      return new Response("Archivo no existe", { status: 404 });
    }

    const buffer = fs.readFileSync(item.file_path);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${path.basename(
          item.file_name
        )}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("Community download error:", err);
    return new Response("Error", { status: 500 });
  }
}