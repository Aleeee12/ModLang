export type UploadedSource = {
  path: string;
  name: string;
  data: Uint8Array;
  text?: string;
};

export type LangLocaleFile = {
  locale: string;
  path: string;
  source: UploadedSource;
};

export type LangLocaleFolderFile = {
  locale: string;
  root: string;
  relativePath: string;
  path: string;
  source: UploadedSource;
};

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

function getBaseName(path: string) {
  const normalized = normalizePath(path);
  return normalized.split("/").pop() || path;
}

function getDirName(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/");
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/i, "");
}

export function isSnbtPath(path: string) {
  return normalizePath(path).toLowerCase().endsWith(".snbt");
}

export function isZipPath(path: string) {
  return normalizePath(path).toLowerCase().endsWith(".zip");
}

export function isJsonPath(path: string) {
  return normalizePath(path).toLowerCase().endsWith(".json");
}

export function isLocaleName(value: string) {
  return /^[a-z]{2}(?:[_-][a-z]{2})?$/i.test(value.trim());
}

export function normalizeLocale(value: string) {
  return value.trim().replace(/-/g, "_").toLowerCase();
}

export function localeToLanguage(locale: string): string | null {
  const normalized = normalizeLocale(locale);

  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("pt")) return "pt";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("zh")) return "zh";

  return null;
}

export function detectLanguageFromLocaleFilename(path: string): string | null {
  const base = stripExtension(getBaseName(path));
  return isLocaleName(base) ? localeToLanguage(base) : null;
}

export function targetLangToLocale(targetLang: string) {
  const normalized = targetLang.toLowerCase();

  switch (normalized) {
    case "en":
      return "en_us";
    case "es":
      return "es_es";
    case "pt":
      return "pt_br";
    case "fr":
      return "fr_fr";
    case "de":
      return "de_de";
    case "it":
      return "it_it";
    case "ru":
      return "ru_ru";
    case "ja":
      return "ja_jp";
    case "zh":
      return "zh_cn";
    default:
      return normalized;
  }
}

export function targetLangToLocaleFilename(targetLang: string) {
  return `${targetLangToLocale(targetLang)}.snbt`;
}

export function isChapterFilePath(path: string) {
  const normalized = normalizePath(path).toLowerCase();
  const base = getBaseName(normalized).toLowerCase();

  if (!normalized.endsWith(".snbt")) return false;

  if (normalized.includes("/chapters/")) return true;

  if (base === "quests.snbt") return true;
  if (base === "chapter_groups.snbt") return true;

  return true;
}

/**
 * Detecta archivos locale directos:
 * - lang/en_us.snbt
 * - lang/en_us.json
 * - en_us.snbt
 * - es_es.snbt
 */
export function isLocaleFilePath(path: string) {
  const normalized = normalizePath(path);
  const base = stripExtension(getBaseName(normalized));
  const ext = normalized.toLowerCase();

  if (!isLocaleName(base)) return false;
  return ext.endsWith(".snbt") || ext.endsWith(".json");
}

/**
 * Detecta si el path pertenece a una carpeta locale:
 * - lang/en_us/chapters/...
 * - lang/es_es/chapter_groups.snbt
 * - en_us/chapters/...
 * - es_es/...
 */
export function getLocaleFolderInfo(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = normalizeLocale(parts[i]);

    if (!isLocaleName(part)) continue;

    const before = parts[i - 1]?.toLowerCase();
    const afterParts = parts.slice(i + 1);
    const root = parts.slice(0, i + 1).join("/");
    const relativePath = afterParts.join("/");

    const looksLikeLangScoped = before === "lang";
    const looksLikeLocaleRoot =
      relativePath.length > 0 &&
      (
        relativePath.startsWith("chapters/") ||
        relativePath === "chapter_groups.snbt" ||
        relativePath === "quests.snbt" ||
        relativePath.endsWith(".snbt")
      );

    if (looksLikeLangScoped || looksLikeLocaleRoot) {
      return {
        locale: part,
        root,
        relativePath,
      };
    }
  }

  return null;
}

export function isLangFilePath(path: string) {
  const normalized = normalizePath(path).toLowerCase();

  if (normalized.includes("/lang/")) {
    return isSnbtPath(normalized) || isJsonPath(normalized);
  }

  if (isLocaleFilePath(normalized)) {
    return true;
  }

  return getLocaleFolderInfo(normalized) !== null;
}

export function getLangLocaleFiles(sources: UploadedSource[]): LangLocaleFile[] {
  return sources
    .filter((source) => isLocaleFilePath(source.path))
    .map((source) => ({
      locale: normalizeLocale(stripExtension(getBaseName(source.path))),
      path: normalizePath(source.path),
      source,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function getLangLocaleFolderFiles(
  sources: UploadedSource[]
): LangLocaleFolderFile[] {
  return sources
    .map((source) => {
      const info = getLocaleFolderInfo(source.path);
      if (!info) return null;

      return {
        locale: info.locale,
        root: info.root,
        relativePath: info.relativePath,
        path: normalizePath(source.path),
        source,
      };
    })
    .filter((item): item is LangLocaleFolderFile => item !== null)
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Devuelve archivos SNBT lang "planos".
 * Ej:
 * - lang/en_us.snbt
 * - en_us.snbt
 */
export function pickLangSources(sources: UploadedSource[]) {
  return getLangLocaleFiles(sources)
    .filter((item) => isSnbtPath(item.path))
    .map((item) => item.source);
}

/**
 * Compatibilidad con tu código viejo.
 * Devuelve el primero, pero ya no es la función ideal.
 */
export function pickLangSource(sources: UploadedSource[]) {
  return pickLangSources(sources)[0] || null;
}

export function pickChapterSources(sources: UploadedSource[]) {
  return sources.filter(
    (source) => isSnbtPath(source.path) && isChapterFilePath(source.path)
  );
}

export function pickLocaleChapterSources(sources: UploadedSource[]) {
  return getLangLocaleFolderFiles(sources)
    .filter((item) => {
      const rel = item.relativePath.toLowerCase();
      return rel.startsWith("chapters/") && rel.endsWith(".snbt");
    })
    .map((item) => item.source);
}

export function pickLocaleSupportSources(sources: UploadedSource[]) {
  return getLangLocaleFolderFiles(sources)
    .filter((item) => {
      const rel = item.relativePath.toLowerCase();
      return (
        rel === "chapter_groups.snbt" ||
        rel === "quests.snbt" ||
        (rel.startsWith("chapters/") && rel.endsWith(".snbt"))
      );
    })
    .map((item) => item.source);
}

export function hasLangFolder(sources: UploadedSource[]) {
  return (
    getLangLocaleFiles(sources).length > 0 ||
    getLangLocaleFolderFiles(sources).length > 0
  );
}

export function getVirtualPath(file: File, providedPath?: string): string {
  if (providedPath && providedPath.trim()) return normalizePath(providedPath);

  const withRelative = file as File & { webkitRelativePath?: string };
  if (withRelative.webkitRelativePath) {
    return normalizePath(withRelative.webkitRelativePath);
  }

  return normalizePath(file.name);
}

export function detectLanguageHeuristically(texts: string[]) {
  const sample = ` ${texts.join(" ").toLowerCase()} `;

  if (!sample.trim()) return "unknown";

  const spanishWords = [
    " de ",
    " la ",
    " el ",
    " los ",
    " las ",
    " un ",
    " una ",
    " para ",
    " con ",
    " que ",
    " misión ",
    " capítulo ",
    " recompensa ",
    " completar ",
    " derrotar ",
    " encontrar ",
  ];

  const englishWords = [
    " the ",
    " and ",
    " you ",
    " your ",
    " with ",
    " quest ",
    " chapter ",
    " reward ",
    " complete ",
    " defeat ",
    " collect ",
    " find ",
    " unlock ",
  ];

  let esScore = 0;
  let enScore = 0;

  for (const word of spanishWords) {
    if (sample.includes(word)) esScore++;
  }

  for (const word of englishWords) {
    if (sample.includes(word)) enScore++;
  }

  if (esScore === 0 && enScore === 0) return "unknown";
  return esScore >= enScore ? "es" : "en";
}

/**
 * Elige el mejor locale base para traducir.
 * Prioriza en_us, luego en_*, luego el primero disponible.
 */
export function pickBestSourceLocale(sources: UploadedSource[]) {
  const locales = new Set<string>();

  for (const item of getLangLocaleFiles(sources)) {
    locales.add(item.locale);
  }

  for (const item of getLangLocaleFolderFiles(sources)) {
    locales.add(item.locale);
  }

  const list = Array.from(locales);

  if (list.includes("en_us")) return "en_us";

  const anyEnglish = list.find((locale) => locale.startsWith("en_") || locale === "en");
  if (anyEnglish) return anyEnglish;

  return list[0] || null;
}

/**
 * Devuelve el root real de una carpeta locale, por ejemplo:
 * - lang/en_us
 * - en_us
 */
export function findLocaleRoot(
  sources: UploadedSource[],
  locale: string
) {
  const normalizedLocale = normalizeLocale(locale);

  const folder = getLangLocaleFolderFiles(sources).find(
    (item) => item.locale === normalizedLocale
  );

  if (folder) return folder.root;

  const file = getLangLocaleFiles(sources).find(
    (item) => item.locale === normalizedLocale
  );

  if (file) return getDirName(file.path);

  return null;
}