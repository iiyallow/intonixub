import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Heart, History, Play, Sparkles, Users } from "lucide-react";
import { CATEGORIES, FEATURED_ID, GAMES, getGame } from "@/lib/games";
import { useIntonix } from "@/lib/intonix-store";
import { GameCard } from "@/components/GameCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intonix Games — Clean, Fast Unblocked Games" },
      {
        name: "description",
        content:
          "Play hundreds of browser games instantly on Intonix Games. Minimal dark UI, favorites, recently played and stealth tools built in.",
      },
      { property: "og:title", content: "Intonix Games — Clean, Fast Unblocked Games" },
      {
        property: "og:description",
        content: "A sleek, distraction-free browser arcade with instant play and zero installs.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { recent, favorites, hydrated } = useIntonix();
  const featured = getGame(FEATURED_ID)!;
  const trending = [...GAMES].sort((a, b) => b.plays - a.plays).slice(0, 8);
  const recentGames = recent.map(getGame).filter(Boolean);
  const favGames = favorites.map(getGame).filter(Boolean);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div
          className="absolute inset-0 opacity-70 animate-float"
          style={{ backgroundImage: featured.art }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-card via-card/85 to-card/30" />
        <div className="relative grid gap-8 p-6 md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="size-3.5 text-primary" /> Featured game of the week
            </span>
            <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">{featured.title}</h1>
            <p className="mt-3 max-w-lg text-muted-foreground">{featured.blurb}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/play/$id"
                params={{ id: featured.id }}
                className="glow inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                <Play className="size-4" /> Play Now
              </Link>
              <Link
                to="/games"
                className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 font-display font-semibold transition-transform hover:scale-[1.03]"
              >
                Browse all games
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 self-end md:grid-cols-1">
            <Stat icon={<Flame className="size-4 text-primary" />} label="Games" value={`${GAMES.length * 12}+`} />
            <Stat icon={<Users className="size-4 text-primary" />} label="Active players" value="4,182" />
            <Stat icon={<Sparkles className="size-4 text-primary" />} label="Avg. load" value="0.4s" />
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to="/games"
            search={{ tag: cat }}
            className="shrink-0 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:border-primary/60 hover:text-primary"
          >
            {cat}
          </Link>
        ))}
      </div>

      {hydrated && recentGames.length > 0 && (
        <Section title="Recently played" icon={<History className="size-4 text-primary" />}>
          {recentGames.map((game) => (
            <GameCard key={game!.id} game={game!} />
          ))}
        </Section>
      )}

      {hydrated && favGames.length > 0 && (
        <Section title="Your favorites" icon={<Heart className="size-4 text-primary" />}>
          {favGames.map((game) => (
            <GameCard key={game!.id} game={game!} />
          ))}
        </Section>
      )}

      <Section title="Trending now" icon={<Flame className="size-4 text-primary" />}>
        {trending.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </Section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl glass px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        {icon} {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}
