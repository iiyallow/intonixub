import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Intonix Games" },
      {
        name: "description",
        content:
          "How Intonix Games handles data: preferences, favorites and recently played games stay in your browser's local storage.",
      },
      { property: "og:title", content: "Privacy Policy — Intonix Games" },
      { property: "og:description", content: "Local-first data handling at Intonix Games." },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="Reviewed September 2026">
      <p>
        Intonix Games is built local-first. Your theme, accent color, tab cloak, panic keybind,
        favorites and recently played list are stored in your browser's local storage on this device
        only. We do not require an account.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Appearance and stealth preferences you set on the Settings page.</li>
        <li>Your favorite games and recent play history.</li>
      </ul>
      <h2>What we do not store</h2>
      <ul>
        <li>Names, emails, passwords or payment details.</li>
        <li>Anything you type into the proxy console.</li>
      </ul>
      <h2>Third-party games</h2>
      <p>
        Games load inside an embedded frame from their original hosts. Those hosts have their own
        privacy practices, which we do not control.
      </p>
      <h2>Clearing your data</h2>
      <p>
        Settings → Data &amp; Storage lets you export, import, clear or reset everything at any time.
      </p>
    </LegalPage>
  ),
});
