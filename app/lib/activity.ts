export type ActivityLog = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

let activityStore: ActivityLog[] = [
  {
    id: "1",
    type: "system",
    message: "Panel de administración inicializado.",
    createdAt: new Date().toISOString(),
  },
];

export async function getActivityLogs(): Promise<ActivityLog[]> {
  return activityStore
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 15);
}

export async function addActivityLog(input: {
  type: string;
  message: string;
}) {
  const item: ActivityLog = {
    id: crypto.randomUUID(),
    type: input.type,
    message: input.message,
    createdAt: new Date().toISOString(),
  };

  activityStore = [item, ...activityStore].slice(0, 100);

  return item;
}