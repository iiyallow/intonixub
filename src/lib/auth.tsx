import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Tier = "free" | "plus" | "pro" | "lifetime";
export type Status = "active" | "trialing" | "past_due" | "canceled" | "suspended";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  tier: Tier;
  status: Status;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
};

export const ADMIN_USERNAME = "Intonix";
const ACCOUNT_DOMAIN = "intonixub.app";
const COOKIE = "intonixub_session";

/** Accounts can sign in with an email or a bare username (admin uses "Intonix"). */
export function toEmail(identifier: string) {
  const value = identifier.trim();
  return value.includes("@") ? value : `${value.toLowerCase()}@${ACCOUNT_DOMAIN}`;
}

/* ---------- cookie-backed session ---------- */
function writeCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  if (!session) {
    document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  const payload = btoa(
    JSON.stringify({ a: session.access_token, r: session.refresh_token }),
  );
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE}=${payload}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`;
}

function readCookie(): { a: string; r: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(atob(match.slice(COOKIE.length + 1)));
    return typeof parsed?.a === "string" && typeof parsed?.r === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function tierLabel(tier: Tier) {
  return { free: "Free", plus: "Plus", pro: "Pro", lifetime: "Lifetime" }[tier];
}

export function hasProxyAccess(profile: Profile | null, isAdmin: boolean) {
  if (isAdmin) return true;
  if (!profile) return false;
  if (profile.tier === "free") return false;
  if (profile.status !== "active" && profile.status !== "trialing") return false;
  if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) return false;
  return true;
}

type Ctx = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  canProxy: boolean;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signUp: (identifier: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadAccount = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile | null) ?? null);
    setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      writeCookie(next);
      void loadAccount(next?.user.id);
    });

    (async () => {
      let { data } = await supabase.auth.getSession();
      if (!data.session) {
        const cookie = readCookie();
        if (cookie) {
          const restored = await supabase.auth.setSession({
            access_token: cookie.a,
            refresh_token: cookie.r,
          });
          data = { session: restored.data.session };
        }
      }
      if (!active) return;
      setSession(data.session);
      writeCookie(data.session);
      await loadAccount(data.session?.user.id);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAccount]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(identifier),
      password,
    });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (identifier: string, password: string) => {
    const email = toEmail(identifier);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message, needsConfirm: false };
    return { error: null, needsConfirm: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    writeCookie(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadAccount(data.session?.user.id);
  }, [loadAccount]);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      session,
      profile,
      isAdmin,
      canProxy: hasProxyAccess(profile, isAdmin),
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [loading, session, profile, isAdmin, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
