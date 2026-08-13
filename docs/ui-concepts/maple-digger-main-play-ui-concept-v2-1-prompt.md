# Maple-Digger 메인 플레이 UI 시안 v2.1 생성 기록

## 목적

현재 Maple-Digger의 실제 MSW UI 구조를 기준으로, 메인 플레이 화면의 정보 배치와 시각적 방향을 확인하기 위한 이미지 시안이다. 실제 `.ui` 파일을 대체하는 산출물이 아니라 제작 기준용 레이아웃 레퍼런스다.

## 반영한 구조

- 좌측: `BlockProgramUI`의 640px급 프로그램 편집기와 이동·채굴·적재·반복·조건·종료·실행·정지·초기화 컨트롤
- 중앙: `farm01`, `deep_mine`, `gem_mine`의 RectTile 기반 탑다운 채굴 플레이 영역
- 우측: `MineHUD`의 H1–H10 정보 계약에 대응하는 광산·광석·재화·선택 워커·손/카트·전체 워커 상태 요약
- 우측 하단: 상시 노출이 필요한 `MineInventoryUI`와 `MineSelectUI` 진입 버튼만 배치
- 상단 중앙: 짧은 피드백/토스트 영역
- 중앙 모달, 토스트, 계정 복구 화면은 메인 화면에 합성하지 않고 별도 UI 그룹으로 유지

## v2.1 보정 사항

v2의 좌측 편집기와 중앙 플레이 영역은 유지하고, 우측 HUD 전체를 화면의 우측·상단 가장자리에서 안쪽과 아래쪽으로 이동했다. MSW 데스크톱 시스템 UI가 사용할 수 있는 모서리 예약 영역과 겹칠 가능성을 줄이고, HUD·인벤토리·광산 선택 버튼 사이의 수직 흐름을 확보하기 위한 보정이다.

## 생성 지시 요약

- Keep the left 640px program editor, the centered flat RectTile mine playfield, the warm hand-painted mining illustration style, and the top-center special-vein toast.
- Preserve the full right-side HUD information set: current mine, mine level, stone/iron/gold ore, gold/crystal/mine token, selected worker hand/cart, and all-worker status summary.
- Move the entire right HUD cluster inward from the right edge and downward from the top edge, leaving a generous blank margin near the upper-right corner before persistent content begins.
- Stack the Inventory and Mine Select entry buttons below the HUD.
- Do not add bottom navigation, APPEARANCE, PROGRAMS, giant portraits, stamina bars, title art, or logos.
- Keep labels legible and treat English labels as temporary placeholders for later Korean text overlay in the actual `.ui` implementation.

## 구현 주의

실제 제작 단계에서는 이 시안을 하나의 평면 이미지로 넣지 않는다. 기존 `DefaultGroup`, `BlockProgramUI`, `MineHUD`, `MineInventoryUI`, `MineSelectUI`, `PopupGroup`, `ToastGroup`, `AccountRecoveryUI` 루트를 유지하고, 각 패널·버튼·텍스트·아이콘을 `UIBuilder`로 분리 구성한다. 앵커/피벗, `GroupOrder`, UUID 바인딩, 1920×1080 미리보기와 실제 플레이 검증이 필요하다.
