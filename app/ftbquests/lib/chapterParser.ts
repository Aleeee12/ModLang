import { shouldSkipTranslation } from "./placeholders";

type Quote = '"' | "'";

type ChapterStringEntry = {
  kind: "string";
  start: number;
  end: number;
  quote: Quote;
  raw: string;
};

type ChapterArrayItem = {
  start: number;
  end: number;
  quote: Quote;
  raw: string;
};

type ChapterArrayEntry = {
  kind: "array";
  start: number;
  end: number;
  items: ChapterArrayItem[];
};

type ChapterEntry = ChapterStringEntry | ChapterArrayEntry;

const TARGET_KEYS = new Set(["title", "subtitle", "description"]);

function isSpace(char: string | undefined) {
  return !!char && /\s/.test(char);
}

function skipSpaces(input: string, index: number) {
  while (index < input.length && isSpace(input[index])) index++;
  return index;
}

function readQuotedKeyOrValue(input: string, index: number) {
  const quote = input[index];
  if (quote !== '"' && quote !== "'") return null;

  let i = index + 1;
  let raw = "";
  let escaped = false;

  while (i < input.length) {
    const ch = input[i];

    if (escaped) {
      raw += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === "\\") {
      raw += ch;
      escaped = true;
      i++;
      continue;
    }

    if (ch === quote) {
      return {
        quote: quote as Quote,
        raw,
        start: index,
        end: i + 1,
      };
    }

    raw += ch;
    i++;
  }

  return null;
}

function readBareKey(input: string, index: number) {
  let i = index;
  let value = "";

  while (i < input.length) {
    const ch = input[i];
    if (!/[A-Za-z0-9_.-]/.test(ch)) break;
    value += ch;
    i++;
  }

  if (!value) return null;

  return { value, start: index, end: i };
}

function readKey(input: string, index: number) {
  const quoted = readQuotedKeyOrValue(input, index);
  if (quoted) {
    return { value: quoted.raw, start: quoted.start, end: quoted.end };
  }

  return readBareKey(input, index);
}

function readArrayOfStrings(input: string, index: number) {
  if (input[index] !== "[") return null;

  let i = index + 1;
  const items: ChapterArrayItem[] = [];

  while (i < input.length) {
    i = skipSpaces(input, i);

    if (input[i] === "]") {
      return {
        start: index,
        end: i + 1,
        items,
      };
    }

    const quoted = readQuotedKeyOrValue(input, i);
    if (!quoted) return null;

    items.push(quoted);
    i = quoted.end;

    while (i < input.length) {
      if (input[i] === ",") {
        i++;
        break;
      }

      if (isSpace(input[i])) {
        i++;
        continue;
      }

      break;
    }
  }

  return null;
}

export function unescapeChapterString(value: string) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

export function escapeChapterString(value: string, quote: Quote) {
  let output = value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");

  if (quote === '"') {
    output = output.replace(/"/g, '\\"');
  } else {
    output = output.replace(/'/g, "\\'");
  }

  return output;
}

function getLineIndent(input: string, index: number) {
  let lineStart = index;

  while (lineStart > 0 && input[lineStart - 1] !== "\n") {
    lineStart--;
  }

  const indentMatch = input.slice(lineStart, index).match(/^\s*/);
  return indentMatch?.[0] || "";
}

function findEntries(input: string): ChapterEntry[] {
  const entries: ChapterEntry[] = [];
  let i = 0;

  while (i < input.length) {
    const keyInfo = readKey(input, i);

    if (!keyInfo) {
      i++;
      continue;
    }

    let j = skipSpaces(input, keyInfo.end);

    if (input[j] !== ":") {
      i = keyInfo.end;
      continue;
    }

    j++;
    j = skipSpaces(input, j);

    const key = keyInfo.value.toLowerCase();

    if (!TARGET_KEYS.has(key)) {
      i = j;
      continue;
    }

    const quoted = readQuotedKeyOrValue(input, j);
    if (quoted) {
      entries.push({
        kind: "string",
        start: quoted.start,
        end: quoted.end,
        quote: quoted.quote,
        raw: quoted.raw,
      });
      i = quoted.end;
      continue;
    }

    const arr = readArrayOfStrings(input, j);
    if (arr) {
      entries.push({
        kind: "array",
        start: arr.start,
        end: arr.end,
        items: arr.items,
      });
      i = arr.end;
      continue;
    }

    i = j + 1;
  }

  return entries;
}

export function extractChapterTexts(input: string) {
  const entries = findEntries(input);
  const texts: string[] = [];

  for (const entry of entries) {
    if (entry.kind === "string") {
      const text = unescapeChapterString(entry.raw);
      if (!shouldSkipTranslation(text)) {
        texts.push(text);
      }
    } else {
      for (const item of entry.items) {
        const text = unescapeChapterString(item.raw);
        if (!shouldSkipTranslation(text)) {
          texts.push(text);
        }
      }
    }
  }

  return texts;
}

type TranslateProgressCallback = (info: {
  totalDelta: number;
  originalText: string;
  translatedText: string;
}) => void | Promise<void>;

export async function translateChapterContent(
  input: string,
  translator: (text: string) => Promise<string>,
  onProgress?: TranslateProgressCallback
) {
  const entries = findEntries(input);

  if (entries.length === 0) return input;

  let result = "";
  let cursor = 0;

  for (const entry of entries) {
    result += input.slice(cursor, entry.start);

    if (entry.kind === "string") {
      const originalText = unescapeChapterString(entry.raw);

      if (shouldSkipTranslation(originalText)) {
        result += `${entry.quote}${escapeChapterString(
          originalText,
          entry.quote
        )}${entry.quote}`;
        cursor = entry.end;
        continue;
      }

      const translatedText = await translator(originalText);

      if (onProgress) {
        await onProgress({
          totalDelta: 1,
          originalText,
          translatedText,
        });
      }

      result += `${entry.quote}${escapeChapterString(
        translatedText,
        entry.quote
      )}${entry.quote}`;

      cursor = entry.end;
      continue;
    }

    const baseIndent = getLineIndent(input, entry.start);
    const itemIndent = `${baseIndent}\t`;
    const lines: string[] = ["["];

    for (const item of entry.items) {
      const originalText = unescapeChapterString(item.raw);

      if (shouldSkipTranslation(originalText)) {
        lines.push(
          `${itemIndent}${item.quote}${escapeChapterString(
            originalText,
            item.quote
          )}${item.quote}`
        );
        continue;
      }

      const translatedText = await translator(originalText);

      if (onProgress) {
        await onProgress({
          totalDelta: 1,
          originalText,
          translatedText,
        });
      }

      lines.push(
        `${itemIndent}${item.quote}${escapeChapterString(
          translatedText,
          item.quote
        )}${item.quote}`
      );
    }

    lines.push(`${baseIndent}]`);

    result += lines.join("\n");
    cursor = entry.end;
  }

  result += input.slice(cursor);

  return result;
}