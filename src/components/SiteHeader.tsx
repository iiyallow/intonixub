import { Link } from "@tanstack/react-router";
import { FileText, Globe, Home, Settings, ShieldAlert, User } from "lucide-react";
import { useIntonix } from "@/lib/intonix-store";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/proxy", label: "Console", icon: Globe },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/terms", label: "Terms", icon: FileText },
] as const;

export function SiteHeader() {
  const { panic, settings } = useIntonix();
  const { session, isAdmin } = useAuth();


  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 font-display text-lg font-extrabold tracking-tight">
          Intonix<span className="text-primary text-glow">UB</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
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
          className="ml-auto grid size-10 shrink-0 place-items-center rounded-xl border border-destructive/40 text-destructive transition-colors hover:bg-destructive/15 md:ml-0"
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
