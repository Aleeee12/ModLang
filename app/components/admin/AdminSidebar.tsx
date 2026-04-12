"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/announcements", label: "Anuncios" },
  { href: "/admin/activity", label: "Actividad" },
  { href: "/admin/community", label: "Comunidad" }, 
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          ModLang Forge
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">Admin Panel</h2>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-xl border px-4 py-3 text-sm transition",
                isActive
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/5 bg-white/[0.02] text-white/65 hover:bg-white/[0.04]",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs text-white/45">Estado</p>
        <p className="mt-1 text-sm font-medium text-green-300">
          Panel protegido
        </p>
        <p className="mt-2 text-xs text-white/50">
          Acceso disponible solo con sesión de administrador.
        </p>
      </div>
    </aside>
  );
}