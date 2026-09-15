import { Link, useNavigate } from "@tanstack/react-router";
import { Gamepad2, Globe, Home, Search, Settings, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GAMES } from "@/lib/games";
import { useIntonix } from "@/lib/intonix-store";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/proxy", label: "Proxy", icon: Globe },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { panic, settings } = useIntonix();

  const results = query.trim()
    ? GAMES.filter((game) =>
        (game.title + " " + game.tags.join(" ")).toLowerCase().includes(query.trim().toLowerCase()),
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 font-display text-lg font-extrabold tracking-tight">
          Intonix<span className="text-primary text-glow"> Games</span>
        </Link>

        <div ref={boxRef} className="relative mx-auto w-full max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary/60 px-3 py-2 transition-shadow focus-within:glow">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  setOpen(false);
                  navigate({ to: "/play/$id", params: { id: results[0].id } });
                }
              }}
              placeholder="Search games…"
              aria-label="Search games"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {open && results.length > 0 && (
            <ul className="absolute top-full left-0 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              {results.map((game) => (
                <li key={game.id}>
                  <Link
                    to="/play/$id"
                    params={{ id: game.id }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-secondary"
                  >
                    <span
                      className="size-7 shrink-0 rounded-md"
                      style={{ backgroundImage: game.art }}
                      aria-hidden
                    />
                    <span className="truncate">{game.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{game.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={panic}
          title={`Panic (${settings.panicKey})`}
          aria-label="Panic button"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-destructive/40 text-destructive transition-colors hover:bg-destructive/15"
        >
          <ShieldAlert className="size-5" />
        </button>
      </div>

      <nav className="flex items-center justify-around border-t border-border px-2 pb-2 md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-primary" }}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
