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
