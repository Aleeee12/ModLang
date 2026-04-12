import AdminLayout from "@/app/components/admin/AdminLayout";
import AnnouncementEditor from "@/app/components/admin/AnnouncementEditor";

export default function AdminAnnouncementsPage() {
  return (
    <AdminLayout
      title="Anuncios"
      subtitle="Crea y administra anuncios visibles en la web principal."
    >
      <AnnouncementEditor />

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Nota
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">
          Estado del sistema de anuncios
        </h2>
        <p className="mt-3 text-sm text-white/55">
          Aquí puedes crear y activar anuncios para mostrarlos en la página
          principal de ModLang Forge.
        </p>
      </section>
    </AdminLayout>
  );
}