# PDF Signer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A fully client-side Next.js app that lets the user place a signature (drawn or typed), text, and date boxes on a PDF by drag-and-drop, then download the flattened signed PDF.

**Architecture:** Two routes — `/` (landing page) and `/sign` (editor). pdfjs-dist renders the current PDF page to a canvas; placed items are React components in an absolutely-positioned overlay, made draggable/resizable with react-rnd; coordinates are stored in PDF points and converted to pixels via the zoom factor; on export, pdf-lib stamps each item onto the original PDF (Y-axis flipped) and the result downloads as `<name>-signed.pdf`. Signatures persist in localStorage. No server, no uploads.

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4, `pdfjs-dist`, `pdf-lib`, `react-rnd`, `signature_pad`, Vitest + Testing Library.

**Design doc:** `docs/plans/2026-06-09-pdf-signer-design.md` — read it first. Visual language: deep violet gradient backgrounds (#2D1B69 → #6B2FB3), vibrant pink CTAs (#E94CA1), white rounded cards, bold typography (Poppins), handwriting fonts for typed signatures (Dancing Script, Great Vibes, Caveat).

**Note on `signature_pad`:** the design doc mentions `react-signature-canvas`, but its peer deps don't allow React 19. Use the underlying, framework-agnostic `signature_pad` (same author ecosystem, actively maintained) via a ref — same UX, no peer-dep conflict.

**Shell note:** commands below are bash (use the Bash tool on this Windows machine).

---

### Task 1: Scaffold Next.js project and install dependencies

**Files:**
- Create: entire Next.js scaffold at repo root
- Create: `public/pdf.worker.min.mjs` (copied from pdfjs-dist)

**Step 1: Scaffold (repo root contains `docs/` and `.git`, which create-next-app rejects — temporarily move `docs` out)**

```bash
cd /c/Users/Rahul/Desktop/pdf_signer
mv docs /tmp/pdf-signer-docs
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes
mv /tmp/pdf-signer-docs docs
```

Expected: scaffold succeeds; `src/app/page.tsx`, `src/app/globals.css` exist; `docs/plans/` restored.

**Step 2: Install runtime dependencies**

```bash
npm install pdfjs-dist pdf-lib react-rnd signature_pad
```

**Step 3: Copy the pdf.js worker into public/**

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

**Step 4: Verify the app builds**

Run: `npm run build`
Expected: build succeeds (default scaffold pages).

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with pdf dependencies"
```

---

### Task 2: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts)
- Create: `src/lib/__tests__/sanity.test.ts`

**Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 2: Create `vitest.config.ts`**

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

**Step 3: Add scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Create sanity test `src/lib/__tests__/sanity.test.ts`**

```ts
import { describe, expect, it } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 5: Run it**

Run: `npm test`
Expected: 1 passed.

**Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/__tests__/sanity.test.ts
git commit -m "chore: set up vitest with jsdom"
```

---

### Task 3: Fonts and design tokens

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Caveat, Dancing_Script, Great_Vibes, Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-great-vibes' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'InkPress — Sign PDFs in seconds',
  description: 'Add your signature, text, and date to any PDF — right in your browser. Files never leave your machine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${dancingScript.variable} ${greatVibes.variable} ${caveat.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-poppins), ui-sans-serif, system-ui, sans-serif;
  --font-dancing: var(--font-dancing);
  --font-great-vibes: var(--font-great-vibes);
  --font-caveat: var(--font-caveat);

  --color-ink-950: #160d3a;
  --color-ink-900: #2d1b69;
  --color-ink-800: #3a2284;
  --color-ink-700: #4c2a9e;
  --color-ink-600: #5b2da9;
  --color-ink-500: #6b2fb3;
  --color-ink-100: #d9ccf2;
  --color-accent-600: #d63a90;
  --color-accent-500: #e94ca1;
  --color-accent-400: #f06ab5;
}

body {
  background: var(--color-ink-900);
}

.bg-hero {
  background:
    radial-gradient(ellipse 60% 50% at 80% 10%, rgba(233, 76, 161, 0.18), transparent),
    radial-gradient(ellipse 50% 60% at 10% 80%, rgba(107, 47, 179, 0.55), transparent),
    linear-gradient(135deg, #2d1b69 0%, #4c2a9e 55%, #6b2fb3 100%);
}

.btn-glow {
  box-shadow: 0 10px 30px -8px rgba(233, 76, 161, 0.7);
}
```

**Step 3: Verify**

Run: `npm run build`
Expected: build succeeds.

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add Poppins + handwriting fonts and SpaceDrive design tokens"
```

---

### Task 4: Core types and editor reducer (TDD)

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/reducer.ts`
- Test: `src/lib/__tests__/reducer.test.ts`
- Delete: `src/lib/__tests__/sanity.test.ts`

**Step 1: Create `src/lib/types.ts`**

```ts
export type ItemType = 'signature' | 'text' | 'date';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'MMMM D, YYYY';

export interface PlacedItem {
  id: string;
  /** 0-based page index */
  page: number;
  type: ItemType;
  /** Position and size in PDF points, origin top-left of the page */
  x: number;
  y: number;
  width: number;
  height: number;
  /** dataURL for signature items; display text for text/date items */
  value: string;
  fontSize?: number;
  color?: string;
  dateFormat?: DateFormat;
}

export interface DocumentState {
  fileName: string;
  pdfBytes: Uint8Array | null;
  currentPage: number;
  zoom: number;
  items: PlacedItem[];
  selectedId: string | null;
}
```

**Step 2: Write the failing test `src/lib/__tests__/reducer.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { editorReducer, initialState } from '@/lib/reducer';
import type { PlacedItem } from '@/lib/types';

const item: PlacedItem = {
  id: 'a',
  page: 0,
  type: 'text',
  x: 100,
  y: 200,
  width: 120,
  height: 24,
  value: 'Hello',
};

describe('editorReducer', () => {
  it('loads a document and resets items', () => {
    const loaded = editorReducer(
      { ...initialState, items: [item] },
      { type: 'LOAD_DOC', fileName: 'a.pdf', pdfBytes: new Uint8Array([1]) },
    );
    expect(loaded.fileName).toBe('a.pdf');
    expect(loaded.items).toEqual([]);
    expect(loaded.currentPage).toBe(0);
  });

  it('adds and selects an item', () => {
    const s = editorReducer(initialState, { type: 'ADD_ITEM', item });
    expect(s.items).toHaveLength(1);
    expect(s.selectedId).toBe('a');
  });

  it('updates an item with a partial patch', () => {
    const s1 = editorReducer(initialState, { type: 'ADD_ITEM', item });
    const s2 = editorReducer(s1, { type: 'UPDATE_ITEM', id: 'a', patch: { x: 5, value: 'Hi' } });
    expect(s2.items[0]).toMatchObject({ x: 5, y: 200, value: 'Hi' });
  });

  it('deletes an item and clears selection', () => {
    const s1 = editorReducer(initialState, { type: 'ADD_ITEM', item });
    const s2 = editorReducer(s1, { type: 'DELETE_ITEM', id: 'a' });
    expect(s2.items).toHaveLength(0);
    expect(s2.selectedId).toBeNull();
  });

  it('duplicates an item offset by 20 points and selects the copy', () => {
    const s1 = editorReducer(initialState, { type: 'ADD_ITEM', item });
    const s2 = editorReducer(s1, { type: 'DUPLICATE_ITEM', id: 'a', newId: 'b' });
    expect(s2.items).toHaveLength(2);
    expect(s2.items[1]).toMatchObject({ id: 'b', x: 120, y: 220 });
    expect(s2.selectedId).toBe('b');
  });

  it('clamps zoom between 0.5 and 2', () => {
    expect(editorReducer(initialState, { type: 'SET_ZOOM', zoom: 5 }).zoom).toBe(2);
    expect(editorReducer(initialState, { type: 'SET_ZOOM', zoom: 0.1 }).zoom).toBe(0.5);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/reducer.test.ts`
Expected: FAIL — cannot resolve `@/lib/reducer`.

**Step 4: Create `src/lib/reducer.ts`**

```ts
import type { DocumentState, PlacedItem } from './types';

export type EditorAction =
  | { type: 'LOAD_DOC'; fileName: string; pdfBytes: Uint8Array }
  | { type: 'RESET' }
  | { type: 'ADD_ITEM'; item: PlacedItem }
  | { type: 'UPDATE_ITEM'; id: string; patch: Partial<PlacedItem> }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'DUPLICATE_ITEM'; id: string; newId: string }
  | { type: 'SELECT_ITEM'; id: string | null }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_ZOOM'; zoom: number };

export const initialState: DocumentState = {
  fileName: '',
  pdfBytes: null,
  currentPage: 0,
  zoom: 1,
  items: [],
  selectedId: null,
};

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

export function editorReducer(state: DocumentState, action: EditorAction): DocumentState {
  switch (action.type) {
    case 'LOAD_DOC':
      return {
        ...initialState,
        fileName: action.fileName,
        pdfBytes: action.pdfBytes,
        zoom: state.zoom,
      };
    case 'RESET':
      return initialState;
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item], selectedId: action.item.id };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i)),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case 'DUPLICATE_ITEM': {
      const src = state.items.find((i) => i.id === action.id);
      if (!src) return state;
      const copy: PlacedItem = { ...src, id: action.newId, x: src.x + 20, y: src.y + 20 };
      return { ...state, items: [...state.items, copy], selectedId: copy.id };
    }
    case 'SELECT_ITEM':
      return { ...state, selectedId: action.id };
    case 'SET_PAGE':
      return { ...state, currentPage: action.page, selectedId: null };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, action.zoom)) };
    default:
      return state;
  }
}
```

**Step 5: Run tests, delete sanity test**

Run: `npx vitest run src/lib/__tests__/reducer.test.ts`
Expected: 6 passed.

```bash
rm src/lib/__tests__/sanity.test.ts
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add item types and editor state reducer"
```

---

### Task 5: Coordinate conversion (TDD)

**Files:**
- Create: `src/lib/coords.ts`
- Test: `src/lib/__tests__/coords.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { pdfToScreen, screenToPdf, toPdfExportRect } from '@/lib/coords';

describe('coordinate conversion', () => {
  it('converts PDF points to screen pixels via zoom', () => {
    expect(pdfToScreen(100, 1.5)).toBe(150);
  });

  it('round-trips screen -> pdf -> screen', () => {
    const zoom = 1.25;
    expect(pdfToScreen(screenToPdf(443, zoom), zoom)).toBeCloseTo(443);
  });

  it('flips the Y axis for PDF export (PDF origin is bottom-left)', () => {
    // US Letter page: 792pt tall. Item 100pt from the top, 50pt high
    // => its bottom edge sits at 792 - 100 - 50 = 642pt from the bottom.
    const rect = toPdfExportRect({ x: 72, y: 100, width: 200, height: 50 }, 792);
    expect(rect).toEqual({ x: 72, y: 642, width: 200, height: 50 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/coords.test.ts`
Expected: FAIL — cannot resolve `@/lib/coords`.

**Step 3: Create `src/lib/coords.ts`**

```ts
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** PDF points -> CSS pixels at the current zoom. */
export function pdfToScreen(value: number, zoom: number): number {
  return value * zoom;
}

/** CSS pixels -> PDF points at the current zoom. */
export function screenToPdf(value: number, zoom: number): number {
  return value / zoom;
}

/**
 * Convert a top-left-origin rect (our storage format) to a bottom-left-origin
 * rect for pdf-lib, which measures y from the bottom of the page.
 */
export function toPdfExportRect(rect: Rect, pageHeight: number): Rect {
  return { ...rect, y: pageHeight - rect.y - rect.height };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/coords.test.ts`
Expected: 3 passed.

**Step 5: Commit**

```bash
git add src/lib/coords.ts src/lib/__tests__/coords.test.ts
git commit -m "feat: add screen/PDF coordinate conversion with Y-flip"
```

---

### Task 6: Date formatting (TDD)

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/__tests__/dates.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { DATE_FORMATS, formatDate } from '@/lib/dates';

describe('formatDate', () => {
  const date = new Date(2026, 5, 9); // June 9, 2026 (month is 0-based)

  it('formats MM/DD/YYYY', () => {
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('06/09/2026');
  });

  it('formats DD/MM/YYYY', () => {
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('09/06/2026');
  });

  it('formats MMMM D, YYYY', () => {
    expect(formatDate(date, 'MMMM D, YYYY')).toBe('June 9, 2026');
  });

  it('exposes the list of supported formats', () => {
    expect(DATE_FORMATS).toEqual(['MM/DD/YYYY', 'DD/MM/YYYY', 'MMMM D, YYYY']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/dates.test.ts`
Expected: FAIL — cannot resolve `@/lib/dates`.

**Step 3: Create `src/lib/dates.ts`**

```ts
import type { DateFormat } from './types';

export const DATE_FORMATS: DateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'MMMM D, YYYY'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(date: Date, format: DateFormat): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  switch (format) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'MMMM D, YYYY':
      return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${yyyy}`;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/dates.test.ts`
Expected: 4 passed.

**Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/__tests__/dates.test.ts
git commit -m "feat: add date formatting with three formats"
```

---

### Task 7: Signature localStorage persistence (TDD)

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/__tests__/storage.test.ts`

**Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSignature, loadSignature, saveSignature } from '@/lib/storage';

describe('signature storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a signature dataURL', () => {
    expect(saveSignature('data:image/png;base64,abc')).toBe(true);
    expect(loadSignature()?.dataUrl).toBe('data:image/png;base64,abc');
  });

  it('returns null when nothing is saved', () => {
    expect(loadSignature()).toBeNull();
  });

  it('returns null for corrupt stored data', () => {
    localStorage.setItem('pdf-signer.signature', 'not json {');
    expect(loadSignature()).toBeNull();
  });

  it('clears the saved signature', () => {
    saveSignature('data:image/png;base64,abc');
    clearSignature();
    expect(loadSignature()).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/storage.test.ts`
Expected: FAIL — cannot resolve `@/lib/storage`.

**Step 3: Create `src/lib/storage.ts`**

```ts
const KEY = 'pdf-signer.signature';

export interface SavedSignature {
  dataUrl: string;
  savedAt: string;
}

/** Returns false when localStorage is unavailable or full (degrade to session-only). */
export function saveSignature(dataUrl: string): boolean {
  try {
    const record: SavedSignature = { dataUrl, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadSignature(): SavedSignature | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSignature;
    return typeof parsed?.dataUrl === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSignature(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do — storage unavailable
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/storage.test.ts`
Expected: 4 passed.

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: persist signature in localStorage with graceful degradation"
```

---

### Task 8: PDF file validation and download helpers (TDD)

**Files:**
- Create: `src/lib/files.ts`
- Test: `src/lib/__tests__/files.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { looksLikePdf, signedFileName } from '@/lib/files';

describe('looksLikePdf', () => {
  it('accepts bytes starting with %PDF', () => {
    expect(looksLikePdf(new TextEncoder().encode('%PDF-1.7 rest...'))).toBe(true);
  });

  it('accepts %PDF appearing within the first 1024 bytes', () => {
    const bytes = new Uint8Array(1024);
    bytes.set(new TextEncoder().encode('%PDF'), 500);
    expect(looksLikePdf(bytes)).toBe(true);
  });

  it('rejects non-PDF bytes', () => {
    expect(looksLikePdf(new TextEncoder().encode('PNG not a pdf'))).toBe(false);
  });
});

describe('signedFileName', () => {
  it('appends -signed before the extension', () => {
    expect(signedFileName('contract.pdf')).toBe('contract-signed.pdf');
  });

  it('is case-insensitive about the extension', () => {
    expect(signedFileName('Contract.PDF')).toBe('Contract-signed.pdf');
  });

  it('handles names without .pdf extension', () => {
    expect(signedFileName('contract')).toBe('contract-signed.pdf');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/files.test.ts`
Expected: FAIL — cannot resolve `@/lib/files`.

**Step 3: Create `src/lib/files.ts`**

```ts
const PDF_MARKER = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

/** The PDF spec allows the header anywhere in the first 1024 bytes. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const probe = bytes.subarray(0, 1024);
  outer: for (let i = 0; i + PDF_MARKER.length <= probe.length; i++) {
    for (let j = 0; j < PDF_MARKER.length; j++) {
      if (probe[i + j] !== PDF_MARKER[j]) continue outer;
    }
    return true;
  }
  return false;
}

export function signedFileName(original: string): string {
  return `${original.replace(/\.pdf$/i, '')}-signed.pdf`;
}

/** Browser-only: trigger a download of the given bytes. */
export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/files.test.ts`
Expected: 6 passed.

**Step 5: Commit**

```bash
git add src/lib/files.ts src/lib/__tests__/files.test.ts
git commit -m "feat: add PDF magic-byte validation and download helpers"
```

---

### Task 9: PDF export with pdf-lib (TDD)

**Files:**
- Create: `src/lib/export.ts`
- Test: `src/lib/__tests__/export.test.ts`

**Step 1: Write the failing test**

```ts
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { exportSignedPdf, hexToRgb } from '@/lib/export';
import type { PlacedItem } from '@/lib/types';

// 1x1 black PNG
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function makeBlankPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]); // US Letter
  return doc.save();
}

describe('hexToRgb', () => {
  it('parses a hex color into pdf-lib rgb (0..1 channels)', () => {
    const c = hexToRgb('#ff0080');
    expect(c.red).toBeCloseTo(1);
    expect(c.green).toBeCloseTo(0);
    expect(c.blue).toBeCloseTo(128 / 255);
  });
});

describe('exportSignedPdf', () => {
  it('stamps text, date, and signature items and produces a loadable PDF', async () => {
    const pdfBytes = await makeBlankPdf();
    const items: PlacedItem[] = [
      { id: '1', page: 0, type: 'text', x: 72, y: 100, width: 200, height: 24, value: 'Hello', fontSize: 14 },
      { id: '2', page: 0, type: 'date', x: 72, y: 150, width: 120, height: 20, value: '06/09/2026', fontSize: 12 },
      { id: '3', page: 0, type: 'signature', x: 72, y: 200, width: 180, height: 60, value: TINY_PNG },
    ];
    const out = await exportSignedPdf(pdfBytes, items);
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
    expect(out.length).toBeGreaterThan(pdfBytes.length);
  });

  it('skips items pointing at nonexistent pages instead of throwing', async () => {
    const pdfBytes = await makeBlankPdf();
    const items: PlacedItem[] = [
      { id: '1', page: 5, type: 'text', x: 0, y: 0, width: 10, height: 10, value: 'ghost' },
    ];
    await expect(exportSignedPdf(pdfBytes, items)).resolves.toBeInstanceOf(Uint8Array);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/export.test.ts`
Expected: FAIL — cannot resolve `@/lib/export`.

**Step 3: Create `src/lib/export.ts`**

```ts
import { PDFDocument, rgb, StandardFonts, type RGB } from 'pdf-lib';
import { toPdfExportRect } from './coords';
import type { PlacedItem } from './types';

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Stamp all placed items onto the original PDF and return the signed bytes.
 * Signatures (and typed signatures, already rasterized to PNG dataURLs at
 * creation time) are embedded as images; text/date items are drawn as
 * vector text in Helvetica.
 */
export async function exportSignedPdf(
  pdfBytes: Uint8Array,
  items: PlacedItem[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const item of items) {
    const page = pages[item.page];
    if (!page) continue;
    const { height: pageHeight } = page.getSize();
    const rect = toPdfExportRect(item, pageHeight);

    if (item.type === 'signature') {
      const png = await doc.embedPng(item.value);
      page.drawImage(png, rect);
    } else {
      const fontSize = item.fontSize ?? 14;
      page.drawText(item.value, {
        x: rect.x,
        // drawText positions the baseline; drop it ~one font-size below the top edge
        y: rect.y + rect.height - fontSize,
        size: fontSize,
        font,
        color: hexToRgb(item.color ?? '#1e1b4b'),
      });
    }
  }

  return doc.save();
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/export.test.ts`
Expected: 3 passed.

**Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass.

**Step 6: Commit**

```bash
git add src/lib/export.ts src/lib/__tests__/export.test.ts
git commit -m "feat: stamp placed items onto PDF with pdf-lib"
```

---

### Task 10: Browser-only helpers — typed-signature rasterization and image sizing

These touch canvas/Image APIs that jsdom doesn't implement, so they're verified manually in Task 16 rather than unit-tested. Keep them small and dumb.

**Files:**
- Create: `src/lib/rasterize.ts`

**Step 1: Create `src/lib/rasterize.ts`**

```ts
/**
 * Render a typed name in a handwriting font onto a canvas and return a PNG
 * dataURL. We rasterize because pdf-lib cannot embed Google web fonts.
 * Must run in the browser after the font has loaded.
 */
export async function typedSignatureToPng(text: string, cssFontFamily: string): Promise<string> {
  const fontSpec = `64px ${cssFontFamily}`;
  await document.fonts.load(fontSpec, text);

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = fontSpec;
  const textWidth = Math.ceil(measure.measureText(text).width);

  const canvas = document.createElement('canvas');
  canvas.width = textWidth + 40;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontSpec; // canvas resize resets context state
  ctx.fillStyle = '#1e1b4b';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, 60);
  return canvas.toDataURL('image/png');
}

/** Natural pixel size of a dataURL image — used to size new signature items proportionally. */
export function dataUrlImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read signature image'));
    img.src = dataUrl;
  });
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 3: Commit**

```bash
git add src/lib/rasterize.ts
git commit -m "feat: rasterize typed signatures to PNG dataURLs"
```

---

### Task 11: Landing page

**Files:**
- Replace: `src/app/page.tsx`
- Delete: scaffold leftovers (`public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg` if present)

**Step 1: Replace `src/app/page.tsx`**

```tsx
import Link from 'next/link';

const FEATURES = [
  {
    title: 'Private by design',
    body: 'Your PDF never leaves your browser. No uploads, no servers, no accounts — everything happens on your machine.',
    icon: '🔒',
  },
  {
    title: 'Draw or type',
    body: 'Sketch your signature with mouse or touch, or type your name and pick a handwriting style. Save it for next time.',
    icon: '✍️',
  },
  {
    title: 'Drag anywhere',
    body: 'Drop signatures, text, and dates exactly where they belong. Resize and reposition until it looks right.',
    icon: '📄',
  },
];

export default function Home() {
  return (
    <div className="bg-hero min-h-screen text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-extrabold tracking-tight">
          Ink<span className="text-accent-400">Press</span>
        </div>
        <Link
          href="/sign"
          className="btn-glow rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold transition hover:bg-accent-400"
        >
          Sign a PDF
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Sign PDFs
            <br />
            in seconds
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-100">
            Add your signature, text, and date to any PDF — right in your browser. Free, fast, and
            completely private.
          </p>
          <Link
            href="/sign"
            className="btn-glow mt-8 inline-block rounded-full bg-accent-500 px-8 py-3.5 font-semibold transition hover:bg-accent-400"
          >
            Get started — it&apos;s free
          </Link>
        </div>

        {/* CSS illustration: floating document with signature squiggle */}
        <div className="relative hidden h-80 md:block" aria-hidden>
          <div className="absolute left-12 top-12 h-64 w-48 -rotate-6 rounded-2xl bg-ink-700/60 shadow-2xl" />
          <div className="absolute left-24 top-4 h-64 w-48 rotate-3 rounded-2xl bg-white p-5 shadow-2xl">
            <div className="h-2 w-3/4 rounded bg-ink-100" />
            <div className="mt-2 h-2 w-full rounded bg-ink-100" />
            <div className="mt-2 h-2 w-5/6 rounded bg-ink-100" />
            <div className="mt-2 h-2 w-full rounded bg-ink-100" />
            <div className="mt-2 h-2 w-2/3 rounded bg-ink-100" />
            <div
              className="mt-10 text-4xl text-ink-700"
              style={{ fontFamily: 'var(--font-dancing)' }}
            >
              Rahul
            </div>
            <div className="mt-1 h-px w-32 bg-ink-700/40" />
          </div>
          <div className="btn-glow absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-2xl">
            ✓
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/5 p-8 backdrop-blur">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-100">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Big CTA card, echoing the reference's white search card */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <h2 className="text-2xl font-extrabold text-ink-900 md:text-3xl">
            Ready to sign your document?
          </h2>
          <p className="mt-2 text-slate-500">Drop in a PDF and be done in under a minute.</p>
          <Link
            href="/sign"
            className="btn-glow mt-6 inline-block rounded-full bg-accent-500 px-10 py-3.5 font-semibold text-white transition hover:bg-accent-400"
          >
            Open the editor
          </Link>
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-ink-100/60">
        InkPress — your files never leave your browser.
      </footer>
    </div>
  );
}
```

**Step 2: Delete scaffold assets**

```bash
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

**Step 3: Verify**

Run: `npm run build`
Expected: build succeeds. Optionally `npm run dev` and eyeball `http://localhost:3000`.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add landing page in SpaceDrive visual style"
```

---

### Task 12: Editor shell — state wiring, upload flow, error banner

**Files:**
- Create: `src/app/sign/page.tsx`
- Create: `src/components/Editor.tsx`
- Create: `src/components/UploadCard.tsx`
- Create: `src/components/ErrorBanner.tsx`
- Create: `src/hooks/usePdfDocument.ts`

**Step 1: Create `src/app/sign/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Editor } from '@/components/Editor';

export const metadata: Metadata = { title: 'InkPress — Editor' };

export default function SignPage() {
  return <Editor />;
}
```

**Step 2: Create `src/hooks/usePdfDocument.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface PageInfo {
  width: number;
  height: number;
}

/**
 * Load a pdf.js document from raw bytes. pdfjs-dist is imported dynamically
 * because it touches browser globals at module scope (breaks SSR).
 */
export function usePdfDocument(pdfBytes: Uint8Array | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;

    if (!pdfBytes) {
      setDoc(null);
      setPages([]);
      setError(null);
      return;
    }

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        // pdf.js transfers the buffer to its worker — pass a copy so the
        // original bytes stay intact for the pdf-lib export.
        loaded = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
        if (cancelled) return;
        const infos: PageInfo[] = [];
        for (let i = 1; i <= loaded.numPages; i++) {
          const page = await loaded.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          infos.push({ width: vp.width, height: vp.height });
        }
        if (!cancelled) {
          setDoc(loaded);
          setPages(infos);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string })?.name;
        setError(
          name === 'PasswordException'
            ? 'This PDF is password-protected. Remove the password and try again.'
            : "This PDF couldn't be opened. It may be corrupt.",
        );
      }
    })();

    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [pdfBytes]);

  return { doc, pages, error };
}
```

**Step 3: Create `src/components/ErrorBanner.tsx`**

```tsx
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
```

**Step 4: Create `src/components/UploadCard.tsx`**

```tsx
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
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
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
```

**Step 5: Create `src/components/Editor.tsx` (shell version — canvas and items come in Tasks 13–15)**

```tsx
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

      {!state.pdfBytes || !doc || pages.length === 0 ? (
        <UploadCard onLoad={handleLoad} onError={setError} />
      ) : (
        <div className="p-6 text-ink-100">
          PDF loaded: {pages.length} page(s). Editor canvas arrives in the next task.
        </div>
      )}
    </div>
  );
}
```

**Step 6: Verify**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open `http://localhost:3000/sign`, upload any PDF.
Expected: upload card shows; after choosing a PDF, the "PDF loaded: N page(s)" message appears; a non-PDF file shows the error banner.

**Step 7: Commit**

```bash
git add src/app/sign src/components src/hooks
git commit -m "feat: editor shell with upload flow and pdf.js document loading"
```

---

### Task 13: PDF page rendering with navigation and zoom

**Files:**
- Create: `src/components/PdfCanvas.tsx`
- Create: `src/components/PageControls.tsx`
- Modify: `src/components/Editor.tsx`

**Step 1: Create `src/components/PdfCanvas.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

interface Props {
  doc: PDFDocumentProxy;
  pageIndex: number;
  zoom: number;
}

/** Renders one PDF page, oversampled by devicePixelRatio for crisp output. */
export function PdfCanvas({ doc, pageIndex, zoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;

    (async () => {
      const page = await doc.getPage(pageIndex + 1);
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: zoom * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      task = page.render({ canvasContext: canvas.getContext('2d')!, viewport });
      await task.promise.catch(() => {
        /* cancelled mid-render — fine */
      });
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageIndex, zoom]);

  return <canvas ref={canvasRef} className="block rounded-lg shadow-2xl" />;
}
```

**Step 2: Create `src/components/PageControls.tsx`**

```tsx
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
```

**Step 3: In `src/components/Editor.tsx`, replace the placeholder branch**

Replace the `<div className="p-6 text-ink-100">…</div>` block with:

```tsx
<main className="flex flex-col items-center px-6 pb-12">
  <PageControls
    currentPage={state.currentPage}
    pageCount={pages.length}
    zoom={state.zoom}
    onPage={(page) => dispatch({ type: 'SET_PAGE', page })}
    onZoom={(zoom) => dispatch({ type: 'SET_ZOOM', zoom })}
  />
  <div className="relative">
    <PdfCanvas doc={doc} pageIndex={state.currentPage} zoom={state.zoom} />
  </div>
</main>
```

Add imports:

```tsx
import { PdfCanvas } from '@/components/PdfCanvas';
import { PageControls } from '@/components/PageControls';
```

**Step 4: Verify**

Run: `npm run dev`, open `/sign`, load a multi-page PDF.
Expected: page renders crisply; arrows navigate pages; ± changes zoom between 50% and 200%.

**Step 5: Commit**

```bash
git add src/components
git commit -m "feat: render PDF pages with page navigation and zoom"
```

---

### Task 14: Draggable item overlay

**Files:**
- Create: `src/components/ItemLayer.tsx`
- Modify: `src/components/Editor.tsx`

**Step 1: Create `src/components/ItemLayer.tsx`**

```tsx
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
          className="flex h-full w-full items-center overflow-hidden whitespace-pre px-1"
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
```

**Step 2: Mount the layer over the canvas in `Editor.tsx`**

Replace:

```tsx
<div className="relative">
  <PdfCanvas doc={doc} pageIndex={state.currentPage} zoom={state.zoom} />
</div>
```

with:

```tsx
<div className="relative">
  <PdfCanvas doc={doc} pageIndex={state.currentPage} zoom={state.zoom} />
  <ItemLayer
    items={state.items}
    pageIndex={state.currentPage}
    zoom={state.zoom}
    selectedId={state.selectedId}
    dispatch={dispatch}
  />
</div>
```

Add import: `import { ItemLayer } from '@/components/ItemLayer';`

**Step 3: Temporary smoke check (no sidebar yet)** — in `Editor.tsx`, temporarily add a button in the header:

```tsx
<button
  className="rounded-full bg-white/10 px-4 py-2 text-sm"
  onClick={() =>
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id: crypto.randomUUID(),
        page: state.currentPage,
        type: 'text',
        x: 100, y: 100, width: 150, height: 28,
        value: 'Test text', fontSize: 14,
      },
    })
  }
>
  + test item
</button>
```

Run: `npm run dev`, load a PDF, add a test item.
Expected: item appears, drags within the page, resizes, shows duplicate/delete toolbar when selected, double-click edits text, survives zoom changes in the same page position.

**Step 4: Remove the temporary button, verify build**

Run: `npm run build`
Expected: build succeeds.

**Step 5: Commit**

```bash
git add src/components
git commit -m "feat: draggable, resizable item overlay with selection toolbar"
```

---

### Task 15: Signature modal (draw + type) with localStorage reuse

**Files:**
- Create: `src/components/SignatureModal.tsx`
- Test: `src/components/__tests__/SignatureModal.test.tsx`

**Step 1: Create `src/components/SignatureModal.tsx`**

```tsx
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
```

**Step 2: Write the smoke test `src/components/__tests__/SignatureModal.test.tsx`**

`signature_pad` needs a real canvas 2D context, which jsdom lacks — mock it.

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignatureModal } from '@/components/SignatureModal';

vi.mock('signature_pad', () => ({
  default: vi.fn(() => ({ isEmpty: () => true, toDataURL: () => '', clear: vi.fn(), off: vi.fn() })),
}));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ scale: vi.fn() })) as never;

describe('SignatureModal', () => {
  it('shows the Draw tab by default and switches to Type', () => {
    render(<SignatureModal onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeTruthy();
    fireEvent.click(screen.getByText('Type'));
    expect(screen.getByPlaceholderText('Type your name')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SignatureModal onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/components/__tests__/SignatureModal.test.tsx`
Expected: 2 passed.

**Step 4: Commit**

```bash
git add src/components/SignatureModal.tsx src/components/__tests__/SignatureModal.test.tsx
git commit -m "feat: signature modal with draw/type tabs and saved-signature reuse"
```

---

### Task 16: Sidebar, item controls, export wiring

**Files:**
- Create: `src/components/Sidebar.tsx`
- Modify: `src/components/Editor.tsx`

**Step 1: Create `src/components/Sidebar.tsx`**

```tsx
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
```

**Step 2: Wire everything in `src/components/Editor.tsx`** — replace the whole file:

```tsx
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
    setSignatureModalOpen(false);
    try {
      const size = await dataUrlImageSize(dataUrl);
      const width = 180;
      const height = (size.height / size.width) * width;
      addItem({ type: 'signature', width, height, value: dataUrl });
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
    } catch {
      setError("Couldn't export the signed PDF. Your edits are still here — try again.");
    } finally {
      setExporting(false);
    }
  }

  const activeError = error ?? pdfError;
  const selected = state.items.find((i) => i.id === state.selectedId) ?? null;
  const ready = state.pdfBytes && doc && pages.length > 0;

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

      {!ready ? (
        <UploadCard onLoad={handleLoad} onError={setError} />
      ) : (
        <div className="flex">
          <Sidebar
            selected={selected}
            dispatch={dispatch}
            onAddSignature={() => setSignatureModalOpen(true)}
            onAddText={() => addItem({ type: 'text', width: 150, height: 28, value: 'Double-click to edit', fontSize: 14 })}
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
            <div className="relative">
              <PdfCanvas doc={doc!} pageIndex={state.currentPage} zoom={state.zoom} />
              <ItemLayer
                items={state.items}
                pageIndex={state.currentPage}
                zoom={state.zoom}
                selectedId={state.selectedId}
                dispatch={dispatch}
              />
            </div>
          </main>
        </div>
      )}

      {signatureModalOpen && (
        <SignatureModal onConfirm={(d) => void addSignature(d)} onClose={() => setSignatureModalOpen(false)} />
      )}
    </div>
  );
}
```

**Step 3: Verify build and tests**

Run: `npm run build && npm test`
Expected: both succeed.

**Step 4: Commit**

```bash
git add src/components
git commit -m "feat: sidebar tools, item controls, and signed PDF export"
```

---

### Task 17: Final verification

**Step 1: Full automated check**

Run: `npm run lint && npm test && npm run build`
Expected: all clean. Fix anything that fails before proceeding.

**Step 2: Manual checklist** (run `npm run dev`, use a real multi-page PDF):

1. Landing page renders in the purple/pink style; both CTAs navigate to `/sign`.
2. Upload by click and by drag-drop; a non-PDF file shows the error banner.
3. Draw a signature → lands centered on the page; drag, resize (aspect locked).
4. Type a signature in each of the 3 fonts → renders as handwriting image.
5. Reload the page, open the modal → "Use saved signature" works.
6. Add text → double-click edits; font size and color controls apply.
7. Add date → defaults to today; switching format updates the value.
8. Place items on page 2; navigate away and back — they persist.
9. Zoom 50%–200% — items stay glued to the same page position.
10. Download → file named `<name>-signed.pdf`; open in a real PDF viewer (Edge/Acrobat) and confirm every item is exactly where it was placed.

**Step 3: Update README**

Replace `README.md` with a short description: what the app does, `npm install && npm run dev`, the privacy guarantee, and the tech stack.

**Step 4: Final commit**

```bash
git add -A
git commit -m "docs: update README; final verification pass"
```
