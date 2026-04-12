"use client";

import { useEffect, useState } from "react";

type UiLang = "es" | "en";

export default function Footer() {
  const [uiLang, setUiLang] = useState<UiLang>("es");

  useEffect(() => {
    const updateLang = () => {
      const saved = window.localStorage.getItem("modlang_ui_lang");
      if (saved === "en" || saved === "es") {
        setUiLang(saved);
      } else {
        setUiLang("es");
      }
    };

    updateLang();

    const handleStorage = () => updateLang();
    const handleUiLangChanged = () => updateLang();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("modlang-ui-lang-changed", handleUiLangChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("modlang-ui-lang-changed", handleUiLangChanged);
    };
  }, []);

  return (
    <footer className="mt-10 border-t border-zinc-800 pt-6">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 text-sm text-zinc-500">
        <span>© alejoo930_</span>

        <a
          href="https://discord.gg/TU_LINK"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-2 text-zinc-300 hover:bg-zinc-900 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 127.14 96.36"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.09 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21h.02a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.17 68.42 68.42 0 0 1-10.84-5.18c.91-.67 1.8-1.36 2.66-2.08a75.57 75.57 0 0 0 64.32 0c.87.72 1.76 1.42 2.67 2.08a68.68 68.68 0 0 1-10.86 5.19 77 77 0 0 0 6.89 11.16A105.25 105.25 0 0 0 126.6 80.22h.02c2.64-27.37-4.5-51.1-18.92-72.15ZM42.45 65.69C36.18 65.69 31 59.92 31 52.82s5.05-12.87 11.44-12.87c6.44 0 11.56 5.82 11.44 12.87 0 7.1-5.05 12.87-11.43 12.87Zm42.24 0c-6.27 0-11.44-5.77-11.44-12.87S78.3 39.95 84.69 39.95c6.44 0 11.56 5.82 11.44 12.87 0 7.1-5.05 12.87-11.44 12.87Z" />
          </svg>

          <span>
            {uiLang === "en" ? "Support server" : "Servidor de ayuda"}
          </span>
        </a>
      </div>
    </footer>
  );
}