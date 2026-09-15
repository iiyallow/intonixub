import { createFileRoute } from "@tanstack/react-router";
import { Database, Keyboard, Palette, VenetianMask } from "lucide-react";
import { useRef, useState } from "react";
import {
  CLOAK_PRESETS,
  DEFAULT_SETTINGS,
  PANIC_TARGETS,
  useIntonix,
  type BackgroundMode,
  type ThemeId,
} from "@/lib/intonix-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Intonix Games" },
      {
        name: "description",
        content:
          "Customize Intonix Games: tab cloaking, six themes, custom accent colors, animated backgrounds, panic keybinds and save-data tools.",
      },
      { property: "og:title", content: "Settings — Intonix Games" },
      {
        property: "og:description",
        content: "Themes, tab cloaking, panic keybinds and save data — all in one place.",
      },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "intonix", label: "Intonix Dark", swatch: "linear-gradient(135deg,#1b2233,#4c7dfd)" },
  { id: "oled", label: "Midnight OLED", swatch: "linear-gradient(135deg,#000,#3d3d3d)" },
  { id: "cyberpunk", label: "Cyberpunk", swatch: "linear-gradient(135deg,#2b0f3a,#ff2e88)" },
  { id: "nord", label: "Nord", swatch: "linear-gradient(135deg,#3b4252,#88c0d0)" },
  { id: "catppuccin", label: "Catppuccin", swatch: "linear-gradient(135deg,#302d41,#f5c2e7)" },
  { id: "light", label: "Light Mode", swatch: "linear-gradient(135deg,#f4f6fb,#3a6df0)" },
];

const BACKGROUNDS: { id: BackgroundMode; label: string }[] = [
  { id: "solid", label: "Solid color" },
  { id: "mesh", label: "Gradient mesh" },
  { id: "particles", label: "Animated particles" },
  { id: "image", label: "Custom image" },
];

function SettingsPage() {
  const {
    settings,
    setSettings,
    resetSettings,
    clearData,
    exportData,
    importData,
    favorites,
    recent,
  } = useIntonix();
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything is stored locally on this device and applies instantly.
      </p>

      {notice && (
        <p className="mt-4 rounded-xl glass px-4 py-2 text-sm text-primary">{notice}</p>
      )}

      {/* Cloaking */}
      <Card icon={<VenetianMask className="size-4 text-primary" />} title="Tab cloaking & stealth">
        <div className="grid gap-3 sm:grid-cols-3">
          {CLOAK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                setSettings({
                  cloakTitle: preset.id === "none" ? "" : preset.title,
                  cloakFavicon: preset.id === "none" ? "/favicon.ico" : preset.favicon,
                })
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                settings.cloakTitle === preset.title || (preset.id === "none" && !settings.cloakTitle)
                  ? "border-primary/60 glow"
                  : "border-border bg-secondary/50 hover:border-primary/40"
              }`}
            >
              <img src={preset.favicon} alt="" className="size-4 rounded" />
              <span className="truncate">{preset.id === "none" ? "No cloak" : preset.title}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Custom tab title">
            <input
              value={settings.cloakTitle}
              onChange={(e) => setSettings({ cloakTitle: e.target.value })}
              placeholder="Intonix Games"
              className="input"
            />
          </Field>
          <Field label="Custom favicon URL">
            <input
              value={settings.cloakFavicon}
              onChange={(e) => setSettings({ cloakFavicon: e.target.value })}
              placeholder="https://example.com/icon.png"
              className="input"
            />
          </Field>
        </div>
      </Card>

      {/* Appearance */}
      <Card icon={<Palette className="size-4 text-primary" />} title="Appearance & themes">
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setSettings({ theme: theme.id })}
              className={`overflow-hidden rounded-xl border text-left transition-colors ${
                settings.theme === theme.id
                  ? "border-primary/60 glow"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="block h-14 w-full" style={{ backgroundImage: theme.swatch }} aria-hidden />
              <span className="block px-3 py-2 text-sm font-medium">{theme.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Accent color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.accent ?? "#4c7dfd"}
                onChange={(e) => setSettings({ accent: e.target.value })}
                aria-label="Accent color"
                className="size-10 cursor-pointer rounded-lg border border-input bg-transparent"
              />
              <button
                type="button"
                onClick={() => setSettings({ accent: null })}
                className="rounded-lg bg-secondary/70 px-3 py-2 text-xs font-medium"
              >
                Use theme default
              </button>
            </div>
          </Field>

          <Field label="Background style">
            <div className="flex flex-wrap gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setSettings({ background: bg.id })}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    settings.background === bg.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/70"
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {settings.background === "image" && (
          <Field label="Background image URL" className="mt-4">
            <input
              value={settings.backgroundImage}
              onChange={(e) => setSettings({ backgroundImage: e.target.value })}
              placeholder="https://images.example.com/wallpaper.jpg"
              className="input"
            />
          </Field>
        )}
      </Card>

      {/* Keybinds */}
      <Card icon={<Keyboard className="size-4 text-primary" />} title="Keybinds & emergency redirect">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Panic key">
            <button
              type="button"
              onClick={() => setListening(true)}
              onKeyDown={(e) => {
                if (!listening) return;
                e.preventDefault();
                setSettings({ panicKey: e.key });
                setListening(false);
                flash(`Panic key set to "${e.key}".`);
              }}
              className={`w-full rounded-xl border px-4 py-3 font-mono text-sm ${
                listening ? "border-primary/60 glow" : "border-input bg-secondary/50"
              }`}
            >
              {listening ? "Press any key…" : settings.panicKey}
            </button>
          </Field>

          <Field label="Redirect destination">
            <select
              value={settings.panicUrl}
              onChange={(e) => setSettings({ panicUrl: e.target.value })}
              className="input"
            >
              {PANIC_TARGETS.map((target) => (
                <option key={target.id} value={target.url}>
                  {target.label}
                </option>
              ))}
              {!PANIC_TARGETS.some((t) => t.url === settings.panicUrl) && (
                <option value={settings.panicUrl}>Custom</option>
              )}
            </select>
          </Field>
        </div>
        <Field label="Custom redirect URL" className="mt-4">
          <input
            value={settings.panicUrl}
            onChange={(e) => setSettings({ panicUrl: e.target.value })}
            className="input"
          />
        </Field>
      </Card>

      {/* Data */}
      <Card icon={<Database className="size-4 text-primary" />} title="Data & storage">
        <p className="text-sm text-muted-foreground">
          {favorites.length} favorite{favorites.length === 1 ? "" : "s"} · {recent.length} recently
          played
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Action onClick={exportData}>Export save data</Action>
          <Action onClick={() => fileRef.current?.click()}>Import save data</Action>
          <Action
            onClick={() => {
              clearData();
              flash("Local cache cleared.");
            }}
          >
            Clear local cache
          </Action>
          <Action
            danger
            onClick={() => {
              resetSettings();
              flash("Preferences reset to defaults.");
            }}
          >
            Reset preferences
          </Action>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ok = importData(await file.text());
            flash(ok ? "Save data imported." : "That file could not be read.");
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Defaults: {DEFAULT_SETTINGS.theme} theme, panic key {DEFAULT_SETTINGS.panicKey}.
        </p>
      </Card>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl glass p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Action({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.03] ${
        danger
          ? "border border-destructive/50 text-destructive"
          : "bg-secondary/70 text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
