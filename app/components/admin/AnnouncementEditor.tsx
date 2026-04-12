"use client";

import { useEffect, useState } from "react";

type AnnouncementData = {
  message: string;
  enabled: boolean;
  updatedAt: string | null;
};

export default function AnnouncementEditor() {
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        setLoading(true);
        setStatus("");

        const res = await fetch("/api/admin/announcement", {
          cache: "no-store",
        });

        const data = (await res.json()) as AnnouncementData & { ok?: boolean };

        if (!cancelled) {
          setMessage(data?.message ?? "");
          setEnabled(Boolean(data?.enabled));
          setUpdatedAt(data?.updatedAt ?? null);
        }
      } catch (error) {
        console.error("Load announcement error:", error);
        if (!cancelled) setStatus("No se pudo cargar el anuncio.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnnouncement();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setStatus("");

      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setStatus(data?.error || "No se pudo guardar el anuncio.");
        return;
      }

      setUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setStatus("Anuncio guardado correctamente.");
    } catch (error) {
      console.error("Save announcement error:", error);
      setStatus("Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        Anuncios
      </p>
      <h2 className="mt-2 text-xl font-bold text-white">Editor de anuncio</h2>
      <p className="mt-2 text-sm text-white/55">
        Este mensaje podrá mostrarse luego en la página principal de ModLang
        Forge.
      </p>

      <div className="mt-5 space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Escribe un anuncio para mostrar en la web..."
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
          disabled={loading || saving}
        />

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={loading || saving}
          />
          Anuncio activo
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-xl border border-white/10 bg-white text-black px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar anuncio"}
          </button>

          {updatedAt ? (
            <p className="text-xs text-white/45">
              Última actualización: {new Date(updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        {status ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
            {status}
          </div>
        ) : null}
      </div>
    </section>
  );
}