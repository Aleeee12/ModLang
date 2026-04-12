"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/app/components/admin/AdminLayout";

type StatsResponse = {
  totalVisits: number;
  totalTranslations: number;
  onlineUsers: number;
  uniqueVisitors: number;
  lastUpdated: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse>({
    totalVisits: 0,
    totalTranslations: 0,
    onlineUsers: 0,
    uniqueVisitors: 0,
    lastUpdated: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const statsRes = await fetch("/api/admin/stats", {
          cache: "no-store",
        });

        if (!statsRes.ok) return;

        const statsData = (await statsRes.json()) as StatsResponse;

        if (!cancelled) {
          setStats({
            totalVisits: Number(statsData?.totalVisits ?? 0),
            totalTranslations: Number(statsData?.totalTranslations ?? 0),
            onlineUsers: Number(statsData?.onlineUsers ?? 0),
            uniqueVisitors: Number(statsData?.uniqueVisitors ?? 0), 
            lastUpdated: Number(statsData?.lastUpdated ?? Date.now()),
          });
        }
      } catch (error) {
        console.error("Load admin dashboard error:", error);
      }
    }

    void loadDashboard();

    const interval = setInterval(() => {
      void loadDashboard();
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Control general de ModLang Forge, estadísticas y herramientas administrativas."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm text-zinc-400">Usuarios online</p>
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.onlineUsers}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Usuarios conectados.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm text-zinc-400">Traducciones totales</p>
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.totalTranslations}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Conteo global de traducciones completadas.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm text-zinc-400">Visitas</p>
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.totalVisits}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Conteo global de visitas registradas.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm text-zinc-400">Usuarios únicos</p>
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.uniqueVisitors}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Registro de personas.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Estado del panel
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Dashboard
        </h2>
        <p className="mt-3 text-zinc-400">
          El dashboard se refresca automáticamente cada 2 segundos.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Última actualización:{" "}
          {stats.lastUpdated
            ? new Date(stats.lastUpdated).toLocaleTimeString()
            : "Sin datos"}
        </p>
      </section>
    </AdminLayout>
  );
}