'use client';

import Link from 'next/link';
import { useCallback, useReducer, useState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ItemLayer } from '@/components/ItemLayer';
import { PageControls } from '@/components/PageControls';
import { PdfCanvas } from '@/components/PdfCanvas';
import { Sidebar } from '@/components/Sidebar';
import { SignatureModal } from '@/components/SignatureModal';
import { UploadCard } from '@/components/UploadCard';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { formatDate } from '@/lib/dates';
import { exportSignedPdf } from '@/lib/export';
import { downloadBytes, signedFileName } from '@/lib/files';
import { editorReducer, initialState } from '@/lib/reducer';
import { dataUrlImageSize } from '@/lib/rasterize';
import type { PlacedItem } from '@/lib/types';

export function Editor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [error, setError] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { doc, pages, error: pdfError } = usePdfDocument(state.pdfBytes);

  const handleLoad = useCallback((fileName: string, bytes: Uint8Array) => {
    dispatch({ type: 'LOAD_DOC', fileName, pdfBytes: bytes });
  }, []);

  const page = pages[state.currentPage];

  function addItem(partial: Omit<PlacedItem, 'id' | 'page' | 'x' | 'y'>) {
    if (!page) return;
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id: crypto.randomUUID(),
        page: state.currentPage,
        x: Math.max(0, page.width / 2 - partial.width / 2),
        y: Math.max(0, page.height / 2 - partial.height / 2),
        ...partial,
      },
    });
  }

  async function addSignature(dataUrl: string) {
    // Validate before closing so a bad image doesn't throw away the drawing.
    try {
      const size = await dataUrlImageSize(dataUrl);
      const width = 180;
      const height = (size.height / size.width) * width;
      addItem({ type: 'signature', width, height, value: dataUrl });
      setSignatureModalOpen(false);
    } catch {
      setError("Couldn't read that signature image.");
    }
  }

  async function handleDownload() {
    if (!state.pdfBytes) return;
    setExporting(true);
    try {
      const bytes = await exportSignedPdf(state.pdfBytes, state.items);
      downloadBytes(bytes, signedFileName(state.fileName));
    } catch (err) {
      console.error('PDF export failed', err);
      setError("Couldn't export the signed PDF. Your edits are still here — try again.");
    } finally {
      setExporting(false);
    }
  }

  const activeError = error ?? pdfError;
  const selected = state.items.find((i) => i.id === state.selectedId) ?? null;
  const ready = Boolean(state.pdfBytes && doc && pages.length > 0);

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Ink<span className="text-accent-400">Press</span>
        </Link>
        {state.fileName && (
          <span className="max-w-xs truncate text-sm text-ink-100">{state.fileName}</span>
        )}
        {ready ? (
          <button
            onClick={() => void handleDownload()}
            disabled={exporting}
            className="btn-glow rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold transition hover:bg-accent-400 disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
        ) : (
          <div className="w-32" />
        )}
      </header>

      {activeError && (
        <ErrorBanner
          message={activeError}
          onDismiss={() => {
            setError(null);
            if (pdfError) dispatch({ type: 'RESET' });
          }}
        />
      )}

      {state.pdfBytes && !doc && !pdfError ? (
        <div className="flex min-h-[60vh] items-center justify-center text-ink-100">
          Opening your PDF…
        </div>
      ) : !state.pdfBytes || !doc || pages.length === 0 ? (
        <UploadCard onLoad={handleLoad} onError={setError} />
      ) : (
        <div className="flex">
          <Sidebar
            selected={selected}
            dispatch={dispatch}
            onAddSignature={() => setSignatureModalOpen(true)}
            onAddText={() =>
              addItem({ type: 'text', width: 150, height: 28, value: 'Double-click to edit', fontSize: 14 })
            }
            onAddDate={() =>
              addItem({
                type: 'date',
                width: 130,
                height: 24,
                value: formatDate(new Date(), 'MM/DD/YYYY'),
                fontSize: 13,
                dateFormat: 'MM/DD/YYYY',
              })
            }
          />
          <main className="flex flex-1 flex-col items-center overflow-auto px-6 pb-12">
            <PageControls
              currentPage={state.currentPage}
              pageCount={pages.length}
              zoom={state.zoom}
              onPage={(p) => dispatch({ type: 'SET_PAGE', page: p })}
              onZoom={(z) => dispatch({ type: 'SET_ZOOM', zoom: z })}
            />
            <div className="max-w-full overflow-x-auto">
              <div className="relative w-max">
                <PdfCanvas doc={doc} pageIndex={state.currentPage} zoom={state.zoom} />
                <ItemLayer
                  items={state.items}
                  pageIndex={state.currentPage}
                  zoom={state.zoom}
                  selectedId={state.selectedId}
                  dispatch={dispatch}
                />
              </div>
            </div>
          </main>
        </div>
      )}

      {signatureModalOpen && (
        <SignatureModal
          onConfirm={(d) => void addSignature(d)}
          onClose={() => setSignatureModalOpen(false)}
        />
      )}
    </div>
  );
}
