import { NextResponse } from "next/server";
import { getAdminStats } from "@/app/lib/db/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getAdminStats();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      {
        totalVisits: 0,
        totalTranslations: 0,
        onlineUsers: 0,
        uniqueVisitors: 0,
        lastUpdated: Date.now(),
      },
      { status: 500 }
    );
  }
}