# Maple-Digger MineInventoryUI 시안 v1 생성 기록

## 목적

`MineInventoryUI`의 필수 정보 계약을 기존 밝은 v2.2 UI 스타일로 정리한 1920×1080 시안이다. 실제 `.ui`를 대체하는 합성 배경이 아니라 패널·행·버튼·아이콘을 개별 요소로 구현하기 위한 시각 레퍼런스다.

## 근거 문서

- `docs/04-자원-인벤토리.md` §5~§7
- `docs/08-비주얼-사운드-기능명세.md` §5.2 I1~I6, §6
- `docs/20-UI-아이콘-승인표.md` §0, §7~§8
- `docs/ui-concepts/maple-digger-main-play-ui-concept-v2-2-bright-1920x1080.png`
- `docs/ui-concepts/maple-digger-ui-kit-v1-1920x1080.png`

## 화면 구성

- 일반 광물: Stone / Iron / Gold Ore
- 희귀 컬렉션: 종류별 `n/10`, 보관 수량, 판매 잠금
- 자동 판매와 보호 수량
- 적용 중인 희귀 패시브
- Sell / Set Protection / Close

## 시각 규칙

- 밝은 크림·꿀색·금색 프레임과 짙은 갈색 외곽선
- 주요 액션은 파랑, 확인은 녹색, 닫기·정지는 주황·빨강
- 희귀 광물은 보라·파랑·금색 보석 계열로 구분
- 중앙 팝업은 완전 불투명, 뒤의 메인 화면은 dim 처리

## 구현 경계

- 희귀 컬렉션은 별도 화면이 아니라 인벤토리 팝업 안의 섹션으로 둔다.
- 텍스트와 아이콘은 실제 구현에서 MSW Text GUI와 승인 SpriteRUID로 분리한다.
- `.ui` 수정은 UIBuilder로 수행하고 I1~I6 전체를 갱신 키에 포함한다.

