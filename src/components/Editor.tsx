'use client';

import Link from 'next/link';
import { useCallback, useReducer, useState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { UploadCard } from '@/components/UploadCard';
import { ItemLayer } from '@/components/ItemLayer';
import { PageControls } from '@/components/PageControls';
import { PdfCanvas } from '@/components/PdfCanvas';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { editorReducer, initialState } from '@/lib/reducer';

export function Editor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [error, setError] = useState<string | null>(null);
  const { doc, pages, error: pdfError } = usePdfDocument(state.pdfBytes);

  const handleLoad = useCallback((fileName: string, bytes: Uint8Array) => {
    dispatch({ type: 'LOAD_DOC', fileName, pdfBytes: bytes });
  }, []);

  const activeError = error ?? pdfError;

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Ink<span className="text-accent-400">Press</span>
        </Link>
        {state.fileName && (
          <span className="max-w-xs truncate text-sm text-ink-100">{state.fileName}</span>
        )}
        <div className="w-32" />
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
        <main className="flex flex-col items-center px-6 pb-12">
          <PageControls
            currentPage={state.currentPage}
            pageCount={pages.length}
            zoom={state.zoom}
            onPage={(page) => dispatch({ type: 'SET_PAGE', page })}
            onZoom={(zoom) => dispatch({ type: 'SET_ZOOM', zoom })}
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
      )}
    </div>
  );
}
