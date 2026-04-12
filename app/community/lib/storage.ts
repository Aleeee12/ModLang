import fs from "fs";
import path from "path";
import crypto from "crypto";

const COMMUNITY_DIR = path.join(process.cwd(), "storage", "community");

export function ensureCommunityDir() {
  if (!fs.existsSync(COMMUNITY_DIR)) {
    fs.mkdirSync(COMMUNITY_DIR, { recursive: true });
  }
}

function sanitizeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function saveCommunityZip(params: {
  modName: string;
  modVersion: string;
  targetLang: string;
  buffer: Buffer;
}) {
  ensureCommunityDir();

  const safeMod = sanitizeFilePart(params.modName || "mod");
  const safeVersion = sanitizeFilePart(params.modVersion || "unknown");
  const safeLang = sanitizeFilePart(params.targetLang || "lang");
  const random = crypto.randomBytes(6).toString("hex");

  const fileName = `${safeMod}-${safeVersion}-${safeLang}-${random}.zip`;
  const absolutePath = path.join(COMMUNITY_DIR, fileName);

  fs.writeFileSync(absolutePath, params.buffer);

  return {
    fileName,
    absolutePath,
    fileSize: params.buffer.length,
  };
}