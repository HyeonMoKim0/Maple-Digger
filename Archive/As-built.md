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
| 계정·경제·광산 해금 | 서버 `@Component` + `@Logic` | `RootDesk/MyDesk/Account/AccountProfileService.mlua`, `AccountRecoveryController.mlua`, `EconomyService.mlua`, `ProgressionService.mlua` | 새 v6 프로필은 Gold 0에서 시작한다. 계정 광물 원장, 수량·보호·자동 판매, 깊은/보석 광산 첫 해금, 일꾼 2~5 구매·맵 재배치·소유 일꾼별 손/수레 복구, 일꾼별 수레 20→50 강화, 정상 백업 복구/포기, 만료형 동시 접속 잠금을 구현했다. 희귀 광물 판매·맵 강화는 미구현 |
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
- `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `AGENTS.md`, `skills-lock.json`은 개발 도구·로컬 설정 범위이므로 게임 기능 커밋과 분리한다.
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

### 2026-07-29 — 현황 정합화·단일 시작 일꾼

- D7의 고정 규칙(시작 일꾼 1명, 최대 5명)에 맞춰 `farm01`·`deep_mine`·`gem_mine`의 Worker02 배치를 제거하고 Worker01만 활성화했다. WorkerIndex 2~5 시작 셀은 F7-B의 일꾼 구매 구현을 위한 맵 데이터로 남긴다.
- 블록 편집기와 HUD도 Worker01 단일 선택으로 조정했다. 두 번째 일꾼 선택 UI와 클라이언트 경로는 제거했다.
- `Worker.model`을 ModelBuilder로 재검증한 결과 WorkerIndex/StartCellX/StartCellY 값은 존재하지 않아, Build Console의 LWA 4012 세 건은 이전 모델 상태에서 남은 진단임을 확인했다. `_EconomyService`/`_ProgressionService` LIA 정보도 이전 정적 분석 항목이며, 실제 Maker Play에서 두 전역 서비스와 계정 적립·해금 경로가 실행됐다.

### 2026-07-29 — F7-A v3 프로필·Worker01 복구 기반

- `AccountProfileService` 스키마를 v3로 올리고, v2 프로필을 새 기본 worker record로 변환해 즉시 저장한다. 신규 프로필은 Worker01 1명, 수레 20, 빈 손/수레, `farm01`을 기본값으로 가진다.
- Worker01의 `Cart`·`CartCount`·`CartCapacity`·`PendingOre`와 `lastMineId`만 저장한다. 광맥 stage, 특별 광맥, 현재 셀, 프로그램 실행 frame은 세션 전용으로 저장하지 않는다.
- `MineTransitionService`는 이동 전에 profile 저장을 완료해야만 일꾼 정지·세션 초기화·맵 이동을 수행한다. 이동 뒤와 재접속 뒤에는 Worker01 상태를 복구한다.
- Maker Play 검증: v2→v3 변환, 수레 `stone=2/iron=1`과 손 `gold`를 가진 상태의 `farm01 → deep_mine` 전환, Play 재시작 뒤 `deep_mine` 자동 복귀와 `cart=3/20 hand=gold` 복구를 확인했다. 검증 후 개발 프로필은 `farm01`, 빈 수레·빈 손으로 되돌렸다.

### 2026-07-29 — F7-A 손상 복구·동시 접속 잠금

- `AccountProfileService`가 `UserDataStorage`의 primary/backup을 거래 단위로 저장한다. 손상된 primary JSON은 안전하게 판별해 정상 backup의 복구 또는 새 기본 계정 시작을 선택하게 하며, 포기 전 backup은 recovery archive 키에 보관한다.
- `ui/AccountRecoveryUI.ui`와 `AccountRecoveryController`는 복구 가능 여부와 세션 차단 원인을 표시하고, 버튼은 서버 `RequestRecoveryRestore`/`RequestRecoveryAbandon`만 요청한다.
- 계정 잠금은 사용자별 storage key의 90초 lease와 30초 compare-and-set 갱신으로 유지한다. 신규 잠금 키의 `GetAndWait` 결과가 `error=0, value=nil`인 MSW 동작을 누락 키로 분리 처리했다.
- Maker Play 검증: 신규 잠금 획득과 Gold 0 저장, 외부 토큰으로 갱신을 실패시켜 쓰기 차단, 손상 primary의 backup 복구, 손상 후보 포기 후 Gold 0 새 계정 및 recovery archive 보존을 확인했다. 복구 패널은 런타임에 바인딩·초기화됐고, 자동 입력 좌표로 직접 클릭하는 시각 검증은 MCP screenshot 경로 권한 때문에 보류했다.
