import { DEFAULT_PROXY_BASE } from "@/lib/proxy";

/**
 * Upstream engine addresses, tried in priority order. When the active one stops
 * answering (blocked, timed out, or crashed) the console moves to the next.
 */
export const DEFAULT_ENGINES = [
  DEFAULT_PROXY_BASE,
  "https://cvzdmqxxvhgtgdbyfo3xmhm7yy0bolmt.lambda-url.us-east-2.on.aws",
];

const ACTIVE_KEY = "intonix:active-engine";

export type Shortcut = { name: string; url: string };

const SHORTCUTS_KEY = "intonix:shortcuts";

/** Turn a newline/comma separated list into clean engine addresses. */
export function parseEngines(raw: string | null | undefined): string[] {
  const list = (raw ?? "")
    .split(/[\n,]+/)
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter((entry) => /^https?:\/\//i.test(entry));
  return list.length ? [...new Set(list)] : DEFAULT_ENGINES;
}

/** Short readable name for an engine address. */
export function engineLabel(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] ?? url;
  } catch {
    return url;
  }
}

export function readActiveEngine(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function writeActiveEngine(url: string) {
  try {
    window.localStorage.setItem(ACTIVE_KEY, url);
  } catch {
    /* storage unavailable */
  }
}

/** A live Bare server answers / with a small JSON metadata document. */
export async function probeEngine(url: string, timeoutMs = 4000): Promise<boolean> {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const text = await res.text();
    return /"(versions|language|memory)"/.test(text);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** First healthy address, preferring the one already in use. */
export async function pickEngine(engines: string[], preferred?: string | null): Promise<string> {
  const order =
    preferred && engines.includes(preferred)
      ? [preferred, ...engines.filter((entry) => entry !== preferred)]
      : engines;
  const alive = await Promise.all(order.map((entry) => probeEngine(entry)));
  const index = alive.findIndex(Boolean);
  return index === -1 ? engines[0]! : order[index]!;
}

/** Next healthy address after `current`, wrapping around the priority list. */
export async function nextEngine(engines: string[], current: string): Promise<string | null> {
  const from = engines.indexOf(current);
  const order = [...engines.slice(from + 1), ...engines.slice(0, Math.max(from, 0))];
  for (const candidate of order) {
    if (candidate === current) continue;
    if (await probeEngine(candidate)) return candidate;
  }
  return null;
}

export function loadShortcuts(): Shortcut[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(SHORTCUTS_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (entry): entry is Shortcut =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as Shortcut).url === "string" &&
        typeof (entry as Shortcut).name === "string",
    );
  } catch {
    return [];
  }
}

export function saveShortcuts(list: Shortcut[]) {
  try {
    window.localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}
