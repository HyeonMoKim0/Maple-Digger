// 메이플 디거 밸런스 시뮬레이터 v2 — 3개 맵 전체
// 상수는 VeinTickSimulator / EconomyService / ProgressionService 에서 그대로 옮겼다.
// 틱 순서: AdvanceTick(회복) → AdvanceWorkers(일꾼당 액션 1개)
const path = require('path');
// 루트는 스크립트 위치에서 끌어낸다 (절대 경로 하드코딩 금지 — audit_bindings 주석 참조).
const ROOT = path.resolve(__dirname, '..');
const { MapBuilder } = require(path.join(ROOT,
  '.claude', 'skills', 'msw-general', 'scripts', 'map', 'msw_map_builder.cjs'));

const TICK_SEC = 0.4, MAX_STAGE = 3, CART_CAP = 20;
// 손 용량 3 + 같은 광물 이어 캐기 (2026-08-18 오너 결정, docs/13 §5.3 개정).
const HAND_CAP = 3;
const kx = (x,y) => `${x},${y}`;

function loadMap(name) {
  const b = MapBuilder.read('map/' + name + '.map');
  const c = b.component(name, 'script.VeinTickSimulator');
  const defs = JSON.parse(c.VeinDefinitionsJson || '[]');
  // 시작 셀은 상수가 아니라 맵의 WorkerStartsJson 에서 읽는다 (docs/22 §6-7 해소 —
  // T-11 분산 배치 이후 상수가 낡아 있었다).
  const starts = JSON.parse(c.WorkerStartsJson || '[]')
    .sort((a,b) => a.workerIndex - b.workerIndex)
    .map(s => ({x:s.cellX, y:s.cellY}));
  return { name, mineId: c.MineId, depot: {x:0,y:0}, starts,
           veins: defs.map(d => ({x:d.cellX, y:d.cellY, ore:d.oreType, rt:d.recoverTicks})) };
}

function run(layout, assign, ticks) {
  // assign: 일꾼별 담당 광맥 배열
  const veins = new Map();
  for (const v of layout.veins) veins.set(kx(v.x,v.y), {stage:MAX_STAGE, elapsed:0, rt:v.rt, ore:v.ore});
  const out = {};
  const ws = assign.map((order, i) => ({pos:{...layout.starts[i]}, handCount:0, cart:0, cartOre:null,
                                        order, vi:0, sub:0, mode:'toVein'}));
  for (let t = 1; t <= ticks; t++) {
    for (const v of veins.values()) {                       // AdvanceTick
      v.elapsed += 1;
      if (v.elapsed >= v.rt) { v.elapsed = 0; if (v.stage < MAX_STAGE) v.stage += 1; }
    }
    for (const w of ws) {                                   // AdvanceWorkers
      if (!w.order.length) continue;
      const tg = w.order[w.vi];
      if (w.mode === 'toDepot') {
        if (w.pos.x !== 0 || w.pos.y !== 0) { step(w.pos, layout.depot); continue; }
        out[w.cartOre] = (out[w.cartOre] || 0) + w.cart; w.cart = 0; w.cartOre = null;
        w.mode = 'toVein'; continue;
      }
      if (w.mode === 'toVein') {
        if (w.pos.x !== tg.x || w.pos.y !== tg.y) { step(w.pos, tg); continue; }
        w.mode = 'work'; w.sub = 0;
      }
      if (w.mode === 'work') {
        if (w.cart >= CART_CAP) { w.mode = 'toDepot'; continue; }
        const v = veins.get(kx(tg.x, tg.y));
        // 이어 캐기: 손이 찰 때까지 M 반복, 그다음 L 1회가 손 전량을 옮긴다.
        if (w.handCount >= HAND_CAP || (w.handCount > 0 && v.stage < 1)) {
          const moved = Math.min(CART_CAP - w.cart, w.handCount);
          w.cart += moved; w.cartOre = v.ore; w.handCount -= moved; w.sub += moved;
          if (w.sub >= MAX_STAGE) { w.sub = 0; w.vi = (w.vi+1) % w.order.length; w.mode = 'toVein'; }
          continue;
        }
        if (v.stage >= 1) { v.stage -= 1; w.handCount += 1; continue; }
        w.sub = 0; w.vi = (w.vi+1) % w.order.length; w.mode = 'toVein';
      }
    }
  }
  const min = ticks * TICK_SEC / 60;
  const per = {}; for (const [k,v] of Object.entries(out)) per[k] = v / min;
  return per;
}
function step(p, t) { if (p.x !== t.x) p.x += Math.sign(t.x-p.x); else if (p.y !== t.y) p.y += Math.sign(t.y-p.y); }

// 배정 전략
function assignAll(layout, n) {          // P2: 전 광맥 순회 (오프셋으로 경합 완화)
  return Array.from({length:n}, (_,i) => layout.veins.map((_,k) => layout.veins[(k+i) % layout.veins.length]));
}
function assignOre(layout, n, ore) {     // 특정 광물만 담당
  const vs = layout.veins.filter(v => v.ore === ore);
  return Array.from({length:n}, (_,i) => vs.map((_,k) => vs[(k+i) % vs.length]));
}
function assignSingle(layout, n) {       // P1: 각 일꾼이 가장 가까운 광맥 1개만 왕복
  return Array.from({length:n}, (_,i) => {
    const s = layout.starts[i];
    const best = layout.veins.slice().sort((a,b) =>
      (Math.abs(a.x-s.x)+Math.abs(a.y-s.y)) - (Math.abs(b.x-s.x)+Math.abs(b.y-s.y)))[0];
    return [best];
  });
}

const maps = ['farm01','deep_mine','gem_mine'].map(loadMap);
const TICKS = 4500;   // 30분

console.log('=== 광맥 공급 상한 (일꾼 수와 무관한 물리적 천장) ===');
for (const L of maps) {
  const byOre = {};
  for (const v of L.veins) byOre[v.ore] = (byOre[v.ore]||0) + 1/v.rt;
  const s = Object.entries(byOre).map(([o,r]) => `${o} ${(r/TICK_SEC*60).toFixed(0)}/분`).join('  ');
  console.log(`  ${L.mineId.padEnd(14)} 광맥 ${String(L.veins.length).padStart(2)}개 →  ${s}`);
}

console.log('\n=== 처리량: 단일 광맥 왕복(P1) vs 전 광맥 순회(P2) ===');
for (const L of maps) {
  console.log(`\n[${L.mineId}]`);
  console.log('  일꾼   P1 왕복                      P2 순회');
  for (let n = 1; n <= 5; n++) {
    const a = run(L, assignSingle(L,n), TICKS), b = run(L, assignAll(L,n), TICKS);
    const f = o => Object.entries(o).map(([k,v]) => `${k} ${v.toFixed(0)}`).join(' ').padEnd(28);
    console.log(`   ${n}     ${f(a)} ${f(b)}`);
  }
}

console.log('\n=== 광물별 전담 배정 (깊은/보석 광산) ===');
for (const L of maps.slice(1)) {
  console.log(`\n[${L.mineId}]  일꾼 3명 기준`);
  for (const ore of [...new Set(L.veins.map(v=>v.ore))]) {
    const r = run(L, assignOre(L,3,ore), TICKS);
    console.log(`   ${ore.padEnd(6)} 전담 3명 → ${Object.entries(r).map(([k,v])=>`${k} ${v.toFixed(0)}/분`).join(' ')}`);
  }
}
