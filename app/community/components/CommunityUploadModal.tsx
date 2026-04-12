"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  uiLang: "es" | "en";
  zipBlob: Blob | null;
  defaultModName: string;
  defaultModVersion: string;
  defaultTargetLang: string;
  outputType: "jar" | "resourcepack";
  onClose: () => void;
  onUploaded: () => void;
};

export default function CommunityUploadModal({
  open,
  uiLang,
  zipBlob,
  defaultModName,
  defaultModVersion,
  defaultTargetLang,
  outputType,
  onClose,
  onUploaded,
}: Props) {
  const [modName, setModName] = useState(defaultModName);
  const [modVersion, setModVersion] = useState(defaultModVersion);
  const [targetLang, setTargetLang] = useState(defaultTargetLang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    setModName(defaultModName);
    setModVersion(defaultModVersion);
    setTargetLang(defaultTargetLang);
    setError("");
    setOk("");
  }, [defaultModName, defaultModVersion, defaultTargetLang, open]);

  if (!open) return null;

  const text =
    uiLang === "en"
      ? {
          title: "Upload to community",
          subtitle: "Do you want to upload this translation to the community?",
          modName: "Mod name",
          modVersion: "Mod version",
          targetLang: "Target language",
          cancel: "Cancel",
          upload: "Upload",
          invalidType: "Only combined resource packs can be uploaded.",
          missingZip: "No generated ZIP was found.",
          success: "Translation uploaded successfully.",
        }
      : {
          title: "Subir a la comunidad",
          subtitle: "¿Quieres subir esta traducción a la comunidad?",
          modName: "Nombre del mod",
          modVersion: "Versión del mod",
          targetLang: "Idioma destino",
          cancel: "Cancelar",
          upload: "Subir",
          invalidType: "Solo se pueden subir resource packs combinados.",
          missingZip: "No se encontró el ZIP generado.",
          success: "La traducción se subió correctamente.",
        };

  async function handleUpload() {
    setError("");
    setOk("");

    if (outputType !== "resourcepack") {
      setError(text.invalidType);
      return;
    }

    if (!zipBlob) {
      setError(text.missingZip);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("modName", modName.trim());
      formData.append("modVersion", modVersion.trim() || "unknown");
      formData.append("targetLang", targetLang.trim());
      formData.append("outputType", outputType);
      formData.append("file", zipBlob, `${modName || "resource-pack"}.zip`);

      const res = await fetch("/api/community/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Upload failed.");
        return;
      }

      setOk(text.success);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">{text.title}</h2>
        <p className="mt-2 text-sm text-gray-300">{text.subtitle}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              {text.modName}
            </label>
            <input
              value={modName}
              onChange={(e) => setModName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              {text.modVersion}
            </label>
            <input
              value={modVersion}
              onChange={(e) => setModVersion(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              {text.targetLang}
            </label>
            <input
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {ok ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
              {ok}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white"
            >
              {text.cancel}
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading ? "..." : text.upload}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}