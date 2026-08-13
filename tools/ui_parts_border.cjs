#!/usr/bin/env node
/**
 * ui_parts_border.cjs — 9-slice 경계(border_*)를 실측한다.
 *
 * 프레임 스프라이트는 "테두리 장식 + 균일한 내부"로 되어 있다.
 * 정중앙 픽셀 색을 내부 색으로 보고, 각 변에서 안쪽으로 훑어
 * 그 색과 만나는 지점까지를 테두리로 잡는다.
 *
 * 코너 장식은 평면 테두리보다 두꺼우므로, 중앙선 실측값에
 * 코너 실측값을 함께 재서 둘 중 큰 값을 제안한다.
 *
 *   node tools/ui_parts_border.cjs [이름조각 ...]
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { decodePng } = require("./ui_parts_prep.cjs");

const DIR = "build/ui-parts";

function measure(img) {
  const { w, h, data } = img;
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  // 알파도 채널의 하나로 비교한다. "불투명해야 한다"는 절대 조건을 걸면
  // 반투명 내부를 가진 파츠에서 중앙 픽셀조차 탈락해 측정이 통째로 깨진다.
  const near = (a, b, tol) =>
    Math.abs(a[0] - b[0]) <= tol &&
    Math.abs(a[1] - b[1]) <= tol &&
    Math.abs(a[2] - b[2]) <= tol &&
    Math.abs(a[3] - b[3]) <= tol;

  const cx = w >> 1;
  const cy = h >> 1;
  const fill = at(cx, cy);
  const TOL = 18;

  // 중앙에서 바깥으로 훑는다. 가장자리에서 안쪽으로 훑으면 테두리 색이
  // 우연히 내부 색과 가까울 때 0 이 나온다.
  let L = cx, R = cx, T = cy, B = cy;
  for (let x = cx; x >= 0; x--) if (!near(at(x, cy), fill, TOL)) { L = x + 1; break; }
  for (let x = cx; x < w; x++) if (!near(at(x, cy), fill, TOL)) { R = w - x; break; }
  for (let y = cy; y >= 0; y--) if (!near(at(cx, y), fill, TOL)) { T = y + 1; break; }
  for (let y = cy; y < h; y++) if (!near(at(cx, y), fill, TOL)) { B = h - y; break; }

  // 코너 장식 두께 — 대각선을 중앙에서 바깥으로 훑는다
  let diag = 0;
  const lim = Math.min(cx, cy);
  for (let d = lim; d >= 0; d--) if (!near(at(d, d), fill, TOL)) { diag = d + 1; break; }

  return { L, R, T, B, diag };
}

function main() {
  const filters = process.argv.slice(2);
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".png") && !f.startsWith("_"))
    .filter((f) => filters.length === 0 || filters.some((s) => f.includes(s)))
    .sort();

  for (const f of files) {
    const img = decodePng(fs.readFileSync(path.join(DIR, f)));
    const m = measure(img);
    const suggest = Math.max(m.L, m.R, m.T, m.B, m.diag);
    const maxAllowed = Math.floor(Math.min(img.w, img.h) / 2) - 1;
    const border = Math.min(suggest, maxAllowed);
    console.log(
      `${f.replace(/\.png$/, "").padEnd(30)} ${String(img.w + "x" + img.h).padStart(9)}` +
        `  L${String(m.L).padStart(3)} R${String(m.R).padStart(3)} T${String(m.T).padStart(3)} B${String(m.B).padStart(3)}` +
        `  대각${String(m.diag).padStart(3)}  →  border ${border}${border !== suggest ? " (상한 적용)" : ""}`
    );
  }
}

if (require.main === module) main();
module.exports = { measure };
