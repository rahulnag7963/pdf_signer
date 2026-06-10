/**
 * Resolve a CSS `var(--name)` font-family value to its concrete family name.
 * next/font defines its font variables on <body> (not documentElement), so we
 * read the computed style there. Non-var values pass through unchanged; an
 * unset variable falls back to 'cursive'.
 */
function resolveFontFamily(cssFontFamily: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(cssFontFamily.trim());
  if (!match) return cssFontFamily;
  const resolved = getComputedStyle(document.body).getPropertyValue(match[1]).trim();
  return resolved || 'cursive';
}

/**
 * Render a typed name in a handwriting font onto a canvas and return a PNG
 * dataURL. We rasterize because pdf-lib cannot embed Google web fonts.
 * Must run in the browser after the font has loaded.
 *
 * `cssFontFamily` may be a `var(--name)` reference (the form next/font
 * produces). The Font Loading API rejects CSS custom properties and canvas
 * `ctx.font` silently ignores them, so the variable is resolved against
 * `<body>` to a concrete family before measuring and drawing.
 */
export async function typedSignatureToPng(text: string, cssFontFamily: string): Promise<string> {
  const fontSpec = `64px ${resolveFontFamily(cssFontFamily)}`;
  await document.fonts.load(fontSpec, text);

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = fontSpec;
  const metrics = measure.measureText(text);
  // Script fonts (e.g. Great Vibes) have flourishes that extend beyond the
  // advance width and the em box, so size the canvas from the actual ink
  // bounding box. Fall back to advance width / em-derived values where a
  // browser reports 0/undefined.
  const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
  const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || 51);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || 29);

  const canvas = document.createElement('canvas');
  canvas.width = left + right + 40;
  canvas.height = ascent + descent + 20;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontSpec; // canvas resize resets context state
  ctx.fillStyle = '#1e1b4b';
  ctx.textBaseline = 'alphabetic';
  // Offset by the ink bounds so flourishes left of the origin and above the
  // baseline stay inside the canvas (20px/10px padding on each side).
  ctx.fillText(text, 20 + left, 10 + ascent);
  return canvas.toDataURL('image/png');
}

/** Natural pixel size of a dataURL image — used to size new signature items proportionally. */
export function dataUrlImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read signature image'));
    img.src = dataUrl;
  });
}
