"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatDuration } from "@/app/lib/modlang/helpers";
import {
  analyzeJar,
  buildTranslatedJar,
  buildCombinedResourcePack,
} from "@/app/lib/modlang/jar";
import { getStoredSpeed, saveObservedSpeed } from "@/app/lib/modlang/progress";
import { makeFileKey } from "@/app/lib/modlang/queue";
import { translateEntriesInBatches } from "@/app/lib/modlang/translate";
import {
  buildTranslationSummary,
  downloadArtifactsZip,
  downloadSingleArtifact,
} from "@/app/lib/modlang/download";

import type {
  BuiltArtifact,
  OutputFormat,
  QueueItem,
} from "@/app/lib/modlang/types";

type UiLang = "es" | "en";

export type CommunityUploadDraft = {
  outputType: OutputFormat;
  targetLang: string;
  zipBlob: Blob | null;
  zipName: string;
  modName: string;
  modVersion: string;
};

export function useModlangQueue(uiLang: UiLang = "es") {
  const t = useMemo(() => {
    if (uiLang === "en") {
      return {
        initialStatus: "Idle",
        onlyJar: "Only .jar files are allowed",
        noValidFiles: "No valid files were added to the queue",
        noNewFiles: "No new files were added. They were already in the queue.",
        noFilesAdded: "No files were added to the queue",
        addedFiles: (added: number, dup: number, invalid: number) =>
          `Added ${added} file(s) to queue${
            dup > 0 ? `, ${dup} duplicate(s) skipped` : ""
          }${invalid > 0 ? `, ${invalid} invalid(s)` : ""}`,
        noPending: "There are no pending files in the queue",
        sameLang: "Source and target language cannot be the same.",
        selectDifferent: "Select different languages to continue",
        readyToProcess: (count: number) => `Ready to process (${count} texts)`,
        processingFile: (current: number, total: number, name: string) =>
          `Processing (${current}/${total}): ${name}`,
        analyzingFile: (current: number, total: number) =>
          `Analyzing file ${current} of ${total}`,
        analyzeJarError: "Error analyzing the .jar",
        preparingBatches: (source: string, target: string) =>
          `Preparing translation in batches (${source} → ${target})...`,
        packagingJar: "Generating translated .jar...",
        packagingResourcePack: "Generating combined resource pack...",
        translationError: "Error during translation",
        preparingFinalDownload: "Preparing final download...",
        noSuccessfulFiles: "No files were translated successfully.",
        downloadedFile: (name: string) => `Done. Downloaded ${name}`,
        downloadedZip: "Done. Downloaded the ZIP with translated mods.",
        downloadedResourcePack: (name: string) =>
          `Done. Downloaded the resource pack ${name}.`,
        processingQueueError: "Error processing queue",
        unknownError: "Unknown error",
        queuedWait: "Waiting",
        estimatedRemaining: (ms: number) =>
          `Estimated time remaining: ${formatDuration(ms)}`,
        totalApprox: (ms: number) => `Approx total time: ${formatDuration(ms)}`,
        summaryOk: (
          sourceFile: string,
          finalName: string,
          entriesCount: number,
          source: string,
          target: string
        ) =>
          `[OK] ${sourceFile} -> ${finalName} | entries: ${entriesCount} | translation completed (${source} -> ${target})`,
        invalidIgnored: (count: number) =>
          `${count} file(s) were ignored because they are not .jar`,
        readyFile: (name: string) => `${name} ready.`,
        missingModId: (name: string) =>
          `Could not detect mod id for ${name}. It cannot be added to the resource pack.`,
      };
    }

    return {
      initialStatus: "Inactivo",
      onlyJar: "Solo se permiten archivos .jar",
      noValidFiles: "No se añadieron archivos válidos a la cola",
      noNewFiles:
        "No se añadieron archivos nuevos. Todos ya estaban en la cola.",
      noFilesAdded: "No se añadieron archivos a la cola",
      addedFiles: (added: number, dup: number, invalid: number) =>
        `Se añadieron ${added} archivo(s) a la cola${
          dup > 0 ? `, ${dup} duplicado(s) omitidos` : ""
        }${invalid > 0 ? `, ${invalid} inválido(s)` : ""}`,
      noPending: "No hay archivos pendientes en la cola",
      sameLang: "El idioma de origen y destino no puede ser el mismo.",
      selectDifferent: "Selecciona idiomas diferentes para continuar",
      readyToProcess: (count: number) => `Listo para procesar (${count} textos)`,
      processingFile: (current: number, total: number, name: string) =>
        `Procesando (${current}/${total}): ${name}`,
      analyzingFile: (current: number, total: number) =>
        `Analizando archivo ${current} de ${total}`,
      analyzeJarError: "Error al analizar el .jar",
      preparingBatches: (source: string, target: string) =>
        `Preparando traducción por lotes (${source} → ${target})...`,
      packagingJar: "Generando .jar traducido...",
      packagingResourcePack: "Generando resource pack combinado...",
      translationError: "Error durante la traducción",
      preparingFinalDownload: "Preparando descarga final...",
      noSuccessfulFiles: "No hubo archivos traducidos correctamente.",
      downloadedFile: (name: string) => `Listo. Se descargó ${name}`,
      downloadedZip: "Listo. Se descargó el ZIP con los mods traducidos.",
      downloadedResourcePack: (name: string) =>
        `Listo. Se descargó el resource pack ${name}.`,
      processingQueueError: "Error procesando la cola",
      unknownError: "Error desconocido",
      queuedWait: "En espera",
      estimatedRemaining: (ms: number) =>
        `Tiempo estimado restante: ${formatDuration(ms)}`,
      totalApprox: (ms: number) =>
        `Tiempo total aproximado: ${formatDuration(ms)}`,
      summaryOk: (
        sourceFile: string,
        finalName: string,
        entriesCount: number,
        source: string,
        target: string
      ) =>
        `[OK] ${sourceFile} -> ${finalName} | entradas: ${entriesCount} | traducción completada (${source} -> ${target})`,
      invalidIgnored: (count: number) =>
        `${count} archivo(s) fueron ignorados por no ser .jar`,
      readyFile: (name: string) => `${name} listo.`,
      missingModId: (name: string) =>
        `No se pudo detectar el mod id de ${name}. No se puede añadir al resource pack.`,
    };
  }, [uiLang]);

  const [status, setStatus] = useState(t.initialStatus);
  const [error, setError] = useState("");
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [etaText, setEtaText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState("");
  const [lastDownloadName, setLastDownloadName] = useState("");

  const [communityUploadDraft, setCommunityUploadDraft] =
    useState<CommunityUploadDraft | null>(null);

  useEffect(() => {
    if (
      !isProcessingQueue &&
      queueItems.length === 0 &&
      !error &&
      !currentFileName &&
      !lastDownloadName
    ) {
      setStatus(t.initialStatus);
    }
  }, [
    uiLang,
    t.initialStatus,
    isProcessingQueue,
    queueItems.length,
    error,
    currentFileName,
    lastDownloadName,
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function recalculateGlobalProgress(items: QueueItem[]) {
    if (items.length === 0) {
      setTranslationProgress(0);
      return;
    }

    const total = items.reduce((sum, item) => sum + (item.progress || 0), 0);
    setTranslationProgress(Math.round(total / items.length));
  }

  function resetAll() {
    setStatus(t.initialStatus);
    setError("");
    setIsProcessingQueue(false);
    setTranslationProgress(0);
    setEtaText("");
    setDragActive(false);
    setQueueItems([]);
    setCurrentFileName("");
    setLastDownloadName("");
    setCommunityUploadDraft(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function updateQueueItem(id: string, patch: Partial<QueueItem>) {
    setQueueItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      );
      recalculateGlobalProgress(next);
      return next;
    });
  }

  function addFilesToQueue(files: File[]) {
    const jarFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".jar")
    );
    const invalidCount = files.length - jarFiles.length;

    if (jarFiles.length === 0) {
      setError(t.onlyJar);
      setStatus(t.noValidFiles);
      return;
    }

    let duplicateCount = 0;
    let addedCount = 0;

    setQueueItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const uniqueNewItems: QueueItem[] = [];

      for (const file of jarFiles) {
        const id = makeFileKey(file);

        if (existingIds.has(id)) {
          duplicateCount++;
          continue;
        }

        existingIds.add(id);
        uniqueNewItems.push({
          id,
          file,
          fileName: file.name,
          status: "pendiente",
          message: t.queuedWait,
          progress: 0,
          entriesTotal: 0,
          entriesDone: 0,
          outputFormat: "jar",
        });
      }

      addedCount = uniqueNewItems.length;
      const next = [...prev, ...uniqueNewItems];
      recalculateGlobalProgress(next);
      return next;
    });

    setError(invalidCount > 0 ? t.invalidIgnored(invalidCount) : "");

    if (addedCount === 0) {
      setStatus(duplicateCount > 0 ? t.noNewFiles : t.noFilesAdded);
      return;
    }

    setStatus(t.addedFiles(addedCount, duplicateCount, invalidCount));
  }

  async function processQueue(
    sourceLang = "en",
    targetLang = "es",
    outputFormat: OutputFormat = "jar"
  ) {
    const pendingItems = queueItems.filter(
      (item) =>
        item.status === "pendiente" ||
        item.status === "error" ||
        item.status === "omitido"
    );

    if (pendingItems.length === 0) {
      setStatus(t.noPending);
      return;
    }

    if (sourceLang === targetLang) {
      setError(t.sameLang);
      setStatus(t.selectDifferent);
      return;
    }

    try {
      setIsProcessingQueue(true);
      setError("");
      setTranslationProgress(0);
      setEtaText("");
      setLastDownloadName("");
      setCommunityUploadDraft(null);

      const builtArtifacts: BuiltArtifact[] = [];
      const resourcePackEntries: Array<{
        fileName: string;
        modId: string;
        translatedEntries: Record<string, string>;
      }> = [];

      const totalFiles = pendingItems.length;
      const globalStart = Date.now();
      const summaryLines: string[] = [];

      let totalEntries = 0;
      let processedEntries = 0;

      for (const item of pendingItems) {
        try {
          const analysisPreview = await analyzeJar(
            item.file,
            sourceLang,
            targetLang
          );

          const previewEntries = analysisPreview.parsedSource
            ? Object.keys(analysisPreview.parsedSource).length
            : 0;

          totalEntries += previewEntries;

          updateQueueItem(item.id, {
            entriesTotal: previewEntries,
            entriesDone: 0,
            progress: 0,
            status: "pendiente",
            modId: analysisPreview.modId || undefined,
            outputFormat,
            message:
              previewEntries > 0
                ? t.readyToProcess(previewEntries)
                : analysisPreview.result.message,
          });
        } catch {}
      }

      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];

        setCurrentFileName(item.fileName);
        setStatus(t.processingFile(i + 1, totalFiles, item.fileName));

        updateQueueItem(item.id, {
          status: "analizando",
          message: t.analyzingFile(i + 1, totalFiles),
          progress: 5,
          outputFormat,
        });

        let analysis;
        try {
          analysis = await analyzeJar(item.file, sourceLang, targetLang);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t.analyzeJarError;

          updateQueueItem(item.id, {
            status: "error",
            message,
            progress: 100,
            outputFormat,
          });

          summaryLines.push(`[ERROR] ${item.fileName} -> ${message}`);
          continue;
        }

        if (!analysis.result.sourcePath || !analysis.parsedSource) {
          updateQueueItem(item.id, {
            status: "omitido",
            message: analysis.result.message,
            progress: 100,
            outputFormat,
          });

          summaryLines.push(
            `[OMITIDO] ${item.fileName} -> ${analysis.result.message}`
          );
          continue;
        }

        const entriesCount = Object.keys(analysis.parsedSource).length;

        updateQueueItem(item.id, {
          status: "traduciendo",
          message: t.preparingBatches(sourceLang, targetLang),
          progress: 15,
          entriesTotal: entriesCount,
          entriesDone: 0,
          modId: analysis.modId || undefined,
          outputFormat,
        });

        try {
          const translated = await translateEntriesInBatches(
            item.id,
            analysis.parsedSource,
            updateQueueItem,
            sourceLang,
            targetLang
          );

          if (outputFormat === "resourcepack") {
            if (!analysis.modId) {
              const message = t.missingModId(item.fileName);

              updateQueueItem(item.id, {
                status: "error",
                message,
                progress: 100,
                outputFormat,
              });

              summaryLines.push(`[ERROR] ${item.fileName} -> ${message}`);
              continue;
            }

            resourcePackEntries.push({
              fileName: item.fileName,
              modId: analysis.modId,
              translatedEntries: translated,
            });

            processedEntries += entriesCount;
            const elapsedMs = Date.now() - globalStart;
            saveObservedSpeed(processedEntries, elapsedMs);

            const remainingEntries = Math.max(0, totalEntries - processedEntries);
            const speed = getStoredSpeed();
            const remainingMs =
              speed > 0 ? Math.ceil((remainingEntries / speed) * 1000) : 0;

            updateQueueItem(item.id, {
              status: "ok",
              message: t.readyFile(`${analysis.modId}.lang`),
              progress: 100,
              outputName: `${analysis.modId}.lang`,
              entriesDone: entriesCount,
              entriesTotal: entriesCount,
              modId: analysis.modId,
              outputFormat,
            });

            setEtaText(
              remainingMs > 0
                ? t.estimatedRemaining(remainingMs)
                : t.totalApprox(elapsedMs)
            );

            summaryLines.push(
              t.summaryOk(
                item.fileName,
                `${analysis.modId}.lang`,
                entriesCount,
                sourceLang,
                targetLang
              )
            );

            continue;
          }

          updateQueueItem(item.id, {
            status: "empaquetando",
            message: t.packagingJar,
            progress: 92,
            outputFormat,
          });

          const built = await buildTranslatedJar(
            item.file,
            analysis,
            translated,
            targetLang
          );

          builtArtifacts.push({
            itemId: item.id,
            sourceFileName: item.fileName,
            finalName: built.finalName,
            blob: built.blob,
          });

          processedEntries += entriesCount;
          const elapsedMs = Date.now() - globalStart;
          saveObservedSpeed(processedEntries, elapsedMs);

          const remainingEntries = Math.max(0, totalEntries - processedEntries);
          const speed = getStoredSpeed();
          const remainingMs =
            speed > 0 ? Math.ceil((remainingEntries / speed) * 1000) : 0;

          updateQueueItem(item.id, {
            status: "ok",
            message: t.readyFile(built.finalName),
            progress: 100,
            outputName: built.finalName,
            entriesDone: entriesCount,
            entriesTotal: entriesCount,
            modId: analysis.modId || undefined,
            outputFormat,
          });

          setEtaText(
            remainingMs > 0
              ? t.estimatedRemaining(remainingMs)
              : t.totalApprox(elapsedMs)
          );

          summaryLines.push(
            t.summaryOk(
              item.fileName,
              built.finalName,
              entriesCount,
              sourceLang,
              targetLang
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t.translationError;

          updateQueueItem(item.id, {
            status: "error",
            message,
            progress: 100,
            outputFormat,
          });

          summaryLines.push(`[ERROR] ${item.fileName} -> ${message}`);
        }
      }

      setStatus(t.preparingFinalDownload);
      setCurrentFileName("");

      if (outputFormat === "resourcepack") {
        if (resourcePackEntries.length === 0) {
          setStatus(t.noSuccessfulFiles);
          setTranslationProgress(100);
          return;
        }

        const elapsedMs = Date.now() - globalStart;
        setTranslationProgress(100);
        setEtaText(t.totalApprox(elapsedMs));

        const resourcePack = await buildCombinedResourcePack({
          files: resourcePackEntries,
          targetLang,
        });

        const downloadedName = await downloadSingleArtifact(resourcePack);

        await fetch("/api/stats/translation-done", {
          method: "POST",
        });

        const firstFile = pendingItems[0]?.fileName || "resource-pack";
        const cleanFirstName = firstFile.replace(/\.jar$/i, "");

        setCommunityUploadDraft({
          outputType: "resourcepack",
          targetLang,
          zipBlob: resourcePack.blob,
          zipName: resourcePack.finalName,
          modName:
            pendingItems.length === 1 ? cleanFirstName : "ModPack combinado",
          modVersion: "unknown",
        });

        setLastDownloadName(downloadedName);
        setStatus(t.downloadedResourcePack(downloadedName));
        return;
      }

      const successCount = builtArtifacts.length;

      if (successCount === 0) {
        setStatus(t.noSuccessfulFiles);
        setTranslationProgress(100);
        return;
      }

      const elapsedMs = Date.now() - globalStart;
      setTranslationProgress(100);
      setEtaText(t.totalApprox(elapsedMs));

      if (successCount === 1) {
        const only = builtArtifacts[0];
        const downloadedName = await downloadSingleArtifact(only);

        await fetch("/api/stats/translation-done", {
          method: "POST",
        });

        setLastDownloadName(downloadedName);
        setStatus(t.downloadedFile(downloadedName));
        return;
      }

      const summaryText = buildTranslationSummary({
        summaryLines,
        totalProcessed: pendingItems.length,
        successCount,
      });

      const finalZipName = await downloadArtifactsZip({
        artifacts: builtArtifacts,
        summaryText,
      });

      await fetch("/api/stats/translation-done", {
        method: "POST",
      });

      setLastDownloadName(finalZipName);
      setStatus(t.downloadedZip);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t.unknownError);
      setStatus(t.processingQueueError);
      setEtaText("");
    } finally {
      setIsProcessingQueue(false);
    }
  }

  function clearCommunityUploadDraft() {
    setCommunityUploadDraft(null);
  }

  function removeQueueItem(id: string) {
    if (isProcessingQueue) return;
    setQueueItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      recalculateGlobalProgress(next);
      return next;
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFilesToQueue(files);
    }
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      addFilesToQueue(files);
    }
  }

  const completedCount = queueItems.filter((item) => item.status === "ok").length;
  const errorCount = queueItems.filter((item) => item.status === "error").length;
  const skippedCount = queueItems.filter((item) => item.status === "omitido").length;
  const pendingCount = queueItems.filter((item) => item.status === "pendiente").length;

  return {
    status,
    error,
    isProcessingQueue,
    translationProgress,
    etaText,
    dragActive,
    queueItems,
    currentFileName,
    lastDownloadName,
    inputRef,
    completedCount,
    errorCount,
    skippedCount,
    pendingCount,
    communityUploadDraft,
    clearCommunityUploadDraft,
    resetAll,
    processQueue,
    removeQueueItem,
    updateQueueItem,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}