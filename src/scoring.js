// ═══ 순수 점수/탐지 로직 ═══
// App.jsx와 테스트 스크립트가 공통으로 사용
import { DIMS_ORDER, PERSONALITY_TYPES, IF_THRESHOLD, IF_FLAG_MIN } from "./questions.js";

// ─── 점수 보정 (구간별 차등) ───
// 표시용 보정: 유형 판정·등급 산출은 별도로 원점수(sc) 또는 adjRaw 기준
export function adjustScore(raw) {
  if (typeof raw !== "number") return raw;
  const r = Math.max(0, Math.min(100, raw));
  let display;
  if (r <= 30) display = Math.max(20, r * 0.8 + 10);
  else if (r <= 50) display = r * 0.9 + 5;
  else if (r <= 70) display = r * 0.95;
  else if (r <= 85) display = r * 0.9;
  else display = Math.min(88, r * 0.8 + 8);
  return Math.round(display);
}
export function adjustCompanyScore(raw) {
  if (typeof raw !== "number") return raw;
  return Math.min(95, Math.max(0, Math.round(raw + 10)));
}

// ─── 신뢰도 공용 빌더 ───
export function buildScore(raw, penalty) {
  const adjRaw = Math.max(0, Math.round(raw - penalty));
  const display = adjustScore(adjRaw); // 표시점수도 동일 구간별 차등 보정
  const level = adjRaw >= 80 ? "매우 높음"
    : adjRaw >= 65 ? "양호"
    : adjRaw >= 50 ? "보통"
    : adjRaw >= 40 ? "주의"
    : "경고";
  return { raw: adjRaw, display, penalty, level };
}

// 응답 안정성 — 일관성 기반 + 올-세임/로우-배리언스 감점
export function computeStabilityScore(conP, vc) {
  let penalty = 0;
  if (vc.allSame?.detected) penalty += 20;
  if (vc.lowVariance?.detected) penalty += 15;
  return buildScore(conP, penalty);
}

// 응답 진정성 — 솔직성 기반 + 비빈도/극단값 감점
export function computeAuthenticityScore(sdP, vc) {
  const honesty = 100 - sdP;
  let penalty = 0;
  if (vc.infrequency?.detected) penalty += 15;
  if (vc.extremeHigh?.detected) penalty += 10;
  return buildScore(honesty, penalty);
}

// 등급 변환 (보정 점수 기준)
export function getGrade(score) {
  if (score > 65) return { grade: "S", color: "#10b981", bg: "rgba(16,185,129,0.18)" };
  if (score > 55) return { grade: "A", color: "#3b82f6", bg: "rgba(59,130,246,0.18)" };
  if (score > 40) return { grade: "B", color: "#f97316", bg: "rgba(249,115,22,0.18)" };
  if (score > 30) return { grade: "C", color: "#ef4444", bg: "rgba(239,68,68,0.18)" };
  return { grade: "D", color: "#991b1b", bg: "rgba(153,27,27,0.25)" };
}

// ─── 이상치/무성의 탐지 ───
export function detectAllSame(answers, questions) {
  const orderedAnswers = questions.map(q => answers[q.id]).filter(a => a !== undefined);
  let maxRun = 1, curRun = 1;
  for (let i = 1; i < orderedAnswers.length; i++) {
    if (orderedAnswers[i] === orderedAnswers[i - 1]) { curRun++; if (curRun > maxRun) maxRun = curRun; }
    else curRun = 1;
  }
  return { detected: maxRun >= 20, maxRun };
}

export function detectInfrequency(answers, ifIds) {
  let flagged = 0;
  const flaggedItems = [];
  (ifIds || []).forEach(id => {
    const a = answers[id];
    if (a !== undefined && a >= IF_THRESHOLD) { flagged++; flaggedItems.push(id); }
  });
  return { detected: flagged >= IF_FLAG_MIN, count: flagged, flaggedItems };
}

export function detectLowVariance(answers, questions) {
  const vals = questions
    .filter(q => q.dim !== "CC" && q.dim !== "SD" && q.dim !== "IF")
    .map(q => answers[q.id])
    .filter(a => a !== undefined);
  if (vals.length < 10) return { detected: false };
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const std = Math.sqrt(variance);
  return { detected: std < 0.5 };
}

export function detectExtremeHigh(adjustedScores, dims) {
  const highCount = dims.filter(d => (adjustedScores[d] || 0) >= 85).length;
  return { detected: highCount >= 7, count: highCount, total: dims.length };
}

export function detectStatisticalOutlier(scores) {
  const vals = DIMS_ORDER.map(d => scores[d] || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const allAbove85 = vals.every(v => v >= 85);
  const avgAbove80 = avg >= 80;
  const extremeLows = DIMS_ORDER.filter(d => (scores[d] || 0) <= 20);
  return {
    allHigh: allAbove85,
    avgHigh: avgAbove80,
    avg: Math.round(avg),
    extremeLows,
    detected: allAbove85 || avgAbove80 || extremeLows.length > 0
  };
}

// ─── 결과 계산 (순수) ───
export function computeResults({ questions, answers, ccPairs = [], revPairs = [], ifIds = [] }) {
  // 1) 차원별 점수
  const ds = {}; DIMS_ORDER.forEach(d => { ds[d] = []; });
  questions.forEach(q => {
    if (q.dim === "CC" || q.dim === "SD" || q.dim === "IF") return;
    const a = answers[q.id]; if (a === undefined) return;
    if (!ds[q.dim]) ds[q.dim] = [];
    ds[q.dim].push(q.rev ? (6 - a) : a);
  });
  const sc = {};
  Object.keys(ds).forEach(d => {
    const arr = ds[d];
    sc[d] = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length - 1) / 4 * 100) : 50;
  });

  // 2) SD 원점수
  const sdQ = questions.filter(q => q.dim === "SD");
  const sdS = sdQ.reduce((s, q) => s + (answers[q.id] || 3), 0);
  const sdP = sdQ.length ? Math.round(sdS / (sdQ.length * 5) * 100) : 50;

  // 3) 일관성 (conP)
  const ccDiffs = [];
  ccPairs.forEach(([c, o]) => {
    const a1 = answers[c], a2 = answers[o];
    if (a1 !== undefined && a2 !== undefined) ccDiffs.push(Math.abs(a1 - a2));
  });
  const dimDiffs = [];
  revPairs.forEach(([p, r]) => {
    const a1 = answers[p], a2 = answers[r];
    if (a1 !== undefined && a2 !== undefined) {
      const q = questions.find(q => q.id === r);
      if (q && q.rev) dimDiffs.push(Math.abs(a1 - (6 - a2)));
      else dimDiffs.push(Math.abs(a1 - a2));
    }
  });
  let conP = 50;
  const allD = [...ccDiffs, ...dimDiffs];
  if (allD.length > 0) conP = Math.max(0, Math.round((1 - allD.reduce((a, b) => a + b, 0) / allD.length / 4) * 100));

  // 4) 보정 점수 (9차원)
  const posDims = [...DIMS_ORDER];
  const adjScores = { ...sc };
  posDims.forEach(d => { adjScores[d] = adjustScore(sc[d] || 0); });

  // 5) 이상치 탐지
  const allSame = detectAllSame(answers, questions);
  const ifResult = detectInfrequency(answers, ifIds);
  const outlier = detectStatisticalOutlier(sc);
  const lowVariance = detectLowVariance(answers, questions);
  const extremeHigh = detectExtremeHigh(adjScores, posDims);

  const vc = { allSame, infrequency: ifResult, outlier, lowVariance, extremeHigh };
  const stability = computeStabilityScore(conP, vc);
  const authenticity = computeAuthenticityScore(sdP, vc);

  const pType = PERSONALITY_TYPES.find(t => t.condition(sc)) || PERSONALITY_TYPES[PERSONALITY_TYPES.length - 1];

  return {
    scores: sc,
    adjustedScores: adjScores,
    sdPct: sdP,
    consistencyPct: conP,
    stabilityScore: stability,
    authenticityScore: authenticity,
    personalityType: pType,
    validityChecks: vc,
  };
}
