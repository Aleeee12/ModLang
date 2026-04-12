import { NextResponse } from "next/server";
import { getPublicAnnouncement } from "@/app/lib/admin-announcement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getPublicAnnouncement();

    return NextResponse.json({
      ok: true,
      message: data?.message ?? "",
      enabled: Boolean(data?.enabled),
      updatedAt: data?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("Public announcement error:", error);

    return NextResponse.json(
      {
        ok: true,
        message: "",
        enabled: false,
        updatedAt: null,
      },
      { status: 200 }
    );
  }
}