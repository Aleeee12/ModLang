type SiteAnnouncementProps = {
  message: string;
};

export default function SiteAnnouncement({
  message,
}: SiteAnnouncementProps) {
  if (!message.trim()) return null;

  return (
    <section className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-yellow-200/70">
        Anuncio
      </p>
      <p className="mt-2 text-sm font-medium text-yellow-100">{message}</p>
    </section>
  );
}