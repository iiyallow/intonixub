import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ExternalLink,
  Heart,
  Lightbulb,
  Maximize,
  RotateCw,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getGame, relatedGames } from "@/lib/games";
import { useIntonix } from "@/lib/intonix-store";
import { GameCard } from "@/components/GameCard";

export const Route = createFileRoute("/play/$id")({
  loader: ({ params }) => {
    const game = getGame(params.id);
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Game unavailable — Intonix Games" }, { name: "robots", content: "noindex" }],
      };
    }
    const { game } = loaderData;
    return {
      meta: [
        { title: `Play ${game.title} — Intonix Games` },
        { name: "description", content: `${game.blurb} Play ${game.title} instantly in your browser on Intonix Games.` },
        { property: "og:title", content: `Play ${game.title} — Intonix Games` },
        { property: "og:description", content: game.blurb },
      ],
    };
  },
  component: PlayPage,
});

function PlayPage() {
  const { game } = Route.useLoaderData();
  const { isFavorite, toggleFavorite, markPlayed, hydrated } = useIntonix();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [nonce, setNonce] = useState(0);
  const [lightsOff, setLightsOff] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const src = game.embedUrl || customUrl;
  const fav = hydrated && isFavorite(game.id);

  useEffect(() => {
    markPlayed(game.id);
  }, [game.id, markPlayed]);

  const openBlank = () => {
    const win = window.open("about:blank", "_blank");
    if (!win) return;
    win.document.write(
      `<!doctype html><title>${document.title}</title><style>html,body{margin:0;height:100%;background:#0b0f1a}iframe{border:0;width:100%;height:100%}</style><iframe src="${src || window.location.href}" allowfullscreen></iframe>`,
    );
    win.document.close();
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-6">
      <Link
        to="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to library
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{game.title}</h1>
          <p className="text-sm text-muted-foreground">
            {game.category} · {game.blurb}
          </p>
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        <div className="flex flex-wrap items-center gap-2 rounded-t-2xl glass px-3 py-2">
          <ControlButton onClick={() => setNonce((n) => n + 1)} icon={<RotateCw className="size-4" />} label="Reload" />
          <ControlButton
            onClick={() => wrapRef.current?.requestFullscreen?.()}
            icon={<Maximize className="size-4" />}
            label="Fullscreen"
          />
          <ControlButton
            onClick={() => setLightsOff((v) => !v)}
            icon={<Lightbulb className="size-4" />}
            label={lightsOff ? "Lights on" : "Lights off"}
            active={lightsOff}
          />
          <ControlButton
            onClick={() => toggleFavorite(game.id)}
            icon={<Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} />}
            label={fav ? "Favorited" : "Favorite"}
            active={fav}
          />
          <ControlButton
            onClick={openBlank}
            icon={<ExternalLink className="size-4" />}
            label="about:blank"
          />
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-b-2xl border border-border bg-black">
          {src ? (
            <iframe
              key={nonce}
              ref={frameRef}
              src={src}
              title={game.title}
              allowFullScreen
              className="size-full"
            />
          ) : (
            <div className="grid size-full place-items-center p-6 text-center">
              <div className="max-w-md">
                <p className="font-display text-lg font-semibold">No embed host set for this game</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Paste the game's embed URL below to load it in this player.
                </p>
                <EmbedInput onSubmit={setCustomUrl} />
              </div>
            </div>
          )}
        </div>

        {lightsOff && (
          <div
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightsOff(false)}
            aria-hidden
          />
        )}
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold">Related games</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {relatedGames(game).map((rel) => (
            <GameCard key={rel.id} game={rel} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EmbedInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://example.com/game/"
        aria-label="Embed URL"
        className="w-full rounded-xl border border-input bg-secondary/60 px-3 py-2 text-sm outline-none focus:glow"
      />
      <button
        type="submit"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Load
      </button>
    </form>
  );
}

function ControlButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-40 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/70 text-foreground/80 hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
