import { NextResponse } from "next/server";
import { incrementTranslations } from "@/app/lib/db/stats";

type Entries = Record<string, string>;

const CONCURRENCY = 10;

function protectPlaceholders(text: string) {
  const tokens: string[] = [];

  const protectedText = text.replace(
    /%(\d+\$)?[sdif]|%%|\\n|\{[0-9]+\}|§[0-9a-fk-or]/gi,
    (match) => {
      const token = `__PH_${tokens.length}__`;
      tokens.push(match);
      return token;
    }
  );

  return { protectedText, tokens };
}

function restorePlaceholders(text: string, tokens: string[]) {
  let result = text;

  tokens.forEach((tokenValue, index) => {
    const token = `__PH_${index}__`;
    result = result.split(token).join(tokenValue);
  });

  return result;
}

async function translateTextGoogle(
  text: string,
  source = "en",
  target = "es"
) {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${encodeURIComponent(source)}` +
    `&tl=${encodeURIComponent(target)}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google devolvió ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Respuesta inesperada de Google");
  }

  return data[0]
    .map((part: unknown) => {
      if (Array.isArray(part)) {
        return typeof part[0] === "string" ? part[0] : "";
      }
      return "";
    })
    .join("");
}

async function processBatch(
  batch: string[],
  sourceLang: string,
  targetLang: string
) {
  const partialResults: Record<string, string> = {};

  await Promise.all(
    batch.map(async (value) => {
      try {
        const { protectedText, tokens } = protectPlaceholders(value);
        const translatedText = await translateTextGoogle(
          protectedText,
          sourceLang,
          targetLang
        );
        partialResults[value] = restorePlaceholders(translatedText, tokens);
      } catch {
        partialResults[value] = value;
      }
    })
  );

  return partialResults;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const entries = body.entries as Entries;
    const sourceLang = String(body.sourceLang ?? "en").trim().toLowerCase();
    const targetLang = String(body.targetLang ?? "es").trim().toLowerCase();
    const countTranslation = body.countTranslation === true;

    if (!entries || typeof entries !== "object") {
      return NextResponse.json(
        { error: "Faltan las entradas para traducir" },
        { status: 400 }
      );
    }

    if (!sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "Faltan los idiomas de origen o destino" },
        { status: 400 }
      );
    }

    if (sourceLang === targetLang) {
      return NextResponse.json(
        { error: "El idioma de origen y destino no puede ser el mismo" },
        { status: 400 }
      );
    }

    const originalPairs = Object.entries(entries);

    const uniqueValues = Array.from(
      new Set(
        originalPairs
          .map(([, value]) => value)
          .filter((value) => typeof value === "string" && value.trim() !== "")
      )
    );

    const translatedValueMap: Record<string, string> = {};

    for (let i = 0; i < uniqueValues.length; i += CONCURRENCY) {
      const slice = uniqueValues.slice(i, i + CONCURRENCY);
      const partial = await processBatch(slice, sourceLang, targetLang);
      Object.assign(translatedValueMap, partial);
    }

    const translatedEntries: Entries = {};

    for (const [key, value] of originalPairs) {
      if (typeof value !== "string" || value.trim() === "") {
        translatedEntries[key] = value;
      } else {
        translatedEntries[key] = translatedValueMap[value] ?? value;
      }
    }

    if (countTranslation) {
      await incrementTranslations(1);
    }

    return NextResponse.json({
      translated: translatedEntries,
      stats: {
        totalEntries: originalPairs.length,
        uniqueTexts: uniqueValues.length,
        sourceLang,
        targetLang,
        counted: countTranslation,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}