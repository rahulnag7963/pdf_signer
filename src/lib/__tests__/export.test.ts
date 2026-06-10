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

  it('falls back to black for non-hex input instead of producing NaN channels', () => {
    const c = hexToRgb('nonsense');
    expect(c.red).toBe(0);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
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

  it('rejects the whole export when a signature dataURL is garbage (fail-fast)', async () => {
    const pdfBytes = await makeBlankPdf();
    const items: PlacedItem[] = [
      { id: '1', page: 0, type: 'signature', x: 0, y: 0, width: 100, height: 40, value: 'data:image/png;base64,not-a-png' },
    ];
    await expect(exportSignedPdf(pdfBytes, items)).rejects.toThrow();
  });
});
