# Maple-Digger UI 제작·MCP 검증 인수인계

- 작성일: 2026-08-11
- 프로젝트: D:/Develope_files/GitHub/Maple-Digger
- 목적: 다른 세션에서 MSW Maker MCP를 연결한 뒤, 현재 UI 시안과 실제 UI 구조의 대응을 확인하고 런타임 검증을 이어가기 위한 문서

## 1. 현재 결론

현재 UI 방향은 다음과 같이 정리되어 있다.

- Maple 계열의 둥글고 두꺼운 게임 폰트를 전제로 한다.
- 기존의 어두운 광산 UI를 밝은 크림·꿀색·금색 프레임으로 보정한다.
- 명령 버튼은 하늘색, 실행은 녹색, 정지는 주황·빨강, 보조 기능은 크림색을 사용한다.
- 광석·재화·명령 아이콘은 둥근 보석형과 치비풍 외곽선으로 통일한다.
- 좌측 프로그램 편집기, 중앙 RectTile 광산, 우측 HUD라는 정보 구조는 유지한다.
- 우측 HUD는 MSW 데스크톱 시스템 UI 예약 영역과 겹치지 않도록 오른쪽·상단 모서리에서 안쪽과 아래쪽으로 배치한다.
- 상시 노출 진입 버튼은 Inventory와 Mine Select만 둔다.
- 토스트와 중앙 모달은 메인 화면에 평면 합성하지 않고 별도 UI 그룹으로 유지한다.

## 2. 현재 산출물

### 메인 플레이 시안

- [메인 UI v2.2 밝은 버전](D:/Develope_files/GitHub/Maple-Digger/docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-1920x1080.png)
- [메인 UI v2.2 생성 기록](D:/Develope_files/GitHub/Maple-Digger/docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-prompt.md)

### UI 키트

- [UI Kit v1 1920x1080](D:/Develope_files/GitHub/Maple-Digger/docs/ui-concepts/maple-digger-ui-kit-v1-1920x1080.png)
- [UI Kit v1 생성 기록](D:/Develope_files/GitHub/Maple-Digger/docs/ui-concepts/maple-digger-ui-kit-v1-prompt.md)

키트 보드에는 다음 요소가 포함되어 있다.

- BlockProgramUI 대형 패널
- MineHUD 소형 패널
- Command / Run / Stop / Clear / Input / Mine Select / Inventory 버튼
- 선택·일반·비활성 탭
- 입력창·다중 행 프로그램 창
- Toast / Modal 프레임
- Stone / Iron / Gold Ore / Gold / Crystal / Mine Token 아이콘
- 이동·채굴·적재·반복·조건·종료·변환·입력·실행 아이콘
- 워커 상태 점과 선택 워커 배지
- 팔레트와 폰트 기준

## 3. 중요한 구현 경계

현재 생성된 PNG는 아트 방향과 레이아웃을 전달하는 시각 레퍼런스다. PNG 한 장을 게임 화면에 통째로 넣어 실제 UI로 대체하지 않는다.

실제 적용 시에는 다음과 같이 진행한다.

1. 기존 UI 루트를 유지한다.
2. 패널·텍스트·버튼·아이콘을 개별 요소로 구성한다.
3. .ui 수정은 반드시 UIBuilder 경로를 사용한다.
4. 실제 폰트와 한글 텍스트를 MSW Text GUI 요소에 적용한다.
5. 아이콘은 실제 SpriteRUID 또는 프로젝트 리소스 연결이 필요하다.
6. 앵커·피벗·GroupOrder·UUID 바인딩을 확인한다.
7. Maker Refresh → Play → Screenshot/Logs 순서로 런타임을 검증한다.

현재 이 세션에서는 .ui, .mlua, .map 런타임 파일을 수정하지 않았다. 생성된 이미지와 인수인계 문서만 추가된 상태다.

## 4. 실제 UI 구조 확인 결과

### UI 루트

실제 파일은 ui/ 아래에 있다.

- ui/DefaultGroup.ui
- ui/BlockProgramUI.ui
- ui/MineHUD.ui
- ui/MineInventoryUI.ui
- ui/MineSelectUI.ui
- ui/PopupGroup.ui
- ui/ToastGroup.ui
- ui/AccountRecoveryUI.ui

현재 확인된 실제 GroupOrder는 다음과 같다.

| Group | GroupOrder |
|---|---:|
| DefaultGroup | 0 |
| BlockProgramUI | 1 |
| MineHUD | 2 |
| MineInventoryUI | 3 |
| MineSelectUI | 4 |
| PopupGroup | 5 |
| ToastGroup | 6 |
| AccountRecoveryUI | 7 |

문서에 이전 목표 순서가 남아 있을 수 있으므로, 다음 세션에서는 실제 .ui 파일과 Maker 상태를 기준으로 판단한다. GroupOrder를 추측으로 일괄 변경하지 않는다.

### 주요 레이아웃

- BlockProgramUI.Panel: 약 640×960, 좌측 하단 앵커 기반
- MineHUD.Panel: 약 460×466, 우측 HUD
- MineSelectUI: 중앙 모달 계열. 선택·판매·희귀 광산·카트 관련 패널을 한 화면에 중첩하지 않고 상태별로 전환
- ToastGroup: 독립 토스트 루트
- AccountRecoveryUI: 전체 화면 오버레이와 중앙 패널

### BlockProgramUI 기능 계약

실제 RootDesk/MyDesk/Farm/BlockProgramController.mlua 기준:

- MaxProgramBlocks = 30
- MaxProgramDepth = 3
- 이동: E / W / N / S
- 작업: Mine / Load / Unload
- 제어: Repeat / RepeatCount / IfOre / Condition / End
- 실행: Run / Stop / Clear / Convert / Collapse
- 입력창, 프로그램 문자열, 피드백 문자열
- 워커 탭 1–5

### MineHUD 정보 계약

실제 RootDesk/MyDesk/Mine/MineInventoryController.mlua 기준으로 다음 정보 영역을 보존한다.

- 현재 광산
- 광산 레벨 표시 영역
- Stone / Iron / Gold Ore
- Gold / Crystal / Mine Token
- 선택 워커 번호
- 선택 워커의 손에 든 광석
- 선택 워커 카트 수량·용량
- 전체 워커 상태 요약

## 5. 맵·플랫폼 범위

MapBuilder로 확인한 맵 모드는 다음과 같다.

- map/map01.map: TileMapMode 0 / MapleTile / 사이드뷰
- map/farm01.map: TileMapMode 1 / RectTile / 탑다운
- map/deep_mine.map: TileMapMode 1 / RectTile / 탑다운
- map/gem_mine.map: TileMapMode 1 / RectTile / 탑다운

이번 UI 시안은 farm01, deep_mine, gem_mine의 RectTile 탑다운 플레이를 기준으로 한다. map01 사이드뷰 화면에 그대로 적용한다고 가정하지 않는다.

## 6. 다음 세션 MCP 검증 순서

다음 세션은 먼저 MSW Foundation과 UI 규칙을 로드하고, 실제 Maker MCP가 연결된 상태를 확인한다.

### 연결·정적 확인

1. 프로젝트 경로가 D:/Develope_files/GitHub/Maple-Digger인지 확인한다.
2. Maker MCP의 현재 활성 월드·Room·Editor 연결 상태를 확인한다.
3. ui/의 실제 UI 루트와 현재 GroupOrder를 다시 읽는다.
4. farm01 또는 deep_mine를 현재 검증 대상 맵으로 선택한다.
5. 시안 PNG는 레이아웃 비교용으로만 열고, 실제 UI 파일과 혼동하지 않는다.

### 런타임 확인

1. Maker refresh를 수행한다.
2. play로 실행한다.
3. screenshot으로 1920×1080 화면을 캡처한다.
4. 좌측 프로그램 편집기와 중앙 플레이 영역이 겹치지 않는지 확인한다.
5. 우측 HUD가 모서리 예약 영역과 겹치지 않는지 확인한다.
6. Inventory 클릭 시 MineInventoryUI가 열린다.
7. Mine Select 클릭 시 MineSelectUI가 열린다.
8. 두 중앙 모달이 동시에 보이지 않는지 확인한다.
9. 특수 광맥·피드백 토스트가 ToastGroup에서 별도로 표시되는지 확인한다.
10. Run / Stop / Clear / Convert / Input 및 워커 탭 1–5의 실제 동작을 확인한다.
11. logs(kind="build")와 logs(kind="normal")로 빌드·런타임 오류를 확인한다.
12. 검증 후 stop한다.

### 검증 시 주의

- MCP 호출 없이 작동한다, 오류가 없다고 단정하지 않는다.
- 시안 이미지의 영문 텍스트를 실제 바인딩 성공으로 간주하지 않는다.
- SpriteRUID가 비어 있거나 임시 아이콘이면 화면에서 보이지 않을 수 있으므로 실제 리소스 연결을 확인한다.
- .ui를 직접 JSON 편집하지 않는다. 반드시 UIBuilder를 사용한다.
- 기존 map/farm01.map 수정 사항과 .claude/settings.local.json은 이전 작업에서 존재하던 변경이므로, 검증 세션에서 임의로 되돌리거나 삭제하지 않는다.

## 7. 완료 기준

다음 세션에서 아래 조건을 모두 확인해야 UI 구현 완료로 판단한다.

- 실제 게임 화면에서 좌측 편집기·중앙 RectTile 광산·우측 HUD가 동시에 보인다.
- 1920×1080 기준으로 각 UI가 잘리지 않는다.
- 우측 HUD가 시스템 UI 예약 영역과 충돌하지 않는다.
- Inventory와 Mine Select가 각각 열리고 닫힌다.
- 중앙 모달이 동시에 중첩되지 않는다.
- 토스트가 별도 그룹으로 표시된다.
- 프로그램 명령과 Run / Stop / Clear / Convert / Input이 실제 코드와 연결된다.
- UI 텍스트와 아이콘이 실제 리소스와 바인딩된다.
- build/normal 로그에 관련 오류가 없다.

## 8. 변경 범위 메모

이번 인수인계 작업으로 추가된 주요 파일:

- docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-1920x1080.png
- docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-generated.png
- docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-prompt.md
- docs/ui-concepts/maple-digger-ui-kit-v1-1920x1080.png
- docs/ui-concepts/maple-digger-ui-kit-v1-generated.png
- docs/ui-concepts/maple-digger-ui-kit-v1-prompt.md

게임 코드와 실제 .ui 런타임 구조는 아직 수정하지 않았다.
