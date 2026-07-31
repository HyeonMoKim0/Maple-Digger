// T-04 Phase 2 — 기존 marker 인스턴스에 렌더러와 클라이언트 컨트롤러를 붙인다.
//
// MineMarker.model 을 고쳐도 이미 배치된 인스턴스에는 소급되지 않는다. 맵 엔티티의
// componentNames 는 배치 시점에 모델을 복사한 것이고, 로드 시에는 그쪽이 기준이다
// (builder-protocol-map §1.4). placeModel 로 다시 놓으면 MarkerId 가 날아가므로
// upsertComponent 로 더한다.
const path = require('path');
const { MapBuilder } = require(path.join(
  __dirname, '..', '.claude', 'skills', 'msw-general', 'scripts', 'map', 'msw_map_builder.cjs'
));

const MAPS = ['farm01', 'deep_mine', 'gem_mine'];
const SPRITE = 'MOD.Core.SpriteRendererComponent';
const CTRL = 'script.VeinMarkerController';

// 기본값은 stage 3(condition1). 실제 스프라이트는 VeinMarkerController 가 매 revision 마다 고른다.
const DEFAULT_RUID = '0f44530d655f4e33bfbe43423450ee9f';

let touched = 0;
for (const name of MAPS) {
  const file = 'map/' + name + '.map';
  const m = MapBuilder.read(file);
  if (m.getTileMapMode() !== 1) {
    throw new Error(`${name}: TileMapMode=${m.getTileMapMode()} (RectTile=1 이어야 한다)`);
  }

  let count = 0;
  for (const e of m.listEntities()) {
    if (!m.find(e.name)) continue;
    if (m.component(e.name, 'script.VeinMarker') == null) continue;   // marker 만 대상

    m.upsertComponent(e.name, SPRITE, {
      '@type': SPRITE,
      Enable: true,
      SpriteRUID: DEFAULT_RUID,
      OrderInLayer: 1,          // 광맥은 일꾼(2 이상) 뒤에 그린다
    });
    m.upsertComponent(e.name, CTRL, { '@type': CTRL, Enable: true });
    count += 1;
  }
  m.write(file);
  console.log(`${name.padEnd(10)} marker ${count}개에 렌더러+컨트롤러 부착`);
  touched += count;
}
console.log(`\n합계 ${touched}개`);
