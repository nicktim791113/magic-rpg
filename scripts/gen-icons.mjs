// 產生 PWA 佔位圖示（純 Node，不需要額外套件）。
// 畫面：深藍漸層底 + 金色星球 + 一圈淡藍光環。
// 之後有真美術時，把 public/icon-*.png 換掉即可。
//
// 執行：node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

// ---- CRC32（PNG 每個區塊結尾需要的檢查碼）----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// 把「每個像素的顏色函式」畫成一張 PNG
function makePng(size, draw) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // 每列開頭的 filter byte = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const o = y * (stride + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 = RGBA
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function draw(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const dx = x - cx, dy = y - cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  const planetR = size * 0.26;
  const ringR = size * 0.37, ringW = size * 0.03;

  // 背景：由上到下的深藍漸層
  const t = y / size;
  let r = 8 + t * 10, g = 16 + t * 20, b = 40 + t * 34, a = 255;

  // 光環
  if (Math.abs(d - ringR) < ringW) { r = 120; g = 150; b = 230; }

  // 星球（左上較亮，做出立體感）
  if (d < planetR) {
    const sh = Math.max(0.5, Math.min(1, 1 - (dx + dy) / (planetR * 3)));
    r = 255 * sh; g = 205 * sh; b = 70 * sh;
  }
  return [clamp(r), clamp(g), clamp(b), a];
}

const outDir = join(process.cwd(), "public");
mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makePng(size, draw));
}
writeFileSync(join(outDir, "icon-512-maskable.png"), makePng(512, draw));
console.log("已產生 public/icon-192.png、icon-512.png、icon-512-maskable.png");
