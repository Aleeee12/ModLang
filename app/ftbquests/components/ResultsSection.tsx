import type { QueueItem } from "../hooks/useFtbQueue";

type UiLang = "es" | "en";

type ResultsSectionProps = {
  queue: QueueItem[];
  uiLang: UiLang;
};

export default function ResultsSection({
  queue,
  uiLang,
}: ResultsSectionProps) {
  const completed = queue.filter((item) => item.status === "done" && item.result);

  if (completed.length === 0) return null;

  const t =
    uiLang === "en"
      ? {
          title: "Completed translations",
          done: "Translation completed successfully",
          download: "Download",
        }
      : {
          title: "Traducciones completadas",
          done: "Traducción completada correctamente",
          download: "Descargar",
        };

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <h2 className="text-lg font-semibold text-white">{t.title}</h2>

      <div className="mt-4 space-y-3">
        {completed.map((item) => {
          const url = URL.createObjectURL(item.result!);

          return (
            <a
              key={item.id}
              href={url}
              download={item.outputName || item.name}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {item.outputName || item.name}
                </p>
                <p className="mt-1 text-xs text-green-400">{t.done}</p>
              </div>

              <span className="ml-4 shrink-0 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white">
                {t.download}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}