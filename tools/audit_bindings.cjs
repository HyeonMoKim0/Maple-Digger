// 잠재 nil 감사 — .mlua 의 property <Type> x = "<uuid>" 선언을 .ui / .map 엔티티의
// 실제 componentNames 와 대조한다. 타입이 다르면 GetComponent 가 오류 없이 nil 을
// 돌려주고 기능이 조용히 사라진다 (docs/16 §14 D-11).
const fs = require("fs");
const path = require("path");
const ROOT = "D:/Develope_files/GitHub/Maple-Digger";
const { UIBuilder } = require(path.join(ROOT, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));

// ---- 1. .mlua 선언 수집
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".mlua")) out.push(p);
  }
  return out;
}
const mluaFiles = walk(path.join(ROOT, "RootDesk/MyDesk"), []);
const DECL = /^[ \t]*property[ \t]+([A-Za-z_][A-Za-z0-9_]*)[ \t]+([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*"([0-9a-fA-F]{8}-[0-9a-fA-F-]{27})"/gm;
const decls = [];
for (const f of mluaFiles) {
  const src = fs.readFileSync(f, "utf8");
  let m;
  DECL.lastIndex = 0;
  while ((m = DECL.exec(src)) !== null) {
    decls.push({ file: path.relative(ROOT, f).replace(/\\/g, "/"), type: m[1], name: m[2], uuid: m[3].toLowerCase() });
  }
}

// ---- 2. .ui / .map 엔티티 인덱스
const index = new Map(); // uuid -> { source, path, comps[] }
for (const f of fs.readdirSync(path.join(ROOT, "ui")).filter((n) => n.endsWith(".ui"))) {
  const b = UIBuilder.read(path.join(ROOT, "ui", f));
  for (const e of b.listEntities()) {
    const p = e.path;
    if (!p) continue;
    const raw = b.find(p);
    if (!raw || !raw.id) continue;
    index.set(String(raw.id).toLowerCase(), { source: "ui/" + f, path: p, comps: (raw.componentNames || "").split(",").filter(Boolean) });
  }
}
for (const f of fs.readdirSync(path.join(ROOT, "map")).filter((n) => n.endsWith(".map"))) {
  const b = MapBuilder.read(path.join(ROOT, "map", f));
  for (const e of b.listEntities()) {
    const nm = e.name || e.path;
    if (!nm) continue;
    let raw = null;
    try { raw = b.find(nm); } catch (err) { continue; }
    if (!raw || !raw.id) continue;
    index.set(String(raw.id).toLowerCase(), { source: "map/" + f, path: raw.path || nm, comps: (raw.componentNames || "").split(",").filter(Boolean) });
  }
}

// ---- 3. 대조
const NON_COMPONENT = new Set(["Entity", "EntityRef", "any", "string", "integer", "number", "boolean", "table"]);
const mismatch = [], notFound = [], ok = [];
for (const d of decls) {
  const hit = index.get(d.uuid);
  if (!hit) { notFound.push(d); continue; }
  if (NON_COMPONENT.has(d.type)) { ok.push(d); continue; }
  const bare = hit.comps.map((c) => c.replace(/^MOD\.Core\./, "").replace(/^script\./, ""));
  if (bare.includes(d.type)) ok.push(d);
  else mismatch.push({ ...d, entity: hit.path, source: hit.source, actual: bare.filter((c) => /Component$/.test(c)) });
}

console.log("검사한 .mlua = " + mluaFiles.length + ", UUID 선언 = " + decls.length + ", 인덱스된 엔티티 = " + index.size);
console.log("\n=== [실패] 선언 타입 != 실제 컴포넌트 (런타임 nil) : " + mismatch.length + "건 ===");
for (const m of mismatch) {
  console.log("  " + m.file + "  property " + m.type + " " + m.name);
  console.log("      엔티티 " + m.source + " " + m.entity);
  console.log("      실제  " + m.actual.join(", "));
}
console.log("\n=== [주의] UUID 를 .ui/.map 에서 찾지 못함 : " + notFound.length + "건 ===");
for (const n of notFound) console.log("  " + n.file + "  property " + n.type + " " + n.name + " = " + n.uuid);
console.log("\n정상 = " + ok.length + "건");
