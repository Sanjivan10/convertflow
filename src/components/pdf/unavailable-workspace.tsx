import { ServerCog } from "lucide-react";

export function UnavailableWorkspace({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30 sm:p-10">
      <ServerCog className="mx-auto size-8 text-amber-500" />
      <h2 className="mt-3 font-semibold text-amber-900 dark:text-amber-200">
        {name} needs a server engine
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-amber-800/80 dark:text-amber-300/80">
        Faithful office-document rendering (fonts, pagination, tables, slide
        layouts) isn&apos;t something a browser can do reliably on its own — it
        needs a server-side engine such as LibreOffice, Ghostscript, or a
        translation API. That backend isn&apos;t configured in this build, so
        this page is live for its content and SEO value, but conversion is
        disabled for now.
      </p>
      <p className="mt-3 text-xs text-amber-700/70 dark:text-amber-400/70">
        Ask an admin to wire up a conversion API in the tool builder to enable
        this tool.
      </p>
    </div>
  );
}
