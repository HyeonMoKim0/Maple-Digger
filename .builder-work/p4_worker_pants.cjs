// T-04 Phase 4 — 일꾼 하의 교체 (오너 지정, 2026-08-04)
//
// 밀라노청바지(c74b2371…)가 무릎 위에서 끊기는 짧은 청색으로 읽혀 오너가 교체를 지시했다.
// docs/21 §4 의 대체 후보가 아니라 오너가 직접 지정한 RUID 다.
//
// 아바타 교체(p4_worker_avatar.cjs)와 같은 이유로 네 곳을 같이 고친다:
// 템플릿은 런타임 스폰되는 일꾼 2~5 를, 맵 3개의 Worker01 은 이미 배치된 인스턴스를 덮는다.
const path = require("path");
const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const SKILL = path.join(REPO, ".claude/skills/msw-general");
const { ModelBuilder } = require(path.join(SKILL, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(SKILL, "scripts/map/msw_map_builder.cjs"));

const TEMPLATE = path.join(REPO, "RootDesk/MyDesk/Models/Farm/Worker.model");
const COSTUME = "MOD.Core.CostumeManagerComponent";
const SLOT = "CustomPantsEquip";
const PANTS = "e6ff0ea602e043f48a7e231ed4f95daf";

const results = [];

const m = ModelBuilder.read(TEMPLATE);
m.value(COSTUME, SLOT, PANTS, "string").write(TEMPLATE);
results.push("Worker template -> " + SLOT + "=" + m.getValue(COSTUME, SLOT));

for (const name of ["farm01", "deep_mine", "gem_mine"]) {
  const file = path.join(REPO, "map", name + ".map");
  const b = MapBuilder.read(file);
  if (b.getTileMapMode() !== 1) throw new Error(name + ": expected RectTile(1)");
  // 슬롯 하나만 바꾼다. upsertComponent 로 통째로 갈면 나머지 16슬롯을 다시 써야 한다.
  b.patchComponent("Worker01", COSTUME, { [SLOT]: PANTS });
  b.write(file);
  results.push(name + "/Worker01 -> " + SLOT + "=" + b.component("Worker01", COSTUME)[SLOT]);
}

console.log("=== RESULT ===");
console.log(results.join("\n"));
