import { NextRequest, NextResponse } from "next/server";
import { upsertPresence, removePresence } from "@/app/lib/db/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const tabId = String(body?.tabId ?? "").trim();
    const action = String(body?.action ?? "upsert").trim();

    if (!tabId) {
      return NextResponse.json(
        { ok: false, error: "Missing tabId" },
        { status: 400 }
      );
    }

    if (action === "remove") {
      removePresence(tabId);
      return NextResponse.json({ ok: true, removed: true });
    }

    upsertPresence(tabId);
    return NextResponse.json({ ok: true, updated: true });
  } catch (error) {
    console.error("Presence route error:", error);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 500 }
    );
  }
}