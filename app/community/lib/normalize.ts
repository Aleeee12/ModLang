export function normalizeModName(input: string) {
  const raw = String(input || "").trim();

  if (!raw) return "mod";

  
  const withoutExt = raw.replace(/\.(jar|zip)$/i, "").trim();

  
  const cleaned = withoutExt
    .replace(/[-_ ]v?\d+(\.\d+)+([a-z0-9.-]*)?$/i, "")
    .trim();

  return cleaned || withoutExt || "mod";
}