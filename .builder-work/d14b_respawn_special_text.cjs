// SpecialText 엔티티를 새 UUID 로 다시 만든다.
//
// 왜: UIBuilder.text() 가 함께 붙인 레거시 MOD.Core.TextComponent 를
// removeComponent 로 지웠고 .ui 파일에서는 실제로 사라졌는데, Maker 에 이미
// 임포트된 엔티티에서는 남아 "Text" 가 계속 찍혔다(런타임 실측). 컴포넌트 제거는
// refresh 로 기존 엔티티에 소급되지 않는다 — Phase 2 의 ".model 수정이 배치된
// 인스턴스에 소급되지 않는다"와 같은 계열이다.
//
// 그래서 컴포넌트가 아니라 엔티티 자체를 지우고 새 UUID 로 만든다.
const path = require("path");
const SKILL = "D:/Develope_files/GitHub/Maple-Digger/.claude/skills/msw-ui-system";
const { UIBuilder } = require(path.join(SKILL, "scripts", "msw_ui_builder.cjs"));

const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const HUD = path.join(REPO, "ui/MineHUD.ui");
const LABEL = "특별 광맥  활성 0곳";

const b = UIBuilder.read(HUD);
const donor = b.getComponent("Panel/DepotText", "MOD.Core.TextGUIRendererComponent");
if (donor === null) throw new Error("DepotText renderer not found");

const before = b.getId("Panel/SpecialText");
if (before !== null) b.remove("Panel/SpecialText");

b.text("Panel/SpecialText", LABEL, {
  anchor: "top-left",
  pos: [16, -332],
  rect_size: [428, 32],
  size: donor.FontSize,
});
b.upsertComponent(
  "Panel/SpecialText",
  "MOD.Core.TextGUIRendererComponent",
  Object.assign({}, donor, { Text: LABEL })
);
if (b.hasComponent("Panel/SpecialText", "MOD.Core.TextComponent")) {
  b.removeComponent("Panel/SpecialText", "MOD.Core.TextComponent");
}

b.write(HUD, {
  bind: {
    mlua: path.join(REPO, "RootDesk/MyDesk/Mine/MineInventoryController.mlua"),
    props: { specialText: "Panel/SpecialText" },
  },
});

console.log("=== RESULT ===");
console.log("old id:", before);
console.log("new id:", b.getId("Panel/SpecialText"));
console.log("components:", b.find("Panel/SpecialText").componentNames);
