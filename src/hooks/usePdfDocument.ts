'use client';

import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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
    let loaded: PDFDocumentProxy | null = null;

    if (!pdfBytes) {
      setDoc(null);
      setPages([]);
      setError(null);
      return;
    }

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        // pdf.js transfers the buffer to its worker — pass a copy so the
        // original bytes stay intact for the pdf-lib export.
        loaded = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
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
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
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
      loaded?.destroy();
    };
  }, [pdfBytes]);

  return { doc, pages, error };
}
