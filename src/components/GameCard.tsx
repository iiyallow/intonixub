import { Link } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";
import type { Game } from "@/lib/games";
import { useIntonix } from "@/lib/intonix-store";

export function GameCard({ game }: { game: Game }) {
  const { isFavorite, toggleFavorite, hydrated } = useIntonix();
  const fav = hydrated && isFavorite(game.id);

  return (
    <div className="group card-hover relative overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        to="/play/$id"
        params={{ id: game.id }}
        className="block"
        aria-label={`Play ${game.title}`}
      >
        <div className="relative aspect-4/3 overflow-hidden">
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: game.art }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <span className="glass glow inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <Play className="size-4" /> Play
            </span>
          </div>
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate font-display text-sm font-semibold">{game.title}</p>
          <p className="text-xs text-muted-foreground">
            {game.category} · {(game.plays / 1000).toFixed(0)}k plays
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(game.id)}
        aria-label={fav ? `Unfavorite ${game.title}` : `Favorite ${game.title}`}
        aria-pressed={fav}
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full glass transition-transform hover:scale-110"
      >
        <Heart
          className={`size-4 transition-colors ${fav ? "fill-primary text-primary" : "text-foreground/70"}`}
        />
      </button>
      <span className="absolute top-2 left-2 rounded-full glass px-2.5 py-1 text-[11px] font-medium text-foreground/80">
        {game.category}
      </span>
    </div>
  );
}
