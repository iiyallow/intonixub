import { createFileRoute } from "@tanstack/react-router";
import { Globe, Info, Search, Signal, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/proxy")({
  head: () => ({
    meta: [
      { title: "Web Proxy — Intonix Games" },
      {
        name: "description",
        content:
          "The Intonix proxy console: enter a URL or search, pick a quick-launch app, and monitor node status in one clean interface.",
      },
      { property: "og:title", content: "Web Proxy — Intonix Games" },
      { property: "og:description", content: "A clean proxy console with quick-launch apps and live node status." },
    ],
  }),
  component: ProxyPage,
});

const QUICK = [
  { name: "Discord", url: "https://discord.com/app", art: "linear-gradient(135deg,#5865f2,#3b45c4)" },
  { name: "YouTube", url: "https://www.youtube.com/", art: "linear-gradient(135deg,#ff4e45,#b3120c)" },
  { name: "Reddit", url: "https://www.reddit.com/", art: "linear-gradient(135deg,#ff8717,#d93a00)" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/", art: "linear-gradient(135deg,#9aa0a6,#4b4f54)" },
  { name: "Spotify", url: "https://open.spotify.com/", art: "linear-gradient(135deg,#1ed760,#0f7a37)" },
  { name: "GitHub", url: "https://github.com/", art: "linear-gradient(135deg,#6e7681,#24292f)" },
];

export function normalizeTarget(input: string) {
  const value = input.trim();
  if (!value) return "";
  const looksLikeUrl = /^[a-z]+:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(value);
  return looksLikeUrl
    ? value.startsWith("http")
      ? value
      : `https://${value}`
    : `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

function ProxyPage() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold md:text-4xl">
          <Globe className="size-7 text-primary" /> Intonix Proxy
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Enter a site or a search. Requests route through the configured proxy node.
        </p>
      </div>

      <form
        className="mx-auto mt-6 flex max-w-2xl items-center gap-2 rounded-2xl glass p-2 focus-within:glow"
        onSubmit={(e) => {
          e.preventDefault();
          setTarget(normalizeTarget(input));
        }}
      >
        <Search className="ml-2 size-5 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search the web or enter a URL"
          aria-label="Proxy address"
          className="w-full bg-transparent px-1 py-2 outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          Launch
        </button>
      </form>

      {/* Status bar */}
      <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Signal className="size-3.5 text-primary" /> Node: US-East
        </span>
        <span>Ping: 24ms</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          Status: Connected
        </span>
        <span>Encryption: TLS 1.3</span>
      </div>

      {target && (
        <section className="mt-8">
          <div className="flex items-center gap-2 rounded-t-2xl glass px-3 py-2 text-xs">
            <span className="truncate text-muted-foreground">{target}</span>
            <button
              type="button"
              onClick={() => setTarget("")}
              className="ml-auto inline-flex items-center gap-1 rounded-lg bg-secondary/70 px-2 py-1"
            >
              <X className="size-3.5" /> Close
            </button>
          </div>
          <iframe
            src={target}
            title="Proxy frame"
            className="h-[70vh] w-full rounded-b-2xl border border-border bg-black"
          />
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Many sites refuse to load inside frames. Connect your own URL-rewriting service to route
            those requests.
          </p>
        </section>
      )}

      <h2 className="mt-12 mb-4 font-display text-lg font-bold">Quick launch</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.map((app) => (
          <button
            key={app.name}
            type="button"
            onClick={() => setTarget(app.url)}
            className="card-hover overflow-hidden rounded-2xl border border-border bg-card text-left"
          >
            <span className="block h-20 w-full" style={{ backgroundImage: app.art }} aria-hidden />
            <span className="block px-3 py-2 text-sm font-semibold">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
