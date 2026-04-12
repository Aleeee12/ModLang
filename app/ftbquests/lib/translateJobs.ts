import JSZip from "jszip";
import {
  getLangLocaleFiles,
  getLangLocaleFolderFiles,
  getVirtualPath,
  hasLangFolder,
  isSnbtPath,
  isZipPath,
  pickBestSourceLocale,
  pickChapterSources,
  targetLangToLocale,
  targetLangToLocaleFilename,
  type UploadedSource,
} from "./detect";
import { protectPlaceholders, restorePlaceholders } from "./placeholders";
import { translateLangContent, extractLangTexts } from "./langParser";
import { translateChapterContent, extractChapterTexts } from "./chapterParser";

const CONCURRENCY = 8;
const TRANSLATE_BATCH_SIZE = 40;
const TRANSLATE_FLUSH_DELAY_MS = 15;
const JOB_TTL_MS = 1000 * 60 * 30;

export type TranslationJobState =
  | "queued"
  | "preparing"
  | "translating"
  | "packing"
  | "done"
  | "error";

export type TranslationJob = {
  id: string;
  createdAt: number;
  updatedAt: number;
  state: TranslationJobState;
  stageLabel: string;
  target: string;
  sourceLang: string;
  sources: UploadedSource[];
  totalTexts: number;
  completedTexts: number;
  progress: number;
  etaSeconds: number | null;
  currentFile: string;
  currentStage: string;
  error: string | null;
  outputName: string | null;
  outputContentType: string | null;
  outputData: Uint8Array | null;
};

const globalJobs = globalThis as typeof globalThis & {
  __modlangFtbJobs?: Map<string, TranslationJob>;
};

const jobs = globalJobs.__modlangFtbJobs ?? new Map<string, TranslationJob>();

if (!globalJobs.__modlangFtbJobs) {
  globalJobs.__modlangFtbJobs = jobs;
}

function cleanupOldJobs() {
  const now = Date.now();

  for (const [id, job] of jobs.entries()) {
    if (now - job.updatedAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}

function touchJob(job: TranslationJob) {
  job.updatedAt = Date.now();
}

function setJobProgress(
  job: TranslationJob,
  patch: Partial<
    Pick<
      TranslationJob,
      | "state"
      | "stageLabel"
      | "currentFile"
      | "currentStage"
      | "totalTexts"
      | "completedTexts"
      | "progress"
      | "etaSeconds"
      | "error"
      | "outputName"
      | "outputContentType"
      | "outputData"
    >
  >
) {
  Object.assign(job, patch);
  touchJob(job);
}

function uint8ToArrayBuffer(data: Uint8Array) {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
}

function encodeText(text: string) {
  return new TextEncoder().encode(text);
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

function getDirName(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/");
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= items.length) break;
      results[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length || 1)) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

export async function decodeUploadedSourcesFromFormData(form: FormData): Promise<{
  sources: UploadedSource[];
  target: string;
  sourceLang: string;
}> {
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const paths = form.getAll("paths").map(String);
  const target = String(form.get("target") || "es");
  const sourceLang = String(form.get("source") || "auto");

  const sources: UploadedSource[] = [];
  const decoder = new TextDecoder("utf-8");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = getVirtualPath(file, paths[i]);

    if (isZipPath(path)) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());

      for (const [entryPath, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;

        const data = await entry.async("uint8array");

        sources.push({
          path: normalizePath(entryPath),
          name: entryPath.split("/").pop() || entryPath,
          data,
          text: isSnbtPath(entryPath) ? decoder.decode(data) : undefined,
        });
      }

      continue;
    }

    const data = new Uint8Array(await file.arrayBuffer());

    sources.push({
      path: normalizePath(path),
      name: file.name,
      data,
      text: isSnbtPath(path) ? decoder.decode(data) : undefined,
    });
  }

  return { sources, target, sourceLang };
}

async function translateBatchGoogle(
  texts: string[],
  source = "auto",
  target = "es"
): Promise<string[]> {
  if (texts.length === 0) return [];

  const sl = source === "unknown" ? "auto" : source;
  const separator = "\n__MODLANG_BATCH_SEPARATOR_9f7c1e__\n";
  const joined = texts.join(separator);

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${encodeURIComponent(sl)}` +
    `&tl=${encodeURIComponent(target)}` +
    `&dt=t&q=${encodeURIComponent(joined)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google Translate respondió ${res.status}`);
  }

  const data = await res.json();

  const translated = Array.isArray(data?.[0])
    ? data[0].map((part: any) => part?.[0] || "").join("")
    : joined;

  const split = translated.split(separator);

  if (split.length === texts.length) {
    return split;
  }

  return texts.map((text, index) => split[index] ?? text);
}

function createProgressTranslator(
  job: TranslationJob,
  sourceLang: string,
  targetLang: string
) {
  const finalCache = new Map<string, string>();
  const inFlightCache = new Map<string, Promise<string>>();
  const queue: Array<{
    originalText: string;
    protectedText: string;
    tokens: string[];
    resolve: (value: string) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  const startedAt = Date.now();

  function markOneCompleted() {
    job.completedTexts += 1;

    const progress =
      job.totalTexts > 0
        ? Math.max(
            0,
            Math.min(100, Math.round((job.completedTexts / job.totalTexts) * 100))
          )
        : 0;

    let etaSeconds: number | null = null;

    if (job.completedTexts > 0 && job.totalTexts > job.completedTexts) {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const rate = elapsedSeconds / job.completedTexts;
      etaSeconds = Math.max(
        0,
        Math.round((job.totalTexts - job.completedTexts) * rate)
      );
    }

    setJobProgress(job, {
      progress,
      etaSeconds,
    });
  }

  async function flushQueue() {
    if (flushing || queue.length === 0) return;

    flushing = true;

    while (queue.length > 0) {
      const batch = queue.splice(0, TRANSLATE_BATCH_SIZE);

      try {
        const translatedBatch = await translateBatchGoogle(
          batch.map((item) => item.protectedText),
          sourceLang,
          targetLang
        );

        for (let i = 0; i < batch.length; i++) {
          const item = batch[i];
          const translated = translatedBatch[i] ?? item.protectedText;
          const restored = restorePlaceholders(translated, item.tokens);

          finalCache.set(item.originalText, restored);
          inFlightCache.delete(item.originalText);
          markOneCompleted();
          item.resolve(restored);
        }
      } catch (error) {
        for (const item of batch) {
          inFlightCache.delete(item.originalText);
          item.reject(error);
        }
        throw error;
      }
    }

    flushing = false;
  }

  function scheduleFlush() {
    if (flushTimer) return;

    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushQueue();
    }, TRANSLATE_FLUSH_DELAY_MS);
  }

  return async function translatePreserving(text: string) {
    if (!text.trim()) return text;

    const cached = finalCache.get(text);
    if (cached) {
      markOneCompleted();
      return cached;
    }

    const existingPromise = inFlightCache.get(text);
    if (existingPromise) {
      const resolved = await existingPromise;
      markOneCompleted();
      return resolved;
    }

    const { protectedText, tokens } = protectPlaceholders(text);

    const promise = new Promise<string>((resolve, reject) => {
      queue.push({
        originalText: text,
        protectedText,
        tokens,
        resolve,
        reject,
      });

      if (queue.length >= TRANSLATE_BATCH_SIZE) {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        void flushQueue();
      } else {
        scheduleFlush();
      }
    });

    inFlightCache.set(text, promise);

    return promise;
  };
}

async function buildZipOutput(
  sources: UploadedSource[],
  replacements: Record<string, Uint8Array>,
  extraFiles?: Record<string, Uint8Array>
) {
  const zip = new JSZip();

  for (const source of sources) {
    zip.file(source.path, replacements[source.path] || source.data);
  }

  if (extraFiles) {
    for (const [path, data] of Object.entries(extraFiles)) {
      zip.file(path, data);
    }
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function createTranslationJob(params: {
  sources: UploadedSource[];
  target: string;
  sourceLang: string;
}) {
  cleanupOldJobs();

  const job: TranslationJob = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    state: "queued",
    stageLabel: "En cola",
    target: params.target,
    sourceLang: params.sourceLang,
    sources: params.sources,
    totalTexts: 0,
    completedTexts: 0,
    progress: 0,
    etaSeconds: null,
    currentFile: "",
    currentStage: "",
    error: null,
    outputName: null,
    outputContentType: null,
    outputData: null,
  };

  jobs.set(job.id, job);
  return job;
}

export function getTranslationJob(jobId: string) {
  cleanupOldJobs();
  return jobs.get(jobId) || null;
}

export async function runTranslationJob(jobId: string) {
  const job = jobs.get(jobId);

  if (!job) {
    return;
  }

  try {
    setJobProgress(job, {
      state: "preparing",
      stageLabel: "Preparando traducción...",
      currentStage: "preparing",
      currentFile: "",
      progress: 0,
      etaSeconds: null,
      error: null,
    });

    const { sources, target, sourceLang } = job;

    if (sources.length === 0) {
      throw new Error("No se recibió ningún archivo.");
    }

    const replacements: Record<string, Uint8Array> = {};
    const extraFiles: Record<string, Uint8Array> = {};

    const langTasks: Array<{
      type: "folder" | "direct";
      sourcePath: string;
      sourceText: string;
      outputPath: string;
    }> = [];

    if (hasLangFolder(sources)) {
      const sourceLocale = pickBestSourceLocale(sources);
      const targetLocale = targetLangToLocale(target);
      const targetLocaleFilename = targetLangToLocaleFilename(target);

      if (sourceLocale) {
        const localeFolderFiles = getLangLocaleFolderFiles(sources)
          .filter((item) => item.locale === sourceLocale)
          .filter((item) => !!item.source.text);

        for (const item of localeFolderFiles) {
          if (!item.source.text) continue;

          const sourceRoot = normalizePath(item.root);
          const newRoot = sourceRoot.replace(
            new RegExp(`${item.locale}$`, "i"),
            targetLocale
          );
          const newPath = item.path.replace(sourceRoot, newRoot);

          langTasks.push({
            type: "folder",
            sourcePath: item.path,
            sourceText: item.source.text,
            outputPath: newPath,
          });
        }

        const directLocaleFiles = getLangLocaleFiles(sources)
          .filter((item) => item.locale === sourceLocale)
          .filter((item) => isSnbtPath(item.path))
          .filter((item) => !!item.source.text);

        for (const item of directLocaleFiles) {
          if (!item.source.text) continue;

          const dir = getDirName(item.path);
          const newPath = dir
            ? `${dir}/${targetLocaleFilename}`
            : targetLocaleFilename;

          langTasks.push({
            type: "direct",
            sourcePath: item.path,
            sourceText: item.source.text,
            outputPath: newPath,
          });
        }
      }
    }

    const chapterSources = pickChapterSources(sources).filter(
      (source) => !!source.text
    );

const validChapterSources = chapterSources.filter((source) => !!source.text);

    const totalLangTexts = langTasks.reduce(
      (sum, task) => sum + extractLangTexts(task.sourceText).length,
      0
    );

const totalChapterTexts = validChapterSources.reduce((sum, source) => {
  const count = extractChapterTexts(source.text || "").length;
  return sum + (count > 0 ? count : 1);
}, 0);

    const totalTexts = totalLangTexts + totalChapterTexts;

    setJobProgress(job, {
      totalTexts,
      completedTexts: 0,
      progress: 0,
      etaSeconds: null,
    });

    if (totalTexts <= 0) {
      throw new Error(
        'No se encontró texto traducible en chapters ni en lang.\nTip: sube la carpeta completa de FTB Quests.'
      );
    }

    const translator = createProgressTranslator(job, sourceLang, target);

    setJobProgress(job, {
      state: "translating",
      stageLabel: "Traduciendo lang...",
      currentStage: "lang",
    });

    await mapLimit(langTasks, CONCURRENCY, async (task) => {
      setJobProgress(job, {
        currentFile: task.sourcePath,
        currentStage: "lang",
        stageLabel: "Traduciendo lang...",
      });

      const translated = await translateLangContent(task.sourceText, translator);
      extraFiles[task.outputPath] = encodeText(translated);
    });

    setJobProgress(job, {
      state: "translating",
      stageLabel: "Traduciendo chapters...",
      currentStage: "chapters",
    });

    await mapLimit(validChapterSources, CONCURRENCY, async (source) => {
      if (!source.text) return;

      setJobProgress(job, {
        currentFile: source.path,
        currentStage: "chapters",
        stageLabel: "Traduciendo chapters...",
      });

      const translated = await translateChapterContent(source.text, translator);
      replacements[source.path] = encodeText(translated);
    });

    const hasAnyOutput =
      Object.keys(replacements).length > 0 || Object.keys(extraFiles).length > 0;

    if (!hasAnyOutput) {
      throw new Error(
        'No se encontró texto traducible en chapters ni en lang.\nTip: sube la carpeta completa de FTB Quests.'
      );
    }

    setJobProgress(job, {
      state: "packing",
      stageLabel: "Empaquetando resultado...",
      currentStage: "packing",
      currentFile: "",
      progress: Math.max(job.progress, 99),
      etaSeconds: null,
    });

    if (
      sources.length === 1 &&
      Object.keys(replacements).length === 1 &&
      Object.keys(extraFiles).length === 0 &&
      validChapterSources.length === 1
    ) {
      const only = validChapterSources[0];
      const onlyData = replacements[only.path];

      setJobProgress(job, {
        state: "done",
        stageLabel: "Completado",
        currentStage: "done",
        currentFile: "",
        progress: 100,
        etaSeconds: 0,
        outputName: only.name,
        outputContentType: "text/plain; charset=utf-8",
        outputData: onlyData,
      });

      return;
    }

    const zipData = await buildZipOutput(sources, replacements, extraFiles);

    setJobProgress(job, {
      state: "done",
      stageLabel: "Completado",
      currentStage: "done",
      currentFile: "",
      progress: 100,
      etaSeconds: 0,
      outputName: "ftbquests-translated.zip",
      outputContentType: "application/zip",
      outputData: zipData,
    });
  } catch (error) {
    setJobProgress(job, {
      state: "error",
      stageLabel: "Error",
      currentStage: "error",
      etaSeconds: null,
      error: error instanceof Error ? error.message : "No se pudo traducir.",
    });
  }
}

export function getJobResultResponse(job: TranslationJob) {
  if (!job.outputData || !job.outputContentType || !job.outputName) {
    return null;
  }

  return new Response(uint8ToArrayBuffer(job.outputData), {
    headers: {
      "Content-Type": job.outputContentType,
      "X-Output-Name": job.outputName,
    },
  });
}