// TEMPORARY asset comparison probe for T-04 (docs/21 미결 1·3·4·5).
// Places the 6 부유석 conditions + 신비한 광석 stand in a row on farm01 so the
// RectTile cell fit and the stage ordering can be judged on screen.
//
//   node .builder-work/place_vein_asset_probe.cjs              # 1x on the real grid (cell-fit pass)
//   node .builder-work/place_vein_asset_probe.cjs --detail     # 2.5x spread out (artwork pass)
//   node .builder-work/place_vein_asset_probe.cjs --clean      # remove all probes
const path = require('path');
const { MapBuilder } = require(path.join(
  __dirname, '..', '.claude', 'skills', 'msw-general', 'scripts', 'map', 'msw_map_builder.cjs'
));

const MAP = 'map/farm01.map';

// docs/21 §1.1 / §1.2 — all animationclip. Assigned raw (no thumbnail://) so playback is also verified.
const PROBES = [
  { name: 'ZZProbe1_Buoy_stand',   ruid: 'a0bd28cbdcd54445827f0375f24266b5' },
  { name: 'ZZProbe2_Buoy_cond1',   ruid: '0f44530d655f4e33bfbe43423450ee9f' },
  { name: 'ZZProbe3_Buoy_cond2',   ruid: '0d2725961bb44a20aa753ef11793120c' },
  { name: 'ZZProbe4_Buoy_cond3',   ruid: 'e2e923d5cde9413eadc66be1fdd3f59a' },
  { name: 'ZZProbe5_Buoy_cond4',   ruid: '2daf76debab042e09b2d3bf2d5ba575f' },
  { name: 'ZZProbe6_Buoy_cond5',   ruid: '40c805ead61d440889632ef2244dab30' },
  { name: 'ZZProbe7_Mystic_stand', ruid: '2e0c28aa5d2c4118b53668f6649b7322' },
];

const clean  = process.argv.includes('--clean');
const detail = process.argv.includes('--detail');
const buoy   = process.argv.includes('--buoy');   // 부유석 6장만, 화면 중앙 정렬

const ROW_Y   = -3;
const SPACING = (detail || buoy) ? 2 : 1;
const START_X = buoy ? -5 : (detail ? -6 : -3);
const SCALE   = (detail || buoy) ? 2.5 : 1;
const SET     = buoy ? PROBES.slice(0, 6) : PROBES;

const m = MapBuilder.read(MAP);
console.log('TileMapMode =', m.getTileMapMode(), '(1 = RectTile, expected)');

if (clean) {
  for (const p of PROBES) {
    if (m.find(p.name)) { m.remove(p.name); console.log('removed', p.name); }
    else console.log('absent  ', p.name);
  }
} else {
  // always clear first so a mode switch never leaves stale probes behind
  for (const p of PROBES) if (m.find(p.name)) m.remove(p.name);
  SET.forEach((p, i) => {
    const x = START_X + i * SPACING;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, ROW_Y, 0], order: 50 });
    if (SCALE !== 1) {
      m.patchComponent(p.name, 'MOD.Core.TransformComponent',
        { Scale: { x: SCALE, y: SCALE, z: 1 } });
    }
    console.log(`placed ${p.name.padEnd(22)} at (${x}, ${ROW_Y}) scale=${SCALE}`);
  });
}

m.write(MAP);
console.log('\nentities now =', m.listEntities().length);
