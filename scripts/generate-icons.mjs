// Genere les icones PWA (public/icons/), le favicon (public/favicon.svg) et le
// pictogramme isole (src/assets/logo_mark.png) a partir du logo TourShop reel
// (src/assets/logo_transparent.png). A relancer si le logo change :
//   node scripts/generate-icons.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = `${ROOT}/src/assets/logo_transparent.png`;
const OUT_DIR = `${ROOT}/public/icons`;
const BG = '#ffffff';

fs.mkdirSync(OUT_DIR, { recursive: true });

// --- 1) Isole le pictogramme (feuilles + swoosh) du logo TourShop -----------
// Le "T" cursif du wordmark chevauche le pictogramme sur y=[138,272) (mesure
// par scan pixel sur le logo source, image 726x344). On efface cette bande a
// droite (x>=88), puis on ne garde que la plus grande composante connexe :
// tout fragment de lettre restant est forcement un petit blob isole, disjoint
// du pictogramme. Coordonnees a reajuster si le logo source change de taille.
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let y = 0; y < height; y++) {
  const eraseRow = (y >= 138 && y < 272) || y >= 305;
  if (!eraseRow) continue;
  for (let x = 88; x < width; x++) {
    data[(y * width + x) * channels + 3] = 0;
  }
}

const LIMIT_W = Math.min(220, width); // au-dela : certainement du texte, jamais le pictogramme.
const labels = new Int32Array(LIMIT_W * height).fill(-1);
const sizes = [];
const alphaAt = (x, y) => data[(y * width + x) * channels + 3];

for (let sy = 0; sy < height; sy++) {
  for (let sx = 0; sx < LIMIT_W; sx++) {
    if (alphaAt(sx, sy) <= 10 || labels[sy * LIMIT_W + sx] !== -1) continue;
    const compId = sizes.length;
    let size = 0;
    const stack = [[sx, sy]];
    labels[sy * LIMIT_W + sx] = compId;
    while (stack.length) {
      const [x, y] = stack.pop();
      size++;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || nx >= LIMIT_W || ny < 0 || ny >= height) continue;
        if (labels[ny * LIMIT_W + nx] !== -1 || alphaAt(nx, ny) <= 10) continue;
        labels[ny * LIMIT_W + nx] = compId;
        stack.push([nx, ny]);
      }
    }
    sizes.push(size);
  }
}
const mainComp = sizes.indexOf(Math.max(...sizes));
for (let y = 0; y < height; y++) {
  for (let x = 0; x < LIMIT_W; x++) {
    const idx = (y * width + x) * channels;
    if (data[idx + 3] > 10 && labels[y * LIMIT_W + x] !== mainComp) data[idx + 3] = 0;
  }
}

const cropped = await sharp(data, { raw: { width, height, channels } })
  .extract({ left: 0, top: 0, width: LIMIT_W, height })
  .png()
  .toBuffer();
const mark = await sharp(cropped).trim({ threshold: 10 }).png().toBuffer();
const markMeta = await sharp(mark).metadata();
console.log('pictogramme isole :', markMeta.width, 'x', markMeta.height);

// --- 2) Compose le pictogramme sur un carre blanc, aux tailles PWA ----------
async function buildIcon(size, glyphRatio) {
  const glyphHeight = Math.round(size * glyphRatio);
  const glyphWidth = Math.round(glyphHeight * (markMeta.width / markMeta.height));
  const resizedMark = await sharp(mark).resize(glyphWidth, glyphHeight).png().toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resizedMark, gravity: 'center' }])
    .png()
    .toBuffer();
}

const targets = [
  ['icon-192.png', 192, 0.62],
  ['icon-512.png', 512, 0.62],
  ['icon-512-maskable.png', 512, 0.42], // zone de securite maskable plus large
  ['apple-touch-icon.png', 180, 0.6],
];

for (const [name, size, ratio] of targets) {
  fs.writeFileSync(`${OUT_DIR}/${name}`, await buildIcon(size, ratio));
  console.log('genere', name);
}

// --- 3) Favicon (SVG encapsulant un PNG 64px, cf. index.html) --------------
const favBuf = await buildIcon(64, 0.68);
const favSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n  <image href="data:image/png;base64,${favBuf.toString('base64')}" width="64" height="64" />\n</svg>\n`;
fs.writeFileSync(`${ROOT}/public/favicon.svg`, favSvg);
console.log('genere favicon.svg');

// Pictogramme isole (fond transparent), reutilisable en app (ex. splash screen).
fs.writeFileSync(`${ROOT}/src/assets/logo_mark.png`, mark);
console.log('genere src/assets/logo_mark.png');
