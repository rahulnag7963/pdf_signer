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
