type Props = {
  item: {
    id: number;
    mod_name: string;
    mod_version: string;
    target_lang: string;
    file_size: number;
    translated_mods_json?: string | null;
    created_at: string;
  };
  uiLang: "es" | "en";
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

export default function CommunityCard({ item, uiLang }: Props) {
  const createdAt = new Date(item.created_at);
  const translatedMods = parseTranslatedMods(item.translated_mods_json);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">{item.mod_name}</h3>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-300">
              {uiLang === "es" ? "Versión" : "Version"}: {item.mod_version}
            </span>

            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-300">
              {uiLang === "es" ? "Idioma" : "Language"}: {item.target_lang}
            </span>

            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-300">
              {uiLang === "es" ? "Tamaño" : "Size"}: {formatBytes(item.file_size)}
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

          <p className="text-sm text-zinc-400">
            {uiLang === "es" ? "Subido:" : "Uploaded:"}{" "}
            {createdAt.toLocaleString(uiLang === "es" ? "es-ES" : "en-US")}
          </p>
        </div>

        <div className="flex items-center">
          <a
            href={`/api/community/download/${item.id}`}
            className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            {uiLang === "es" ? "Descargar" : "Download"}
          </a>
        </div>
      </div>
    </div>
  );
}