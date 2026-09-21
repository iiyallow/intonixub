import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "DMCA / Take Down Request — IntonixUB" },
      {
        name: "description",
        content:
          "Information required to submit a copyright take down request concerning IntonixUB.",
      },
      { property: "og:title", content: "DMCA / Take Down Request — IntonixUB" },
      { property: "og:description", content: "How to submit a copyright request concerning IntonixUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="DMCA / Take Down Request" updated="Reviewed September 2026">
      <p>
        We respect creators. IntonixUB does not host third-party sites reached through the proxy, but
        we review valid notices concerning material under our control.
      </p>
      <h2>What to include</h2>
      <ul>
        <li>Your name, organization and contact email.</li>
        <li>The exact IntonixUB location or account connected to the reported material.</li>
        <li>A description of the original work and proof of ownership.</li>
        <li>A statement that you have a good-faith belief the use is unauthorized.</li>
        <li>A statement, under penalty of perjury, that the information is accurate.</li>
      </ul>
      <h2>How notices are handled</h2>
      <p>
        Submit the notice through the official support channel linked in the site footer. We may ask
        for more information, restrict an account or disable material under our control while a valid
        request is reviewed. Requests about content hosted by another site should be sent to that
        site's operator.
      </p>
    </LegalPage>
  ),
});
