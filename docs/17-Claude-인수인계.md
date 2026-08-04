# Claude 작업 인수인계

> 기준일: 2026-08-04 (**8차 세션** 종료 시점)
> 대상: Maple-Digger MSW 프로젝트를 이어 개발할 Claude 작업자
> **세션별 상세 기록은 [`Archive/As-built.md`](../Archive/As-built.md)에 있다.** 이 문서는 "다음에 무엇을 할지"에 집중하며, 최근 1개 세션 요약만 유지한다.

## 0. 이어가기 지점 — 여기부터 읽는다

### 0.0 최근 세션 요약 (2026-08-04, 8차) — 가장 최신

**⚠️ 진행 중인 브랜치: `feat/t04-mine-fx-p4`.** Phase 1~3.5는 **`main`에 병합 완료**(PR #2·#3)이고, 이 브랜치가 **Phase 4의 전반부**를 담고 있다. 아래 §0.1-A가 이어가는 지점이다.

| 범위 | 상태 |
|---|---|
| **T-04 Phase 3** (`main`) | 중요 이벤트 채널 — `VeinTickSimulator`에 `NoticeId`/`NoticeKind`/`NoticeCell*`/`NoticeCount` + 상태 복구용 `ActiveSpecialCount`. `MineNoticeController`(ClientOnly, 맵 컴포넌트) → **특별 광맥 출현 토스트**. 스폰 강조 펄스, HUD 특별 광맥 행 |
| **T-04 Phase 3.5** (`main`) | **D-14** — 돌·철·금이 화면에서 구분되지 않던 결함. `OreBadge` 모델 + `VeinMarkerController`가 marker의 자식으로 아이콘 뱃지를 세운다 |
| **T-04 Phase 4 전반** (브랜치 `feat/t04-mine-fx-p4`) | 일꾼 연출 — **선택 링 · 채굴 먼지 · Depot 강조**. `WorkerVisualController`(ClientOnly) 신설. Phase 1이 만든 `VisualEvent*` 채널을 처음으로 소비한다 |
| 결정 카드 | **C208** — F5-3의 "지도 위치"를 **셀 좌표 표기**로 판정. 미니맵은 만들지 않는다 |
| 자산 판정 | `docs/21` §5 — 채굴 파편 후보 2종 **기각**, **흰 먼지 퍼짐(`78ea5621`)으로 확정** |

**오너 검수에서 나온 지적과 반영** (2026-08-04)

| 지적 | 반영 |
|---|---|
| 선택 링 | 이상 없음 |
| "채굴 파편이 안 보임 — 그림자가 생기는 느낌" | 자산이 **어두운 얼룩**이었다. 흰 먼지로 교체 |
| "Depot은 커진 상태에서 작아진 것만 보임" | 펄스가 최대 크기에서 시작해 줄기만 했다. `sin` 곡선으로 교체 → **해결 확인** |
| "파편은 광석 위치 중심에 발생할 것" | 일꾼 자식 → **맵 자식 + `VisualEventCellX/Y`**로 광맥 셀에 배치 |

**반복하면 안 되는 함정 7개**

1. **`.codeblock` 캐시가 한 사이클 지연된다.** 메서드 시그니처를 바꾸면 첫 `refresh`의 빌드 로그가 **옛 시그니처로 오류**를 낸다. 호출하는 쪽 `.mlua`를 다시 저장해 codeblock 재생성을 유도하면 해소된다. **빌드 로그 타임스탬프가 이전과 같으면 재빌드가 안 돈 것**이므로 로그를 믿기 전에 확인한다.
2. **`.model` 수정은 이미 배치된 맵 인스턴스에 소급되지 않는다.** 맵 엔티티의 `componentNames`가 로드 시 기준이기 때문이다. `placeModel`로 다시 놓으면 인스턴스별 값이 날아가므로 **`upsertComponent`로 더한다.** 런타임 스폰 엔티티(일꾼 2~5)는 모델 수정이 따라오지만 **맵에 배치된 것(`Worker01`)은 안 따라온다.**
3. **`UIBuilder.text()`는 레거시 `MOD.Core.TextComponent`를 함께 붙인다** (§1 주의사항 9).
4. **`.ui` 컴포넌트 제거는 Maker에 이미 임포트된 엔티티에 소급되지 않는다** (§1 주의사항 10). 파일은 깨끗한데 런타임에 남아 화면에 찍힌다.
5. **자산은 검색 결과 설명을 믿지 말고 월드에 띄워 보고 고른다.** 이번에 `docs/21` §5의 "돌 파편"이 실제로는 어두운 얼룩, "노란 스파크"가 보라색 광석이었다. **C206(부유석 condition)과 같은 종류의 오류가 두 번째로 났다.** 후보를 한 줄로 배치해 스크린샷으로 판정하는 방식만 이걸 잡는다.
6. **한 맵에서만 검증하면 그 맵의 데이터가 가려 주는 결함은 통과로 나온다.** D-14는 `farm01`이 돌 전용이라 6차 세션까지 숨어 있었다. **시각 계약은 `gem_mine`에서 판정한다** — 세 광물이 한 화면에 있는 유일한 맵이다.
7. **프로필 원복은 화폐만으로 부족하다.** 채굴 루프를 오래 돌리면 **1% 확률로 희귀 광물이 떨어져 컬렉션이 오르고**, 그러면 수레 용량 보너스가 남아 `cart=0/21`이 된다. §0.2의 원복 목록을 그대로 쓸 것.

> 5차 이전 세션의 상세는 `Archive/As-built.md`의 날짜별 기록을 본다. 요약하면 — **2차**(07-29) 희귀 광물 서버 규칙 전량 검증, **3차**(07-30) F5 §5·§6 계약 신설, **4차**(07-30) 화면 결함 D-1~D-12 전량 수정 + `docs/18`~`21` 신설, **5차**(07-31) `GroupOrder` 회귀 복구(D-13) + T-04 자산 확정(C206).

### 0.1 다음에 할 일 — 우선순위

> **프로그래머 팀원에게 작업을 넘길 때는 [18-작업-할당서.md](18-작업-할당서.md)를 쓴다.** 티켓 T-01~T-10, MSW 미경험자용 온보딩, 조용한 실패 5개, 완료 정의(DoD)가 정리돼 있다. 아래는 AI 세션용 요약이다.

**화면 결함 0건, 기획 공백은 F9 하나뿐이다.** 지금 진행 중인 것은 T-04다.

| 순위 | 할 일 | 상태 | 비고 |
|:-:|---|---|---|
| **1** | **T-04 Phase 4 잔여 → 5~6** — 브랜치 `feat/t04-mine-fx-p4` | **진행 중** | Phase 1~3.5 완료 + Phase 4 전반부 완료. 아래 §0.1-A가 이어가는 지점이다 |
| 2 | **T-02 → T-03 · 맵 강화** | 대기 | T-02가 프로필을 **v8로 올린다.** 다른 티켓과 동시 진행 금지. 착수 전 `docs/22`(D9) §7과 `docs/23`(F8) §6.1을 읽는다 |
| 3 | T-05 / T-06 | 대기 | 서로 독립, 병렬 가능. `docs/23` §6.2·§6.3에 추가할 거절 경로가 잡혀 있다 |
| 4 | T-07 · 튜토리얼 | 대기 | 선행 T-02(v8에 `tutorial` 필드) + T-05(보상의 기본 프로그램) |
| 5 | **F9 성능·부하 기준** | 대기 | **T-04를 실제로 돌려 보며 쓰는 것이 정확하다.** 지금 쓰면 근거 없는 숫자만 박는다 |

### 0.1-A T-04 이어가기 — Phase 4 잔여 → 5~6

**브랜치 `feat/t04-mine-fx-p4`에서 이어간다.** 자산 RUID는 전부 [`21-연출-자산-승인표.md`](21-연출-자산-승인표.md) **§7.1**에 있다 — **이 문서에 RUID를 복사하지 말 것.** (§5의 채굴 파편은 2026-08-04에 흰 먼지로 교체됐다. §7.1보다 §5가 최신이다.)

**가장 먼저 할 일 = 아바타 교체.** 이유는 두 가지다.

1. Phase 4의 남은 절반이다.
2. **채굴 먼지의 최종 판정이 여기에 걸려 있다.** 오너가 "먼지는 아바타 만들어지고 확인하겠다"고 했다(2026-08-04). 지금 일꾼은 임시 몬스터 스프라이트라 크기·실루엣이 최종본과 다르다.

| Phase | 내용 | 상태 |
|:-:|---|---|
| 1 | 서버 동기화 표면 (`VeinMarker` `@Sync` · `WorkerController` `VisualEvent*`) | ✅ `3d977a1` (`main`) |
| 2 | 광맥 stage 시각화 (`VeinMarkerController` · 모델 · 맵 38개) | ✅ `dc5ed1f` (`main`) |
| 3 | 특별 광맥 연출 + 토스트 (중요 이벤트 채널) | ✅ `feat/t04-mine-fx-p3` |
| 3.5 | 광물 종류 아이콘 뱃지 (D-14) — Phase 표에서 빠져 있던 항목 | ✅ `feat/t04-mine-fx-p3` |
| **4** | **일꾼 연출** — 선택 링 · 파편 · Depot 강조 ✅ / **아바타 교체** · `rare_ore_unload` ⬜ | 🔶 **진행 중** `feat/t04-mine-fx-p4` |
| 5 | 사운드 7종 배선 | ⬜ |
| 6 | 검증·기록 (F5-1~F5-6, `docs/16`, As-built) | ⬜ |

**Phase 3에서 만들어 둔 것 — Phase 4가 그대로 쓴다.** 중요 이벤트 채널은 **kind 문자열로 분기**하도록 일반화돼 있다.

- 서버: `VeinTickSimulator:EmitMineNotice(kind, cellX, cellY, count)` 하나만 부르면 된다. **`rare_ore_unload`는 이 메서드를 호출하는 것으로 끝난다** — 호출 지점은 `WorkerController:DoUnload` 또는 `VeinTickSimulator:AddToDepot`이고, 희귀 종류 판별은 이미 거기 있다.
- 클라이언트: `MineNoticeController:PlayNotice`에 `elseif kind == "rare_ore_unload"` 분기를 더한다. 모르는 kind는 로그만 남기고 무시하므로 **서버를 먼저 붙여도 클라이언트가 깨지지 않는다.**
- 중복 방지 3중 가드(최초 관측 / 1초 settle / id 점프 스킵)는 kind와 무관하게 이미 동작한다. 새 kind에 다시 만들지 말 것.

**Phase 3.5에서 만들어 둔 것 (D-14 해소).** `OreBadge.model`(신규) + `VeinMarkerController`가 marker의 자식으로 **클라이언트 로컬 엔티티**를 스폰해 광물 아이콘을 세운다. 맵 파일은 건드리지 않았다 — 이미 배치된 marker 35개에 자식을 심는 대신 런타임에 만든다. **앞으로 marker를 추가해도 맵 수술이 필요 없다.**

> **시각 계약은 `gem_mine`에서 판정한다.** 세 광물이 한 화면에 있는 유일한 맵이다. `farm01`은 돌 전용이라 어떤 종류 구분 결함도 통과처럼 보인다 — D-14가 정확히 그렇게 숨어 있었다.

**Phase 4 전반부에서 만들어 둔 것.** `WorkerVisualController`(ClientOnly, 일꾼 컴포넌트)가 세 연출을 모두 담는다.

- **선택 링** — 표시 기준은 `_BlockProgramController:GetSelectedWorkerIndex()` **하나뿐이다.** HUD가 인덱스를 따로 들면 둘이 어긋난다(F5 §3 / §5.3).
- **채굴 먼지** — `mine_success`에 0.3초. **맵의 자식**이고 `VisualEventCellX/Y`로 채굴한 광맥 셀에 놓는다. 일꾼 자식으로 두면 일꾼 스프라이트 크기에 오프셋이 묶여 아바타 교체 때 전부 무효가 된다.
- **Depot 강조** — `unload_success`에 marker를 펄스. **강조는 marker 자신이 그린다**(`VeinMarkerController:PlayEmphasis()`). 일꾼 쪽에서 Depot의 `Transform.Scale`을 직접 만지면 marker의 `Repaint`와 매 프레임 다툰다.
- 표시 전용 자식은 `FxSprite.model`(`model://fxsprite`)로 **런타임 생성**한다. D-14의 `OreBadge`와 같은 방식이라 맵 파일에 FX 엔티티를 심지 않는다.

**Phase 4 남은 것 3개.**

1. **아바타 교체** — `Worker` 템플릿의 `SpriteRendererComponent`를 `AvatarRendererComponent` + `CostumeManagerComponent`로 바꾸고 `docs/21` §4의 4슬롯을 넣는다. **`Worker01`은 맵에 배치돼 있어 모델 수정이 소급되지 않으므로** 3개 맵도 함께 고쳐야 한다(전반부에서 `script.WorkerVisualController`를 붙일 때 같은 작업을 했다 — `.builder-work/p4_attach_worker_visual.cjs`가 그 예다). `msw-avatar`의 3계층 파이프라인 주의사항을 먼저 읽을 것.
2. **채굴 먼지 최종 판정** — 아바타 교체 직후 오너에게 보여 준다. 크기(`ShardScale` 0.9)·오프셋(`HitFxOffsetY` 0.25)·지속(`ShardSeconds` 0.3)이 조정 후보다. **0.3초는 F5 §3 계약값이므로 늘리려면 계약을 함께 고친다.**
3. **`rare_ore_unload` 중요 이벤트** — 서버는 `VeinTickSimulator:EmitMineNotice("rare_ore_unload", ...)` 호출 한 줄(`WorkerController:DoUnload` 또는 `AddToDepot`), 클라이언트는 `MineNoticeController:PlayNotice`에 분기 하나. Depot 강조는 이미 `PlayEmphasis()`로 부를 수 있다.

**Phase 4 자산.** `docs/21` §4가 아바타 4슬롯(`cap` 안전제일 모자 / `coat` 화이트루즈 멜빵 / `pants` 밀라노청바지 / `weapon` 황금 곡괭이)과 기본 body/head를 확정해 뒀다. 그리고 **D9 §5.2 권고 3** — 일꾼 2 구매 직후 프로그램 복사 시 위치 경고를 노출하는 것은 T-05 몫이지만, 일꾼 연출과 함께 보면 좋다.

**Phase 5 주의.** 사운드는 **청취 확인이 안 된 잠정값**이다(오너가 나중에 진행하기로 함). `mine_empty`는 특히 약한 선택이라 **무음도 유효한 선택**이다(F5 §4가 허용). `docs/21` §3의 ⚠️ 참조.

**Phase 6 필수.** `refresh → build log 0건 → play → 런타임 로그·스크린샷 → stop`, `node tools/audit_bindings.cjs` 실패 0건, F5 §7의 F5-1~F5-6 확인, `docs/16`·`Archive/As-built.md` 기록, **개발 프로필 baseline 원복**(아래 §0.2-A).

### 0.2-A 개발 프로필 baseline 원복 — 화폐만으로는 부족하다

검증하느라 채굴 루프를 돌리면 **1% 확률로 희귀 광물이 떨어져 컬렉션이 오른다.** 그러면 수레 용량 보너스가 남아 `cart = 0/21`이 되고, 화폐만 되돌린 채 "원복 완료"로 판정하면 baseline이 어긋난 상태로 커밋된다. 2026-08-04에 실제로 이렇게 놓쳤다.

`maker_execute_script`(`server_main`)에서 아래를 **전부** 되돌린 뒤 저장한다.

```lua
local d = p:GetProfile()
d.gold = 0  d.stone = 1  d.iron = 0  d.goldOre = 0  d.mineTokens = 0
d.rareCollection.rare_stone = 0  d.rareCollection.rare_iron = 0  d.rareCollection.rare_gold = 0
d.rareStorage.rare_stone = 0     d.rareStorage.rare_iron = 0     d.rareStorage.rare_gold = 0
p:ApplyRareStoneCartBonus()  p:SyncRuntimeState()  p:MarkProfileDirty()  p:SaveProfileAndWait()
```

**판정 기준** — 로그가 아래와 정확히 같아야 한다. `cart`가 `0/20`이 아니면 희귀 컬렉션이 남은 것이다.

```
gold=0 stone=1 iron=0 goldOre=0 token=0 workers=1
rareColl=0/0/0 rareStore=0/0/0 cart=0/20 lastMine=farm01
```

맵을 옮겨 검증했다면 **`farm01`로 돌아와서** 원복한다(`lastMineId`가 마지막 전환 맵으로 저장된다).

**T-02 착수 전 주의**: v8 마이그레이션에 **필드 4개**를 함께 넣어야 한다 — `progress.mineLevels` · worker 손 개수 · `currencies.Crystal` · `tutorial`. 그리고 F7-B **§5.6.5의 표기용 `@Sync` 7종**도 T-02 범위다. 나눠서 v9를 만들면 마이그레이션이 두 번 필요해진다.

**T-04 착수 시 남은 판단 3가지** (`docs/21` §7): ① 사운드 7종 **청취 확인** — 오너가 다른 작업 뒤 진행하기로 했다. 그때까지 선정값은 잠정이다 ② `mine_empty` 재검색 또는 무음 확정 ③ 일반 광맥 **회복 연출** 재검색 — 당장은 스프라이트 교체 + 사운드로 간다.

### 0.2 커밋 경계

이 프로젝트의 커밋 경계는 §10에 있다. T-04를 진행하면 아래처럼 나뉜다.

| 커밋 | 포함 | 메시지 예 |
|---|---|---|
| 1 | `RootDesk/MyDesk/Mine/*.mlua`(신규 컨트롤러) · `RootDesk/MyDesk/Models/**`(광맥 모델) · `map/farm01.map` · `docs/16`(검수 기록) · `Archive/As-built.md` | `feat(fx): 광맥 stage 시각화와 채굴·회복 연출 (T-04)` |
| 2 | `ui/MineHUD.ui` · `ui/MineInventoryUI.ui` · 컨트롤러 · `docs/16` · `Archive/As-built.md` | `feat(ui): HUD·인벤토리 아이콘 적용 (T-08)` |

**브랜치 정책** — 문서 갱신·자산 검색·소규모 수정은 `main` 직접. **T-04처럼 여러 파일·여러 커밋에 걸치는 작업은 브랜치 + PR**로 한다(2026-07-31 합의). 중간에 어긋나면 `main`에서 되돌리는 것보다 브랜치를 버리는 쪽이 싸다.

**커밋에 넣지 않는 것**: `.claude/` · `.codex/` · `.agents/` · `AGENTS.md` · `CLAUDE.md` · `Environment/` · `skills-lock.json`. 도구·환경 범위다.

> **2026-08-04 현재 `.claude/**` 90여 개가 갱신된 채 미커밋이다** — 스킬 플러그인 업데이트(신규 스킬 `msw-planning`·`maplestory-skill-maker`, `builder-protocol` 분할, `skills-lock.json`, `.omc/`). 오너 환경 갱신분이라 손대지 않았다. 커밋 여부는 오너 판단이며 **게임 동작에는 영향이 없다.**

**Maker 재저장분은 별도 `chore:` 커밋으로 분리한다** (2026-08-04 합의). Play를 여러 번 돌리면 `Global/common.gamelogic`·`map/*.map`·`ui/*.ui`가 정규화 재저장된다. 기능 커밋에 섞으면 다음에 "무엇이 실제 변경인지" 구분할 수 없다. **분리 전에 §1 주의사항 6대로 `GroupOrder` 회귀를 먼저 확인할 것** — 밀집 수열 0~7이 유지되는지 본다.

**커밋 전 체크** (§0.7 DoD의 축약):

```bash
node tools/audit_bindings.cjs      # 실패 0건이어야 한다
git status --short -- docs RootDesk ui map tools Archive
```

그리고 Maker에서 `refresh → logs(build) 오류 0건 → play → 로그·스크린샷 → stop`을 돌린 뒤, **개발 프로필을 baseline(`gold=0 stone=1 token=0 workers=1 cart1=20`)으로 원복**했는지 확인한다.

### 0.5 화면 결함 현황

**미해결 0건.** D-14는 2026-08-04에 수정·검증 완료했다 (`docs/16` §18.1) — 광물 종류 아이콘 뱃지를 `VeinMarkerController`가 런타임 자식 엔티티로 세운다. `gem_mine`에서 돌·철·금이 눈으로 구분되는 것까지 확인했다.

**D-1 ~ D-12는 전량 수정·검증 완료 (2026-07-30).** 각 건의 원인과 검증 기록은 `docs/16` §11~§16에 있다.

**D-13**(엔진 26.7 재저장이 `GroupOrder`를 되돌림)은 2026-07-31에 복구했다 — `docs/16` §17.

남은 것은 **D-6 하나**뿐이며 이건 결함이 아니라 미구현이다: H2(맵 강화 레벨)·H7(크리스탈)이 v7 프로필에 필드가 없어 현재 **상수 표시**(`Lv.0 / 10`, `크리스탈 0`)다. v8에 필드를 만들면 `@Sync`로 바뀐다 — **T-02 범위**.

---

## 1. `.ui` 작업 시 반드시 지킬 것

**세션이 바뀌어도 유효한 규칙이다.** 아래 10개는 전부 이 프로젝트에서 실제로 터진 사고에서 나왔다.

> **먼저 읽을 것 — 주의사항 8은 새 작업 환경에서 `.ui` 작업을 통째로 막는다.** `.ui`를 만질 계획이면 8번부터 확인하고 시작한다.

1. **`patch()`는 기존 `Pivot`을 보존한다.** 앵커를 바꿀 때 pivot을 함께 넘기지 않으면 박스가 반대쪽으로 밀려난다(`BtnInventory`가 184px 튀어나간 `L014`, 열기 버튼이 우상단 예약 영역으로 밀려난 사례 모두 이 원인).
2. **한 패널 안에서 앵커 모드를 혼용하지 말 것.** `AlignmentOption=0`(중앙)과 `=3`(상단)을 섞으면 같은 행에 두려던 요소가 아래로 밀려 겹친다(`docs/16` §13 D-9).
3. **`property <Type> x = "<uuid>"`의 타입이 틀리면 오류 없이 nil이 된다.** 빌드 로그에도 안 잡히고 `if x ~= nil` 가드와 만나면 기능이 조용히 사라진다. 바인딩을 추가·변경한 뒤에는 반드시 전수 감사를 돌린다:

```bash
node tools/audit_bindings.cjs
```

`.mlua` 선언 **113건**을 `.ui`/`.map` 엔티티의 실제 `componentNames`와 대조한다. 현재 기준 **실패 0건**이며, 이 스크립트로 D-11(판매 불가)과 D-12(워커 칩 라벨) 합계 8건을 찾아냈다. 오래된 `.ui` 엔티티는 레거시 `TextComponent`를, 빌더가 만든 입력창은 `TextGUIRendererInputComponent`를 갖는다는 점을 특히 주의한다.

4. **중앙 모달은 한 번에 하나만.** 열 때 다른 모달을 모두 끄고, 닫을 때 진입점 화면으로 복귀한다. 모달 배경 알파는 **0.96 이상** (F5 §6.1, D-8).
5. **서버 거부 사유를 그릴 자리를 만들 것.** 없으면 사용자에게는 "그냥 안 되는 것"으로 보인다 (D-10).
6. **Maker 재저장이 `UIGroupComponent.GroupOrder`를 덮어쓴다.** 엔진 26.7 업그레이드 재저장에서 `PopupGroup 10→3` / `ToastGroup 20→4` / `AccountRecoveryUI 50→6`으로 되돌아가 F5 §6.2 계층이 무효화된 적이 있다(2026-07-31 복구). **Maker에서 작업한 뒤에는 `git status`로 `.ui`/`.map` 재저장분을 반드시 확인**하고, 정규화(`Rotation`·`Position`·float 반올림·`CoreVersion`)에 계층 회귀가 섞여 있지 않은지 본다.
7. **`GroupOrder`의 절대값은 런타임에 남지 않는다.** 엔진이 로드 시 0..N 밀집 수열로 재압축하므로 **상대 순서만 의미가 있다.** 계층 검증은 파일이 아니라 Play 중 `maker_execute_script`(client)로 `/ui/<Group>`의 `UIGroupComponent.GroupOrder`를 찍어 판정한다.
   - **그래서 파일도 밀집 수열 `0~7`로 맞춰 뒀다** (2026-07-31). 희소값(10·20·50)을 쓰면 Maker가 저장할 때마다 압축값으로 덮어써서 diff가 계속 생기고, **일부 파일만 저장되면 압축값과 저자값이 섞여 순서가 깨진다** — D-13이 정확히 그 경우였다. 밀집 수열은 Maker가 쓰는 값과 같아서 더 이상 흔들리지 않는다.
   - 새 UIGroup을 추가할 때는 **끝에 붙이거나 중간 삽입 후 전체를 다시 0부터 매긴다.** 희소값으로 자리를 비워 두는 방식은 압축 때문에 의미가 없다.
8. **UIBuilder 검증기와 엔진 버전이 어긋나면 `.ui` 쓰기가 통째로 막힌다.** 2026-07-31에 실제로 막혀 있었다 — `write()`가 `U002: ...TextGUIRendererComponent.Font must be int32. Got "Default"`로 실패했고, **특정 파일이 아니라 5개 `.ui` 전부**에서 났다(`MineHUD` 9 · `MineSelectUI` 40 · `MineInventoryUI` 9 · `BlockProgramUI` 23 · `AccountRecoveryUI` 4). 즉 T-01 이후 `.ui`를 한 번도 못 고치는 상태였다.

   원인은 파일이 아니라 도구였다. `Environment/NativeScripts/Component/TextGUIRendererComponent.d.mlua`가 `property string Font = "Default"` · `property float FontSize = 20`으로 선언하는데 빌더가 두 필드를 정수로 강제했다. 당시 검증기를 직접 고쳐 도구 전용 커밋(`edc346e`)으로 남겼다.

   **그 뒤 스킬 플러그인이 업데이트되면서 상위에서 제대로 고쳐졌다** (2026-08-04 확인 — 8개 UI 파일 전부 `validate()` 오류 0건). `edc346e`의 2줄 패치는 **이제 불필요하다.** 새 환경에서 이 증상이 안 나면 정상이다.

   **같은 종류의 사고에 대비하는 규칙**: `U002`/`U003`/`U004`가 **내가 건드리지도 않은 엔티티에서** 무더기로 나오면, 파일이 아니라 **검증기와 엔진 버전이 어긋난 것**을 먼저 의심한다. 판정 근거는 `Environment/NativeScripts/Component/*.d.mlua`의 `property <타입>` 선언이다. **파일 값을 검증기에 맞추면 안 된다** — 실제 표시가 바뀌고 다음 Maker 저장에서 되돌아간다.
9. **새 텍스트 행을 만들면 `MOD.Core.TextComponent`를 지운다.** `UIBuilder.text()`는 레거시 `TextComponent`와 `TextGUIRendererComponent`를 **둘 다** 붙이는데, 기존 HUD 행은 후자 하나만 갖는다. 렌더러가 둘이면 **같은 자리에 문자열 두 개가 겹쳐 찍히고**, 컨트롤러가 갱신하는 쪽은 하나뿐이라 나머지는 생성 시점 문자열에 멈춘다.

   **좌표·텍스트 덤프(`maker_execute_script`)로는 안 잡힌다** — 컴포넌트 하나만 조회하면 정상으로 보인다. **스크린샷에서만 드러난다.** 만든 뒤 `removeComponent(path, "MOD.Core.TextComponent")`하고, 기존 행과 `componentNames`를 대조해 같은지 확인한다.
10. **`.ui` 컴포넌트 제거는 Maker에 이미 임포트된 엔티티에 소급되지 않는다.** 파일에서는 지워졌는데(`componentNames`·원본 `@components` 둘 다 확인) **런타임에는 남아 화면에 계속 찍힌다.** 2026-08-04에 실제로 났다 — 9번대로 지운 `TextComponent`가 런타임에 살아남아 HUD에 `Text`가 찍히고 있었다(`docs/16` §19).

    **그래서 파일 감사는 런타임을 증명하지 못한다.** 겹쳐 찍힘·유령 컴포넌트는 Play 중 client 스크립트로 `/ui/<Group>`을 재귀 순회해 세야 한다. 수정 전 `dualRenderer=1`, 수정 후 `0`.

    **해결은 컴포넌트가 아니라 엔티티를 새로 만드는 것이다** — `UIBuilder.remove()` → 같은 경로로 재생성(새 UUID) → `write(..., { bind })`로 `.mlua` UUID 재주입. `.builder-work/d14b_respawn_special_text.cjs`가 그 예다.

**사용자 직접 검수 현황** (`mouse_input`이 `ButtonComponent`를 클릭하지 못함, `docs/16` §9):

| 항목 | 결과 |
|---|---|
| 토글 버튼 실클릭 | **통과** |
| 토글 중 프로그램 실행 유지 | **통과** |
| 재접속 후 창고 유지 / 세션 하역 리셋 | **통과** |
| 판매 실행 (F5-8) | **통과** — "잘 팔림, 텍스트로라도 표기하니 잘 보임" |
| 일꾼 2명 전환 (F5-10) | 자동 검증으로 대체 완료 (`docs/16` §13.3) |
| 640px 편집기 패널 버튼 회귀 | **미시도** — 잔여 위험 낮음(라벨은 스크린샷 확인, UUID·핸들러 무변경) |

⚠️ `.ui` 수정은 반드시 **UIBuilder** 경유다. 원본 JSON 직접 편집·grep 금지(`AGENTS.md`, `msw-ui-system`).

## 2. T-02 착수 시 필요한 v8 마이그레이션 필드

계약(`docs/13` §5)과 세부 결정(C197~C200)이 모두 끝나 바로 착수할 수 있다. 선행 작업은 **프로필 v7 → v8 마이그레이션**이며, 필드 **4개를 한 번에** 넣어야 한다. 나눠서 v9를 만들면 마이그레이션이 두 번 필요해진다.

1. `progress.mineLevels` — 맵별 강화 레벨 0~10. v7은 세 맵 모두 0으로 변환
2. worker record의 **손 개수** — C199의 `yield` 추가 지급 때문에 필요. 현재 `WorkerController.PendingOre`가 단일 문자열이라 개수를 표현하지 못한다. v7은 손에 광물이 있으면 1, 없으면 0으로 변환
3. `currencies.Crystal` — D-6. D7 §3.1이 저장 대상으로 규정한 화폐인데 필드가 없다. v7은 0으로 변환. 획득 경로는 F7-D 범위이므로 필드만 먼저 만든다
4. `tutorial` 객체 — F7-E §10.2. T-07이 이 필드를 쓴다. v7은 `step = 0` + 모든 플래그 `false`로 변환

앞의 세 필드를 만들면 F5 §5.1의 H2·H7 상수 표시를 실제 `@Sync` 값으로 바꿀 수 있다. F7-B **§5.6.5의 표기용 `@Sync` 7종**도 T-02 범위다.

### 아직 열려 있는 질문

**기획 공백은 0건이다.** 아래는 의도적으로 미룬 것과, 새로 식별한 필요 문서다.

- ~~D-3 편집기 패널 점유·토글~~ → **C201로 해소** · ~~상점 정보구조~~ → **C202로 해소** · ~~UI 아이콘 RUID 미승인~~ → **`docs/20` §0으로 해소** · ~~튜토리얼 명세 미작성~~ → **`docs/19`로 해소** · ~~광맥 stage 매핑~~ → **C206으로 해소**
- **희귀 컬렉션/패시브 화면**은 **별도 화면을 만들지 않는다** (2026-07-31 확정). F5 §5.2 I1~I6으로 인벤토리 팝업 안의 섹션으로 확보했고 T-01에서 구현·검증했다. D3 §7의 화면 목록 행도 이에 맞춰 정리했다.
- **일일·주간 과제**(D7 §8.2)는 C151에 따라 기본 기능 완료 뒤 여유 범위다. 지금 착수하지 않는다.
- **작성 예정 문서 3건** — 밸런스 검증(D9) · 서버 거절 사유 카탈로그(F8) · 성능·부하 기준(F9). `docs/00`의 "작성 예정 문서" 표에 필요 근거와 차단 티켓이 있다. **밸런스는 T-02보다 먼저** 있어야 한다.

### 착수 전 반드시 확인

1. `git log --oneline -3`으로 이 문서 갱신분이 실제로 넘어왔는지 확인한다. 없으면 이전 컴퓨터에서 커밋·푸시가 안 된 것이다.
2. `docs/11`의 **C196**(희귀 광물), **C197~C200**(맵 강화), **C201~C202**(화면 구조), **C206**(광맥 자산)을 먼저 읽는다. **뒤 번호가 앞 번호를 정정**하므로 높은 번호를 우선한다.
3. Maker MCP를 연결하고 `refresh → build log → play → runtime log → stop`으로 초기 상태를 재확인한다. 로그 없이 "동작한다"고 판정하지 않는다.
4. `Environment/config`의 CoreVersion이 **`26.7.0.0`** 인지 확인한다. 다르면 작업을 멈춘다(`AGENTS.md` 8번 규칙).

## 3. 먼저 알아둘 상태

- 게임 코드는 **`main`에 커밋 완료**돼 있다. 다른 컴퓨터에서는 저장소를 클론/pull 하면 되고, 작업 트리를 통째로 옮길 필요가 없다.
- 새 계정 기준 상태는 **프로필 스키마 v7, Gold 0, 활성 일꾼 Worker01 한 명, 수레 0/20**이다.
- **CoreVersion은 `26.7.0.0`** (`Environment/config`). `ui/`·`map/` 콘텐츠 파일에도 같은 값이 박혀 있다.
- 개발 기준 문서는 `docs/`의 Markdown이며, 구현 사실은 `Archive/As-built.md`와 실제 코드·Maker 검증으로 판단한다.
- `FarmTickSimulator`와 `DroneController`는 비교용 과거 구현이다. 현재 광산 tick의 기준은 `RootDesk/MyDesk/Mine/VeinTickSimulator.mlua`, 현재 일꾼 동작의 기준은 `RootDesk/MyDesk/Mine/WorkerController.mlua`다.

## 4. Claude가 읽을 순서

0. 이 문서의 **§0 이어가기 지점** — 다음에 할 일과 열린 질문.
1. 루트의 `AGENTS.md` — MSW 파일 위치, Builder, Maker 검증 규칙.
2. `docs/00-기획문서-로드맵.md` — 구현/미구현 범위의 전체 지도.
3. `docs/02-마스터-GDD.md` — 게임 루프와 시스템 소유권.
4. `docs/11-MVP-결정-질문답변-로그.md`의 **C196**(희귀 광물)과 **C197~C200**(맵 강화) — 두 주제의 최종 결정 원문.
5. `docs/12-계정-프로필-저장-복구-기능명세.md`(§2.1 스키마 버전 현황 포함), `docs/13-경제-진행-기능명세.md`(§5 맵 강화 계약 포함) — F7-A/B 계약.
6. `Archive/As-built.md` — 실제 구현과 검증 근거의 날짜별 기록. **세션별 상세 이력이 여기에 있다.**
7. `docs/16-사용자-검수-체크리스트.md` — 검수 결과와 §9의 자동화 불가 항목 근거.
8. 화면 작업을 한다면 `docs/08-비주얼-사운드-기능명세.md`(F5)의 **§5 HUD 표시 계약**과 **§6 화면 영역 분할 규칙** — 화면 작업의 단일 기준이다. 기획 배경은 `docs/06-비주얼-사운드.md`(D5) §4, 근거 결정은 `docs/11`의 **C201·C202**.

## 5. 지금까지 구현된 핵심 기능

| 영역 | 현재 구현 | 주 파일 |
|---|---|---|
| 광산/일꾼 | RectTile 광산 3개(`farm01`, `deep_mine`, `gem_mine`), Worker01 기본 활성, 2~5 구매 뒤 서버 생성·복구 | `VeinTickSimulator.mlua`, `WorkerController.mlua`, `MineTransitionService.mlua` |

> **맵 레이아웃은 `.mlua` 파일이 아니라 `.map`에 있다.** 광맥 좌표·광물 종류·`recoverTicks`는 각 맵 루트 엔티티의 `script.VeinTickSimulator` 컴포넌트 속성(`VeinDefinitionsJson` / `DepotDefinitionsJson` / `WorkerStartsJson`)에 JSON 문자열로 박혀 있다. F6(`docs/09` §2)가 "`MineLayoutConfig` 데이터 계약"이라 부르는 것이 이것이며, **같은 이름의 `.mlua` 파일은 존재하지 않는다.** 읽으려면 `MapBuilder.read(...).component(mapName, "script.VeinTickSimulator")`를 쓴다.
| 계정·복구 | v7 프로필, Gold/광물/일꾼/마지막 광산/수레 상태 저장, primary·backup 복구와 동시 접속 lease | `AccountProfileService.mlua`, `AccountRecoveryController.mlua` |
| 경제·진행 | 일반 광물 수동·자동 판매/보호 수량, 깊은·보석 광산 첫 해금, 일꾼 구매, 일꾼별 수레 20→50 강화 | `EconomyService.mlua`, `ProgressionService.mlua`, `MineSelectController.mlua` |
| 희귀 광물 | 일반 광맥 1%, 특별 광맥 5% 드롭. 손→수레→Depot 뒤 컬렉션 등록, 종별 10단계 패시브, 11회째부터 보관·판매 | `AccountProfileService.mlua`, `EconomyService.mlua`, `VeinTickSimulator.mlua`, `WorkerController.mlua` |
| 희귀 판매 UI | 일반 판매 패널의 `희귀 광물 판매` 버튼으로 별도 팝업을 열어 희귀 돌/철/금 수동 판매와 자동 판매를 설정 | `ui/MineSelectUI.ui`, `MineSelectController.mlua` |

## 6. 고정된 희귀 광물 규칙 (변경 전 반드시 재확인)

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

## 7. 최근 검증 결과와 한계

### 자동/서버 경로에서 확인한 것

- Maker `refresh → build log → Play → runtime log → stop` 흐름에서 새 빌드 오류 없이 초기화됐다. Build Console은 16건 전부 `Info`(LIA 정적 분석 안내)이고 오류·경고 0건이다.
- 시작 상태 로그에서 v7, Gold 0, Worker01 한 명, 수레 0/20을 확인했다.
- **희귀 광물 서버 규칙 전량을 검증했다.** 10단계 전 자동 판매 거부, 1개씩 11회 하역(`coll=1..10 → 11회째 store=1`), 배치 10+1 경로, 수레 용량 20→26, 희귀 금 10단계에서 돌 100개 판매 `goldGain=130`, 희귀 돌/철/금 판매 50/200/600 Gold, 보관 0에서의 추가 판매 거부, 10단계 뒤 자동 판매 허용까지 전부 통과했다. 검증 후 개발 프로필은 기준 상태로 원복했다.
- `git diff --check`는 통과했다.

### 화면 검수 — 전량 해소됨

**D-1 ~ D-13 미해결 0건.** 각 건의 원인·수정·검증은 `docs/16` §11~§17에 있다. §0.5에 요약이 있다.

**사용자 직접 검수 결과** (버튼 실클릭은 자동화 불가 — 아래 참조): 토글 버튼 실클릭 통과 · 토글 중 프로그램 실행 유지 통과 · 재접속 후 창고 유지/세션 하역 리셋 통과 · 판매 실행(F5-8) 통과. 일꾼 2명 전환(F5-10)은 자동 검증으로 대체했다(`docs/16` §13.3). **640px 편집기 패널 버튼 회귀만 미시도**이며 잔여 위험은 낮다(라벨은 스크린샷 확인, UUID·핸들러 무변경).

### 자동 검증이 원천 불가능한 것

Maker MCP의 `mouse_input`은 **엔진 관리 UI(`ButtonComponent`)를 클릭하지 못한다.** 실제 클릭을 주입해 확인했다. 따라서 아래는 영구적으로 사용자 직접 검수 항목이다.

- 모든 UI 버튼 클릭 회귀(판매, 자동 판매 토글, 희귀 팝업, 광산 이동, 일꾼 구매, 수레 강화, 블록 조립·실행)
- 텍스트 입력 필드 입력
- 클릭해야만 열리는 화면의 배치·가독성

대신 **서버 규칙은 `maker_execute_script`(`server_main`)로, 상시 표시 화면은 `maker_screenshot`으로** 계속 자동 검증한다. 상세는 `docs/16` §9에 있다.

## 8. 현재 미구현 범위

아래는 버그가 아니라 아직 시작하지 않았거나 완결하지 않은 범위다.

| 범위 | 상태 | 기준 문서 |
|---|---|---|
| F5 시각·사운드 | marker/서버 이벤트 기반은 있으나 희귀 입고·특별 광맥·판매의 VFX/SFX/HUD 연출 미구현. **자산은 `docs/21` §7.1에 전량 확정**돼 있어 바로 착수 가능 (T-04) | `docs/08-비주얼-사운드-기능명세.md`, `docs/21` |
| F7-B 맵 강화 | 맵 레벨 0~10, 비용, 맵별 강화 효과는 미구현. **구현 계약 정합화와 세부 결정(C197~C200)까지 완료**되어 바로 착수 가능. v8 마이그레이션(맵 레벨 + 일꾼 손 개수)이 선행 작업이다 | `docs/13-경제-진행-기능명세.md` §5, `docs/11` C197~C200 |
| F7-C 프로그램 라이브러리/세션 | 계정 공용 프로그램 저장·복제·이름 변경·재시작 규칙 미구현 | `docs/14-프로그램-라이브러리-세션-기능명세.md` |
| F7-D 외형·도감·가챠 | 외형 데이터, 도감, 가챠 미구현 | `docs/15-외형-도감-가챠-기능명세.md` |

다음 기능을 택하기 전에는 위 문서와 `Archive/As-built.md`를 대조해, 계획 문서와 기능 명세를 먼저 업데이트하거나 구분한다.

## 9. 다른 컴퓨터에서의 시작 절차

1. 저장소를 열고 `git log --oneline -3`, `git status --short`, `git diff --check`로 실제로 옮겨진 변경을 확인한다. **이 문서의 §0이 보이면 2차 세션 결과까지 넘어온 것이다.**
2. `AGENTS.md`의 MSW Foundation/도메인 규칙을 그 작업 환경에 맞게 로드한다. 특히 `.ui`는 UIBuilder, `.model`/`.map`은 해당 Builder로만 수정한다.
3. Maker를 연결한 뒤 `refresh`, build log 확인, `play`, runtime log 확인, `stop` 순서로 첫 상태를 재확인한다. 기대값은 빌드 오류 0건, `[VeinTick] layout loaded mineId=beginner_mine veins=4 starts=5 specialCandidates=3`, `[Worker 1] configured cart=0/20 hand=`, `owned workers restored count=1`이다.
4. **§0.2의 1순위(F5 §5/§6 계약대로 D-1~D-5 수정)부터 진행한다.** 서버 규칙 검수는 2차 세션에서 이미 통과했으므로 다시 하지 않아도 된다. 남은 검수는 `docs/16` §9에 따라 사용자만 수행할 수 있는 버튼 클릭 항목이다.
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

## 10. 작업 트리/커밋 주의사항

작업 트리에는 게임 변경 외에 Codex/에이전트 환경 파일도 섞일 수 있다.

- 게임 기능 변경 후보: `RootDesk/MyDesk/`, `map/`, `ui/`, `docs/`, `Archive/As-built.md`.
- 도구·에이전트 환경 범위: `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.mswai/`, `AGENTS.md`, `skills-lock.json`.
- 이 환경 파일은 게임 런타임 기능 자체와는 별도다. 같은 AI 작업 환경을 재현하려면 함께 옮길 수 있지만, 게임 기능 커밋에 무심코 섞지 말고 의도를 확인한다.
- 따라서 Claude에게는 `git add .`를 바로 실행하지 말고, 게임 기능 커밋과 도구 설정 커밋을 분리하도록 요청한다.

## 11. Claude에게 바로 붙여 넣을 요청문

```text
Maple-Digger MSW 프로젝트를 인수받아 이어서 작업한다.

먼저 docs/17-Claude-인수인계.md를 §0부터 끝까지 읽어라. §0이 이어가기 지점이고,
§1의 .ui 주의사항 7개는 세션이 바뀌어도 유효한 규칙이다.
그다음 AGENTS.md, docs/00-기획문서-로드맵.md, docs/02-마스터-GDD.md,
docs/11-MVP-결정-질문답변-로그.md의 C196, C197~C200, C201~C202, C206,
docs/12-계정-프로필-저장-복구-기능명세.md, docs/13-경제-진행-기능명세.md(§5 포함),
Archive/As-built.md, docs/16-사용자-검수-체크리스트.md를 읽어라.
D8 카드는 뒤 번호가 앞 번호를 정정하므로 높은 번호를 우선한다.

현재 기준은 프로필 v7, Gold 0, Worker01만 활성, 수레 0/20, CoreVersion 26.7.0.0이다.
희귀 돌/철/금은 손→수레→Depot 뒤 첫 10개가 컬렉션(+3% 패시브)에 등록되고,
11회째부터만 보관·수동/자동 판매할 수 있다. 가격은 50/200/600 Gold다.
이 희귀 광물 서버 규칙은 2026-07-29에 전량 검증 통과했으니 다시 검증하지 않아도 된다.
화면 결함 D-1~D-13도 전부 해소됐다.

다음 작업은 §0.1의 우선순위표를 따른다. 1순위는 기획 보강 3건(밸런스 검증 ·
서버 거절 사유 카탈로그 · 성능 기준)이고, 근거와 차단 티켓은 docs/00의
"작성 예정 문서" 표에 있다. 밸런스는 T-02보다 먼저 있어야 한다.
2순위 T-04(F5 연출)는 자산이 docs/21 §7.1에 전부 확정돼 있어 바로 착수 가능하다.

.ui 수정은 반드시 UIBuilder를 경유하고 원본 JSON을 직접 편집하지 마라.
Maker refresh/build/Play/runtime log 없이 "동작한다"고 판정하지 마라.
Maker에서 작업한 뒤에는 git status로 .ui/.map 재저장분을 확인하라 —
재저장이 GroupOrder를 되돌린 적이 있다(§1 주의사항 6).
UI 버튼 클릭 검수는 mouse_input으로 불가능하니(docs/16 §9) 나에게 요청하라.
게임 기능 변경과 .agents/.claude/.codex 등 도구 환경 변경은 별도 커밋으로 분리하라.
여러 파일에 걸치는 작업은 브랜치+PR, 문서 갱신은 main 직접으로 한다.
새 기능은 계획 문서와 기능 명세를 먼저 정합시킨 뒤 구현하고, As-built와 검수 체크리스트를 갱신하라.
```
