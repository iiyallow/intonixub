import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Intonix Games" },
      {
        name: "description",
        content:
          "The rules for using Intonix Games: acceptable use, third-party game content, and limits of liability.",
      },
      { property: "og:title", content: "Terms of Service — Intonix Games" },
      { property: "og:description", content: "Acceptable use and content terms for Intonix Games." },
    ],
  }),
  component: () => (
    <LegalPage title="Terms of Service" updated="Reviewed September 2026">
      <p>
        By using Intonix Games you agree to these terms. If you do not agree, please stop using the
        site.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Follow the rules of any network you are on, including school and workplace policies.</li>
        <li>Do not use the site to harass others, distribute malware or break the law.</li>
        <li>Do not attempt to disrupt, scrape at scale or overload the service.</li>
      </ul>
      <h2>Content</h2>
      <p>
        Games are created and hosted by third parties and remain the property of their creators.
        Intonix Games links to and frames that content; we make no claim of ownership.
      </p>
      <h2>No warranty</h2>
      <p>
        The service is provided "as is" without warranties of any kind. Availability of individual
        games can change without notice.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms; continued use means you accept the current version.</p>
    </LegalPage>
  ),
});
