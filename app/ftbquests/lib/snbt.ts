export type SnbtEntry = {
  key: "title" | "subtitle" | "description";
  kind: "string" | "array";
  start: number;
  end: number;
  quote?: '"' | "'";
  raw?: string;
  values?: Array<{
    quote: '"' | "'";
    raw: string;
    start: number;
    end: number;
  }>;
};

const TARGET_KEYS = new Set(["title", "subtitle", "description"]);

function isSpace(char: string | undefined) {
  return !!char && /\s/.test(char);
}

function skipSpaces(input: string, index: number) {
  while (index < input.length && isSpace(input[index])) index++;
  return index;
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
        quote: quote as '"' | "'",
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
    if (!/[A-Za-z0-9_\-]/.test(ch)) break;
    value += ch;
    i++;
  }

  if (!value) return null;

  return {
    value,
    start: index,
    end: i,
  };
}

function readKey(input: string, index: number) {
  const quoted = readQuoted(input, index);
  if (quoted) {
    return {
      value: quoted.raw,
      start: quoted.start,
      end: quoted.end,
    };
  }

  return readBareKey(input, index);
}

function readArrayOfStrings(input: string, index: number) {
  if (input[index] !== "[") return null;

  let i = index + 1;
  const values: Array<{
    quote: '"' | "'";
    raw: string;
    start: number;
    end: number;
  }> = [];

  while (i < input.length) {
    i = skipSpaces(input, i);

    if (input[i] === "]") {
      return {
        values,
        start: index,
        end: i + 1,
      };
    }

    const quoted = readQuoted(input, i);
    if (!quoted) return null;

    values.push(quoted);
    i = quoted.end;
    i = skipSpaces(input, i);

    if (input[i] === ",") {
      i++;
      continue;
    }

    if (input[i] === "]") {
      return {
        values,
        start: index,
        end: i + 1,
      };
    }

    return null;
  }

  return null;
}

export function unescapeSnbtString(value: string) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

export function escapeSnbtString(value: string, quote: '"' | "'") {
  let out = value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
  if (quote === '"') out = out.replace(/"/g, '\\"');
  else out = out.replace(/'/g, "\\'");
  return out;
}

export function findTranslatableEntries(input: string): SnbtEntry[] {
  const entries: SnbtEntry[] = [];
  let i = 0;

  while (i < input.length) {
    const keyInfo = readKey(input, i);

    if (!keyInfo) {
      i++;
      continue;
    }

    const key = keyInfo.value.toLowerCase();
    let j = skipSpaces(input, keyInfo.end);

    if (input[j] !== ":") {
      i = keyInfo.end;
      continue;
    }

    j++;
    j = skipSpaces(input, j);

    if (!TARGET_KEYS.has(key)) {
      i = j;
      continue;
    }

    const quoted = readQuoted(input, j);
    if (quoted) {
      entries.push({
        key: key as "title" | "subtitle" | "description",
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
        key: key as "title" | "subtitle" | "description",
        kind: "array",
        start: arr.start,
        end: arr.end,
        values: arr.values,
      });
      i = arr.end;
      continue;
    }

    i = j + 1;
  }

  return entries;
}

export function extractTexts(input: string) {
  const entries = findTranslatableEntries(input);
  const texts: string[] = [];

  for (const entry of entries) {
    if (entry.kind === "string" && entry.raw != null) {
      const text = unescapeSnbtString(entry.raw).trim();
      if (text) texts.push(text);
    }

    if (entry.kind === "array" && entry.values) {
      for (const value of entry.values) {
        const text = unescapeSnbtString(value.raw).trim();
        if (text) texts.push(text);
      }
    }
  }

  return texts;
}