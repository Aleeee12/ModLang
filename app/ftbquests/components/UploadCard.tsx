"use client";

import { useRef, useState } from "react";

type UploadCardProps = {
  onFiles: (files: File[]) => void;
  targetLang: string;
  onTargetLangChange: (value: string) => void;
  queueItemsLength: number;
  uiLang: "es" | "en";
};

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

export default function UploadCard({
  onFiles,
  targetLang,
  onTargetLangChange,
  queueItemsLength,
  uiLang,
}: UploadCardProps) {
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const t =
    uiLang === "es"
      ? {
          title:
            "Sube un archivo .snbt, un .zip o la carpeta completa de FTB Quests",
          subtitle:
            "Si encuentra lang, lo prioriza. Si no existe, traduce chapters.",
          queue: "Elementos en cola",
          uploadFiles: "Subir archivos / zip",
          uploadFolder: "Subir carpeta FTB Quests",
          translateTo: "Traducir a",
        }
      : {
          title:
            "Upload a .snbt file, a .zip or the full FTB Quests folder",
          subtitle:
            "If it finds lang, it prioritizes it. Otherwise, it translates chapters.",
          queue: "Items in queue",
          uploadFiles: "Upload files / zip",
          uploadFolder: "Upload FTB Quests folder",
          translateTo: "Translate to",
        };

  function handleIncomingFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length > 0) {
      onFiles(files);
    }
  }

  function onFilesInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleIncomingFiles(e.target.files);
    e.target.value = "";
  }

  function onFolderInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleIncomingFiles(e.target.files);
    e.target.value = "";
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleIncomingFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 transition-all select-none ${
          dragActive
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-zinc-700 bg-zinc-950/70 hover:border-zinc-500 hover:bg-zinc-900/70"
        }`}
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 text-6xl">📘</div>

          <p className="text-xl font-semibold sm:text-2xl">
            {t.title}
          </p>

          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            {t.subtitle}
          </p>

          {queueItemsLength > 0 && (
            <p className="mt-4 text-sm text-green-400">
              {t.queue}: {queueItemsLength}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => filesInputRef.current?.click()}
              className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
            >
              {t.uploadFiles}
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="rounded-2xl bg-zinc-800 px-5 py-3 font-semibold transition hover:bg-zinc-700"
            >
              {t.uploadFolder}
            </button>
          </div>

          <input
            ref={filesInputRef}
            type="file"
            accept=".snbt,.zip"
            multiple
            onChange={onFilesInputChange}
            className="hidden"
          />

          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={onFolderInputChange}
            className="hidden"
            {...({ webkitdirectory: "true", directory: "true" } as Record<
              string,
              string
            >)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
          <span className="text-sm text-zinc-400">
            {t.translateTo}
          </span>

          <select
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}