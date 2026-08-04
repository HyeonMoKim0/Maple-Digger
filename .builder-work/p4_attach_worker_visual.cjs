// T-04 Phase 4 — WorkerVisualController 부착
//
// 일꾼 2~5 는 런타임에 Worker.model 로 스폰되므로 모델에 붙이면 따라온다.
// Worker01 은 맵에 이미 배치돼 있어 모델 수정이 소급되지 않는다(Phase 2 함정).
// 그래서 맵 인스턴스에는 upsertComponent 로 따로 더한다.
const path = require("path");
const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const SKILL = path.join(REPO, ".claude/skills/msw-general");
const { ModelBuilder } = require(path.join(SKILL, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(SKILL, "scripts/map/msw_map_builder.cjs"));

const MODEL = path.join(REPO, "RootDesk/MyDesk/Models/Farm/Worker.model");
const COMP = "script.WorkerVisualController";
const results = [];

const m = ModelBuilder.read(MODEL);
if (!m.hasComponent(COMP)) m.addComponent(COMP);
// 선택 링이 발밑에 깔리려면 일꾼이 링보다 위에 그려져야 한다. 링은 0 이다.
m.value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int").write(MODEL);
results.push("Worker.model -> " + m.listComponents().join(", "));

for (const name of ["farm01", "deep_mine", "gem_mine"]) {
  const file = path.join(REPO, "map", name + ".map");
  const b = MapBuilder.read(file);
  if (b.getTileMapMode() !== 1) throw new Error(name + ": expected RectTile(1)");
  b.upsertComponent("Worker01", COMP, { "@type": COMP, Enable: true });
  b.patchComponent("Worker01", "MOD.Core.SpriteRendererComponent", { OrderInLayer: 2 });
  b.write(file);
  results.push(name + "/Worker01 -> " + b.find("Worker01").componentNames);
}

console.log("=== RESULT ===");
console.log(results.join("\n"));
