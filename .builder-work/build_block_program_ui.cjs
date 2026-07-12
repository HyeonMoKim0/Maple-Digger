const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const { UIBuilder } = require(path.join(projectRoot, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));

const ui = new UIBuilder('BlockProgramUI');

ui.panel('Panel', { anchor: 'middle-left', pos: [20, 0], rect_size: [560, 580] });

ui.text('Panel/Title', '블록 프로그램', {
  anchor: 'top-left', pos: [190, -42], rect_size: [340, 44],
  size: 28, alignment: 4, bold: true,
});

ui.button('Panel/BtnMoveE', '→ 동쪽으로 이동', {
  anchor: 'top-left', pos: [190, -110], rect_size: [340, 52],
  font_size: 24, color: '#111827',
});
ui.patchComponent('Panel/BtnMoveE', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.85, g: 0.92, b: 1.0, a: 1.0 } });

ui.button('Panel/BtnMoveS', '↓ 남쪽으로 이동', {
  anchor: 'top-left', pos: [190, -172], rect_size: [340, 52],
  font_size: 24, color: '#111827',
});
ui.patchComponent('Panel/BtnMoveS', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.85, g: 0.92, b: 1.0, a: 1.0 } });

ui.button('Panel/BtnHarvest', '수확하기', {
  anchor: 'top-left', pos: [190, -234], rect_size: [340, 52],
  font_size: 24, color: '#111827',
});
ui.patchComponent('Panel/BtnHarvest', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 1.0, g: 0.92, b: 0.78, a: 1.0 } });

ui.button('Panel/BtnPlant', '심기 (당근)', {
  anchor: 'top-left', pos: [190, -296], rect_size: [340, 52],
  font_size: 24, color: '#111827',
});
ui.patchComponent('Panel/BtnPlant', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.82, g: 0.96, b: 0.82, a: 1.0 } });

ui.text('Panel/ProgramLabel', '조립된 프로그램:', {
  anchor: 'top-left', pos: [190, -350], rect_size: [340, 28],
  size: 20, alignment: 0,
});

ui.text('Panel/ProgramText', '(empty - tap blocks to add)', {
  anchor: 'top-left', pos: [190, -404], rect_size: [340, 80],
  size: 22, alignment: 0, overflow: 0,
});

ui.button('Panel/BtnRun', '실행', {
  anchor: 'top-left', pos: [102, -516], rect_size: [164, 52],
  font_size: 24, color: '#FFFFFF',
});
ui.patchComponent('Panel/BtnRun', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.20, g: 0.62, b: 0.32, a: 1.0 } });

ui.button('Panel/BtnClear', '초기화', {
  anchor: 'top-left', pos: [278, -516], rect_size: [164, 52],
  font_size: 24, color: '#FFFFFF',
});
ui.patchComponent('Panel/BtnClear', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.70, g: 0.30, b: 0.30, a: 1.0 } });

ui.write('ui/BlockProgramUI.ui', {
  bind: {
    mlua: 'RootDesk/MyDesk/Farm/BlockProgramController.mlua',
    props: {
      btnMoveE: 'Panel/BtnMoveE',
      btnMoveS: 'Panel/BtnMoveS',
      btnHarvest: 'Panel/BtnHarvest',
      btnPlant: 'Panel/BtnPlant',
      btnRun: 'Panel/BtnRun',
      btnClear: 'Panel/BtnClear',
      programText: 'Panel/ProgramText',
    },
  },
});

console.log('BlockProgramUI built and bound.');
