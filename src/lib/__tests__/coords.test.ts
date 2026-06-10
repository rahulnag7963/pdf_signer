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
