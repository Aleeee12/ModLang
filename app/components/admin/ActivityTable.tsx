export type ActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type ActivityTableProps = {
  items: ActivityItem[];
};

export default function ActivityTable({ items }: ActivityTableProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        Logs
      </p>
      <h2 className="mt-2 text-xl font-bold text-white">Actividad reciente</h2>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <div className="grid grid-cols-[140px_1fr_180px] bg-white/5 px-4 py-3 text-xs uppercase tracking-wide text-white/45">
          <div>Tipo</div>
          <div>Mensaje</div>
          <div>Fecha</div>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-4 text-sm text-white/55">
            No hay actividad todavía.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[140px_1fr_180px] border-t border-white/10 px-4 py-3 text-sm text-white/80"
            >
              <div className="font-medium text-white/65">{item.type}</div>
              <div>{item.message}</div>
              <div className="text-white/50">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}