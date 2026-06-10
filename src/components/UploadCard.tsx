'use client';

import { useRef, useState } from 'react';
import { looksLikePdf } from '@/lib/files';

interface Props {
  onLoad: (fileName: string, bytes: Uint8Array) => void;
  onError: (message: string) => void;
}

export function UploadCard({ onLoad, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!looksLikePdf(bytes)) {
      onError(`"${file.name}" doesn't look like a PDF. Please choose a PDF file.`);
      return;
    }
    onLoad(file.name, bytes);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          if (e.key === ' ') e.preventDefault(); // stop page scroll
          inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          // dragleave fires when entering a child — ignore those.
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={`w-full max-w-xl cursor-pointer rounded-3xl border-2 border-dashed bg-white p-14 text-center shadow-2xl transition ${
          dragging ? 'border-accent-500 bg-pink-50' : 'border-ink-100'
        }`}
      >
        <div className="text-5xl">📄</div>
        <h2 className="mt-4 text-xl font-extrabold text-ink-900">Drop your PDF here</h2>
        <p className="mt-2 text-sm text-slate-500">or click to browse — it stays on your device</p>
        <span className="btn-glow mt-6 inline-block rounded-full bg-accent-500 px-8 py-3 font-semibold text-white">
          Choose a PDF
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
