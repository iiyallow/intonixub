import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { tierLabel, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — IntonixUB" },
      {
        name: "description",
        content: "View your IntonixUB subscription tier, status and renewal date.",
      },
      { property: "og:title", content: "Your account — IntonixUB" },
      { property: "og:description", content: "Manage your IntonixUB subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const STATUS_TONE: Record<string, string> = {
  active: "text-primary",
  trialing: "text-primary",
  past_due: "text-destructive",
  canceled: "text-muted-foreground",
  suspended: "text-destructive",
};

function AccountPage() {
  const { loading, session, profile, isAdmin, canProxy, signOut } = useAuth();

  if (loading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">You're signed out</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to see your subscription.</p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Your account</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Signed in as" value={profile?.display_name || session.user.email || "—"} />
        <Field label="Email" value={session.user.email || "—"} />
        <Field label="Plan" value={profile ? tierLabel(profile.tier) : "Free"} />
        <Field
          label="Status"
          value={profile?.status ?? "active"}
          className={STATUS_TONE[profile?.status ?? "active"] ?? ""}
        />
        <Field
          label="Renews / expires"
          value={profile?.expires_at ? new Date(profile.expires_at).toLocaleDateString() : "No end date"}
        />
        <Field label="Console access" value={canProxy ? "Enabled" : "Requires a paid plan"} />
      </div>

      {!canProxy && (
        <p className="mt-6 rounded-2xl glass p-4 text-sm text-muted-foreground">
          Your plan doesn't include the web console yet. Contact us in Discord to upgrade, and your
          access unlocks the moment your tier is updated.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {canProxy && (
          <Link
            to="/proxy"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Open the console
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
          >
            <ShieldCheck className="size-4 text-primary" /> Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold capitalize ${className ?? ""}`}>{value}</p>
    </div>
  );
}
