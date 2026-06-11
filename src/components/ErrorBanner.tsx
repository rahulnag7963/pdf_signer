'use client';

import { useEffect, useRef } from 'react';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  // Keep the latest onDismiss in a ref so the timer effect doesn't restart
  // every time the parent re-renders with a fresh callback identity.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), 5000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-medium text-red-600 shadow-2xl"
    >
      {message}
      <button onClick={onDismiss} className="ml-4 text-slate-400 hover:text-slate-600" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
