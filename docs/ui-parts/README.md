# Maple-Digger UI 파츠

픽셀 작업장 UI 키트에서 텍스트를 제외하고 분리한 독립 PNG 파츠입니다.
게임 화면에 바로 넣는 완성 UI가 아니라, 화면별 시안과 문서에서 조합하기 위한 시각 에셋입니다.

## 파츠 목록

| 파일 | 용도 |
| --- | --- |
| `maple-digger-panel-frame-large.png` | 작업 프로그램·대형 장부용 패널 프레임 |
| `maple-digger-panel-frame-hud.png` | 광산 HUD·소형 상태 패널 프레임 |
| `maple-digger-button-slate-blank.png` | 기본 입력·인벤토리 계열 버튼 바탕 |
| `maple-digger-button-green-blank.png` | 실행·확인 계열 버튼 바탕 |
| `maple-digger-button-orange-blank.png` | 정지·취소 계열 버튼 바탕 |
| `maple-digger-command-tile-slate-blank.png` | E/W/N/S·채굴 같은 명령 타일 바탕 |
| `maple-digger-ledger-row-resource-blank.png` | 아이콘 슬롯 + 값 영역이 있는 장부 행 |
| `maple-digger-modal-frame-blank.png` | 확인·알림 모달 프레임 |
| `maple-digger-icon-stone.png` | 돌 자원 아이콘 |
| `maple-digger-icon-gold-ore.png` | 금광석 자원 아이콘 |
| `maple-digger-icon-pickaxe.png` | 채굴·명령 버튼용 곡괭이 아이콘 |
| `maple-digger-hud-cart-capacity-bar.png` | 카트 수량·용량 표시 바탕 |
| `maple-digger-tab-worker-selected.png` | 선택된 일꾼 탭 바탕 |
| `maple-digger-status-running-green.png` | 실행 중 상태 램프 |
| `maple-digger-status-idle-blue.png` | 대기 상태 램프 |
| `maple-digger-status-blocked-yellow.png` | 차단 상태 램프 |
| `maple-digger-status-stopped-red.png` | 정지 상태 램프 |
| `maple-digger-mine-node-current.png` | 광산 선택 경로의 현재 노드 |
| `maple-digger-inventory-slot-blank.png` | 인벤토리 아이템 슬롯 |
| `maple-digger-icon-iron.png` | 철 자원 아이콘 |
| `maple-digger-icon-crystal.png` | 크리스탈 자원 아이콘 |
| `maple-digger-icon-mine-token.png` | 광산 토큰 화폐 아이콘 |
| `maple-digger-icon-mine-cart.png` | 광산 수레 아이콘 |
| `maple-digger-tab-worker-normal.png` | 일반 일꾼 탭 바탕 |
| `maple-digger-tab-worker-disabled.png` | 비활성 일꾼 탭 바탕 |
| `maple-digger-settings-slider-track.png` | BGM·효과음 설정 슬라이더 트랙 |
| `maple-digger-settings-slider-thumb.png` | 설정 슬라이더 손잡이 |
| `maple-digger-toggle-on.png` | 자동 판매 등 ON 토글 |
| `maple-digger-toggle-off.png` | 자동 판매 등 OFF 토글 |
| `maple-digger-stepper-minus.png` | 수량 입력 감소 버튼 |
| `maple-digger-stepper-plus.png` | 수량 입력 증가 버튼 |
| `maple-digger-button-close.png` | 모달·패널 닫기 버튼 |
| `maple-digger-toast-bar-blank.png` | 아이콘 슬롯이 분리된 토스트 바 |

## 사용 규칙

- 모든 파일은 RGBA PNG이며, 바깥 여백은 투명합니다.
- 텍스트·숫자·아이콘은 포함하지 않았습니다. 화면별 `.ui` 또는 시안 단계에서 별도 레이어로 배치합니다.
- 버튼 색상은 의미를 고정하기 위한 것이 아니라 상태 계열을 구분하기 위한 기본 바탕입니다.
- 9-slice 또는 반복 배치가 필요한 경우 모서리 장식과 내부 여백을 유지한 채 크기만 조정합니다.
- 도트 외곽선과 제한된 흙색 팔레트를 유지하고, 금색 광택·네온 그라디언트·가챠식 장식은 추가하지 않습니다.
## 추가 제작 파츠

| 파일 | 용도 |
| --- | --- |
| `maple-digger-mine-node-locked.png` | Locked mine selection node |
| `maple-digger-mine-node-next.png` | Next available mine selection node |
| `maple-digger-mine-route-connector.png` | Mine route connector |
| `maple-digger-cost-chip-blank.png` | Blank mine cost chip |
| `maple-digger-icon-gold.png` | Gold currency icon |
| `maple-digger-icon-hand-ore.png` | Hand carrying ore icon |
| `maple-digger-icon-depot.png` | Depot / warehouse icon |
| `maple-digger-quantity-badge-blank.png` | Blank quantity badge |
| `maple-digger-library-row-blank.png` | Blank program library row |
| `maple-digger-validation-badge-ok.png` | Validation success badge |
| `maple-digger-validation-badge-error.png` | Validation error badge |
| `maple-digger-inventory-slot-selected.png` | Selected inventory slot frame |
| `maple-digger-icon-warning-protected.png` | Protected-quantity warning icon |
| `maple-digger-icon-special-vein.png` | Special vein / rare collection marker |
| `maple-digger-library-slot-locked.png` | Locked or unpurchased library slot |

## 적용 인수인계 (2026-08-13)

### 1. 이 폴더의 PNG를 사용하는 방식

- 이 PNG들은 완성된 전체 화면이 아니라, 기존 MSW UI에 조립하는 **독립 시각 파츠**다.
- PNG 자체를 `.ui`에 문자열로 넣지 않는다. Maker/리소스 저장소에 Sprite 리소스로 등록한 뒤 발급된 RUID를 `SpriteGUIRendererComponent.ImageRUID`에 넣는다.
- 현재 프로젝트의 실제 `.ui` 파일은 `ui/` 아래에 있으며, 새 파츠를 붙일 때는 반드시 `UIBuilder`로 기존 트리를 읽고 수정한다. `.ui` JSON을 직접 편집하지 않는다.
- 이미지에 제목·수량·상태·버튼 문구를 굽지 않는다. 조정 가능한 문구는 기존 바인딩을 유지한 `TextGUIRendererComponent.Text`에 둔다.
- 파츠 적용은 `UIBuilder.write()` → Maker `refresh` 순서로 반영한다. Play 중에는 먼저 `stop`한다.

### 2. 현재 UI 공통 좌표·레이어 기준

- 현재 루트 UIGroup들은 `1920x1080`, `UIMode=Screen(1)`, `SortingLayer=UI` 기준이다.
- `UITransformComponent`의 `anchoredPosition`을 사용한다. `Position`을 직접 수정하지 않는다.
- 고정 모서리 파츠는 anchor와 pivot을 같은 모서리에 맞춘다. 중앙 모달은 `anchor=[0.5,0.5]`, `pivot=[0.5,0.5]`를 사용한다.
- 패널·프레임은 `SpriteGUIRendererComponent.Type=Sliced(1)`을 우선 사용하고, 광물·재화·상태 아이콘은 `Simple(0)`을 사용한다.
- 게이지처럼 길이가 변하는 파츠만 `Filled(3)` 또는 런타임 폭 조정을 사용한다. 아이콘을 9-slice로 늘리지 않는다.
- 클릭 가능한 요소는 장식용 `sprite`가 아니라 기존 `ButtonComponent` 위에 입힌다. 모바일 터치 여유를 위해 버튼 실측 영역은 최소 `88x88`을 유지한다.

### 3. 실제 UI 파일별 배치 매핑

#### `ui/BlockProgramUI.ui` — 좌측 프로그램 편집기

현재 기준: `/ui/BlockProgramUI/Panel`은 좌하단 anchor, `640x960`, offset `(280,20)`이다.

| 파츠 | 적용 위치 | 배치 규칙 |
| --- | --- | --- |
| `maple-digger-panel-frame-large.png` | `Panel` 배경 | 기존 `Panel`의 Sprite를 교체하거나 배경 자식으로 사용 |
| `maple-digger-command-tile-slate-blank.png` | `Panel/BtnMoveN`, `BtnMoveE`, `BtnMoveS`, `BtnMoveW`, `BtnMine`, `BtnLoad`, `BtnUnload`, `BtnRepeat`, `BtnRepeatCount`, `BtnIfOre`, `BtnEnd`, `BtnConvert` | 기존 Button 영역과 같은 크기로 맞추고 문구는 Button/Text 런타임 값으로 유지 |
| `maple-digger-button-green-blank.png` | `Panel/BtnRun` | 실행 상태의 기본 배경. 기존 `BtnRun` 바인딩은 유지 |
| `maple-digger-button-orange-blank.png` | `Panel/BtnStop`, `Panel/BtnClear` | 중지·초기화 계열. 버튼 문구는 이미지에 넣지 않음 |
| `maple-digger-tab-worker-selected.png`, `tab-worker-normal`, `tab-worker-disabled` | `Panel/BtnWorker1`~`BtnWorker5` | 선택/일반/잠금 상태에 따라 Button SpriteSwap 또는 자식 Sprite로 교체 |
| `maple-digger-library-row-blank.png` | 프로그램 라이브러리 화면을 추가할 때의 행 템플릿 | 슬롯명·검증일·대상 일꾼은 행 위 Text 자식으로 분리 |
| `maple-digger-library-slot-locked.png` | 구매하지 않은 라이브러리 슬롯 | 비용·잠금 조건은 런타임 텍스트로 표시 |
| `maple-digger-validation-badge-ok.png`, `validation-badge-error.png` | 라이브러리 행 우측 상태 칸 | 성공/실패 아이콘만 표시하고 상세 사유는 Text로 표시 |

`Panel/FeedbackText`, `ProgramText`, `InputLabel`, `ProgramLabel`, `Title`는 기존 스크립트 바인딩 대상이므로 이름을 바꾸거나 이미지로 대체하지 않는다.

#### `ui/MineHUD.ui` — 우측 상시 HUD

현재 기준: `/ui/MineHUD/Panel`은 우상단 anchor, `460x466`, offset `(-260,-24)`이다.

| 파츠 | 적용 위치 | 배치 규칙 |
| --- | --- | --- |
| `maple-digger-panel-frame-hud.png` | `Panel` | HUD 패널 배경. 기존 텍스트 영역보다 먼저 렌더 |
| `maple-digger-icon-stone.png`, `icon-iron.png`, `icon-gold-ore.png` | `Panel/MineText` 또는 자원 행 자식 | 아이콘은 좌측 24~32px 슬롯, 보유량은 기존 Text에 유지 |
| `maple-digger-icon-gold.png`, `icon-crystal.png`, `icon-mine-token.png` | `Panel/CurrencyText` | 아이콘 3개를 작은 행으로 배치하고 값은 Text로 분리 |
| `maple-digger-icon-hand-ore.png`, `icon-mine-cart.png` | `Panel/HandText`, `Panel/CartText` | 선택 일꾼의 손/수레 표시. 상세 수량은 Text |
| `maple-digger-hud-cart-capacity-bar.png` | `Panel/CartText` 아래 또는 수레 행 내부 | 배경→채움→수량 Text 순서. 채움은 런타임 값으로 조정 |
| `maple-digger-status-running-green.png`, `idle-blue`, `blocked-yellow`, `stopped-red` | `Panel/WorkerStateText` 옆 상태 슬롯 | 아이콘만으로 의미를 끝내지 말고 상태 문자열을 함께 표시 |
| `maple-digger-icon-special-vein.png` | `Panel/SpecialText` 좌측 | 특수 광맥 알림 마커. 설명은 기존 Text |
| `maple-digger-icon-depot.png` | `Panel/DepotText` 좌측 | 계정 창고/Depot 수량 표시용 |
| `maple-digger-button-close.png` | HUD를 닫는 별도 팝업에만 사용 | 상시 HUD 패널 안에 임의로 넣지 않음 |

현재 HUD의 `Title`, `MineText`, `StorageText`, `CurrencyText`, `HandText`, `CartText`, `DepotText`, `SpecialText`, `WorkerStateText`는 Text 바인딩을 보존한다. 아이콘을 기존 Text 문자열에 합치지 않는다.

#### `ui/MineInventoryUI.ui` — 창고·판매 팝업

현재 기준: `/ui/MineInventoryUI/Panel`은 중앙 anchor, `620x540`이다. 현재 파일은 `StoneRow`를 포함한 텍스트 중심 구조이므로 자원 행을 추가할 때 같은 패턴을 복제한다.

| 파츠 | 적용 위치 | 배치 규칙 |
| --- | --- | --- |
| `maple-digger-panel-frame-large.png` | `Panel` | 중앙 창고 패널 프레임 |
| `maple-digger-ledger-row-resource-blank.png` | `Panel/StoneRow` 및 Iron/GoldOre 행 | 행 배경, 아이콘·이름·수량은 자식 Sprite/Text |
| `maple-digger-inventory-slot-blank.png` | 자원 선택 슬롯 | 아이콘과 수량 Text를 슬롯의 자식으로 둠 |
| `maple-digger-inventory-slot-selected.png` | 선택된 슬롯 | 빈 슬롯 위에 겹쳐 표시하고 아이콘은 가리지 않음 |
| `maple-digger-quantity-badge-blank.png` | 슬롯 우하단 수량 영역 | 숫자는 `TextGUIRendererComponent`로 표시 |
| `maple-digger-stepper-minus.png`, `stepper-plus.png` | 판매 수량 입력 좌우 | 기존 입력 필드와 같은 부모 아래에 배치 |
| `maple-digger-toggle-on.png`, `toggle-off.png` | 자동 판매 토글 | 상태 변경 시 SpriteSwap. 설명 문구는 `SaleSettingText` |
| `maple-digger-icon-warning-protected.png` | 보호 수량 초과 경고 | `SaleFeedback` 좌측에 표시하고 경고 문구는 Text |
| `maple-digger-icon-depot.png` | 계정 창고 섹션 | Depot 수량과 함께 사용 |
| `maple-digger-button-close.png` | `Panel/BtnClose` | 버튼 영역은 기존 `88px` 이상 터치 크기를 유지 |

`Panel/Hint`, `SaleSettingText`, `RareHeader`, `RareStoneText`, `RareIronText`, `RareGoldText`는 설명·진행도 텍스트다. 희귀 광물의 별도 아이콘은 승인표에서 후순위이므로 우선 일반 광물 아이콘과 색조·테두리로 구분한다.

#### `ui/MineSelectUI.ui` — 광산 선택·판매·희귀 광맥 패널

현재 기준:

- `/ui/MineSelectUI/SelectPanel`: 중앙, `780x980`, 광산 목록과 해금 버튼
- `/ui/MineSelectUI/SalePanel`: 중앙, `760x720`, 현재 활성 판매 패널
- `/ui/MineSelectUI/CartPanel`: 중앙, `760x620`, 기본 비활성
- `/ui/MineSelectUI/RarePanel`: 중앙, `760x640`, 기본 비활성

| 파츠 | 적용 위치 | 배치 규칙 |
| --- | --- | --- |
| `maple-digger-mine-node-current.png` | `SelectPanel/MineRoute/Current` | 현재 선택 광산 |
| `maple-digger-mine-node-next.png` | `SelectPanel/MineRoute/Next_*` | 다음 해금 가능 광산 |
| `maple-digger-mine-node-locked.png` | `SelectPanel/MineRoute/Locked_*` | 잠금 광산 |
| `maple-digger-mine-route-connector.png` | `SelectPanel/MineRoute/Route_*` | 노드 뒤쪽에 배치. 노드보다 낮은 OrderInLayer |
| `maple-digger-cost-chip-blank.png` | 광산 해금·강화 비용 및 `SalePanel/ProtectedAmountInput`·`SaleAmountInput` | 아이콘 슬롯과 숫자 Text를 분리 |
| `maple-digger-icon-stone.png`, `icon-iron.png`, `icon-gold-ore.png` | `SalePanel/BtnOreStone`, `BtnOreIron`, `BtnOreGold` | Button 배경과 별도로 아이콘 자식 배치 |
| `maple-digger-icon-special-vein.png` | `RarePanel/Info` 또는 `SelectPanel/ResourceText` | 특수 광맥 존재 여부를 시각적으로 보조 |
| `maple-digger-icon-warning-protected.png` | `SalePanel/SaleFeedback` | 보호 수량 경고 시에만 Enable |
| `maple-digger-button-green-blank.png`, `orange-blank`, `close` | `BtnBeginner`, `BtnDeep`, `BtnGem`, `BtnClose` 및 판매 버튼 | 기존 ButtonComponent를 유지하고 배경만 교체 |

`SelectPanel/Title`, `ResourceText`, `WorkerStatus`, `BeginnerText`, `DeepText`, `GemText`, `FeedbackText`, `SalePanel/SaleFeedback`, `SaleSummary`, `RarePanel/Info`는 런타임 텍스트다. 노드 이미지 안에 광산명·레벨·비용을 넣지 않는다.

#### `ui/PopupGroup.ui`, `ui/ToastGroup.ui`, `ui/AccountRecoveryUI.ui`

| 화면 | 파츠 배치 |
| --- | --- |
| `PopupGroup/PopupBack/PopupPanel` | `maple-digger-modal-frame-blank.png`을 패널 배경으로 사용. `PopupMessage`는 텍스트, `PopupBtnOK/Cancel`은 버튼 파츠 |
| `ToastGroup/Toast_message` | `maple-digger-toast-bar-blank.png`을 배경으로 사용. 아이콘 슬롯과 메시지 Text를 자식으로 추가 |
| `AccountRecoveryUI/Overlay/Panel/Bg` | 모달 프레임. `BtnRecover`는 녹색, `BtnAbandon`은 주황색, `Title`·`Message`는 텍스트 |

팝업과 토스트는 기존처럼 별도 UIGroup으로 유지한다. HUD 패널 안에 팝업을 중첩하지 않는다.

#### `SettingsUI` — 신규 파일로 분리

현재 `ui/SettingsUI.ui`는 존재하지 않는다. 생성할 때는 `SettingsUI`라는 이름의 별도 UIGroup으로 만들고 `ui/SettingsUI.ui`에 저장한다.

- `maple-digger-modal-frame-blank.png`: 중앙 설정 패널
- `maple-digger-settings-slider-track.png` + `settings-slider-thumb.png`: BGM/SFX 두 행
- `maple-digger-button-close.png`: 닫기 버튼
- 값·레이블은 모두 Text/Slider 런타임 값

설정 UI에 자동 판매 토글을 재사용하지 않는다. 자동 판매 토글은 `MineSelectUI/SalePanel` 또는 창고 판매 영역의 기능이다.

### 4. 파츠 조립 순서

1. **부모 프레임**: `Panel`/`Window`/`MineRoute` 같은 컨테이너를 먼저 만든다.
2. **배경**: 프레임·디머를 가장 낮은 OrderInLayer에 둔다.
3. **행·슬롯**: ledger row, inventory slot, cost chip을 부모의 자식으로 둔다.
4. **아이콘**: 아이콘은 Simple 이미지로 슬롯 안에 배치한다.
5. **상태 오버레이**: 선택 프레임·잠금·경고·검증 배지를 아이콘/행 위에 둔다.
6. **텍스트**: 이름·수량·레벨·비용·상태·오류 사유는 마지막에 Text 자식으로 추가한다.
7. **버튼**: 클릭이 필요한 경우 기존 ButtonComponent를 유지하고 SpriteSwap/배경 Sprite만 연결한다.

한 묶음은 `Parent/Child` 계층으로 만든다. 예: `Panel/ResourceRow/Icon`, `Panel/ResourceRow/Amount`, `SelectPanel/MineRoute/Current`. 루트에 텍스트와 배경을 형제 병렬로 쌓아 움직임·페이드·바인딩이 분리되는 구조는 피한다.

### 5. RUID·바인딩·검증 체크리스트

- PNG를 MSW Sprite 리소스로 등록하고 실제 RUID를 기록한다. 이 폴더의 파일명은 RUID가 아니다.
- UIBuilder로 기존 `.ui`를 `read/load`한 뒤 `find/getComponent`로 대상 노드를 확인한다.
- 배경은 `SpriteGUIRendererComponent.ImageRUID`, 텍스트는 `TextGUIRendererComponent.Text`, 클릭은 `ButtonComponent`에 연결한다.
- `.mlua` 프로퍼티가 특정 Entity UUID를 참조하면 `UIBuilder.write(..., { bind: ... })` 또는 `injectBindings()`로 바인딩한다. Maker에서 수동 드래그만으로 끝내지 않는다.
- `write()`의 UI lint를 통과한 뒤 `stop` → `refresh` → Play 순서로 확인한다.
- 확인 항목: 텍스트 잘림, 아이콘·텍스트 겹침, 팝업 표시 순서, 88px 터치 영역, 모바일 축소 시 프레임 왜곡, 선택/잠금/비활성 상태 전환.
- 실행 상태는 아이콘만으로 대체하지 않는다. `Idle/Running/Blocked/Stopped` 텍스트와 색을 함께 유지한다.
