"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import UploadCard from "./components/UploadCard";
import QueueSection from "./components/QueueSection";
import ResultsSection from "./components/ResultsSection";
import { useFtbQueue } from "./hooks/useFtbQueue";

type UiLang = "es" | "en";

export default function FtbQuestsPage() {
  const {
    queue,
    targetLang,
    setTargetLang,
    addFiles,
    removeItem,
    clearQueue,
    startAnalysis,
    startTranslation,
    progress,
    currentItemName,
    globalStatus,
    isWorking,
    eta,
  } = useFtbQueue();

  const [uiLang, setUiLang] = useState<UiLang>("es");

  useEffect(() => {
    const saved = window.localStorage.getItem("modlang_ui_lang");
    if (saved === "es" || saved === "en") {
      setUiLang(saved);
    }
  }, []);

  function handleChangeUiLang(lang: UiLang) {
    setUiLang(lang);
    window.localStorage.setItem("modlang_ui_lang", lang);
    window.dispatchEvent(new Event("modlang-ui-lang-changed"));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="
            absolute
            -right-70
            top-15
            z-20
            w-60
            rounded-2xl
            border border-zinc-700
            bg-zinc-900/90
            p-4
            backdrop-blur
            shadow-xl
            transition-all
            hover:border-zinc-500
            hover:bg-zinc-900
            hover:scale-[1.02]
          "
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-white">
                {uiLang === "es" ? "Volver al inicio" : "Back to home"}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {uiLang === "es" ? "Página principal" : "Main page"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
              ←
            </div>
          </div>
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl backdrop-blur">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {uiLang === "es"
                  ? "Traductor FTB Quests"
                  : "FTB Quests Translator"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-zinc-400 sm:text-base">
                {uiLang === "es" ? (
                  <>
                    Acepta{" "}
                    <span className="font-semibold text-white">.snbt</span>,{" "}
                    <span className="font-semibold text-white">.zip</span> o la
                    carpeta completa "Quests". Si encuentra{" "}
                    <span className="font-semibold text-white">lang</span>, la
                    prioriza. Si no existe, traduce{" "}
                    <span className="font-semibold text-white">chapters</span>.
                  </>
                ) : (
                  <>
                    Accepts{" "}
                    <span className="font-semibold text-white">.snbt</span>,{" "}
                    <span className="font-semibold text-white">.zip</span> or the
                    full folder. If it finds{" "}
                    <span className="font-semibold text-white">lang</span>, it
                    gives it priority. Otherwise, it translates{" "}
                    <span className="font-semibold text-white">chapters</span>.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
              <span className="text-sm text-zinc-400">
                {uiLang === "es" ? "Idioma" : "Language"}
              </span>

              <select
                value={uiLang}
                onChange={(e) => handleChangeUiLang(e.target.value as UiLang)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <UploadCard
            onFiles={addFiles}
            targetLang={targetLang}
            onTargetLangChange={setTargetLang}
            queueItemsLength={queue.length}
            uiLang={uiLang}
          />

          {/*) */}
<QueueSection
  queue={queue}
  onAnalyze={startAnalysis}
  onTranslate={startTranslation}
  onRemove={removeItem}
  uiLang={uiLang}
  progress={progress}
  currentItemName={currentItemName}
  globalStatus={globalStatus}
  eta={eta}
  targetLang={targetLang}
/>

          <ResultsSection queue={queue} uiLang={uiLang} />
        </div>
      </div>
    </main>
  );
}