import { NextResponse } from "next/server";
import { incrementTranslations } from "@/app/lib/db/stats";

export const runtime = "nodejs";

export async function POST() {
  incrementTranslations();

  return NextResponse.json({ ok: true });
}