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

  it('preserves selection when deleting a non-selected item', () => {
    const other: PlacedItem = { ...item, id: 'b' };
    let s = editorReducer(initialState, { type: 'ADD_ITEM', item });
    s = editorReducer(s, { type: 'ADD_ITEM', item: other }); // selects 'b'
    s = editorReducer(s, { type: 'DELETE_ITEM', id: 'a' });
    expect(s.items).toHaveLength(1);
    expect(s.selectedId).toBe('b');
  });

  it('returns the same state when duplicating a missing id', () => {
    const s1 = editorReducer(initialState, { type: 'ADD_ITEM', item });
    expect(editorReducer(s1, { type: 'DUPLICATE_ITEM', id: 'nope', newId: 'x' })).toBe(s1);
  });

  it('clears selection when changing pages', () => {
    const s1 = editorReducer(initialState, { type: 'ADD_ITEM', item });
    const s2 = editorReducer(s1, { type: 'SET_PAGE', page: 1 });
    expect(s2.currentPage).toBe(1);
    expect(s2.selectedId).toBeNull();
  });

  it('preserves the current zoom when loading a new document', () => {
    const zoomed = editorReducer(initialState, { type: 'SET_ZOOM', zoom: 1.5 });
    const loaded = editorReducer(zoomed, {
      type: 'LOAD_DOC',
      fileName: 'b.pdf',
      pdfBytes: new Uint8Array([1]),
    });
    expect(loaded.zoom).toBe(1.5);
  });

  it('clamps zoom between 0.5 and 2', () => {
    expect(editorReducer(initialState, { type: 'SET_ZOOM', zoom: 5 }).zoom).toBe(2);
    expect(editorReducer(initialState, { type: 'SET_ZOOM', zoom: 0.1 }).zoom).toBe(0.5);
  });
});
