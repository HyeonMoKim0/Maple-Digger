#!/usr/bin/env node
/**
 * ui_parts_prep.cjs — docs/ui-parts 의 AI 생성 원본 PNG 를 MSW 스프라이트로 쓸 수 있게 다듬는다.
 *
 *   1) 알파 bbox 로 트리밍   (원본은 그림 주변이 전부 투명 여백이다)
 *   2) 박스 필터로 축소       (프리멀티플라이드 알파 — 가장자리 검은 테 방지)
 *   3) PNG 재인코딩
 *
 * 원본은 건드리지 않고 build/ui-parts/ 아래에 결과를 쓴다.
 *
 *   node tools/ui_parts_prep.cjs                  전량 처리
 *   node tools/ui_parts_prep.cjs --sheet          + 대조 시트(build/ui-parts/_sheet.png) 생성
 *   node tools/ui_parts_prep.cjs panel-frame-hud  이름에 문자열이 들어가는 것만
 */

"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SRC_DIR = "docs/ui-parts";
const OUT_DIR = "build/ui-parts";

// ── PNG 디코드 (8bit RGBA / RGB / Gray(+alpha), 논-인터레이스) ────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG 시그니처 아님");
  let p = 8;
  let w, h, bitDepth, colorType, interlace;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} 미지원`);
  if (interlace !== 0) throw new Error("인터레이스 PNG 미지원");

  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (colorType === 3) throw new Error("팔레트 PNG 미지원");

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = px.subarray(y * stride, (y + 1) * stride);
    const prevRow = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prevRow ? prevRow[i] : 0;
      const c = prevRow && i >= ch ? prevRow[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 255;
    }
  }

  // 무조건 RGBA8 로 정규화
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    let r, g, b, a;
    if (ch === 4) [r, g, b, a] = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], px[i * 4 + 3]];
    else if (ch === 3) [r, g, b, a] = [px[i * 3], px[i * 3 + 1], px[i * 3 + 2], 255];
    else if (ch === 2) [r, g, b, a] = [px[i * 2], px[i * 2], px[i * 2], px[i * 2 + 1]];
    else [r, g, b, a] = [px[i], px[i], px[i], 255];
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = a;
  }
  return { w, h, data: rgba };
}

// ── PNG 인코드 (RGBA8) ──────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(img) {
  const { w, h, data } = img;
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter None — 도트풍 이미지에선 이게 가장 안전하다
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── 알파 bbox 트리밍 ────────────────────────────────────────────────────────
function trim(img, alphaThreshold = 8) {
  const { w, h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img; // 전부 투명 — 그대로 둔다
  const nw = x1 - x0 + 1;
  const nh = y1 - y0 + 1;
  const out = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    data.copy(out, y * nw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + nw) * 4);
  }
  return { w: nw, h: nh, data: out };
}

// ── 박스 필터 축소 (프리멀티플라이드 알파) ───────────────────────────────────
function resize(img, tw, th) {
  const { w, h, data } = img;
  if (tw === w && th === h) return img;
  const out = Buffer.alloc(tw * th * 4);
  const sx = w / tw;
  const sy = h / th;
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.min(h, Math.ceil((y + 1) * sy)));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.min(w, Math.ceil((x + 1) * sx)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * w + xx) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al;
          g += data[i + 1] * al;
          b += data[i + 2] * al;
          a += data[i + 3];
          n++;
        }
      }
      const o = (y * tw + x) * 4;
      const aAvg = a / n;
      if (aAvg < 0.5) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        const un = n * (aAvg / 255); // 언프리멀티플라이
        out[o] = Math.min(255, Math.round(r / un));
        out[o + 1] = Math.min(255, Math.round(g / un));
        out[o + 2] = Math.min(255, Math.round(b / un));
        out[o + 3] = Math.round(aAvg);
      }
    }
  }
  return { w: tw, h: th, data: out };
}

// ── 파츠 매니페스트: 긴 변 목표 픽셀 ────────────────────────────────────────
// 역할별로 정한다. 종횡비는 항상 원본(트리밍 후) 그대로 유지한다.
const LONG_EDGE = [
  [/panel-frame-large|modal-frame-blank/, 384],
  [/panel-frame-hud/, 384],
  [/ledger-row|toast-bar|library-row|library-slot-locked|cart-capacity-bar|slider-track/, 384],
  [/button-(slate|green|orange)-blank|tab-worker-|command-tile|cost-chip|quantity-badge|toggle-(on|off)/, 192],
  [/inventory-slot-|mine-node-|mine-route-connector/, 128],
  [/button-close|stepper-|slider-thumb|status-|validation-badge-|icon-/, 96],
];

function targetLongEdge(name) {
  for (const [re, n] of LONG_EDGE) if (re.test(name)) return n;
  return 128;
}

// ── 실행 ────────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const wantSheet = args.includes("--sheet");
  const filters = args.filter((a) => !a.startsWith("--"));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".png"))
    .filter((f) => filters.length === 0 || filters.some((s) => f.includes(s)))
    .sort();

  const results = [];
  for (const file of files) {
    const name = file.replace(/^maple-digger-/, "").replace(/\.png$/, "");
    const src = decodePng(fs.readFileSync(path.join(SRC_DIR, file)));
    const trimmed = trim(src);
    const long = targetLongEdge(name);
    const scale = Math.min(1, long / Math.max(trimmed.w, trimmed.h));
    const tw = Math.max(1, Math.round(trimmed.w * scale));
    const th = Math.max(1, Math.round(trimmed.h * scale));
    const out = resize(trimmed, tw, th);
    const bytes = encodePng(out);
    fs.writeFileSync(path.join(OUT_DIR, name + ".png"), bytes);
    results.push({ name, src: `${src.w}x${src.h}`, trimmed: `${trimmed.w}x${trimmed.h}`, out: `${tw}x${th}`, kb: Math.round(bytes.length / 102.4) / 10, img: out });
    console.log(
      `${name.padEnd(34)} ${String(src.w + "x" + src.h).padStart(11)} → trim ${String(trimmed.w + "x" + trimmed.h).padStart(11)} → ${String(tw + "x" + th).padStart(9)}  ${(bytes.length / 1024).toFixed(1)}KB`
    );
  }

  if (wantSheet) buildSheet(results);
  console.log(`\n${results.length}개 처리 · ${OUT_DIR}/`);
}

// ── 대조 시트: 결과물을 격자로 합쳐 한 장으로 (육안 판정용) ──────────────────
function buildSheet(results) {
  const CELL = 200;
  const COLS = 7;
  const rows = Math.ceil(results.length / COLS);
  const W = COLS * CELL;
  const H = rows * CELL;
  const sheet = { w: W, h: H, data: Buffer.alloc(W * H * 4) };
  // 판정용 중간 회색 배경 (밝은 파츠·어두운 파츠 양쪽이 보이도록)
  for (let i = 0; i < W * H; i++) {
    const cx = Math.floor((i % W) / CELL);
    const cy = Math.floor(Math.floor(i / W) / CELL);
    const v = (cx + cy) % 2 ? 110 : 88;
    sheet.data[i * 4] = v;
    sheet.data[i * 4 + 1] = v;
    sheet.data[i * 4 + 2] = v;
    sheet.data[i * 4 + 3] = 255;
  }
  results.forEach((r, idx) => {
    const cx = (idx % COLS) * CELL;
    const cy = Math.floor(idx / COLS) * CELL;
    const s = Math.min(1, (CELL - 16) / Math.max(r.img.w, r.img.h));
    const im = s < 1 ? resize(r.img, Math.round(r.img.w * s), Math.round(r.img.h * s)) : r.img;
    const ox = cx + Math.floor((CELL - im.w) / 2);
    const oy = cy + Math.floor((CELL - im.h) / 2);
    for (let y = 0; y < im.h; y++) {
      for (let x = 0; x < im.w; x++) {
        const si = (y * im.w + x) * 4;
        const a = im.data[si + 3] / 255;
        if (a === 0) continue;
        const di = ((oy + y) * W + ox + x) * 4;
        for (let k = 0; k < 3; k++) sheet.data[di + k] = Math.round(im.data[si + k] * a + sheet.data[di + k] * (1 - a));
      }
    }
  });
  fs.writeFileSync(path.join(OUT_DIR, "_sheet.png"), encodePng(sheet));
  console.log(`\n대조 시트: ${OUT_DIR}/_sheet.png  (${W}x${H}, ${COLS}열 · 좌→우 · 위→아래 알파벳순)`);
}

module.exports = { decodePng, encodePng, trim, resize, targetLongEdge };

if (require.main === module) main();
