"use client";

import CommunityCard from "./CommunityCard";

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

type Props = {
  items: CommunityItem[];
  uiLang: "es" | "en";
};

export default function CommunityList({ items, uiLang }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-zinc-400">
        {uiLang === "es"
          ? "No se encontraron traducciones."
          : "No translations found."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CommunityCard key={item.id} item={item} uiLang={uiLang} />
      ))}
    </div>
  );
}