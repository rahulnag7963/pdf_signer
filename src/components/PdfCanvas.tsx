'use client';

import { useEffect, useRef } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

interface Props {
  doc: PDFDocumentProxy;
  pageIndex: number;
  zoom: number;
}

/** Renders one PDF page, oversampled by devicePixelRatio for crisp output. */
export function PdfCanvas({ doc, pageIndex, zoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;

    (async () => {
      try {
        const page = await doc.getPage(pageIndex + 1);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        task = page.render({ canvas, viewport });
        await task.promise;
      } catch (err) {
        // Expected teardown paths: render cancelled by cleanup, effect already
        // cancelled, or the document/transport was destroyed mid-flight.
        if (cancelled) return;
        if (err instanceof Error) {
          if (err.name === 'RenderingCancelledException') return;
          if (/transport destroyed|worker.*destroyed/i.test(err.message)) return;
        }
        console.error('PDF page render failed', err);
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageIndex, zoom]);

  return <canvas ref={canvasRef} className="block rounded-lg shadow-2xl" />;
}
