"use client";

import { useEffect, useRef, useState } from "react";

export type PdfPagePreview = {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
};

/** Render every page of a File to a data URL. Cancels cleanly on file change. */
export function usePdfPages(file: File | null, scale = 0.5) {
  const [pages, setPages] = useState<PdfPagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useRef(0);

  // Adjust state during render rather than in an effect when the file
  // identity changes — clears stale pages immediately, including the
  // "file removed" case, without an extra effect-triggered commit.
  const [prevFile, setPrevFile] = useState(file);
  if (file !== prevFile) {
    setPrevFile(file);
    setPages([]);
    setError(null);
  }

  useEffect(() => {
    if (!file) return;
    const myToken = ++token.current;

    (async () => {
      setLoading(true);
      try {
        const { loadPdfDocument, renderPage } = await import("@/lib/pdf/render");
        const buf = await file.arrayBuffer();
        const doc = await loadPdfDocument(buf);
        const collected: PdfPagePreview[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          if (token.current !== myToken) return;
          const page = await doc.getPage(i);
          const { canvas } = await renderPage(page, scale);
          collected.push({
            pageNumber: i,
            dataUrl: canvas.toDataURL("image/jpeg", 0.75),
            width: canvas.width,
            height: canvas.height,
          });
          page.cleanup();
          if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        await doc.cleanup();
        if (token.current === myToken) setPages(collected);
      } catch (err) {
        if (token.current === myToken)
          setError(err instanceof Error ? err.message : "Could not read PDF.");
      } finally {
        if (token.current === myToken) setLoading(false);
      }
    })();

    return () => {
      token.current++;
    };
  }, [file, scale]);

  return { pages, loading, error };
}
