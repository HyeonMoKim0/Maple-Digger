// D-14 — 광물 종류 아이콘 뱃지 모델 (C205 / docs/21 §1.3)
//
// 광맥 marker 의 자식으로 런타임에 붙는 표시 전용 엔티티다. 서버 상태를 갖지
// 않으므로 VeinMarkerController(ClientOnly)가 SpawnByModelId 로 만든다.
// 맵 인스턴스 35개를 직접 수술하지 않으려고 런타임 생성을 택했다 — Phase 2 에서
// .model 수정이 기존 인스턴스에 소급되지 않아 38개를 일일이 고쳐야 했다.
const path = require("path");
const SKILL = "D:/Develope_files/GitHub/Maple-Digger/.claude/skills/msw-general";
const { ModelBuilder, vector3 } = require(path.join(SKILL, "scripts", "model", "msw_model_builder.cjs"));

const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const OUT = path.join(REPO, "RootDesk/MyDesk/Models/Mine/OreBadge.model");

// 기본값은 돌 아이콘(docs/20 §0). 실제 RUID 는 oreType 에 따라 런타임에 덮어쓴다.
// 빈 SpriteRUID 를 남기면 오류 없이 사라지므로 기본값을 반드시 채운다(platform.md §7).
const STONE_ICON = "184829e852ab4810898f5bb72b9db8a3";

const b = ModelBuilder.fromTemplate(
  path.join(SKILL, "models", "TransformOnly.model"),
  "OreBadge"
);

b.component("SpriteRendererComponent")
  .value("SpriteRendererComponent", "SpriteRUID", STONE_ICON, "string")
  // 부모 marker 는 OrderInLayer = 1 이다. 뱃지가 가려지지 않게 위로 올린다
  // (docs/21 §1.3 "뱃지의 SortingLayer·OrderInLayer 를 부모보다 위로").
  .value("SpriteRendererComponent", "OrderInLayer", 5, "int")
  .value("TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .write(OUT);

console.log("=== RESULT ===");
console.log(b.snapshot());
