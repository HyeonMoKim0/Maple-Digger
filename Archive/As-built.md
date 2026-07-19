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
| 광맥·틱·창고 기반 | 맵 `@Component` | `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua` | 광맥 회복 후 등록 일꾼 실행 순서를 유지. 창고·광맥 좌표 목록은 임시 코드 원장 |
| 일꾼 인터프리터·손·수레 | 엔티티 `@Component` | `RootDesk/MyDesk/Mine/WorkerController.mlua` | 서버 검증, 스택 인터프리터, 원자적 mine/load/unload, 일꾼별 시작 셀·수레·프로그램 |
| 일꾼 공용 모델 | `.model` | `RootDesk/MyDesk/Models/Farm/Worker.model` | modelId `worker`, RectTile용 `KinematicbodyComponent`와 `WorkerController` 포함. `Drone.model`은 레거시 원본 |
| 블록·자연어 편집기 | 클라이언트 `@Logic` | `RootDesk/MyDesk/Farm/BlockProgramController.mlua` | 활성 파일이 legacy `Farm/` 경로에 있음. D4-A에서 일꾼 선택의 단일 기준도 담당 |
| 블록 UI | `.ui` | `ui/BlockProgramUI.ui` | PC 우선. 반복/횟수 분리 + 일꾼 1/2 선택 버튼 |
| 광산 HUD·인벤토리 | 클라이언트 `@Logic` + `.ui` | `MineInventoryController.mlua`, `ui/MineHUD.ui`, `ui/MineInventoryUI.ui` | 서버 `@Sync` 값만 표시. 선택 일꾼 손·수레 + 공용 창고·광물 아이콘 |
| 실행 맵 | `.map` | `map/farm01.map` | RectTile, Worker01 `(0,0)`·Worker02 `(0,1)`, 같은 셀 겹침 허용 |

## 기록

### 2026-07-19 — D2 완료 기준점

- 커밋 `04c1cd5`에서 D2 서버 인터프리터·블록 UI·전용 자연어 입력을 저장했다.
- Maker에서 D2 S1~S10을 검증했다.
- 후속 안정화에서 자연어 최대 30블록 제한, Run 전 클라이언트 검증, 반복 중첩 UX를 보강한다.
- D3는 1인 세션의 일꾼별 손·수레와 세션 공용 창고로 확장한다.

### 2026-07-19 — D3 완료 기준점

- 손 1칸, 수레 20칸, 세션 공용 창고와 `mine → load → unload` 상태 전이를 구현했다.
- `cart_full`·`cart_empty`가 실상태를 판정하며, IF 조건 선택 UI에도 노출했다.
- PC HUD와 인벤토리 팝업을 추가하고 Maker D3 R1~R8을 통과했다.
- D2 후속 보강(클라이언트 30블록 제한, 반복 중첩 작성, 조건 선택)도 함께 회귀 검증했다.
- 다음 개발은 D4다. 창고는 1인 세션 공용, 수레와 프로그램은 일꾼 인스턴스 소유라는 경계를 유지한다.

### 2026-07-19 — D4-A 완료 기준점

- 공용 `Worker.model`을 만들고 Worker01/Worker02를 서로 다른 시작 셀에 배치했다.
- 편집기 상단에서 일꾼을 선택하면 Run/Stop과 HUD 손·수레 대상이 함께 전환된다.
- 등록된 두 일꾼은 매 틱 각각 최대 1액션을 실행하며, 셀 겹침을 허용하고 창고만 공유한다.
- Maker W1~W8 검증과 빌드/구조 검증을 통과했다.
- 다음 개발은 D4-B다. 기존 대형 스프라이트는 임시 상태이며 랜덤 아바타 조합·획득 흐름으로 교체해야 한다.

## 커밋 전 작업 경계

- 게임 기능 커밋에는 `RootDesk/MyDesk/`, `map/`, `ui/`, `docs/`, 이 기록 파일만 포함한다.
- `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `AGENTS.md`, `skills-lock.json`은 개발 도구·로컬 설정 범위이므로 게임 기능 커밋과 분리한다.
- `RootDesk/MyDesk/Mine.directory`는 Maker 폴더 메타데이터의 줄바꿈 차이뿐이므로 제외한다.
- PC 1920×1080 런타임에서 명령 패널·광산 HUD·Maker 시스템 버튼이 겹치지 않음을 확인했다.
- UI lint의 모바일 터치 높이 경고 4건은 PC 우선 MVP에서는 비차단으로 두고, 모바일 대응 단계에서 88px 이상으로 확장한다.
