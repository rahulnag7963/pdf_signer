'use client';

import { useEffect, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

export interface PageInfo {
  width: number;
  height: number;
}

/**
 * Load a pdf.js document from raw bytes. pdfjs-dist is imported dynamically
 * because it touches browser globals at module scope (breaks SSR).
 */
export function usePdfDocument(pdfBytes: Uint8Array | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Holding the loading task (not the proxy) lets cleanup abort a pending
    // getDocument *and* destroy a completed document with one call.
    let task: PDFDocumentLoadingTask | null = null;

    (async () => {
      // Clear stale state from any previous document before (re)loading, so a
      // failed load never leaves a destroyed proxy behind.
      setDoc(null);
      setPages([]);
      setError(null);
      if (!pdfBytes) return;

      try {
        const pdfjs = await import('pdfjs-dist');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        // pdf.js transfers the buffer to its worker — pass a copy so the
        // original bytes stay intact for the pdf-lib export.
        task = pdfjs.getDocument({ data: pdfBytes.slice() });
        if (cancelled) {
          // Cleanup already ran (before `task` was assigned) — destroy here.
          void task.destroy();
          return;
        }
        const loaded = await task.promise;
        if (cancelled) return;
        const infos: PageInfo[] = [];
        for (let i = 1; i <= loaded.numPages; i++) {
          const page = await loaded.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          infos.push({ width: vp.width, height: vp.height });
        }
        if (!cancelled) {
          setDoc(loaded);
          setPages(infos);
        }
      } catch (e) {
        if (cancelled) return;
        // doc/pages were cleared above and never set on this path.
        const name = (e as { name?: string })?.name;
        setError(
          name === 'PasswordException'
            ? 'This PDF is password-protected. Remove the password and try again.'
            : "This PDF couldn't be opened. It may be corrupt.",
        );
      }
    })();

    return () => {
      cancelled = true;
      // Aborts a pending load and destroys the document if it completed.
      void task?.destroy();
    };
  }, [pdfBytes]);

  return { doc, pages, error };
}
