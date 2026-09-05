import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with the ${siteConfig.name} team.`,
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
