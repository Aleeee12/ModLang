"use client";

import { useEffect, useState } from "react";

type UiLang = "es" | "en";

export default function BetaBanner() {
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
    <div className="w-full text-center text-sm bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-300 py-2">
      {uiLang === "en" ? (
        <>
          ⚠️ <strong>BETA:</strong> This tool may be imperfect. Automatic
          translations may contain errors.
          <strong> A human translation will always be better.</strong>
        </>
      ) : (
        <>
          ⚠️ <strong>BETA:</strong> Esta herramienta puede ser imperfecta. Las
          traducciones automáticas pueden contener errores.
          <strong> Una traducción humana siempre será mejor.</strong>
        </>
      )}
    </div>
  );
}