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
| 광맥·틱·창고 기반 | 맵 `@Component` | `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua` | 0.4초 회복 후 등록 일꾼 실행. 세 광산의 JSON 레이아웃·Depot·일꾼 시작점 1~5·일반/특별 marker를 검증하며, 특별 광맥은 후보에서 생성하고 동시 활성 상한을 적용한다. **맵 강화 4효과 캐시(T-02)**: `_T.bonus*` 4종은 맵 진입·강화 성공 시 `PushMineBonusesToSimulator` 만 갱신한다(매 틱 프로필 조회 금지). 희귀 판정은 **만분율**(`RareDropChanceBasisPoint` 100/500, 테스트 훅 `RareDropTestBasisPoint` — 옛 `*Percent` 3종은 제거됨), 회복 배율은 희귀 철 + 맵 recovery **가산 합성**, 특별 스폰은 `max(60, floor(750/(1+b)))` |
| 일꾼 인터프리터·손·수레 | 엔티티 `@Component` | `RootDesk/MyDesk/Mine/WorkerController.mlua` | 서버 검증, 스택 인터프리터, 원자적 mine/load/unload, 일꾼별 시작 셀·수레·프로그램. **`ProgramState` 는 3값** — `Idle`(미실행·자연 완료) / `Running` / `Stopped`(사용자 정지·맵 전환·서버 거절), C217. `ResetExecution` 은 항상 `Idle` 로 착지하고 정지 계열 호출자만 덮어쓴다. **손은 `PendingOre` + `PendingOreCount`(0~2) 쌍**(T-02 yield) — 채굴은 손이 완전히 빌 때만, `load` 는 수레 여유만큼 부분 적재하고 잔량을 손에 남긴다. `ConfigureFromProfile` 은 5인자(count 추가) |
| 일꾼 공용 모델 | `.model` | `RootDesk/MyDesk/Models/Farm/Worker.model` | modelId `worker`, RectTile용 `KinematicbodyComponent`와 `WorkerController` 포함. `Drone.model`은 레거시 원본 |
| 블록·자연어 편집기 | 클라이언트 `@Logic` | `RootDesk/MyDesk/Farm/BlockProgramController.mlua` | 활성 파일이 legacy `Farm/` 경로에 있음. 신규 프로필은 Worker01만 실행 대상이며, 구매한 Worker02~05도 독립 선택한다. **워커 칩은 선택/일반/잠금 3종 스프라이트를 런타임 스왑**하며(T-13 A1), 상태 결정은 `GetWorkerChipState` 하나가 소유한다 — 라벨·스프라이트·로그가 같은 값을 본다. |
| 블록 UI | `.ui` | `ui/BlockProgramUI.ui` | PC 우선. 반복/횟수 분리 + Worker01~05 선택 탭. **칩 배경은 파일에 `tab-worker-normal` 이 박혀 있고 런타임이 덮어쓴다** — 파일값만 보고 판단하면 안 된다 |
| 광산 HUD·인벤토리 | 클라이언트 `@Logic` + `.ui` | `RootDesk/MyDesk/Mine/MineInventoryController.mlua`, `ui/MineHUD.ui`, `ui/MineInventoryUI.ui` | 서버 `@Sync` 값만 표시. Worker01 손·수레 + 세션 Depot 합계를 표시하며, 계정 광물·판매 설정·광산 선택은 별도 F7-B UI가 담당한다. |
| 광산 선택 화면 | 클라이언트 `@Logic` + `.ui` | `RootDesk/MyDesk/Account/MineSelectController.mlua`, `ui/MineSelectUI.ui` | 광산 선택·판매·수레·희귀·**맵 강화(T-03)** 5패널. **광산 버튼 3개에 상태 뱃지(입장/해금/잠금)를 런타임 스왑**한다(T-13 C). 파일 초기값은 3개 다 `locked` 이고 런타임이 덮어쓴다. **`RefreshUI` 의 `state` 키에 `LastMineId` 가 반드시 있어야** 광산 전환이 뱃지에 반영된다 |
| 계정·경제·광산 해금·맵 강화 | 서버 `@Component` + `@Logic` | `RootDesk/MyDesk/Account/AccountProfileService.mlua`, `AccountRecoveryController.mlua`, `EconomyService.mlua`, `ProgressionService.mlua` | **프로필 스키마는 v8**(T-02, 2026-08-18) — v7 대비 `mineLevels`·worker `pendingOreCount`·`crystal`·`tutorial`·`settings` 5필드가 늘었고 v7 은 로드 시 기본값으로 변환된다. 계정 광물 원장, 수량·보호·자동 판매, 깊은/보석 광산 첫 해금, 일꾼 2~5 구매·맵 재배치·손/수레 복구, 수레 20→50 강화, 백업 복구/포기, 동시 접속 잠금. **맵 강화(레벨 0~10·4효과·비용)는 구현 완료** — `RequestMineUpgrade`/`PurchaseMineUpgrade`/`GetMineBonus` + 표기용 @Sync(`MineLevel*` 3종 + `MineUpgradeInfoJson`). 거절 문구는 `DescribeShortfall`(부족분 숫자)·`SetReject*`(단일 정의) 체계다. `tutorial`(T-07)·`settings`(T-12-B) 필드는 저장만 되고 소비자는 아직 없다 |
| 실행 맵 | `.map` | `map/farm01.map`, `map/deep_mine.map`, `map/gem_mine.map` | 세 맵 모두 RectTile이며 Worker01만 실제 배치된다. **1~5 시작 셀은 T-11(2026-08-14)로 광맥별 분산됐다** — 각 시작 셀의 **한 걸음 오른쪽이 광맥**이라 복사한 프로그램이 바로 캔다(배치표 `docs/18` T-11). 초보 광산 W2·W4는 광맥 셀 위에 서고 W5는 창고를 공유한다. marker·서버 맵 전환과 **F5 시각 표현(Phase 1~4)** 은 구현됐고, **사운드(Phase 5)와 F5-1~F5-6 최종 판정(Phase 6)은 미구현** |
| F5 연출 (시각) | 클라이언트 `@Component` | `RootDesk/MyDesk/Mine/VeinMarkerController.mlua`, `MineNoticeController.mlua`, `WorkerVisualController.mlua` | 전부 ClientOnly. 서버는 `@Sync`/이벤트 채널만 내고 RUID 선택·연출은 클라이언트 몫이다(F5 §1). 표시 전용 자식은 `FxSprite.model` / `OreBadge.model`을 런타임 스폰해 붙이므로 **맵 파일에 FX 엔티티가 없다**. **채굴 먼지 오프셋은 광맥 종류별 오너 실측값**(2026-08-18): 셀 기준 일반 `(-0.75, -0.25)` · 특별 `(-0.75, -0.5)` — 먼지는 광맥의 왼쪽(일꾼 쪽) 아래. 옛 `HitFxOffsetY`+`ShardPivotOffset*` 2계층을 대체했고, pivot 쏠림이 실측값에 포함돼 있어 **자산·`ShardScale` 변경 시 오너와 재측정**. 특별 판정은 marker `MarkerKind=="special"`. ⚠ 오너가 준 원본 수치는 Position 직접 입력한 **맵 절대좌표**였다 — 좌표를 받으면 어느 필드를 읽었는지부터 확인 (docs/16 §32.6) |
| F5 사운드 (Phase 5) | 클라이언트 `@Component` | `RootDesk/MyDesk/Mine/MineSoundController.mlua` (맵 3개 루트에 부착) | cue 재생과 F5 §4 쿨다운**만** 담당. 이벤트 판별·중복 제거는 위 시각 컨트롤러 3곳이 하고 cue 호출만 얹는다. **RUID 7종은 2026-08-16 오너 청취로 확정**(docs/21 §3 승인 완료 — 2종 유지·5종 교체). ⚠️ `depot_unload` 만 1.52s 로 쿨다운 0.4s 를 넘어 겹칠 수 있다. 재생 가드 2중: `@Sync` settle(접속 시 오재생 방지) + `LocalPlayer.CurrentMap` (타 맵 cue 차단) |
| BGM · 볼륨 소유자 (T-12-A) | 클라이언트 `@Logic` | `RootDesk/MyDesk/Mine/SoundSettingsController.mlua` | 볼륨 2종의 **단일 소유자** + BGM 재생 주체. `@Logic` 이라 맵 전환에 곡이 끊기지 않는다(F10 §1.1). **BGM 은 2026-08-16 오너 청취로 `3512470b…`(`sound-604`, 87.3s) 확정** — 잠정 오케스트라 `8e366297…` 은 미채택(docs/21 §3-B). **`BgmVolume = 0.5` 는 아직 미판정(L5)** 이고 곡이 짧아져 루프 이음새가 약 1.6배 자주 온다. **`PlayBGM` 이 루프임을 실측으로 확정**(곡 끝 +58.5초까지 `IsPlayBGM()`=true). 볼륨은 아직 **코드 상수** — 슬라이더·프로필 저장·`MineSoundController` 볼륨 조회 배선은 전부 **T-12-B** 몫이다(F10 §0.1 산출물 1·3·5) |

## 기록

### 2026-08-18 — T-03: 맵 강화 UI 패널 · 신규 배치는 lint 가 먼저 판정했다

T-02 병합(PR #9) 직후 이어서 구현. 브랜치 `feat/t03-mine-upgrade-ui` `cd90dd4`. 검수 `docs/16` §31.

- **C202 ① 그대로** — `MineSelectUI` 에 `UpgradePanel` 을 CartPanel 과 같은 계층 모달로 신설. 별도 `.ui` 를 만들지 않았고 **기존 엔티티는 하나도 안 건드렸다**(신규 9개만) — `audit_resave` 가 그것을 증명한다.
- **표기는 `MineUpgradeInfoJson` 파싱만.** 4효과 4줄 · `(주)` · `현재 → 다음` · 절대값 병기(합산 배율/bp/분초)를 전부 서버 값으로 그린다. 클라 재계산 0줄 (§5.6.3).
- **진입 버튼 첫 배치를 lint L023 이 반려했다.** 광산 목록 아래 "빈" 공간은 하단 고정 `BtnClose` 자리였다(T-13 C 의 18px 실측 재확인). 하단 닫기 옆으로 옮겼다. **새 배치는 쓰기 전에 L023 을 본다.**
- **거절 표시는 스냅숏 방식** — 모달 연 시점의 `LastTransactionMessage` 를 기억하고 그 이후 변화만 그린다. 전역 슬롯을 지울 수 없는 제약에서 R5 를 지키는 표준 패턴으로 삼을 만하다.
- 신규 텍스트 5곳의 레거시 `TextComponent` 는 만들자마자 제거 (docs/17 §1-9).

**남은 것**: 실클릭 검수 **K5** (`docs/16` §31.3) — §24.6 클릭 묶음에 추가됐다.

### 2026-08-18 — T-02: 맵 강화 서버 + v8 마이그레이션 · 병목이 풀렸다

브랜치 `feat/t02-mine-upgrade`(웜업 `5fc9947` · 본 구현 `2538181`). B8~B18 전량 서버 경로로 판정 — 검수 `docs/16` §30.

- **v8 은 5필드를 한 번에 넣었다** (`docs/12` §2.1 경고대로): `mineLevels` · `pendingOreCount` · `crystal` · `tutorial` · `settings`. 나눠 넣었으면 v9 마이그레이션이 한 번 더 필요했다. v7 변환은 전부 "없으면 기본값" — 변환 실패 경로를 만들지 않았다.
- **웜업(거절 문구 정리)을 먼저 커밋한 것이 옳았다.** 본 구현의 거절 5종(`docs/23` §6.1)이 웜업이 만든 `DescribeShortfall`/`SetReject*` 체계를 그대로 썼다 — 부족분 숫자 문구가 공짜로 얻어졌다.
- **효과 4종은 자료형이 달라 계산 방식을 각각 고정했다** (`docs/13` §5.3): recovery 는 연속값 가산 합성(1.60 실측), rareChance 는 만분율 승격(130bp/650bp 실측), specialSpawn 은 floor+하한(681/60 실측), yield 는 만분율 롤(60회 표본 16회≈27%).
- **B12·B14 는 캐시 주입으로 판정했다** — `ApplyMineBonuses` 에 깊은 광산 L10 값(별도 검증)을 직접 넣고 공식 메서드를 호출. 미해금 맵 실입장 없이 서버 실행 경로를 쳤다.
- **테스트 훅이 켜지면 보너스를 적용하지 않는다** — `RareDropTestBasisPoint` 는 최종값이다. 결정적 테스트(=10000 강제 등)에 보너스가 곱해지면 기대값이 흔들린다.
- **표기 계약은 JSON 한 장 + 레벨 3종**으로 내렸다. §5.6.5 의 7종을 스칼라 @Sync 로 다 펴면 속성이 15개쯤 늘어난다 — `MineUpgradeInfoJson` 하나에 현재/다음 보너스·bp·틱·합성 배율·비용을 담고, 선택 화면용 `Lv.n` 만 `MineLevelBeginner/Deep/Gem` 스칼라로 뒀다. **T-03 은 이 JSON 을 파싱만 하면 되고 재계산은 금지다**(§5.6.3).
- **D-6 을 곁들여 닫았다** — HUD 의 `Lv.0 / 10`·`크리스탈 0` placeholder 상수를 실값으로 교체. `RefreshUI` 변경 감지 키에 레벨·크리스탈·`PendingOreCount` 를 함께 넣었다(빠지면 무증상 미갱신 — D-11 계열).
- **검증 중 Maker 가 한 번 죽었다.** baseline 원복 스크립트 제출 직후 연결 단절 — 재실행 후 `[T02-BASELINE-CHECK]` 로 원복 커밋을 확인하기 전까지 미확정으로 취급했다(도구 사망과 검사 통과는 로그에서 구분되지 않는다).

**남은 것**: 오너 PR 병합(C213). 병합되면 **T-03·T-05·T-06·T-07·T-12-B 5개 티켓의 선행이 풀린다.** `tutorial`/`settings` 필드의 소비자(T-07/T-12-B)는 아직 없다.

### 2026-08-16 — T-13 A2: `Stopped` 신설 + 상태 램프 · 볼륨 판정이 배선을 앞당겼다

램프 3상태(C217)와 볼륨(C220)을 구현했다. 검수 `docs/16` §29, 자산 `docs/26` §5.4.

- **`ProgramState` 는 2값이 아니라 5가지 결말이 뭉개진 1값이었다.** `Idle` 하나에 미실행 · 자연 완료 · 사용자 정지 · 맵 전환 정지 · 서버 거절이 전부 들어 있었다(다섯 경로가 `ResetExecution()` 하나로 모인다). `Stopped` 는 그 정보가 **이미 호출 지점에 있어 분류만** 하면 됐고, `Blocked` 는 판정 로직 자체가 없어 보류했다.
- **`ResetExecution` 안에 갈래를 만들지 않았다.** `RunProgram` 은 성공 경로에서도 맨 처음 그것을 부르므로, 거기에 `Stopped` 를 넣으면 **실행할 때마다 램프가 빨갛게 튄다.** 항상 `Idle` 로 착지시키고 "멈춰 세운" 호출자 세 곳만 뒤에서 덮어쓴다.
- **착수 전에 회귀 위험을 먼저 갈랐다.** `ProgramState` 를 분기 조건으로 쓰는 코드가 있는지 전수 확인 — 표시 2곳뿐이고 유일한 비교(`== "Running"`)는 `Stopped` 를 `else` 로 떨어뜨려 의도대로다. `== "Idle"` 게이트가 하나라도 있었으면 새 상태가 조용히 깨뜨렸을 것이다.
- **볼륨 판정(C220)이 배선 하나를 앞당기게 했다.** `SfxVolume` 은 아무도 읽지 않는 값이라(T-12-B 산출물 3) `0.7` 을 적기만 하면 **값은 적히고 효과음은 1.0 으로 나는** 상태가 됐다. `PlayCue` 가 재생 직전에 `GetSfxVolume()` 을 읽도록 배선했고 **캐시하지 않는다** — 맵 3개에 인스턴스가 3개라 캐시하면 F10 §1.2 함정을 그대로 밟는다. `MineSoundController.Volume` 은 폴백으로 격하.
- **파일 초기값은 `stopped`(빨강).** 배선이 죽으면 "멈춤"으로 눈에 띈다 — 예전의 `running` 초록은 자동화가 도는 것처럼 보여 결함을 숨겼다.

**남은 것**: 램프 3종의 육안 구분은 `docs/16` §24.6 **K2**(블록 실행·정지) 오너 몫. **T-12-B 에 남은 것은 슬라이더와 프로필 저장뿐이다.**

### 2026-08-16 — T-04 Phase 6: cue 7종·BGM 청취 판정 반영 · 설명 텍스트가 두 자리에서 틀렸다

오너 청취(L1~L4)로 사운드가 확정됐다. cue **2종 유지 · 5종 교체**, BGM 은 잠정 오케스트라 대신 **대체 A `sound-604`**(87.3s). 검수 `docs/16` §28, 확정표 `docs/21` §3·§3-B.

- **교체 5종 중 2종이 기존 다른 cue 의 자산을 옮겨 온 것이다.** 파괴음은 "헛방"이 아니라 **"수레를 쏟아붓기"** 였고, 반짝임은 "출현 알림"보다 **"헛방"** 에 맞았다. 잠정 배치는 소리의 성격을 **AI 생성 설명 텍스트로 유추**한 결과였고 그 유추가 두 자리에서 틀렸다. **설명만 믿고 넣은 자산이 정정된 세 번째 사례**다(C206 부유석 · §5 파편 2종 · 여기) — 앞의 둘은 스크린샷으로 잡혔지만 **소리는 그 방법이 안 통해 오너 청취까지 와서야 잡혔다.**
- **그 교차가 길이 문제까지 풀었다.** `mine_empty` 1.52s→0.55s(쿨다운 0.8s 안으로), `rare_ore_unload` 3.89s→1.18s.
- **대신 `depot_unload` 가 1.52s 로 쿨다운 0.4s 를 3.8배 넘는다.** 하역 연속 시 최대 4겹. **거슬리면 자산이 아니라 쿨다운을 1.6s 로 올린다** — 오너가 고른 소리이고 겹침은 빈도 문제다.
- **`msw-search` batch 로 6개 RUID 의 실존·타입·길이를 먼저 쟀다.** 오타 하나면 cue 가 조용히 죽는데(F5 §4 는 빈 RUID 만 무음 처리하고 *틀린* RUID 는 그냥 실패한다) 배선 전에 갈렸다.

**남은 것**: **L5(`BgmVolume = 0.5`)는 미판정**이다. 곡이 바뀌어 이전 기준의 균형 감각은 무효다. 곡 길이도 141.5s→87.3s 라 루프 이음새가 약 1.6배 자주 온다 — 함께 본다.

### 2026-08-16 — T-13 C: 광산 노드 뱃지 · 자리가 없어 배치를 바꿨다

`docs/26` §5.8 후속 3의 광산 노드를 넣었다. 자산 3종 신규 업로드(`docs/26` §5.5). 검수 `docs/16` §27.

- **README 원안(`SelectPanel/MineRoute` 가로 스트립)은 자리가 없다.** `SelectPanel`(780×980)을 재어 보니 **빈 세로 띠가 18px**, 광산 행 사이가 **24px**, 왼쪽 여백은 `GemText` 가 720px 폭이라 막혔다. 그래서 노드를 **각 광산 버튼(340×88)의 자식 뱃지**(64×64, 왼쪽 안쪽 10px)로 넣었다. 기존 배치를 하나도 안 건드리므로 **T-03(같은 `.ui` 에 모달 추가)과 충돌하지 않는다** — 이게 이 배치의 진짜 값어치다.
- **커넥터는 업로드하지 않았다.** 눕혀도 24px 에 안 들어가고 줄이면 실오라기가 된다. 가로 경로로 재설계할 때 T-03 과 같이 잡는다.
- **파일 초기값을 일부러 `locked` 로 뒀다.** 배선이 죽으면 "전부 잠금"이라는 눈에 띄는 화면이 되지, 그럴듯하게 위장되지 않는다. `current` 를 초기값으로 두면 초보 광산만은 맞아 보여 결함이 숨는다.
- **감지 키에 `LastMineId` 를 넣어야 한다.** `RefreshUI` 의 `state` 키에 입장 중인 광산이 빠져 있었다 — 넣지 않으면 광산을 옮겨도 키가 같아 조기 return 하고 뱃지가 안 바뀐다(D-11/D-12 계열).
- **판정은 A1 과 같은 방식.** 파일값(전부 locked)과 런타임 초기값(`beginner=current`)이 다른 것이 스왑의 증거다. `next` 는 원장을 건드리지 않고 `GetMineNodeState`/`ApplyMineNode` 를 인자만 달리해 직접 호출해 쳤다.
- **곁다리로 baseline 을 정리했다 (C219).** `stone` baseline 이 설계값 `0` 이 아니라 과거 잔량 `1` 로 박혀 있었다. `0` 으로 정정하고 이 컴퓨터 프로필도 맞췄다(`cart=20 lastMine=farm01`, `saved=true`).

**남은 것**: 노드가 눈으로 구분되는지·라벨을 방해하지 않는지는 `docs/16` §24.6 **K1** 오너 몫.

### 2026-08-16 — T-13 A1: 워커 탭 상태 스프라이트 · 파일값과 런타임값이 다른 것이 증거였다

`docs/26` §5.8 후속 1을 닫았다. 칩 5개가 문구(`[1]`/`1`/`1 X`)로만 상태를 말하던 것을 선택/일반/잠금 스프라이트 스왑으로 바꿨다. 자산은 이미 올라가 있었고 **배선만 없었다**. 검수 `docs/16` §26.

- **상태 결정을 `GetWorkerChipState` 하나로 모았다.** 라벨·스프라이트·로그가 각자 판단하면 문구와 그림이 어긋나는 것을 아무도 못 잡는다. 실제로 이 구조 덕에 로그 한 줄(`1=selected 2=disabled …`)이 그대로 판정 근거가 됐다.
- **`.ui` 는 건드리지 않았다.** 엔티티도 컴포넌트도 그대로고 `injectBindings` 로 프로퍼티 UUID만 넣었다. `.ui` 재저장분을 늘리지 않으려는 것이고, 실제로 `git status` 의 `.ui` 7개는 이번 작업과 무관한 정규화분 그대로다.
- **판정 방법 — 파일값과 런타임값의 불일치를 증거로 썼다.** `.ui` 에는 5개 전부 `tab-worker-normal` 이 박혀 있는데 런타임 초기값이 `1=selected / 2~5=disabled` 로 나왔다. "값이 계약과 같다"보다 **"파일과 다르다"가 스왑이 돌았다는 더 강한 증거**다.
- **`normal` 분기를 원장 무변경으로 쳤다.** `owned=1` 이라 그대로는 못 보는데, 일꾼을 사는 대신 **프로덕션 메서드 `SetWorkerButtonState` 를 `owned` 인자만 달리해** 호출했다. 테스트 전용 경로를 새로 판 것이 아니라 구매 후 탈 그 경로를 먼저 친 것이다. `RefreshWorkerButtons()` 한 줄로 복귀.
- **곁가지로 결함 하나를 닫았다 — 구매 직후 칩이 갱신되지 않았다.** `RefreshWorkerButtons` 가 `OnBeginPlay`/`SelectWorker` 에서만 불려서, 일꾼을 사도 탭을 누르기 전까지 옛 상태였다. `OnUpdate` 에 보유 수 변화 감지를 넣었고 **기존 조기 `return` 보다 앞**에 뒀다 — 뒤에 두면 상태가 안 바뀌는 동안 영영 안 돈다.

**남은 것**: 세 스프라이트가 눈으로 구분되는지는 `docs/16` §24.6 **K3** 오너 클릭 검수 몫이다. RUID 일치까지가 자동 검증의 한계다. A2(상태 램프)는 **`ProgramState` 가 `Idle`/`Running` 2값뿐**이라 착수 전 오너 결정이 필요하다(`docs/18` §3 공백 10번).

### 2026-08-14 — T-11: 일꾼 시작점 분산 (3광산) · 도구가 "정규화"라고 거짓말했다

D9 §5.2 의 "일꾼을 사도 채굴량이 0"을 근본 해소했다. 시작 셀 5개가 창고에 뭉쳐 있어 **복사한 프로그램의 첫 동작 `동 E` 가 광맥에 닿지 않았던 것**이 원인이다. 그래서 **"앞"은 서쪽 인접 칸**으로 확정하고(그래야 한 걸음 오른쪽이 광맥) 3맵 전부 재배치했다. 배치표는 `docs/18` T-11, 검수는 `docs/16` §25.

- **초보 광산은 광맥 칸 위에 세웠다** (오너 승인). 광맥 4개가 붙어 있어 두 광맥의 서쪽 앞칸이 다른 광맥 셀이다 — 피하면 5명 중 1명만 전용 광맥을 받는다. 일꾼은 발밑이 아니라 오른쪽 광맥을 캐므로 충돌이 없다.
- **그 과정에서 문서와 코드가 어긋난 것을 찾았다.** `docs/09` F6 §4 는 시작 셀에 *"Depot 와의 겹침만 예외 허용"* 이라 적어 점유 검사가 있는 것처럼 읽히지만, `ValidateLayout` 의 시작점 검사는 **workerIndex 범위·중복·walkable 네 가지뿐**이고 점유는 아예 안 본다. **문서를 코드에 맞춰 정정**했다(반대가 아니다). 점유 검사를 넣는 것은 별도 결정이고, 넣는 순간 이 배start가 검증 실패로 바뀐다.
- **검증 핵심**: 일꾼 2 를 사서 일꾼 1 의 프로그램을 **그대로 복사** 실행 → 같은 틱에 `mined cell 1,0`(W1) + `mined cell 2,0`(W2). 서로 다른 광맥 2개. 오류·경고 0건, 바인딩 114/0, 프로필 원복 `cart=0/20 workers=1`.
- **W2 는 캤지만 하역은 못 한다 — 의도된 결과다.** `U` 는 창고 칸에서만 성립하고 창고는 하나뿐이라, "즉시 채굴"과 "복사만으로 완전한 왕복"은 동시에 성립할 수 없다. C209 가 요구한 것은 앞쪽이다.

**⚠️ `audit_resave` 가 이 변경을 3개 맵 모두 `[정규화] · chore 로 분리해도 된다` 로 판정했다 — 거짓이다.** 함정 8 재발이고, 이번엔 `.ui` 가 아니라 `.map` 이었다. 그 도구의 값 신호 목록이 `.ui` 키 중심이라 `WorkerStartsJson` 같은 스크립트 컴포넌트 JSON 문자열을 못 본다. `docs/17` 함정 8 에 `.map` 4개 키를 보강했다. **근본 규칙 — 도구는 "Maker 가 건드린 것"과 "내가 건드린 것"을 구분하지 못한다.** 방금 `.map` 을 쓴 직후의 `[정규화]` 는 도구가 놓친 것이다.

**남은 것**: `tools/balance_sim.cjs` 의 `STARTS` 상수가 아직 옛 배치다(맵 레이아웃은 `.map` 에서 읽지만 시작 셀만 상수). 그래서 D9 §3.1 의 30→29→29→29 는 분산 이전 수치다 — `docs/22` §6-7 로 추적한다.

### 2026-08-14 — T-04 Phase 6: AI 몫(A1~A8) 완료 · 측정 방법을 세 번 틀렸다

Phase 6 의 AI 검증분을 끝냈다. **완료가 아니라 `⏳ 오너 청취·클릭 대기`** 다 — 소리와 버튼은 원천적으로 AI 가 판정하지 못한다. 결과·근거는 `docs/16` §24, 남은 오너 몫 목록은 §24.6.

- **cue 7종 전부 실제 이벤트 경로로 재생**됐고 쿨다운 `play`→`suppressed` 짝까지 잡혔다. 먼지 pivot 실측이 문서값(`-1.1115 / -0.2795`)과 정확히 일치했다. F5-1 은 뱃지 3종·stage 4종이 전부 확정값과 일치.
- **§22 가 남긴 숙제를 닫았다 — 타 맵 cue 차단의 런타임 직접 증거.** 플레이어가 `farm01` 에 있는 동안 `deep_mine` 에서 서버 이벤트 8건을 냈는데 cue 0건이었고, 같은 코드가 플레이어가 `gem_mine` 에 있을 때는 정상 재생했다. **양방향이 확인돼야 "가드가 동작한다"가 성립한다** — 한쪽만 보면 "그냥 안 나는 것"과 구분되지 않는다.
- **맵 2회 전환 뒤에도 BGM 무중단**(`IsPlayBGM=true`). F10 §1.1 의 `@Logic` 선택 근거가 실증됐다.

**측정 방법을 세 번 틀렸다. 이번 세션의 진짜 교훈은 이쪽이다.**

1. **엉뚱한 맵의 워커를 돌렸다.** Maker 의 열린 맵과 **플레이어가 실제로 있는 맵은 다르다**(프로필 `lastMineId` 가 이긴다). cue 0건을 보고 "배선이 깨졌나" 의심했는데 가드가 옳게 동작한 것이었다. **런타임 검증 첫 줄은 항상 `LocalPlayer.CurrentMap` 을 찍는 것.** 역설적으로 이 실수가 A6 의 가장 어려운 증거를 만들었다.
2. **marker 의 `@Sync ReserveStage` 에 직접 써서 stage 를 흩어 놓으려 했다.** 그건 시뮬레이터 상태의 **미러**라 다음 틱에 되돌아간다(되돌아가며 `vein_recover` 8건 발사가 증거). 권위 있는 경로는 `TryMine` 이다. 그리고 `TryMine` 으로 제대로 깎아도 `gem_mine` 은 6초 안에 전부 stage 3 으로 복귀해 **2홉 스크립트로는 라이브 분산을 못 잡는다** → stage 축은 매핑 계약을 읽어 판정하는 게 맞다.
3. **`anchoredPosition` 을 캔버스 좌표로 읽었다.** 앵커 기준 오프셋이라 좌우가 반대로 나왔다. `docs/17` 의 "눈으로 재지 말고 좌표를 찍어라"는 **좌표계를 확인한 뒤에만** 유효하다. 계산은 `.builder-work/phase6_a8_rects.cjs` 로 옮겼고 §12.1 기존값과 일치했다.

**남은 자동 검증 1건**: F5-2 의 5명 동시는 일꾼 1명이라 미실증. T-11 뒤에 함께 보는 게 싸다.

### 2026-08-14 — T-12-A: BGM 배선 · `PlayBGM` 루프 실측 · 감사 도구가 죽어 있었다

`SoundSettingsController` 신설(ClientOnly `@Logic`). **`@Logic` 인 이유가 이 티켓의 핵심**이다 — 맵 `@Component` 로 두면 `farm01 → deep_mine` 전환마다 곡이 처음부터 다시 시작한다(F10 §1.1). 볼륨 2종은 아직 코드 상수지만 `GetSfxVolume()`/`GetBgmVolume()` 은 **A 단계부터 노출**했다. B 단계가 값을 컴포넌트 필드로 흩어 놓으면 §1.2 함정(맵 3개에 인스턴스가 3개인 `MineSoundController.Volume` 에 설정값을 써 넣는 것)을 그대로 다시 밟는다.

- **검증**: 빌드 16건 전부 Info(baseline 동일, 타임스탬프 갱신 확인) · 런타임 83건 전부 Info, 오류 0 · 바인딩 감사 114건 실패 0 · 재저장분 없음. docs/16 §23.
- **`PlayBGM` 은 루프다 — 추정하지 않고 재서 알았다.** `.d.mlua` 설명은 `"Plays background music."` 뿐이고 반복 여부가 없는데, SFX 쪽엔 `PlaySound` 와 별개로 `PlayLoopSound` 가 있어서 1회 재생일 가능성이 남아 있었다. `IsPlayBGM()` 을 10초 간격으로 찍어 **곡 끝(141.5s)을 58.5초 넘긴 t=200s 까지 `playing=true`** 를 받았다. F10 §3.3 미결이 닫히고 §2.2 경계값 표(`SetBGMVolume` / Pause·Resume / `PlayBGM` 재호출 금지)가 그대로 유효해졌다.
  - **얻은 규칙 — 프로브는 스스로 닫히게 만든다.** `ProbeWindowSeconds`(200초) 를 넘기면 로그를 멈춘다. 상시 프로브로 두면 Phase 6 의 다른 검증 로그가 10초마다 밀려 묻힌다. 이 실측은 자산이 아니라 **API 의 성질**을 잰 것이므로 곡을 교체해도 다시 재지 않아도 된다.
- **`tools/audit_bindings.cjs` 와 `balance_sim.cjs` 가 이 컴퓨터에서 죽어 있었다.** `const ROOT = "D:/Develope_files/GitHub/Maple-Digger"` — 이전 컴퓨터의 절대 경로다. 저장소는 지금 `D:/Unity Project/Maple-Digger` 에 있어 `MODULE_NOT_FOUND` 로 즉사한다. 둘 다 `path.resolve(__dirname, "..")` 로 고쳤다.
  - **`docs/17` §9-4 가 적어 둔 "여기서 실패하면 환경이 덜 옮겨진 것"과 증상은 같고 원인은 다르다.** 스킬은 정상적으로 있었고, 저장소 위치가 다르면 무조건 죽는 구조였다. 즉 **DoD 의 "audit_bindings 실패 0건"이 이 컴퓨터에서 한 번도 통과된 적 없을 수 있다** — 도구가 돌지 않으면 0건인지 알 방법이 없다. **도구가 죽은 것과 검사가 통과한 것은 로그에서 구분되지 않는다.**
- **프로필은 원복할 것이 없었다.** 원장을 건드리지 않았고 `cart=0/20` 을 로그로 확인했다. 단 이 컴퓨터의 DataStorage 가 비어 `new profile ready` 로 새 프로필이 생성돼 `storage=0/0/0` 이다 — `docs/17` §0.2-A 의 baseline `stone=1` 과 다르지만 **이번 작업이 소비한 것이 아니라 새 계정 정상 초기값**이다.
- **부수 확인**: Maker 열린 맵이 `deep_mine` 이어서 Play 가 거기서 시작됐고, 그 덕에 **BGM 이 맵과 무관하게 재생된다는 것**이 실증됐다 — `@Logic` 이라 `MineSoundController` 의 `CurrentMap` 가드에 걸리지 않는다(F10 §3.2 의도대로).

**남은 것 (T-12-A 범위 밖)**: cue 볼륨 적용·슬라이더·프로필 저장은 T-12-B(선행 T-02). 곡·볼륨 균형 청취는 Phase 6 오너 몫이며 `docs/21` §3-B 승인란은 **그때 처음 채운다.**

### 2026-08-06 — T-04 Phase 5: 사운드 7종 배선 (잠정 RUID)

`MineSoundController` 신설(ClientOnly, 맵 3개 루트에 MapBuilder 로 부착) — cue 재생과
F5 §4 쿨다운만 담당. 행동(WorkerVisual)·중요 이벤트(MineNotice)·stage(VeinMarker) 쪽이
자기 채널의 중복 제거를 끝낸 뒤 cue 호출만 얹는다. 사운드 dedup 을 따로 만들면 두 추적이
어긋나기 때문. RUID 는 docs/21 §3 잠정값이고 청취 판정은 Phase 6 오너 몫.

- 검증: 7종 전부 실제 경로로 재생 로그 확보 + 쿨다운 play→suppressed 쌍. docs/16 §22.
- **함정 2개를 첫 Play 가 잡았다**: ① 접속 직후 `@Sync` 도착이 첫 페인트(기본값)를 "상승"
  으로 오인시켜 vein_recover 15개 일제 발사 → `RecoverySettleSeconds` 가드 (MineNotice 의
  settle 과 같은 함정 — **@Sync 파생 이벤트를 새로 만들 때는 항상 settle 가드부터**).
  ② `PlaySound` 는 전역이라 플레이어가 없는 맵의 cue 도 들린다 → `LocalPlayer.CurrentMap`
  가드. 타 맵 가드의 런타임 실증은 Phase 6 맵 전환 검증에서.

### 2026-08-06 — 채굴 먼지 세로 pivot 보정 신설 · "수명만 늘려 찍기"가 위치 판정에 틀린 이유

Phase 4 가 남긴 시각 판단 2건을 Play 로 판정하다가, **둘 다 예상과 다르고 대신 진짜 결함이 하나 있다**는 것을 알았다.

- **"먼지가 안전모를 덮는다"는 재현되지 않는다.** `shardOrder` 6 > 아바타 2 라 레이어는 앞이 맞지만, pivot 보정이 먼지를 셀 중심에서 왼쪽으로 1.11 unit 밀어 놓아 실제로는 일꾼 **옆**에 뜬다. 인수인계의 우려는 **코드 값만 보고 추정한 것**이었다. 곡괭이 상시 반짝임(`ShowDefaultWeaponEffects`)은 오너가 `true` 유지로 결정했다.
- **진짜 결함은 세로였다.** 컨트롤러에 `ShardPivotOffsetX` 만 있고 **Y 보정이 아예 없어서** 먼지가 광물보다 위에 떴다("광물 정중앙" 계약 위반). 같은 스프라이트의 세로 pivot 어긋남은 애초에 측정된 적이 없다. `ShardPivotOffsetY = -0.215`(스케일당)를 신설했다 — `ShardScale` 1.3 에서 -0.28 unit 이 광물 조각을 먼지구름 정중앙에 놓는다.
- **`HitFxOffsetY`(연출 의도)와 `ShardPivotOffsetY`(자산 결함 보정)는 일부러 분리했다.** 합치면 자산을 바꿀 때 무엇을 다시 재야 하는지 알 수 없어진다.

**얻은 규칙 — 애니메이션클립 자산은 "수명만 늘려 찍기"로 위치를 판정할 수 없다.** `de538ed7` 은 재생 중 **시각 중심이 프레임마다 이동한다** — 같은 설정으로 연속 촬영한 두 장의 모양·위치가 달랐다. `ShardSeconds` 만 늘리면 플레이어가 보지도 않는 후반 프레임을 재게 되고, 실제로 이 때문에 처음에 "왼쪽으로 치우쳤다"고 잘못 읽었다. **`PlayRate` 0.02 + `StartFrameIndex`/`EndFrameIndex` 0~1** 로 앞부분에 고정해야 한다. `docs/17` §0.1-A 의 검증 요령을 이 내용으로 정정했다. (수명 늘리기는 **"보이느냐"** 판정에는 여전히 유효하다 — 못 쓰는 것은 **"어디에 뜨느냐"** 다.)

**판정 셀에 실제 광물이 있어야 한다.** 처음엔 일꾼이 서 있던 `(0,0)` 에 띄웠는데 그 칸은 Depot 이라 "광물 중심"과 대조할 기준이 화면에 없었다. `vein-stone-01`(cell 1,0)로 옮겨서야 판정됐다.

**검증**: 빌드 오류 0건(baseline 16 Info, 타임스탬프 갱신 확인). 런타임 로그 82건 전부 `Info`, 오류·경고 0건. `dx=-1.1115 (expect -1.1115) dy=-0.2795 (expect -0.2795)` 정확히 일치. **서버 `EmitVisualEvent("mine_success")` → 클라 `OnUpdate` → `PlayActionEvent` → `ShowShard` → `MoveShardToCell`** 스택으로 실제 이벤트 채널 경로까지 확인했다(원장 무변경). 스크린샷으로 광물이 먼지구름 정중앙에 들어오는 것 확인. 프로필 baseline 원복 `cart=0/20 hand='' lastMine=farm01`, 바인딩 감사 114건 실패 0건.

### 2026-08-04 — T-04 Phase 4 (2/2 일부): 일꾼을 임시 몬스터 스프라이트에서 MSW 아바타로 교체

> 브랜치 `feat/t04-mine-fx-p4`. Phase 4 의 `rare_ore_unload` 중요 이벤트는 아직 남았다.

D5 §3 이 요구한 "MSW 아바타 기반 실루엣"을 넣었다. `SpriteRendererComponent`(임시 몬스터 `3e76c89a`)를 걷어내고 **`AvatarRendererComponent` + `CostumeManagerComponent`** 로 바꿨다. 작업 스크립트는 `.builder-work/p4_worker_avatar.cjs`.

- **두 곳을 같이 고쳐야 했다.** `Worker.model` 은 런타임 스폰되는 일꾼 2~5 를 덮고, **맵에 배치된 `Worker01` 은 모델 수정이 소급되지 않아** `farm01`·`deep_mine`·`gem_mine` 3개를 `upsertComponent` / `removeComponent` 로 따로 고쳤다. Phase 2 에서 이미 밟은 함정이라 이번에는 처음부터 같이 처리했다.
- **자산은 `docs/21` §4 확정값 4슬롯 + 기본 body.** 안전제일 모자 / 화이트루즈 멜빵 / 밀라노청바지 / 황금 곡괭이. 곡괭이는 **한손 슬롯**(`CustomOneHandedWeaponEquip`)이다. 런타임 확인 `equippedCount=6`(4슬롯 + body + 엔진 자동 head).
- **`UseCustomEquipOnly = true` 를 켰다.** 끄면 접속 계정의 기본 코스튬이 먼저 깔려 일꾼 외형이 계정마다 달라진다. 일꾼은 플레이어가 아니다.
- **`head` 는 대입할 슬롯이 없다.** `Custom*Equip` 17종에 `CustomHeadEquip` 이 없고 엔진이 `body` 색에 맞춰 자동 처리한다. `docs/21` §7.1 의 `head` RUID 는 참고값일 뿐이다. `CustomFaceEquip` 을 비워도 얼굴은 정상 렌더된다(실측).
- **`AvatarRendererComponent.OrderInLayer = 2`** — 교체 전 `SpriteRendererComponent` 와 같은 값을 유지했다. 선택 링(0)·광맥 marker(1) 위에 일꾼이 와야 한다.

**`StateComponent` / `AvatarStateAnimationComponent` 는 일부러 넣지 않았다.** `Global/Player.model` 은 이 둘을 함께 들고 있어서 그대로 따라가고 싶어지지만, **일꾼의 이동은 보간이 아니라 순간이동이다** — `WorkerController:DoMove` 가 `KinematicbodyComponent:SetWorldPosition` 으로 셀을 건너뛴다. 걷기 클립이 재생될 연속 구간 자체가 없으므로, 상태 스택을 넣으면 `IsLegacy` 기본값 함정과 `AddState` 권한(monster/NPC 는 ServerOnly) 문제만 떠안고 화면에는 아무 차이가 없다. 이동을 보간으로 바꾸는 날 `ChangeState("MOVE")` 한 줄로 붙일 수 있다.

**검증** (`farm01`, Play): 빌드 로그 16건 전부 `Info` LIA(기존 오탐), 오류 0건. 런타임 오류·경고 0건 — 특히 `[LEA-3004]` 없음. 아바타 교체 뒤에도 **Phase 4 연출이 그대로 동작**한다: `mine stone` → `[WorkerFx] shard on` → `shard off` 짝, 광맥 stage 2→3 회복, `special_vein_spawn` 토스트·marker 강조까지 재생됐다. 프로필 baseline 원복 확인 — `gold=0 stone=1 iron=0 goldOre=0 token=0 workers=1 rareColl=0/0/0 rareStore=0/0/0 cart=0/20 hand='' lastMine=farm01`. 바인딩 감사 114건 실패 0건.

**오너 판단 2건이 열렸다** (둘 다 한 줄 교체라 되돌리기 싸다):

1. **`pants`** — 승인란이 비어 있던 슬롯이다. → **오너가 `e6ff0ea6…`로 지정해 확정** (아래 항목 참조).
2. **채굴 먼지** — 오너가 "먼지는 아바타 만들어지고 확인하겠다"고 했던 항목이다. 최종 실루엣이 들어갔으니 이제 판정할 수 있다.

**곁가지로 발견한 것**: `ShowDefaultWeaponEffects` 기본값이 `true` 라 **곡괭이에 상시 반짝임이 붙는다.** 대기 중인 일꾼이 계속 반짝이므로 채굴 먼지와 신호가 겹친다고 판단되면 `false` 로 끈다.

### 2026-08-04 — T-04 Phase 4 완료: `rare_ore_unload` 중요 이벤트

Phase 4 의 마지막 항목이다. 희귀 광물을 Depot 에 하역하면 토스트로 알린다 (F5 §2.2).

- **서버**: `WorkerController:DoUnload` 가 수레를 비우면서 희귀 3종 합계를 세고, 0보다 크면 `VeinTickSimulator:EmitMineNotice("rare_ore_unload", cellX, cellY, rareTotal)` 를 **한 번** 부른다. 희귀 판별은 새 헬퍼 `IsRareOre` 로 모았다.
- **클라이언트**: `MineNoticeController:PlayNotice` 에 `rare_ore_unload` 분기 하나. 기존 `ShowToast` 를 그대로 쓴다.

**핵심 설계 판단 — 알림은 `AddToDepot` 이 아니라 `DoUnload` 에서 낸다.** 인수인계는 두 곳 중 하나라고 적어 뒀지만 **`AddToDepot` 은 틀린 선택이다.** 그 메서드는 광물 종류마다 호출되므로, 희귀 돌+철을 함께 실은 수레가 한 틱에 알림 2건을 만든다. 그러면 `MineNoticeController` 의 `noticeId > lastNoticeId + 1` 가드(놓친 이벤트 = 재생 건너뛰기, F5-5)에 걸려 **토스트가 통째로 사라진다.** 하역 1회당 1건이어야 F5 §4 의 "이벤트 ID당 1회" 쿨다운과도 맞는다.

**검증** — 희귀 드롭은 1% 라 기다릴 수 없어 수레를 직접 채워 3회 돌렸다. 특히 **희귀 2종을 함께 실어** 위 실패 경로를 실제로 쳤다:

- `stone=3 rare_stone=2 rare_iron=1` → `AddToDepot` **3회** 호출 · `notice id=1 kind=rare_ore_unload count=3` **1건만** · `[MineNotice] rare_ore_unload count=3` 재생. 일반 광물 3개는 count 에서 제외됐다
- `rare_gold=2` → `notice id=2 count=2` 재생 (id 연속이라 건너뛰기 없음)
- `[WorkerFx] depot emphasis` 도 함께 정상 재생 — 행동 이벤트 채널과 충돌하지 않는다

빌드 오류 0건(재빌드 타임스탬프 확인), 런타임 오류·경고 0건. 프로필 baseline 원복 `cart=0/20`, 바인딩 감사 114건 실패 0건.

> **토스트 화면 캡처는 실패했다.** 토스트 수명이 스크린샷 왕복(1~4초)보다 짧아 세 번 시도 모두 놓쳤다. 다만 `ShowToast(message)` 는 로그 줄보다 **먼저** 호출되고 `_UIToast` 가 nil 이면 `log_error` 를 내도록 돼 있는데 그 오류가 없었으므로, `[MineNotice] rare_ore_unload count=N` 이 찍힌 것은 토스트가 실제로 디스패치됐다는 증거다(verify-checklist Step 2b 가 허용하는 짝 로그). 토스트 렌더 자체는 `special_vein_spawn` 으로 이미 육안 검증된 경로다.

### 2026-08-04 — 채굴 먼지 3차 교체: 이펙트는 텍스트 검색으로 못 찾는다

오너 검수 "어울리지 않는다"로 채굴 파편을 세 번째로 골랐다. 확정은 **뭉게뭉게 피는 흰 먼지구름 `de538ed7`**, `ShardScale` **1.3**, 광물 **정중앙**(`HitFxOffsetY` 0.25 → **0**).

**텍스트 검색이 작동하지 않는다는 것을 이번에 확실히 확인했다.** `searchResources` 로 8가지 질의(한/영)를 돌려 39건을 모았는데 **전부 `names` 가 비어 있고 `score` 가 0.000** 이었다. `dname` 도 `sprite-8923707` 같은 일련번호뿐이라 메타데이터로 걸러낼 근거가 아예 없다. 실제로 띄워 보니 "먼지"로 잡힌 것 중에 **나무 상자**와 **검은 연기**가 있었고, 이미 기각한 `d4f82b52`·`6ade17ad` 도 그대로 다시 올라왔다.

**해법은 `findSimilarResources` 였다.** 이미 옳다고 판정된 자산을 씨앗으로 넣으면 시각적으로 닮은 것을 준다 — 2차 파편 `78ea5621` 을 씨앗으로 넣으니 **전부 `skill` 카테고리 애니메이션클립 12개**가 나왔고 확정안이 그중에 있었다. 다만 **씨앗은 연출이어야 한다**: `신비한 광석 hit1` 을 씨앗으로 넣었더니 바위·배경 스프라이트만 나왔다.

**pivot 이 중심이 아닌 스프라이트를 처음 만났다.** `de538ed7` 은 광맥 좌표에 그대로 놓으면 오른쪽으로 밀리고, **엔티티 `Scale` 이 pivot 오프셋까지 함께 키우므로 크기를 키울수록 더 밀린다.** 상수 보정으로는 크기를 바꿀 때마다 어긋나므로, `ShardPivotOffsetX`(= `-0.855` unit/scale)를 신설하고 `MoveShardToCell` 이 `ShardScale` 을 곱해 쓰도록 했다. 실측 근거는 scale 0.9/1.3/1.7 에서 85/125/165 px 이동(1 unit = 110 px)이고, 세 값 모두 ÷scale 이 95~97 로 일정했다. 앞서 쓰던 `78ea5621` 은 pivot 이 거의 중심이라 이 문제가 없었다 — **자산을 바꾸면 이 값을 다시 재야 한다.**

**검증**: 빌드 오류 0건(재빌드 타임스탬프 갱신 확인), 런타임 오류·경고 0건. 실제 채굴 경로에서 `shard on`/`off` 짝 재생, 파일값이 런타임에 그대로 실림(`ruid=de538ed7… scale=1.3 offsetY=0.0 pivotX=-0.855 order=6`), 보정 결과 `shard-vein dx=-1.1115` = `-0.855 × 1.3` 정확히 일치, Y 는 광맥과 동일(`0.5`). 프로필 baseline 원복 `cart=0/20 hand=''`, 바인딩 감사 114건 실패 0건, `.ui`/`.map` 재저장분 없음.

**남은 판단**: `ShardOrderInLayer` 6 이 일꾼(2)보다 앞이라 먼지가 안전모를 덮는다. 0.3초짜리라 실사용 문제인지는 오너 판단으로 열려 있다.

### 2026-08-04 — 일꾼 하의 교체 + "짧아 보인다"는 내 판정이 틀렸다

오너가 하의를 `e6ff0ea602e043f48a7e231ed4f95daf`로 지정했다. 템플릿과 맵 3개의 `Worker01`에 반영했다(`.builder-work/p4_worker_pants.cjs`). 슬롯 하나만 바꾸면 되므로 `upsertComponent`가 아니라 **`patchComponent`** 를 썼다 — 통째로 갈면 나머지 16슬롯을 다시 써야 한다.

**앞 항목에서 내가 적은 "밀라노청바지는 무릎 위에서 끊기는 짧은 하의"는 틀린 관찰이었다.** 두 후보를 `thumbnail://`로 나란히 띄워 보니 **둘 다 발목까지 오는 긴 청바지**다. 착용 화면에서 짧아 보였던 것은 바지가 아니라 **`coat`(화이트루즈 멜빵) 밑단이 허벅지까지 덮어서** 드러나는 청색 구간이 좁았기 때문이다. 실제 차이는 길이가 아니라 **채도** — 새 것이 더 진한 데님이라 흰 상의와 대비가 산다.

**얻은 규칙 — 착용 확인과 썸네일은 대체재가 아니라 순서다.** `msw-asset-verify`가 "아바타는 착용 스크린샷이 최종 판정"이라고 못박아 둔 것을 **슬롯 하나를 고르는 데까지 그대로 적용한 것이 실수**였다. 착용 화면은 위아래가 겹친 결과물이라, 거기서 개별 슬롯의 성질을 읽으면 이웃 슬롯의 효과를 그 슬롯의 것으로 오독한다. **슬롯 선택은 `thumbnail://`로 아이템 원본을 먼저 보고, 착용 확인은 전체 실루엣을 판정할 때 쓴다.** `docs/21` §4에 정정과 함께 남겼다.

**채굴 먼지 실측** (오너 검수용 근거): 위치는 `shard pos=(1.5, 0.75)` / `worker pos=(1.5, 0.5)` — **광맥 셀 중심 + `HitFxOffsetY` 0.25** 로 설계대로다. `ShardScale` 0.9, `OrderInLayer` 6. **6은 일꾼(2)보다 앞이라 먼지가 안전모를 덮는다** — 0.3초짜리라 실사용에서 문제인지는 오너 판단이고, 뒤로 보내려면 일꾼(2)과 광맥 marker(1) 사이에 값이 없으므로 일꾼 쪽을 올려야 한다.

**검증 과정에서 두 번 헛다리를 짚었다 — 다음 세션이 반복하지 않도록 남긴다.**

- **0.3초는 스크린샷 왕복(1~4초)에 절대 안 잡힌다.** Play 중 클라이언트에서 `WorkerVisualController.ShardSeconds`를 크게 올려 두고 캐면 잡힌다. 파일을 건드리지 않으므로 `stop` 한 번에 원복되고 F5 §3 계약값 0.3은 그대로다.
- **`shard on`/`off` 로그 타임스탬프와 스크린샷 시각을 대조할 것.** 수명 밖에서 찍은 스크린샷을 "먼지가 안 보인다"로 오독할 뻔했다.
- **광맥 결정(청록)과 먼지(흰색)가 화면에서 헷갈린다.** 판정할 때는 `VeinMarker` 스프라이트를 잠시 꺼서 **먼지만 남긴 화면**으로 본다. 단 `VeinMarkerController.Repaint`가 매 프레임 `Enable`을 되돌리므로 끈 직후에 찍어야 한다.

**검증**: 빌드 오류 0건, 런타임 오류·경고 0건. 프로필 baseline `gold=0 stone=1 iron=0 goldOre=0 token=0 workers=1 rareColl=0/0/0 rareStore=0/0/0 cart=0/20 hand='' lastMine=farm01`. 바인딩 감사 114건 실패 0건. `.ui` 재저장분 없음.

### 2026-08-04 — 8차 세션 마감: 프로필 원복이 불완전했다

- 세션을 닫으며 baseline 을 확인하다 **수레 용량이 `0/21`** 인 것을 발견했다. baseline 은 20이다.
- 원인: 검증용 채굴 루프를 여러 번 돌리는 동안 **1% 확률로 희귀 돌이 떨어져 컬렉션이 2단계까지 올랐고**, 그 패시브가 수레 용량 보너스로 남아 있었다. 세션 중 `[RESTORE]` 로그는 `gold/stone/iron/goldOre/mineTokens` 만 되돌렸다.
- **세션 중 "프로필 baseline 원복 완료"라고 보고한 것들은 이 항목에서 불완전했다.** 화폐는 맞았지만 희귀 컬렉션이 남아 있었다. 스크린샷의 `일꾼 1 수레: 1 / 21` 에 이미 드러나 있었는데 읽지 못했다.
- `rareCollection` · `rareStorage` 6개 필드를 함께 0으로 되돌려 해소했다. 최종 확인: `gold=0 stone=1 iron=0 goldOre=0 token=0 workers=1 rareColl=0/0/0 rareStore=0/0/0 cart=0/20 lastMine=farm01`.
- **원복 절차를 `docs/17` §0.2-A 로 못 박았다** — 되돌릴 필드 전체와 판정 기준(`cart=0/20`)을 명시했다. `cart` 가 20이 아니면 희귀 컬렉션이 남은 것이다.

### 2026-08-04 — 오너 검수 반영: 파편을 광맥 위치로 · 펄스 곡선 · 자산 2종 기각

첫 구현을 오너가 눈으로 보고 준 지적 3건을 반영했다. **셋 다 로그로는 통과였고 화면에서만 드러났다.**

- **파편은 일꾼이 아니라 광맥에서 난다** (오너: "파편은 광석 위치 중심에 발생할 것"). 원래는 일꾼의 자식 엔티티였다. 맵의 자식으로 바꾸고 **Phase 1 이 만든 `VisualEventCellX/Y`** 로 채굴한 셀에 놓는다.
  - 부수 효과가 크다 — 파편이 일꾼 스프라이트 크기와 **무관해졌다.** 자식으로 두면 임시 몬스터(세로 1.8 unit) 기준으로 오프셋을 잡아야 하고, 아바타로 교체하면 그 값이 전부 무효가 된다. 셀 기준이라 교체해도 그대로다.
- **Depot 펄스가 "커지는 순간" 없이 줄기만 했다** (오너: "커진 상태에서 작아진 것만 보인다"). 최대 크기에서 시작하는 선형 감소였다. `sin` 곡선으로 바꿔 0에서 커졌다 작아지게 했다.
- **파편 자산 2종을 기각했다.** 월드에 띄워 실물을 보니 `docs/21` §5 의 설명과 달랐다.
  - `d4f82b52` "돌 파편 흩어짐" → 실제로는 **어두운 얼룩**. 초록 바닥에서 잔디와 구분되지 않는다(오너: "그림자가 생기는 느낌")
  - `6ade17ad` "작은 노란 스파크" → 실제로는 **보라색 광석 덩어리**
  - **C206(부유석 condition 오해)과 같은 종류의 오류다.** 두 자산 모두 §5 승인란이 비어 있었고 육안 미확인 상태였는데, 그걸 확인 없이 코드에 넣은 것이 잘못이었다.
- **재검색 → 흰 먼지 퍼짐(`78ea5621`)으로 확정.** `etc` 카테고리 스프라이트 후보 6종을 월드에 한 줄로 띄워 비교했는데 전부 FX 가 아닌 잡다한 스프라이트였다. 대신 §5 가 고갈 연출 후보로 적어 둔 흰 먼지가 **초록 바닥에서 유일하게 확실히 읽혀** 채굴 파편으로 승격했다. `docs/21` §5 갱신.
- **얻은 규칙**: 자산은 **검색 결과 설명을 믿지 말고 월드에 띄워 보고 고른다.** 이번에 후보를 나란히 놓고 스크린샷으로 판정한 방식이 C206 때와 같고, 그때도 이 방식으로만 오해가 잡혔다.

### 2026-08-04 — T-04 Phase 4 (1/2): 일꾼 연출 — 선택 링 · 채굴 파편 · Depot 강조

> 브랜치 `feat/t04-mine-fx-p4`. Phase 4 의 **아바타 교체**와 `rare_ore_unload` 중요 이벤트는 아직 남았다.

- **Phase 1 이 만든 행동 이벤트 채널(`VisualEvent*`)이 드디어 소비된다.** 지금까지 서버는 `mine_success`/`unload_success` 를 발행만 하고 아무도 읽지 않았다. `WorkerVisualController`(ClientOnly) 를 신설해 읽는 쪽을 붙였다.
- **선택 링** — `docs/21` §5 승인 자산. 발밑에 깔리는 타원이며 **표시 여부는 프로그램 편집기의 선택값(`_BlockProgramController:GetSelectedWorkerIndex()`) 하나만 따른다**(F5 §3 / §5.3). HUD 가 인덱스를 따로 들면 둘이 어긋나므로 기준을 하나로 뒀다.
- **채굴 파편** — `mine_success` 에 0.3초 표시(F5 §3). 스폰/파괴를 반복하지 않고 **자식 엔티티 하나를 켜고 끈다** — 채굴은 틱마다 일어나므로 매번 생성하면 churn 이 크다.
- **Depot 강조** — `unload_success` 에 Depot marker 를 펄스시킨다. **강조는 marker 자신이 그린다**(`VeinMarkerController:PlayEmphasis()` 신설). 일꾼 쪽에서 Depot 의 `Transform.Scale` 을 직접 만지면 marker 의 `Repaint` 와 매 프레임 다툰다 — 같은 값을 두 컴포넌트가 쓰지 않게 소유자를 하나로 정했다.
  - 이 과정에서 **기존 펄스의 버그를 하나 고쳤다.** 펄스 종료 시 `SpecialScale`(1.0) 로 되돌리고 있어, Depot(1.0)은 우연히 맞았지만 일반 광맥(0.7)에 쓰면 크기가 굳어 버린다. `Repaint` 가 정한 값을 `restScale` 로 기억해 그리로 돌아가게 했다.
- **자산은 런타임 자식 엔티티로 붙인다** — D-14 와 같은 방식. 공용 템플릿 `FxSprite.model`(신규, `model://fxsprite`)을 쓴다. 맵 파일에 FX 엔티티를 심지 않으므로 일꾼이 늘어도 맵 수술이 없다.
- **부착 범위**: 일꾼 2~5 는 런타임 스폰이라 `Worker.model` 에 붙이면 따라오지만, **`Worker01` 은 맵에 배치돼 있어 모델 수정이 소급되지 않는다**(Phase 2 함정). 3개 맵의 `Worker01` 에 `upsertComponent` 로 따로 더했다. 링이 발밑에 깔리도록 일꾼 `OrderInLayer` 를 2 로 올렸다(링은 0).
- **검증**: 빌드 오류 0건. 5회 반복 프로그램을 돌려 로그 101건 전부 `Info`, 오류·경고 0건. `[WorkerFx] ready` 1회, **`shard on`/`shard off` 각 5회(짝이 맞음)**, `depot emphasis` 5회 — 채굴 5회·하역 5회와 정확히 일치한다. 선택 링은 스크린샷으로 발밑 표시를 확인했다.
  - **파편은 0.3초라 스크린샷으로 잡히지 않는다.** verify-checklist Step 2b 대로 생성·소멸 로그를 짝으로 남겨 1회 재생을 판정했다.
- 검증 뒤 프로필 baseline 원복(돌 19 → 1). 바인딩 감사 114건 실패 0건.

### 2026-08-04 — D-14 수정: 광물 종류 아이콘 뱃지 (Phase 3.5)

- `RootDesk/MyDesk/Models/Mine/OreBadge.model`(신규, `model://orebadge`)과 `VeinMarkerController`의 뱃지 로직으로 D-14를 해소했다. 돌·철·금이 이제 형태와 색으로 구분된다.
- **런타임 자식 엔티티로 만든 이유.** `.map` 3개에 이미 배치된 marker가 35개다. 자식 뱃지를 파일에 심으려면 맵을 전부 수술해야 하고, Phase 2에서 이미 같은 이유로 38개 인스턴스에 `upsertComponent`를 돌린 적이 있다. 뱃지는 **서버 상태가 없는 표시 전용**이라 F5 §1의 책임 분리상 클라이언트 몫이고, `SpawnByModelId`를 클라이언트에서 부르면 **클라이언트 로컬 엔티티**가 만들어진다(workspace.md "Local Entity"). 부모 marker의 자식으로 붙이면 맵을 떠날 때 함께 사라진다.
  - `SpawnByModelId`는 `.d.mlua`에 `@ExecSpace`가 없다 — 호출한 쪽에서 실행된다. 그래서 ClientOnly 컨트롤러에서 부를 수 있다.
  - **앞으로 marker를 추가해도 맵 수술이 필요 없다.** 컨트롤러가 붙는 순간 뱃지도 따라온다.
- 뱃지는 `OreType`으로만 결정되고 stage 변화에는 반응하지 않는다. **고갈(stage 0)에서도 유지**한다 — 무슨 광맥이었는지 알아야 회복을 기다린다(docs/21 §1.3). `OrderInLayer`는 부모(1)보다 위인 5.
- **검증은 `gem_mine`에서 했다** — 세 광물이 한 화면에 있는 유일한 맵이다. marker 18개 중 17개(Depot 제외) 부착, 세 종류가 서로 다른 승인 RUID, stage 3·2·1·0에서 같은 뱃지 유지. 카메라를 금 광맥 옆으로 옮겨 **금은 노란 뱃지, 돌·철은 회색 계열**로 눈에 구분되는 것까지 스크린샷으로 확인했다.
- **남은 판단**: 뱃지가 docs/21 §1.3의 "좌상단 또는 상단 중앙"이 아니라 우상단 쪽에 붙는다. 광맥을 가리지 않아 그대로 뒀다.

### 2026-08-04 — `.ui` 컴포넌트 제거가 런타임에 소급되지 않는다 (파일 감사의 한계)

- D-14를 고치다 **Phase 3에서 고쳤다고 보고했던 겹쳐 찍힘이 실제로는 살아 있었다**는 것을 발견했다. `UIBuilder.text()`가 붙인 레거시 `TextComponent`를 `removeComponent`로 지웠고 **`.ui` 파일에서는 정말로 사라졌는데**(`componentNames`와 원본 `@components` 배열 둘 다 확인), Maker에 이미 임포트된 엔티티에는 남아 HUD에 `Text`가 계속 찍히고 있었다.
- **왜 놓쳤나 — 감사를 파일에서만 돌렸다.** 07-31의 "렌더러 2개 동시 보유 0건" 전수 확인은 `.ui`/`.map` 파일을 훑은 것이라 통과로 나왔다. 런타임에는 1건이 남아 있었다. **파일이 맞다는 것은 화면이 맞다는 뜻이 아니다.**
- 런타임 감사를 도입했다 — Play 중 client 스크립트로 `/ui/<Group>`을 재귀 순회해 `TextComponent`와 `TextGUIRendererComponent`를 동시에 가진 엔티티를 센다. 수정 전 `scanned=139 dualRenderer=1`, 수정 후 `0`.
- **해결은 컴포넌트가 아니라 엔티티를 새 UUID로 다시 만드는 것**이다(`.builder-work/d14b_respawn_special_text.cjs`). 컴포넌트 제거는 소급되지 않지만 엔티티 교체는 통한다. Maker 재시작으로도 풀릴지는 확인하지 않았다 — 새 UUID 쪽이 Maker 상태에 의존하지 않아 확실하다.
- Phase 2의 "`.model` 수정이 배치된 인스턴스에 소급되지 않는다"와 **같은 계열의 세 번째 사례**다. MSW에서 "파일을 고쳤다"는 "런타임이 그렇게 돈다"를 의미하지 않는다.

### 2026-08-04 — 3광산 전수 검증에서 D-14 발견 (광물 종류 구분 없음)

- Phase 3까지의 검증이 전부 **`farm01` 한 맵**에서만 이뤄졌다는 것을 깨닫고 세 맵을 모두 돌렸다. `MineTransitionService:TransitionPlayerToMine`을 서버 컨텍스트에서 직접 불러 전환했다 — 해금 플래그를 건드리지 않으므로 프로필을 오염시키지 않는다.
- **중요 이벤트 채널은 세 맵 모두 정상이다.** 맵 전환 때마다 `[MineNotice] ready map=<맵>`이 다시 찍히고 새 기준선을 잡는다. 컨트롤러를 `@Logic`이 아니라 맵 컴포넌트로 둔 판단이 여기서 값을 했다 — `@Logic`이었다면 이전 맵의 `NoticeId`를 들고 와 첫 알림을 삼켰을 것이다.
- **F5-1은 부분 통과다.** stage 0~3을 강제로 흩어 놓고 클라이언트에서 실측한 결과 C206 매핑(`3=condition1 / 2=stand / 1=condition4 / 0=condition5`)과 정확히 일치했고 `Scale`도 0.7이었다. **그러나 돌·철·금이 같은 stage에서 완전히 같은 스프라이트였다.**

  ```
  stone:s3=0f44530d/c0   iron:s3=0f44530d/c0   gold:s3=0f44530d/c0
  gold:s2=a0bd28cb/c0    gold:s1=2daf76de/c0   gold:s0=40c805ea/c0
  ```

- **D-14로 등록했다** (`docs/16` §18). C205가 정한 광물 종류 아이콘 뱃지(자식 엔티티)가 미구현이고 `VeinMarkerController`가 `OreType`을 아예 읽지 않는다. 실측에서 모든 marker의 자식 수가 **0**이었다. D5 §8 **V1** 위반이다.
- **왜 6차 세션까지 안 드러났나 — 검증 맵이 결함을 숨겼다.** `farm01`은 돌 전용이라 "전부 같은 모양"이 정상으로 보인다. 두 종류 이상이 섞인 맵에서만 드러난다. **한 맵에서만 검증하면 그 맵의 데이터가 우연히 가려 주는 결함은 통과로 판정된다** — 앞으로 시각 계약은 가장 다양한 데이터를 가진 맵(`gem_mine`)에서 판정한다.
- **Phase 표의 구멍이 근본 원인이다.** 뱃지는 Phase 2(광맥 stage 시각화)에도 Phase 4(일꾼 연출)에도 들어 있지 않았다. 어느 Phase의 몫인지 정해지지 않은 항목은 **아무도 하지 않는다.** Phase 3.5로 명시했다.
- 자산은 이미 있다 — 아이콘 RUID 3종은 `docs/20` §0 승인 완료, 구현 형태는 `docs/21` §1.3. 서버가 `VeinMarker.OreType`을 이미 `@Sync`로 내려보내므로 **클라이언트만 고치면 된다.**
- 검증 후 프로필은 baseline 그대로였다: `gold=0 stone=1 iron=0 goldOre=0 token=0 workers=1 lastMine=farm01 cart=0/20 rareColl=0/0/0 rareStore=0/0/0`.

### 2026-07-31 — T-04 Phase 3: 중요 이벤트 채널과 특별 광맥 토스트

> 브랜치 `feat/t04-mine-fx-p3` (Phase 1·2는 PR #2로 `main`에 병합 완료). Phase 4~6은 미착수다.

- **중요 이벤트 채널을 `VeinTickSimulator`에 신설했다** — `NoticeId` / `NoticeKind` / `NoticeCellX` / `NoticeCellY` / `NoticeCount`, 그리고 상태 복구용 `ActiveSpecialCount` (F5 §2.2). 일꾼의 행동 scalar(`WorkerController.VisualEvent*`)와 **다른 채널**이다. 행동 이벤트는 놓쳐도 그만이지만 중요 이벤트는 "놓쳤다"는 사실 자체를 알아야 하므로 판정 규칙이 다르다.
  - `EmitMineNotice`는 **`NoticeId`를 마지막에 쓴다.** 새 id를 본 클라이언트는 반드시 짝이 맞는 kind·cell·count를 함께 본다(Phase 1 `EmitVisualEvent`와 같은 규칙).
  - **`NoticeId`는 `LoadLayout`에서 리셋하지 않는다.** `LoadLayout`은 맵 전환마다 다시 도는데 거기서 id를 되돌리면 클라이언트가 이미 본 id가 재사용돼 중복 제거가 깨진다. 초기화는 `OnBeginPlay` 한 곳뿐이고, `ActiveSpecialCount`만 `LoadLayout`에서 0으로 되돌린다.
  - 스폰 알림은 **묶음당 1회**다(F5 §4 "스폰 묶음당 1회"). `TrySpawnSpecialVeins`가 2개를 만들어도 notice는 하나이고 대표 위치는 첫 광맥 셀이다.
- **`MineNoticeController`(ClientOnly) 신설.** `@Logic`이 아니라 **맵 엔티티 컴포넌트**다 — `@Logic`은 맵 전환 후에도 살아남아 이전 광산의 기준선을 들고 다니므로 중복·누락이 생긴다(AGENTS "Script lifecycle").
- **재접속 중복 방지는 3중 가드다** (F5-5).
  1. **최초 관측**(`lastNoticeId < 0`)은 재생하지 않고 기준선만 잡는다 — 접속 전 이벤트의 소급 재생 방지.
  2. **`OnBeginPlay` 후 1초**(`SyncSettleSeconds`) 안의 변화도 기준선만 옮긴다. `@Sync`는 맵 로드 직후 한 박자 늦게 도착하므로, 이 구간의 변화는 새 이벤트가 아니라 "뒤늦게 도착한 값"이다. 1번 가드만으로는 서버가 이미 id=1이었던 경우를 못 거른다.
  3. **id가 2 이상 건너뛰면** 몰아서 재생하지 않고 건너뛴다. 대신 HUD의 `ActiveSpecialCount`가 현재 상태를 그대로 보여 준다 — F5 §2.2의 "놓치면 HUD 현재 상태로 복구 가능해야 한다"가 이 설계의 근거다.
- **스폰 강조는 크기 펄스**(0.6초, 1.6배→1.0배)다. `docs/21` §5.1대로 회복·출현용 파티클 자산이 없어 별도 VFX를 넣지 않았다. 첫 페인트(`isFirstPaint`)에서는 펄스를 걸지 않는다 — 접속 시점에 이미 활성인 특별 광맥까지 강조하면 재접속마다 스폰 연출이 반복된다.
- **HUD에 특별 광맥 행을 추가했다.** `MineHUD/Panel` 430→466px, `SpecialText` y=-332, `BtnInventory` -334→-370. **`MineSelectUI/BtnOpen`도 36px 함께 내렸다**(-466→-502) — 우측 버튼 스택은 HUD 패널 바로 아래 12px 간격에 붙어 있어 패널만 늘리면 겹친다(F5 §6.1 "상시 표시 요소는 겹치지 않는다").
- **검증**: 빌드 오류 0건(baseline 16 Info 유지). `[VeinTick] notice id=1 kind=special_vein_spawn cell=(1,1) count=2 activeSpecial=2` → `[MineNotice] special_vein_spawn count=2 cell=(1,1)` **1회**, `[VeinMarkerFx] special spawn emphasis` 2개 marker. 토스트 "특별 광맥 출현! 2곳 · 위치 (1, 1)"을 스크린샷으로 확인했다. **id를 서버에서 1→6으로 강제로 건너뛰자 `[MineNotice] skipped stale notices from=1 to=6`이 찍히고 토스트는 뜨지 않았다** — F5-5 경로의 직접 증거다. 바인딩 감사 114건 실패 0건.
- **새로 알아낸 함정 2개**
  - **`UIBuilder.text()`는 레거시 `MOD.Core.TextComponent`를 함께 붙인다.** 기존 HUD 행은 `TextGUIRendererComponent` 하나만 갖는데, 새 행에는 렌더러가 둘이 생겨 **같은 자리에 문자열 두 개가 겹쳐 찍혔다.** 컨트롤러가 갱신하는 쪽은 `TextGUIRendererComponent`뿐이라 나머지 하나는 생성 시점 문자열("활성 0곳")에 멈춘 채 남는다. 좌표·텍스트 덤프는 정상으로 보이므로 **스크린샷 없이는 잡히지 않는다.** 새 텍스트 행을 만들면 `removeComponent(..., "MOD.Core.TextComponent")`로 정리하고, 기존 행과 `componentNames`를 대조한다.
  - **UIBuilder 검증기가 엔진 26.7과 어긋나 `.ui` 쓰기를 전부 막았다** — 아래 별도 항목.

### 2026-07-31 — UIBuilder `U002`가 모든 `.ui` 쓰기를 차단 (도구 수정)

- Phase 3의 HUD 작업에서 `UIBuilder.write()`가 `U002: ...TextGUIRendererComponent.Font must be int32. Got "Default"`로 **모든 `.ui` 파일에서 실패**했다. `validate()`를 돌려 보니 `MineHUD` 9건 · `MineSelectUI` 40건 · `MineInventoryUI` 9건 · `BlockProgramUI` 23건 · `AccountRecoveryUI` 4건이었다. 즉 **T-01 이후 `.ui`를 한 번도 못 고치는 상태였다.**
- 원인은 파일이 아니라 **도구**다. `Environment/NativeScripts/Component/TextGUIRendererComponent.d.mlua`가 `property string Font = "Default"` · `property float FontSize = 20`으로 선언하는데, 스킬의 `msw_ui_builder.cjs`가 두 필드를 `INT32_COMPONENT_FIELDS`에 넣어 정수를 강제하고 있었다. 엔진 26.7 재저장으로 파일에 `"Default"` / `""` / `"0"` 같은 문자열이 들어오면서 드러났다.
- **파일 쪽을 고치면 안 된다.** `Font`를 정수로 바꾸면 전 행의 글꼴이 바뀌고 다음 Maker 저장에서 되돌아간다. `.d.mlua`가 기준이므로 **검증기에서 `Font`를 빼고 `FontSize`를 실수 필드로 옮겼다.**
- 수정 대상은 `.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs`였고 도구 전용 커밋(`edc346e`)으로 분리했다.
- **후속 (2026-08-04): 스킬 플러그인 업데이트가 상위에서 같은 문제를 제대로 고쳤다.** 갱신된 빌더는 `Font`/`FontSize`가 여전히 정수 목록에 있는데도 8개 UI 파일 전부 `validate()` 오류 0건이다 — 검사 방식 자체가 바뀌었다. **`edc346e`의 2줄 패치는 이제 불필요하다.** 도구 문제를 로컬에서 우회했을 때는 상위가 고쳤는지 주기적으로 확인해야 패치가 유령으로 남지 않는다.
- **앞으로 같은 종류를 판별하는 법**: `U002`/`U003`/`U004`가 건드리지도 않은 엔티티에서 무더기로 나오면 파일이 아니라 검증기를 의심한다. 근거는 항상 `Environment/NativeScripts/Component/*.d.mlua`의 `property <타입>` 선언이다.

### 2026-07-31 — 엔진 26.7 재저장분 정리와 GroupOrder 복구

- 4차 세션 이후 `ui/` 8개와 `map/farm01.map`이 **미커밋 상태로 남아 있었다.** 파일 mtime이 전부 `2026-07-30 08:27:14` 1초 안이고 내장 `CoreVersion`이 `26.5.0.0 → 26.7.0.0`으로 바뀐 것으로 보아, Maker가 엔진 업그레이드 후 일괄 재저장한 결과다. `Environment/config`도 `26.7.0.0`이므로 버전 자체는 정상이다.
- 재저장분의 대부분은 무해한 정규화다: `Rotation`/`ZRotation` 필드 추가, `Position`에 앵커 해석값 기입, float32 반올림(`0.10196078431372549 → 0.101960786`), 자식 `displayOrder` 1칸 당김(상대 순서 보존).
- **그러나 `UIGroupComponent.GroupOrder` 3개가 함께 되돌아갔다** — `PopupGroup 10→3`, `ToastGroup 20→4`, `AccountRecoveryUI 50→6`. 나머지 5개는 그대로여서 상대 순서가 깨졌고, 토스트와 복구 오버레이가 다시 모달 아래로 내려갔다. D-1·D-3에서 맞춘 F5 §6.2 계층이 무효화된 상태였다.
- UIBuilder(`patchComponent`)로 세 값을 10·20·50으로 복구했다. `refresh` 뒤 Build Console 16건 전부 `Info`(baseline 동일, 새 오류 0건), Play에서 UI 컨트롤러 4개 정상 초기화, `[VeinTick] layout loaded mineId=beginner_mine veins=4 starts=5 specialCandidates=3 depot=(0,0)`, `[Worker 1] configured cart=0/20 hand=`, `owned workers restored count=1`, `schema=7 gold=0`을 확인했다. 바인딩 감사도 실패 0건/정상 113건이다.
- **새로 확인한 엔진 동작: `GroupOrder`는 로드 시 0..N 밀집 수열로 재압축된다.** 런타임 실측값은 `DefaultGroup 0 / BlockProgramUI 1 / MineHUD 2 / MineInventoryUI 3 / MineSelectUI 4 / PopupGroup 5 / ToastGroup 6 / AccountRecoveryUI 7`로, 파일의 5·7·10·20·50과 다르다. **절대값은 살아남지 않고 상대 순서만 의미가 있다.** 2026-07-30 기록의 "현재 `GroupOrder`는 생성 순서대로 0~7"이라는 관측은 원본 값이 아니라 이 압축된 런타임 값을 본 것이다.
- 따라서 계층 검증은 파일 값이 아니라 **런타임 상대 순서**로 판정해야 한다. 확인 방법은 Play 중 `maker_execute_script`(client)로 `/ui/<Group>`의 `UIGroupComponent.GroupOrder`를 찍어 보는 것이다.
- Maker 작업 후에는 `git status`로 `.ui`/`.map` 재저장분을 반드시 확인한다. 정규화에 섞여 들어온 계층 회귀는 화면을 켜 보기 전에는 드러나지 않는다.

### 2026-07-31 — 서버 거절 사유 카탈로그(F8) 신설

- `docs/23-서버-거절-사유.md`를 신설했다. D-10("판매가 안 되는데 이유를 알 수 없다")이 **화면 하나의 문제가 아니라 구조의 문제**임을 정리하고, 거절 사유 전수 카탈로그에 **문구가 바뀌어도 유지되는 안정 코드**를 부여했다.
- **코드 전수 조사에서 문구 불일치 3건을 찾았다.** `ProgressionService`(선검증)와 `AccountProfileService`(최종 검증)가 같은 조건에 각각 메시지를 쓰는데 문장이 다르다 — 미보유 일꾼 수레 강화, 수레 최대 용량이 서로 다른 문구이고, 일꾼 5명 초과는 **같은 문자열이 두 파일에 복제**돼 있어 한쪽만 고치면 조용히 갈라진다. 어느 쪽이 먼저 걸리느냐에 따라 사용자가 보는 문장이 달라진다.
- **`LastTransactionMessage`가 전역 슬롯 하나**라는 구조적 한계를 정리했다. 성공·실패가 같은 필드를 공유하고 요청 식별자가 없어, 백그라운드 자동 판매가 사용자 요청의 실패 사유를 덮어쓸 수 있다. 지우는 시점도 정의돼 있지 않다.
- **표시 자리가 2곳뿐**임을 확인했다(`MineSelectUI` SelectPanel · 판매 패널). 판매 패널 슬롯은 D-10을 고치며 급히 추가한 것이고, T-03·T-05·T-06은 자리가 없어 그대로 재발한다.
- **자동화 틱 실패는 화면에 전혀 나타나지 않는다** — `vein_empty` / `hand_full` / `cart_full` / 맵 전환 거절 4종이 로그만 남는다. D9 §5.2가 발견한 "일꾼 2를 사도 채굴량 0"이 사용자에게 보이지 않는 이유가 이것이다.
- 신규 화면이 지킬 **계약 5개**(§5)와 T-02·T-05·T-06이 추가할 거절 경로(§6)를 미리 잡았다. 정리 권고 6건 중 **1~4번(문구 통일·부족분 숫자·롤백 명시·버그성 거절 분리)은 T-02 착수 전에 처리하는 것이 싸다.**

### 2026-07-31 — T-04 Phase 1·2 구현: 광맥이 화면에 나타났다

> 브랜치 `feat/t04-mine-fx`. Phase 3~6은 미착수다.

- **"채굴이 눈에 안 보인다"의 실제 원인은 연출 부실이 아니었다.** 광맥 marker는 `TransformComponent` + `script.VeinMarker`만 든 **빈 엔티티**였고 렌더러가 아예 없었다. 일꾼도 행동 이벤트를 내보내지 않았다. 즉 클라이언트가 읽을 입력 자체가 없었다.
- **Phase 1 — 서버 동기화 표면** (`3d977a1`). `VeinMarker`에 `CellX/CellY/ReserveStage/OreType/IsActive/VisualRevision` `@Sync`를 신설하고, `WorkerController`에 `VisualEventSequence/Kind/CellX/CellY`를 신설했다(F5 §2.1·§2.2).
  - marker 셀은 **저작된 marker 위치에서 얻는다.** 별도 property를 두면 광맥 정의와 이중 관리가 되고, RectTile에서 1셀 = 1 world unit이라 저작 위치가 이미 셀 좌표와 정확히 일치한다. 대신 등록 시점에 광맥 테이블과 대조해 어긋나면 `log_error`를 남긴다.
  - `ApplyVeinState`는 **값이 실제로 바뀔 때만** `VisualRevision`을 올린다. 매 틱 호출되므로 무변경 경로가 `@Sync`를 건드리면 안 된다.
  - `SyncMarkerVisuals`는 `AdvanceTick`(회복) → `AdvanceWorkers`(채굴) **뒤에 한 번** 돈다. 틱 중간 상태가 클라이언트에 보이지 않는다. 변경 지점마다 배선하는 방식보다 단순하고, 새 광맥 종류가 생겨도 배선을 빠뜨릴 수 없다.
  - `EmitVisualEvent`는 **Sequence를 마지막에 쓴다.** 새 Sequence를 본 클라이언트는 반드시 짝이 맞는 kind와 cell을 함께 본다.
- **Phase 2 — 광맥 stage 시각화** (`dc5ed1f`). `VeinMarkerController`(ClientOnly) 신설. `MarkerKind`로 분기해 depot은 금속 광차, special은 `IsActive`일 때만 신비한 광석, normal은 `ReserveStage`로 부유석 condition을 고른다. RUID는 `docs/21` §7.1 확정값이다.
  - **모델을 고쳐도 이미 배치된 인스턴스에는 소급되지 않는다.** 맵 엔티티의 `componentNames`가 로드 시 기준이기 때문이다(builder-protocol-map §1.4). `placeModel`로 다시 놓으면 `MarkerId`가 날아가므로 **38개 인스턴스에 `upsertComponent`로 더했다**(farm01 8 / deep_mine 12 / gem_mine 18). 모델도 함께 고쳐 앞으로 배치될 marker는 그냥 맞는다. 작업 스크립트는 `.builder-work/attach_marker_renderer.cjs`.
  - **RUID를 비우는 대신 렌더러를 끈다.** 빈 `SpriteRUID`는 오류 없이 사라져 "숨김"과 "버그"를 구분할 수 없다(platform.md §7).
  - 부유석은 `Scale` **0.7**로 줄인다. 원본 1.44 unit은 한 셀을 세로 44% 넘어 위아래 칸과 겹친다(C206).
- **검증**: 빌드 오류 0건(baseline 16 Info 유지). 스크린샷에서 광맥 4개 + Depot 광차 확인, 특별 광맥 후보 3개는 숨김. 클라이언트 실측에서 `rev`이 **1(무변경)과 4(채굴2+회복2)로 갈린 것**이 `Repaint`가 변화에만 반응한다는 증거다. 행동 이벤트는 seq 0→6으로 5종 전부 발행됐고 **빈 수레 하역 실패는 seq를 올리지 않았다.** 바인딩 감사 113건 실패 0건. 프로필 baseline 원복 완료.
- **새로 알아낸 함정 2개**
  - **`.codeblock` 캐시가 한 사이클 지연된다.** 메서드 시그니처를 바꾸면 첫 `refresh`의 빌드 로그가 옛 시그니처로 오류를 낸다. 호출하는 쪽 `.mlua`를 다시 저장해 codeblock 재생성을 유도하면 해소된다. **빌드 로그 타임스탬프가 그대로면 재빌드가 안 돈 것**이므로 로그를 믿기 전에 확인한다.
  - **`.model` 수정은 기존 맵 인스턴스에 소급되지 않는다** (위 Phase 2 항목).

### 2026-07-31 — C207: P4 목표를 "첫 접속 총 경과 시간"으로 확정

- D9 §5.1의 권고를 오너가 승인해 **D8 C207**로 확정했다. P4의 "10~15분"은 **새 계정 첫 접속부터 깊은 광산 해금까지의 총 경과 시간**이며 튜토리얼·프로그램 조립·UI 조작을 포함한다. **순수 채굴 시간이 아니다.**
- D7 원문 3곳을 고쳤다 — §5.3 서두, §10.2 P4 행, 그리고 C149에 의미를 달았다.
- **경제 수치는 조정하지 않는다.** 순수 채굴 5.6~10.0분 + 튜토리얼·조립 4~6분이 목표 범위에 들어온다.
- 실측은 사람만 할 수 있어 `docs/16` §2.1에 사용자 검수 항목으로 남겼다.

### 2026-07-31 — 밸런스 검증 문서(D9) 신설과 시뮬레이터

- `docs/22-밸런스-검증.md`를 신설하고 `tools/balance_sim.cjs`(틱 루프 재현 시뮬레이터)를 함께 넣었다. 맵 레이아웃은 `.map`에서 직접 읽으므로 맵을 고치면 결과가 따라 바뀐다.
- **구현 상수가 D7 §5.3 제안값과 정확히 일치함을 확인**했다. 판매 단가·토큰 임계·해금 비용·일꾼 가격 전부 어긋난 곳이 없었다.
- **광맥 공급 상한이라는 구조적 천장을 처음 정량화**했다. 광맥은 `recoverTicks`마다 1단계만 회복하므로 맵 공급량에 일꾼 수와 무관한 상한이 있다 — 초보 돌 120/분, 깊은 돌 90 + 철 120, 보석 돌 90 + 철 120 + 금 120.
- **P4 목표("10~15분 내 깊은 광산 해금")가 무엇을 재는지 정의돼 있지 않다**는 것이 최대 발견이다. 순수 채굴 시간은 숙련 5.6분 · 초보 10.0분으로 **1.8배 차이**가 나고, 목표 하한에 닿는 것은 초보 경로뿐이다. 첫 접속 총 경과 시간으로 명시하는 것을 권고했다(D9 §5.1) — 순수 채굴 시간으로 삼으면 반복 블록을 잘 배운 플레이어를 벌주는 밸런싱이 된다.
- **초보 광산에서 단순 왕복 프로그램은 일꾼을 늘려도 채굴량이 30/분에서 고정된다**(30 → 29 → 29 → 29). 시작점이 창고 주변에 몰려 있어 모든 일꾼이 같은 광맥을 고르기 때문이다. 튜토리얼이 일꾼 구매를 가르치는데 그 직후 체감이 0인 구간이 생긴다 — F7-C의 "복사 후 대상 확인" 경고를 일꾼 2 구매 직후 반드시 노출하도록 권고했다(D9 §5.2).
- 5번째 일꾼은 초보 광산에서 효과가 없다(4명에 119/분으로 이미 상한 120에 닿는다). 결함은 아니지만 구매 화면 알림을 권고했다.
- **C206의 `MaxReserveStage` 4단계 유지 판단이 타당함을 사후 검증**했다. 5단계는 공급 상한을 바꾸지 않고 초반 버스트만 늘려 숙련 플레이어만 이득을 보므로 §5.1의 격차를 더 벌린다.
- T-02용으로 **효과 4종이 상한과 처리량에 미치는 영향을 구분**해 정리했다(D9 §7). `recovery`만 공급 상한을 올리고 `yield`는 처리량을 직접 올린다. 초보 주 효과가 `yield`, 깊은 주 효과가 `recovery`인 현재 배정이 이 구조와 맞는다.
- 작업 중 **낡은 참조 1건**을 추가로 발견해 고쳤다 — `docs/17` §5가 존재하지 않는 `MineLayoutConfig.mlua`를 참조하고 있었다. 실제 레이아웃은 각 맵 루트 엔티티의 `script.VeinTickSimulator` 컴포넌트 속성(`VeinDefinitionsJson` 등)에 있다.
- 사람만 확인할 수 있는 항목 2건을 `docs/16` §2.1에 추가했다 — 첫 접속 총 경과 시간 실측, 일꾼 2 프로그램 복사 시 경고 노출.

### 2026-07-31 — 문서 전수 점검과 정합화

- `docs/17`이 세션 요약을 무한 누적하는 구조라 "여기부터 읽는다"는 문서가 계속 무거워지고 있었다. **최근 1개 세션만 §0.0에 남기고 이전 세션 상세는 이 문서(As-built)로 일원화**했다(2026-07-31 결정). `docs/17`은 "다음에 무엇을 할지"에 집중한다.
- 문서 22개를 전수로 대조해 **사실과 다른 기술 6건**을 정정했다. 낡은 문서는 다음 세션을 헛돌게 한다 — 실제로 이번 세션도 인수인계의 "1순위: 부유석 썸네일 확인"에서 시작했지만 진짜 문제는 미커밋 `GroupOrder` 회귀였다.
  - `docs/00` — "D-7만 미해결"(→ 전량 해소) · `docs/21` 상태(→ C206 확정) · "D8은 C01~C195"(→ C206)
  - `docs/17` — 1순위가 이미 끝난 일 · "UI 아이콘 미승인"(→ `docs/20` §0 승인) · "미작성 문서 2건"(→ 튜토리얼은 `docs/19`로 작성됨)
- **문서 간 상충 1건을 해소**했다. 희귀 컬렉션/패시브 화면을 `docs/17`은 "미작성", `docs/18`은 "불필요"라고 서로 다르게 기술했다. **별도 화면을 만들지 않는 것으로 확정**하고(F5 §5.2 I1~I6으로 인벤토리 팝업 내 섹션 확보, T-01에서 구현·검증) D3 §7의 화면 목록 행도 정리했다.
- **새로 필요한 문서 3건을 식별**해 `docs/00`에 "작성 예정 문서" 표를 신설하고 `docs/18` §3에 차단 티켓을 연결했다.
  - **밸런스 검증(D9)** — D7 §5.3의 "10~15분 내 깊은 광산 해금"에 실측 검증 기록이 없다. C206에서 `MaxReserveStage` 5단계를 검토할 때 "채굴 +33%가 허용 범위인가"를 판정할 근거가 없어 오너 판단으로 넘겼다. **T-02보다 먼저** 있어야 한다
  - **서버 거절 사유 카탈로그(F8)** — D-10이 화면마다 재발하는 구조인데 거절 코드↔문구 통합 표가 없다
  - **성능·부하 기준(F9)** — 문서 전체에 프레임·부하 상한 기술이 0건이다
- 문서 상단의 **기준 커밋 해시를 제거**했다(`docs/17` `70914ed`, `docs/18` `fcdb262` 모두 이미 낡아 있었다). 구현 사실은 이 문서와 git log가 갖고 있어 중복 관리할 실익이 없다.
- `docs/18`의 T-04 티켓에 **RUID를 복사하지 않고 `docs/21` §7.1 참조만** 두기로 했다. 이번에 Depot RUID가 실제로 바뀌었고, 두 곳에 있으면 한쪽만 고쳐진다.
- `docs/16` **§17에 D-13**(엔진 재저장 회귀)을 신설했다. D-1~D-12와 성격이 달라 회귀임을 명시했다.

### 2026-07-31 — 오너 검토 반영: 연출 자산 재배정·Depot 교체·아바타 보강

- **`hit1`/`regen`/`die1`을 특별 광맥 전용으로 좁혔다.** 초안은 이 3종을 모든 광맥의 공용 연출로 배정했는데, C206에서 `신비한 광석`이 특별 광맥 본체로 확정되면서 **일반 광맥을 캘 때 특별 광맥 애니메이션이 재생되는 오독 문제**가 생겼다. F5 §2.2의 "특별 광맥은 일반과 즉시 구분" 요구와 어긋난다. 사운드 `Damage`는 시각 자산이 아니므로 공용으로 남긴다.
- 일반 광맥용 대체 자산을 검색·육안 확인해 **채굴 파편**(`d4f82b52…`, 돌 파편 흩어짐)과 **고갈 연출**(`78ea5621…`, 흰 먼지 퍼짐)을 확보했다. 타격 스파크(`6ade17ad…`)는 선택 사항으로 남긴다.
- **일반 광맥 회복 연출은 자산을 찾지 못했다.** 후보 3개가 전부 부적합했다 — 하나는 스프라이트에 **"RECHARGE" 영문 글자가 박혀** 있고, 하나는 노란 번개라 **피격으로 오독**되며, 하나는 46×46로 너무 작다. **별도 VFX 없이 스프라이트 교체 + `vein_recover` 사운드로 간다**(`docs/21` §5.1). 재검색은 T-04 이후 여유 과제다.
- **Depot을 눈 없는 금속 광차로 교체했다.** 초안 권장안(`9ae1efe5…`)을 포함해 후보 4종에 눈이 쌓여 있었는데 초보 광산은 설원이 아니다. 새 권장안 `3d661344…`는 태그가 "광산 입구·광석길"이고 **1.28×0.64로 한 셀에 잘 들어간다**(초안은 1.84로 가로 두 칸에 가까웠다).
- **stage 매핑에서 `condition3`을 `condition4`로 교체**했다(C206 조정). 청록 5장을 전부 쓰는 5단계도 검토했으나, `MaxReserveStage`를 3→4로 올리면 광맥당 채굴 3→4회(+33%)·완전 회복 15→20틱이 되어 경제 밸런스가 바뀌므로 **4단계를 유지**한다.
- 아바타에 **`pants`(밀라노청바지)를 추가**했다 — `coat`(멜빵)만으로는 하의가 비어 기본 바지가 노출된다. **`head`는 검색 대상이 아님을 명시**했다: 아바타 슬롯 목록에 `head`가 없고 `body`/`head`는 캐릭터 기본 신체 부위라 `getAvatarDefaults` 값을 그대로 쓴다.
- `Environment/config`의 CoreVersion을 26.7.0.0으로 올렸다. `ui/`·`map/` 콘텐츠 파일은 26.7인데 이 파일만 26.5로 남아 있어, 그대로 두면 `AGENTS.md` 8번 규칙에 걸려 다음 세션이 시작하자마자 멈춘다. `Environment/`는 원래 커밋 제외 범위지만 이 파일은 엔진 버전 마커라 예외로 넣었다.
- 프로브는 전량 제거하고 `map/farm01.map`을 커밋 상태로 복원했다(`.builder-work/place_fx2_asset_probe.cjs`).

### 2026-07-31 — T-04 잔여 자산 검색 완료 (사운드·아바타·Depot·링)

- `docs/21` §7의 남은 검색 4건을 전량 수행했다. 확정 RUID 전체 목록은 `docs/21` **§7.1**에 한 블록으로 모아 뒀다. **이 세션도 게임 코드는 바꾸지 않았다** — `RootDesk/`·`ui/`·`map/`는 무변경이다.
- **사운드 6종**: `resourceTypeFilter: ["effect"]`로 검색하고, **클립 길이가 각 cue의 쿨다운을 넘지 않는 것**을 우선 기준으로 골랐다(길면 소리가 겹쳐 쌓인다). **다만 소리를 직접 들어보지 못했다** — 검색 API의 AI 생성 설명 텍스트와 길이만으로 선정했으므로 T-04 Play에서 청취 확인이 필요하다.
- **`mine_empty`는 약한 선택으로 남겼다.** 후보 3개가 전부 "지진쇄" 계열 무거운 금속 파괴음이라 헛친 느낌과 맞지 않고, 1.52초가 쿨다운 0.8초보다 길다. T-04에서 재검색하거나 무음으로 두는 편이 낫다(F5 §4가 미승인 cue의 무음 스킵을 허용한다).
- **일꾼 아바타**: `cap` 안전제일 모자, `coat` 화이트루즈 멜빵, `weapon` 황금 곡괭이를 골랐다. 기본 아바타는 `getAvatarDefaults`로 body/head를 얻었다. 곡괭이 2종(황금·다이아)은 재질만 달라 성장 표현에 쓸 수 있다(T-06 범위).
- **Depot·선택 링**: 검색 결과의 이름이 `sprite-NNNN` 뿐이라 메타데이터만으로 판정할 수 없어, 광맥 때와 같이 `farm01`에 native scale로 배치해 스크린샷으로 판정했다. Depot은 **광석을 실은 나무 광차**(계약 원문의 "광차"와 일치), 링은 **납작한 타원 링**을 골랐다. **링 후보 4개 중 실제 링은 2개뿐**이고 나머지는 속이 찬 갈색 원(그림자용)과 별 반짝임이었다 — 이름만 봤다면 걸러낼 수 없었다.
- Depot 권장안은 1.84 unit로 **가로 두 칸에 가깝다.** 배치 밀도가 걱정되면 열린 나무 궤짝(1.2×1.24)이 대안이다. 최종 선택은 T-04에서 실제 배치를 보고 확정한다.
- 프로브 엔티티는 전량 제거하고 `map/farm01.map`을 커밋 상태로 복원했다(작업 스크립트: `.builder-work/place_fx_asset_probe.cjs`). 복원 뒤 `refresh` 정상.

### 2026-07-31 — T-04 광맥 자산 엔진 내 실측 (미결 1·3·4 해소)

- `docs/21` §6.1의 CDN 썸네일이 브라우징 정책에 막혀 gif 비교가 불가능했다. 대신 **`farm01`의 빈 타일 행(y = −3)에 `부유석` 6종 + `신비한 광석` 1종을 실제 배치하고 Maker Scene 스크린샷으로 판정**했다. RectTile 격자 위에서 봤으므로 셀 적합성까지 같은 화면에서 확인된다.
- **`부유석`의 `condition1~5`는 잔량 램프가 아니다.** 6장 중 `condition2`만 빨강이고 나머지 5장은 청록이다. `condition2`를 순서에 끼우면 stage 전환마다 색이 튄다. `docs/21` §1.1의 "5단계 시각 변화" 전제를 정정했다.
- 관측된 잔량 순서는 `stand ≈ condition1 > condition3 ≈ condition4 > condition5`다. 권장 매핑은 stage 3=`condition1` / 2=`stand` / 1=`condition3` / 0=`condition5`이며 `condition4`는 미사용으로 남긴다.
- 셀 적합성: `부유석` 80×144 = 0.80×1.44 unit로 **한 셀(1 unit)을 세로 44% 초과**하고, `신비한 광석` 108×80 = 1.08×0.80으로 거의 맞는다. 일반 광맥에 `부유석`을 쓰면 `Scale` 0.7 내외 축소를 권장한다.
- 권장 배정은 **일반 = `부유석`**(stage 4단계를 만들 수 있는 유일한 자산), **특별 = `신비한 광석`**(바위 받침이라는 형태 차이로 D5 §8 V1 충족)이다. 오너 승인 대기 상태로 `docs/21` §6.2에 남겼다.
- `animationclip` RUID를 `SpriteRUID`에 **직접(`thumbnail://` 없이) 넣어 7종 모두 정상 렌더**됨을 확인했다. 프레임 재생 여부는 정지 스크린샷으로 판정할 수 없어 T-04에서 Play로 확인한다.
- 프로브 엔티티는 전량 제거했고 `map/farm01.map`은 커밋 상태로 복원했다(빌더 왕복이 남긴 키 순서 차이는 의미상 동일함을 확인한 뒤 `git checkout`으로 되돌렸다). 복원 뒤 `refresh` 빌드 로그 16건 전부 `Info`다. 작업 스크립트는 `.builder-work/place_vein_asset_probe.cjs`에 남겼다.

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

### 2026-07-30 — 4차 세션 마감: 기획 문서 4종 신설과 T-01 구현

세션 후반은 **인수인계 준비**에 썼다. 코드 변경은 T-01(D-7) 하나이고 나머지는 문서다.

- **`docs/18` 작업 할당서** — 프로그래머 팀원용 티켓 T-01~T-10. MSW 미경험자 전제로 온보딩·절대 규칙 5개·조용한 실패 5개·검증 도구 한계·완료 정의(DoD)를 앞단에 배치했다.
- **`docs/19` F7-E 튜토리얼 기능 명세** — 오너 결정 11개(C203)를 받아 작성. 단계 완료 판정을 F5 §2.2의 미구현 `VisualEvent*` 대신 **기존 `@Sync` 상태 변화**로 설계해 T-07이 T-04에 종속되지 않게 했다. 튜토리얼 전용 완화 3종(일꾼 가격 인하·보호 수량 면제·희귀 억제)을 명시했고, 특히 **보호 수량 면제는 선택이 아니라 필수**다(해금 필요량 120 때문에 튜토리얼 자원으로는 판매가 서버에서 거부된다).
- **C204** — 튜토리얼 일꾼 가격 10골드, 정식 `Worker02` 확정. **"두 번째 일꾼 5분 내" 시간 목표를 폐기**하고(C33 폐기) D7 §5.3·§10.2 P3, D4 §3, C179를 정리했다.
- **F7-B §5.6 맵 강화 표기 규칙** — 누적값 + `현재 → 다음` 병기, 절대값 병기, **클라이언트 재계산 금지**, 희귀 패시브 가산 합성 표시. §5.6.5에 서버가 내려보낼 `@Sync` 7종을 T-02 범위로 명시. 기존 §5.6(실패 처리)은 §5.7로 이동.
- **`docs/20` UI 아이콘 승인표** — `msw-search`로 후보 수집 → 오너 승인 완료. §0에 확정 RUID 9개. 오너 추가 3개는 `getResource`로 `type=sprite`·24px 이상 검증. 실행 상태는 자산이 없어 텍스트+색으로 결정. `작업용 카트`(32×16)는 24px 예외 허용 + `PreserveSprite=AspectOnly`.
- **`docs/21` 연출 자산 승인표** — T-04용. 검색으로 **광맥 핵심 자산 2개**를 찾았다: `npc/2400021.img`(부유석)에 `condition1~5/stand` **5단계 시각 변화**가 있어 `ReserveStage` 0~3 매핑이 가능하고, `mob/9300497.img`(신비한 광석)는 `stand/hit1/regen/die1` + `_audio/Damage`를 갖춰 **채굴·회복·고갈 연출과 `mine_hit` 사운드**를 한 자산군에서 얻는다. 요소는 전부 `animationclip`(80×144 / 108×80)이고 오디오만 `effect`다.
- **T-01(D-7) 구현** — 상세는 아래 별 항목.
- 세션 종료 시점: **화면 결함 0건 · 기획 공백 0건 · 바인딩 감사 113건 실패 0건.** 남은 것은 오너의 `docs/21` 승인과 미구현 기능(T-02~T-10)이다.

### 2026-07-30 — 바인딩 전수 감사와 D-12 (워커 칩 라벨)

- D-11이 "선언 타입이 틀리면 조용히 nil"인 부류였으므로 같은 유형을 전수 감사했다. **`tools/audit_bindings.cjs` 신설** — `RootDesk/MyDesk`의 모든 `.mlua`에서 `property <Type> x = "<uuid>"`를 뽑아 `ui/*.ui`(UIBuilder)·`map/*.map`(MapBuilder) 엔티티의 실제 `componentNames`와 대조한다. `.mlua` 19개 / 선언 109개 / 엔티티 197개를 검사한다.
- **D-12 (5건)**: `BlockProgramController`의 `worker1ButtonText`~`worker5ButtonText`를 `TextGUIRendererComponent`로 선언했지만 칩 엔티티는 레거시 `TextComponent`다. `SetWorkerButtonLabel`이 nil 가드로 빠져나가 **워커 탭 라벨이 한 번도 갱신되지 않았다** — 선택/미보유를 화면으로 알 수 없었다.
- 같이 발견: 칩의 글자색과 배경색이 **둘 다 `rgba(1,1,1,1)`(흰색)** 이라 바인딩을 고쳐도 글자가 보이지 않는다. 스크린샷에서 칩 5개가 빈 흰 박스였던 이유다.
- 수정: 5개 속성과 `SetWorkerButtonLabel` 파라미터를 `TextComponent`로 맞추고, 칩 배경을 어둡게(`rgba(0.16,0.18,0.24,1)`) 바꾸고, 64×52에 맞게 라벨을 번호 + 짧은 표식(`1` / `[1]` / `1 X`)으로 줄이고 `BestFit`(12~20)을 켰다.
- **검증**: 5개 바인딩이 `TextComponent`로 정상 해석, Play 화면에서 `[1] 2 X 3 X 4 X 5 X` 확인. 감사 재실행 **실패 0건 / 정상 109건**. 빌드 오류 0건. 개발 프로필은 새 세션에서 재확인: `gold=0 stone=1 token=0 workers=1 cart1=20`.
- 사용자 판매 클릭 검수도 통과했다("잘 팔림, 텍스트로라도 표기하니 잘 보임").

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
