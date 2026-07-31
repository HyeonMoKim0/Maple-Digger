// Restore UIGroupComponent.GroupOrder to the F5 §6.2 target values.
// Maker's CoreVersion 26.5 -> 26.7 re-save squashed three sparse GroupOrder values
// back into the dense 0..7 creation order, undoing the D-1/D-3 layering fix.
const path = require('path');
const { UIBuilder } = require(path.join(
  __dirname, '..', '.claude', 'skills', 'msw-ui-system', 'scripts', 'msw_ui_builder.cjs'
));

// F5 §6.2 target layering (see Archive/As-built.md 2026-07-30 D-1/D-3 record):
//   DefaultGroup 0 / BlockProgramUI 1 / MineHUD 2 / MineInventoryUI 5
//   MineSelectUI 7 / PopupGroup 10 / ToastGroup 20 / AccountRecoveryUI 50
const TARGETS = [
  { file: 'ui/PopupGroup.ui',        group: 'PopupGroup',        order: 10 },
  { file: 'ui/ToastGroup.ui',        group: 'ToastGroup',        order: 20 },
  { file: 'ui/AccountRecoveryUI.ui', group: 'AccountRecoveryUI', order: 50 },
];

// Read-only survey of every .ui root so we can print the whole layering, not just the three.
const ALL = [
  'ui/DefaultGroup.ui', 'ui/BlockProgramUI.ui', 'ui/MineHUD.ui', 'ui/MineInventoryUI.ui',
  'ui/MineSelectUI.ui', 'ui/PopupGroup.ui', 'ui/ToastGroup.ui', 'ui/AccountRecoveryUI.ui',
];

function survey(label) {
  console.log(`\n--- GroupOrder ${label} ---`);
  for (const f of ALL) {
    const g = path.basename(f, '.ui');
    const b = UIBuilder.load(f);
    const c = b.getComponent(g, 'MOD.Core.UIGroupComponent');
    console.log(`  ${String(c?.GroupOrder).padStart(3)}  ${g}`);
  }
}

survey('BEFORE');

for (const t of TARGETS) {
  const b = UIBuilder.load(t.file);
  const before = b.getComponent(t.group, 'MOD.Core.UIGroupComponent')?.GroupOrder;
  if (before === t.order) { console.log(`\n${t.group}: already ${t.order}, skipped`); continue; }
  b.patchComponent(t.group, 'MOD.Core.UIGroupComponent', { GroupOrder: t.order });
  b.write(t.file);
  console.log(`\n${t.group}: GroupOrder ${before} -> ${t.order}  (${t.file} written)`);
}

survey('AFTER');
