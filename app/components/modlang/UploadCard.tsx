import Link from "next/link";
import { useMemo, useState } from "react";
import type React from "react";
import type { OutputFormat } from "@/app/lib/modlang/types";

type UiLang = "es" | "en";

type UploadCardProps = {
  dragActive: boolean;
  queueItemsLength: number;
  isProcessingQueue: boolean;
  status: string;
  currentFileName: string;
  lastDownloadName: string;
  error: string;
  etaText: string;
  translationProgress: number;
  uniqueVisitors?: number;
  uiLang: UiLang;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessQueue: (
    sourceLang?: string,
    targetLang?: string,
    outputFormat?: OutputFormat
  ) => void;
  onResetAll: () => void;
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "en-us", label: "English (US)" },
  { value: "en-gb", label: "English (UK)" },
  { value: "es", label: "Español" },
  { value: "es-es", label: "Español (España)" },
  { value: "es-mx", label: "Español (México)" },
  { value: "es-ar", label: "Español (Argentina)" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "pt-br", label: "Português (Brasil)" },
  { value: "pt-pt", label: "Português (Portugal)" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "zh-cn", label: "中文 (简体)" },
  { value: "zh-tw", label: "中文 (繁體)" },
];

export default function UploadCard({
  dragActive,
  queueItemsLength,
  isProcessingQueue,
  status,
  currentFileName,
  lastDownloadName,
  error,
  etaText,
  translationProgress,
  uniqueVisitors = 0,
  uiLang,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onProcessQueue,
  onResetAll,
}: UploadCardProps) {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jar");

  const t = useMemo(() => {
    if (uiLang === "en") {
      return {
        title: "Select or drag one or more .jar files",
        uniqueUsers: "Unique users",
        dropTitle: "Drop your mods here or click to select them",
        dropSubtitle: "They will be processed automatically in queue order",
        queuedFiles: "Queued files",
        from: "From",
        to: "To",
        output: "Output",
        outputJar: "Translated .jar",
        outputResourcePack: "Single resource pack",
        outputHelp:
          "Choose once before starting. If you select resource pack, all queued jars will be merged into one working resource pack.",
        translate: "Translate",
        processing: "Processing...",
        reset: "Reset",
        sameLanguage: "Source and target language cannot be the same.",
        status: "Status",
        currentFile: "Current file",
        generatedDownload: "Generated download",
        error: "Error",
        processingQueue: "Processing queue... this may take a few seconds",
        globalProgress: "Global progress",
      };
    }

    return {
      title: "Selecciona o arrastra uno o varios archivos .jar",
      uniqueUsers: "Usuarios únicos",
      dropTitle: "Suelta aquí tus mods o haz click para seleccionarlos",
      dropSubtitle: "Se procesarán en cola automáticamente en el orden agregado",
      queuedFiles: "Archivos en cola",
      from: "De",
      to: "A",
      output: "Salida",
      outputJar: ".jar traducido",
      outputResourcePack: "Un solo resource pack",
      outputHelp:
        "Elige una sola vez antes de empezar. Si seleccionas resource pack, todos los .jar de la cola se unirán en un único resource pack funcional.",
      translate: "Traducir",
      processing: "Procesando...",
      reset: "Resetear",
      sameLanguage: "El idioma de origen y destino no puede ser el mismo.",
      status: "Estado",
      currentFile: "Archivo actual",
      generatedDownload: "Descarga generada",
      error: "Error",
      processingQueue: "Procesando cola... esto puede tardar unos segundos",
      globalProgress: "Progreso global",
      ftbTitle: "FTB Quests",
      ftbSubtitle: "Traduce archivos de misiones .snbt",
      ftbButton: "Abrir traductor",
    };
  }, [uiLang]);

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 shadow-xl rounded-3xl p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="block text-lg font-medium">{t.title}</label>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
          👥 {t.uniqueUsers}:{" "}
          <span className="font-semibold text-white">
            {Number.isFinite(Number(uniqueVisitors))
              ? Number(uniqueVisitors)
              : 0}
          </span>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative rounded-3xl border-2 border-dashed p-8 transition-all cursor-pointer select-none overflow-hidden ${
          dragActive
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-zinc-700 bg-zinc-950/70 hover:border-zinc-500 hover:bg-zinc-900/70"
        }`}
      >
        <input
          ref={inputRef}
          id="jar-input"
          type="file"
          accept=".jar"
          multiple
          onChange={onInputChange}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />

        <div className="pointer-events-none flex flex-col items-center justify-center text-center py-10">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl font-semibold">{t.dropTitle}</p>
          <p className="text-zinc-400 mt-2 text-sm">{t.dropSubtitle}</p>

          {queueItemsLength > 0 && (
            <p className="mt-4 text-sm text-green-400 break-all">
              {t.queuedFiles}: {queueItemsLength}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
            <span className="text-sm text-zinc-400">{t.from}</span>

            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isProcessingQueue}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={`source-${lang.value}`} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <span className="text-zinc-500">→</span>

            <span className="text-sm text-zinc-400">{t.to}</span>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isProcessingQueue}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={`target-${lang.value}`} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
            <span className="text-sm text-zinc-400">{t.output}</span>

            <select
              value={outputFormat}
              onChange={(e) =>
                setOutputFormat(e.target.value as OutputFormat)
              }
              disabled={isProcessingQueue}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
            >
              <option value="jar">{t.outputJar}</option>
              <option value="resourcepack">{t.outputResourcePack}</option>
            </select>
          </div>

          {queueItemsLength > 0 && (
            <button
              onClick={() =>
                onProcessQueue(sourceLang, targetLang, outputFormat)
              }
              disabled={isProcessingQueue || sourceLang === targetLang}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 hover:scale-105 transition-all font-semibold disabled:opacity-50"
            >
              {isProcessingQueue ? t.processing : t.translate}
            </button>
          )}

          {queueItemsLength > 0 && (
            <button
              onClick={onResetAll}
              disabled={isProcessingQueue}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 transition-all font-semibold disabled:opacity-50"
            >
              {t.reset}
            </button>
          )}
        </div>

        <p className="text-sm text-zinc-400">{t.outputHelp}</p>
      </div>

      {sourceLang === targetLang && (
        <p className="mt-3 text-sm text-yellow-400">{t.sameLanguage}</p>
      )}

      <div className="mt-5 space-y-2">
        <p>
          <strong>{t.status}:</strong> {status}
        </p>

        {currentFileName && (
          <p>
            <strong>{t.currentFile}:</strong> {currentFileName}
          </p>
        )}

        {lastDownloadName && (
          <p>
            <strong>{t.generatedDownload}:</strong> {lastDownloadName}
          </p>
        )}

        {error && (
          <p className="text-red-400 break-words">
            <strong>{t.error}:</strong> {error}
          </p>
        )}

        {isProcessingQueue && (
          <>
            <p className="text-green-400 animate-pulse">{t.processingQueue}</p>
            {etaText && <p className="text-zinc-400 text-sm">{etaText}</p>}
          </>
        )}

        {!isProcessingQueue && etaText && (
          <p className="text-zinc-400 text-sm">{etaText}</p>
        )}
      </div>

      {isProcessingQueue && (
        <div className="mt-5">
          <div className="flex justify-between mb-2 text-sm text-zinc-300">
            <span>{t.globalProgress}</span>
            <span>{translationProgress}%</span>
          </div>

          <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${translationProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}