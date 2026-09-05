import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `The terms for using ${siteConfig.name}'s free file-conversion and PDF tools.`,
  path: "/terms",
});

const UPDATED = "September 5, 2026";

export default function TermsPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Terms of Service", path: "/terms" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="article mt-8">
        <p>
          By using {siteConfig.name}, you agree to these terms. Please read
          them — they're short.
        </p>

        <h2>The service</h2>
        <p>
          {siteConfig.name} provides free tools to convert, compress, and
          edit files. Most tools run entirely in your browser; a few send
          your file to a third-party conversion provider to process it, as
          described in our <a href="/privacy">Privacy Policy</a>. The
          service is provided free of charge, with no account required for
          the tools themselves.
        </p>

        <h2>Your files, your responsibility</h2>
        <p>
          You retain all rights to any file you convert or edit using this
          site. You're responsible for making sure you have the right to
          upload, convert, or process any file you use with our tools, and
          for not using the service for anything illegal, infringing, or
          harmful — including malware, content that violates someone else's
          rights, or content that's unlawful where you live.
        </p>

        <h2>No warranty</h2>
        <p>
          The service is provided "as is," without warranty of any kind. We
          do our best to keep conversions accurate and the site available,
          but we don't guarantee the service will be uninterrupted,
          error-free, or fit for any particular purpose. Always keep a
          backup of your original files — we are not liable for any loss of
          data, or for any damages arising from your use of the service, to
          the fullest extent permitted by law.
        </p>

        <h2>Advertising</h2>
        <p>
          This site may display advertising, including through Google
          AdSense, to help keep the tools free. Ads are served by
          third-party providers according to their own policies.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms or the site's tools at any time.
          Continuing to use the site after a change means you accept the
          updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Reach out via our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
