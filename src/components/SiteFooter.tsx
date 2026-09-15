import { Link } from "@tanstack/react-router";
import { MessageCircle, Users } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-20 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-extrabold">
            Intonix<span className="text-primary text-glow"> Games</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            A clean, fast, distraction-free arcade. No installs, no clutter — just play.
          </p>
        </div>

        <nav className="text-sm">
          <p className="mb-3 font-display font-semibold">Legal</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/privacy" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/dmca" className="transition-colors hover:text-primary">
                DMCA / Take Down Request
              </Link>
            </li>
          </ul>
        </nav>

        <div className="rounded-2xl glass p-4">
          <p className="flex items-center gap-2 font-display font-semibold">
            <MessageCircle className="size-4 text-primary" /> Community
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Game requests, updates and mirrors — all in the Discord.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4 text-primary" /> 12,480 members · 843 online
          </div>
          <a
            href="https://discord.com/invite"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Join the Discord
          </a>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Intonix Games. All games belong to their respective creators.
      </div>
    </footer>
  );
}
