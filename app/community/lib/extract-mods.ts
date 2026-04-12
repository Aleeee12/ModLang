import JSZip from "jszip";

export async function extractTranslatedModsFromResourcePack(
  buffer: Buffer
): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const modIds = new Set<string>();

  for (const fileName of Object.keys(zip.files)) {
    const normalized = fileName.replace(/\\/g, "/");

    if (!normalized.startsWith("assets/")) continue;

    const parts = normalized.split("/");

    if (parts.length >= 2 && parts[1]) {
      modIds.add(parts[1]);
    }
  }

  return Array.from(modIds).sort((a, b) => a.localeCompare(b));
}