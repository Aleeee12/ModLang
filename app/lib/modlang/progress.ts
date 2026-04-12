export function getStoredSpeed() {
  if (typeof window === "undefined") return 12;
  const raw = localStorage.getItem("modlangforge_speed_eps");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 12;
  return value;
}

export function saveObservedSpeed(entriesCount: number, elapsedMs: number) {
  if (typeof window === "undefined") return;
  if (entriesCount <= 0 || elapsedMs <= 0) return;

  const observed = entriesCount / (elapsedMs / 1000);
  const previous = getStoredSpeed();
  const blended = previous * 0.65 + observed * 0.35;

  localStorage.setItem("modlangforge_speed_eps", String(blended));
}