'use client';

interface Props {
  currentPage: number;
  pageCount: number;
  zoom: number;
  onPage: (page: number) => void;
  onZoom: (zoom: number) => void;
}

const btn =
  'rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10';

export function PageControls({ currentPage, pageCount, zoom, onPage, onZoom }: Props) {
  return (
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="flex items-center gap-2">
        <button className={btn} disabled={currentPage === 0} onClick={() => onPage(currentPage - 1)}>
          ←
        </button>
        <span className="text-sm text-ink-100">
          Page {currentPage + 1} / {pageCount}
        </span>
        <button
          className={btn}
          disabled={currentPage >= pageCount - 1}
          onClick={() => onPage(currentPage + 1)}
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className={btn} onClick={() => onZoom(zoom - 0.25)}>
          −
        </button>
        <span className="w-12 text-center text-sm text-ink-100">{Math.round(zoom * 100)}%</span>
        <button className={btn} onClick={() => onZoom(zoom + 0.25)}>
          +
        </button>
      </div>
    </div>
  );
}
