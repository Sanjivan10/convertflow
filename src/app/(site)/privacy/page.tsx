import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles your files and data: in-browser processing, first-party analytics, cookies, Google AdSense advertising, and your privacy rights.`,
  path: "/privacy",
});

const UPDATED = "October 29, 2026";
const CONTACT_EMAIL = "team.idea2grow@gmail.com";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Privacy Policy", path: "/privacy" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="article mt-8">
        <p>
          {siteConfig.name} (“we”, “us”, “our”) runs the website{" "}
          {siteConfig.url.replace(/^https?:\/\//, "")}, a set of free file
          conversion, compression, PDF and logo tools. This policy explains, in
          plain language, what happens to your files, what data we collect, how
          cookies and advertising work on this site, and the choices you have.
        </p>

        <h2>Summary</h2>
        <ul>
          <li>Most tools process your files <strong>in your browser</strong> — the file never reaches our servers.</li>
          <li>A few document conversions use a server; those files are processed and not stored.</li>
          <li>Our own analytics uses <strong>no cookies</strong> and does <strong>not store IP addresses</strong>.</li>
          <li>We show ads through <strong>Google AdSense</strong>, which uses cookies. You can opt out of personalized ads.</li>
          <li>You don’t need an account, and we don’t sell your personal information.</li>
        </ul>

        <h2>1. Your files</h2>
        <h3>Tools that run entirely in your browser</h3>
        <p>
          Image converters, image compressors, the Motion Logo PNG Maker, and
          most PDF tools (merge, split, compress, organize, redact, fill forms,
          sign and OCR) use your browser’s own processing (Canvas API,
          WebAssembly, pdf.js, pdf-lib, tesseract.js). Your file is read,
          processed and handed back to you on your own device. It is never
          uploaded to us.
        </p>
        <h3>Tools that use a server</h3>
        <p>
          A few conversions need an office-document engine that can’t run in a
          browser: <strong>Word, PowerPoint and Excel to PDF, PDF to
          PowerPoint, PDF to PDF/A</strong>, and server-based GIF, video and
          audio compression. For these tools only, your file is sent over an
          encrypted (HTTPS) connection to a document-conversion provider,
          converted, and returned to you. We do not keep a copy, and the
          provider processes it only to perform the conversion. Each of these
          tools says so on its page.
        </p>
        <h3>Conversion logs</h3>
        <p>
          When a conversion finishes, we may log the tool used, the input and
          output formats, the file’s <strong>name and size</strong>, how long it
          took and whether it succeeded — <strong>never the file’s
          contents</strong>. We use this to find broken tools and improve speed.
        </p>

        <h2>2. Information we collect</h2>
        <h3>First-party analytics</h3>
        <p>
          We record simple, anonymous usage events: pages visited, the website
          that referred you (for example a search engine or an AI assistant),
          tools used, words typed into our site search box, and button clicks.
          We also record an approximate <strong>country</strong>, worked out
          from your IP address by our hosting provider — the IP address itself
          is not stored. This analytics sets <strong>no cookies</strong> and is
          not linked to your name, email or any account.
        </p>
        <h3>Information you send us</h3>
        <p>
          If you email us, we receive your email address and whatever you
          include in your message, and use it only to reply.
        </p>
        <h3>Technical logs</h3>
        <p>
          Like every website, our hosting and security providers automatically
          process technical data (IP address, browser type, time of request) to
          deliver pages and protect the site from abuse. These logs are kept for
          a short period by those providers.
        </p>

        <h2>3. Cookies</h2>
        <p>Cookies are small text files stored by your browser. This site uses:</p>
        <ul>
          <li>
            <strong>Advertising cookies (Google AdSense and partners)</strong> —
            to show, limit and measure ads, and, if you allow it, to personalize
            them. See section 4.
          </li>
          <li>
            <strong>Consent cookie</strong> — if you are shown a cookie consent
            message, your choice is stored so we don’t ask on every page.
          </li>
          <li>
            <strong>Language cookie (<code>googtrans</code>)</strong> — set only
            if you choose a language in the footer, to remember it. This loads
            Google Translate to translate the page.
          </li>
          <li>
            <strong>Sign-in cookie</strong> — used only by site administrators
            who log in to the admin area. Visitors using the tools never get it.
          </li>
        </ul>
        <p>
          You can block or delete cookies in your browser settings. The tools
          still work without cookies; ads may be less relevant.
        </p>

        <h2>4. Advertising (Google AdSense)</h2>
        <p>
          We use Google AdSense to show ads, which keeps every tool free.
        </p>
        <ul>
          <li>
            Third-party vendors, including Google, use cookies to serve ads based
            on your prior visits to this website and other websites.
          </li>
          <li>
            Google’s use of advertising cookies enables it and its partners to
            serve ads to you based on your visits to this site and/or other sites
            on the Internet.
          </li>
          <li>
            You may opt out of personalized advertising by visiting{" "}
            <Ext href="https://adssettings.google.com/">Google Ads Settings</Ext>.
            You can also opt out of some third-party vendors’ use of cookies for
            personalized advertising at{" "}
            <Ext href="https://www.aboutads.info/choices/">aboutads.info/choices</Ext>{" "}
            or, in Europe,{" "}
            <Ext href="https://www.youronlinechoices.eu/">youronlinechoices.eu</Ext>.
          </li>
          <li>
            Learn how Google uses information from sites that use its services at{" "}
            <Ext href="https://policies.google.com/technologies/partner-sites">
              policies.google.com/technologies/partner-sites
            </Ext>{" "}
            and read about{" "}
            <Ext href="https://policies.google.com/technologies/ads">
              Google’s advertising cookies
            </Ext>
            .
          </li>
        </ul>
        <p>
          <strong>Visitors in the EEA, UK and Switzerland:</strong> we use a
          Google-certified consent management platform. Before personalized ads
          or advertising cookies are used, you are asked for consent, and you can
          change or withdraw it at any time through the privacy/cookie settings
          link shown by the consent message. If you don’t consent, you may still
          see non-personalized ads.
        </p>
        <p>
          Ads are clearly separated from our tools and are never placed in a way
          that looks like a download button.
        </p>

        <h2>5. How we use information</h2>
        <ul>
          <li>To run the tools and deliver pages to you.</li>
          <li>To understand which tools and articles are useful and fix what’s broken.</li>
          <li>To show ads that keep the service free.</li>
          <li>To protect the site against spam, abuse and attacks.</li>
          <li>To reply when you contact us.</li>
        </ul>
        <p>
          Where the GDPR applies, our legal bases are: legitimate interests
          (running, securing and improving the site, anonymous analytics),
          consent (personalized advertising and advertising cookies), and taking
          steps at your request (replying to your emails).
        </p>

        <h2>6. Sharing</h2>
        <p>
          We don’t sell your personal information. We share data only with
          service providers that help us run the site — hosting and database
          (Vercel and our database provider), the document-conversion provider
          for server-based tools, Google (AdSense advertising and, if you choose
          a language, Google Translate) — and when required by law. Under some US
          state laws, allowing advertising cookies for personalized ads can count
          as “sharing”; you can opt out using the controls in section 4.
        </p>

        <h2>7. How long we keep data</h2>
        <ul>
          <li>Files processed in your browser: never received by us.</li>
          <li>Files sent to server-based tools: deleted right after conversion.</li>
          <li>Anonymous analytics and conversion logs: kept while useful for improving the site.</li>
          <li>Emails: kept as long as needed to handle your request.</li>
        </ul>

        <h2>8. Your rights</h2>
        <p>
          Depending on where you live (for example under the GDPR in the EU/UK or
          the CCPA/CPRA in California), you may have the right to access,
          correct, delete or receive a copy of your personal data, to object to
          or restrict processing, to withdraw consent, and to opt out of the
          sale or sharing of personal information. Because we don’t use accounts
          and our analytics is anonymous, we usually hold no data that can
          identify you. To make a request, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also
          complain to your local data-protection authority.
        </p>

        <h2>9. Security</h2>
        <p>
          The whole site is served over HTTPS. Processing files in your browser
          means most files are never transmitted at all, which is the strongest
          protection we can offer.
        </p>

        <h2>10. International transfers</h2>
        <p>
          Our service providers may process data in countries other than yours,
          including the United States. Where required, they use safeguards such
          as the EU Standard Contractual Clauses.
        </p>

        <h2>11. Children</h2>
        <p>
          This site is not directed at children under 13 (or under 16 in the
          EEA), and we do not knowingly collect personal information from them.
          If you believe a child has sent us personal information, contact us
          and we will delete it.
        </p>

        <h2>12. Third-party links</h2>
        <p>
          Our pages may link to other websites. We are not responsible for their
          content or privacy practices.
        </p>

        <h2>13. Changes to this policy</h2>
        <p>
          When we change this policy, we update the date at the top of this
          page. Important changes are highlighted on this page.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions about privacy? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or visit our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
