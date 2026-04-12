"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CommunityItem = {
  id: number;
  mod_name: string;
  mod_version: string;
  target_lang: string;
  file_name: string;
  file_path: string;
  file_size: number;
  translated_mods_json: string | null;
  created_at: string;
};

type CommunityListResponse = {
  ok?: boolean;
  items?: CommunityItem[];
  error?: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function parseTranslatedMods(value?: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export default function AdminCommunityPage() {
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/community/list", {
        cache: "no-store",
      });

      const data = (await res.json()) as CommunityListResponse;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudo cargar la comunidad.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar esta traducción? Esto borrará el archivo y el registro de la base de datos."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/admin/community/delete/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudo eliminar.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
              Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-white">
              Comunidad
            </h1>
            <p className="mt-2 text-zinc-400">
              Gestiona traducciones subidas por la comunidad.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Volver
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 text-zinc-400">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 text-zinc-400">
            No hay traducciones subidas.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const translatedMods = parseTranslatedMods(item.translated_mods_json);

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <h2 className="text-2xl font-semibold text-white">
                        {item.mod_name}
                      </h2>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-zinc-300">
                          Versión: {item.mod_version}
                        </span>
                        <span className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-zinc-300">
                          Idioma: {item.target_lang}
                        </span>
                        <span className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-zinc-300">
                          Tamaño: {formatBytes(item.file_size)}
                        </span>
                      </div>

                      {translatedMods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {translatedMods.map((modId) => (
                            <span
                              key={modId}
                              className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-200"
                            >
                              {modId}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <p className="text-sm text-zinc-500">
                        Subido: {new Date(item.created_at).toLocaleString("es-ES")}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={`/api/community/download/${item.id}`}
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
                      >
                        Descargar
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}