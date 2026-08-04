---
name: msw-asset-verify
description: "MSW 자산(RUID)을 코드에 넣기 전에 월드에 띄워 실물로 판정한다. msw-search 결과의 이름·설명은 실제 그림과 다를 수 있으므로, 후보를 한 줄로 배치해 스크린샷으로 고르고 결과를 승인표에 되먹인다. Use when: 스프라이트·애니메이션클립·아바타 아이템 후보를 고를 때, 자산 승인표(docs/21·docs/20)의 승인란이 비어 있는 RUID를 쓸 때, 오너가 '안 보인다/이상하다'고 한 자산을 교체할 때, 이 자산이 화면에서 읽히는지 판단해야 할 때. Keywords: 자산 판정, RUID 확인, 스프라이트 고르기, 후보 비교, 승인표, 육안 확인, asset approval, sprite candidate, 실물 확인"
---

# MSW 자산 실물 판정

## 왜 이 스킬이 있는가 — 같은 사고가 두 번 났다

| 사고 | 문서에 적힌 설명 | 실제 렌더 |
|---|---|---|
| **C206** (2026-07-31) | `부유석` `condition1~5` = 잔량 5단계 | `condition2`만 빨강인 **색상 변종**. 순서에 끼우면 stage마다 색이 튄다 |
| **채굴 파편** (2026-08-04) | `d4f82b52…` "돌 파편 흩어짐" | **어두운 얼룩**. 초록 바닥에서 잔디와 구분 안 됨 |
| 〃 | `6ade17ad…` "작은 노란 스파크" | **보라색 광석 덩어리** |

셋 다 **검색 API가 준 이름·태그를 그대로 믿고** 코드에 넣어서 났다. 두 번째 사고는 오너가 Play 화면을 보고서야 잡혔다.

> **원칙: 자산은 "설명"이 아니라 "그림"으로 고른다.** `searchResources`의 `names`/태그는 판정 근거가 아니다.

---

## 언제 이 절차를 밟나

- 새 RUID를 `SpriteRUID` / `ImageRUID` / `Custom*Equip`에 **처음** 넣을 때
- 승인표(`docs/21`, `docs/20`)의 **승인란이 비어 있는** 후보를 쓸 때 — 비어 있다 = 육안 미확인이다
- 오너가 "안 보인다 / 이상하다"고 한 자산을 교체할 때

**건너뛰어도 되는 경우**: 승인표에 ✅가 붙어 있고 그 판정이 실물 확인 기반임이 문서에 적혀 있을 때.

---

## 절차

### 1. 후보를 모은다

`msw-search`로 검색한다. **한 번에 3~8개**를 모은다. 한두 개만 보면 "그나마 나은 것"을 고르게 된다.

시각 이펙트는 `resourceTypeFilter: ["animationclip","sprite"]` + `categoryFilter: ["skill","mob","etc"]`로 찾는다. `effect`는 **오디오**다.

### 2. 월드에 한 줄로 띄운다

Play 중 `maker_execute_script`(**client**)로 클라이언트 로컬 엔티티를 만든다. `stop`하면 전부 사라지므로 **파일을 건드리지 않는다.**

```lua
local map = _UserService.LocalPlayer.CurrentMap
local candidates = {
    { "A", "<ruid>" }, { "B", "<ruid>" }, { "C", "<ruid>" },
}
for i = 1, #candidates do
    local tag, ruid = candidates[i][1], candidates[i][2]
    local x = -3.5 + (i - 1) * 1.15
    local e = _SpawnService:SpawnByModelId("fxsprite", "Cand_" .. tag, Vector3(x, 1.5, 0), map)
    if e == nil then
        log_error("[CAND] spawn failed " .. tag)
    else
        e.TransformComponent.Position = Vector3(x, 1.5, 0)
        e.TransformComponent.Scale = Vector3(1.0, 1.0, 1)
        local r = e.SpriteRendererComponent
        r.SpriteRUID = ruid          -- 아바타 아이템은 아래 "아바타" 절 참조
        r.OrderInLayer = 20          -- HUD·편집기에 가리지 않게 앞으로
        r.Enable = true
        log("[CAND] " .. tag .. " x=" .. tostring(x))
    end
end
```

**배치 요령**

- **빈 초록/바닥 영역**에 둔다. 편집기 패널(좌 640px)과 HUD(우상단)에 가려지지 않는 자리를 고른다. 안 보이면 `패널 접기`로 접는다.
- 실제 쓸 배경 위에 둔다 — 대비 판정이 목적이라 흰 배경에서 보면 의미가 없다.
- 크기가 애매하면 `Scale`을 키워 **모양을 먼저** 확정하고, 그다음 실제 크기로 되돌려 **읽히는지**를 본다.

### 3. 스크린샷으로 판정한다

`maker_screenshot` → `Read`로 확인한다. **로그로는 판정할 수 없다.** RUID가 들어갔다는 로그는 "렌더된다"를 증명하지 못한다.

판정 기준 (D5 §8 **V1** — "색 외의 형태로 구분"):

| 항목 | 실패 신호 |
|---|---|
| **대비** | 배경과 섞여 "그림자 같다" / 얼룩으로 보인다 |
| **형태** | 후보끼리 색만 다르고 실루엣이 같다 |
| **크기** | 한 셀(1 world unit)을 크게 넘거나, 24px 미만으로 뭉개진다 |
| **의미** | 이름과 그림이 다르다 (스파크인 줄 알았는데 광석 등) |

### 4. 정리하고 기록한다

- 후보를 지운다: `for _, c in ipairs(map.Children:ToTable()) do if string.find(c.Name, "Cand_") ~= nil then c:Destroy() end end`
- **승인표에 되먹인다.** 기각한 것은 지우지 말고 **왜 기각했는지 실물 관찰을 남긴다** — 다음 세션이 같은 후보를 다시 집는다.

```markdown
| 대상 | 권장 | RUID | 승인 |
| 채굴 파편 | ~~돌 파편~~ → ❌ 기각 (2026-08-04 실측). 어두운 얼룩이라 초록 바닥에서 잔디와 구분 안 됨 | ~~`d4f82b52…`~~ | ❌ |
| 채굴 파편 (확정) | 흰 먼지 퍼짐 — 후보를 나란히 놓고 비교. 초록 바닥에서 유일하게 읽힌다 | `78ea5621…` | ✅ 확정 |
```

---

## 아바타 아이템은 방식이 다르다

`avataritem` RUID를 `SpriteRUID`에 그대로 넣으면 **오류 없이 아무것도 안 나온다.** 두 가지 중 하나를 쓴다.

| 목적 | 방법 |
|---|---|
| 아이템 그림만 빠르게 비교 | `r.SpriteRUID = "thumbnail://" .. ruid` — 정적 썸네일로 렌더된다 |
| 실제 착용 모습 확인 | 아바타를 가진 엔티티의 `CostumeManagerComponent.Custom*Equip`에 **접두어 없는 plain RUID**를 넣고 스크린샷 |

**착용 확인이 최종 판정이다.** 썸네일은 색·형태만 보여 주고, 실루엣이 캐릭터에 붙었을 때 어떻게 읽히는지는 착용해 봐야 안다. 슬롯 매핑과 상호배타 규칙(롱코트↔상하의, 두손무기↔한손+보조)은 `msw-avatar`를 따른다.

---

## 흔한 실수

- **후보 하나만 띄우고 판정한다.** 비교 대상이 없으면 "그럭저럭 보인다"로 통과시킨다. 최소 3개를 나란히 놓는다.
- **편집기 패널·HUD에 가린 채 스크린샷을 찍는다.** 화면 우상단과 좌측 1/3은 상시 UI가 점유한다.
- **로그만 보고 통과시킨다.** `SpriteRUID`가 설정됐다는 로그는 그림에 대해 아무것도 말하지 않는다.
- **기각 이유를 안 남긴다.** 다음 세션이 같은 RUID를 검색 결과 상위에서 다시 집는다.
- **`.model`/`.map`에 후보를 심어 놓고 비교한다.** 런타임 스폰이면 `stop` 한 번으로 원복되지만, 파일에 심으면 정리가 남는다.

---

## 관련

| 대상 | 용도 |
|---|---|
| `msw-search` | 후보 수집 (`searchResources` / `searchAvatarItems`) |
| `msw-sprite-ruid` | `thumbnail://` 접두어 규칙, 타입별 대입 가능 슬롯 |
| `msw-avatar` | 아바타 17슬롯 매핑, 착용 확인 |
| `msw-painter` | 검색으로 못 찾으면 직접 제작 |
| `docs/21` · `docs/20` | 이 프로젝트의 자산 승인표 — 판정 결과를 여기에 되먹인다 |

> `model://fxsprite`는 이 프로젝트의 표시 전용 템플릿(`RootDesk/MyDesk/Models/Mine/FxSprite.model`)이다. 다른 프로젝트에서는 `TransformComponent` + `SpriteRendererComponent`만 가진 모델을 하나 만들어 쓴다.
