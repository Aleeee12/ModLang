export type AdminStatItem = {
  label: string;
  value: string | number;
  helper?: string;
};

type StatsCardsProps = {
  items: AdminStatItem[];
};

export default function StatsCards({ items }: StatsCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <p className="text-sm text-white/55">{item.label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>

          {item.helper ? (
            <p className="mt-2 text-xs text-white/40">{item.helper}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}