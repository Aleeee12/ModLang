import { shouldSkipTranslation } from "./placeholders";

type Quote = '"' | "'";

type LangStringEntry = {
  kind: "string";
  start: number;
  end: number;
  quote: Quote;
  raw: string;
};

type LangArrayItem = {
  start: number;
  end: number;
  quote: Quote;
  raw: string;
};

type LangArrayEntry = {
  kind: "array";
  start: number;
  end: number;
  items: LangArrayItem[];
};

type LangEntry = LangStringEntry | LangArrayEntry;

function isSpace(char: string | undefined) {
  return !!char && /\s/.test(char);
}

function skipSpaces(input: string, index: number) {
  while (index < input.length && isSpace(input[index])) index++;
  return index;
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

function readQuoted(input: string, index: number) {
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

function readArrayOfStrings(input: string, index: number) {
  if (input[index] !== "[") return null;

  let i = index + 1;
  const items: LangArrayItem[] = [];

  while (i < input.length) {
    i = skipSpaces(input, i);

    if (input[i] === "]") {
      return {
        start: index,
        end: i + 1,
        items,
      };
    }

    const quoted = readQuoted(input, i);
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

function isTargetKey(key: string) {
  const lower = key.toLowerCase();

  return (
    lower.endsWith(".title") ||
    lower.endsWith(".subtitle") ||
    lower.endsWith(".chapter_subtitle") ||
    lower.endsWith(".quest_subtitle") ||
    lower.endsWith(".quest_desc")
  );
}

export function unescapeLangString(value: string) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

export function escapeLangString(value: string, quote: Quote) {
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

function findEntries(input: string): LangEntry[] {
  const entries: LangEntry[] = [];
  let i = 0;

  while (i < input.length) {
    const keyInfo = readBareKey(input, i);

    if (!keyInfo) {
      i++;
      continue;
    }

    const key = keyInfo.value;
    let j = skipSpaces(input, keyInfo.end);

    if (input[j] !== ":") {
      i = keyInfo.end;
      continue;
    }

    j++;
    j = skipSpaces(input, j);

    if (!isTargetKey(key)) {
      i = j;
      continue;
    }

    const quoted = readQuoted(input, j);
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

export function extractLangTexts(input: string) {
  const entries = findEntries(input);
  const texts: string[] = [];

  for (const entry of entries) {
    if (entry.kind === "string") {
      const text = unescapeLangString(entry.raw);
      if (!shouldSkipTranslation(text)) {
        texts.push(text);
      }
    } else {
      for (const item of entry.items) {
        const text = unescapeLangString(item.raw);
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

export async function translateLangContent(
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
      const originalText = unescapeLangString(entry.raw);

      if (shouldSkipTranslation(originalText)) {
        result += `${entry.quote}${escapeLangString(
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

      result += `${entry.quote}${escapeLangString(
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
      const originalText = unescapeLangString(item.raw);

      if (shouldSkipTranslation(originalText)) {
        lines.push(
          `${itemIndent}${item.quote}${escapeLangString(
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
        `${itemIndent}${item.quote}${escapeLangString(
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