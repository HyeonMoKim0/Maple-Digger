// TEMPORARY probe for T-04 (docs/21 §7): Depot 오브젝트 · 선택 일꾼 링 후보 육안 확인.
// 이름이 sprite-NNNN 뿐이라 검색 메타데이터만으로는 판정할 수 없어 엔진에 실제 배치한다.
//   node .builder-work/place_fx_asset_probe.cjs           # 배치 (native scale)
//   node .builder-work/place_fx_asset_probe.cjs --clean   # 제거
const path = require('path');
const { MapBuilder } = require(path.join(
  __dirname, '..', '.claude', 'skills', 'msw-general', 'scripts', 'map', 'msw_map_builder.cjs'
));

const MAP = 'map/farm01.map';

// y=-2 행: Depot 후보 (category=object)
const DEPOT = [
  { name: 'ZZFx_Depot1', ruid: '28e71870bde849679ad423daeb8a06a7' }, // 168x84
  { name: 'ZZFx_Depot2', ruid: 'a1899b99ce5c4bbf80265a2b55977b27' }, // 120x124
  { name: 'ZZFx_Depot3', ruid: '47da236ac27d480a8c1a079bda847e6e' }, // 140x104
  { name: 'ZZFx_Depot4', ruid: '9ae1efe54bd54f33ac437082312b1d69' }, // 184x92
  { name: 'ZZFx_Depot5', ruid: '117f84f4b54242fead8e08d4b5b363d3' }, // 180x76
  { name: 'ZZFx_Depot6', ruid: 'fc7484514f9442d79a52a1569a119017' }, // 116x56
];

// y=-4 행: 선택 링 후보 (category=etc)
const RING = [
  { name: 'ZZFx_Ring1', ruid: '36a42bce7fe8473a8effbc7e7aadf434' }, //  44x44
  { name: 'ZZFx_Ring2', ruid: 'ea61dc5ba8ce4ddd8287cba1d9566121' }, // 120x120
  { name: 'ZZFx_Ring3', ruid: 'a35eb272134742f2b77d8199e3bdfde1' }, // 120x60
  { name: 'ZZFx_Ring4', ruid: '76e2d942cc264558aad35f78be17b109' }, // 116x40
];

const ALL = [...DEPOT, ...RING];
const clean = process.argv.includes('--clean');
const ringOnly = process.argv.includes('--ring');   // 링만 y=-2 행에 올려 확인

const m = MapBuilder.read(MAP);
console.log('TileMapMode =', m.getTileMapMode(), '(1 = RectTile, expected)');

for (const p of ALL) if (m.find(p.name)) m.remove(p.name);

if (clean) {
  console.log('removed all probes');
} else if (ringOnly) {
  RING.forEach((p, i) => {
    const x = -3 + i * 2;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, -2, 0], order: 50 });
    console.log(`placed ${p.name.padEnd(13)} at (${x}, -2)`);
  });
} else {
  DEPOT.forEach((p, i) => {
    const x = -5 + i * 2;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, -2, 0], order: 50 });
    console.log(`placed ${p.name.padEnd(13)} at (${x}, -2)`);
  });
  RING.forEach((p, i) => {
    const x = -3 + i * 2;
    m.sprite(p.name, { ruid: p.ruid, pos: [x, -4, 0], order: 50 });
    console.log(`placed ${p.name.padEnd(13)} at (${x}, -4)`);
  });
}

m.write(MAP);
console.log('\nentities now =', m.listEntities().length);
