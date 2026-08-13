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
| `command-tile-slate-blank` | `3f659be019834b19aea6c14e0ac1da31` | 192×187 | 29 29 29 29 | ✅ **미사용** |
| `tab-worker-selected` | `acfb0998854a4fb4b1a9927afd2a9993` | 192×68 | 22 22 17 17 | ✅ |
| `tab-worker-normal` | `db0c502147114dbfb47a5e87322937b4` | 192×62 | 22 22 15 15 | ✅ |
| `tab-worker-disabled` | `a864624d7b454085bcb76f86a0ed8d07` | 192×56 | 20 20 14 14 | ✅ |

> **`command-tile-slate-blank` 은 쓰지 않기로 했다.** `docs/ui-parts/README.md` §3 은 이 타일을 명령 버튼
> 12개에 지정했지만, 원본이 거의 정사각(192×187)이라 136~186×88 버튼에 9-slice 로 늘리면 모서리 볼트만
> 커지고 가운데가 눌려 지저분해진다(1차 적용 실측 확인). 가로 비율이 맞는 `button-slate-blank` 로 대체하고
> 카테고리 구분은 연한 틴트 + 다크 문구가 맡는다. 정사각 아이콘 버튼이 생기면 그때 이 타일을 쓴다.

### 5.3 행 · 슬롯 · 게이지

| 파츠 | RUID | 크기 | 9-slice border | 상태 |
|---|---|---:|---:|:--:|
| `ledger-row-resource-blank` | `f312099962db4862adee65f13644aa64` | 384×83 | **82** 30 17 17 | ✅ |
| `inventory-slot-blank` | | 126×128 | | ⬜ |
| `inventory-slot-selected` | | 128×123 | | ⬜ |
| `quantity-badge-blank` | | 192×105 | | ⬜ |
| `cost-chip-blank` | | 192×64 | | ⬜ |
| `hud-cart-capacity-bar` | | 384×51 | | ⬜ |

### 5.4 상태 램프 (docs/20 §6 대로 **텍스트 + 색과 함께** 쓴다. 아이콘 단독 표기 금지)

| 파츠 | RUID | 크기 | 상태 |
|---|---|---:|:--:|
| `status-running-green` | `b3837d651fe7474b9632fec45153cfe2` | 94×96 | ✅ |
| `status-idle-blue` | | 96×94 | ⬜ |
| `status-blocked-yellow` | | 92×96 | ⬜ |
| `status-stopped-red` | | 96×95 | ⬜ |

### 5.5 광산 선택 노드

| 파츠 | RUID | 크기 | 상태 |
|---|---|---:|:--:|
| `mine-node-current` | | 128×127 | ⬜ |
| `mine-node-next` | | 114×128 | ⬜ |
| `mine-node-locked` | | 123×128 | ⬜ |
| `mine-route-connector` | | 128×46 | ⬜ |

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
| `settings-slider-track` · `settings-slider-thumb` | **T-12-B** 설정 패널 |

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

| # | 내용 | 왜 별도인가 |
|:-:|---|---|
| 1 | 워커 탭 **선택/잠금 스프라이트 교체** | `tab-worker-selected` / `disabled` 를 실제로 쓰려면 `BlockProgramController` 에 런타임 스왑 코드가 필요하다. 현재는 문구(`[1]` vs `2X`)가 상태를 표시하므로 기능 결손은 아니다 |
| 2 | 실행 상태 램프 **상태별 RUID 스왑** | `MineHUD` 램프가 지금은 `running` 고정이다. `MineInventoryController` 가 `Idle/Running/Blocked/Stopped` 에 맞춰 `ImageRUID` 를 바꿔야 한다. 램프 3종(`idle` / `blocked` / `stopped`)은 아직 업로드 전 |
| 3 | **신규 구성물** — 광산 경로 노드·인벤토리 슬롯·수량 뱃지·비용 칩·수레 용량 게이지·스테퍼·토글 | 이번 작업은 **기존 화면 리스킨**이다. 위 파츠들은 지금 `.ui` 에 대응 엔티티가 없어 새로 만들어야 하며, 대부분 컨트롤러 배선이 따라온다. §5 의 ⬜ 항목이 여기 해당한다 |
| 4 | 장부 행 **좌측 아이콘 슬롯 채우기** | `MineInventoryUI/StoneRow` 의 슬롯이 비어 있다. docs/20 §0 승인 RUID 를 넣는 T-08 범위 |

---

## 6. 아이콘 9종은 여기 없다

`docs/ui-parts` 에 `icon-stone` / `icon-iron` / `icon-gold-ore` / `icon-gold` / `icon-crystal` /
`icon-mine-token` / `icon-hand-ore` / `icon-mine-cart` / `icon-depot` 가 있지만 **쓰지 않는다.**
2026-08-13 오너 결정으로 [20-UI-아이콘-승인표.md](20-UI-아이콘-승인표.md) §0 의 승인 RUID 9개를 유지한다.
