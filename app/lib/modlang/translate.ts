import { chunkEntries, parseJsonResponse } from "./helpers";
import { TRANSLATION_BATCH_SIZE } from "./constants";
import type { QueueItem } from "./types";

export async function translateEntriesInBatches(
  itemId: string,
  entries: Record<string, string>,
  updateQueueItem: (id: string, patch: Partial<QueueItem>) => void,
  sourceLang = "en",
  targetLang = "es"
) {
  const batches = chunkEntries(entries, TRANSLATION_BATCH_SIZE);
  const merged: Record<string, string> = {};
  let done = 0;
  const total = Object.keys(entries).length;

  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];

    updateQueueItem(itemId, {
      status: "traduciendo",
      message: `Traduciendo lote ${index + 1}/${batches.length} (${sourceLang} → ${targetLang})...`,
      entriesDone: done,
      entriesTotal: total,
      progress: Math.min(85, 20 + Math.round((done / Math.max(total, 1)) * 60)),
    });

    const response = await fetch("/api/translate-google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entries: batch,
        sourceLang,
        targetLang,
      }),
    });

    const data = await parseJsonResponse<{
      translated?: Record<string, string>;
      error?: string;
    }>(response);

    if (!response.ok) {
      throw new Error(data.error || `Falló lote ${index + 1}`);
    }

    if (!data.translated) {
      throw new Error(`Respuesta inválida en lote ${index + 1}`);
    }

    for (const [k, v] of Object.entries(data.translated)) {
      merged[k] = String(v);
    }

    done += Object.keys(batch).length;

    updateQueueItem(itemId, {
      entriesDone: done,
      progress: Math.min(88, 20 + Math.round((done / Math.max(total, 1)) * 68)),
      message: `Traducidos ${done}/${total}`,
    });
  }

  return merged;
}