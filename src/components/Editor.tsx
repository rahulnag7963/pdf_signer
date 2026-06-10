'use client';

import Link from 'next/link';
import { useCallback, useReducer, useState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { UploadCard } from '@/components/UploadCard';
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
        <div className="p-6 text-ink-100">
          PDF loaded: {pages.length} page(s). Editor canvas arrives in the next task.
        </div>
      )}
    </div>
  );
}
