import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — IntonixUB" },
      {
        name: "description",
        content:
          "How IntonixUB handles data: your preferences stay in your browser's local storage and we do not log your browsing.",
      },
      { property: "og:title", content: "Privacy Policy — IntonixUB" },
      { property: "og:description", content: "Local-first data handling at IntonixUB." },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="Reviewed September 2026">
      <p>
        IntonixUB is built local-first. Your theme, accent color, tab cloak and panic keybind are
        stored in your browser's local storage on this device only.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Appearance and stealth preferences you set on the Settings page.</li>
        <li>Your account email and subscription tier, if you create an account.</li>
      </ul>
      <h2>What we do not store</h2>
      <ul>
        <li>Payment card details.</li>
        <li>Logs of the addresses you open through the proxy console.</li>
      </ul>
      <h2>Third-party sites</h2>
      <p>
        Sites load through the proxy from their original hosts. Those hosts have their own privacy
        practices, which we do not control.
      </p>

      <h2>Clearing your data</h2>
      <p>
        Settings → Data &amp; Storage lets you export, import, clear or reset everything at any time.
      </p>
    </LegalPage>
  ),
});
