import JSZip from "jszip";
import {
  detectLanguageFromLocaleFilename,
  detectLanguageHeuristically,
  getLangLocaleFiles,
  getLangLocaleFolderFiles,
  getVirtualPath,
  hasLangFolder,
  isSnbtPath,
  isZipPath,
  pickBestSourceLocale,
  pickChapterSources,
  type UploadedSource,
} from "../../lib/detect";
import { extractLangTexts } from "../../lib/langParser";
import { extractChapterTexts } from "../../lib/chapterParser";

export const runtime = "nodejs";

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

function isRelevantLocaleFolderRelativePath(relativePath: string) {
  const rel = normalizePath(relativePath).toLowerCase();

  return (
    (rel.startsWith("chapters/") && rel.endsWith(".snbt")) ||
    rel === "chapter_groups.snbt" ||
    rel === "quests.snbt"
  );
}

async function decodeUploadedSources(req: Request): Promise<UploadedSource[]> {
  const form = await req.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const paths = form.getAll("paths").map(String);

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

  return sources;
}

export async function POST(req: Request) {
  try {
    const sources = await decodeUploadedSources(req);

    if (sources.length === 0) {
      return Response.json(
        { ok: false, error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }


    if (hasLangFolder(sources)) {
      const sourceLocale = pickBestSourceLocale(sources);

      const directLocaleFiles = getLangLocaleFiles(sources)
        .filter((item) => item.locale === sourceLocale)
        .filter((item) => isSnbtPath(item.path))
        .filter((item) => !!item.source.text);

      const localeFolderFiles = getLangLocaleFolderFiles(sources)
        .filter((item) => item.locale === sourceLocale)
        .filter((item) => !!item.source.text)
        .filter((item) => isRelevantLocaleFolderRelativePath(item.relativePath));

      const langSources = [
        ...directLocaleFiles.map((item) => item.source),
        ...localeFolderFiles.map((item) => item.source),
      ];

      const langTexts = langSources.flatMap((source) =>
        source.text ? extractLangTexts(source.text) : []
      );

      if (langTexts.length > 0) {
        const selectedPath =
          directLocaleFiles[0]?.path ||
          localeFolderFiles[0]?.path ||
          null;

        const detectedLang =
          (selectedPath ? detectLanguageFromLocaleFilename(selectedPath) : null) ||
          detectLanguageHeuristically(langTexts);

        return Response.json({
          ok: true,
          mode: "lang",
          detectedLang,
          entriesFound: langTexts.length,
          selectedPath,
        });
      }
    }


    const chapterSources = pickChapterSources(sources).filter(
      (source) => !!source.text
    );

    const chapterTexts = chapterSources.flatMap((source) =>
      source.text ? extractChapterTexts(source.text) : []
    );

    if (chapterTexts.length > 0) {
      return Response.json({
        ok: true,
        mode: "chapters",
        detectedLang: detectLanguageHeuristically(chapterTexts),
        entriesFound: chapterTexts.length,
        selectedPath: chapterSources[0]?.path || null,
      });
    }


    return Response.json(
      {
        ok: false,
        error:
          "No se encontró texto traducible en chapters ni en lang.",
        tip: "Sube la carpeta completa de FTB Quests.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("FTB analyze error:", error);

    return Response.json(
      { ok: false, error: "No se pudo analizar la entrada." },
      { status: 500 }
    );
  }
}