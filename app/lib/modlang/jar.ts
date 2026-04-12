import JSZip from "jszip";
import { countLines } from "./helpers";
import type { AnalyzeJarReturn } from "./types";

function mapLangToMinecraft(lang: string) {
  const normalized = lang.toLowerCase();

  const map: Record<string, string> = {
    es: "es_es",
    "es-es": "es_es",
    "es-mx": "es_mx",
    "es-ar": "es_ar",
    en: "en_us",
    "en-us": "en_us",
    "en-gb": "en_gb",
    fr: "fr_fr",
    de: "de_de",
    it: "it_it",
    pt: "pt_br",
    "pt-br": "pt_br",
    "pt-pt": "pt_pt",
    ru: "ru_ru",
    ja: "ja_jp",
    zh: "zh_cn",
    "zh-cn": "zh_cn",
    "zh-tw": "zh_tw",
  };

  return map[normalized] || `${normalized}_${normalized}`;
}

function extractModIdFromLangPath(path: string | null) {
  if (!path) return null;

  const match = path.match(/^assets\/([^/]+)\/lang\//i);
  return match ? match[1] : null;
}

export async function analyzeJar(
  file: File,
  sourceLang = "en",
  targetLang = "es"
): Promise<AnalyzeJarReturn> {
  if (!file.name.toLowerCase().endsWith(".jar")) {
    throw new Error("El archivo debe ser un .jar");
  }

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const sourceLangFile = mapLangToMinecraft(sourceLang);
  const targetLangFile = mapLangToMinecraft(targetLang);

  let sourcePath: string | null = null;
  let targetPath: string | null = null;

  const allPaths = Object.keys(zip.files);

  for (const path of allPaths) {
    const lowerPath = path.toLowerCase();

    if (
      new RegExp(`^assets\\/[^/]+\\/lang\\/${sourceLangFile}\\.json$`).test(
        lowerPath
      )
    ) {
      sourcePath = path;
    }

    if (
      new RegExp(`^assets\\/[^/]+\\/lang\\/${targetLangFile}\\.json$`).test(
        lowerPath
      )
    ) {
      targetPath = path;
    }
  }

  const modId = extractModIdFromLangPath(sourcePath || targetPath);

  if (!sourcePath) {
    return {
      result: {
        sourcePath: null,
        targetPath: null,
        sourceLines: 0,
        targetLines: 0,
        sourceLangFile,
        targetLangFile,
        message: `Este mod no tiene ${sourceLangFile}.json, así que no se puede usar como base.`,
      },
      parsedSource: null,
      parsedTarget: null,
      showContinue: false,
      modId,
    };
  }

  const sourceRaw = await zip.file(sourcePath)?.async("string");
  if (!sourceRaw) {
    throw new Error(`No se pudo leer ${sourceLangFile}.json`);
  }

  const parsedSource = JSON.parse(sourceRaw) as Record<string, string>;

  const targetRaw = targetPath ? await zip.file(targetPath)?.async("string") : "";
  let parsedTarget: Record<string, string> | null = null;

  if (targetRaw) {
    try {
      parsedTarget = JSON.parse(targetRaw);
    } catch {
      parsedTarget = null;
    }
  }

  const sourceLines = countLines(sourceRaw);
  const targetLines = countLines(targetRaw || "");

  let message = "";
  let canContinue = false;

  if (!targetPath) {
    message = `No existe ${targetLangFile}.json. Se traducirá desde ${sourceLangFile}.`;
    canContinue = true;
  } else if (targetLines < sourceLines) {
    message = `${targetLangFile}.json tiene menos líneas que ${sourceLangFile}.json (${targetLines} vs ${sourceLines}). Se reemplazará.`;
    canContinue = true;
  } else {
    message = `${targetLangFile}.json ya tiene la misma cantidad o más líneas (${targetLines} vs ${sourceLines}).`;
    canContinue = false;
  }

  return {
    result: {
      sourcePath,
      targetPath,
      sourceLines,
      targetLines,
      sourceLangFile,
      targetLangFile,
      message,
    },
    parsedSource,
    parsedTarget,
    showContinue: canContinue,
    modId,
  };
}

export async function buildTranslatedJar(
  file: File,
  analysis: AnalyzeJarReturn,
  translatedEntries: Record<string, string>,
  targetLang = "es"
) {
  if (!analysis.result.sourcePath) {
    throw new Error(
      `No existe ${analysis.result.sourceLangFile || mapLangToMinecraft("en")}.json`
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const targetFile = mapLangToMinecraft(targetLang);

  const outputPath =
    analysis.result.targetPath ||
    analysis.result.sourcePath.replace(
      /[a-z]{2}_[a-z]{2}\.json$/i,
      `${targetFile}.json`
    );

  const jsonText = JSON.stringify(translatedEntries, null, 2);

  zip.file(outputPath, jsonText);

  const newJarBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });

  return {
    blob: newJarBlob,
    finalName: file.name,
  };
}

export async function buildCombinedResourcePack(params: {
  files: Array<{
    fileName: string;
    modId: string;
    translatedEntries: Record<string, string>;
  }>;
  targetLang?: string;
  packName?: string;
}) {
  const {
    files,
    targetLang = "es",
    packName = "ModLang-ResourcePack",
  } = params;

  const zip = new JSZip();
  const targetFile = mapLangToMinecraft(targetLang);

  zip.file(
    "pack.mcmeta",
    JSON.stringify(
      {
        pack: {
          pack_format: 34,
          description: `ModLang generated resource pack (${targetFile})`,
        },
      },
      null,
      2
    )
  );

  for (const item of files) {
    const langPath = `assets/${item.modId}/lang/${targetFile}.json`;
    zip.file(langPath, JSON.stringify(item.translatedEntries, null, 2));
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });

  return {
    blob,
    finalName: `${packName}-${targetFile}.zip`,
  };
}