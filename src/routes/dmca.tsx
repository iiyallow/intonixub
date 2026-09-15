import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "DMCA / Take Down Request — Intonix Games" },
      {
        name: "description",
        content:
          "Submit a copyright take down request for content listed on Intonix Games, including the details we need to act quickly.",
      },
      { property: "og:title", content: "DMCA / Take Down Request — Intonix Games" },
      { property: "og:description", content: "How to request removal of content from Intonix Games." },
    ],
  }),
  component: () => (
    <LegalPage title="DMCA / Take Down Request" updated="Reviewed September 2026">
      <p>
        We respect creators. If your work is listed here without permission, we will remove the
        listing promptly once we can verify the request.
      </p>
      <h2>What to include</h2>
      <ul>
        <li>Your name, organization and contact email.</li>
        <li>A link to the page on this site containing the material.</li>
        <li>A description of the original work and proof of ownership.</li>
        <li>A statement that you have a good-faith belief the use is unauthorized.</li>
        <li>A statement, under penalty of perjury, that the information is accurate.</li>
      </ul>
      <h2>Where to send it</h2>
      <p>
        Email the details to <strong>takedown@intonix.games</strong>. Replace this address with your
        own before publishing the site.
      </p>
      <h2>Response time</h2>
      <p>Verified requests are actioned within 72 hours and you will receive confirmation.</p>
    </LegalPage>
  ),
});
