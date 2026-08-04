// T-04 Phase 4 — 연출용 범용 스프라이트 모델
//
// 선택 링 · 채굴 파편처럼 "Transform + SpriteRenderer 만 있고 RUID 는 런타임에
// 정해지는" 표시 전용 엔티티의 공용 템플릿이다. D-14 의 OreBadge 와 같은 방식이며,
// 맵 파일을 건드리지 않고 클라이언트가 자식으로 붙인다.
const path = require("path");
const SKILL = "D:/Develope_files/GitHub/Maple-Digger/.claude/skills/msw-general";
const { ModelBuilder, vector3 } = require(path.join(SKILL, "scripts", "model", "msw_model_builder.cjs"));

const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const OUT = path.join(REPO, "RootDesk/MyDesk/Models/Mine/FxSprite.model");

// 기본값은 선택 링(docs/21 §5 승인). 실제 RUID 는 쓰는 쪽에서 덮어쓴다.
// 빈 SpriteRUID 는 오류 없이 사라지므로 기본값을 반드시 채운다(platform.md §7).
const RING = "76e2d942cc264558aad35f78be17b109";

const b = ModelBuilder.fromTemplate(
  path.join(SKILL, "models", "TransformOnly.model"),
  "FxSprite"
);

// 갱신된 빌더는 컴포넌트 이름을 자동 보정하지 않고 정규화 이름을 요구한다.
b.component("MOD.Core.SpriteRendererComponent")
  .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", RING, "string")
  .value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 0, "int")
  .value("MOD.Core.TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .write(OUT);

console.log("=== RESULT ===");
console.log("model id:", b.snapshot().model_id);
