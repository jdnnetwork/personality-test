// ═══ 인성검사 로직 검증 스크립트 ═══
// 실행: node test-verification.mjs
import { selectQuestions, DIMS_ORDER, DIM_LABELS } from "./src/questions.js";
import { computeResults, getGrade } from "./src/scoring.js";

// 시드 고정 유사 난수 (재현 가능)
function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const randInt = (rand, min, max) => Math.floor(rand() * (max - min + 1)) + min;

const SESSION_SEED = 12345;
const ANSWER_SEED = 98765;

function buildAnswers(questions, answerFn, rand) {
  const answers = {};
  questions.forEach(q => { answers[q.id] = answerFn(q, rand); });
  return answers;
}

// ─── 시나리오 정의 ───
const scenarios = [
  {
    name: "1. 전부 5 찍기 (모순+과장)",
    answer: () => 5,
    expect: {
      stabilityLow:      (r) => r.stabilityScore.raw < 40,
      authenticityZero:  (r) => r.authenticityScore.raw < 10,
      warningFired:      (r) => r.validityChecks.allSame.detected || r.validityChecks.lowVariance.detected || r.validityChecks.extremeHigh.detected || r.validityChecks.outlier.extremeLows.length > 0,
      infrequencyFired:  (r) => r.validityChecks.infrequency.detected,
    },
  },
  {
    name: "2. 전부 3 찍기 (무성의)",
    answer: () => 3,
    expect: {
      lowVarianceFired:  (r) => r.validityChecks.lowVariance.detected,
      dimsAround60:      (r) => DIMS_ORDER.every(d => r.adjustedScores[d] >= 55 && r.adjustedScores[d] <= 65),
      noInfrequency:     (r) => !r.validityChecks.infrequency.detected,
    },
  },
  {
    name: "3. 전부 1 찍기",
    answer: () => 1,
    expect: {
      warningFired:      (r) => r.validityChecks.allSame.detected || r.validityChecks.lowVariance.detected || r.validityChecks.outlier.extremeLows.length > 0,
      dimsLow:           (r) => DIMS_ORDER.every(d => r.scores[d] <= 40),
      noInfrequency:     (r) => !r.validityChecks.infrequency.detected, // IF=1이라 안 걸림
    },
  },
  {
    name: "4. 완벽한 척 (정=5 역=1 SD=5)",
    answer: (q) => {
      if (q.dim === "SD") return 5;
      if (q.dim === "IF") return 1; // 완벽한 척은 극단 진술에도 "정상인처럼" 답
      if (q.rev) return 1;
      return 5;
    },
    expect: {
      allDimsHigh:       (r) => DIMS_ORDER.every(d => r.adjustedScores[d] >= 85),
      authenticityZero:  (r) => r.authenticityScore.raw < 10,
      extremeHighFired:  (r) => r.validityChecks.extremeHigh.detected,
      stabilityHigh:     (r) => r.stabilityScore.raw >= 80, // 완벽한 척은 역문항을 완벽히 반대로 답하므로 일관성 자체는 높음
    },
  },
  {
    name: "5. 솔직한 보통 취준생",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      if (q.rev) return randInt(rand, 2, 3);
      return randInt(rand, 3, 4);
    },
    expect: {
      stabilityHigh:     (r) => r.stabilityScore.raw >= 70,
      authenticityHigh:  (r) => r.authenticityScore.raw >= 65,
      noAllSame:         (r) => !r.validityChecks.allSame.detected,
      noLowVariance:     (r) => !r.validityChecks.lowVariance.detected,
      noExtremeHigh:     (r) => !r.validityChecks.extremeHigh.detected,
      noInfrequency:     (r) => !r.validityChecks.infrequency.detected,
    },
  },
  {
    name: "6. 성실한 취준생 (C/F 강함, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "C" || q.dim === "F";
      if (strong) return q.rev ? randInt(rand, 1, 2) : randInt(rand, 4, 5);
      return q.rev ? randInt(rand, 2, 3) : randInt(rand, 3, 4);
    },
    expect: {
      cHigh:             (r) => r.adjustedScores.C >= 75,
      fHigh:             (r) => r.adjustedScores.F >= 75,
      othersModerate:    (r) => ["O","E","A","N","L","S","I"].every(d => r.adjustedScores[d] >= 55 && r.adjustedScores[d] <= 80),
      typeExists:        (r) => typeof r.personalityType?.name === "string" && r.personalityType.name.length > 0,
      noExtremeHigh:     (r) => !r.validityChecks.extremeHigh.detected,
    },
  },
  {
    name: "7. 약간 과장한 취준생 (정=4~5, 역=1~2, SD=3~4)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 3, 4);
      if (q.dim === "IF") return randInt(rand, 1, 2); // IF는 정상 범위
      if (q.rev) return randInt(rand, 1, 2);
      return randInt(rand, 4, 5);
    },
    expect: {
      dimsHigh:          (r) => DIMS_ORDER.every(d => r.adjustedScores[d] >= 70),
      authenticityLow:   (r) => r.authenticityScore.raw < 60,
      noExtremeHigh:     (r) => !r.validityChecks.extremeHigh.detected,
      noInfrequency:     (r) => !r.validityChecks.infrequency.detected,
    },
  },
  // ─── 유형 다양성 시나리오 (8~15) ───
  // 원점수(sc)로 판정하는지 확인 — 강 차원: 정=5/역=1 → raw≈100, 보통: randInt(2,4) → raw≈50
  {
    name: "8. 전략적 혁신가 (O+L+C 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "O" || q.dim === "L" || q.dim === "C";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "전략적 혁신가",
      rawOHigh:          (r) => r.scores.O >= 75,
      rawLHigh:          (r) => r.scores.L >= 70,
      rawCHigh:          (r) => r.scores.C >= 65,
    },
  },
  {
    name: "9. 안정적 실행가 (C+N+S 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "C" || q.dim === "N" || q.dim === "S";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "안정적 실행가",
      rawCHigh:          (r) => r.scores.C >= 80,
      rawNHigh:          (r) => r.scores.N >= 75,
      rawSHigh:          (r) => r.scores.S >= 70,
    },
  },
  {
    name: "10. 소통형 리더 (E+A+L 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "E" || q.dim === "A" || q.dim === "L";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "소통형 리더",
      rawEHigh:          (r) => r.scores.E >= 75,
      rawAHigh:          (r) => r.scores.A >= 70,
      rawLHigh:          (r) => r.scores.L >= 65,
    },
  },
  {
    name: "11. 분석적 전문가 (O+C+F 강, E 낮음, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      if (q.dim === "E") return q.rev ? 5 : 1;
      const strong = q.dim === "O" || q.dim === "C" || q.dim === "F";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "분석적 전문가",
      rawOHigh:          (r) => r.scores.O >= 70,
      rawCHigh:          (r) => r.scores.C >= 75,
      rawFHigh:          (r) => r.scores.F >= 70,
      rawELow:           (r) => r.scores.E <= 25,
    },
  },
  {
    name: "12. 자율적 추진자 (I+L+S 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "I" || q.dim === "L" || q.dim === "S";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "자율적 추진자",
      rawIHigh:          (r) => r.scores.I >= 75,
      rawLHigh:          (r) => r.scores.L >= 70,
      rawSHigh:          (r) => r.scores.S >= 65,
    },
  },
  {
    name: "13. 유연한 조율자 (A+N+S 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      const strong = q.dim === "A" || q.dim === "N" || q.dim === "S";
      if (strong) return q.rev ? 1 : 5;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "유연한 조율자",
      rawAHigh:          (r) => r.scores.A >= 75,
      rawNHigh:          (r) => r.scores.N >= 70,
      rawSHigh:          (r) => r.scores.S >= 65,
    },
  },
  {
    name: "14. 공감형 서포터 (A 매우 강, E 약간 강, 나머지 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      if (q.dim === "A") return q.rev ? 1 : 5;
      if (q.dim === "E") return q.rev ? 2 : 4;
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "공감형 서포터",
      rawAHigh:          (r) => r.scores.A >= 80,
      rawEModerate:      (r) => r.scores.E >= 60 && r.scores.E <= 80,
    },
  },
  {
    name: "15. 균형잡힌 올라운더 (전부 보통)",
    answer: (q, rand) => {
      if (q.dim === "SD") return randInt(rand, 1, 2);
      if (q.dim === "IF") return randInt(rand, 1, 2);
      return randInt(rand, 2, 4);
    },
    expect: {
      typeMatches:       (r) => r.personalityType.name === "균형잡힌 올라운더",
      noDimAbove65:      (r) => DIMS_ORDER.every(d => r.scores[d] < 65),
    },
  },
];

// ─── 실행 + 출력 ───
const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", RESET = "\x1b[0m", BOLD = "\x1b[1m";

function summarizeDims(r) {
  return DIMS_ORDER.map(d => {
    const raw = r.scores[d];
    const adj = r.adjustedScores[d];
    const g = getGrade(adj);
    return `${d}(${DIM_LABELS[d]}): 원${String(raw).padStart(3)} → 보정${String(adj).padStart(3)} [${g.grade}]`;
  }).join("\n    ");
}

function summarizeWarnings(vc) {
  const flags = [];
  if (vc.allSame.detected) flags.push(`올-세임(run=${vc.allSame.maxRun})`);
  if (vc.lowVariance.detected) flags.push("로우-배리언스");
  if (vc.infrequency.detected) flags.push(`비빈도(${vc.infrequency.count}개)`);
  if (vc.extremeHigh.detected) flags.push(`극단값-상(${vc.extremeHigh.count}/${vc.extremeHigh.total})`);
  if (vc.outlier.avgHigh) flags.push(`평균과도(${vc.outlier.avg})`);
  if (vc.outlier.extremeLows.length > 0) flags.push(`극단값-하(${vc.outlier.extremeLows.join(",")})`);
  return flags.length ? flags.join(" · ") : "(없음)";
}

const session = selectQuestions(SESSION_SEED);
console.log(`${BOLD}═══ 사기업 인성검사 로직 검증 ═══${RESET}`);
console.log(`${DIM}세션 시드: ${SESSION_SEED} · 총 ${session.questions.length}문항 (CC ${session.ccPairs.length}쌍, revPair ${session.revPairs.length}쌍, IF ${session.ifIds.length}개)${RESET}\n`);

const results = [];
for (const s of scenarios) {
  const rand = seededRandom(ANSWER_SEED);
  const answers = buildAnswers(session.questions, s.answer, rand);
  const result = computeResults({
    questions: session.questions,
    answers,
    ccPairs: session.ccPairs,
    revPairs: session.revPairs,
    ifIds: session.ifIds,
  });

  const checks = Object.entries(s.expect).map(([key, fn]) => {
    let pass = false, err = null;
    try { pass = fn(result) === true; } catch (e) { err = e.message; }
    return { key, pass, err };
  });
  const allPass = checks.every(c => c.pass);
  results.push({ scenario: s, result, checks, allPass });

  console.log(`${BOLD}[${s.name}]${RESET} ${allPass ? GREEN + "✓ PASS" : RED + "✗ FAIL"}${RESET}`);
  console.log(`  ${DIM}차원별:${RESET}`);
  console.log(`    ${summarizeDims(result)}`);
  console.log(`  ${DIM}신뢰 지표:${RESET} 일관성=${result.consistencyPct}% · SD=${result.sdPct}%`);
  console.log(`  ${DIM}안정성:${RESET} raw=${result.stabilityScore.raw} display=${result.stabilityScore.display} [${result.stabilityScore.level}] (penalty=${result.stabilityScore.penalty})`);
  console.log(`  ${DIM}진정성:${RESET} raw=${result.authenticityScore.raw} display=${result.authenticityScore.display} [${result.authenticityScore.level}] (penalty=${result.authenticityScore.penalty})`);
  console.log(`  ${DIM}경고:${RESET}    ${summarizeWarnings(result.validityChecks)}`);
  console.log(`  ${DIM}유형:${RESET}    ${result.personalityType.name}`);
  console.log(`  ${DIM}체크:${RESET}`);
  for (const c of checks) {
    console.log(`    ${c.pass ? GREEN + "✓" : RED + "✗"}${RESET} ${c.key}${c.err ? ` ${YELLOW}(${c.err})${RESET}` : ""}`);
  }
  console.log();
}

const passCount = results.filter(r => r.allPass).length;
const totalCount = results.length;
const overall = passCount === totalCount;
console.log(`${BOLD}═══ 종합 ═══${RESET}`);
console.log(`${overall ? GREEN : RED}${passCount}/${totalCount} 시나리오 통과${RESET}`);
if (!overall) {
  console.log(`\n${RED}실패 시나리오:${RESET}`);
  results.filter(r => !r.allPass).forEach(r => {
    console.log(`  · ${r.scenario.name}`);
    r.checks.filter(c => !c.pass).forEach(c => console.log(`      ${RED}✗${RESET} ${c.key}`));
  });
}
process.exit(overall ? 0 : 1);
