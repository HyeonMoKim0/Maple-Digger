// T-04 Phase 4 — 일꾼 아바타 교체
//
// 임시 몬스터 스프라이트(`3e76c89a…`)를 걷어내고 MSW 아바타로 바꾼다 (D5 §3 / docs/21 §4).
// SpriteRendererComponent → AvatarRendererComponent + CostumeManagerComponent.
//
// 두 곳을 같이 고쳐야 한다 (Phase 2 함정):
//   - Worker.model         → 런타임 스폰되는 일꾼 2~5 가 따라온다
//   - map 3개의 Worker01   → 이미 배치돼 있어 모델 수정이 소급되지 않는다
//
// 아바타 컴포넌트 구성 근거: Global/Player.model 이 AvatarRenderer + CostumeManager 쌍으로
// 아바타를 그린다. StateComponent / AvatarStateAnimationComponent 는 **일부러 넣지 않는다** —
// 일꾼은 MoveToDirection 이 아니라 KinematicbodyComponent:SetWorldPosition 으로 셀 단위
// 순간이동을 하므로 걷기 클립이 재생될 연속 구간 자체가 없다. 상태 스택을 넣으면
// IsLegacy·권한(ServerOnly) 함정만 떠안고 화면에는 아무 차이가 없다.
//
// RUID 는 docs/21 §4 / §7.1 확정값이다. `head` 는 슬롯이 없다 — 엔진이 body 색에 맞춰
// 자동 처리한다(msw-avatar). `weapon`(곡괭이)은 한손 슬롯이다.
const path = require("path");
const REPO = "D:/Develope_files/GitHub/Maple-Digger";
const SKILL = path.join(REPO, ".claude/skills/msw-general");
const { ModelBuilder } = require(path.join(SKILL, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(SKILL, "scripts/map/msw_map_builder.cjs"));

const MODEL = path.join(REPO, "RootDesk/MyDesk/Models/Farm/Worker.model");
const SPRITE = "MOD.Core.SpriteRendererComponent";
const AVATAR = "MOD.Core.AvatarRendererComponent";
const COSTUME = "MOD.Core.CostumeManagerComponent";

// docs/21 §4 — 광부 기본 외형 4슬롯 + 기본 body.
const EQUIP = {
  CustomBodyEquip: "3cf4cb29ae344577b9eed37e531688a4", // 기본 body (getAvatarDefaults)
  CustomCapEquip: "901345ad38f24486a328408df8110976", // 안전제일 모자 ✅
  CustomCoatEquip: "be931cbee7dc4b4e85046e60a6eb5651", // 화이트루즈 멜빵 ✅
  CustomPantsEquip: "c74b23716ab948bbb7118ad68b23b08b", // 밀라노청바지 (승인란 비어 있음 — 착용 스크린샷으로 판정)
  CustomOneHandedWeaponEquip: "79904036a8a1457cb9b5c624084383b8", // 황금 곡괭이 ✅
};

// 선택 링(0)·광맥 marker(1) 위에 일꾼이 와야 한다. 교체 전 SpriteRenderer 값과 같다.
const ORDER_IN_LAYER = 2;

function costumeBody() {
  // CostumeManagerComponent 전체 슬롯. 안 쓰는 슬롯은 빈 문자열 = 미착용이다.
  const body = {
    "@type": COSTUME,
    CustomBodyEquip: "",
    CustomCapEquip: "",
    CustomCapeEquip: "",
    CustomCoatEquip: "",
    CustomEarAccessoryEquip: "",
    CustomEarEquip: "",
    CustomEyeAccessoryEquip: "",
    CustomFaceAccessoryEquip: "",
    CustomFaceEquip: "",
    CustomGloveEquip: "",
    CustomHairEquip: "",
    CustomLongcoatEquip: "",
    CustomOneHandedWeaponEquip: "",
    CustomPantsEquip: "",
    CustomShoesEquip: "",
    CustomSubWeaponEquip: "",
    CustomTwoHandedWeaponEquip: "",
    DefaultEquipUserId: "",
    // 일꾼은 플레이어가 아니다. 끄면 접속 계정의 기본 코스튬이 비쳐 광부 외형이 깨진다.
    UseCustomEquipOnly: true,
    Enable: true,
  };
  for (const [slot, ruid] of Object.entries(EQUIP)) body[slot] = ruid;
  return body;
}

function avatarBody() {
  return {
    "@type": AVATAR,
    IgnoreMapLayerCheck: false,
    MaterialId: "",
    OrderInLayer: ORDER_IN_LAYER,
    PlayRate: 1,
    ShowDefaultWeaponEffects: true,
    SortingLayer: "Default",
    Enable: true,
  };
}

const results = [];

// ── 1. Worker.model ────────────────────────────────────────────────────────
const m = ModelBuilder.read(MODEL);

// 스프라이트 렌더러의 잔재를 먼저 걷는다. 값이 남으면 없는 컴포넌트를 겨냥한 채 떠돈다.
for (const name of ["SpriteRUID", "OrderInLayer"]) {
  if (m.hasValue(SPRITE, name)) m.removeValue(SPRITE, name);
}
if (m.hasComponent(SPRITE)) m.removeComponent(SPRITE);

if (!m.hasComponent(AVATAR)) m.addComponent(AVATAR);
if (!m.hasComponent(COSTUME)) m.addComponent(COSTUME);

m.value(AVATAR, "OrderInLayer", ORDER_IN_LAYER, "int");
m.value(AVATAR, "SortingLayer", "Default", "string");
m.value(COSTUME, "UseCustomEquipOnly", true, "bool");
for (const [slot, ruid] of Object.entries(EQUIP)) m.value(COSTUME, slot, ruid, "string");
m.write(MODEL);
results.push("Worker.model -> " + m.listComponents().join(", "));

// ── 2. 맵에 배치된 Worker01 3개 ─────────────────────────────────────────────
for (const name of ["farm01", "deep_mine", "gem_mine"]) {
  const file = path.join(REPO, "map", name + ".map");
  const b = MapBuilder.read(file);
  if (b.getTileMapMode() !== 1) throw new Error(name + ": expected RectTile(1)");
  if (b.find("Worker01") === null) throw new Error(name + ": Worker01 missing");

  b.upsertComponent("Worker01", AVATAR, avatarBody());
  b.upsertComponent("Worker01", COSTUME, costumeBody());
  // 아바타 렌더러가 붙은 뒤에 지운다 — 중간 상태로 저장되는 일이 없다.
  b.removeComponent("Worker01", SPRITE);
  b.write(file);
  results.push(name + "/Worker01 -> " + b.find("Worker01").componentNames);
}

console.log("=== RESULT ===");
console.log(results.join("\n"));
