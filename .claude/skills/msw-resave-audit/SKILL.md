---
name: msw-resave-audit
description: "Play 를 돌린 뒤 미커밋으로 남은 ui/ · map/ · Models/ 파일이 Maker 의 정규화 재저장인지 실제 변경인지 판정하고, 정규화면 chore 커밋으로 분리한다. .ui/.model 은 가드가 shell 접근을 막으므로 HEAD 판과 작업 트리 판을 각각 빌더로 열어 대조한다. Use when: Play·refresh 뒤 git status 에 .ui/.map/.model 이 떠 있을 때, 커밋 직전에 무엇이 실제 변경인지 갈라야 할 때, 'Maker 가 파일을 건드린 것 같다' 싶을 때, 재저장분을 chore 로 분리할 때. Keywords: 재저장, 정규화, resave, git status, chore 커밋, GroupOrder 회귀, D-13, 커밋 분리, 무엇이 바뀌었나"
---

# Maker 재저장분 판정

## 왜 이 스킬이 있는가 — 정규화에 회귀가 섞여 들어온다

Play 를 여러 번 돌리면 Maker 가 `ui/*.ui` · `map/*.map` · `Models/**` 를 **정규화 재저장**한다. 대부분은 무해하다 — `Rotation` 필드 추가, 앵커 해석값 기입, float32 반올림, 자식 `displayOrder` 당김, `componentNames` 순서 바뀜.

**그러나 D-13 이 정확히 이 틈으로 들어왔다.** 엔진 26.7 업그레이드 재저장에서 `UIGroupComponent.GroupOrder` 3개가 `10→3` / `20→4` / `50→6` 으로 되돌아갔고, 나머지 5개는 그대로여서 **상대 순서가 깨졌다.** 토스트와 복구 오버레이가 모달 아래로 내려갔는데, **화면을 켜 보기 전에는 드러나지 않았다.**

> **원칙: 재저장분은 "정규화겠지"로 넘기지 않는다. 구조를 대조해 판정하고 커밋한다.**

`docs/17` §1 주의사항 6 은 "`git status` 로 재저장분을 확인하라"까지만 말한다. **무엇을 근거로 정규화라고 판정하는지가 이 스킬이다.**

---

## 왜 눈으로 못 보나 — `git diff` 가 막혀 있다

`.ui` / `.model` 은 **빌더 전용**이라 가드가 `cat` / `Get-Content` / `grep` / 경로를 지정한 `git diff` 를 전부 막는다. 뚫으려 하지 말 것 — 막힌 이유가 있다(원본 JSON 을 눈으로 고치다 UUID·ValueType 정합성이 깨진 이력).

**대신 HEAD 판과 작업 트리 판을 각각 빌더로 열어 대조한다.** `git show HEAD:<path>` 로 임시 파일을 뽑고, 양쪽을 `UIBuilder.load` / `MapBuilder.read` / `ModelBuilder.read` 로 열어 구조를 비교한다. 도구가 이걸 한다.

> 디렉터리 단위 `git diff -- ui` 는 가드를 통과하지만 **판정 근거로 쓰지 말 것.** 줄 수만 보면 1470줄 바뀐 `MineHUD.ui` 가 실제로는 순수 정규화이고, 2줄 바뀐 파일에 회귀가 들어 있을 수 있다. 줄 수는 구조와 무관하다.

---

## 절차

### 1. 도구를 돌린다

```bash
node tools/audit_resave.cjs
```

미커밋 상태인 `.ui` / `.map` / `.model` 만 골라서 세 가지를 본다.

| 검사 | 판정 |
|---|---|
| **엔티티 집합** (`.ui` / `.map`) | 추가·삭제가 있으면 실제 변경 |
| **`componentNames`** (`.ui` / `.map`) | 구성이 바뀌면 실제 변경, **순서만 바뀌면 정규화** |
| **components · children · Values** (`.model`) | 하나라도 다르면 실제 변경. 전부 같으면 `ValueType` 메타데이터만 바뀐 것 |

이어서 재저장에 섞여 들어온 적이 있는 **회귀 2종**을 항상 점검한다 (미커밋 파일이 없어도 돈다).

| 회귀 | 근거 |
|---|---|
| `UIGroupComponent.GroupOrder` 가 **밀집 수열 0..N** 인가 | D-13. 절대값은 런타임에 0..N 으로 재압축되므로 **상대 순서만 의미가 있고**, 그래서 파일도 밀집 수열로 맞춰 뒀다 (`docs/17` §1 주의사항 6·7) |
| `TextComponent` + `TextGUIRendererComponent` **동시 보유** 0건인가 | D-14b. `UIBuilder.text()` 가 레거시 렌더러를 함께 붙이면 같은 자리에 문자열이 겹쳐 찍힌다 (§1 주의사항 9) |

**종료 코드**: `0` = 순수 정규화 / `1` = 구조 변경 또는 회귀 발견.

### 2. 판정에 따라 가른다

| 결과 | 할 일 |
|---|---|
| `[정규화]` 만 | 그대로 **`chore:` 단일 커밋**으로 분리 (아래 §커밋) |
| `[변경]` 있음 | 내가 의도한 변경인지 확인한다. 의도했으면 **기능 커밋**에 넣는다. 기억에 없으면 Maker 에서 무심코 만진 것이므로 되돌린다 |
| `[회귀]` 있음 | **먼저 되돌린 뒤** 커밋한다. `GroupOrder` 는 `UIBuilder.patchComponent` 로 밀집 수열을 복구한다 |

### 3. 커밋을 분리한다

**기능 커밋에 재저장분을 섞지 않는다** (2026-08-04 합의). 섞으면 다음 세션이 "무엇이 실제 변경인지" 구분할 수 없다.

```bash
git add ui map RootDesk/MyDesk/Models
git commit -F <메시지파일>
```

메시지에 **무엇을 근거로 정규화라고 판정했는지** 남긴다 — "재저장분입니다"만 적으면 다음 사람이 다시 판정해야 한다.

> ⚠️ 커밋 메시지 본문에 `.model` / `.ui` 문자열이 들어가면 **가드가 `git commit -m` 명령 자체를 막는다.** 메시지를 파일에 쓰고 `git commit -F <path>` 로 넘긴다. (명령줄에 그 확장자가 나타나는 것이 트리거이고, 파일 내용은 검사하지 않는다.)

---

## 한계 — 파일이 맞다는 것은 화면이 맞다는 뜻이 아니다

**회귀 점검 2종은 파일 기준이다.** `.ui` 컴포넌트 제거는 Maker 에 **이미 임포트된 엔티티에 소급되지 않는다** — 파일에서는 지워졌는데 런타임에는 남아 화면에 찍힌다 (`docs/17` §1 주의사항 10, 실제로 D-14b 가 이렇게 통과로 나왔다).

화면 계약을 판정해야 하면 Play 중 client 스크립트로 `/ui/<Group>` 을 재귀 순회해 **런타임에서** 센다. 그리고 `GroupOrder` 계층 검증도 파일값이 아니라 **런타임 상대 순서**로 한다.

```lua
-- Play 중 client. 파일 감사가 통과해도 이쪽이 0인지 따로 본다.
local scanned, dual = 0, 0
local function walk(e)
    scanned = scanned + 1
    if e:GetComponent("MOD.Core.TextComponent") ~= nil
       and e:GetComponent("MOD.Core.TextGUIRendererComponent") ~= nil then dual = dual + 1 end
    for _, c in ipairs(e.Children:ToTable()) do walk(c) end
end
walk(_EntityService:GetEntityByPath("/ui/MineHUD"))
log("scanned=" .. tostring(scanned) .. " dualRenderer=" .. tostring(dual))
```

---

## 흔한 실수

- **줄 수로 판정한다.** 1470줄 바뀐 파일이 순수 정규화이고 2줄 바뀐 파일에 회귀가 있을 수 있다.
- **`git diff` 를 뚫으려 한다.** `.ui`/`.model` 가드는 우회 대상이 아니다. 빌더 대조가 정답이다.
- **회귀 점검을 건너뛴다.** 구조가 같아도 `GroupOrder` 값은 바뀔 수 있다 — 그게 D-13 이다.
- **기능 커밋에 섞는다.** 다음 세션이 diff 를 읽을 수 없게 된다.
- **판정 근거를 커밋 메시지에 안 남긴다.** 같은 판정을 매번 다시 하게 된다.
- **파일 감사만으로 "화면도 맞다"고 보고한다.** 위 §한계 참조.

---

## 관련

| 대상 | 용도 |
|---|---|
| `tools/audit_resave.cjs` | 이 절차의 구현 |
| `tools/audit_bindings.cjs` | 별개 검사 — `.mlua` 프로퍼티 UUID ↔ 실제 컴포넌트 대조. 커밋 전 함께 돌린다 |
| `msw-general` `references/builder-protocol*.md` | 빌더 호출 규약 (대조에 쓰는 read-side API) |
| `docs/17` §0.2 · §1 주의사항 6·7·9·10 | 커밋 경계, D-13 / D-14b 원문 |
| `Archive/As-built.md` | 재저장분 판정 이력 |
