import { NextResponse } from "next/server";
import { getAdminStats } from "@/app/lib/admin-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getAdminStats();

    return NextResponse.json({
      totalVisits: Number(stats?.totalVisits ?? 0),
      totalTranslations: Number(stats?.totalTranslations ?? 0),
      uniqueVisitors: Number(stats?.uniqueVisitors ?? 0),
      onlineUsers: Number(stats?.onlineUsers ?? 0),
      lastUpdated: Number(stats?.lastUpdated ?? Date.now()),
    });
  } catch (error) {
    console.error("Public stats error:", error);

    return NextResponse.json(
      {
        totalVisits: 0,
        totalTranslations: 0,
        uniqueVisitors: 0,
        onlineUsers: 0,
        lastUpdated: Date.now(),
      },
      { status: 500 }
    );
  }
}