'use client';

import type { EditorAction } from '@/lib/reducer';
import { DATE_FORMATS, formatDate } from '@/lib/dates';
import type { DateFormat, PlacedItem } from '@/lib/types';

const COLORS = ['#1e1b4b', '#000000', '#1d4ed8', '#b91c1c'];

interface Props {
  selected: PlacedItem | null;
  dispatch: React.Dispatch<EditorAction>;
  onAddSignature: () => void;
  onAddText: () => void;
  onAddDate: () => void;
}

const toolBtn =
  'flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10';

export function Sidebar({ selected, dispatch, onAddSignature, onAddText, onAddDate }: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-2 p-4">
      <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-100/60">
        Add to page
      </p>
      <button className={toolBtn} onClick={onAddSignature}>
        ✍️ Signature
      </button>
      <button className={toolBtn} onClick={onAddText}>
        🔤 Text
      </button>
      <button className={toolBtn} onClick={onAddDate}>
        📅 Date
      </button>

      {selected && selected.type !== 'signature' && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-100/60">
            Selected {selected.type}
          </p>

          <label className="flex items-center justify-between text-sm">
            Size
            <input
              type="number"
              min={8}
              max={72}
              value={selected.fontSize ?? 14}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_ITEM',
                  id: selected.id,
                  patch: { fontSize: Number(e.target.value) || 14 },
                })
              }
              className="w-16 rounded-lg bg-white/10 px-2 py-1 text-right"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            Color
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => dispatch({ type: 'UPDATE_ITEM', id: selected.id, patch: { color: c } })}
                  className={`h-6 w-6 rounded-full border-2 ${
                    (selected.color ?? '#1e1b4b') === c ? 'border-accent-400' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {selected.type === 'date' && (
            <label className="flex flex-col gap-1 text-sm">
              Format
              <select
                value={selected.dateFormat ?? 'MM/DD/YYYY'}
                onChange={(e) => {
                  const dateFormat = e.target.value as DateFormat;
                  dispatch({
                    type: 'UPDATE_ITEM',
                    id: selected.id,
                    patch: { dateFormat, value: formatDate(new Date(), dateFormat) },
                  });
                }}
                className="rounded-lg bg-white/10 px-2 py-1.5 text-white"
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f} className="text-ink-900">
                    {f}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </aside>
  );
}
