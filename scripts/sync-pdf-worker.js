const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const dest = join('public', 'pdf.worker.min.mjs');

mkdirSync('public', { recursive: true });

const candidates = [
  'build/pdf.worker.min.mjs',
  'build/pdf.worker.mjs',
  'legacy/build/pdf.worker.min.mjs',
  'legacy/build/pdf.worker.mjs',
].map((p) => join('node_modules', 'pdfjs-dist', p));

const source = candidates.find(existsSync);

if (!source) {
  console.error(
    `Could not find a pdf.js worker file in node_modules/pdfjs-dist. Tried:\n${candidates
      .map((p) => `  - ${p}`)
      .join('\n')}`
  );
  process.exit(1);
}

copyFileSync(source, dest);
