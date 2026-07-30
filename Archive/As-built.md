# 메이플 디거 — As-built 기록

> 다음 개발 세션이 기획서만 보고 이미 구현된 기능을 다시 만들지 않도록 유지하는 현재 상태 지도다. 원시 변경 이력은 Git을 사용한다.

## 확정 기준

- MVP 플레이어 수: 1인 세션
- 우선 플랫폼: PC 1920×1080
- 맵: `map/farm01.map`, `map/deep_mine.map`, `map/gem_mine.map`, 모두 RectTile(`TileMapMode=1`)
- 동적 일꾼 Body: `KinematicbodyComponent`
- 시뮬레이션 틱: 0.4초, 틱당 액션 1개

## 현재 상태

| 시스템 | 구현 | 위치 | 주의사항 |
|---|---|---|---|
| 광맥·틱·창고 기반 | 맵 `@Component` | `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua` | 0.4초 회복 후 등록 일꾼 실행. 세 광산의 JSON 레이아웃·Depot·일꾼 시작점 1~5·일반/특별 marker를 검증하며, 특별 광맥은 후보에서 생성하고 동시 활성 상한을 적용한다. |
| 일꾼 인터프리터·손·수레 | 엔티티 `@Component` | `RootDesk/MyDesk/Mine/WorkerController.mlua` | 서버 검증, 스택 인터프리터, 원자적 mine/load/unload, 일꾼별 시작 셀·수레·프로그램 |
| 일꾼 공용 모델 | `.model` | `RootDesk/MyDesk/Models/Farm/Worker.model` | modelId `worker`, RectTile용 `KinematicbodyComponent`와 `WorkerController` 포함. `Drone.model`은 레거시 원본 |
| 블록·자연어 편집기 | 클라이언트 `@Logic` | `RootDesk/MyDesk/Farm/BlockProgramController.mlua` | 활성 파일이 legacy `Farm/` 경로에 있음. 신규 프로필은 Worker01만 실행 대상이며, 구매한 Worker02~05도 독립 선택한다. |
| 블록 UI | `.ui` | `ui/BlockProgramUI.ui` | PC 우선. 반복/횟수 분리 + Worker01~05 선택 탭 |
| 광산 HUD·인벤토리 | 클라이언트 `@Logic` + `.ui` | `RootDesk/MyDesk/Mine/MineInventoryController.mlua`, `ui/MineHUD.ui`, `ui/MineInventoryUI.ui` | 서버 `@Sync` 값만 표시. Worker01 손·수레 + 세션 Depot 합계를 표시하며, 계정 광물·판매 설정·광산 선택은 별도 F7-B UI가 담당한다. |
| 계정·경제·광산 해금 | 서버 `@Component` + `@Logic` | `RootDesk/MyDesk/Account/AccountProfileService.mlua`, `AccountRecoveryController.mlua`, `EconomyService.mlua`, `ProgressionService.mlua` | 새 v7 프로필은 Gold 0에서 시작한다. 계정 광물 원장, 수량·보호·자동 판매, 깊은/보석 광산 첫 해금, 일꾼 2~5 구매·맵 재배치·소유 일꾼별 손/수레 복구, 일꾼별 수레 20→50 강화, 정상 백업 복구/포기, 만료형 동시 접속 잠금을 구현했다. 희귀 광물은 하역 즉시 컬렉션 등록·10단계 패시브·11회째부터 수동/자동 판매까지 구현했으며, 맵 강화는 미구현이다(계약은 `docs/13` §5). 프로필에 `mineLevels` 필드가 아직 없어 맵 강화 착수 시 v8 마이그레이션이 필요하다. |
| 실행 맵 | `.map` | `map/farm01.map`, `map/deep_mine.map`, `map/gem_mine.map` | 세 맵 모두 RectTile이며 Worker01만 실제 배치된다. 1~5 시작 셀은 향후 일꾼 구매 확장을 위한 데이터로 유지한다. marker와 서버 맵 전환은 구현됐고 F5 시각/사운드 표현은 미구현 |

## 기록

### 2026-07-19 — D2 완료 기준점

- 커밋 `04c1cd5`에서 D2 서버 인터프리터·블록 UI·전용 자연어 입력을 저장했다.
- Maker에서 D2 S1~S10을 검증했다.
- 후속 안정화에서 자연어 최대 30블록 제한, Run 전 클라이언트 검증, 반복 중첩 UX를 보강한다.
- D3는 1인 세션의 일꾼별 손·수레와 세션 공용 창고로 확장한다.

### 2026-07-19 — D3 완료 기준점

- 손 1칸, 수레 20칸, 세션 공용 창고와 `mine → load → unload` 상태 전이를 구현했다.
- `cart_full`·`cart_empty`가 실상태를 판정하며, IF 조건 선택 UI에도 노출했다.
- PC HUD와 인벤토리 팝업을 추가하고, 당시의 1맵·세션 Depot 프로토타입 시나리오를 Maker에서 검증했다. 이후 D3 R1~R8은 3맵·계정 저장을 포함하도록 확장되었으므로 아직 완료로 표기하지 않는다.
- D2 후속 보강(클라이언트 30블록 제한, 반복 중첩 작성, 조건 선택)도 함께 회귀 검증했다.
- 다음 개발은 D4다. 창고는 1인 세션 공용, 수레와 프로그램은 일꾼 인스턴스 소유라는 경계를 유지한다.

### 2026-07-19 — D4-A 완료 기준점

- 공용 `Worker.model`을 만들고 Worker01/Worker02를 서로 다른 시작 셀에 배치했다.
- 편집기 상단에서 일꾼을 선택하면 Run/Stop과 HUD 손·수레 대상이 함께 전환된다.
- 등록된 두 일꾼은 매 틱 각각 최대 1액션을 실행하며, 셀 겹침을 허용하고 창고만 공유한다.
- 당시의 2일꾼 배정 프로토타입과 빌드/구조를 Maker에서 검증했다. 이후 D4 W1~W8은 1→5 일꾼·영구 저장·외형을 포함하도록 확장되었으므로 아직 완료로 표기하지 않는다.
- 다음 개발은 D4-B다. 기존 대형 스프라이트는 임시 상태이며 랜덤 아바타 조합·획득 흐름으로 교체해야 한다.

### 2026-07-27 — F6 초보 광산 레이아웃 기준선

- `farm01`에 `beginner_mine`의 Depot 1개, 돌 광맥 4개, WorkerIndex 1~5 시작점, 특별 광맥 후보 3개를 명시적으로 기록했다.
- MSW Play에서 `[VeinTick] layout loaded mineId=beginner_mine veins=4 starts=5 specialCandidates=3 depot=(0,0)` 로그와 WorkerIndex 5의 시작 셀 `(-2,0)` 조회를 확인했다.
- 맵 컴포넌트의 중첩 `table` 프로퍼티는 Play에서 빈 테이블로 들어오는 동작을 확인했다. 따라서 레이아웃 목록은 `_HttpService:JSONDecode`로 읽는 JSON 문자열 프로퍼티를 정식 저장 형식으로 사용한다.
- 이 단계는 marker 연결·특별 광맥 스폰·깊은/보석 광산을 구현하지 않는다. 해당 항목은 F6의 다음 작업 단위다.

## 커밋 전 작업 경계

- 게임 기능 커밋에는 `RootDesk/MyDesk/`, `map/`, `ui/`, `docs/`, 이 기록 파일만 포함한다.
- `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.mswai/`, `AGENTS.md`, `skills-lock.json`은 개발 도구·로컬 설정 범위이므로 게임 기능 커밋과 분리한다.
- `RootDesk/MyDesk/Mine.directory`는 Maker 폴더 메타데이터의 줄바꿈 차이뿐이므로 제외한다.
- PC 1920×1080 런타임에서 명령 패널·광산 HUD·Maker 시스템 버튼이 겹치지 않음을 확인했다.
- UI lint의 모바일 터치 높이 경고 4건은 PC 우선 MVP에서는 비차단으로 두고, 모바일 대응 단계에서 88px 이상으로 확장한다.

### 2026-07-29 — F6 초보 광산 marker·특별 광맥 검증

- `farm01`의 fallback 의존을 제거하고 `DepotDefinitionsJson`·`VeinDefinitionsJson`·`WorkerStartsJson`·`SpecialVeinCandidatesJson`을 실제 맵 설정으로 기록했다.
- `MineMarker.model`과 `VeinMarker`를 추가해 Depot 1개, 일반 광맥 marker 4개, 특별 광맥 marker 3개가 각 안정 ID로 map-scoped 등록된다.
- `VeinTickSimulator`는 750틱(5분)마다 후보에서 1~2개의 특별 광맥을 생성하며, 세션당 동시 활성 수를 3개로 제한한다.
- Maker Play에서 `beginner_mine`의 광맥 4개·시작점 5개·특별 후보 3개와 marker 8개 등록을 확인했다. 서버 검증 호출로 특별 광맥 생성 수 `2 → 1 → 0` 및 최대 활성 수 제한을 확인했다.
- 이 기준선 이후 `deep_mine`/`gem_mine`과 맵 전환 기반은 다음 기록에서 구현했다. marker의 F5 시각·사운드 표현은 아직 구현하지 않았다.

### 2026-07-29 — F6 3광산 데이터·맵 전환 기반

- MapBuilder로 `deep_mine.map`(RectTile 14×8, 112셀)과 `gem_mine.map`(RectTile 20×12, 240셀)을 생성했다. 두 맵 모두 Depot 1개, WorkerIndex 1~5 시작점, 실제 `MineLayoutConfig` JSON 및 안정 marker ID를 가진다.
- 깊은 광산은 돌 3·철 4 일반 광맥과 특별 후보 4개, 보석 광산은 돌 3·철 4·금 4 일반 광맥과 특별 후보 6개를 배치했다. 정적 검사에서 각 정의의 marker 대응과 `MineId`, RectTile 모드를 확인했다.
- `MineTransitionService`는 서버에서 이전 맵의 모든 `WorkerController`를 정지하고 해당 광산의 세션 광맥/특별 광맥 상태를 다시 초기화한 뒤, `PlayerComponent:MoveToMapPosition`으로 지정 광산에 이동시킨다. 이동 대상은 `farm01`/`deep_mine`/`gem_mine`으로 제한한다.
- 전역 HUD는 더 이상 `farm01`의 고정 UUID를 보관하지 않는다. `BlockProgramController`와 `MineInventoryController`가 로컬 플레이어의 `CurrentMap`에서 선택 일꾼과 `VeinTickSimulator`를 다시 찾아, 이동 뒤에도 새 맵의 동기화 값을 사용한다.
- Maker Play에서 `farm01 → deep_mine → gem_mine` 전환을 검증했다. 당시의 두 일꾼 프로토타입은 모두 `stopped for map transition`, 소스 세션은 `session reset`, 새 맵에서는 Idle로 생성됐다. 이후 MVP 시작 규칙을 확정하면서 각 맵의 실제 활성 배치는 Worker01 한 명으로 조정했다. `gem_mine`은 `veins=11 starts=5 specialCandidates=6`로 로드되고 stone/iron/gold oreType도 확인했다.
- 맵 선택 UI와 해금 비용 판정은 계정 진행(F7-B) 책임으로 남아 있으며, F5 marker 시각·사운드 표현도 미구현이다. Maker Build 콘솔에는 과거 `Worker.model`의 3개 경고가 남아 있지만 새 빌드 오류는 없었다.

### 2026-07-29 F7-B 경제·광산 해금·선택 UI

- `AccountProfileService`의 저장 스키마는 현재 v4다. 골드, MineToken, 돌·철·금광석 보유량, `deep_mine`/`gem_mine` 해금, 광물별 자동 판매와 보호 수량을 서버 원장으로 보관하고 화면에는 `@Sync` 읽기 전용 값만 전달한다. 기존 v1 `credits` 값은 골드로 마이그레이션한다.
- `EconomyService`는 일꾼의 Depot 적재를 계정 광물로 기록하고, 다음 미해금 광산의 필요 광물과 플레이어 설정 보호 수량 중 큰 값을 남긴다. 수동 판매는 1/10/100/전량과 임의 수량을 서버에서 검증하며, 보호분 포함은 별도 명시가 있어야 한다. 광물별 자동 판매는 실제 광산 적립 직후 초과분만 판매한다. 토큰은 깊은 광산 전에는 돌 20개당, 보석 광산 전에는 철 20개당 1개로 계산한다.
- `ProgressionService`는 깊은 광산(180 골드·토큰 6·돌 120), 보석 광산(700 골드·토큰 10·돌 200·철 60)의 첫 해금 비용을 저장 성공 뒤에만 `MineTransitionService`로 넘긴다. 재입장에는 비용이 없다.
- UIBuilder로 `ui/MineSelectUI.ui`와 `MineSelectController`를 추가했다. 패널은 광산 선택, 광물 선택·수량·보호분 포함 판매, 보호 수량과 자동 판매 설정, 비용·해금 상태, 거래 피드백을 표시하며 모든 버튼은 `AccountProfileService` 서버 요청만 호출한다. UIBuilder lint 경고는 별도 시각 검토 대상으로 남아 있고, 바인딩·초기화는 Play에서 확인했다.
- Maker Play 검증: Depot 적재가 계정 돌 1개로 반영됐고, 보호 판매는 `stone=120 → gold=120/token=6`, 이어서 `stone=60 → gold=60/token=3`으로 확인했다. 깊은/보석 광산 첫 해금과 맵 전환도 검증했다. 당시 `gold=1000`은 해금 경로 검증을 위한 테스트 주입값이며, 신규 프로필 기본값은 Gold 0이다. UI 패널과 열기·판매 바인딩도 Maker client에서 확인했다.
- 추가 Maker Play 검증: v3→v4 마이그레이션 후 Gold 0을 확인했다. 돌 50개·보호 12개에서 보호 해제 없는 40개 판매는 거절되고 38개 판매만 반영돼 돌 12개·Gold 38이 남았다. 철 자동 판매/보호 7개 설정으로 실제 광산 적립 20개를 처리하면 철 7개가 남고 13개가 판매되어 Gold 65가 반영됐다. Play 재시작 뒤 설정(`auto=true`, `protect=7`)이 보존됨을 확인했고, 검증 후 개발 프로필을 v4 기본 상태(Gold 0, Worker01 1명, 자동판매 해제)로 되돌려 저장했다.

### 2026-07-29 — F7-B v5 일꾼 구매·다중 복구

- `AccountProfileService`의 worker record를 Worker01 전용에서 연속된 Worker01~Worker05 레코드로 확장했다. 신규 계정은 여전히 Worker01 한 명만 만들며, 각 레코드는 수레 용량·수레 스택·손·마지막 프로그램 참조만 영구 보관한다.
- `ProgressionService`가 서버에서 일꾼 구매 비용과 진행 조건을 검증한다. 일꾼 2는 Gold 60, 일꾼 3은 깊은 광산 해금 + Gold 200/돌 80, 일꾼 4는 보석 광산 해금 + Gold 650/돌 160/철 50, 일꾼 5는 Gold 1,600/돌 300/철 120/금광석 30이다.
- Worker02~05는 공용 `worker` 모델을 서버에서 동적 생성하고, 각 광산 `WorkerStartsJson`의 WorkerIndex별 시작 셀로 재설정한다. 광산 이동·재접속 때는 소유한 모든 일꾼을 다시 생성하고 수레/손만 복구하며 실행 프레임은 Idle로 초기화한다.
- `MineSelectUI`에는 보유 수·다음 비용·일꾼 고용 버튼을, `BlockProgramUI`에는 Worker01~05 독립 프로그램 대상 탭을 UIBuilder로 연결했다. 기존 텍스트 `Font` 문자열은 UIBuilder가 요구하는 정수형으로 정규화했다. UI lint의 PC 비차단 모바일 터치 크기 경고는 남아 있다.
- Maker Play 검증: 재화 부족 시 Worker02 구매 거절, Gold 60 지급 후 구매 성공과 `Worker02`의 초보 광산 시작 셀 `(0,1)` 배치를 확인했다. 클라이언트에서 Worker02 선택·해결을 확인했고, Worker02 수레의 철 2개는 `farm01 → deep_mine` 전환과 Play 재시작 뒤에도 보존됐다. 검증 뒤 v5 기본 프로필(Worker01 1명, Gold 0, `farm01`)로 복원했다.

### 2026-07-29 — F7-B v6 일꾼별 수레 강화

- worker record에 `cartUpgradeLevel`(0~15)과 파생 `cartCapacity`(20~50)를 저장한다. v5 기록은 기존 수레 용량에서 레벨을 마이그레이션한다.
- `ProgressionService`는 현재 광산의 대표 광물(초급 돌, 깊은 철, 보석 금광석)과 `Gold 20 × 1.25^(다음 레벨-1)`의 반올림값, 대표 광물 `5 × 다음 레벨` 비용을 서버에서 계산한다. 저장 성공 뒤에만 비용 차감·용량 증가·실행 중인 일꾼의 수레 용량을 갱신한다.
- `MineSelectUI`의 수레 강화 패널은 보유 일꾼별 20→50칸 현황, 현재 광산 기준 다음 비용, 강화 요청을 표시한다. 패널의 버튼·표시는 UIBuilder로 작성했다.
- Maker Play 검증: 재화 부족 시 차감 없이 거절, Gold 20/돌 5로 Worker01 `20→22` 강화, `farm01 → deep_mine` 전환과 Play 재시작 뒤 22칸 복구, 50칸 최대치 거절을 확인했다. 종료 저장이 런타임 용량만 기록해 강화 레벨과 어긋날 수 있던 문제를 발견해, 종료·전환 캡처 때 용량과 레벨을 함께 동기화하도록 수정했다. 검증 뒤 v6 기본 프로필(Worker01 1명, Gold 0, `farm01`, 수레 20)로 복원했다.

### 2026-07-29 — F7-B v7 희귀 광물 컬렉션·판매

- 희귀 돌·철·금은 Depot 하역 시 일반 계정 광물 원장 대신 `rareCollection`에 즉시 등록한다. 종류별 처음 10개는 컬렉션 단계로만 반영되고, 11개째부터 `rareStorage`에 보관한다.
- 컬렉션 패시브는 희귀 돌 수레 용량, 희귀 철 광맥 회복 속도, 희귀 금 일반 광물 판매 골드에 단계당 +3%를 적용한다. 희귀 확률은 맵 강화 책임으로 남긴다.
- 희귀 판매는 서버에서 컬렉션 10단계와 보관 수량을 모두 검증한다. 10단계 전에는 수동 판매와 자동 판매 설정을 모두 거부하고, 이후 희귀 돌 50 Gold·희귀 철 200 Gold·희귀 금 600 Gold로 처리한다.
- `MineSelectUI`에는 일반 판매 패널에서 여는 별도 희귀 판매 팝업을 UIBuilder로 연결했다. 팝업은 희귀 종류별 수동 판매와 자동 판매 토글, 잠금·보관·설정 상태를 표시한다. Maker Play에서 v6→v7 마이그레이션과 UI Logic 초기화를 확인했으며, 서버 주입 테스트로 잠금 거부(`false`)와 희귀 돌 2개 자동 판매(`+100 Gold`)를 검증한 뒤 개발 프로필을 원복했다. 실제 화면 배치의 시각 검수와 전체 직접 조작 회귀는 `docs/16-사용자-검수-체크리스트.md`에서 관리한다.

### 2026-07-29 — 현황 정합화·단일 시작 일꾼

- D7의 고정 규칙(시작 일꾼 1명, 최대 5명)에 맞춰 `farm01`·`deep_mine`·`gem_mine`의 Worker02 배치를 제거하고 Worker01만 활성화했다. WorkerIndex 2~5 시작 셀은 F7-B의 일꾼 구매 구현을 위한 맵 데이터로 남긴다.
- 블록 편집기와 HUD도 Worker01 단일 선택으로 조정했다. 두 번째 일꾼 선택 UI와 클라이언트 경로는 제거했다.
- `Worker.model`을 ModelBuilder로 재검증한 결과 WorkerIndex/StartCellX/StartCellY 값은 존재하지 않아, Build Console의 LWA 4012 세 건은 이전 모델 상태에서 남은 진단임을 확인했다. `_EconomyService`/`_ProgressionService` LIA 정보도 이전 정적 분석 항목이며, 실제 Maker Play에서 두 전역 서비스와 계정 적립·해금 경로가 실행됐다.

### 2026-07-29 — F7-A v3 프로필·Worker01 복구 기반

- `AccountProfileService` 스키마를 v3로 올리고, v2 프로필을 새 기본 worker record로 변환해 즉시 저장한다. 신규 프로필은 Worker01 1명, 수레 20, 빈 손/수레, `farm01`을 기본값으로 가진다.
- Worker01의 `Cart`·`CartCount`·`CartCapacity`·`PendingOre`와 `lastMineId`만 저장한다. 광맥 stage, 특별 광맥, 현재 셀, 프로그램 실행 frame은 세션 전용으로 저장하지 않는다.
- `MineTransitionService`는 이동 전에 profile 저장을 완료해야만 일꾼 정지·세션 초기화·맵 이동을 수행한다. 이동 뒤와 재접속 뒤에는 Worker01 상태를 복구한다.
- Maker Play 검증: v2→v3 변환, 수레 `stone=2/iron=1`과 손 `gold`를 가진 상태의 `farm01 → deep_mine` 전환, Play 재시작 뒤 `deep_mine` 자동 복귀와 `cart=3/20 hand=gold` 복구를 확인했다. 검증 후 개발 프로필은 `farm01`, 빈 수레·빈 손으로 되돌렸다.

### 2026-07-29 — 2차 검수와 맵 강화 계약 정합화

- `6a4ab91`에서 F7-B v7 희귀 광물까지 커밋됐다. 인수인계 문서의 "미커밋 작업 트리" 전제는 해소했다.
- 서버 거래 테스트로 희귀 광물 규칙 전량을 검증했다. 10단계 전 자동 판매 거부, 1개씩 11회 하역(`coll=1..10` → 11회째 `store=1`), 배치 10+1 경로, 희귀 돌 10단계에서 수레 20→26, 희귀 금 10단계에서 돌 100개 판매 `goldGain=130`·`tokenGain=5`, 희귀 돌/철/금 수동 판매 50/200/600 Gold, 보관 0에서의 추가 판매 거부, 10단계 뒤 자동 판매 허용을 확인했다. 검증 뒤 개발 프로필을 기준 상태(Gold 0, 컬렉션·보관 0, 수레 20, Worker01 1명, `farm01`)로 원복하고 저장까지 확인했다.
- 수레 용량 보너스는 `floor(기본 × 단계 × 3 / 100)`의 **버림** 방식이라 단계마다 +1칸씩 오르지 않는다. 관측값 20, 21, 21, 22, 23, 23, 24, 24, 25, 26. UI는 이 비선형성을 그대로 보여야 한다.
- Play 화면 검수에서 결함 2건을 확인했다. `광산 선택` 버튼이 블록 편집기 헤더를 가리고, HUD `광산 현황`에 골드·크리스탈·토큰이 없다(D3 §7·D5 §4 필수 표시 위반). 상세는 `docs/16` §7.3.
- `mouse_input`이 엔진 관리 UI(`ButtonComponent`)를 클릭하지 못함을 실측으로 확인했다. 버튼 회귀 검수는 자동화 불가로 확정하고 `docs/16` §9에 근거를 남겼다.
- 맵 강화(F7-B 잔여 범위)의 구현 계약을 `docs/13` §5에 작성했다. 저장 스키마 v8, 효과 4종의 계산식, 희귀 확률의 만분율 승격, 서버 API, 수용 테스트 B8~B18을 포함한다. **구현은 아직 시작하지 않았다.**
- 카드 근거가 없던 세부 4건은 사용자 결정으로 `docs/11` **C197~C200**에 확정했다.
  - C197: 맵 레벨을 **0~10**으로 정정(해금 직후 0, 총 10회 강화, 만렙 주 효과 +30% / 부 +10%). `cartUpgradeLevel` 0~15와 같은 0-based 관례다. D7·D0·D1의 "1~10" 표기를 모두 갱신했다.
  - C198: 맵 회복 효과와 희귀 철 패시브는 **가산 합성**.
  - C199: `yield` 효과는 **확률로 손에 1개 추가 지급**. 이에 따라 D3 §4의 손 1칸 계약을 조건부 2칸으로 확장하고, 희귀로 승격된 채굴은 추가 지급에서 제외했다(C196 보호). v8에 손 개수 필드가 필요하다.
  - C200: 특별 광맥 스폰 대기 하한 60틱 유지.
- **이 세션은 문서만 바꿨다.** `RootDesk/`, `map/`, `ui/` 아래 게임 파일은 한 줄도 수정하지 않았으므로 런타임 동작은 `6a4ab91`과 동일하다.
- 다음 작업과 열린 질문은 `docs/17-Claude-인수인계.md` **§0 이어가기 지점**에 있다. 1순위는 F5에 HUD 표시 계약을 작성한 뒤 `docs/16` §7.3의 D-1·D-2를 수정하는 것이다.

### 2026-07-30 — D-10·D-11 수정 (판매가 아예 되지 않던 원인)

- **D-11 (근본 원인)**: `MineSelectController`의 속성 3개가 실제 컴포넌트 타입과 달라 런타임에 **nil**이었다. `saleAmountInput`·`protectedAmountInput`을 레거시 `TextInputComponent`로 선언했지만 엔티티는 `TextGUIRendererInputComponent`를 갖고 있고, `workerStatusText`는 `TextGUIRendererComponent`로 선언했지만 엔티티는 레거시 `TextComponent`다. 빠른 버튼이 `saleAmountInput.Text`에 값을 써도 참조가 nil이라 아무 일도 일어나지 않아, 수량이 영원히 0이고 판매가 100% 실패했다. 세 선언을 실제 타입에 맞췄다.
- **교훈**: `property <Type> x = "<uuid>"`는 `entity:GetComponent(Type)`로 해석되므로 **타입이 틀리면 오류 없이 nil**이 되고, `if x ~= nil` 가드와 만나면 기능이 조용히 사라진다. 빌드 로그에도 남지 않는다. 바인딩 전에 `.ui` 엔티티의 `componentNames`를 확인할 것.
- **D-10**: 서버 거부 사유(`LastTransactionMessage`)를 그리는 `FeedbackText`가 `SelectPanel`에 있어서, D-8에서 판매 패널을 열 때 `SelectPanel`을 끄게 한 뒤로 메시지가 화면에서 사라졌다(D-8이 만든 회귀). 또 요약이 `설정 보호 0`만 보여 줬는데 서버가 쓰는 값은 `max(설정, 해금 필요량)` = 120이라 왜 막히는지 알 수 없었다.
- 수정: `AccountProfileService`에 `StoneEffectiveProtection` 등 `@Sync` 3개를 추가해 유효 보호 수량을 내려보내고(런타임 전용, 저장 대상 아님), 요약을 `보유 5 | 보호 120 (설정 0)` / `지금 팔 수 있는 수량 0` 형태로 바꾸고, **판매 패널 전용 피드백 줄**을 신설해 서버 메시지·로컬 힌트·"`보호분 포함 전환`을 먼저 누르라"는 안내를 표시한다. 한 번 설정되면 남아 이후 메시지를 덮던 `localSaleHint`도 초기화 지점을 추가했다.
- **검증**: 바인딩 3개 정상 해석, 빠른 버튼 `10` 반영(`sell request amount=10`), 보유 초과 시 `보유 수량보다 많이 판매할 수 없습니다.` 표시, **보호분 포함 + 수량 1 판매 성공**(`수동 판매 완료: 골드 +1`, 요약 `보유 4`, HUD `창고 돌 4` · `골드 2`). 빌드 오류 0건. 개발 프로필은 `gold=0 stone=1 workers=1`로 원복.
- **채굴·적재·하역**도 프로그램 실행으로 검증했다. 초보 광산은 Depot `(0,0)`, 시작 `(0,0)`, 돌 광맥 `(1,0) (2,0) (2,-1) (3,-1)`이며 `E → M → L → W → U` 5블록이 `mined → hand → cart=1/20 → credited ore=stone count=1 → unload depotStone=1 → program finished → recovered stage=3`까지 정상 동작한다. "확인이 어렵다"는 체감 문제는 F5 연출 미구현 때문이며, 그때까지는 HUD의 손/수레/창고 숫자가 유일한 확인 수단이다.

### 2026-07-30 — D-8·D-9 수정 (중앙 모달 배타·패널 내부 겹침)

사용자 1차 검수에서 "판매 화면 조작을 알 수 없다"는 보고가 들어와 원인을 찾은 결과, UX 문제가 아니라 결함 2건이었다.

- **D-8**: `MineSelectController`의 `OnSellClicked` / `OnRareOpenClicked` / `OnCartOpenClicked`가 `selectPanel`을 끄지 않아 중앙 모달 2개가 동시에 켜졌다. `SalePanel` 배경 알파가 0.235(형제는 0.96)이고 stretch 자식 `Bg`가 `RectSize 100×100`을 들고 있어 배경을 덮지 못해 뒤의 편집기·월드까지 비쳤다. 세 열기 핸들러가 다른 중앙 모달을 모두 끄게 하고, 닫기 핸들러는 진입점(`selectPanel`)으로 복귀하게 했다. `SalePanel` 알파는 0.96으로 올리고 `Bg`를 stretch에 맞게 정정했다.
- **D-9**: `ui_lint` `L023` 7건이 실제 화면 겹침이었다(`docs/16` §7.3이 "28건"으로 뭉쳐 놓았던 것의 실체). `SalePanel`의 `Title` × `BtnToggleAutoSell`(360×40)이 제목이 안 보이던 원인이고, `SaleSummary` × 보호 수량 입력·저장 버튼(각 240×50 / 200×50)이 요약이 깨져 보이던 원인이다. `SelectPanel`은 `GemText`·`BtnGem`이 `BtnBuyWorker`/`BtnCartOpen`/`WorkerStatus`와 겹쳤다.
- **D-9의 근본 원인은 한 패널 안에서 `AlignmentOption=0`(중앙 기준)과 `=3`(상단 기준)을 혼용한 것**이다. 같은 행에 두려던 요소가 중앙 기준으로 계산돼 패널 아래로 밀렸다 — `SelectPanel/BtnCartOpen`은 의도한 상단 282px가 아니라 747px에 놓여 하단 광산 버튼과 겹쳤다. 두 패널의 해당 자식을 **`top-center` + pivot `(0.5,1)` 한 가지 모드로 통일**하고 "패널 상단에서 y px" 단일 좌표계로 재배치했다. `SalePanel`은 판매 흐름 순서(제목 → 요약 → 광물 선택 → 수량 → 빠른 버튼 → 판매 실행 → 자동 판매 설정 → 희귀 판매)로 다시 깔았다.
- **검증**: 자식 쌍별 겹침 `SalePanel` 17개·`SelectPanel` 14개에서 0건, 패널 밖 이탈 0건. `ui_lint` 28 → 20건이며 `L023`은 전량 해소(남은 20건은 모두 `L007` 모바일 터치 크기). 빌드 오류 0건. Play에서 판매 패널을 스크립트로 열어 제목·요약·광물 선택·수량·판매 실행·자동 판매·희귀 판매가 겹침 없이 위에서 아래로 읽히는 것을 스크린샷으로 확인했다.
- 같은 화면에서 `창고 돌 1`이 HUD와 판매 요약(`보유 1`)에 동일하게 표시돼, F5-8의 표시 경로가 실제로 동작함이 함께 확인됐다.
- 교훈: **한 패널 안에서 앵커 모드를 혼용하면 겹침이 생긴다.** 패널 내부는 한 가지 앵커(top-center 권장) + 단일 좌표계로 통일한다.

### 2026-07-30 — D-1·D-3 수정과 화면 결함 전량 런타임 검증

- 편집기 패널을 760×960 → **640×960**으로 줄였다(C201 상한 = 화면 1/3). 좌우 여백 24를 유지해 콘텐츠 폭 712 → 592로 바꾸고, 자식 27개의 x·width를 4열 136 / 3열 186·186·188 / 전폭 592 그리드로 재계산했다. y 그리드는 그대로다.
- `BtnToggle`(`패널 접기` / `패널 펼치기`)을 **패널의 형제**로 신설했다. 패널의 `Enable`을 껐을 때도 버튼이 살아 있어야 하기 때문이다. `BlockProgramController`에 `btnToggle` / `toggleButtonText` / `programPanel` property와 `OnToggleClicked` / `RefreshToggleLabel`을 추가했다. 토글은 클라이언트 표시 상태만 바꾸며 서버 측 프로그램 실행에 영향이 없다.
- 광산 선택 열기 버튼을 좌측 상단에서 **우측 HUD 아래**로 옮겼다(top-right 앵커 + pivot `(1,1)`). pivot을 명시하지 않으면 `patch()`가 기존 `(0,1)`을 보존해 우상단 예약 영역으로 밀려나므로 반드시 함께 지정한다.
- 8개 화면의 `GroupOrder`를 F5 §6.2 목표값으로 교정했다: `DefaultGroup 0` / `BlockProgramUI 1` / `MineHUD 2` / `MineInventoryUI 5` / `MineSelectUI 7` / `PopupGroup 10` / `ToastGroup 20` / `AccountRecoveryUI 50`. 이전에는 생성 순서(0~7)여서 토스트와 세션 차단 오버레이가 모달보다 아래였다.
- 폭이 줄어 제목 `광산 명령 블록`(FontSize 38)이 2줄로 깨졌다. `BestFit`(Min 20 / Max 38)로 전환해 한 줄로 복원했다.
- **좌표 검증**: 상시 4개 요소가 편집기 `x -680..-40`, 토글 `x -680..-490 / y 450..538`, HUD `x 240..700 / y 86..516`, 열기 버튼 `x 510..700 / y -14..74`로 **6개 쌍 전부 겹침 0**, PC 예약 영역 침범 0. 자식 최대 right edge 616 ≤ 640.
- **Maker 런타임 검증 PASS**: Build Console 16건 전부 `Info`(baseline 동일, 새 항목 없음). Play 로그에서 `[MineInventoryUI] fields mine=초보 광산 lv=0 storage=0/0/0 gold=0 crystal=0 token=0 worker=1 cart=0/20 states=1 Idle` 확인. `maker_execute_script`로 `_BlockProgramController:OnToggleClicked()`를 호출해 `panel collapsed=true → false` 양방향 로그와 접힌 화면(월드 전체 노출)을 스크린샷으로 확인. 편집기 제목 가림도 해소됐다. 런타임 오류 0건.
- `mouse_input`이 `ButtonComponent`를 클릭하지 못하는 한계는 그대로여서, 토글 버튼 실클릭·하역/판매 반영·일꾼 2명 이상 전환·640px 패널의 27개 버튼 회귀는 사용자 직접 검수로 남는다(`docs/16` §12.2).
- 남은 화면 결함은 **D-7**(인벤토리 팝업의 F5 §5.2 I2~I5) 1건이다.

### 2026-07-30 — D-2·D-4·D-5 수정 (HUD 필수 필드·창고 출처·선택 일꾼)

- `ui/MineHUD.ui`를 UIBuilder로 수정해 F5 §5.1의 H1~H10 10개 필드를 모두 갖췄다. 신설 필드는 `MineText`(광산명 + 강화 레벨), `StorageText`(계정 창고 3종), `CurrencyText`(골드·크리스탈·토큰), `WorkerStateText`(소유 일꾼별 실행 상태)다. 패널은 420×190 → 460×430, 미바인딩 placeholder였던 `Panel/OreIcon`은 제거했다(아이콘은 F5 연출 단위에서 일괄 적용).
- `MineInventoryController.mlua`의 창고 표시 출처를 세션 Depot 합계에서 **계정 원장**(`AccountProfileService.Stone/Iron/GoldOre`)으로 바꿨다(D-4). 세션 합계는 `이번 세션 하역` 라벨의 별도 행으로 남겼다.
- 선택 일꾼 인덱스를 상수 `1`에서 `_BlockProgramController:GetSelectedWorkerIndex()` 위임으로 바꿨다(D-5). 일꾼별 상태 요약은 `Worker0N` 자식 조회로 소유 수만큼 만들고, `OnUpdate` 비용 때문에 refresh당 1회만 계산한다.
- 맵 강화 레벨·크리스탈은 v7 프로필에 필드가 없어 상수 표시(`Lv.0 / 10`, `크리스탈 0`)다. v8 마이그레이션에서 `@Sync` 연결로 교체한다.
- `ui_lint` clean(ERROR/WARN 0), 바인딩 8건 주입 성공, 자식 9개가 패널 430 안에 겹침 없이 배치됨을 확인했다. `patch()`가 기존 `Pivot`을 보존해 `BtnInventory`가 184px 튀어나가는 `L014`가 발생했고 pivot `(0,1)` 명시로 교정했다.
- **Maker 런타임 검증은 하지 못했다.** 작업 세션에 Maker MCP가 연결되지 않아 `refresh`/build log/`play`/runtime log를 얻을 수 없었다. 사용자 검증 절차는 `docs/16` §11.2에 있다.
- `docs/08` §6.2의 계층 규칙을 `displayOrder` → **`UIGroupComponent.GroupOrder`** 로 정정했다. `displayOrder`는 같은 부모의 형제 순서일 뿐 `.ui` 파일 간 앞뒤를 바꾸지 못한다. 실측 결과 현재 `GroupOrder`는 생성 순서대로 0~7이라 **토스트(3)와 복구 오버레이(6)가 모달(7)보다 아래**이고 인벤토리 팝업(4)이 HUD(5)보다 아래다. 교정은 D-1·D-3과 같은 단위로 남겼다.
- 새 미구현 항목 **D-7**(인벤토리 팝업의 희귀 컬렉션 필드 I2~I5)을 `docs/16` §11.1에 기록했다.

### 2026-07-30 — HUD 표시 계약·화면 영역 분할 규칙 신설

- **이 세션도 문서만 바꿨다.** `RootDesk/`, `map/`, `ui/` 아래 게임 파일은 한 줄도 수정하지 않았으므로 런타임 동작은 `6a4ab91`과 동일하다.
- `docs/` 18개 전체와 `ui/` 8개 파일(UIBuilder `listEntities`)을 대조해 기획-구현 차이를 목록화했다.
- 열린 질문 2건을 사용자 결정으로 확정했다. D8 **C201**(편집기 패널 최대 폭 640px = 화면 1/3, 토글 제공), **C202**(현 `MineSelectUI` 구조를 정식 정보구조로 확정. 맵 강화는 `MineSelectUI`의 모달 패널로, 외형·도감·가챠·제작은 별도 `.ui` 파일로. C79의 4탭 구상은 초기 구상으로 격하).
- `docs/08`(F5)에 **§5 HUD 표시 계약**과 **§6 화면 영역 분할 규칙**을 신설했다. `MineHUD` 필수 필드 H1~H10, `MineInventoryUI` I1~I6, 각 필드의 `@Sync` 출처와 갱신 시점, 미구현 필드(맵 레벨·크리스탈)의 상수 표시 규칙, `displayOrder` 6계층, 편집기 토글 규칙, 수용 테스트 F5-7~F5-14를 포함한다. 기존 수용 테스트 절은 §5 → §7로 번호만 이동했다.
- 코드 대조로 **기록되지 않았던 계약 위반 2건과 미구현 1건**을 찾아 `docs/16` §10에 남겼다.
  - **D-4**: `MineInventoryController.RefreshUI`가 창고 표시에 `VeinTickSimulator.DepotStone/DepotIron/DepotGold`(세션 하역 합계)를 쓴다. D3 §7이 요구한 값은 계정 원장 `AccountProfileService.Stone/Iron/GoldOre`다. 재접속 시 0으로 보인다.
  - **D-5**: `MineInventoryController.GetSelectedWorkerIndex()`가 상수 `1`을 반환해 편집기 선택을 따르지 않는다.
  - **D-6**: `Crystal` 심볼이 `RootDesk/MyDesk` 전체에 0건이다. D7 §3.1이 저장 대상 화폐로 규정했으므로 v8 마이그레이션에 `currencies.Crystal`을 추가해야 한다. D-2를 표시 추가만으로 해결할 수 없다.
- `MineInventoryUI`는 엔티티 이름이 `StoneRow/StoneText`지만 실제로 돌·철·금 3종을 한 줄에 렌더한다. 행 누락이 아니라 D-4와 같은 출처 문제다.
- 화면 판정을 **실패 5건(D-1~D-5)** 으로 갱신했다. D-3은 C201 확정으로 보류에서 실패로 승격했다.
- 다음 작업은 `docs/17` §0.2의 1순위, F5 §5/§6 계약대로 D-1~D-5를 수정하는 것이다. 권장 순서는 D-2+D-4+D-5 → D-1+D-3이다.

### 2026-07-29 — F7-A 손상 복구·동시 접속 잠금

- `AccountProfileService`가 `UserDataStorage`의 primary/backup을 거래 단위로 저장한다. 손상된 primary JSON은 안전하게 판별해 정상 backup의 복구 또는 새 기본 계정 시작을 선택하게 하며, 포기 전 backup은 recovery archive 키에 보관한다.
- `ui/AccountRecoveryUI.ui`와 `AccountRecoveryController`는 복구 가능 여부와 세션 차단 원인을 표시하고, 버튼은 서버 `RequestRecoveryRestore`/`RequestRecoveryAbandon`만 요청한다.
- 계정 잠금은 사용자별 storage key의 90초 lease와 30초 compare-and-set 갱신으로 유지한다. 신규 잠금 키의 `GetAndWait` 결과가 `error=0, value=nil`인 MSW 동작을 누락 키로 분리 처리했다.
- Maker Play 검증: 신규 잠금 획득과 Gold 0 저장, 외부 토큰으로 갱신을 실패시켜 쓰기 차단, 손상 primary의 backup 복구, 손상 후보 포기 후 Gold 0 새 계정 및 recovery archive 보존을 확인했다. 복구 패널은 런타임에 바인딩·초기화됐고, 자동 입력 좌표로 직접 클릭하는 시각 검증은 MCP screenshot 경로 권한 때문에 보류했다.
