# Claude 작업 인수인계

> 기준일: 2026-07-29 (2026-07-29 2차 검수 반영)
> 대상: Maple-Digger MSW 프로젝트를 다른 컴퓨터에서 이어 개발할 Claude 작업자
> 기준 커밋: `6a4ab91` (`implement rare ore collection and sales`)

## 0. 이어가기 지점 — 여기부터 읽는다

### 0.1 마지막 세션이 끝난 지점 (2026-07-29 2차 세션)

이 세션에서 한 일은 **검수와 문서 정합화뿐이며, 게임 코드·`.ui`·`.map`·`.model`은 한 줄도 바꾸지 않았다.** 런타임 동작은 여전히 `6a4ab91` 그대로다. 변경된 파일은 `docs/` 10개와 `Archive/As-built.md`뿐이다.

| 한 일 | 결과 |
|---|---|
| Maker 재검증 | 빌드 오류 0건, v7/Gold 0/Worker01/수레 20 초기화 확인 |
| 희귀 광물 서버 규칙 검수 | **전량 통과** — 상세는 §5와 `docs/16` §4 |
| 화면 검수 | **실패 2건 발견 (D-1, D-2)**, 보류 1건 (D-3) — `docs/16` §7.3 |
| 맵 강화 계약 정합화 | `docs/13` §5 신설, 세부 결정 4건을 D8 **C197~C200**으로 확정 |
| C199 파급 반영 | D3 §4 손 계약을 조건부 2칸으로 확장, F7-A v8 스키마에 손 개수 필드 예고 |

### 0.2 다음에 할 일 (사용자가 선택한 순서)

**1순위 — HUD 표시 계약을 F5에 작성한 뒤, 그 계약대로 D-1/D-2를 수정한다.**

이 순서를 택한 이유는 D-2(HUD에 재화가 없음)의 근본 원인이 **HUD 필드 단위 계약의 부재**이기 때문이다. 현재 HUD 요구사항은 D3 §7과 D5 §4에 기획 서술로만 흩어져 있고, F5는 marker·연출·사운드 중심이라 `MineInventoryController`가 "광물·재화·수레·상태 표시" 한 줄로만 규정돼 있다. 계약 없이 고치면 같은 누락이 재발한다.

작성할 내용:

- `MineHUD.ui` / `MineInventoryUI.ui`가 **반드시 표시해야 할 필드 목록** (현재 광산, 맵 강화 레벨, 돌·철·금, **골드·크리스탈·토큰**, 선택 일꾼 손/수레, 일꾼별 실행 상태) — 근거는 D3 §7, D5 §4
- 화면 영역 분할 규칙 (블록 편집기 / HUD / 광산 선택 / 월드가 서로 침범하지 않는 경계) — D-1·D-3의 재발 방지
- 각 필드의 데이터 출처(`@Sync` 프로퍼티명)와 갱신 시점
- 수용 테스트 (F5-7 이후 번호로 추가)

그다음 수정 대상:

| # | 증상 | 수정 위치 |
|---|---|---|
| D-1 | `광산 선택` 버튼이 블록 편집기 패널 헤더를 가림 | `ui/MineSelectUI.ui`, `ui/BlockProgramUI.ui`의 앵커·`displayOrder` |
| D-2 | HUD에 골드·크리스탈·토큰이 없음 | `ui/MineHUD.ui` + `MineInventoryController.mlua` |
| D-3 | 편집기 패널이 화면 좌측 절반 이상 점유 (보류) | 상시 표시가 기획 의도인지 사용자에게 먼저 확인 |

⚠️ `.ui` 수정은 반드시 **UIBuilder** 경유다. 원본 JSON 직접 편집·grep 금지(`AGENTS.md`, `msw-ui-system`).

**2순위 후보 — 맵 강화 구현.** 계약(`docs/13` §5)과 세부 결정(C197~C200)이 모두 끝나 바로 착수할 수 있다. 선행 작업은 **프로필 v7 → v8 마이그레이션**이며, 추가할 필드는 두 가지다.

1. `progress.mineLevels` — 맵별 강화 레벨 0~10. v7은 세 맵 모두 0으로 변환
2. worker record의 **손 개수** — C199의 `yield` 추가 지급 때문에 필요. 현재 `WorkerController.PendingOre`가 단일 문자열이라 개수를 표현하지 못한다. v7은 손에 광물이 있으면 1, 없으면 0으로 변환

**3순위 — 튜토리얼 기능 명세.** 유일하게 "작성하겠다"고 약속됐으나 아직 없는 문서다(`docs/00`). 기획 결정은 D7 §8.1과 C13/C29/C66/C67/C130에 이미 다 있다. 다만 후반부(반복·조건 → 판매 → 일꾼 구매)가 **F7-C 미구현에 의존**하므로, 로드맵이 정한 전제 조건("F6, F7-A~C 동작 뒤")이 아직 안 맞는다.

### 0.3 아직 열려 있는 질문

- **D-3**: 블록 편집기 패널이 화면 좌측 절반 이상을 점유하는 것이 기획 의도인가? 토글식 패널로 바꿀 것인가? → 사용자 확인 필요
- **일일·주간 과제**(D7 §8.2)는 C151에 따라 기본 기능 완료 뒤 여유 범위다. 지금 착수하지 않는다.

### 0.4 착수 전 반드시 확인

1. `git log --oneline -3`으로 이 문서 갱신분이 실제로 넘어왔는지 확인한다. 없으면 이전 컴퓨터에서 커밋·푸시가 안 된 것이다.
2. `docs/11`의 **C196**(희귀 광물)과 **C197~C200**(맵 강화)을 먼저 읽는다. 두 카드 묶음이 각 주제의 최종 기준이며, 이전 카드보다 우선한다.
3. Maker MCP를 연결하고 `refresh → build log → play → runtime log → stop`으로 초기 상태를 재확인한다. 로그 없이 "동작한다"고 판정하지 않는다.

## 1. 먼저 알아둘 상태

- F7-B v7 희귀 광물까지 **커밋 완료**됐다(`6a4ab91`). 다른 컴퓨터에서는 저장소를 클론/pull 하면 되고, 작업 트리를 통째로 옮길 필요가 없다.
- 새 계정 기준 상태는 **프로필 스키마 v7, Gold 0, 활성 일꾼 Worker01 한 명, 수레 0/20**이다.
- 개발 기준 문서는 `docs/`의 Markdown이며, 구현 사실은 `Archive/As-built.md`와 실제 코드·Maker 검증으로 판단한다.
- `FarmTickSimulator`와 `DroneController`는 비교용 과거 구현이다. 현재 광산 tick의 기준은 `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua`, 현재 일꾼 동작의 기준은 `RootDesk/MyDesk/Mine/WorkerController.mlua`다.

## 2. Claude가 읽을 순서

0. 이 문서의 **§0 이어가기 지점** — 다음에 할 일과 열린 질문.
1. 루트의 `AGENTS.md` — MSW 파일 위치, Builder, Maker 검증 규칙.
2. `docs/00-기획문서-로드맵.md` — 구현/미구현 범위의 전체 지도.
3. `docs/02-마스터-GDD.md` — 게임 루프와 시스템 소유권.
4. `docs/11-MVP-결정-질문답변-로그.md`의 **C196**(희귀 광물)과 **C197~C200**(맵 강화) — 두 주제의 최종 결정 원문.
5. `docs/12-계정-프로필-저장-복구-기능명세.md`(§2.1 스키마 버전 현황 포함), `docs/13-경제-진행-기능명세.md`(§5 맵 강화 계약 포함) — F7-A/B 계약.
6. `Archive/As-built.md`의 2026-07-29 기록 — 실제 구현과 검증 근거. 최신 항목이 "2차 검수와 맵 강화 계약 정합화"다.
7. `docs/16-사용자-검수-체크리스트.md` — 검수 결과와 §9의 자동화 불가 항목 근거.
8. 화면 작업을 한다면 `docs/08-비주얼-사운드-기능명세.md`(F5)와 `docs/06-비주얼-사운드.md`(D5) — HUD 표시 계약을 여기에 추가할 예정이다.

## 3. 지금까지 구현된 핵심 기능

| 영역 | 현재 구현 | 주 파일 |
|---|---|---|
| 광산/일꾼 | RectTile 광산 3개(`farm01`, `deep_mine`, `gem_mine`), Worker01 기본 활성, 2~5 구매 뒤 서버 생성·복구 | `MineLayoutConfig.mlua`, `VeinTickSimulator.mlua`, `WorkerController.mlua`, `MineTransitionService.mlua` |
| 계정·복구 | v7 프로필, Gold/광물/일꾼/마지막 광산/수레 상태 저장, primary·backup 복구와 동시 접속 lease | `AccountProfileService.mlua`, `AccountRecoveryController.mlua` |
| 경제·진행 | 일반 광물 수동·자동 판매/보호 수량, 깊은·보석 광산 첫 해금, 일꾼 구매, 일꾼별 수레 20→50 강화 | `EconomyService.mlua`, `ProgressionService.mlua`, `MineSelectController.mlua` |
| 희귀 광물 | 일반 광맥 1%, 특별 광맥 5% 드롭. 손→수레→Depot 뒤 컬렉션 등록, 종별 10단계 패시브, 11회째부터 보관·판매 | `AccountProfileService.mlua`, `EconomyService.mlua`, `VeinTickSimulator.mlua`, `WorkerController.mlua` |
| 희귀 판매 UI | 일반 판매 패널의 `희귀 광물 판매` 버튼으로 별도 팝업을 열어 희귀 돌/철/금 수동 판매와 자동 판매를 설정 | `ui/MineSelectUI.ui`, `MineSelectController.mlua` |

## 4. 고정된 희귀 광물 규칙 (변경 전 반드시 재확인)

이 규칙은 C196과 F7-B의 최종 기준이다.

- 종류는 `rare_stone`, `rare_iron`, `rare_gold` 세 가지다.
- 획득 흐름은 **손 → 수레 → Depot → 계정**이다.
- 각 종류의 첫 10개는 별도 희귀 광물 컬렉션에 즉시 등록된다. 판매는 패시브 획득 조건이 아니다.
- 종류별 최대 컬렉션 단계는 10이며, 매 단계 효과는 +3%다.
  - 희귀 돌: 수레 용량
  - 희귀 철: 광맥 회복 속도
  - 희귀 금: 일반 광물 판매 Gold
- 희귀 드롭 확률은 컬렉션 효과가 아니라 **맵 강화 전용** 효과다.
- 10단계에 도달하기 전에는 수동 판매와 자동 판매 설정 모두 서버에서 거부해야 한다.
- 11회째부터 들어온 같은 종류는 `rareStorage`에 보관한다. 사용자가 수동 판매하거나 자동 판매를 켠 경우에만 Gold로 전환한다.
- 판매 가격은 희귀 돌 50 Gold, 희귀 철 200 Gold, 희귀 금 600 Gold이며 다른 재화는 지급하지 않는다.

## 5. 최근 검증 결과와 한계

### 자동/서버 경로에서 확인한 것

- Maker `refresh → build log → Play → runtime log → stop` 흐름에서 새 빌드 오류 없이 초기화됐다. Build Console은 16건 전부 `Info`(LIA 정적 분석 안내)이고 오류·경고 0건이다.
- 시작 상태 로그에서 v7, Gold 0, Worker01 한 명, 수레 0/20을 확인했다.
- **희귀 광물 서버 규칙 전량을 검증했다.** 10단계 전 자동 판매 거부, 1개씩 11회 하역(`coll=1..10 → 11회째 store=1`), 배치 10+1 경로, 수레 용량 20→26, 희귀 금 10단계에서 돌 100개 판매 `goldGain=130`, 희귀 돌/철/금 판매 50/200/600 Gold, 보관 0에서의 추가 판매 거부, 10단계 뒤 자동 판매 허용까지 전부 통과했다. 검증 후 개발 프로필은 기준 상태로 원복했다.
- `git diff --check`는 통과했다.

### 화면 검수에서 발견한 실패

- `광산 선택` 버튼이 블록 편집기 패널 헤더를 가린다.
- HUD `광산 현황`에 **골드·크리스탈·토큰이 표시되지 않는다.** D3 §7과 D5 §4의 필수 표시 항목이다.
- 블록 편집기 패널이 1920×1080 좌측 절반 이상을 점유한다(보류 — 기획 의도 확인 필요).

세 항목은 `docs/16-사용자-검수-체크리스트.md` §7.3에 재현 조건과 함께 있다. 두 실패를 고치기 전에는 “현재 구현 전체가 오류 없이 기획대로 작동한다”고 판정하지 않는다.

### 자동 검증이 원천 불가능한 것

Maker MCP의 `mouse_input`은 **엔진 관리 UI(`ButtonComponent`)를 클릭하지 못한다.** 실제 클릭을 주입해 확인했다. 따라서 아래는 영구적으로 사용자 직접 검수 항목이다.

- 모든 UI 버튼 클릭 회귀(판매, 자동 판매 토글, 희귀 팝업, 광산 이동, 일꾼 구매, 수레 강화, 블록 조립·실행)
- 텍스트 입력 필드 입력
- 클릭해야만 열리는 화면의 배치·가독성

대신 **서버 규칙은 `maker_execute_script`(`server_main`)로, 상시 표시 화면은 `maker_screenshot`으로** 계속 자동 검증한다. 상세는 `docs/16` §9에 있다.

## 6. 현재 미구현 범위

아래는 버그가 아니라 아직 시작하지 않았거나 완결하지 않은 범위다.

| 범위 | 상태 | 기준 문서 |
|---|---|---|
| F5 시각·사운드 | marker/서버 이벤트 기반은 있으나 희귀 입고·특별 광맥·판매의 VFX/SFX/HUD 연출 미구현 | `docs/08-비주얼-사운드-기능명세.md` |
| F7-B 맵 강화 | 맵 레벨 0~10, 비용, 맵별 강화 효과는 미구현. **구현 계약 정합화와 세부 결정(C197~C200)까지 완료**되어 바로 착수 가능. v8 마이그레이션(맵 레벨 + 일꾼 손 개수)이 선행 작업이다 | `docs/13-경제-진행-기능명세.md` §5, `docs/11` C197~C200 |
| F7-C 프로그램 라이브러리/세션 | 계정 공용 프로그램 저장·복제·이름 변경·재시작 규칙 미구현 | `docs/14-프로그램-라이브러리-세션-기능명세.md` |
| F7-D 외형·도감·가챠 | 외형 데이터, 도감, 가챠 미구현 | `docs/15-외형-도감-가챠-기능명세.md` |

다음 기능을 택하기 전에는 위 문서와 `Archive/As-built.md`를 대조해, 계획 문서와 기능 명세를 먼저 업데이트하거나 구분한다.

## 7. 다른 컴퓨터에서의 시작 절차

1. 저장소를 열고 `git log --oneline -3`, `git status --short`, `git diff --check`로 실제로 옮겨진 변경을 확인한다. **이 문서의 §0이 보이면 2차 세션 결과까지 넘어온 것이다.**
2. `AGENTS.md`의 MSW Foundation/도메인 규칙을 그 작업 환경에 맞게 로드한다. 특히 `.ui`는 UIBuilder, `.model`/`.map`은 해당 Builder로만 수정한다.
3. Maker를 연결한 뒤 `refresh`, build log 확인, `play`, runtime log 확인, `stop` 순서로 첫 상태를 재확인한다. 기대값은 빌드 오류 0건, `[VeinTick] layout loaded mineId=beginner_mine veins=4 starts=5 specialCandidates=3`, `[Worker 1] configured cart=0/20 hand=`, `owned workers restored count=1`이다.
4. **§0.2의 1순위(HUD 표시 계약 → D-1/D-2 수정)부터 진행한다.** 서버 규칙 검수는 2차 세션에서 이미 통과했으므로 다시 하지 않아도 된다. 남은 검수는 `docs/16` §9에 따라 사용자만 수행할 수 있는 버튼 클릭 항목이다.
5. 새 개발을 시작할 때는 계획 문서 → 기능 명세 → 구현 → As-built → 검수 체크리스트 순서를 유지한다.

### 서버 규칙을 다시 검증해야 할 때

`maker_execute_script`의 `server_main` 컨텍스트에서 아래 방식으로 도메인 서비스에 직접 접근한다. `_UserService:GetUsers()`는 이 컨텍스트에 없으므로 쓰지 않는다.

```lua
local map = _EntityService:GetEntityByPath("/maps/farm01")
local users = _UserService:GetUsersByMapComponent(map.MapComponent)
local p = users[1]:GetComponent("script.AccountProfileService")
local d = p:GetProfile()
```

검증 뒤에는 **반드시 개발 프로필을 기준 상태로 원복한다** (Gold 0, 토큰 0, 광물 0, 희귀 컬렉션·보관 0, 자동 판매 해제, 수레 20, Worker01 1명, `lastMineId = "farm01"`). 원복 후 `p:ApplyRareStoneCartBonus()` → `p:SyncRuntimeState()` → `p:MarkProfileDirty()` → `p:SaveProfileAndWait()` 순서로 저장한다.

## 8. 작업 트리/커밋 주의사항

작업 트리에는 게임 변경 외에 Codex/에이전트 환경 파일도 섞일 수 있다.

- 게임 기능 변경 후보: `RootDesk/MyDesk/`, `map/`, `ui/`, `docs/`, `Archive/As-built.md`.
- 도구·에이전트 환경 범위: `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.mswai/`, `AGENTS.md`, `skills-lock.json`.
- 이 환경 파일은 게임 런타임 기능 자체와는 별도다. 같은 AI 작업 환경을 재현하려면 함께 옮길 수 있지만, 게임 기능 커밋에 무심코 섞지 말고 의도를 확인한다.
- 따라서 Claude에게는 `git add .`를 바로 실행하지 말고, 게임 기능 커밋과 도구 설정 커밋을 분리하도록 요청한다.

## 9. Claude에게 바로 붙여 넣을 요청문

```text
Maple-Digger MSW 프로젝트를 인수받아 이어서 작업한다.

먼저 docs/17-Claude-인수인계.md를 §0부터 끝까지 읽어라. §0이 이어가기 지점이다.
그다음 AGENTS.md, docs/00-기획문서-로드맵.md, docs/02-마스터-GDD.md,
docs/11-MVP-결정-질문답변-로그.md의 C196과 C197~C200,
docs/12-계정-프로필-저장-복구-기능명세.md, docs/13-경제-진행-기능명세.md(§5 포함),
Archive/As-built.md, docs/16-사용자-검수-체크리스트.md를 읽어라.

현재 기준은 프로필 v7, Gold 0, Worker01만 활성, 수레 0/20이다.
희귀 돌/철/금은 손→수레→Depot 뒤 첫 10개가 컬렉션(+3% 패시브)에 등록되고,
11회째부터만 보관·수동/자동 판매할 수 있다. 가격은 50/200/600 Gold다.
이 희귀 광물 서버 규칙은 2026-07-29 2차 세션에서 전량 검증 통과했으니 다시 검증하지 않아도 된다.

다음 작업은 §0.2의 1순위다. F5(docs/08)에 HUD 표시 계약을 먼저 작성하고,
그 계약대로 docs/16 §7.3의 D-1(광산 선택 버튼이 편집기 헤더를 가림)과
D-2(HUD에 골드·크리스탈·토큰 없음)를 수정하라. D-3은 나에게 먼저 물어라.
.ui 수정은 반드시 UIBuilder를 경유하고 원본 JSON을 직접 편집하지 마라.

Maker refresh/build/Play/runtime log 없이 "동작한다"고 판정하지 마라.
UI 버튼 클릭 검수는 mouse_input으로 불가능하니(docs/16 §9) 나에게 요청하라.
게임 기능 변경과 .agents/.claude/.codex 등 도구 환경 변경은 별도 커밋으로 분리하라.
새 기능은 계획 문서와 기능 명세를 먼저 정합시킨 뒤 구현하고, As-built와 검수 체크리스트를 갱신하라.
```
