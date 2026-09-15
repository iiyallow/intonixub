import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CATEGORIES, GAMES } from "@/lib/games";
import { GameCard } from "@/components/GameCard";

const searchSchema = z.object({
  tag: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/games")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "All Games — Intonix Games" },
      {
        name: "description",
        content:
          "Browse the full Intonix Games library: action, retro, 3D, multiplayer, puzzle and strategy games that load instantly in your browser.",
      },
      { property: "og:title", content: "All Games — Intonix Games" },
      {
        property: "og:description",
        content: "Filter by category, favorite what you love, and play instantly — no installs.",
      },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { tag } = Route.useSearch();
  const [query, setQuery] = useState("");

  const filtered = GAMES.filter((game) => {
    const byTag = !tag || game.tags.includes(tag);
    const byQuery = !query.trim() || game.title.toLowerCase().includes(query.trim().toLowerCase());
    return byTag && byQuery;
  });

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold">
            <Gamepad2 className="size-6 text-primary" /> Game Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} game{filtered.length === 1 ? "" : "s"}
            {tag ? ` in ${tag}` : ""}
          </p>
        </div>
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-input bg-secondary/60 px-3 py-2 focus-within:glow">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter this list…"
            aria-label="Filter games"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <Link
          to="/games"
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            !tag ? "border-primary/60 text-primary glow" : "border-border bg-secondary/60"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to="/games"
            search={{ tag: cat }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tag === cat
                ? "border-primary/60 text-primary glow"
                : "border-border bg-secondary/60 hover:border-primary/50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          Nothing matched that. Try another category or search term.
        </p>
      )}
    </div>
  );
}
