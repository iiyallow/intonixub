import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile, type Status, type Tier } from "@/lib/auth";
import { DEFAULT_PROXY_BASE, type ProxyMode } from "@/lib/proxy";

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
  const [proxyBase, setProxyBase] = useState("");
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
    setProxyBase(map.get("proxy_base_url") || DEFAULT_PROXY_BASE);
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
    const { error } = await supabase.from("app_settings").upsert(
      [
        { key: "proxy_base_url", value: proxyBase.trim() },
        { key: "proxy_mode", value: proxyMode },
      ],
      { onConflict: "key" },
    );
    setMessage(error ? error.message : "Proxy engine updated");
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
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={proxyBase}
            onChange={(e) => setProxyBase(e.target.value)}
            className="input w-full"
            placeholder="https://your-proxy.workers.dev"
          />
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
