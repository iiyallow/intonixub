import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clipboard,
  ExternalLink,
  Home,
  Maximize2,
  RotateCw,
  Search,
  Star,
  StarOff,
  Trash2,
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
      { name: "description", content: "Browse through the IntonixUB console with compact bookmarks and full navigation." },
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
    const raw: unknown = JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : [];
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
  const [frameLoading, setFrameLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const target = index >= 0 ? (history[index] ?? "") : "";

  useEffect(() => {
    setPins(loadPins());
    void (async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map = new Map((data ?? []).map((setting) => [setting.key as string, setting.value as string]));
      setBase(map.get("proxy_base_url") || DEFAULT_PROXY_BASE);
      setMode((map.get("proxy_mode") as ProxyMode) || "query");
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
        // An opaque response still provides a useful round-trip measurement.
      }
      if (alive) setPing(Math.round(performance.now() - started));
    })();
    return () => { alive = false; };
  }, [base]);

  const go = useCallback((raw: string) => {
    const url = normalizeTarget(raw);
    if (!url) return;
    setInput(url);
    setFrameLoading(true);
    setHistory((previous) => {
      const next = [...previous.slice(0, index + 1), url].slice(-30);
      setIndex(next.length - 1);
      return next;
    });
    setNonce((value) => value + 1);
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) inputRef.current?.blur();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [uv, setUv] = useState<Awaited<ReturnType<typeof initUV>>>(null);
  useEffect(() => { void initUV().then(setUv); }, []);

  const src = useMemo(
    () => (target ? `${uv ? uvUrl(uv, target) : buildProxyUrl(base, mode, target)}${nonce ? `#${nonce}` : ""}` : ""),
    [base, mode, target, nonce, uv],
  );
  const pinned = target ? pins.includes(target) : false;

  function togglePin() {
    if (!target) return;
    const next = pinned ? pins.filter((pin) => pin !== target) : [...pins, target];
    setPins(next);
    localStorage.setItem(PINS_KEY, JSON.stringify(next));
  }

  function openStealthTab() {
    if (!src) return;
    const tab = window.open("about:blank", "_blank");
    if (!tab) return;
    tab.document.write(
      `<!doctype html><title>Google Drive</title><link rel="icon" href="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png"><style>html,body{margin:0;height:100%;background:#090712}iframe{border:0;width:100%;height:100%}</style><iframe src="${src}" allow="fullscreen"></iframe>`,
    );
    tab.document.close();
  }

  async function copyAddress() {
    if (!target) return;
    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!session || !canProxy) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">
          {session ? "Your plan doesn't include the console" : "Sign in to use the console"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session ? "Ask in Discord to upgrade — access unlocks when your plan is updated." : "The web console is available to subscribers."}
        </p>
        <Button asChild className="mt-6"><Link to={session ? "/account" : "/auth"}>{session ? "View account" : "Sign in"}</Link></Button>
      </div>
    );
  }

  const railItems = [
    ...QUICK_LAUNCH.slice(0, 6).map((site) => ({ label: site.name, url: site.url, kind: "quick" })),
    ...pins.map((url) => ({ label: hostOf(url), url, kind: "pin" })),
  ];

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl">
        <div className="flex min-h-[72vh] flex-col md:flex-row">
          <aside className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-background/45 p-2 md:w-16 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:py-4">
            <button type="button" onClick={() => setIndex(-1)} title="Start page" aria-label="Start page" className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground glow">
              <Home className="size-4" />
            </button>
            <span className="hidden h-px w-7 bg-border md:block" />
            {railItems.map((item, itemIndex) => (
              <button
                key={`${item.kind}-${item.url}-${itemIndex}`}
                type="button"
                onClick={() => go(item.url)}
                title={item.label}
                aria-label={`Open ${item.label}`}
                className="group relative grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-secondary/45 text-xs font-bold text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground hover:glow"
              >
                <img src={faviconOf(item.url)} alt="" loading="lazy" className="size-4 rounded-sm" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                {item.kind === "pin" && <Star className="absolute -right-1 -top-1 size-2.5 fill-current text-[var(--neon-pink)]" />}
              </button>
            ))}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
              <div className="flex gap-1">
                <IconButton label="Back" disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft /></IconButton>
                <IconButton label="Forward" disabled={index < 0 || index >= history.length - 1} onClick={() => setIndex((value) => Math.min(history.length - 1, value + 1))}><ArrowRight /></IconButton>
                <IconButton label="Reload" disabled={!target} onClick={() => { setFrameLoading(true); setNonce((value) => value + 1); }}><RotateCw /></IconButton>
              </div>

              <form onSubmit={(event) => { event.preventDefault(); go(input); }} className="order-last flex min-w-full flex-1 items-center gap-2 sm:order-none sm:min-w-64">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search or enter address" className="input h-10 w-full pl-9 pr-16" autoCapitalize="none" spellCheck={false} />
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">⌘ L</kbd>
                </div>
                <Button type="submit" className="h-10 px-5">Go</Button>
              </form>

              <div className="ml-auto flex gap-1 sm:ml-0">
                <IconButton label={pinned ? "Remove bookmark" : "Bookmark page"} disabled={!target} onClick={togglePin}>{pinned ? <StarOff /> : <Star />}</IconButton>
                <IconButton label={copied ? "Copied" : "Copy address"} disabled={!target} onClick={() => void copyAddress()}><Clipboard /></IconButton>
                <IconButton label="Fullscreen" disabled={!target} onClick={() => void frameRef.current?.requestFullscreen()}><Maximize2 /></IconButton>
                <IconButton label="Open in hidden tab" disabled={!target} onClick={openStealthTab}><ExternalLink /></IconButton>
                <IconButton label="Close page" disabled={!target} onClick={() => setIndex(-1)}><X /></IconButton>
              </div>
            </div>

            {src ? (
              <div className="relative">
                <div className="flex h-9 items-center gap-2 border-b border-border px-3 text-xs text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${frameLoading ? "animate-pulse bg-primary" : "bg-[var(--neon-cyan)]"}`} />
                  <span className="truncate">{target}</span>
                  <span className="ml-auto shrink-0">{index + 1}/{history.length}</span>
                </div>
                <iframe ref={frameRef} key={src} src={src} title="Proxied site" onLoad={() => setFrameLoading(false)} className="h-[72vh] w-full bg-background" allow="fullscreen; clipboard-read; clipboard-write" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
                <div className="w-full max-w-2xl text-center">
                  <p className="text-xs font-semibold uppercase text-[var(--neon-cyan)]">Edge connection ready</p>
                  <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Where do you want to go?</h1>
                  <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">Use the address bar or pick a compact shortcut. Press Ctrl or Command + L anytime to jump back to search.</p>
                  {history.length > 0 && (
                    <div className="mt-8 border-t border-border pt-5 text-left">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Recent</p>
                        <Button variant="ghost" size="sm" onClick={() => setHistory([])}><Trash2 /> Clear</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...history].reverse().slice(0, 10).map((url, historyIndex) => (
                          <Button key={`${url}-${historyIndex}`} variant="outline" size="sm" onClick={() => go(url)}>{hostOf(url)}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-background/35 px-4 py-2.5 text-[10px] font-semibold uppercase text-muted-foreground">
              <span>Node <strong className="text-foreground">Edge / auto</strong></span>
              <span>Engine <strong className="text-foreground">{hostOf(base)}</strong></span>
              <span>Latency <strong className="text-foreground">{ping === null ? "…" : `${ping}ms`}</strong></span>
              <span className="ml-auto flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[var(--neon-cyan)]" /> Connected</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <Button type="button" variant="ghost" size="icon" onClick={onClick} disabled={disabled} title={label} aria-label={label} className="size-9 border border-transparent hover:border-border">{children}</Button>;
}