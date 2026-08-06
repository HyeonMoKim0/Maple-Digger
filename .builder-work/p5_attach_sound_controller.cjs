// T-04 Phase 5 — MineSoundController 를 광산 맵 3개의 루트 엔티티에 붙인다.
// VeinTickSimulator / MineNoticeController 와 같은 자리다 (F5 §1 "ClientOnly, 맵").
// upsertComponent 는 componentNames 를 자동 동기화한다 (builder-protocol-map.md §1.3).
const path = require("path");
const { MapBuilder } = require(path.join(process.cwd(), ".claude", "skills", "msw-general", "scripts", "map", "msw_map_builder.cjs"));

const maps = ["farm01", "deep_mine", "gem_mine"];
for (const name of maps) {
  const file = `map/${name}.map`;
  const b = MapBuilder.read(file);
  const root = b.find(name);
  if (!root) throw new Error(`map root not found: ${name}`);
  const before = root.componentNames.includes("script.MineSoundController");
  b.upsertComponent(name, "script.MineSoundController", {
    "@type": "script.MineSoundController",
    Enable: true,
  }).write(file);
  console.log(`${file}: MineSoundController ${before ? "replaced" : "added"}`);
}
