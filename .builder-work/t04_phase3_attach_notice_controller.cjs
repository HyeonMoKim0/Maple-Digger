// T-04 Phase 3 — 광산 3맵 루트에 MineNoticeController(ClientOnly) 부착
//
// 중요 이벤트 채널은 맵 범위다. @Logic 으로 두면 맵 전환 후에도 이전 맵의 기준선이
// 남아 중복·누락이 생기므로(AGENTS "Script lifecycle"), 맵 엔티티 컴포넌트로 붙인다.
// placeModel 이 아니라 upsertComponent 를 쓰는 이유: 맵 루트는 이미 존재하는
// 인스턴스이고, 다시 놓으면 VeinTickSimulator 의 인스턴스별 레이아웃 JSON 이 날아간다.
const path = require("path");
const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const { MapBuilder } = require(path.join(REPO, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));

const MAPS = ["farm01", "deep_mine", "gem_mine"];
const results = [];

for (const name of MAPS) {
  const file = path.join(REPO, "map", name + ".map");
  const b = MapBuilder.read(file);
  if (b.getTileMapMode() !== 1) throw new Error(name + ": expected RectTile(1)");
  b.upsertComponent(name, "script.MineNoticeController", {
    "@type": "script.MineNoticeController",
    Enable: true,
  });
  b.write(file);
  results.push(name + " -> " + b.find(name).componentNames);
}

console.log("=== RESULT ===");
console.log(results.join("\n"));
