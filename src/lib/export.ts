import { PDFDocument, rgb, StandardFonts, type PDFImage, type RGB } from 'pdf-lib';
import { toPdfExportRect } from './coords';
import type { PlacedItem } from './types';

/** Parse a 6-digit hex color into pdf-lib RGB; anything else falls back to black. */
export function hexToRgb(hex: string): RGB {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return rgb(0, 0, 0);
  const n = parseInt(hex.replace('#', ''), 16);
  if (!Number.isFinite(n)) return rgb(0, 0, 0);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Stamp all placed items onto the original PDF and return the signed bytes.
 * Signatures (and typed signatures, already rasterized to PNG dataURLs at
 * creation time) are embedded as images; text/date items are drawn as
 * vector text in Helvetica.
 *
 * An invalid signature dataURL rejects the whole export (fail-fast); the
 * caller shows an error and editor state is preserved.
 */
export async function exportSignedPdf(
  pdfBytes: Uint8Array,
  items: PlacedItem[],
): Promise<Uint8Array> {
  // ignoreEncryption: PDFs with owner-password permissions (print/copy
  // restrictions) render fine in pdf.js but are rejected by pdf-lib's
  // default load. We never bypass user passwords — those fail at upload.
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  // The same signature placed on multiple pages/items only gets embedded once.
  const embeddedPngs = new Map<string, PDFImage>();

  for (const item of items) {
    const page = pages[item.page];
    if (!page) continue;
    const { height: pageHeight } = page.getSize();
    const rect = toPdfExportRect(item, pageHeight);

    if (item.type === 'signature') {
      let png = embeddedPngs.get(item.value);
      if (!png) {
        png = await doc.embedPng(item.value);
        embeddedPngs.set(item.value, png);
      }
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
