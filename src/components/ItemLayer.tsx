'use client';

import { Rnd } from 'react-rnd';
import type { EditorAction } from '@/lib/reducer';
import type { PlacedItem } from '@/lib/types';

interface Props {
  items: PlacedItem[];
  pageIndex: number;
  zoom: number;
  selectedId: string | null;
  dispatch: React.Dispatch<EditorAction>;
}

function ItemContent({
  item,
  zoom,
  selected,
  dispatch,
}: {
  item: PlacedItem;
  zoom: number;
  selected: boolean;
  dispatch: React.Dispatch<EditorAction>;
}) {
  return (
    <div
      className={`relative h-full w-full ${
        selected ? 'rounded outline-2 outline-accent-500' : 'rounded outline-1 outline-dashed outline-ink-500/40'
      }`}
    >
      {selected && (
        <div className="absolute -top-9 left-0 flex gap-1 rounded-full bg-ink-900 px-2 py-1 text-xs shadow-lg">
          <button
            className="px-1.5 text-white hover:text-accent-400"
            title="Duplicate"
            aria-label="Duplicate"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'DUPLICATE_ITEM', id: item.id, newId: crypto.randomUUID() });
            }}
          >
            ⧉
          </button>
          <button
            className="px-1.5 text-white hover:text-accent-400"
            title="Delete"
            aria-label="Delete"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'DELETE_ITEM', id: item.id });
            }}
          >
            🗑
          </button>
        </div>
      )}

      {item.type === 'signature' ? (
        // dataURL render target inside a fixed-size box — plain img is correct here
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.value} alt="Signature" className="h-full w-full object-contain" draggable={false} />
      ) : (
        <div
          className="flex h-full w-full items-start overflow-hidden whitespace-pre leading-none"
          style={{
            fontSize: (item.fontSize ?? 14) * zoom,
            color: item.color ?? '#1e1b4b',
            fontFamily: 'Helvetica, Arial, sans-serif', // match the export font
          }}
          onDoubleClick={() => {
            if (item.type !== 'text') return;
            const next = window.prompt('Edit text', item.value);
            if (next !== null && next.trim() !== '') {
              dispatch({ type: 'UPDATE_ITEM', id: item.id, patch: { value: next } });
            }
          }}
        >
          {item.value}
        </div>
      )}
    </div>
  );
}

export function ItemLayer({ items, pageIndex, zoom, selectedId, dispatch }: Props) {
  const pageItems = items.filter((i) => i.page === pageIndex);

  return (
    <div className="absolute inset-0" onClick={() => dispatch({ type: 'SELECT_ITEM', id: null })}>
      {pageItems.map((item) => (
        <Rnd
          key={item.id}
          bounds="parent"
          size={{ width: item.width * zoom, height: item.height * zoom }}
          position={{ x: item.x * zoom, y: item.y * zoom }}
          lockAspectRatio={item.type === 'signature'}
          onDragStart={() => dispatch({ type: 'SELECT_ITEM', id: item.id })}
          onDragStop={(_e, d) =>
            dispatch({ type: 'UPDATE_ITEM', id: item.id, patch: { x: d.x / zoom, y: d.y / zoom } })
          }
          onResizeStop={(_e, _dir, ref, _delta, pos) =>
            dispatch({
              type: 'UPDATE_ITEM',
              id: item.id,
              patch: {
                width: ref.offsetWidth / zoom,
                height: ref.offsetHeight / zoom,
                x: pos.x / zoom,
                y: pos.y / zoom,
              },
            })
          }
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            dispatch({ type: 'SELECT_ITEM', id: item.id });
          }}
        >
          <ItemContent item={item} zoom={zoom} selected={item.id === selectedId} dispatch={dispatch} />
        </Rnd>
      ))}
    </div>
  );
}
