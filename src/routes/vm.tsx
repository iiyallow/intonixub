import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Maximize, Monitor, Power } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/vm")({
  head: () => ({
    meta: [
      { title: "Workstation — IntonixUB" },
      { name: "description", content: "Private remote desktop workstation for the IntonixUB owner account." },
      { property: "og:title", content: "Workstation — IntonixUB" },
      { property: "og:description", content: "Private remote desktop workstation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VmPage,
});

const KEY = "intonix:vm-url";

function VmPage() {
  const { loading, isAdmin } = useAuth();
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "up" | "down">("idle");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) ?? "";
    setUrl(saved);
    setDraft(saved);
  }, []);

  useEffect(() => {
    if (!url) return;
    setState("checking");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    fetch(url, { mode: "no-cors", signal: ctrl.signal })
      .then(() => setState("up"))
      .catch(() => setState("down"))
      .finally(() => clearTimeout(t));
    return () => ctrl.abort();
  }, [url]);

  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl font-extrabold">Workstation is private</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only the owner account can open this page.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Go home</Link>
      </div>
    );
  }

  const save = () => {
    let v = draft.trim();
    if (v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
    localStorage.setItem(KEY, v);
    setUrl(v);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl glass p-3">
        <Monitor className="size-5 text-primary" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="https://your-tunnel.trycloudflare.com/vnc.html?autoconnect=1&resize=scale"
          className="min-w-0 flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={save} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Connect</button>
        <button
          onClick={() => document.getElementById("vm-frame")?.requestFullscreen()}
          className="grid size-9 place-items-center rounded-lg border border-border"
          aria-label="Fullscreen"
        >
          <Maximize className="size-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          {state === "up" ? "● Online" : state === "down" ? "● Asleep" : state === "checking" ? "● Checking" : ""}
        </span>
      </div>

      {url && state !== "down" ? (
        <iframe id="vm-frame" src={url} title="Workstation" allow="clipboard-read; clipboard-write; fullscreen" className="h-[78vh] w-full rounded-2xl border border-border bg-background" />
      ) : (
        <div className="grid h-[60vh] place-items-center rounded-2xl glass text-center">
          <div>
            <Power className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">{url ? "Host is asleep" : "No workstation linked"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {url ? "Power on your workstation and start the tunnel to connect." : "Paste your noVNC tunnel link above."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
