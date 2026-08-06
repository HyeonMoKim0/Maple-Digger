// 재저장분 커밋 전 계층 불변식 확인 (docs/17 §1 주의사항 6·7·9)
// 1) 8개 UIGroup 의 GroupOrder 가 밀집 수열 0..7 인지
// 2) SpecialText 가 레거시 MOD.Core.TextComponent 를 다시 들고 있지 않은지 (D-14b)
const fs = require("fs");
const path = require("path");
const REPO = process.cwd();
const { UIBuilder } = require(path.join(REPO, ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const files = fs.readdirSync(path.join(REPO, "ui")).filter((f) => f.endsWith(".ui"));
const orders = [];
for (const f of files) {
  const b = UIBuilder.load(path.join(REPO, "ui", f));
  const group = f.replace(/\.ui$/, "");
  const comp = b.getComponent(group, "MOD.Core.UIGroupComponent");
  orders.push({ group, GroupOrder: comp ? comp.GroupOrder : "(none)" });
}
orders.sort((a, b) => a.GroupOrder - b.GroupOrder);
console.log("\n=== UIGroup GroupOrder (파일값) ===");
for (const o of orders) console.log(`  ${String(o.GroupOrder).padStart(2)}  ${o.group}`);
const vals = orders.map((o) => o.GroupOrder).filter((v) => typeof v === "number").sort((a, b) => a - b);
const dense = vals.every((v, i) => v === i);
console.log(`  -> 밀집 수열 0..${vals.length - 1}: ${dense ? "OK" : "깨짐 (D-13 회귀 의심)"}`);

const hud = UIBuilder.load(path.join(REPO, "ui", "MineHUD.ui"));
const raw = hud.find("Panel/SpecialText");
console.log("\n=== MineHUD/Panel/SpecialText ===");
console.log("  componentNames:", raw.componentNames);
console.log("  레거시 TextComponent 보유:", hud.hasComponent("Panel/SpecialText", "MOD.Core.TextComponent") ? "예 (D-14b 재발)" : "아니오 (정상)");
