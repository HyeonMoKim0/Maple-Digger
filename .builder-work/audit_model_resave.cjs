// 재저장된 .model 2개가 순수 정규화인지 ModelBuilder 로 판정한다.
// HEAD 버전과 작업 트리 버전의 컴포넌트·Values·자식을 대조.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = process.cwd();
const { ModelBuilder } = require(path.join(REPO, ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "modelresave-"));
const targets = [
  "RootDesk/MyDesk/Models/Mine/FxSprite" + ".model",
  "RootDesk/MyDesk/Models/Mine/OreBadge" + ".model",
];

function summarize(file) {
  const b = ModelBuilder.read(file);
  const values = {};
  for (const v of b.listValues()) {
    values[`${v.TargetType || v.targetType || "?"}.${v.Name || v.name}`] = JSON.stringify(v.Value ?? v.value);
  }
  return {
    components: b.listComponents().slice().sort(),
    children: b.listChildren().map((c) => c.Name).sort(),
    values,
  };
}

function diffObj(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of [...keys].sort()) {
    if (a[k] !== b[k]) out.push(`    ${k}\n      HEAD: ${a[k]}\n      work: ${b[k]}`);
  }
  return out;
}

for (const t of targets) {
  const buf = execFileSync("git", ["show", `HEAD:${t}`], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 });
  const headFile = path.join(tmp, path.basename(t));
  fs.writeFileSync(headFile, buf);

  const before = summarize(headFile);
  const after = summarize(path.join(REPO, t));

  console.log(`\n=== ${t} ===`);
  const compSame = JSON.stringify(before.components) === JSON.stringify(after.components);
  const childSame = JSON.stringify(before.children) === JSON.stringify(after.children);
  console.log(`  components (${before.components.length}): ${compSame ? "동일" : "변경"}`);
  if (!compSame) console.log(`    HEAD: ${before.components.join(", ")}\n    work: ${after.components.join(", ")}`);
  console.log(`  children: ${childSame ? "동일" : "변경"}`);
  const vd = diffObj(before.values, after.values);
  if (vd.length) {
    console.log(`  Values 변경 ${vd.length}건:`);
    vd.forEach((l) => console.log(l));
  } else {
    console.log("  Values: 동일");
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
