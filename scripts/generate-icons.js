import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Creates a PNG buffer with a modern shield icon for adblock.
 * Zero external dependencies, pure Node.js binary generation.
 */
function createPngIcon(size) {
  const width = size;
  const height = size;
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;

  // Vibrant gradient colors (Cyan/Indigo/Emerald protection shield)
  const shieldColor = [16, 185, 129, 255]; // emerald-500
  const shieldColorDark = [5, 150, 105, 255]; // emerald-600
  const shieldBorder = [240, 253, 244, 255];
  const shadowColor = [0, 0, 0, 80];

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // PNG Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Normalize coords to [-1, 1]
      const nx = (x - cx) / (cx * 0.88);
      const ny = (y - cy) / (cy * 0.88);

      // Shield geometry approximation
      // Top curve / flat, sides straight down to y=0, then tapering to point at (0, 1)
      let inShield = false;
      let inBorder = false;
      let inCheckmark = false;

      // Shield shape condition
      const topBound = -0.75 + 0.12 * (nx * nx);
      const isTopInside = ny >= topBound;
      
      let sideBound = 0.85;
      if (ny > 0) {
        // Taper towards bottom point (0, 0.95)
        const t = ny;
        sideBound = 0.85 * (1 - t * 0.85);
      }

      if (isTopInside && Math.abs(nx) <= sideBound && ny <= 0.9) {
        inShield = true;
      }

      // Check border
      if (inShield) {
        const borderDist = Math.min(
          Math.abs(Math.abs(nx) - sideBound),
          Math.abs(ny - topBound),
          Math.abs(0.9 - ny)
        );
        if (borderDist < (size > 32 ? 0.08 : 0.14)) {
          inBorder = true;
        }

        // Checkmark inside shield
        // Segment 1: from (-0.35, 0.05) to (-0.05, 0.35)
        // Segment 2: from (-0.05, 0.35) to (0.45, -0.25)
        const d1 = distToSegment(nx, ny, -0.35, 0.05, -0.05, 0.35);
        const d2 = distToSegment(nx, ny, -0.05, 0.35, 0.45, -0.25);
        const checkDist = Math.min(d1, d2);
        const thickness = size >= 48 ? 0.12 : (size >= 32 ? 0.16 : 0.22);
        if (checkDist < thickness) {
          inCheckmark = true;
        }
      }

      // Set pixel color
      if (inCheckmark) {
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 255;
      } else if (inBorder) {
        rawData[pixelOffset] = shieldBorder[0];
        rawData[pixelOffset + 1] = shieldBorder[1];
        rawData[pixelOffset + 2] = shieldBorder[2];
        rawData[pixelOffset + 3] = 255;
      } else if (inShield) {
        // Vertical gradient
        const factor = (ny + 0.8) / 1.6;
        rawData[pixelOffset] = Math.round(shieldColor[0] * (1 - factor) + shieldColorDark[0] * factor);
        rawData[pixelOffset + 1] = Math.round(shieldColor[1] * (1 - factor) + shieldColorDark[1] * factor);
        rawData[pixelOffset + 2] = Math.round(shieldColor[2] * (1 - factor) + shieldColorDark[2] * factor);
        rawData[pixelOffset + 3] = 255;
      } else {
        // Transparent background
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  return buildPng(width, height, rawData);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function buildPng(width, height, rawData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (compressed rawData)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc >>> 0, 8 + length);
  return chunk;
}

// Standard CRC32 implementation
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    crc32.table = table;
  }

  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xFF];
  }
  return (c ^ (-1)) >>> 0;
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const buf = createPngIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated icon: ${filePath} (${size}x${size}, ${buf.length} bytes)`);
}
