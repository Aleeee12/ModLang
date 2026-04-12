"use client";

import { useRef, useState } from "react";

type QueueStatus =
  | "idle"
  | "analyzing"
  | "ready"
  | "translating"
  | "done"
  | "error";

export type QueueItem = {
  id: string;
  name: string;
  files: File[];
  status: QueueStatus;
  mode?: "lang" | "chapters" | "unknown";
  detectedLang?: string;
  entriesFound?: number;
  outputName?: string;
  result?: Blob;
  error?: string;
  progress?: number;
  etaSeconds?: number | null;
};

function getVirtualPath(file: File) {
  const withRelative = file as File & { webkitRelativePath?: string };
  return withRelative.webkitRelativePath || file.name;
}

function getBundleName(files: File[]) {
  if (files.length === 1) return files[0].name;

  const roots = Array.from(
    new Set(
      files
        .map((file) => getVirtualPath(file))
        .map((path) => path.replace(/\\/g, "/").split("/")[0])
        .filter(Boolean)
    )
  );

  if (roots.length === 1) return roots[0];
  return `${files.length} archivos`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function formatEta(seconds: number | null | undefined) {
  if (seconds == null || seconds <= 0) return "";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}m ${s}s`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useFtbQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [targetLang, setTargetLang] = useState("es");
  const [progress, setProgress] = useState(0);
  const [currentItemName, setCurrentItemName] = useState("");
  const [globalStatus, setGlobalStatus] = useState("Inactivo");
  const [isWorking, setIsWorking] = useState(false);
  const [eta, setEta] = useState("");

  const isWorkingRef = useRef(false);

  function updateQueue(updater: (prev: QueueItem[]) => QueueItem[]) {
    setQueue((prev) => [...updater(prev)]);
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    const item: QueueItem = {
      id: crypto.randomUUID(),
      name: getBundleName(files),
      files,
      status: "idle",
      progress: 0,
      etaSeconds: null,
    };

    setQueue((prev) => [...prev, item]);
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function clearQueue() {
    setQueue([]);
    setProgress(0);
    setCurrentItemName("");
    setGlobalStatus("Inactivo");
    setIsWorking(false);
    isWorkingRef.current = false;
    setEta("");
  }

  async function startAnalysis() {
    const pending = queue.filter(
      (item) => item.status === "idle" || item.status === "error"
    );

    if (pending.length === 0 || isWorkingRef.current) return;

    setIsWorking(true);
    isWorkingRef.current = true;
    setProgress(0);
    setCurrentItemName("");
    setGlobalStatus("Analizando...");
    setEta("");

    let completed = 0;

    for (const item of pending) {
      setCurrentItemName(item.name);

      updateQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "analyzing",
                error: undefined,
              }
            : q
        )
      );

      try {
        const form = new FormData();

        for (const file of item.files) {
          form.append("files", file);
          form.append("paths", getVirtualPath(file));
        }

        const res = await fetch("/ftbquests/api/analyze", {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          updateQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "error",
                    error: data?.error || "No se pudo analizar.",
                  }
                : q
            )
          );
        } else {
          updateQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "ready",
                    mode: data.mode || "unknown",
                    detectedLang: data.detectedLang || "unknown",
                    entriesFound: Number(data.entriesFound || 0),
                    error: undefined,
                  }
                : q
            )
          );
        }
      } catch (error) {
        updateQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Error analizando.",
                }
              : q
          )
        );
      }

      completed++;
      setProgress(Math.round((completed / pending.length) * 100));
    }

    setCurrentItemName("");
    setGlobalStatus("Análisis completado");
    setProgress(100);
    setEta("");
    setIsWorking(false);
    isWorkingRef.current = false;
  }

  async function startTranslation() {
    const readyItems = queue.filter((item) => item.status === "ready");

    if (readyItems.length === 0 || isWorkingRef.current) {
      if (readyItems.length === 0) {
        setGlobalStatus("No hay elementos listos para traducir");
      }
      return;
    }

    setIsWorking(true);
    isWorkingRef.current = true;
    setProgress(0);
    setCurrentItemName("");
    setGlobalStatus("Iniciando traducción...");
    setEta("");

    let completedItems = 0;

    for (const item of readyItems) {
      setCurrentItemName(item.name);

      updateQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "translating",
                progress: 0,
                etaSeconds: null,
                error: undefined,
              }
            : q
        )
      );

      try {
        const form = new FormData();

        for (const file of item.files) {
          form.append("files", file);
          form.append("paths", getVirtualPath(file));
        }

        form.append("target", targetLang);
        form.append("source", item.detectedLang || "auto");

        const startRes = await fetch("/ftbquests/api/translate/start", {
          method: "POST",
          body: form,
        });

        const startData = await startRes.json();

        if (!startRes.ok || !startData?.ok || !startData?.jobId) {
          throw new Error(startData?.error || "No se pudo iniciar la traducción.");
        }

        const jobId = String(startData.jobId);

        while (true) {
          await sleep(500);

          const progressRes = await fetch(
            `/ftbquests/api/translate/progress?jobId=${encodeURIComponent(jobId)}`,
            { cache: "no-store" }
          );

          const progressData = await progressRes.json();

          if (!progressRes.ok || !progressData?.ok) {
            throw new Error(
              progressData?.error || "No se pudo consultar el progreso."
            );
          }

          const itemProgress = Number(progressData.progress || 0);
          const etaSeconds =
            typeof progressData.etaSeconds === "number"
              ? progressData.etaSeconds
              : null;

          updateQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    progress: itemProgress,
                    etaSeconds,
                  }
                : q
            )
          );

          const globalProgress = Math.round(
            ((completedItems + itemProgress / 100) / readyItems.length) * 100
          );

          setProgress(globalProgress);
          setEta(formatEta(etaSeconds));
          setGlobalStatus(progressData.stageLabel || "Traduciendo...");
          setCurrentItemName(
            progressData.currentFile
              ? `${item.name} → ${progressData.currentFile}`
              : item.name
          );

          if (progressData.error) {
            throw new Error(progressData.error);
          }

          if (progressData.done === true) {
            break;
          }
        }

        const resultRes = await fetch(
          `/ftbquests/api/translate/result?jobId=${encodeURIComponent(jobId)}`,
          { cache: "no-store" }
        );

        if (!resultRes.ok) {
          const text = await resultRes.text().catch(() => "");
          throw new Error(text || "No se pudo descargar el resultado.");
        }

        const blob = await resultRes.blob();
        const outputName =
          resultRes.headers.get("X-Output-Name") || `${item.name}.zip`;

        downloadBlob(blob, outputName);

        updateQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "done",
                  result: blob,
                  outputName,
                  progress: 100,
                  etaSeconds: 0,
                  error: undefined,
                }
              : q
          )
        );

        completedItems++;
        setProgress(Math.round((completedItems / readyItems.length) * 100));
        setEta("");
      } catch (error) {
        updateQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Error traduciendo.",
                }
              : q
          )
        );
      }
    }

    setCurrentItemName("");
    setGlobalStatus("Traducción completada");
    setProgress(100);
    setEta("");
    setIsWorking(false);
    isWorkingRef.current = false;
  }

  return {
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
  };
}