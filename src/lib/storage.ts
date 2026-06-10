const KEY = 'pdf-signer.signature';

export interface SavedSignature {
  dataUrl: string;
  savedAt: string;
}

/** Returns false when localStorage is unavailable or full (degrade to session-only). */
export function saveSignature(dataUrl: string): boolean {
  try {
    const record: SavedSignature = { dataUrl, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadSignature(): SavedSignature | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSignature;
    return typeof parsed?.dataUrl === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSignature(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do — storage unavailable
  }
}
