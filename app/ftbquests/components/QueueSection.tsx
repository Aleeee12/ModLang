"use client";

import type { QueueItem } from "../hooks/useFtbQueue";

type UiLang = "es" | "en";

type QueueSectionProps = {
  queue: QueueItem[];
  onAnalyze: () => void;
  onTranslate: () => void;
  onRemove: (id: string) => void;
  uiLang: UiLang;
  progress: number;
  currentItemName: string;
  globalStatus: string;
  eta?: string;
  targetLang: string;
};

function statusLabel(status: QueueItem["status"], uiLang: UiLang) {
  if (uiLang === "en") {
    switch (status) {
      case "idle":
        return "Waiting";
      case "analyzing":
        return "Analyzing";
      case "ready":
        return "Ready";
      case "translating":
        return "Translating";
      case "done":
        return "Done";
      case "error":
        return "Error";
      default:
        return status;
    }
  }

  switch (status) {
    case "idle":
      return "En espera";
    case "analyzing":
      return "Analizando";
    case "ready":
      return "Listo";
    case "translating":
      return "Traduciendo";
    case "done":
      return "Completado";
    case "error":
      return "Error";
    default:
      return status;
  }
}

function langLabel(lang?: string, uiLang: UiLang = "es") {
  if (!lang) return uiLang === "en" ? "Unknown" : "Desconocido";

  const map: Record<string, string> = {
    es: "Español",
    en: "English",
    pt: "Português",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    ru: "Русский",
    ja: "日本語",
    zh: "中文",
    unknown: uiLang === "en" ? "Unknown" : "Desconocido",
  };

  return map[lang] || lang;
}

function modeLabel(mode?: QueueItem["mode"], uiLang: UiLang = "es") {
  switch (mode) {
    case "lang":
      return "Lang";
    case "chapters":
      return "Chapters";
    default:
      return uiLang === "en" ? "Not detected" : "Sin detectar";
  }
}

function isBusyStatus(status: string) {
  return (
    status.toLowerCase().includes("analiz") ||
    status.toLowerCase().includes("traduc") ||
    status.toLowerCase().includes("pack") ||
    status.toLowerCase().includes("prepar")
  );
}

function parseEtaToSeconds(eta?: string) {
  if (!eta) return 0;

  const match = eta.match(/(\d+)m\s+(\d+)s/i);
  if (!match) return 0;

  const minutes = Number(match[1] || 0);
  const seconds = Number(match[2] || 0);

  return minutes * 60 + seconds;
}

export default function QueueSection({
  queue,
  onAnalyze,
  onTranslate,
  onRemove,
  uiLang,
  progress,
  currentItemName,
  globalStatus,
  eta,
  targetLang,
}: QueueSectionProps) {
  if (queue.length === 0) return null;

  const t =
    uiLang === "en"
      ? {
          analyze: "Analyze",
          translate: "Translate",
          mode: "Mode",
          language: "Language",
          entries: "Entries",
          remove: "Remove",
          eta: "ETA",
          status: "Status",
          processing: "Processing",
          globalProgress: "Global progress",
          longEtaWarning:
            "(Time may be higher if you choose a language other than Spanish or English.)",
        }
      : {
          analyze: "Analizar",
          translate: "Traducir",
          mode: "Modo",
          language: "Idioma",
          entries: "Entradas",
          remove: "Eliminar",
          eta: "Tiempo estimado",
          status: "Estado",
          processing: "Procesando",
          globalProgress: "Progreso global",
          longEtaWarning:
            "(El tiempo puede ser elevado si eliges otro idioma que no sea Español o Inglés.)",
        };

  const busy = isBusyStatus(globalStatus);
  const showIndeterminate = busy && progress === 0;

  const etaSeconds = parseEtaToSeconds(eta);
  const showLongEtaWarning = etaSeconds >= 120;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="space-y-3">
          <div className="text-sm text-zinc-300">
            <span className="font-semibold text-white">{t.status}:</span>{" "}
            {globalStatus}
          </div>

          {currentItemName && (
            <div className="text-sm text-zinc-300">
              <span className="font-semibold text-white">{t.processing}:</span>{" "}
              <span className="break-all">{currentItemName}</span>
            </div>
          )}

          {eta && progress > 0 && progress < 100 && (
            <div className="text-xs text-zinc-400">
              {t.eta}: {eta}{" "}
              {showLongEtaWarning && (
                <span className="text-yellow-400">{t.longEtaWarning}</span>
              )}
            </div>
          )}

          <div className="pt-1">
            <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
              <span>{t.globalProgress}</span>
              <span>{progress}%</span>
            </div>

            <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800">
              {showIndeterminate ? (
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-y-0 w-1/3 animate-[modlang-loading_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                </div>
              ) : (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onAnalyze}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          {t.analyze}
        </button>

        <button
          onClick={onTranslate}
          className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02]"
        >
          {t.translate}
        </button>
      </div>

      <div className="space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{item.name}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-zinc-300">
                    {statusLabel(item.status, uiLang)}
                  </span>

                  <span className="rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-zinc-300">
                    {t.mode}: {modeLabel(item.mode, uiLang)}
                  </span>

                  <span className="rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-zinc-300">
                    {t.language}: {langLabel(item.detectedLang, uiLang)}
                  </span>

                  <span className="rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-zinc-300">
                    {t.entries}: {item.entriesFound ?? 0}
                  </span>
                </div>

                {item.error && (
                  <p className="mt-2 break-words text-sm text-red-400">
                    {item.error}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-200"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes modlang-loading {
          0% {
            left: -35%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}