#!/usr/bin/env node
/**
 * audit_resave.cjs — Maker 정규화 재저장분 판정
 *
 * Play 를 돌리면 Maker 가 ui/ · map/ · Models/ 를 정규화 재저장한다. 그 자체는
 * 무해하지만, D-13 처럼 계층 회귀가 정규화에 섞여 들어온 적이 있다. 이 도구는
 * 미커밋 상태인 파일들이 **순수 정규화인지 실제 변경인지** 판정한다.
 *
 * .ui / .model 은 가드가 shell 접근을 막으므로 git diff 로 눈으로 볼 수 없다.
 * 그래서 HEAD 판과 작업 트리 판을 **각각 빌더로 열어** 구조를 대조한다.
 *
 *   node tools/audit_resave.cjs
 *
 * 종료 코드: 0 = 순수 정규화(그대로 chore 커밋 가능) / 1 = 구조 변경 또는 회귀 발견
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = process.cwd();
const SKILLS = path.join(REPO, ".claude", "skills");
const { UIBuilder } = require(path.join(SKILLS, "msw-ui-system", "scripts", "msw_ui_builder.cjs"));
const { MapBuilder } = require(path.join(SKILLS, "msw-general", "scripts", "map", "msw_map_builder.cjs"));
const { ModelBuilder } = require(path.join(SKILLS, "msw-general", "scripts", "model", "msw_model_builder.cjs"));

// 빌더가 로드할 때마다 "Loaded N entities" 를 찍어 결과가 묻힌다.
function quiet(fn) {
  const real = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = real;
  }
}

function git(args) {
  return execFileSync("git", args, { cwd: REPO, maxBuffer: 512 * 1024 * 1024 });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "resave-"));
function headCopy(repoRelPath) {
  const out = path.join(tmp, repoRelPath.replace(/[\\/]/g, "__"));
  fs.writeFileSync(out, git(["show", `HEAD:${repoRelPath}`]));
  return out;
}

let problems = 0;
const note = (s) => console.log(s);

// ── 대상 수집: 미커밋 상태인 콘텐츠 파일만 본다 ──────────────────────────
const dirty = git(["status", "--porcelain", "--", "ui", "map", "RootDesk/MyDesk/Models"])
  .toString("utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.replace(/^\S+\s+/, "").replace(/^"(.*)"$/, "$1"))
  .filter((p) => /\.(ui|map|model)$/.test(p));

// ── (1) 구조 대조: 엔티티 집합 · componentNames ─────────────────────────
function indexEntities(builderLoad, file) {
  return quiet(() => {
    const b = builderLoad(file);
    const idx = new Map();
    for (const e of b.listEntities()) {
      const raw = b.find(e.path);
      idx.set(e.path, raw ? raw.componentNames || "" : "");
    }
    return idx;
  });
}

function compareEntities(label, oldIdx, newIdx) {
  const added = [...newIdx.keys()].filter((k) => !oldIdx.has(k));
  const removed = [...oldIdx.keys()].filter((k) => !newIdx.has(k));
  const changed = [];
  for (const [k, after] of newIdx) {
    if (!oldIdx.has(k)) continue;
    const before = oldIdx.get(k);
    if (before === after) continue;
    const setOf = (s) => new Set(s.split(",").map((x) => x.trim()).filter(Boolean));
    const b = setOf(before);
    const a = setOf(after);
    const plus = [...a].filter((x) => !b.has(x));
    const minus = [...b].filter((x) => !a.has(x));
    changed.push({ path: k, plus, minus, orderOnly: plus.length === 0 && minus.length === 0 });
  }

  const real = added.length || removed.length || changed.some((c) => !c.orderOnly);
  note(`\n  ${label}  (엔티티 HEAD ${oldIdx.size} -> 작업트리 ${newIdx.size})`);
  if (added.length) note(`    [변경] 추가된 엔티티 ${added.length}: ${added.join(", ")}`);
  if (removed.length) note(`    [변경] 삭제된 엔티티 ${removed.length}: ${removed.join(", ")}`);
  for (const c of changed) {
    if (c.orderOnly) {
      note(`    [정규화] ${c.path} — componentNames 순서만 바뀜`);
    } else {
      note(`    [변경] ${c.path}`);
      if (c.plus.length) note(`        + ${c.plus.join(", ")}`);
      if (c.minus.length) note(`        - ${c.minus.join(", ")}`);
    }
  }
  if (!added.length && !removed.length && !changed.length) note("    [정규화] 구조 변경 없음");
  if (real) problems++;
}

// ── (2) .model 대조: components · children · Values ─────────────────────
function compareModel(file) {
  const summarize = (f) =>
    quiet(() => {
      const b = ModelBuilder.read(f);
      const values = {};
      for (const v of b.listValues()) {
        const t = v.TargetType || v.targetType || "?";
        const n = v.Name || v.name;
        values[`${t}.${n}`] = JSON.stringify(v.Value ?? v.value);
      }
      return {
        components: b.listComponents().slice().sort(),
        children: b.listChildren().map((c) => c.Name).sort(),
        values,
      };
    });

  const before = summarize(headCopy(file));
  const after = summarize(path.join(REPO, file));

  note(`\n  ${file}`);
  let real = false;
  if (JSON.stringify(before.components) !== JSON.stringify(after.components)) {
    note(`    [변경] components  HEAD: ${before.components.join(", ")}`);
    note(`                      작업: ${after.components.join(", ")}`);
    real = true;
  }
  if (JSON.stringify(before.children) !== JSON.stringify(after.children)) {
    note(`    [변경] children  HEAD: ${before.children.join(", ")} / 작업: ${after.children.join(", ")}`);
    real = true;
  }
  const keys = new Set([...Object.keys(before.values), ...Object.keys(after.values)]);
  for (const k of [...keys].sort()) {
    if (before.values[k] !== after.values[k]) {
      note(`    [변경] ${k}  HEAD: ${before.values[k]} -> 작업: ${after.values[k]}`);
      real = true;
    }
  }
  if (!real) note("    [정규화] components · children · Values 동일 (ValueType 메타데이터만 바뀜)");
  else problems++;
}

// ── (3) 회귀 점검: 재저장에 섞여 들어온 적이 있는 두 가지 ────────────────
function checkInvariants() {
  note("\n── 회귀 점검 ──");

  // D-13: Maker 재저장이 UIGroupComponent.GroupOrder 를 되돌린 적이 있다.
  // 절대값은 런타임에 0..N 으로 재압축되므로 상대 순서만 의미가 있고,
  // 파일도 밀집 수열로 맞춰 두었다 (docs/17 §1 주의사항 6·7).
  const uiFiles = fs.readdirSync(path.join(REPO, "ui")).filter((f) => f.endsWith(".ui"));
  const orders = [];
  for (const f of uiFiles) {
    const group = f.replace(/\.ui$/, "");
    const comp = quiet(() => UIBuilder.load(path.join(REPO, "ui", f)).getComponent(group, "MOD.Core.UIGroupComponent"));
    orders.push({ group, order: comp ? comp.GroupOrder : null });
  }
  orders.sort((a, b) => a.order - b.order);
  const vals = orders.map((o) => o.order).filter((v) => typeof v === "number");
  const dense = vals.every((v, i) => v === i);
  note(`  GroupOrder: ${orders.map((o) => `${o.order}=${o.group}`).join("  ")}`);
  if (dense) {
    note(`  [OK] 밀집 수열 0..${vals.length - 1} 유지 (D-13 재발 아님)`);
  } else {
    note("  [회귀] 밀집 수열이 깨졌다 — D-13 과 같은 계층 회귀를 의심한다");
    problems++;
  }

  // D-14b: UIBuilder.text() 가 레거시 TextComponent 를 함께 붙이면
  // 같은 자리에 문자열이 겹쳐 찍힌다 (docs/17 §1 주의사항 9).
  const dual = [];
  for (const f of uiFiles) {
    quiet(() => {
      const b = UIBuilder.load(path.join(REPO, "ui", f));
      for (const e of b.listEntities()) {
        if (b.hasComponent(e.path, "MOD.Core.TextComponent") && b.hasComponent(e.path, "MOD.Core.TextGUIRendererComponent")) {
          dual.push(e.path);
        }
      }
    });
  }
  if (dual.length === 0) {
    note("  [OK] 렌더러 2개 동시 보유 0건 (D-14b 재발 아님)");
  } else {
    note(`  [회귀] TextComponent + TextGUIRendererComponent 동시 보유 ${dual.length}건: ${dual.join(", ")}`);
    problems++;
  }
  note("  ⚠ 위 두 검사는 파일 기준이다. 컴포넌트 제거는 Maker 에 임포트된 엔티티에");
  note("    소급되지 않으므로, 파일이 깨끗해도 런타임에 남아 있을 수 있다 (docs/17 §1 주의사항 10).");
}

// ── 실행 ────────────────────────────────────────────────────────────────
try {
  note("== Maker 재저장분 판정 ==");
  if (dirty.length === 0) {
    note("\n미커밋 콘텐츠 파일 없음.");
  } else {
    note(`\n── 구조 대조 (${dirty.length}건) ──`);
    for (const f of dirty) {
      try {
        if (f.endsWith(".model")) compareModel(f);
        else if (f.endsWith(".map")) compareEntities(f, indexEntities(MapBuilder.read, headCopy(f)), indexEntities(MapBuilder.read, path.join(REPO, f)));
        else compareEntities(f, indexEntities(UIBuilder.load, headCopy(f)), indexEntities(UIBuilder.load, path.join(REPO, f)));
      } catch (err) {
        note(`\n  ${f}\n    [실패] ${err.message}`);
        problems++;
      }
    }
  }

  checkInvariants();

  note("\n── 판정 ──");
  if (problems === 0) {
    note("  순수 정규화. chore 커밋으로 분리해도 된다.");
  } else {
    note(`  ${problems}건이 정규화가 아니다. 위 [변경] / [회귀] 항목을 확인하고,`);
    note("  실제 변경이면 기능 커밋으로, 회귀면 되돌린 뒤 커밋한다.");
  }
  process.exitCode = problems === 0 ? 0 : 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
