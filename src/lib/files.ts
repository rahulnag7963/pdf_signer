const PDF_MARKER = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

/** The PDF spec allows the header anywhere in the first 1024 bytes. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const probe = bytes.subarray(0, 1024);
  outer: for (let i = 0; i + PDF_MARKER.length <= probe.length; i++) {
    for (let j = 0; j < PDF_MARKER.length; j++) {
      if (probe[i + j] !== PDF_MARKER[j]) continue outer;
    }
    return true;
  }
  return false;
}

export function signedFileName(original: string): string {
  return `${original.replace(/\.pdf$/i, '')}-signed.pdf`;
}

/** Browser-only: trigger a download of the given bytes. */
export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
