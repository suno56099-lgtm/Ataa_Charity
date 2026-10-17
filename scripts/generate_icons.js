import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Brand SVG: "عطاء" in elegant Arabic typography with emerald & gold styling and hands/heart
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1412" />
      <stop offset="50%" stop-color="#161D1A" />
      <stop offset="100%" stop-color="#1C2521" />
    </linearGradient>
    <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34C38F" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#E0B35A" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded box -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" stroke="#26312C" stroke-width="8" />

  <!-- Subtle geometric inner pattern -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="#26312C" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#34C38F" stroke-width="2" opacity="0.25"/>

  <!-- Hands / Heart Motif -->
  <g transform="translate(256, 170) scale(1.1)">
    <!-- Heart in Emerald -->
    <path d="M0,25 C-35,-20 -70,10 -35,50 L0,85 L35,50 C70,10 35,-20 0,25 Z" fill="url(#emerald)" filter="url(#glow)"/>
    <!-- Crescent / Palms sheltering the heart in gold -->
    <path d="M-80,60 C-60,110 60,110 80,60 C50,85 -50,85 -80,60 Z" fill="url(#gold)"/>
  </g>

  <!-- Calligraphy: "عطاء" -->
  <text x="256" y="365" font-family="'Cairo', 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif" font-size="76" font-weight="800" text-anchor="middle" fill="#E8EDEA" letter-spacing="2">
    عطاء
  </text>
  <text x="256" y="415" font-family="'Cairo', 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif" font-size="22" font-weight="600" text-anchor="middle" fill="#8A9690" letter-spacing="4">
    جمعية عطاء الخيرية
  </text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Function to generate raw PNG without external dependencies
function createPng(width, height, r, g, b) {
  // Minimal uncompressed/deflated RGBA PNG
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Scanlines with filter byte 0
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw a rounded emerald/gold badge
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.85) {
        // inner emblem
        const innerDist = Math.sqrt(dx * dx + (dy + 0.1) * (dy + 0.1));
        if (innerDist < 0.35) {
          // gold accent
          rawData[pxOffset] = 224;
          rawData[pxOffset + 1] = 179;
          rawData[pxOffset + 2] = 90;
          rawData[pxOffset + 3] = 255;
        } else {
          // emerald primary
          rawData[pxOffset] = 52;
          rawData[pxOffset + 1] = 195;
          rawData[pxOffset + 2] = 143;
          rawData[pxOffset + 3] = 255;
        }
      } else if (dist < 0.95) {
        // border
        rawData[pxOffset] = 38;
        rawData[pxOffset + 1] = 49;
        rawData[pxOffset + 2] = 44;
        rawData[pxOffset + 3] = 255;
      } else {
        // background dark
        rawData[pxOffset] = 15;
        rawData[pxOffset + 1] = 20;
        rawData[pxOffset + 2] = 18;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  crcTable = table;
  return table;
}

function crc32(buf) {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Write icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 52, 195, 143));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 52, 195, 143));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 52, 195, 143));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 52, 195, 143));

console.log('Successfully generated all PWA icons in /public');
