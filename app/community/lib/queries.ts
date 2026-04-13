import { db } from "@/app/lib/db/db";

export type CommunityRow = {
  id: number;
  mod_name: string;
  mod_version: string;
  target_lang: string;
  file_name: string;
  file_path: string;
  file_size: number;
  translated_mods_json: string | null;
  downloads: number;
  created_at: string;
};

export type CommunityListRow = {
  id: number;
  mod_name: string;
  mod_version: string;
  target_lang: string;
  file_name: string;
  file_size: number;
  downloads: number;
  created_at: string;
};

export async function insertCommunityTranslation(data: {
  modName: string;
  modVersion: string;
  targetLang: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  translatedModsJson: string | null;
}) {
  const [result] = await db.execute(
    `
    INSERT INTO community_translations (
      mod_name,
      mod_version,
      target_lang,
      file_name,
      file_path,
      file_size,
      translated_mods_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.modName,
      data.modVersion,
      data.targetLang,
      data.fileName,
      data.filePath,
      data.fileSize,
      data.translatedModsJson,
    ]
  );

  return (result as { insertId: number }).insertId;
}

export async function getCommunityList(): Promise<CommunityListRow[]> {
  const [rows] = await db.query(
    `
    SELECT
      id,
      mod_name,
      mod_version,
      target_lang,
      file_name,
      file_size,
      downloads,
      created_at
    FROM community_translations
    ORDER BY created_at DESC
    `
  );

  return rows as CommunityListRow[];
}

export async function getCommunityById(
  id: number
): Promise<CommunityRow | null> {
  const [rows] = await db.query(
    `
    SELECT
      id,
      mod_name,
      mod_version,
      target_lang,
      file_name,
      file_path,
      file_size,
      translated_mods_json,
      downloads,
      created_at
    FROM community_translations
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  const typedRows = rows as CommunityRow[];
  return typedRows[0] ?? null;
}

export async function findExistingCommunityTranslation(data: {
  modName: string;
  modVersion: string;
  targetLang: string;
}): Promise<CommunityRow | null> {
  const [rows] = await db.query(
    `
    SELECT
      id,
      mod_name,
      mod_version,
      target_lang,
      file_name,
      file_path,
      file_size,
      translated_mods_json,
      downloads,
      created_at
    FROM community_translations
    WHERE mod_name = ?
      AND mod_version = ?
      AND target_lang = ?
    LIMIT 1
    `,
    [data.modName, data.modVersion, data.targetLang]
  );

  const typedRows = rows as CommunityRow[];
  return typedRows[0] ?? null;
}

export async function deleteCommunityTranslationById(id: number) {
  await db.execute(
    `
    DELETE FROM community_translations
    WHERE id = ?
    `,
    [id]
  );
}

export async function incrementCommunityDownloads(id: number) {
  await db.execute(
    `
    UPDATE community_translations
    SET downloads = downloads + 1
    WHERE id = ?
    `,
    [id]
  );
}
