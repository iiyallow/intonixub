import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — IntonixUB" },
      {
        name: "description",
        content:
          "Rules for using IntonixUB, including prohibited proxy activity, subscription terms, and limits of liability.",
      },
      { property: "og:title", content: "Terms of Service — IntonixUB" },
      { property: "og:description", content: "Acceptable use and subscription terms for IntonixUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Terms of Service" updated="Reviewed September 2026">
      <p>
        By using IntonixUB you agree to these terms. If you do not agree, please stop using the
        site.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Follow the rules of any network you are on, including school and workplace policies.</li>
        <li>Do not access, watch, share or download illegal material.</li>
        <li>Do not launch, assist or conceal cyberattacks, malware, phishing or unauthorized access.</li>
        <li>Do not harass others, evade lawful controls, scrape at scale, disrupt or overload services.</li>
      </ul>
      <h2>Content</h2>
      <p>
        Content reached through the proxy belongs to its original owners. IntonixUB only relays
        requests; we make no claim of ownership.
      </p>
      <h2>No warranty</h2>
      <p>
        The service is provided "as is" without warranties of any kind. We do not guarantee that a
        particular site, feature or connection will remain available.
      </p>
      <h2>Subscriptions, suspension and refunds</h2>
      <p>
        Paid access is a limited, revocable license. To the fullest extent permitted by law, payments
        are final and non-refundable. We may suspend or terminate access at any time, including for a
        suspected violation of these terms, without notice or refund. Nothing here limits rights that
        cannot legally be waived in your jurisdiction.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; continued use means you accept the current version.</p>
    </LegalPage>
  ),
});
