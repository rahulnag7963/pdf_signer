import { describe, expect, it } from 'vitest';
import { looksLikePdf, signedFileName } from '@/lib/files';

describe('looksLikePdf', () => {
  it('accepts bytes starting with %PDF', () => {
    expect(looksLikePdf(new TextEncoder().encode('%PDF-1.7 rest...'))).toBe(true);
  });

  it('accepts %PDF appearing within the first 1024 bytes', () => {
    const bytes = new Uint8Array(1024);
    bytes.set(new TextEncoder().encode('%PDF'), 500);
    expect(looksLikePdf(bytes)).toBe(true);
  });

  it('rejects non-PDF bytes', () => {
    expect(looksLikePdf(new TextEncoder().encode('PNG not a pdf'))).toBe(false);
  });
});

describe('signedFileName', () => {
  it('appends -signed before the extension', () => {
    expect(signedFileName('contract.pdf')).toBe('contract-signed.pdf');
  });

  it('is case-insensitive about the extension', () => {
    expect(signedFileName('Contract.PDF')).toBe('Contract-signed.pdf');
  });

  it('handles names without .pdf extension', () => {
    expect(signedFileName('contract')).toBe('contract-signed.pdf');
  });
});
