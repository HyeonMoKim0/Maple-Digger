# UI 파츠 RUID 대장

> 작성일: 2026-08-13
> 원본: [`docs/ui-parts/`](ui-parts/README.md) — AI 생성 PNG 48장
> 가공: `node tools/ui_parts_prep.cjs` → `build/ui-parts/` (트리밍 + 축소, 저장소 커밋 대상 아님)
> 업로드 대상: **그룹 리소스 저장소** `hyNDP` (`asset_create_group_resource_storage_item`)
> 아이콘 9종은 이 문서가 아니라 [20-UI-아이콘-승인표.md](20-UI-아이콘-승인표.md) §0 을 쓴다 (2026-08-13 오너 결정)

---

## 0. 이 문서를 쓰는 이유

`docs/ui-parts/*.png` 의 **파일명은 RUID가 아니다.** MSW 는 리소스 저장소에 등록된 RUID 로만 그림을 그린다.
이 문서가 파일명 ↔ 실제 RUID 의 단일 대응표다. `.ui` 에 값을 넣을 때는 항상 여기서 가져온다.

---

## 1. 원본 → 실사용 변환 규칙

원본 PNG 는 AI 생성 결과물 그대로여서 그대로 올릴 수 없다.

| 문제 | 실측 | 처리 |
|---|---|---|
| 해상도가 과다 | 1254×1254 ~ 2172×724 | 역할별 긴 변 목표치로 축소 (아래) |
| 그림 주변이 전부 투명 여백 | bbox 가 파일마다 다른 위치·크기 | 알파 bbox 로 트리밍 후 축소 |
| 파일 크기 | 24px 아이콘 하나가 400KB | 8~140KB 로 감소 |

`tools/ui_parts_prep.cjs` 의 역할별 긴 변 목표치:

| 역할 | 긴 변 |
|---|---:|
| 대형 프레임 · 모달 · HUD 프레임 | 384 |
| 행 · 바 · 슬라이더 트랙 · 토스트 | 384 |
| 버튼 · 탭 · 명령 타일 · 칩 · 뱃지 · 토글 | 192 |
| 인벤토리 슬롯 · 광산 노드 · 경로 커넥터 | 128 |
| 아이콘 · 상태 램프 · 스텝퍼 · 닫기 · 슬라이더 손잡이 | 96 |

축소는 **프리멀티플라이드 알파 박스 필터**다. 그냥 평균하면 반투명 가장자리에 검은 테가 생긴다.

---

## 2. 9-slice 메타데이터 — 리소스 쪽에 넣는다

`.ui` 의 `SpriteGUIRendererComponent.Type = Sliced(1)` 만으로는 9-slice 가 동작하지 않는다.
**슬라이스 경계는 리소스 속성**이며 `asset_update_resource_storage_info` 의 `properties` 로 넣는다.

```
properties: [
  { key: "border_left",   value: "34" },
  { key: "border_right",  value: "34" },
  { key: "border_top",    value: "34" },
  { key: "border_bottom", value: "34" },
  { key: "pivot_x",       value: "0.5" },
  { key: "pivot_y",       value: "0.5" }
]
```

> ⚠️ **`asset_update_resource_storage_info` 는 넘기지 않은 필드를 비운다.** `properties` 만 넘기면
> `name` / `description` / `subcategory` 가 빈 문자열이 된다. 항상 4개를 함께 넘길 것. (2026-08-13 실제 발생)

---

## 3. 패널 내부 안전 영역 — 프레임을 입히면 좌표가 바뀐다

프레임 스프라이트는 테두리가 그림의 일부다. 기존 좌표를 그대로 두면 텍스트가 나무 테두리를 침범한다.

**규칙: 콘텐츠 기준선 = `border + 12`**

`MineHUD/Panel`(460×466, border 34) 실적용 예:

| 항목 | 값 |
|---|---|
| 콘텐츠 좌측 기준선 `x` | **46** |
| 콘텐츠 폭 | **368** (46 + 368 = 414 < 460 − 34 = 426) |
| 상단 첫 행 `y` | **−42** |
| 하단 한계 `y` | **−432** (466 − 34) |

파일럿에서 이 규칙을 안 지켜 4건이 깨졌다 — 본문 텍스트 좌측 침범, `Title` 상단 테두리 걸침,
`BtnInventory` 하단 22px 침범, 램프·텍스트 세로 정렬 불일치. **프레임을 입히는 모든 패널에 동일 적용한다.**

---

## 4. 텍스트 팔레트 — 다크 전환이 동반 필수

파츠 프레임은 전부 밝은 크림·양피지 계열인데 기존 UI 는 어두운 패널 + 흰 텍스트였다.
배경만 바꾸면 글자가 사라진다. 방향은 ui-concepts 인수인계 §1("어두운 광산 UI 를 밝은 크림·꿀색·금색
프레임으로 보정")대로 **밝은 프레임 + 다크 텍스트**로 간다.

| 용도 | 색 |
|---|---|
| 본문 | `#3b2a1a` |
| 제목 | `#7a3c0d` |
| 보조·힌트 | `#5a4632` |

---

## 5. RUID 대장

`상태` — ✅ 업로드·검증 완료 / ⬜ 미업로드

border 는 `L R T B` 순. 좌측에 아이콘 슬롯이 있는 파츠는 **비대칭**이어야 슬롯이 늘어나지 않는다.

### 5.1 프레임

| 파츠 | RUID | 크기 | 9-slice border | 상태 |
|---|---|---:|---:|:--:|
| `panel-frame-hud` | `7691424f38e647cdb4ac8d213d782bf7` | 384×148 | 34 34 34 34 | ✅ |
| `panel-frame-large` | `9233b7bec7c34185aecffe956e6e679a` | 384×245 | 19 19 19 19 | ✅ |
| `modal-frame-blank` | `ec1ee9eef69244f497f96fc87ef24a0f` | 384×258 | 41 41 41 41 | ✅ |
| `toast-bar-blank` | `d4f8fe31613a42cfae8fb07846e0eb30` | 384×79 | **74** 30 20 20 | ✅ |

### 5.2 버튼 · 탭

| 파츠 | RUID | 크기 | 9-slice border | 상태 |
|---|---|---:|---:|:--:|
| `button-green-blank` | `4b726e80aa58409f8e1f03cc2a4e5da3` | 192×79 | 34 34 20 20 | ✅ |
| `button-orange-blank` | `a5f9c4101165445a9a0aaefeb14b0c56` | 192×71 | 30 30 18 18 | ✅ |
| `button-slate-blank` | `93024bfd2d324753ae92878d299e1ef6` | 192×68 | 28 28 17 17 | ✅ |
| `button-close` | `5af542ecf45c4992bfe2eddebb7932ff` | 96×94 | Simple | ✅ |
| `command-tile-slate-blank` | `3f659be019834b19aea6c14e0ac1da31` | 192×187 | 29 29 29 29 (블록 셀에서는 Simple 렌더) | ✅ **T-14 블록 스트립 셀 배경으로 채택 (2026-08-18)** |
| `tab-worker-selected` | `acfb0998854a4fb4b1a9927afd2a9993` | 192×68 | 22 22 17 17 | ✅ |
| `tab-worker-normal` | `db0c502147114dbfb47a5e87322937b4` | 192×62 | 22 22 15 15 | ✅ |
| `tab-worker-disabled` | `a864624d7b454085bcb76f86a0ed8d07` | 192×56 | 20 20 14 14 | ✅ |

> ~~`command-tile-slate-blank` 은 쓰지 않기로 했다.~~ → **T-14 (2026-08-18) 에서 블록 스트립 그리드의 56×56 정사각 셀 배경으로 채택됐다** — "정사각 아이콘 버튼이 생기면 그때 쓴다"던 그 용처다. 셀에서는 9-slice 가 아니라 **Simple 렌더**(정사각→정사각 축소)로 쓰고, 계열 구분은 런타임 틴트(이동 원색 / 채·적·하 녹색 / 제어 주황)가 맡는다. 명령 버튼 12개에는 여전히 쓰지 않는다 — 136~186×88 에 9-slice 로 늘리면 모서리 볼트만 커지고 가운데가 눌린다(1차 적용 실측).

### 5.3 행 · 슬롯 · 게이지

| 파츠 | RUID | 크기 | 9-slice border | 상태 |
|---|---|---:|---:|:--:|
| `ledger-row-resource-blank` | `f312099962db4862adee65f13644aa64` | 384×83 | **82** 30 17 17 | ✅ |
| `settings-slider-track` | `bd6dae92677e4274b7e79910939173e4` | 384×49 | 24 24 16 16 | ✅ (T-12-B, 2026-08-18) |
| `settings-slider-thumb` | `b05198669456485faa7dfe24594c206e` | 92×96 | Simple (`SliderComponent.HandleImageRUID`) | ✅ (T-12-B, 2026-08-18) |
| `inventory-slot-blank` | | 126×128 | | ⬜ |
| `inventory-slot-selected` | | 128×123 | | ⬜ |
| `quantity-badge-blank` | | 192×105 | | ⬜ |
| `cost-chip-blank` | | 192×64 | | ⬜ |
| `hud-cart-capacity-bar` | | 384×51 | | ⬜ |

### 5.4 상태 램프 (docs/20 §6 대로 **텍스트 + 색과 함께** 쓴다. 아이콘 단독 표기 금지)

| 파츠 | RUID | 크기 | 대응 `ProgramState` | 상태 |
|---|---|---:|---|:--:|
| `status-running-green` | `b3837d651fe7474b9632fec45153cfe2` | 94×96 | `Running` | ✅ |
| `status-idle-blue` | `27e502e69b064e3bba82801c739740e5` | 96×94 | `Idle` (미실행·자연 완료) | ✅ |
| `status-stopped-red` | `5e178be4569841139fa6252de9220130` | 96×95 | `Stopped` (사용자 정지·맵 전환·서버 거절) | ✅ |
| `status-blocked-yellow` | | 92×96 | — | ⛔ **보류** |

> **2026-08-16 (T-13 A2) — 3상태로 확정 (C217). `blocked` 는 업로드하지 않았다.**
>
> `WorkerController.ProgramState` 는 원래 **5가지 결말이 전부 `"Idle"` 하나로 뭉개져** 있었다(미실행 · 자연 완료 · 사용자 정지 · 맵 전환 정지 · 서버 거절). `Stopped` 는 그 정보가 **이미 호출 지점에 있어** 분류만 하면 됐지만, `Blocked`(수레 가득·광맥 고갈·맵 경계로 진행 불가)는 **판정 로직 자체가 없다** — 무엇을 '진행 불가'로 볼지부터 기획 결정이라 보류했다.
>
> 배선은 `MineInventoryController` 가 **선택 일꾼** 기준으로 한다(H9 손·수레와 같은 대상, F5 §5.3). 모르는 상태는 `Idle` 로 떨어지므로 나중에 `Blocked` 가 생겨도 배선이 깨지지 않는다.
>
> ⚠️ **`.ui` 파일 초기값은 `stopped`(빨강)다.** 배선이 죽으면 "멈춤"으로 눈에 띄어야지, 예전처럼 `running` 초록이면 자동화가 도는 것처럼 보여 결함이 숨는다.

### 5.5 광산 선택 노드

| 파츠 | RUID | 크기 | 상태 |
|---|---|---:|:--:|
| `mine-node-current` | `d39f51305bb541329e861e5ea151e63e` | 128×127 | ✅ |
| `mine-node-next` | `56181d0bc5a84a608e8086f00c4191dc` | 114×128 | ✅ |
| `mine-node-locked` | `1afd5d06d91744b3869a7283badf62db` | 123×128 | ✅ |
| `mine-route-connector` | | 128×46 | ⛔ **보류** |

> **2026-08-16 (T-13 Phase C) — 배치가 README 원안과 다르다. 커넥터는 쓰지 않는다.**
>
> `docs/ui-parts/README.md` 는 `SelectPanel/MineRoute/*` 라는 **가로 경로 스트립**을 전제했지만, `SelectPanel`(780×980)에 **빈 세로 띠가 18px 밖에 없다**(측정: Title −50 / ResourceText −130 / FeedbackText −206 / 버튼행 −282 / WorkerStatus −371 / BeginnerText −401 / BtnBeginner −456 / DeepText −568 / BtnDeep −606 / GemText −718 / BtnGem −756~−844, 하단 BtnClose −862~−950). 왼쪽 여백에 세로로 세우는 것도 `GemText` 가 720px 폭이라 막힌다.
>
> 그래서 **노드 3종을 각 광산 버튼(`BtnBeginner`/`BtnDeep`/`BtnGem`, 340×88)의 자식 뱃지로** 넣는다. 기존 배치를 전혀 건드리지 않아 **T-03(같은 `.ui` 에 맵 강화 모달 추가)과 충돌하지 않는다.**
>
> **커넥터는 들어갈 자리가 없다** — 광산 행 사이 간격이 24px 뿐이라 눕혀도 안 되고, 줄이면 실오라기가 된다. 화면을 가로 경로로 재설계할 때 함께 본다(그때는 T-03 과 같이 잡는다). **업로드하지 않았다.**
>
> 상태 매핑: 입장 중 → `current` · 해금됐지만 입장 중 아님 → `next` · 미해금 → `locked`.

### 5.9 희귀도 뱃지 (T-06 · docs/27 §3 — 2026-08-18 AI 직접 제작, 오너 채택 판단 대기)

> msw-painter(chunky, 24×24 그리드 → 96×96)로 직접 그려 업로드했다. 나무 판 + 희귀도색 보석 + **핍 1~5개**(색맹 대비 보조). 시험 배치 스크린샷은 docs/16 §38 뒤 오너 판정 자료로 전달됨. **기각되면 슬롯 틴트+텍스트로 대체한다** (docs/15 §8.4 · §11 U6). filter_mode=Point 등록 완료.

| 파츠 | RUID | 크기 | 핍 | 상태 |
|---|---|---:|:-:|:--:|
| `rarity-badge-common` | `08ebbf2be1de4081972380e119c9d3af` | 96×96 | 1 | 🟡 업로드 완료 · 채택 판단 대기 |
| `rarity-badge-uncommon` | `af19b1b6961a424bbf0187d304553441` | 96×96 | 2 | 🟡 |
| `rarity-badge-rare` | `3c34787ff2e44d7e99036d07ebcaaba8` | 96×96 | 3 | 🟡 |
| `rarity-badge-epic` | `7745e36e8a9a47b08bffc194f071b91b` | 96×96 | 4 | 🟡 |
| `rarity-badge-legendary` | `0cb30501bd6b4d24b4f54c5d6245c48e` | 96×96 | 5 | 🟡 |

### 5.10 2차 제작 목록 신규 파츠 (docs/27 §2 · 2026-08-18)

| 파츠 | RUID | 크기 | 9-slice border | 상태 |
|---|---|---:|---:|:--:|
| `input-field-blank` | `561a0737a9c8468889b6eb8075cc354e` | 384×85 | 21 21 21 21 | ✅ 업로드 · 기존 4개 입력창 적용 |
| `tooltip-frame-blank` | `d3ffbf345575474aa06d0e4a2ad96447` | 384×115 | 19 19 19 19 | ✅ 업로드 · `TutorialUI/Root/Tooltip` 적용 |
| `piece-card-frame` | `01bb848f974843089fc999bd01680b35` | 177×256 | Simple | ✅ 업로드 · T-06 화면 배선 대기 |
| `equipped-badge` | `6f9095d2a23142ba99a76fa71a8e816d` | 96×86 | Simple | ✅ 업로드 · T-06 화면 배선 대기 |

> 입력창·툴팁은 기존 `.ui` 트리와 컨트롤러 Entity ID를 보존한 채 UIBuilder로 스프라이트만 교체했다.
> 카드·장착 배지는 리소스와 RUID만 준비했다. 현재 프로젝트에는 T-06 결과/외형 화면과 컨트롤러가 없으므로 임의의 신규 화면은 만들지 않았다.
> `rarity-badge-*` 는 docs/27 §3의 오너 채택 판단 대기 항목이다. 이번 범위에서는 기존 파일·RUID를 변경하지 않고 그 상태를 유지했다.

### 5.6 보조 아이콘 (docs/20 승인 목록에 없는 것들)

| 파츠 | RUID | 크기 | 상태 |
|---|---|---:|:--:|
| `icon-special-vein` | | 85×96 | ⬜ |
| `icon-warning-protected` | | 96×84 | ⬜ |
| `icon-pickaxe` | | 96×93 | ⬜ |
| `stepper-minus` | | 96×91 | ⬜ |
| `stepper-plus` | | 96×95 | ⬜ |
| `toggle-on` | | 192×91 | ⬜ |
| `toggle-off` | | 192×93 | ⬜ |

### 5.7 이번 범위 밖 — 업로드 보류

| 파츠 | 대기 티켓 |
|---|---|
| `library-row-blank` · `library-slot-locked` · `validation-badge-ok` · `validation-badge-error` | **T-05** 프로그램 라이브러리 |
| ~~`settings-slider-track` · `settings-slider-thumb`~~ | **✅ T-12-B 로 업로드 완료 (2026-08-18)** — §5.3 대장 참조. `ui/SettingsUI.ui` 슬라이더 2개에 적용 |

---

---

## 5.8 적용 현황

| `.ui` | 적용 | 검증 |
|---|:--:|---|
| `MineHUD.ui` | ✅ | 패널 프레임 · 다크 텍스트 · 실행 상태 램프. lint clean · play 스크린샷 확인 |
| `BlockProgramUI.ui` | ✅ | 패널 프레임 · 명령 버튼 12 · 실행/정지/초기화/변환 · 워커 탭 5 · 다크 텍스트. lint ERROR 0 (L007 5건은 T-09 baseline) · play 스크린샷 확인 |
| `MineInventoryUI.ui` | ✅ | 패널 프레임 · 장부 행(좌측 아이콘 슬롯 보존) · 닫기 버튼 · 다크 텍스트 + 단일 좌표계 재배치. lint clean · play 스크린샷 확인 |
| `MineSelectUI.ui` | ✅ | 4패널(선택·판매·수레·희귀) 프레임 · 버튼 33개 역할색 · 입력창 · 다크 텍스트. lint ERROR 0 (L007 20건은 T-09 baseline) · play 스크린샷 확인 |
| `PopupGroup.ui` | ✅ | 모달 프레임 · OK(녹색)/취소(주황) · 구분선 제거(프레임이 대체). lint 경고 1건은 기존 디머(빈 RUID + alpha) |
| `ToastGroup.ui` | ✅ | 토스트 바. 원본 213×80 이 border(74+30)보다 좁아 뭉개지므로 **420×88 로 확대**. lint clean |
| `AccountRecoveryUI.ui` | ✅ | 모달 프레임 · 복구(녹색)/포기(주황) · 패널 660×400 확대. **앵커 모드 혼용(top/middle/bottom) → `top-center`+pivot(0.5,1) 단일 좌표계로 통일** (D-9 재발 방지). lint clean |
| `DefaultGroup.ui` | — | 엔진 기본(조이스틱·채팅). 손대지 않는다 |

전체 검증: `refresh` 빌드 로그 = baseline 16건(Info) · `play` 런타임 로그 173건 **전부 Info(Error/Warning 0)** ·
`node tools/audit_bindings.cjs` 선언 114건 **실패 0**.

### 남은 후속 작업 (이번 범위 밖)

> **2026-08-16 — 아래 1·2·3 은 [18-작업-할당서.md](18-작업-할당서.md) **T-13** 으로 티켓화했다.** 착수 순서·수용 기준·함정 목록은 그쪽이 단일 기준이다.
> **2 번은 착수 전 오너 결정이 필요하다** — `WorkerController.ProgramState` 가 `Idle`/`Running` 2값뿐이라 §5.4 의 램프 4상태가 현재 코드로는 성립하지 않는다 (`docs/18` §3 기획 공백 10번).

| # | 내용 | 왜 별도인가 |
|:-:|---|---|
| 1 | ~~워커 탭 **선택/잠금 스프라이트 교체**~~ | **✅ 완료 (2026-08-16, T-13 A1 · `docs/16` §26).** `BlockProgramController` 가 3종을 런타임 스왑한다. 문구는 그대로 함께 표시된다(§6 준수). ⚠️ **파일에는 5개 전부 `tab-worker-normal` 이 박혀 있고 런타임이 덮어쓴다** — `.ui` 만 보고 "선택 상태가 없다"고 읽지 말 것 |
| 2 | ~~실행 상태 램프 **상태별 RUID 스왑**~~ | **✅ 완료 (2026-08-16, T-13 A2 · `docs/16` §29).** `MineInventoryController` 가 선택 일꾼의 `Idle`/`Running`/`Stopped` 에 맞춰 스왑한다. `blocked` 는 판정 로직이 없어 보류(C217) — §5.4 참조 |
| 3 | **신규 구성물** — ~~광산 경로 노드~~(**✅ 2026-08-16 완료, T-13 C · §5.5 참조 — 버튼 자식 뱃지로 들어갔고 커넥터는 보류**) · 인벤토리 슬롯·수량 뱃지·비용 칩·수레 용량 게이지·스테퍼·토글 | 이번 작업은 **기존 화면 리스킨**이다. 위 파츠들은 지금 `.ui` 에 대응 엔티티가 없어 새로 만들어야 하며, 대부분 컨트롤러 배선이 따라온다. §5 의 ⬜ 항목이 여기 해당한다 |
| 4 | 장부 행 **좌측 아이콘 슬롯 채우기** | `MineInventoryUI/StoneRow` 의 슬롯이 비어 있다. docs/20 §0 승인 RUID 를 넣는 T-08 범위 |

---

## 6. 아이콘 9종은 여기 없다

`docs/ui-parts` 에 `icon-stone` / `icon-iron` / `icon-gold-ore` / `icon-gold` / `icon-crystal` /
`icon-mine-token` / `icon-hand-ore` / `icon-mine-cart` / `icon-depot` 가 있지만 **쓰지 않는다.**
2026-08-13 오너 결정으로 [20-UI-아이콘-승인표.md](20-UI-아이콘-승인표.md) §0 의 승인 RUID 9개를 유지한다.
