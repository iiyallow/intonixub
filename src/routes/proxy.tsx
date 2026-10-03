import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  EyeOff,
  ExternalLink,
  Globe,
  Lock,
  Maximize2,
  Minimize2,
  Plus,
  RotateCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_PROXY_BASE, QUICK_LAUNCH, buildProxyUrl, faviconOf, normalizeTarget, type ProxyMode } from "@/lib/proxy";
import { initUV, uvUrl } from "@/lib/uv";

export const Route = createFileRoute("/proxy")({
  head: () => ({
    meta: [
      { title: "Web console — IntonixUB" },
      { name: "description", content: "A Chrome-style tabbed browser for the IntonixUB console." },
      { property: "og:title", content: "Web console — IntonixUB" },
      { property: "og:description", content: "Fast, private web access with tabs and an omnibox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProxyPage,
});

const PINS_KEY = "intonix:pins";
const SHORTCUTS = [...QUICK_LAUNCH].sort((a, b) => (a.name === "DuckDuckGo" ? -1 : b.name === "DuckDuckGo" ? 1 : 0));

type Tab = { id: number; url: string; title: string; loading: boolean; nonce: number };

function loadPins(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
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

let nextId = 1;
const newTab = (url = ""): Tab => ({ id: nextId++, url, title: url ? hostOf(url) : "New Tab", loading: !!url, nonce: 0 });

function ProxyPage() {
  const { loading, session, canProxy } = useAuth();
  const [base, setBase] = useState(DEFAULT_PROXY_BASE);
  const [mode, setMode] = useState<ProxyMode>("query");
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab()]);
  const [activeId, setActiveId] = useState(tabs[0]!.id);
  const [input, setInput] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  const [uv, setUv] = useState<Awaited<ReturnType<typeof initUV>>>(null);
  const frames = useRef(new Map<number, HTMLIFrameElement>());
  const inputRef = useRef<HTMLInputElement>(null);
  const active = (tabs.find((t) => t.id === activeId) ?? tabs[0])!;

  useEffect(() => {
    setPins(loadPins());
    void initUV().then(setUv);
    void (async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map = new Map((data ?? []).map((s) => [s.key as string, s.value as string]));
      setBase(map.get("proxy_base_url") || DEFAULT_PROXY_BASE);
      setMode((map.get("proxy_mode") as ProxyMode) || "query");
    })();
  }, []);

  useEffect(() => { setInput(active?.url ?? ""); }, [activeId, active?.url]);

  const patch = useCallback((id: number, p: Partial<Tab>) => setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t))), []);

  const navigate = useCallback((raw: string, id = activeId) => {
    const url = normalizeTarget(raw);
    if (!url) return;
    patch(id, { url, title: hostOf(url), loading: true });
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, nonce: t.nonce + 1 } : t)));
  }, [activeId, patch]);

  const addTab = useCallback((url = "") => {
    const t = newTab(url ? normalizeTarget(url) : "");
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
    if (!url) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeTab = useCallback((id: number) => {
    setTabs((ts) => {
      const i = ts.findIndex((t) => t.id === id);
      const rest = ts.filter((t) => t.id !== id);
      if (!rest.length) {
        const t = newTab();
        setActiveId(t.id);
        return [t];
      }
      if (id === activeId) setActiveId(rest[Math.max(0, i - 1)]!.id);
      return rest;
    });
    frames.current.delete(id);
  }, [activeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "l") { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select(); }
      if (mod && e.altKey && e.key.toLowerCase() === "t") { e.preventDefault(); addTab(); }
      if (mod && e.altKey && e.key.toLowerCase() === "w") { e.preventDefault(); closeTab(activeId); }
      if (e.key === "Escape" && full && document.activeElement !== inputRef.current) setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addTab, closeTab, activeId, full]);

  const srcOf = useCallback(
    (t: Tab) => (t.url ? `${uv ? uvUrl(uv, t.url) : buildProxyUrl(base, mode, t.url)}` : ""),
    [uv, base, mode],
  );

  // Read title + real address from same-origin (Ultraviolet) frames after each load.
  function onFrameLoad(t: Tab) {
    const frame = frames.current.get(t.id);
    const p: Partial<Tab> = { loading: false };
    try {
      const doc = frame?.contentDocument;
      if (doc?.title) p.title = doc.title;
      const path = frame?.contentWindow?.location.pathname ?? "";
      const cfg = (window as unknown as { __uv$config?: { prefix: string; decodeUrl: (s: string) => string } }).__uv$config;
      if (cfg && path.startsWith(cfg.prefix)) {
        const real = cfg.decodeUrl(path.slice(cfg.prefix.length) + (frame?.contentWindow?.location.search ?? ""));
        if (real.startsWith("http")) p.url = real;
      }
    } catch {
      // Cross-origin frame (direct mode): keep the known address.
    }
    patch(t.id, p);
  }

  const frameHistory = (dir: "back" | "forward") => {
    try { frames.current.get(activeId)?.contentWindow?.history[dir](); } catch { /* cross-origin */ }
  };
  const reload = () => {
    if (!active.url) return;
    patch(activeId, { loading: true });
    try { frames.current.get(activeId)?.contentWindow?.location.reload(); } catch {
      setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, nonce: t.nonce + 1 } : t)));
    }
  };

  const pinned = active.url ? pins.includes(active.url) : false;
  function togglePin() {
    if (!active.url) return;
    const next = pinned ? pins.filter((p) => p !== active.url) : [...pins, active.url];
    setPins(next);
    localStorage.setItem(PINS_KEY, JSON.stringify(next));
  }

  function openStealthTab() {
    const src = srcOf(active);
    if (!src) return;
    const w = window.open("about:blank", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><title>Google Drive</title><link rel="icon" href="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png"><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style><iframe src="${new URL(src, location.href).href}" allow="fullscreen"></iframe>`);
    w.document.close();
  }

  const bookmarks = useMemo(
    () => [...SHORTCUTS.map((s) => ({ label: s.name, url: s.url })), ...pins.filter((p) => !SHORTCUTS.some((s) => s.url === p)).map((url) => ({ label: hostOf(url), url }))],
    [pins],
  );

  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!session || !canProxy) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">{session ? "Your plan doesn't include the console" : "Sign in to use the console"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{session ? "Ask in Discord to upgrade — access unlocks when your plan is updated." : "The web console is available to subscribers."}</p>
        <Button asChild className="mt-6"><Link to={session ? "/account" : "/auth"}>{session ? "View account" : "Sign in"}</Link></Button>
      </div>
    );
  }

  const secure = active.url.startsWith("https://");

  return (
    <div className={full ? "fixed inset-0 z-50 bg-background" : "relative z-10 mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6"}>
      <section className={`flex flex-col overflow-hidden border border-border bg-card shadow-2xl ${full ? "h-full" : "h-[82vh] rounded-xl"}`}>
        {/* Tab strip */}
        <div className="no-scrollbar flex items-end gap-0.5 overflow-x-auto bg-background/70 px-2 pt-2">
          {tabs.map((t) => {
            const on = t.id === activeId;
            return (
              <div
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActiveId(t.id)}
                onAuxClick={(e) => { if (e.button === 1) closeTab(t.id); }}
                className={`group relative flex h-9 w-48 min-w-28 shrink cursor-pointer items-center gap-2 rounded-t-lg px-3 text-xs transition-colors ${on ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
              >
                {t.loading ? (
                  <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : t.url ? (
                  <img src={faviconOf(t.url)} alt="" className="size-3.5 shrink-0 rounded-sm" />
                ) : (
                  <Globe className="size-3.5 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <button type="button" aria-label="Close tab" onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="grid size-5 shrink-0 place-items-center rounded-full opacity-70 hover:bg-muted hover:opacity-100">
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
          <button type="button" aria-label="New tab" title="New tab (Ctrl+Alt+T)" onClick={() => addTab()} className="mb-1 ml-1 grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Plus className="size-4" />
          </button>
        </div>

        {/* Toolbar + omnibox */}
        <div className="flex items-center gap-1 bg-secondary px-2 py-1.5">
          <Tool label="Back" disabled={!active.url} onClick={() => frameHistory("back")}><ArrowLeft /></Tool>
          <Tool label="Forward" disabled={!active.url} onClick={() => frameHistory("forward")}><ArrowRight /></Tool>
          <Tool label="Reload" disabled={!active.url} onClick={reload}><RotateCw className={active.loading ? "animate-spin" : ""} /></Tool>
          <form onSubmit={(e) => { e.preventDefault(); navigate(input); inputRef.current?.blur(); }} className="relative mx-1 min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {active.url ? (secure ? <Lock className="size-3.5" /> : <Globe className="size-3.5" />) : <Search className="size-3.5" />}
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Search DuckDuckGo or type a URL"
              className="h-8 w-full rounded-full border border-transparent bg-background/80 pl-9 pr-9 text-sm outline-none focus:border-primary"
              autoCapitalize="none"
              spellCheck={false}
            />
            <button type="button" aria-label={pinned ? "Remove bookmark" : "Bookmark this tab"} disabled={!active.url} onClick={togglePin} className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40">
              <Star className={`size-3.5 ${pinned ? "fill-current text-[var(--neon-pink)]" : ""}`} />
            </button>
          </form>
          <Tool label="Open in about:blank" disabled={!active.url} onClick={openStealthTab}><ExternalLink /></Tool>
          <Tool label="Panic (go to Google Classroom)" onClick={() => window.location.replace("https://classroom.google.com")}><EyeOff /></Tool>
          <Tool label={full ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFull((v) => !v)}>{full ? <Minimize2 /> : <Maximize2 />}</Tool>
        </div>

        {/* Bookmarks bar */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border bg-secondary px-2 pb-1.5">
          {bookmarks.map((b) => (
            <button key={b.url} type="button" onClick={() => navigate(b.url)} className="flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-background/60 hover:text-foreground">
              <img src={faviconOf(b.url)} alt="" className="size-3.5 rounded-sm" />
              {b.label}
            </button>
          ))}
        </div>

        {/* Tab contents — inactive tabs stay alive, just hidden */}
        <div className="relative min-h-0 flex-1 bg-background">
          {tabs.map((t) => {
            const src = srcOf(t);
            const on = t.id === activeId;
            return (
              <div key={t.id} className={on ? "absolute inset-0" : "hidden"}>
                {src ? (
                  <iframe
                    key={`${src}-${t.nonce}`}
                    ref={(el) => { if (el) frames.current.set(t.id, el); }}
                    src={src}
                    title={t.title}
                    onLoad={() => onFrameLoad(t)}
                    className="size-full border-0 bg-background"
                    allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <NewTabPage onGo={(u) => navigate(u, t.id)} />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NewTabPage({ onGo }: { onGo: (url: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-xl text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">IntonixUB</h1>
        <form onSubmit={(e) => { e.preventDefault(); onGo(q); }} className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Search DuckDuckGo or type a URL" className="h-12 w-full rounded-full border border-border bg-secondary pl-11 pr-4 text-sm outline-none focus:border-primary" spellCheck={false} autoCapitalize="none" />
        </form>
        <div className="mt-8 grid grid-cols-4 gap-3 sm:gap-4">
          {SHORTCUTS.map((s) => (
            <button key={s.url} type="button" onClick={() => onGo(s.url)} className="group flex flex-col items-center gap-2 rounded-xl p-2 hover:bg-secondary">
              <span className="grid size-12 place-items-center rounded-full bg-secondary group-hover:bg-background">
                <img src={faviconOf(s.url)} alt="" className="size-6" />
              </span>
              <span className="w-full truncate text-xs text-muted-foreground">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tool({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} disabled={disabled} title={label} aria-label={label} className="size-8 shrink-0 rounded-full">
      {children}
    </Button>
  );
}
