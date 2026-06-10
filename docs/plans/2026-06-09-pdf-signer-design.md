# PDF Signer — Design

**Date:** 2026-06-09
**Status:** Approved

## What we're building

A Next.js web app for signing PDFs locally in the browser. The user uploads a PDF, places a signature (drawn or typed), text, and date boxes anywhere on the pages by drag-and-drop, then downloads the flattened, signed PDF. No file ever leaves the machine.

The UI emulates the "SpaceDrive" modern SaaS aesthetic: deep violet gradients, vibrant pink CTAs, white rounded cards, bold typography.

## Decisions made during brainstorming

- Signature creation: **both** freehand drawing (mouse/touch pad) and typed name with handwriting fonts
- Processing: **fully in-browser** — no server, no uploads
- Placement: **drag-and-drop** on a live PDF preview, with reposition and resize
- Structure: **landing page + editor** (two routes)
- Persistence: signatures saved to **localStorage** for reuse across sessions
- Editor approach: **pdf.js render + React overlay + pdf-lib export** (Approach 1, chosen over Fabric.js and click-to-stamp)

## Architecture & stack

Next.js 15 (App Router), TypeScript, Tailwind CSS v4. Fully client-side; statically exportable.

| Dependency | Role |
|---|---|
| `pdfjs-dist` | Render PDF pages to canvas for live preview |
| `pdf-lib` | Stamp items onto the original PDF on export |
| `react-rnd` | Drag + resize overlay items |
| `react-signature-canvas` | Freehand signature pad |
| `next/font` (Google) | Poppins for UI; Dancing Script, Great Vibes, Caveat for typed signatures |

Routes:
- `/` — landing page (hero, features, CTA)
- `/sign` — the editor

## UI & design language

Design tokens from the reference image:
- Background: deep violet gradient (#2D1B69 → #6B2FB3 range) with radial glows and dot/star decorations
- Primary CTA: vibrant pink/magenta (~#E94CA1) rounded-full buttons with glow shadows
- Cards: white, ~16px radius, soft elevated shadows
- Type: bold white headings, lavender body on dark; dark slate on white cards

**Landing page:** top nav (logo + pink "Sign a PDF" button), hero with bold headline and CSS-built isometric-style illustration (layered floating document cards with signature squiggle; no image assets), 3-card feature row (Private by design / Draw or type / Drag anywhere), big white CTA card.

**Editor:** dark violet workspace. Left sidebar: tool buttons (Signature, Text, Date) and per-item controls (font, size, color, delete). Center: white PDF page canvas with page navigation and zoom. Empty state: drag-and-drop upload card. Header: pink "Download PDF" button. Signature modal: Draw tab (canvas pad) and Type tab (name + handwriting font picker), plus a "save for later" toggle.

## Editor data flow

Single `DocumentState` in the editor page:

```ts
{
  pdfBytes: Uint8Array          // original file
  pages: { width, height }[]    // PDF point dimensions per page
  currentPage: number
  zoom: number
  items: PlacedItem[]
}

PlacedItem = {
  id, page,
  type: 'signature' | 'text' | 'date',
  x, y, width, height,          // stored in PDF points
  value: string,                // dataURL for signature; text for text/date
  fontFamily?, fontSize?, color?
}
```

- pdf.js renders the current page at `zoom × devicePixelRatio`; items live in an absolutely-positioned overlay div covering the canvas.
- Item coordinates are stored in **PDF points** and converted to pixels via the zoom factor for display. Zooming never corrupts positions; export needs only a Y-axis flip (PDF origin is bottom-left).
- Export: pdf-lib loads `pdfBytes`; signatures embedded via `embedPng`; text/date via `drawText`. Typed signatures in handwriting fonts are rasterized to PNG first (pdf-lib can't embed Google Fonts without font files). `save()` → download as `<name>-signed.pdf`.
- Date items default to today with a format picker (MM/DD/YYYY, DD/MM/YYYY, Month D, YYYY). Text items are double-click-to-edit. Selected items show resize handles and a floating toolbar (delete, duplicate).

## Error handling

- Invalid/corrupt/password-protected PDF → friendly toast; upload state preserved; encrypted PDFs detected via pdf.js password error. No password support in v1.
- Non-PDF file → rejected (MIME type + `%PDF` magic bytes).
- Large PDFs → only the current page is rendered, bounding memory.
- localStorage full/unavailable → signature saving degrades to session-only with a notice.
- Export failure → error toast; document state untouched.

## Testing

- **Unit (Vitest):** coordinate conversion (screen↔PDF points, Y-flip), date formatting, export item mapping.
- **Component smoke tests:** signature modal tabs, item add/delete reducers.
- **Manual checklist:** upload → sign → download in Chrome/Edge; verify output in a real PDF reader.
- No E2E in v1 (YAGNI for a single-user tool).
