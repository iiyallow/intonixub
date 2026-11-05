import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile, type Status, type Tier } from "@/lib/auth";
import { type ProxyMode } from "@/lib/proxy";
import { parseEngines, probeWisp, WISP_URL } from "@/lib/engines";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — IntonixUB" },
      { name: "description", content: "IntonixUB admin console: manage subscriptions and access." },
      { property: "og:title", content: "Admin — IntonixUB" },
      { property: "og:description", content: "Manage IntonixUB accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const TIERS: Tier[] = ["free", "plus", "pro", "lifetime"];
const STATUSES: Status[] = ["active", "trialing", "past_due", "canceled", "suspended"];

function AdminPage() {
  const { loading, isAdmin } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [enginesText, setEnginesText] = useState("");
  const [wispUrl, setWispUrl] = useState("");
  const [proxyMode, setProxyMode] = useState<ProxyMode>("query");

  const load = useCallback(async () => {
    setBusy(true);
    const [{ data: profiles }, { data: roles }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      supabase.from("app_settings").select("key, value"),
    ]);
    setRows((profiles as Profile[] | null) ?? []);
    setAdmins((roles ?? []).map((r) => r.user_id as string));
    const map = new Map((settings ?? []).map((s) => [s.key as string, s.value as string]));
    setEnginesText(parseEngines(map.get("proxy_engines") || map.get("proxy_base_url") || "").join("\n"));
    setWispUrl(map.get("wisp_url") || WISP_URL);
    setProxyMode(((map.get("proxy_mode") as ProxyMode) || "query") as ProxyMode);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (loading) return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the admin account to manage subscriptions.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function saveRow(row: Profile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        tier: row.tier,
        status: row.status,
        expires_at: row.expires_at || null,
        notes: row.notes,
      })
      .eq("id", row.id);
    setMessage(error ? error.message : `Saved ${row.email ?? row.id}`);
  }

  async function toggleAdmin(row: Profile) {
    const isRowAdmin = admins.includes(row.id);
    const { error } = isRowAdmin
      ? await supabase.from("user_roles").delete().eq("user_id", row.id).eq("role", "admin")
      : await supabase.from("user_roles").insert({ user_id: row.id, role: "admin" });
    if (error) return setMessage(error.message);
    setAdmins((prev) => (isRowAdmin ? prev.filter((id) => id !== row.id) : [...prev, row.id]));
  }

  async function saveProxy() {
    const list = parseEngines(enginesText);
    const { error } = await supabase.from("app_settings").upsert(
      [
        { key: "proxy_engines", value: list.join("\n") },
        { key: "proxy_base_url", value: list[0] ?? "" },
        { key: "proxy_mode", value: proxyMode },
      ],
      { onConflict: "key" },
    );
    setMessage(error ? error.message : `Saved ${list.length} engine${list.length === 1 ? "" : "s"}`);
  }

  function normalizeWisp(raw: string) {
    let u = raw.trim();
    if (!u) return "";
    u = u.replace(/^https?:\/\//i, "wss://");
    if (!/^wss?:\/\//i.test(u)) u = "wss://" + u;
    u = u.replace(/\/+$/, "");
    if (!/\/wisp$/i.test(u)) u += "/wisp";
    return u + "/";
  }

  async function saveWisp() {
    const url = normalizeWisp(wispUrl);
    setWispUrl(url);
    const { error } = await supabase
      .from("app_settings")
      .upsert([{ key: "wisp_url", value: url }], { onConflict: "key" });
    if (error) return setMessage(error.message);
    setMessage("Saved Wisp address — checking…");
    const ok = url ? await probeWisp(url) : false;
    setMessage(url ? (ok ? "Saved — Wisp relay is online ✅" : "Saved, but the relay isn't answering yet") : "Wisp turned off");
  }

  const filtered = rows.filter((r) =>
    query
      ? `${r.email ?? ""} ${r.display_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
      : true,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </button>
      </div>

      <section className="mt-6 rounded-2xl glass p-4">
        <p className="font-display font-semibold">Proxy engine</p>
        <textarea
          value={enginesText}
          onChange={(e) => setEnginesText(e.target.value)}
          className="input min-h-24 w-full font-mono text-xs"
          placeholder={"https://primary.example.on.aws\nhttps://backup.example.on.aws"}
          aria-label="Engine addresses"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          One address per line, most preferred first. The console checks each address and moves to
          the next one automatically when the active engine stops answering.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={proxyMode}
            onChange={(e) => setProxyMode(e.target.value as ProxyMode)}
            className="input"
          >
            <option value="query">?url= query</option>
            <option value="encoded">/service/base64</option>
            <option value="path">/https://…</option>
          </select>
          <button
            type="button"
            onClick={() => void saveProxy()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Save className="size-4" /> Save
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl glass p-4">
        <p className="font-display font-semibold">Wisp tunnel address</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={wispUrl}
            onChange={(e) => setWispUrl(e.target.value)}
            className="input w-full font-mono text-xs"
            placeholder="https://your-tunnel.trycloudflare.com"
            aria-label="Wisp tunnel address"
          />
          <button
            type="button"
            onClick={() => void saveWisp()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Save className="size-4" /> Save
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Paste your new tunnel link — https:// links and missing /wisp/ are fixed automatically. Leave empty to turn Wisp off.
        </p>
      </section>

      {message && <p className="mt-4 text-sm text-primary">{message}</p>}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search accounts…"
        className="input mt-6 w-full sm:max-w-xs"
      />

      <div className="mt-4 space-y-3">
        {filtered.map((row) => (
          <div key={row.id} className="rounded-2xl glass p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display font-semibold">{row.display_name || row.email}</p>
              <span className="text-xs text-muted-foreground">{row.email}</span>
              {admins.includes(row.id) && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">admin</span>
              )}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <label className="text-xs text-muted-foreground">
                Tier
                <select
                  value={row.tier}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, tier: e.target.value as Tier } : r)),
                    )
                  }
                  className="input mt-1 w-full"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Status
                <select
                  value={row.status}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, status: e.target.value as Status } : r)),
                    )
                  }
                  className="input mt-1 w-full"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Expires
                <input
                  type="date"
                  value={row.expires_at ? row.expires_at.slice(0, 10) : ""}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, expires_at: e.target.value || null } : r,
                      ),
                    )
                  }
                  className="input mt-1 w-full"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Notes
                <input
                  value={row.notes ?? ""}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, notes: e.target.value } : r)),
                    )
                  }
                  className="input mt-1 w-full"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveRow(row)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Save className="size-4" /> Save
              </button>
              <button
                type="button"
                onClick={() => void toggleAdmin(row)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                {admins.includes(row.id) ? (
                  <>
                    <ShieldOff className="size-4" /> Revoke admin
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 text-primary" /> Make admin
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        {!busy && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        )}
      </div>
    </div>
  );
}
