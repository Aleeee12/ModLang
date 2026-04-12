"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function AdminHeader({
  title = "Dashboard",
  subtitle = "Resumen general del panel de administración.",
}: AdminHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/60">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75">
          Sesión activa
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:opacity-60"
        >
          {loading ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}