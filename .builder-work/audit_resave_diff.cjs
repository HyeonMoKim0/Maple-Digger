// 미커밋 재저장분이 순수 정규화인지 판정한다.
// HEAD 버전과 작업 트리 버전을 UIBuilder / MapBuilder 로 각각 열어
// 엔티티 집합과 componentNames 를 대조한다. (.ui/.map 은 빌더 경유만 허용)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = process.cwd();
const SKILLS = path.join(REPO, ".claude", "skills");
const { UIBuilder } = require(path.join(SKILLS, "msw-ui-system", "scripts", "msw_ui_builder.cjs"));
const { MapBuilder } = require(path.join(SKILLS, "msw-general", "scripts", "map", "msw_map_builder.cjs"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "resave-"));

function headCopy(repoRelPath) {
  const buf = execFileSync("git", ["show", `HEAD:${repoRelPath}`], {
    cwd: REPO,
    maxBuffer: 256 * 1024 * 1024,
  });
  const out = path.join(tmp, path.basename(repoRelPath));
  fs.writeFileSync(out, buf);
  return out;
}

// path -> componentNames 맵으로 정규화
function uiIndex(file) {
  const b = UIBuilder.load(file);
  const idx = new Map();
  for (const e of b.listEntities()) {
    const raw = b.find(e.path);
    idx.set(e.path, raw ? raw.componentNames || "" : "");
  }
  return idx;
}

function mapIndex(file) {
  const b = MapBuilder.read(file);
  const idx = new Map();
  for (const e of b.listEntities()) {
    const raw = b.find(e.path);
    idx.set(e.path, raw ? raw.componentNames || "" : "");
  }
  return idx;
}

function compare(label, oldIdx, newIdx) {
  const added = [...newIdx.keys()].filter((k) => !oldIdx.has(k));
  const removed = [...oldIdx.keys()].filter((k) => !newIdx.has(k));
  const changed = [...newIdx.keys()]
    .filter((k) => oldIdx.has(k) && oldIdx.get(k) !== newIdx.get(k))
    .map((k) => ({ path: k, before: oldIdx.get(k), after: newIdx.get(k) }));

  console.log(`\n=== ${label} ===`);
  console.log(`entities: HEAD ${oldIdx.size} -> work ${newIdx.size}`);
  if (added.length) console.log(`  ADDED   (${added.length}):`, added);
  if (removed.length) console.log(`  REMOVED (${removed.length}):`, removed);
  if (changed.length) {
    console.log(`  COMPONENTNAMES CHANGED (${changed.length}):`);
    for (const c of changed) {
      const before = new Set(c.before.split(",").map((s) => s.trim()).filter(Boolean));
      const after = new Set(c.after.split(",").map((s) => s.trim()).filter(Boolean));
      const plus = [...after].filter((x) => !before.has(x));
      const minus = [...before].filter((x) => !after.has(x));
      console.log(`    ${c.path}`);
      if (plus.length) console.log(`      + ${plus.join(", ")}`);
      if (minus.length) console.log(`      - ${minus.join(", ")}`);
      if (!plus.length && !minus.length) console.log(`      (순서만 바뀜)`);
    }
  }
  if (!added.length && !removed.length && !changed.length) {
    console.log("  구조 변경 없음 (엔티티·컴포넌트 동일)");
  }
}

const uiFiles = ["ui/MineHUD.ui", "ui/AccountRecoveryUI.ui", "ui/MineSelectUI.ui", "ui/PopupGroup.ui", "ui/ToastGroup.ui"];
for (const f of uiFiles) {
  try {
    compare(f, uiIndex(headCopy(f)), uiIndex(path.join(REPO, f)));
  } catch (err) {
    console.log(`\n=== ${f} ===\n  FAILED: ${err.message}`);
  }
}

try {
  compare("map/farm01.map", mapIndex(headCopy("map/farm01.map")), mapIndex(path.join(REPO, "map/farm01.map")));
} catch (err) {
  console.log(`\n=== map/farm01.map ===\n  FAILED: ${err.message}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
