# InkPress

Sign PDFs entirely in your browser. Draw or type a signature, add text and date fields, drag them into place on any page, and download the signed PDF.

## Privacy

Your files never leave your machine. The PDF is parsed, rendered, edited, and re-exported entirely client-side — there is no upload, no server processing, and no account.

## Features

- **Signature** — draw with mouse/pen/touch, or type your name in one of three handwriting fonts; optionally remembered on your device for next time
- **Text** — free text with adjustable font size and color
- **Date** — defaults to today, with selectable formats
- **Placement** — drag, resize, and position items on any page; positions stay accurate across zoom levels and survive page navigation
- **Export** — items are stamped onto the original PDF and downloaded as `<name>-signed.pdf`

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm test
```

## Tech stack

- [Next.js 16](https://nextjs.org) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [pdfjs-dist](https://github.com/mozilla/pdf.js) — in-browser PDF rendering
- [pdf-lib](https://pdf-lib.js.org) — stamping items and exporting the signed PDF
- [react-rnd](https://github.com/bokuweb/react-rnd) — drag/resize for placed items
- [signature_pad](https://github.com/szimek/signature_pad) — smooth signature drawing

## Design docs

Implementation plans and design notes live in [`docs/plans/`](docs/plans/).
