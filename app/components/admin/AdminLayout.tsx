import { ReactNode } from "react";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-6 md:py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <AdminSidebar />

          <div className="min-w-0 flex-1 space-y-6">
            <AdminHeader title={title} subtitle={subtitle} />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}