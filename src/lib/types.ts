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
