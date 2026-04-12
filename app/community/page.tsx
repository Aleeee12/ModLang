"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CommunityList from "./components/CommunityList";

type CommunityItem = {
  id: number;
  mod_name: string;
  mod_version: string;
  target_lang: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
};

type CommunityListResponse = {
  ok: boolean;
  items: CommunityItem[];
  error?: string;
};

export default function CommunityPage() {
  const [uiLang, setUiLang] = useState<"es" | "en">("es");
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("modlang_ui_lang");
    if (saved === "es" || saved === "en") {
      setUiLang(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/community/list", {
          cache: "no-store",
        });

        const data = (await res.json()) as CommunityListResponse;

        if (!res.ok || !data?.ok) {
          throw new Error(
            data?.error ||
              (uiLang === "es"
                ? "No se pudo cargar la comunidad."
                : "Could not load the community.")
          );
        }

        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : uiLang === "es"
              ? "Error desconocido."
              : "Unknown error."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCommunity();

    return () => {
      cancelled = true;
    };
  }, [uiLang]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) => {
      return (
        item.mod_name.toLowerCase().includes(term) ||
        item.mod_version.toLowerCase().includes(term) ||
        item.target_lang.toLowerCase().includes(term) ||
        item.file_name.toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black px-6 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {uiLang === "es"
                ? "Traducciones de la comunidad"
                : "Community Translations"}
            </h1>
            <p className="mt-2 text-zinc-400">
              {uiLang === "es"
                ? "Descarga resource packs compartidos por otros usuarios."
                : "Download resource packs shared by other users."}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            {uiLang === "es" ? "Volver" : "Back"}
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              uiLang === "es"
                ? "Buscar por mod, versión o idioma..."
                : "Search by mod, version or language..."
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        {!loading && !error ? (
          <p className="text-sm text-zinc-400">
            {uiLang === "es"
              ? `${filteredItems.length} resultado(s)`
              : `${filteredItems.length} result(s)`}
          </p>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
            {uiLang === "es" ? "Cargando..." : "Loading..."}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        ) : (
          <CommunityList items={filteredItems} uiLang={uiLang} />
        )}
      </div>
    </main>
  );
}