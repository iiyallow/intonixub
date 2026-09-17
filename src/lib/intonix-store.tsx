import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeId =
  | "intonix"
  | "oled"
  | "cyberpunk"
  | "nord"
  | "catppuccin"
  | "light"
  | "dracula"
  | "gruvbox"
  | "solarized"
  | "synthwave"
  | "forest"
  | "rosewater"
  | "mono"
  | "abyss"
  | "ember"
  | "paper";
export type BackgroundMode = "solid" | "mesh" | "particles" | "image";

export type CloakPreset = {
  id: string;
  title: string;
  favicon: string;
};

export const CLOAK_PRESETS: CloakPreset[] = [
  { id: "none", title: "IntonixUB", favicon: "/favicon.ico" },
  { id: "drive", title: "My Drive - Google Drive", favicon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" },
  { id: "classroom", title: "Classes", favicon: "https://ssl.gstatic.com/classroom/favicon.png" },
  { id: "canvas", title: "Dashboard", favicon: "https://canvas.instructure.com/favicon.ico" },
  { id: "powerschool", title: "PowerSchool SIS", favicon: "https://www.powerschool.com/favicon.ico" },
  { id: "docs", title: "Untitled document - Google Docs", favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
];

export const PANIC_TARGETS = [
  { id: "classroom", label: "Google Classroom", url: "https://classroom.google.com/" },
  { id: "canvas", label: "Canvas", url: "https://canvas.instructure.com/" },
  { id: "drive", label: "Google Drive", url: "https://drive.google.com/" },
  { id: "docs", label: "Google Docs", url: "https://docs.google.com/document/u/0/" },
  { id: "wikipedia", label: "Wikipedia", url: "https://en.wikipedia.org/" },
];

export type Settings = {
  theme: ThemeId;
  accent: string | null;
  background: BackgroundMode;
  backgroundImage: string;
  cloakTitle: string;
  cloakFavicon: string;
  panicKey: string;
  panicUrl: string;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "intonix",
  accent: null,
  background: "mesh",
  backgroundImage: "",
  cloakTitle: "",
  cloakFavicon: "",
  panicKey: "Escape",
  panicUrl: "https://classroom.google.com/",
};

const KEYS = {
  settings: "intonix:settings",
  favorites: "intonix:favorites",
  recent: "intonix:recent",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/** Convert a #rrggbb hex to an oklch() string usable as a CSS color token. */
export function hexToOklch(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1]!, 16);
  const srgb = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const [r, gg, b] = srgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * gg + 0.0514459929 * b);
  const m2 = Math.cbrt(0.2119034982 * r + 0.6806995451 * gg + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * gg + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m2 - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m2 + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m2 - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

type Ctx = {
  hydrated: boolean;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recent: string[];
  markPlayed: (id: string) => void;
  clearData: () => void;
  exportData: () => void;
  importData: (json: string) => boolean;
  panic: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function IntonixProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setSettingsState(read<Settings>(KEYS.settings, DEFAULT_SETTINGS));
    setFavorites(readList(KEYS.favorites));
    setRecent(readList(KEYS.recent));
    setHydrated(true);
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      write(KEYS.settings, next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    write(KEYS.settings, DEFAULT_SETTINGS);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      write(KEYS.favorites, next);
      return next;
    });
  }, []);

  const markPlayed = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 12);
      write(KEYS.recent, next);
      return next;
    });
  }, []);

  const clearData = useCallback(() => {
    setFavorites([]);
    setRecent([]);
    write(KEYS.favorites, []);
    write(KEYS.recent, []);
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, settings, favorites, recent }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intonix-save.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [settings, favorites, recent]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.settings) {
        const next = { ...DEFAULT_SETTINGS, ...parsed.settings };
        setSettingsState(next);
        write(KEYS.settings, next);
      }
      if (Array.isArray(parsed.favorites)) {
        setFavorites(parsed.favorites);
        write(KEYS.favorites, parsed.favorites);
      }
      if (Array.isArray(parsed.recent)) {
        setRecent(parsed.recent);
        write(KEYS.recent, parsed.recent);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const panic = useCallback(() => {
    window.location.replace(settings.panicUrl || DEFAULT_SETTINGS.panicUrl);
  }, [settings.panicUrl]);

  /* Apply theme, accent and background to <html> */
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset["theme"] = settings.theme;
    root.dataset["bg"] = settings.background;
    if (settings.accent) root.style.setProperty("--accent-user", hexToOklch(settings.accent));
    else root.style.removeProperty("--accent-user");
    if (settings.background === "image" && settings.backgroundImage) {
      root.style.setProperty("--custom-bg-image", `url("${settings.backgroundImage}")`);
    } else {
      root.style.removeProperty("--custom-bg-image");
    }
  }, [hydrated, settings.theme, settings.accent, settings.background, settings.backgroundImage]);

  /* Tab cloaking */
  useEffect(() => {
    if (!hydrated) return;
    if (settings.cloakTitle) document.title = settings.cloakTitle;
    if (settings.cloakFavicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.cloakFavicon;
    }
  }, [hydrated, settings.cloakTitle, settings.cloakFavicon]);

  /* Panic key */
  useEffect(() => {
    if (!hydrated) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing && e.key !== "Escape") return;
      if (e.key === settings.panicKey) {
        e.preventDefault();
        panic();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hydrated, settings.panicKey, panic]);

  const value = useMemo<Ctx>(
    () => ({
      hydrated,
      settings,
      setSettings,
      resetSettings,
      favorites,
      toggleFavorite,
      isFavorite: (id: string) => favorites.includes(id),
      recent,
      markPlayed,
      clearData,
      exportData,
      importData,
      panic,
    }),
    [
      hydrated,
      settings,
      setSettings,
      resetSettings,
      favorites,
      toggleFavorite,
      recent,
      markPlayed,
      clearData,
      exportData,
      importData,
      panic,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useIntonix() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useIntonix must be used inside IntonixProvider");
  return ctx;
}
