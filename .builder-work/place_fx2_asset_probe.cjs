// TEMPORARY 2차 프로브: 채굴/회복/고갈 연출 후보(신비한 광석 비의존) + Depot 대안 육안 확인.
//   node .builder-work/place_fx2_asset_probe.cjs           # 배치
//   node .builder-work/place_fx2_asset_probe.cjs --clean   # 제거
const path = require('path');
const { MapBuilder } = require(path.join(
  __dirname, '..', '.claude', 'skills', 'msw-general', 'scripts', 'map', 'msw_map_builder.cjs'
));

const MAP = 'map/farm01.map';

// y=1 행: 연출 후보 (파편 / 타격 / 회복 / 고갈)
const FX = [
  { name: 'ZZG_Frag1',  ruid: 'd4f82b525b47413c8c485dee4c696431' }, // 132x112
  { name: 'ZZG_Frag2',  ruid: '474ae7adb03548dd9c714efb9bc35fc6' }, // 294x196
  { name: 'ZZG_Hit1',   ruid: '36e2836f0c624b17a9606aed23775cfc' }, // 204x228
  { name: 'ZZG_Hit2',   ruid: '6ade17adefdc4fcc8b7ccec09ed12a50' }, //  68x56
  { name: 'ZZG_Rec1',   ruid: '15432599f48446b89e09131e0cc811e4' }, //  86x111 슈퍼차지
  { name: 'ZZG_Rec2',   ruid: '36050cb600f445fd8b84cac257fc4710' }, // 120x84
  { name: 'ZZG_Rec3',   ruid: '2d6ec29c588a4d3fbf6e35c41ac31069' }, //  46x46
  { name: 'ZZG_Dep1',   ruid: '78ea5621bb574c8d8d7f84848262014d' }, // 132x57
  { name: 'ZZG_Dep2',   ruid: 'b8db7bd905964aeb962bba0471a5d7cb' }, //  36x40
];

// y=-2 행: Depot 대안
const DEPOT2 = [
  { name: 'ZZG_Cart1', ruid: '9ba708f680304681961b8b34c4dc193d' }, // 184x92
  { name: 'ZZG_Cart2', ruid: '19ca3b3488c5412c97bf215dfb6aa4aa' }, // 176x84
  { name: 'ZZG_Cart3', ruid: 'dfb42a75738049bc82767b1e38b626dc' }, // 176x76 돼지농장
  { name: 'ZZG_Mine1', ruid: '3d661344f01f4c1c8fc0facbb80df834' }, // 128x64 광산 입구/광석길
  { name: 'ZZG_Mine2', ruid: '64c02726e2694ab3815c79747915a01c' }, // 116x64 광산 외부
  { name: 'ZZG_Cart4', ruid: '6b9c8ba4408a408cac5431c2edc7ac66' }, // 180x76 엘나스
];

const ALL = [...FX, ...DEPOT2];
const clean = process.argv.includes('--clean');

const m = MapBuilder.read(MAP);
console.log('TileMapMode =', m.getTileMapMode(), '(1 = RectTile, expected)');
for (const p of ALL) if (m.find(p.name)) m.remove(p.name);

if (clean) {
  console.log('removed all probes');
} else {
  FX.forEach((p, i) => {
    const x = -6 + i * 1.5;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, 1, 0], order: 50 });
    console.log(`placed ${p.name.padEnd(11)} at (${x}, 1)`);
  });
  DEPOT2.forEach((p, i) => {
    const x = -5 + i * 2;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, -2, 0], order: 50 });
    console.log(`placed ${p.name.padEnd(11)} at (${x}, -2)`);
  });
}

m.write(MAP);
console.log('\nentities now =', m.listEntities().length);
