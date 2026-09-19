import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Home,
  Maximize2,
  RotateCw,
  Search,
  Star,
  StarOff,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_PROXY_BASE, QUICK_LAUNCH, buildProxyUrl, normalizeTarget, type ProxyMode } from "@/lib/proxy";

export const Route = createFileRoute("/proxy")({
  head: () => ({
    meta: [
      { title: "Web console — IntonixUB" },
      {
        name: "description",
        content: "Open sites through the IntonixUB private web console with quick-launch shortcuts and full navigation.",
      },
      { property: "og:title", content: "Web console — IntonixUB" },
      { property: "og:description", content: "Fast, private web access from one console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProxyPage,
});

const PINS_KEY = "intonix:pins";

function loadPins(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ProxyPage() {
  const { loading, session, canProxy } = useAuth();
  const [base, setBase] = useState(DEFAULT_PROXY_BASE);
  const [mode, setMode] = useState<ProxyMode>("query");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(-1);
  const [nonce, setNonce] = useState(0);
  const [pins, setPins] = useState<string[]>([]);
  const [ping, setPing] = useState<number | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const target = index >= 0 ? (history[index] ?? "") : "";

  useEffect(() => {
    setPins(loadPins());
    void (async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map = new Map((data ?? []).map((s) => [s.key as string, s.value as string]));
      setBase(map.get("proxy_base_url") || DEFAULT_PROXY_BASE);
      setMode(((map.get("proxy_mode") as ProxyMode) || "query") as ProxyMode);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const started = performance.now();
      try {
        await fetch(`${base.replace(/\/+$/, "")}/?url=${encodeURIComponent("https://example.com")}`, {
          mode: "no-cors",
          cache: "no-store",
        });
      } catch {
        /* opaque response is fine — we only time it */
      }
      if (alive) setPing(Math.round(performance.now() - started));
    })();
    return () => {
      alive = false;
    };
  }, [base]);

  const go = useCallback((raw: string) => {
    const url = normalizeTarget(raw);
    if (!url) return;
    setInput(url);
    setHistory((prev) => {
      const trimmed = prev.slice(0, index + 1);
      const next = [...trimmed, url].slice(-30);
      setIndex(next.length - 1);
      return next;
    });
    setNonce((n) => n + 1);
  }, [index]);

  const src = useMemo(
    () => (target ? `${buildProxyUrl(base, mode, target)}${nonce ? `#${nonce}` : ""}` : ""),
    [base, mode, target, nonce],
  );

  const pinned = target ? pins.includes(target) : false;

  function togglePin() {
    if (!target) return;
    const next = pinned ? pins.filter((p) => p !== target) : [...pins, target];
    setPins(next);
    localStorage.setItem(PINS_KEY, JSON.stringify(next));
  }

  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;

  if (!session || !canProxy) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">
          {session ? "Your plan doesn't include the console" : "Sign in to use the console"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session
            ? "Ask in Discord to upgrade — access unlocks as soon as your plan is updated."
            : "The web console is available to subscribers."}
        </p>
        <Link
          to={session ? "/account" : "/auth"}
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {session ? "View your account" : "Sign in"}
        </Link>
      </div>
    );
  }

  function openStealthTab() {
    if (!src) return;
    const tab = window.open("about:blank", "_blank");
    if (!tab) return;
    tab.document.write(
      `<!doctype html><title>Google Drive</title><link rel="icon" href="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png"><style>html,body{margin:0;height:100%;background:#0b1020}iframe{border:0;width:100%;height:100%}</style><iframe src="${src}" allow="fullscreen"></iframe>`,
    );
    tab.document.close();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Web console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Type an address or a search. Keep it legal — see the{" "}
        <Link to="/terms" className="text-primary hover:underline">
          rules
        </Link>
        .
      </p>

      {/* browser chrome */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl glass p-2">
        <div className="flex items-center gap-1">
          <IconButton label="Back" disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
            <ArrowLeft className="size-4" />
          </IconButton>
          <IconButton
            label="Forward"
            disabled={index < 0 || index >= history.length - 1}
            onClick={() => setIndex((i) => Math.min(history.length - 1, i + 1))}
          >
            <ArrowRight className="size-4" />
          </IconButton>
          <IconButton label="Reload" disabled={!target} onClick={() => setNonce((n) => n + 1)}>
            <RotateCw className="size-4" />
          </IconButton>
          <IconButton label="Start page" onClick={() => setIndex(-1)}>
            <Home className="size-4" />
          </IconButton>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(input);
          }}
          className="flex min-w-[220px] flex-1 items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="example.com or a search"
              className="input w-full pl-9"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Go
          </button>
        </form>

        <div className="flex items-center gap-1">
          <IconButton label={pinned ? "Unpin" : "Pin"} disabled={!target} onClick={togglePin}>
            {pinned ? <StarOff className="size-4" /> : <Star className="size-4" />}
          </IconButton>
          <IconButton label="Fullscreen" disabled={!target} onClick={() => void frameRef.current?.requestFullscreen()}>
            <Maximize2 className="size-4" />
          </IconButton>
          <IconButton label="Open in about:blank" disabled={!target} onClick={openStealthTab}>
            <ExternalLink className="size-4" />
          </IconButton>
          <IconButton label="Close" disabled={!target} onClick={() => setIndex(-1)}>
            <X className="size-4" />
          </IconButton>
        </div>
      </div>

      {pins.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Pinned</span>
          {pins.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-secondary"
            >
              {hostOf(p)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {QUICK_LAUNCH.map((site) => (
          <button
            key={site.name}
            type="button"
            onClick={() => go(site.url)}
            className="card-hover rounded-2xl p-3 text-left text-sm font-semibold text-white"
            style={{ background: site.art }}
          >
            {site.name}
          </button>
        ))}
      </div>

      {src ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border glass">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{target}</span>
            <span className="ml-auto shrink-0">
              {index + 1}/{history.length}
            </span>
          </div>
          <iframe
            ref={frameRef}
            key={src}
            src={src}
            title="Proxied site"
            className="h-[70vh] w-full bg-background"
            allow="fullscreen; clipboard-read; clipboard-write"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        history.length > 0 && (
          <div className="mt-6 rounded-2xl glass p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...history].reverse().slice(0, 12).map((h, i) => (
                <button
                  key={`${h}-${i}`}
                  type="button"
                  onClick={() => go(h)}
                  className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-secondary"
                >
                  {hostOf(h)}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl glass px-4 py-3 text-xs text-muted-foreground">
        <span>
          Node: <strong className="text-foreground">Edge / auto</strong>
        </span>
        <span>
          Engine: <strong className="text-foreground">{hostOf(base)}</strong>
        </span>
        <span>
          Ping: <strong className="text-foreground">{ping === null ? "…" : `${ping}ms`}</strong>
        </span>
        <span>
          Status: <strong className="text-primary">Connected</strong>
        </span>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg border border-border transition-colors hover:bg-secondary disabled:opacity-40"
    >
      {children}
    </button>
  );
}
