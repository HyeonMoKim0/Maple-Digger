# 메이플 디거 — As-built 기록

> 다음 개발 세션이 기획서만 보고 이미 구현된 기능을 다시 만들지 않도록 유지하는 현재 상태 지도다. 원시 변경 이력은 Git을 사용한다.

## 확정 기준

- MVP 플레이어 수: 1인 세션
- 우선 플랫폼: PC 1920×1080
- 맵: `map/farm01.map`, RectTile(`TileMapMode=1`)
- 동적 일꾼 Body: `KinematicbodyComponent`
- 시뮬레이션 틱: 0.4초, 틱당 액션 1개

## 현재 상태

| 시스템 | 구현 | 위치 | 주의사항 |
|---|---|---|---|
| 광맥·틱·창고 기반 | 맵 `@Component` | `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua` | 0.4초 회복 후 등록 일꾼 실행. `farm01`은 `beginner_mine` JSON 레이아웃으로 돌 광맥 4개·Depot 1개·일꾼 시작점 1~5·특별 광맥 후보 3개를 검증한다. 특별 광맥 스폰·marker·3맵은 후속 구현 |
| 일꾼 인터프리터·손·수레 | 엔티티 `@Component` | `RootDesk/MyDesk/Mine/WorkerController.mlua` | 서버 검증, 스택 인터프리터, 원자적 mine/load/unload, 일꾼별 시작 셀·수레·프로그램 |
| 일꾼 공용 모델 | `.model` | `RootDesk/MyDesk/Models/Farm/Worker.model` | modelId `worker`, RectTile용 `KinematicbodyComponent`와 `WorkerController` 포함. `Drone.model`은 레거시 원본 |
| 블록·자연어 편집기 | 클라이언트 `@Logic` | `RootDesk/MyDesk/Farm/BlockProgramController.mlua` | 활성 파일이 legacy `Farm/` 경로에 있음. D4-A에서 일꾼 선택의 단일 기준도 담당 |
| 블록 UI | `.ui` | `ui/BlockProgramUI.ui` | PC 우선. 반복/횟수 분리 + 일꾼 1/2 선택 버튼 |
| 광산 HUD·인벤토리 | 클라이언트 `@Logic` + `.ui` | `RootDesk/MyDesk/Mine/MineInventoryController.mlua`, `ui/MineHUD.ui`, `ui/MineInventoryUI.ui` | 서버 `@Sync` 값만 표시. 선택 일꾼 손·수레 + 세션 Depot 합계; AccountStorage·판매·자동 판매는 미구현 |
| 실행 맵 | `.map` | `map/farm01.map` | RectTile, Worker01 `(0,0)`·Worker02 `(0,1)`가 실제 배치되어 있으며 1~5의 유효 시작 셀도 설정됐다. 같은 셀 겹침 허용. `deep_mine`/`gem_mine`, marker, 선택/전환은 미구현 |

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
