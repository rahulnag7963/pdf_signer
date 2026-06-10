'use client';

import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { typedSignatureToPng } from '@/lib/rasterize';
import { loadSignature, saveSignature } from '@/lib/storage';

const SIGNATURE_FONTS = [
  { label: 'Dancing Script', css: 'var(--font-dancing)' },
  { label: 'Great Vibes', css: 'var(--font-great-vibes)' },
  { label: 'Caveat', css: 'var(--font-caveat)' },
];

interface Props {
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}

export function SignatureModal({ onConfirm, onClose }: Props) {
  const [tab, setTab] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState('');
  const [fontCss, setFontCss] = useState(SIGNATURE_FONTS[0].css);
  const [save, setSave] = useState(true);
  const [saveFailed, setSaveFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const saved = loadSignature();

  useEffect(() => {
    if (tab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    canvas.getContext('2d')!.scale(dpr, dpr);
    padRef.current = new SignaturePad(canvas, { penColor: '#1e1b4b' });
    return () => padRef.current?.off();
  }, [tab]);

  async function confirm() {
    let dataUrl: string;
    if (tab === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) return;
      dataUrl = padRef.current.toDataURL('image/png');
    } else {
      if (!typed.trim()) return;
      dataUrl = await typedSignatureToPng(typed.trim(), fontCss);
    }
    if (save && !saveSignature(dataUrl)) setSaveFailed(true);
    onConfirm(dataUrl);
  }

  const tabBtn = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-accent-500 text-white' : 'text-slate-500 hover:bg-slate-100'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 text-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold">Your signature</h2>

        <div className="mt-4 flex gap-2 rounded-full bg-slate-50 p-1">
          <button className={tabBtn(tab === 'draw')} onClick={() => setTab('draw')}>
            Draw
          </button>
          <button className={tabBtn(tab === 'type')} onClick={() => setTab('type')}>
            Type
          </button>
        </div>

        {tab === 'draw' ? (
          <div className="mt-4">
            <canvas
              ref={canvasRef}
              className="h-48 w-full rounded-2xl border-2 border-dashed border-ink-100 bg-slate-50"
            />
            <button
              className="mt-2 text-sm font-medium text-slate-500 hover:text-ink-700"
              onClick={() => padRef.current?.clear()}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your name"
              className="w-full rounded-2xl border-2 border-ink-100 px-4 py-3 outline-none focus:border-accent-500"
            />
            <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Signature style">
              {SIGNATURE_FONTS.map((f) => (
                <button
                  key={f.label}
                  role="radio"
                  aria-checked={fontCss === f.css}
                  onClick={() => setFontCss(f.css)}
                  className={`rounded-2xl border-2 px-2 py-3 text-2xl transition ${
                    fontCss === f.css ? 'border-accent-500 bg-pink-50' : 'border-ink-100'
                  }`}
                  style={{ fontFamily: f.css }}
                >
                  {typed.trim() || 'Signature'}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Remember this signature on this device
        </label>
        {saveFailed && (
          <p className="mt-1 text-xs text-amber-600">
            Couldn&apos;t save to this browser — the signature will only last this session.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          {saved ? (
            <button
              className="text-sm font-semibold text-ink-700 hover:text-accent-500"
              onClick={() => onConfirm(saved.dataUrl)}
            >
              Use saved signature
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn-glow rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-400"
              onClick={() => void confirm()}
            >
              Add signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
