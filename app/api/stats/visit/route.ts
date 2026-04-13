import { NextRequest, NextResponse } from "next/server";
import {
  registerVisit,
  registerUniqueVisitor,
} from "@/app/lib/db/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const visitorId = String(body?.visitorId ?? "").trim();

    await registerVisit();
    await registerUniqueVisitor(visitorId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Visit route error:", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }
}
