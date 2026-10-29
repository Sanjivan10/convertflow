import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Contact ${siteConfig.name}: report a bug, ask about a tool, make a privacy request or discuss advertising. We usually reply within 2 business days.`,
  path: "/contact",
});

const CONTACT_EMAIL = "team.idea2grow@gmail.com";

export default function ContactPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Contact Us</h1>

      <div className="article mt-8">
        <p>
          Have a question, found a bug, or want to report an issue with a
          conversion? Email us and we'll get back to you as soon as we can.
        </p>

        <p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 no-underline"
          >
            <Mail className="size-4" />
            {CONTACT_EMAIL}
          </a>
        </p>

        <p>
          We usually reply within <strong>2 business days</strong>. You can also
          reach us on{" "}
          <a href="https://x.com/DhakalSanjivan" target="_blank" rel="me noopener">
            X (@DhakalSanjivan)
          </a>
          .
        </p>

        <h2>Reporting a problem with a tool</h2>
        <p>To help us fix it fast, please include:</p>
        <ul>
          <li>The tool’s name or page link.</li>
          <li>Your device and browser (for example “Android, Chrome” or “iPhone, Safari”).</li>
          <li>What you expected and what happened instead (a screenshot helps).</li>
          <li>The file type and roughly its size. Please don’t send private files.</li>
        </ul>

        <h2>Privacy or data requests</h2>
        <p>
          For questions about how your data is handled, see our{" "}
          <a href="/privacy">Privacy Policy</a>, or email us at the address
          above.
        </p>

        <h2>Advertising and business inquiries</h2>
        <p>
          For anything related to advertising or partnerships, use the same
          email above.
        </p>
      </div>
    </div>
  );
}
