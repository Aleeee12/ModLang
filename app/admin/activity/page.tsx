"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/app/components/admin/AdminLayout";
import ActivityTable, {
  type ActivityItem,
} from "@/app/components/admin/ActivityTable";

type ActivityResponse = {
  ok?: boolean;
  items?: ActivityItem[];
};

export default function AdminActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        const res = await fetch("/api/admin/activity", { cache: "no-store" });
        const data = (await res.json()) as ActivityResponse;

        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Load activity error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActivity();
    const interval = setInterval(loadActivity, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <AdminLayout
      title="Actividad"
      subtitle="Logs recientes del panel y de los eventos administrativos."
    >
      <ActivityTable items={items} />

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {loading ? (
          <p className="text-sm text-white/45">Cargando actividad...</p>
        ) : (
          <p className="text-sm text-white/45">
            La actividad se refresca automáticamente cada 5 segundos.
          </p>
        )}
      </section>
    </AdminLayout>
  );
}