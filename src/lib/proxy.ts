/** Default proxy endpoint (admins can change it in Settings → Proxy engine). */
export const DEFAULT_PROXY_BASE = "https://kzcmrro7sine2i3tqbzch2y3jq0ozjjc.lambda-url.us-east-2.on.aws";

/** Site icon for a URL. */
export function faviconOf(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return "";
  }
}

export type ProxyMode = "query" | "encoded" | "path";

/** Turn free-form input into a full URL (or a search URL). */
export function normalizeTarget(input: string) {
  const value = input.trim();
  if (!value) return "";
  const looksLikeUrl =
    /^[a-z]+:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(value);
  return looksLikeUrl
    ? value.startsWith("http")
      ? value
      : `https://${value}`
    : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

/** Build the proxied URL for a target site. */
export function buildProxyUrl(base: string, mode: ProxyMode, target: string) {
  const root = (base || DEFAULT_PROXY_BASE).replace(/\/+$/, "");
  const url = normalizeTarget(target);
  if (!url) return "";
  if (mode === "path") return `${root}/${url}`;
  if (mode === "encoded") return `${root}/service/${encodeURIComponent(btoa(url))}`;
  return `${root}/?url=${encodeURIComponent(url)}`;
}

export const QUICK_LAUNCH = [
  { name: "Discord", url: "https://discord.com/", art: "linear-gradient(135deg,#5865f2,#3b45c4)" },
  { name: "YouTube", url: "https://www.youtube.com/", art: "linear-gradient(135deg,#ff4e45,#b3120c)" },
  { name: "Google", url: "https://www.google.com/", art: "linear-gradient(135deg,#4285f4,#34a853)" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/", art: "linear-gradient(135deg,#9aa0a6,#4b4f54)" },
  { name: "Spotify", url: "https://open.spotify.com/", art: "linear-gradient(135deg,#1ed760,#0f7a37)" },
  { name: "GitHub", url: "https://github.com/", art: "linear-gradient(135deg,#6e7681,#24292f)" },
  { name: "Twitch", url: "https://www.twitch.tv/", art: "linear-gradient(135deg,#a970ff,#5c16c5)" },
];
