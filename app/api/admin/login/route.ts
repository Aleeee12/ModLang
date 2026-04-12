import { NextRequest, NextResponse } from "next/server";
import {
  buildAdminSessionValue,
  isAdminEnvConfigured,
  validateAdminPassword,
} from "@/app/lib/admin-auth";
import {
  ADMIN_COOKIE_NAME,
  getAdminCookieOptions,
} from "@/app/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isAdminEnvConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Admin env no configurado." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const password = String(body?.password ?? "");

    if (!password) {
      return NextResponse.json(
        { ok: false, error: "Contraseña requerida." },
        { status: 400 }
      );
    }

    const isValid = validateAdminPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Contraseña inválida." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(
      ADMIN_COOKIE_NAME,
      buildAdminSessionValue(),
      getAdminCookieOptions()
    );

    return response;
  } catch (error) {
    console.error("POST /api/admin/login error:", error);

    return NextResponse.json(
      { ok: false, error: "Error interno al iniciar sesión." },
      { status: 500 }
    );
  }
}