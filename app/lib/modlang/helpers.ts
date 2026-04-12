export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("La API respondió vacía.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 220).replace(/\s+/g, " ");
    throw new Error(
      `La API devolvió una respuesta no válida. Probablemente retornó HTML en lugar de JSON: ${preview}`
    );
  }
}

export function chunkEntries(
  entries: Record<string, string>,
  size: number
): Array<Record<string, string>> {
  const all = Object.entries(entries);
  const chunks: Array<Record<string, string>> = [];

  for (let i = 0; i < all.length; i += size) {
    chunks.push(Object.fromEntries(all.slice(i, i + size)));
  }

  return chunks;
}

export function countLines(text: string) {
  if (!text) return 0;
  return text.split(/\r?\n/).filter((line) => line.trim() !== "").length;
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}