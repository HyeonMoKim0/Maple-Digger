# Claude 작업 인수인계

> 기준일: 2026-07-29  
> 대상: Maple-Digger MSW 프로젝트를 다른 컴퓨터에서 이어 개발할 Claude 작업자  
> 기준 브랜치/커밋: `main` / `7af05b4` (`덜 커밋한거 추가`) 위의 **미커밋 작업 트리**

## 1. 먼저 알아둘 상태

- 현재 구현은 모두 커밋된 상태가 아니다. 다른 컴퓨터에서는 이 작업 트리 자체를 옮기거나, 게임 기능 변경만 선별 커밋한 뒤 그 커밋을 가져와야 한다.
- 새 계정 기준 상태는 **프로필 스키마 v7, Gold 0, 활성 일꾼 Worker01 한 명, 수레 0/20**이다.
- 개발 기준 문서는 `docs/`의 Markdown이며, 구현 사실은 `Archive/As-built.md`와 실제 코드·Maker 검증으로 판단한다.
- `FarmTickSimulator`와 `DroneController`는 비교용 과거 구현이다. 현재 광산 tick의 기준은 `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua`, 현재 일꾼 동작의 기준은 `RootDesk/MyDesk/Mine/WorkerController.mlua`다.

## 2. Claude가 읽을 순서

1. 루트의 `AGENTS.md` — MSW 파일 위치, Builder, Maker 검증 규칙.
2. `docs/00-기획문서-로드맵.md` — 구현/미구현 범위의 전체 지도.
3. `docs/02-마스터-GDD.md` — 게임 루프와 시스템 소유권.
4. `docs/11-MVP-결정-질문답변-로그.md`의 **C196** — 희귀 광물의 최종 결정 원문.
5. `docs/12-계정-프로필-저장-복구-기능명세.md`, `docs/13-경제-진행-기능명세.md` — F7-A/B 계약.
6. `Archive/As-built.md`의 2026-07-29 F6, F7-A, F7-B v5~v7 기록 — 실제 구현과 검증 근거.
7. `docs/16-사용자-검수-체크리스트.md` — 아직 자동 검증으로 대체할 수 없는 직접 검수 항목.

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

- Maker `refresh → build log → Play → runtime log → stop` 흐름에서 새 빌드 오류 없이 초기화됐다.
- 시작 상태 로그에서 v7, Gold 0, Worker01 한 명, 수레 0/20을 확인했다.
- 희귀 컬렉션 10단계 전 자동 판매 설정은 `false`로 거부되는 서버 경로를 확인했다.
- 10단계 뒤 희귀 돌 2개 자동 판매는 `+100 Gold`, 희귀 보관 수량 0으로 처리되는 서버 경로를 확인했다.
- `git diff --check`는 통과했다.
- 희귀 팝업 내부의 정적 겹침은 분리·정리했다. 다만 `MineSelectUI.ui` 정적 검사에는 일반 판매/선택 화면 중심의 경고 28건, 정보 15건이 남아 있다. 오류(error)는 0건이다.

### 아직 통과라고 말하면 안 되는 것

- 실제 화면에서 모든 판매·자동 판매·복구·구매 버튼을 눌러 본 회귀 검수
- 희귀 돌/철/금 각각 10회 입고 및 11회째 보관/판매의 실제 플레이 흐름
- PC 1920×1080에서 희귀 판매 팝업의 가독성·화면 밖 이탈 여부
- 저장 뒤 Play 재시작/재접속에서 UI 표시와 거래 설정이 실제로 복원되는지

이 항목은 `docs/16-사용자-검수-체크리스트.md`에 체크 가능한 형태로 정리돼 있다. 전부 통과하기 전에는 “현재 구현 전체가 오류 없이 기획대로 작동한다”고 판정하지 않는다.

## 6. 현재 미구현 범위

아래는 버그가 아니라 아직 시작하지 않았거나 완결하지 않은 범위다.

| 범위 | 상태 | 기준 문서 |
|---|---|---|
| F5 시각·사운드 | marker/서버 이벤트 기반은 있으나 희귀 입고·특별 광맥·판매의 VFX/SFX/HUD 연출 미구현 | `docs/08-비주얼-사운드-기능명세.md` |
| F7-B 맵 강화 | 맵 레벨 1~10, 비용, 맵별 강화 효과는 미구현 | `docs/10-MVP-성장-경제-통합명세.md`, `docs/13-경제-진행-기능명세.md` |
| F7-C 프로그램 라이브러리/세션 | 계정 공용 프로그램 저장·복제·이름 변경·재시작 규칙 미구현 | `docs/14-프로그램-라이브러리-세션-기능명세.md` |
| F7-D 외형·도감·가챠 | 외형 데이터, 도감, 가챠 미구현 | `docs/15-외형-도감-가챠-기능명세.md` |

다음 기능을 택하기 전에는 위 문서와 `Archive/As-built.md`를 대조해, 계획 문서와 기능 명세를 먼저 업데이트하거나 구분한다.

## 7. 다른 컴퓨터에서의 시작 절차

1. 저장소를 열고 `git status --short`, `git diff --check`, `git diff --name-status`로 실제로 옮겨진 변경을 확인한다.
2. `AGENTS.md`의 MSW Foundation/도메인 규칙을 그 작업 환경에 맞게 로드한다. 특히 `.ui`는 UIBuilder, `.model`/`.map`은 해당 Builder로만 수정한다.
3. Maker를 연결한 뒤 `refresh`, build log 확인, `play`, runtime log 확인, `stop` 순서로 첫 상태를 재확인한다.
4. 먼저 `docs/16-사용자-검수-체크리스트.md`의 사용자 직접 검수를 수행한다. 실패가 있으면 새 기능보다 원인·재현 로그를 먼저 기록하고 수정한다.
5. 새 개발을 시작할 때는 계획 문서 → 기능 명세 → 구현 → As-built → 검수 체크리스트 순서를 유지한다.

## 8. 작업 트리/커밋 주의사항

현재 작업 트리에는 게임 변경 외에 Codex/에이전트 환경 파일도 섞여 있다.

- 게임 기능 변경 후보: `RootDesk/MyDesk/`, `ui/MineSelectUI.ui`, `docs/`, `Archive/As-built.md`.
- 도구·에이전트 환경 범위: `.agents/`, `.codex/`, `AGENTS.md`, `skills-lock.json`.
- 이 환경 파일은 게임 런타임 기능 자체와는 별도다. 같은 AI 작업 환경을 재현하려면 함께 옮길 수 있지만, 게임 기능 커밋에 무심코 섞지 말고 의도를 확인한다.
- 따라서 Claude에게는 `git add .`를 바로 실행하지 말고, 게임 기능 커밋과 도구 설정 커밋을 분리하도록 요청한다.

## 9. Claude에게 바로 붙여 넣을 요청문

```text
Maple-Digger MSW 프로젝트를 인수받아 작업한다.

먼저 docs/17-Claude-인수인계.md, AGENTS.md, docs/00-기획문서-로드맵.md,
docs/02-마스터-GDD.md, docs/11-MVP-결정-질문답변-로그.md의 C196,
docs/12-계정-프로필-저장-복구-기능명세.md, docs/13-경제-진행-기능명세.md,
Archive/As-built.md, docs/16-사용자-검수-체크리스트.md를 읽어라.

현재 기준은 프로필 v7, Gold 0, Worker01만 활성, 수레 0/20이다.
희귀 돌/철/금은 손→수레→Depot 뒤 첫 10개가 컬렉션(+3% 패시브)에 등록되고,
11회째부터만 보관·수동/자동 판매할 수 있다. 가격은 50/200/600 Gold다.

현재 상태를 무조건 완료라고 선언하지 말고, Maker refresh/build/Play/runtime log로
초기화와 빌드 오류를 재확인한 뒤 docs/16의 직접 검수 항목을 우선 수행하라.
게임 기능 변경과 .agents/.codex 등 도구 환경 변경은 별도 커밋으로 분리하라.
새 기능은 계획 문서와 기능 명세를 먼저 정합시킨 뒤 구현하고, As-built와 검수 체크리스트를 갱신하라.
```
