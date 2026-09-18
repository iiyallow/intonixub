import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Lock, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IntonixUB — Fast, Private Web Access" },
      {
        name: "description",
        content:
          "IntonixUB is a clean, fast web proxy console with stealth tools, tab cloaking and themeable dark UI.",
      },
      { property: "og:title", content: "IntonixUB — Fast, Private Web Access" },
      {
        property: "og:description",
        content: "A minimal, high-speed proxy console with stealth tools and full theming.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Instant connections",
    body: "Routes through a dedicated edge worker for low-latency browsing.",
  },
  {
    icon: Lock,
    title: "Stealth built in",
    body: "Tab cloaking, panic key and about:blank launching, all configurable.",
  },
  {
    icon: ShieldCheck,
    title: "Clear rules",
    body: "No illegal media and no attack traffic — read the terms before you connect.",
  },
];

function HomePage() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-12">
        <div className="absolute inset-0 bg-mesh opacity-60" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <Globe className="size-3.5 text-primary" /> Private web console
          </span>
          <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
            Intonix<span className="text-primary text-glow">UB</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            A distraction-free console for reaching the sites you need, with stealth tools and a
            fully themeable dark interface.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/settings"
              className="glow inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Open settings
            </Link>
            <Link
              to="/terms"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 font-display font-semibold transition-transform hover:scale-[1.03]"
            >
              Read the rules
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl glass p-5">
            <p className="flex items-center gap-2 font-display font-semibold">
              <Icon className="size-4 text-primary" /> {title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
