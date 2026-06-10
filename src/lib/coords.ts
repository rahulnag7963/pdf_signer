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
