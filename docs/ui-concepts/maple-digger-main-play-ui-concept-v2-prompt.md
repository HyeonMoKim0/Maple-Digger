# Maple-Digger 메인 플레이 UI 시안 v2

## 제작 목적

현재 프로젝트의 실제 UI 구조를 기준으로 한 메인 플레이 화면 시안이다. 단일 이미지 UI를 바로 MSW에 넣는 목적이 아니라, 기존 `.ui` 그룹을 유지하면서 패널·버튼·아이콘 에셋을 재제작하기 위한 시각 기준으로 사용한다.

## 실제 구조에 반영한 항목

- 좌측 `BlockProgramUI/Panel`: 640×960 기준
- 실제 명령 팔레트: E/W/N/S, MINE, LOAD, UNLOAD, REPEAT, COUNT, IF ORE, COND, END
- 프로그램 미리보기, 입력, 피드백, RUN/STOP/CLEAR/CONVERT/INPUT
- 우측 `MineHUD/Panel`: H1~H10 정보 계약 반영
- `INVENTORY` 버튼과 `MINE SELECT` 버튼만 상시 표시
- 중앙 특수 광맥 토스트는 `ToastGroup`으로 분리하는 전제
- 판매·희귀 광물·수레 강화·광산 선택은 중앙 모달로 분리하는 전제
- `PROGRAMS`·`APPEARANCE` 하단 네비게이션은 현재 구현 범위에서 제외

## 생성 방식

- 도구: Codex 내장 이미지 생성 기능
- 사용 이미지: v1 시안은 스타일·재질 참고용
- 기준 해상도: 1920×1080
- 대상 맵: RectTile 기반 `farm01`, `deep_mine`, `gem_mine`
- 제외 대상: MapleTile 사이드뷰 템플릿 `map01`

## 생성 프롬프트 요약

Create a revised 16:9 PC game UI concept mockup for a MapleStory Worlds mining game. Use the v1 mockup only as a visual reference for warm illustrated wood, brass, parchment, blue crystal, and dark mine styling. Redesign the information architecture around the current Maple-Digger UI.

Use a central top-down RectTile-style mine playfield. Place a fixed 640×960 block-program editor on the left. Include worker tabs 1–5, E/W/N/S, MINE, LOAD, UNLOAD, REPEAT, COUNT, IF ORE, COND, END, a program preview, input, feedback, RUN, STOP, CLEAR, CONVERT, and INPUT controls. Place a compact right HUD with current mine, mine level, STONE, IRON, GOLD ORE, GOLD, CRYSTAL, MINE TOKEN, selected worker hand/cart, and a compact RUNNING/IDLE/BLOCKED/STOPPED summary. Keep only INVENTORY and MINE SELECT launchers on the right. Put one special-vein toast at top-center.

Do not use a full-width bottom navigation, APPEARANCE, PROGRAMS, giant worker portraits, fictional stamina bars, promotional title, logo, fake paragraphs, clipped panels, or corrupted text. Use warm wood-and-brass frames, dark mine brown, parchment cream, system blue, and crystal cyan. Keep the screen readable and geometrically suitable for rebuilding as separate MSW UI entities.
