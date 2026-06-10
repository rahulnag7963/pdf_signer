'use client';

import { useEffect } from 'react';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-medium text-red-600 shadow-2xl">
      {message}
      <button onClick={onDismiss} className="ml-4 text-slate-400 hover:text-slate-600" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
