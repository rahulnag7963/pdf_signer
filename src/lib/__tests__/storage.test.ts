import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSignature, loadSignature, saveSignature } from '@/lib/storage';

describe('signature storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips a signature dataURL', () => {
    expect(saveSignature('data:image/png;base64,abc')).toBe(true);
    expect(loadSignature()?.dataUrl).toBe('data:image/png;base64,abc');
  });

  it('returns null when nothing is saved', () => {
    expect(loadSignature()).toBeNull();
  });

  it('returns null for corrupt stored data', () => {
    localStorage.setItem('pdf-signer.signature', 'not json {');
    expect(loadSignature()).toBeNull();
  });

  it('returns false when setItem throws (quota exceeded / storage unavailable)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(saveSignature('data:image/png;base64,abc')).toBe(false);
  });

  it('clears the saved signature', () => {
    saveSignature('data:image/png;base64,abc');
    clearSignature();
    expect(loadSignature()).toBeNull();
  });
});
