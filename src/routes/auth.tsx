import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — IntonixUB" },
      {
        name: "description",
        content: "Sign in to IntonixUB or create an account to use the private web console.",
      },
      { property: "og:title", content: "Sign in — IntonixUB" },
      { property: "og:description", content: "Access your IntonixUB subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "in") {
      const err = await signIn(identifier, password);
      setBusy(false);
      if (err) return setError(err);
      void navigate({ to: "/account" });
      return;
    }
    const res = await signUp(identifier, password);
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.needsConfirm) {
      setNotice("Check your email to confirm the account, then sign in.");
      setMode("in");
      return;
    }
    void navigate({ to: "/account" });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-3xl glass p-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {mode === "in" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your email, or your username if you have one.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email or username
            </label>
            <input
              id="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="input w-full"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-primary">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "in" ? (
              <LogIn className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "in" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          , including the prohibited-use rules.
        </p>
      </div>
    </div>
  );
}
