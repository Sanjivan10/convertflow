import { ServerCog } from "lucide-react";

export function UnavailableWorkspace({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30 sm:p-10">
      <ServerCog className="mx-auto size-8 text-amber-500" />
      <h2 className="mt-3 font-semibold text-amber-900 dark:text-amber-200">
        {name} needs a translation service
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-amber-800/80 dark:text-amber-300/80">
        Layout-preserving translation extracts the PDF text, sends it to a
        machine-translation API (Google Translate, DeepL, or similar), and
        reflows it back into the page. That API key isn&apos;t configured on this
        deployment yet, so this page is live for its content and SEO value while
        the feature is wired up.
      </p>
      <p className="mt-3 text-xs text-amber-700/70 dark:text-amber-400/70">
        Everything else — merging, splitting, signing, OCR, Office&nbsp;→&nbsp;PDF,
        and more — works today.
      </p>
    </div>
  );
}
