import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Maximize2, RotateCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_PROXY_BASE, QUICK_LAUNCH, buildProxyUrl, type ProxyMode } from "@/lib/proxy";

export const Route = createFileRoute("/proxy")({
  head: () => ({
    meta: [
      { title: "Web console — IntonixUB" },
      {
        name: "description",
        content: "Open sites through the IntonixUB private web console with quick-launch shortcuts.",
      },
      { property: "og:title", content: "Web console — IntonixUB" },
      { property: "og:description", content: "Fast, private web access from one console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProxyPage,
});

function ProxyPage() {
  const { loading, session, canProxy } = useAuth();
  const [base, setBase] = useState(DEFAULT_PROXY_BASE);
  const [mode, setMode] = useState<ProxyMode>("query");
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [nonce, setNonce] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map = new Map((data ?? []).map((s) => [s.key as string, s.value as string]));
      setBase(map.get("proxy_base_url") || DEFAULT_PROXY_BASE);
      setMode(((map.get("proxy_mode") as ProxyMode) || "query") as ProxyMode);
    })();
  }, []);

  const src = useMemo(
    () => (target ? `${buildProxyUrl(base, mode, target)}${nonce ? `#${nonce}` : ""}` : ""),
    [base, mode, target, nonce],
  );

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
      `<!doctype html><title>Google Drive</title><style>html,body{margin:0;height:100%;background:#0b1020}iframe{border:0;width:100%;height:100%}</style><iframe src="${src}" allow="fullscreen"></iframe>`,
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTarget(input);
          setNonce((n) => n + 1);
        }}
        className="mt-5 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com or a search"
          className="input w-full"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {QUICK_LAUNCH.map((site) => (
          <button
            key={site.name}
            type="button"
            onClick={() => {
              setInput(site.url);
              setTarget(site.url);
              setNonce((n) => n + 1);
            }}
            className="card-hover rounded-2xl p-3 text-left text-sm font-semibold text-white"
            style={{ background: site.art }}
          >
            {site.name}
          </button>
        ))}
      </div>

      {src && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border glass">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{target}</span>
            <div className="ml-auto flex items-center gap-1">
              <IconButton label="Reload" onClick={() => setNonce((n) => n + 1)}>
                <RotateCw className="size-4" />
              </IconButton>
              <IconButton label="Fullscreen" onClick={() => void frameRef.current?.requestFullscreen()}>
                <Maximize2 className="size-4" />
              </IconButton>
              <IconButton label="Open in about:blank" onClick={openStealthTab}>
                <ExternalLink className="size-4" />
              </IconButton>
              <IconButton label="Close" onClick={() => setTarget("")}>
                <X className="size-4" />
              </IconButton>
            </div>
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
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl glass px-4 py-3 text-xs text-muted-foreground">
        <span>
          Node: <strong className="text-foreground">Edge / auto</strong>
        </span>
        <span>
          Engine: <strong className="text-foreground">{new URL(base).host}</strong>
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
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg border border-border transition-colors hover:bg-secondary"
    >
      {children}
    </button>
  );
}
