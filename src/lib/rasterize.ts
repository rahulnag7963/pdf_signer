/**
 * Render a typed name in a handwriting font onto a canvas and return a PNG
 * dataURL. We rasterize because pdf-lib cannot embed Google web fonts.
 * Must run in the browser after the font has loaded.
 */
export async function typedSignatureToPng(text: string, cssFontFamily: string): Promise<string> {
  const fontSpec = `64px ${cssFontFamily}`;
  await document.fonts.load(fontSpec, text);

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = fontSpec;
  const textWidth = Math.ceil(measure.measureText(text).width);

  const canvas = document.createElement('canvas');
  canvas.width = textWidth + 40;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontSpec; // canvas resize resets context state
  ctx.fillStyle = '#1e1b4b';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, 60);
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
