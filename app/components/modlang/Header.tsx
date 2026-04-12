type HeaderProps = {
  appName: string;
  appSubtitle: string;
  appAuthor: string;
  uiLang: "es" | "en";
  onChangeUiLang: (lang: "es" | "en") => void;
};

export default function Header({
  appName,
  appSubtitle,
  appAuthor,
  uiLang,
  onChangeUiLang,
}: HeaderProps) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 shadow-xl rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        
        {/* IZQUIERDA */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{appName}</h1>
          <p className="text-zinc-300 text-lg">{appSubtitle}</p>
          <p className="text-sm text-zinc-500 mt-2">by {appAuthor}</p>
        </div>

        {/* DERECHA (solo idioma ahora) */}
        <div className="flex items-center gap-2 self-start rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
          <span className="text-sm text-zinc-400">
            {uiLang === "es" ? "Idioma" : "Language"}
          </span>

          <select
            value={uiLang}
            onChange={(e) => onChangeUiLang(e.target.value as "es" | "en")}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}