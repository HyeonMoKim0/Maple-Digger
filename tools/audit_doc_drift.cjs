// 문서 드리프트 감지 — `feat:`/`fix:` 커밋이 docs/16(원본 절)과 docs/29(검수표)에
// 등재됐는지 커밋 해시로 대조한다.
//
// 왜 있는가: 같은 누락이 세 번 재발했다.
//   1차 2026-08-26 — docs/16 에만 쌓여 docs/29 가 오너 항목 8건 누락
//   2차 2026-08-27 — 커밋 9건이 docs/16 에조차 없음
//   3차 2026-08-28 — 커밋 8건, 그중 하나가 신규 화면 1개(조작법 창)
// docs/00 진행원칙 1-1 과 Archive/As-built.md 경고문이 이미 "착수 시점에 적는다"고
// 명시하는데 세 번 다 뚫렸다. 규칙이 아니라 기계가 세야 한다 (docs/29 D5).
//
// 판정 기준: 커밋의 **짧은 해시**가 docs/*.md 또는 Archive/As-built.md 본문에
// 나타나면 등재된 것으로 본다. 등재할 때 해시를 적는 것이 이 프로젝트의 기존
// 관행이다(docs/16 §81~§86, docs/18 티켓 미부여 묶음 표).
//
// 사용법:
//   node tools/audit_doc_drift.cjs            # 마커 이후 전체 검사
//   node tools/audit_doc_drift.cjs <ref>      # 범위 시작점을 직접 지정
// 종료 코드: 미등재 0건이면 0, 1건 이상이면 1 (CI/DoD 에서 게이트로 쓸 수 있다)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// 저장소 루트는 이 스크립트 위치에서 끌어낸다. 절대 경로를 박으면 클론한 컴퓨터마다
// 즉사한다 — audit_bindings·balance_sim 이 실제로 그렇게 죽어서 DoD "실패 0건"이
// 한 번도 참이 아니었을 수 있다 (As-built J10).
const ROOT = path.resolve(__dirname, "..");

// 등재를 요구하는 커밋 종류. chore/docs/style 은 면제한다 — Maker 정규화 재저장이나
// 문서 자체 커밋은 오너가 볼 것이 없다(docs/29 "이 표에 없는 것" 마지막 행).
const REQUIRE = /^(feat|fix)(\(|:)/;
// 판정은 하되 실패로 세지 않는 종류. 동작이 바뀔 수 있어 눈으로는 봐야 한다.
const WARN = /^(refactor|perf)(\(|:)/;

const MARKER = /<!--\s*last-audited:\s*([0-9a-f]{7,40})\s*-->/i;
const AUDIT_DOC = path.join(ROOT, "docs", "16-사용자-검수-체크리스트.md");

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trimEnd();
}

// ---- 1. 검사 범위의 시작점
function resolveSince() {
  const arg = process.argv[2];
  if (arg) return { ref: arg, from: "명령행 인자" };

  if (fs.existsSync(AUDIT_DOC)) {
    const m = MARKER.exec(fs.readFileSync(AUDIT_DOC, "utf8"));
    if (m) return { ref: m[1], from: "docs/16 의 last-audited 마커" };
  }
  // 마커가 없으면 최근 50커밋을 본다. 범위가 넓어지면 이미 등재된 커밋도 후보에
  // 들어오지만, 해시 대조에서 걸러지므로 오탐이 되지는 않는다 — 느려질 뿐이다.
  return { ref: null, from: "마커 없음 → 최근 50커밋" };
}

const since = resolveSince();
const range = since.ref ? `${since.ref}..HEAD` : "-50";
let raw;
try {
  raw = git(["log", range, "--no-merges", "--format=%h%s"]);
} catch (e) {
  console.error(`[drift] git log 실패 (범위 ${range}). 마커의 커밋이 이 클론에 없을 수 있다.`);
  process.exit(2);
}

const commits = raw
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [hash, subject] = line.split("");
    return { hash, subject };
  });

// ---- 2. 문서 본문 인덱스
const docFiles = [];
const docsDir = path.join(ROOT, "docs");
if (fs.existsSync(docsDir)) {
  for (const n of fs.readdirSync(docsDir)) {
    if (n.endsWith(".md")) docFiles.push(path.join(docsDir, n));
  }
}
const asBuilt = path.join(ROOT, "Archive", "As-built.md");
if (fs.existsSync(asBuilt)) docFiles.push(asBuilt);

const docText = new Map(); // 상대경로 -> 본문
for (const f of docFiles) {
  docText.set(path.relative(ROOT, f).replace(/\\/g, "/"), fs.readFileSync(f, "utf8"));
}

// 등재 판정의 단일 기준은 docs/16 이고, docs/29 는 오너 항목의 판정선이다.
// 둘 다 없으면 "어디에도 없음", docs/16 만 있으면 1차 재발과 같은 상태다.
const KEY_AUDIT = "docs/16-사용자-검수-체크리스트.md";
const KEY_GATE = "docs/29-최종-검수표.md";

function mentions(hash) {
  const hit = [];
  for (const [rel, text] of docText) {
    if (text.includes(hash)) hit.push(rel);
  }
  return hit;
}

// 두 번째 증거 경로 — 커밋 제목이 자기 등재처를 가리키는 경우.
// 이 프로젝트는 해시 기재 관행(docs/18 티켓 미부여 묶음 표)이 생기기 전에
// `(docs/16 §70, docs/29 B32)` 처럼 **절 번호**로 등재했다. 그것도 등재다 —
// 단, 커밋 메시지의 주장만 믿지 않고 **그 절이 실제로 문서에 있는지 확인**한다.
function docRefs(subject) {
  const out = [];

  // docs/16 §70 · §70.1  →  docs/16 에 "## 70." 또는 "### 70.1" 헤딩이 있는가
  const sec = /docs\/(\d+)[^§)]*§\s*([\d]+(?:\.[\d]+)*)/g;
  let m;
  while ((m = sec.exec(subject)) !== null) {
    const rel = [...docText.keys()].find((k) => k.startsWith(`docs/${m[1]}-`));
    if (!rel) continue;
    const head = new RegExp(`^#{2,4}\\s*${m[2].replace(/\./g, "\\.")}[.\\s]`, "m");
    if (head.test(docText.get(rel))) out.push(`${rel} §${m[2]}`);
  }

  // docs/29 B32 · A5-R · D3  →  docs/29 본문에 그 항목 토큰이 있는가
  // ⚠️ `docs/16 §70, docs/29 B32` 처럼 두 문서를 함께 적는 것이 흔하다.
  // `[^)]*?` 로 두면 첫 `docs/16` 에 뒤쪽 `B32` 가 붙어 엉뚱한 문서를 뒤진다 —
  // 다음 `docs/` 를 넘지 않도록 막는다.
  const item = /docs\/(\d+)(?:(?!docs\/)[^)])*?\b([ABCD]\d+(?:-[A-Z])?)\b/g;
  while ((m = item.exec(subject)) !== null) {
    const rel = [...docText.keys()].find((k) => k.startsWith(`docs/${m[1]}-`));
    if (!rel) continue;
    if (new RegExp(`\\b${m[2]}\\b`).test(docText.get(rel))) out.push(`${rel} ${m[2]}`);
  }

  return [...new Set(out)];
}

// ---- 3. 판정
const missing = [];
const partial = [];
const warned = [];
let checked = 0;

for (const c of commits) {
  const isRequired = REQUIRE.test(c.subject);
  const isWarn = WARN.test(c.subject);
  if (!isRequired && !isWarn) continue;
  checked++;

  const byHash = mentions(c.hash);
  const byRef = docRefs(c.subject);
  const hit = [...new Set([...byHash, ...byRef.map((r) => r.split(" ")[0])])];
  const inAudit = hit.includes(KEY_AUDIT);
  const inGate = hit.includes(KEY_GATE);

  // 게이트가 docs/29 하나뿐인 것은 아니다 — post-MVP 는 자체 게이트를 쓴다
  // (T-19 필드 확장은 docs/32 §10). 커밋이 그런 게이트를 명시하면 충족으로 본다.
  const altGate = byRef.some((r) => /^docs\/(29|32)-/.test(r));

  if (hit.length === 0) {
    (isRequired ? missing : warned).push({ ...c, hit });
  } else if (isRequired && inAudit && !inGate && !altGate) {
    // 1차 재발과 정확히 같은 상태 — 원본 절은 있는데 검수표가 놓쳤다.
    partial.push({ ...c, hit });
  }
}

// ---- 4. 보고
const line = "-".repeat(72);
console.log(line);
console.log(`문서 드리프트 감사 — 범위 ${range} (${since.from})`);
console.log(`대상 커밋 ${checked}건 / 전체 ${commits.length}건 · 문서 ${docText.size}개 대조`);
console.log(line);

if (missing.length) {
  console.log(`\n[미등재] ${missing.length}건 — 어느 문서에도 해시가 없다`);
  for (const c of missing) console.log(`  ${c.hash}  ${c.subject}`);
  console.log(`\n  → docs/16 에 새 절을 만들고, 오너가 볼 것이 있으면 docs/29 에도 같은 커밋으로 등재한다.`);
  console.log(`     신규 화면·신규 시스템이면 반드시 docs/29 항목이 생긴다 (3차 재발이 정확히 이 경우였다).`);
}

if (partial.length) {
  console.log(`\n[검수표 누락] ${partial.length}건 — docs/16 에는 있으나 docs/29 에 없다`);
  for (const c of partial) console.log(`  ${c.hash}  ${c.subject}`);
  console.log(`\n  → 1차 재발(2026-08-26)과 같은 상태다. 오너가 볼 것이 정말 없으면 그렇다고 적어 두면`);
  console.log(`     이 경고가 사라진다(해시를 docs/29 "이 표에 없는 것" 절에 남긴다).`);
}

if (warned.length) {
  console.log(`\n[참고] ${warned.length}건 — refactor/perf 인데 등재가 없다 (실패로 세지 않는다)`);
  for (const c of warned) console.log(`  ${c.hash}  ${c.subject}`);
}

if (!missing.length && !partial.length) {
  console.log(`\n✅ 미등재 0건. 마커를 현재 HEAD 로 올려 두면 다음 검사가 빨라진다:`);
  console.log(`   docs/16 상단의  <!-- last-audited: ${git(["rev-parse", "--short", "HEAD"])} -->`);
}

console.log("");
process.exit(missing.length || partial.length ? 1 : 0);
