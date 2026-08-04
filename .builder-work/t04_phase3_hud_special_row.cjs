// T-04 Phase 3 — 특별 광맥 HUD 행 추가 (F5 §2.2 "HUD 아이콘")
//
// MineHUD 패널을 36px 늘리고 마지막 텍스트 행 아래에 SpecialText 를 넣는다.
// 우측 버튼 스택(MineSelectUI/BtnOpen)은 HUD 패널 바로 아래에 붙어 있어
// (간격 12px) 패널만 늘리면 겹친다 — F5 §6.1 "상시 표시 요소는 겹치지 않는다".
// 그래서 버튼도 같은 36px 만큼 내린다.
const path = require("path");
const SKILL = "D:/Develope_files/GitHub/Maple-Digger/.claude/skills/msw-ui-system";
const { UIBuilder } = require(path.join(SKILL, "scripts", "msw_ui_builder.cjs"));

const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const GROW = 36;

// ── MineHUD ────────────────────────────────────────────────────────────────
const hud = UIBuilder.read(path.join(REPO, "ui/MineHUD.ui"));

// 기존 행과 글꼴·정렬을 정확히 맞추기 위해 DepotText 의 렌더러를 그대로 복제한다.
const donor = hud.getComponent("Panel/DepotText", "MOD.Core.TextGUIRendererComponent");
if (donor === null) throw new Error("DepotText renderer not found");

hud.patch("Panel", { rect_size: [460, 430 + GROW] });
hud.text("Panel/SpecialText", "특별 광맥  활성 0곳", {
  anchor: "top-left",
  pos: [16, -332],
  rect_size: [428, 32],
  size: donor.FontSize,
});
hud.upsertComponent(
  "Panel/SpecialText",
  "MOD.Core.TextGUIRendererComponent",
  Object.assign({}, donor, { Text: "특별 광맥  활성 0곳" })
);
// b.text() 는 레거시 MOD.Core.TextComponent 를 함께 붙인다. 그대로 두면 같은
// 엔티티에 텍스트 렌더러가 둘이라 문자열이 겹쳐 찍히고, 컨트롤러가 갱신하는 쪽은
// TextGUIRendererComponent 뿐이라 나머지 하나는 생성 시점 문자열에 멈춘다.
// 기존 HUD 행(MineText/DepotText 등)도 전부 렌더러 하나만 갖는다.
if (hud.hasComponent("Panel/SpecialText", "MOD.Core.TextComponent")) {
  hud.removeComponent("Panel/SpecialText", "MOD.Core.TextComponent");
}
// 인벤토리 버튼을 새 행 아래로 밀어낸다.
hud.patch("Panel/BtnInventory", { pos: [16, -334 - GROW] });

hud.write(path.join(REPO, "ui/MineHUD.ui"), {
  bind: {
    mlua: path.join(REPO, "RootDesk/MyDesk/Mine/MineInventoryController.mlua"),
    props: { specialText: "Panel/SpecialText" },
  },
});

// ── MineSelectUI ───────────────────────────────────────────────────────────
const select = UIBuilder.read(path.join(REPO, "ui/MineSelectUI.ui"));
select.patch("BtnOpen", { pos: [-260, -466 - GROW] });
select.write(path.join(REPO, "ui/MineSelectUI.ui"));

console.log("SpecialText id:", hud.getId("Panel/SpecialText"));
console.log(
  "HUD panel:",
  JSON.stringify(hud.getComponent("Panel", "MOD.Core.UITransformComponent").RectSize)
);
console.log(
  "BtnOpen:",
  JSON.stringify(select.getComponent("BtnOpen", "MOD.Core.UITransformComponent").anchoredPosition)
);
