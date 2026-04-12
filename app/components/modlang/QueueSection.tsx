import { useMemo } from "react";
import type { QueueItem } from "@/app/lib/modlang/types";

type UiLang = "es" | "en";

type QueueSectionProps = {
  queueItems: QueueItem[];
  completedCount: number;
  errorCount: number;
  skippedCount: number;
  pendingCount: number;
  isProcessingQueue: boolean;
  onRemoveQueueItem: (id: string) => void;
  uiLang: UiLang;
};

function getStatusClasses(status: QueueItem["status"]) {
  switch (status) {
    case "ok":
      return "bg-green-500/15 text-green-400 border border-green-500/30";
    case "error":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "omitido":
      return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
    case "traduciendo":
    case "analizando":
    case "empaquetando":
      return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    default:
      return "bg-zinc-700/40 text-zinc-300 border border-zinc-600/40";
  }
}

function getStatusLabel(status: QueueItem["status"], uiLang: UiLang) {
  if (uiLang === "en") {
    switch (status) {
      case "pendiente":
        return "pending";
      case "analizando":
        return "analyzing";
      case "traduciendo":
        return "translating";
      case "empaquetando":
        return "packaging";
      case "ok":
        return "done";
      case "error":
        return "error";
      case "omitido":
        return "skipped";
      default:
        return status;
    }
  }

  switch (status) {
    case "pendiente":
      return "pendiente";
    case "analizando":
      return "analizando";
    case "traduciendo":
      return "traduciendo";
    case "empaquetando":
      return "empaquetando";
    case "ok":
      return "listo";
    case "error":
      return "error";
    case "omitido":
      return "omitido";
    default:
      return status;
  }
}

function getOutputLabel(
  outputFormat: QueueItem["outputFormat"],
  uiLang: UiLang
) {
  if (outputFormat === "resourcepack") {
    return uiLang === "en" ? "resource pack" : "resource pack";
  }

  return ".jar";
}

export default function QueueSection({
  queueItems,
  completedCount,
  errorCount,
  skippedCount,
  pendingCount,
  isProcessingQueue,
  onRemoveQueueItem,
  uiLang,
}: QueueSectionProps) {
  const t = useMemo(() => {
    if (uiLang === "en") {
      return {
        title: "Queue",
        progress: "Progress",
        texts: "texts",
        generatedFile: "Generated file",
        remove: "Remove",
        total: "Total",
        pending: "Pending",
        translated: "Translated",
        skippedError: "Skipped / Error",
        output: "Output",
      };
    }

    return {
      title: "Cola de archivos",
      progress: "Progreso",
      texts: "textos",
      generatedFile: "Archivo generado",
      remove: "Quitar",
      total: "Total",
      pending: "Pendientes",
      translated: "Traducidos",
      skippedError: "Omitidos / Error",
      output: "Salida",
    };
  }, [uiLang]);

  if (queueItems.length === 0) return null;

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 shadow-xl rounded-3xl p-6">
      <h2 className="text-2xl font-semibold mb-4">{t.title}</h2>

      <div className="grid gap-4">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-all">{item.fileName}</p>
<p className="text-sm text-zinc-400 mt-1 break-words">
  {uiLang === "en"
    ? item.message
        .replace("Este mod no tiene", "This mod does not have")
        .replace(
          "así que no se puede usar como base",
          "so it cannot be used as a base"
        )
        .replace("No existe", "Does not exist")
        .replace("Se traducirá desde", "Will be translated from")
        .replace("ya tiene la misma cantidad o más líneas", "already has same or more lines")
    : item.message}
</p>

                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                    {t.output}: {getOutputLabel(item.outputFormat, uiLang)}
                  </span>
                </div>

                {(item.status === "traduciendo" ||
                  item.status === "analizando" ||
                  item.status === "empaquetando" ||
                  item.progress > 0) && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>{t.progress}</span>
                      <span>{item.progress}%</span>
                    </div>

                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {item.entriesTotal > 0 && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {item.entriesDone}/{item.entriesTotal} {t.texts}
                      </p>
                    )}
                  </div>
                )}

                {item.outputName && (
                  <p className="text-xs text-green-400 mt-2 break-all">
                    {t.generatedFile}: {item.outputName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${getStatusClasses(
                    item.status
                  )}`}
                >
                  {getStatusLabel(item.status, uiLang)}
                </span>

                <button
                  onClick={() => onRemoveQueueItem(item.id)}
                  disabled={isProcessingQueue}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm disabled:opacity-50"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">{t.total}</p>
          <p className="text-2xl font-bold">{queueItems.length}</p>
        </div>

        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">{t.pending}</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>

        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">{t.translated}</p>
          <p className="text-2xl font-bold text-green-400">{completedCount}</p>
        </div>

        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">{t.skippedError}</p>
          <p className="text-2xl font-bold">
            <span className="text-yellow-400">{skippedCount}</span>
            <span className="text-zinc-500"> / </span>
            <span className="text-red-400">{errorCount}</span>
          </p>
        </div>
      </div>
    </div>
  );
}