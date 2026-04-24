// ═══ Fintech 결과 디자인 ═══
// V1 Fintech Dashboard 디자인 이식 (Linear/Stripe 톤, 1 accent + hairline)
import { DIM_LABELS, DIMS_ORDER } from "./questions.js";
import { adjustCompanyScore, getGrade } from "./scoring.js";

const ACCENT = "#818cf8";
const ACCENT_SOFT = "rgba(129,140,248,0.12)";

// ─── 레이더/스코어바 primitives ───
function FinMiniRadar({ scores, dims = DIMS_ORDER, size = 72, accent = ACCENT }) {
  const cx = size/2, cy = size/2, r = size*0.35, step = (2*Math.PI)/dims.length;
  const pt = (i,v) => { const a=-Math.PI/2+i*step; return [cx+r*(v/100)*Math.cos(a), cy+r*(v/100)*Math.sin(a)]; };
  const poly = dims.map((d,i)=>{const [x,y]=pt(i,scores[d]||0);return `${x},${y}`;}).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.5,1].map((lv,idx)=>(
        <polygon key={idx} points={dims.map((_,i)=>{const [x,y]=pt(i,100*lv);return `${x},${y}`;}).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      ))}
      <polygon points={poly} fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.2"/>
    </svg>
  );
}

function FinRadar({ dimensions, size = 300, accent = ACCENT, showBenchmark = true }) {
  const cx = size/2, cy = size/2, r = size*0.36, n = dimensions.length;
  const step = (2*Math.PI)/n;
  const pt = (i,v) => { const a=-Math.PI/2+i*step; return [cx+r*(v/100)*Math.cos(a), cy+r*(v/100)*Math.sin(a)]; };
  const userPoints = dimensions.map((d,i)=>pt(i,d.score||0)).map(([x,y])=>`${x},${y}`).join(" ");
  const benchPoints = showBenchmark && dimensions.every(d=>typeof d.benchmark === "number")
    ? dimensions.map((d,i)=>pt(i,d.benchmark)).map(([x,y])=>`${x},${y}`).join(" ")
    : null;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{maxWidth:"100%",height:"auto"}}>
      {[0.25,0.5,0.75,1].map((lv,idx)=>(
        <polygon key={idx} points={dimensions.map((_,i)=>{const [x,y]=pt(i,100*lv);return `${x},${y}`;}).join(" ")} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      ))}
      {dimensions.map((_,i)=>{const [x,y]=pt(i,100);return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>;})}
      {benchPoints && <polygon points={benchPoints} fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" strokeWidth="1.25"/>}
      <polygon points={userPoints} fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5"/>
      {dimensions.map((d,i)=>{const [x,y]=pt(i,d.score||0);return <circle key={i} cx={x} cy={y} r="2.5" fill={accent}/>;})}
      {dimensions.map((d,i)=>{
        const a=-Math.PI/2+i*step, lr=r+18;
        const x=cx+lr*Math.cos(a), y=cy+lr*Math.sin(a);
        const align=Math.abs(Math.cos(a))<0.3?"middle":Math.cos(a)>0?"start":"end";
        return (
          <g key={"lbl"+i}>
            <text x={x} y={y} textAnchor={align} dominantBaseline="middle" fontSize="11" fill="rgba(229,231,235,0.75)" fontFamily="Pretendard Variable, Pretendard, sans-serif">{d.label}</text>
            <text x={x} y={y+12} textAnchor={align} dominantBaseline="middle" fontSize="10" fill={accent} fontFamily="JetBrains Mono, monospace" fontWeight="500">{d.score}</text>
          </g>
        );
      })}
    </svg>
  );
}

function FinScoreBar({ label, score, benchmark, accent = ACCENT, max = 100 }) {
  const pct = (score/max)*100;
  const hasBench = typeof benchmark === "number";
  const bpct = hasBench ? (benchmark/max)*100 : 0;
  const delta = hasBench ? score - benchmark : null;
  return (
    <div className="score-row">
      <div className="score-label">{label}</div>
      <div className="score-track">
        <div className="score-fill" style={{width:`${pct}%`, background:accent}}/>
        {hasBench && <div className="score-bench" style={{left:`${bpct}%`}}/>}
      </div>
      <div className="score-meta">
        <span className="score-num">{score}</span>
        {hasBench && <span className={`score-delta ${delta>=0?"pos":"neg"}`}>{delta>=0?"+":""}{delta}</span>}
      </div>
    </div>
  );
}

// ─── 메인 ResultView ───
export default function ResultView({ basicResults, aiResults, aiError, companyData, companyName, mins, total, totalQ, onRetry, onAiRetry, skipCompanyAI = false }) {
  const { scores: sc, adjustedScores: adj, sdPct: sdP, consistencyPct: conP, stabilityScore: stab, authenticityScore: auth, personalityType: pType, validityChecks: vc } = basicResults;

  const stabOneLine = stab.raw >= 65 ? "비슷한 문항에 일관되게 응답" : stab.raw >= 50 ? "대체로 일관적이지만 일부 모순" : "응답 패턴 변동이 커 재점검 권장";
  const authOneLine = auth.raw >= 65 ? "솔직하고 현실적인 응답 패턴" : auth.raw >= 50 ? "대체로 솔직하나 일부 과장 경향" : "과장/비현실적 응답 신호 감지";
  const conLv = conP >= 80 ? "매우 일관적" : conP >= 60 ? "양호" : conP >= 40 ? "일부 모순" : "응답 모순 심각";
  const sdLv = sdP <= 40 ? "매우 솔직" : sdP <= 60 ? "양호" : "과장 응답 경향 일부 감지";
  const hasAnyWarning = vc.allSame.detected || vc.lowVariance.detected || vc.extremeHigh.detected || vc.outlier.extremeLows.length > 0;

  // Dimensions with benchmark
  const benchmarkProfile = companyData?.bigFiveProfile || null;
  const dimensions = DIMS_ORDER.map(d => ({
    key: d,
    label: DIM_LABELS[d],
    score: adj[d],
    benchmark: benchmarkProfile && typeof benchmarkProfile[d] === "number" ? benchmarkProfile[d] : null,
    grade: getGrade(adj[d]).grade,
  }));
  const showBenchmark = !!benchmarkProfile;

  // TOP3 / BOT3 (보정 점수 기준)
  const sorted = [...DIMS_ORDER].map(d => ({ d, s: adj[d] })).sort((a,b) => b.s-a.s);
  const getPct = (s) => s >= 90 ? "상위 5%" : s >= 80 ? "상위 10%" : s >= 70 ? "상위 20%" : s >= 60 ? "상위 35%" : s >= 50 ? "평균" : s >= 40 ? "하위 35%" : s >= 30 ? "하위 20%" : "하위 10%";
  const top3 = sorted.slice(0,3).map(x => ({ label: DIM_LABELS[x.d], score: x.s, grade: getGrade(x.s).grade, pct: getPct(x.s) }));
  const bot3 = sorted.slice(-3).reverse().map(x => ({ label: DIM_LABELS[x.d], score: x.s, grade: getGrade(x.s).grade, pct: getPct(x.s) }));

  // TYPE
  const typeStrengths = (pType.strengths || "").split(",").map(s=>s.trim()).filter(Boolean);
  const typeConcerns = (pType.weaknesses || "").split(",").map(s=>s.trim()).filter(Boolean);

  // Company
  const companyValues = companyData?.coreValues
    ? companyData.coreValues.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  // AI fit score
  const fitScore = aiResults?.matchScore !== undefined ? adjustCompanyScore(aiResults.matchScore) : null;

  // Verdict 경고 메시지
  const verdictWarning = stab.raw < 40 || auth.raw < 40
    ? `${stab.raw < 40 && auth.raw < 40 ? "안정성과 진정성 모두" : stab.raw < 40 ? "응답 안정성" : "응답 진정성"} 원점수가 낮습니다. 문항을 한 번 더 천천히 읽고 재검사를 권장해요. (실제 검사에서는 재검사 대상이 될 수 있는 구간이에요.)`
    : null;

  const stabTag = stab.raw >= 65 ? "ok" : "warn";
  const authTag = auth.raw >= 65 ? "ok" : "warn";

  return (
    <div className="fin-root">
      <style>{FIN_CSS}</style>

      {/* HEADER */}
      <div className="fin-card fin-card-header fin-header">
        <div className="fin-hero-badge">
          <div className="mini-radar-wrap"><FinMiniRadar scores={adj} size={72} accent={ACCENT}/></div>
          <div className="char-overlay">
            <img src="/deepdungi.png" alt="딥둥이" width={40} height={40} style={{borderRadius:"50%", objectFit:"cover"}}/>
          </div>
        </div>
        <div className="fin-header-meta">
          <div className="fin-eyebrow">457DEEP · REPORT</div>
          <h1 className="fin-title">딥둥이 모의 인성검사</h1>
          <div className="fin-sub">
            <span>사기업 인성검사</span>
            <span className="dot">·</span>
            <span>소요 {mins}분</span>
            <span className="dot">·</span>
            <span>{total}/{totalQ}문항</span>
            {companyName && <><span className="dot">·</span><span>{companyName}</span></>}
          </div>
        </div>
        <div className="fin-header-right">
          <div>v 2.1.0</div>
          <div className="date">{new Date().toISOString().slice(0,10).replace(/-/g,".")}</div>
        </div>
      </div>

      {/* VERDICT — 응답 안정성/진정성 */}
      <div className={`fin-card fin-verdict ${verdictWarning ? "fin-card-critical" : "fin-card-accent"}`}>
        <div className="fin-verdict-cell">
          <div className="fin-verdict-label">
            응답 안정성
            <span className={`fin-verdict-tag ${stabTag}`}>{stab.level}</span>
          </div>
          <div className="fin-verdict-value">{stab.display}<span className="pct">%</span></div>
          <div className="fin-verdict-note">{stabOneLine}</div>
        </div>
        <div className="fin-verdict-cell">
          <div className="fin-verdict-label">
            응답 진정성
            <span className={`fin-verdict-tag ${authTag}`}>{auth.level}</span>
          </div>
          <div className="fin-verdict-value">{auth.display}<span className="pct">%</span></div>
          <div className="fin-verdict-note">{authOneLine}</div>
        </div>
        {(verdictWarning || hasAnyWarning) && (
          <div className="fin-verdict-warning">
            <strong>⚠ 주의</strong> — {verdictWarning || "응답 패턴에서 점검이 필요한 포인트가 감지되었어요. 하단 코칭 가이드를 참고해주세요."}
          </div>
        )}
      </div>

      {/* §01 Profile Classification */}
      <div className="fin-card fin-card-accent">
        <div className="fin-section-head">
          <div className="fin-section-title">Profile Classification</div>
          <div className="fin-section-num">§ 01</div>
        </div>
        <div className="fin-type">
          <div className="fin-type-radar">
            <FinMiniRadar scores={adj} size={96} accent={ACCENT}/>
          </div>
          <div>
            <div className="fin-type-code">TYPE · {pType.emoji || ""}</div>
            <h2 className="fin-type-name">{pType.name}</h2>
            <p className="fin-type-tagline">{pType.desc}</p>
            <div className="fin-type-tags">
              {typeStrengths.length > 0 && (
                <div>
                  <span className="tag-label">STRENGTH</span>
                  <span className="tag-items">{typeStrengths.join(" · ")}</span>
                </div>
              )}
              {typeConcerns.length > 0 && (
                <div>
                  <span className="tag-label">CAUTION</span>
                  <span className="tag-items">{typeConcerns.join(" · ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* §02 Personality Dimensions */}
      <div className="fin-card">
        <div className="fin-section-head">
          <div className="fin-section-title">{showBenchmark ? "Personality Dimensions vs Benchmark" : "Personality Dimensions"}</div>
          <div className="fin-section-num">§ 02</div>
        </div>
        <div className="fin-radar-row">
          <div>
            <FinRadar dimensions={dimensions} size={300} accent={ACCENT} showBenchmark={showBenchmark}/>
            <div className="fin-legend">
              <div className="fin-legend-item">
                <span className="fin-legend-swatch" style={{background: ACCENT}}/>
                나의 점수
              </div>
              {showBenchmark && (
                <div className="fin-legend-item">
                  <span className="fin-legend-swatch" style={{background:"repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 3px, transparent 3px 6px)"}}/>
                  기업 기준선
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="score-list">
              {dimensions.map(d => <FinScoreBar key={d.key} {...d} accent={ACCENT}/>)}
            </div>
          </div>
        </div>
      </div>

      {/* §03 Key Dimensions */}
      <div className="fin-card">
        <div className="fin-section-head">
          <div className="fin-section-title">Key Dimensions</div>
          <div className="fin-section-num">§ 03</div>
        </div>
        <div className="top-groups">
          <div>
            <div className="top-head">상위 3개 <span className="top-head-tag strength">STRENGTH</span></div>
            {top3.map((s, i) => (
              <div key={s.label} className="top-row">
                <div className="top-num">0{i+1}</div>
                <div className="top-label">{s.label}</div>
                <div className={`top-grade ${s.grade.toLowerCase()}`}>{s.grade}</div>
                <div className="top-score">{s.score}</div>
                <div className="top-pct">{s.pct}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="top-head">하위 3개 <span className="top-head-tag weak">NEEDS WORK</span></div>
            {bot3.map((s, i) => (
              <div key={s.label} className="top-row">
                <div className="top-num">0{i+1}</div>
                <div className="top-label">{s.label}</div>
                <div className={`top-grade ${s.grade.toLowerCase()}`}>{s.grade}</div>
                <div className="top-score">{s.score}</div>
                <div className="top-pct">{s.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* §04 Integrity Breakdown */}
      <div className="fin-card">
        <div className="fin-section-head">
          <div className="fin-section-title">Response Integrity Breakdown</div>
          <div className="fin-section-num">§ 04</div>
        </div>
        <div className="integrity-grid">
          <div className="integrity-cell">
            <div className="integrity-head">
              <div className="integrity-name">응답 안정성 — {stab.level}</div>
              <div className={`integrity-pct ${stabTag}`}>{stab.display}%</div>
            </div>
            <p className="integrity-body">비슷한 질문에 일관되게 답했는지를 보는 지표예요. 같은 값만 연속해서 고르거나 모든 문항에 비슷한 점수만 주면 점수가 낮아집니다.</p>
            <div className="integrity-kv">
              <div className="integrity-kv-row">
                <div className="integrity-kv-key">일관성</div>
                <div className="integrity-kv-val">{conLv} — {conP>=80 ? "비슷한 내용의 문항에 일관되게 응답했어요. 아주 좋은 신호입니다." : conP>=60 ? "대체로 일관적이지만 몇 문항에서 소소한 모순이 있어요. 역문항만 조금 주의하면 쉽게 끌어올릴 수 있어요." : conP>=40 ? "역문항과 정문항 사이 모순이 꽤 보입니다. '~하지 않는다'류 표현을 반대로 읽었는지 점검하면 빠르게 개선됩니다." : "응답 일관성이 낮아 실제 검사에서 재검사 대상이 될 수 있어요. 다음엔 문항을 한 번 더 천천히 읽어주세요."}</div>
              </div>
              {stab.penalty > 0 && (
                <div className="integrity-kv-row">
                  <div className="integrity-kv-key">감점 반영</div>
                  <div className="integrity-kv-val"><span className="penalty">-{stab.penalty}</span><span style={{color:"var(--text-muted)", marginLeft:8}}>무성의 응답 패턴</span></div>
                </div>
              )}
            </div>
          </div>
          <div className="integrity-cell">
            <div className="integrity-head">
              <div className="integrity-name">응답 진정성 — {auth.level}</div>
              <div className={`integrity-pct ${authTag}`}>{auth.display}%</div>
            </div>
            <p className="integrity-body">답변이 얼마나 솔직한지를 보는 지표예요. 모든 차원에서 지나치게 완벽한 점수가 나오거나 과장된 답변이 감지되면 점수가 낮아집니다.</p>
            <div className="integrity-kv">
              <div className="integrity-kv-row">
                <div className="integrity-kv-key">솔직성</div>
                <div className="integrity-kv-val"><span className={auth.penalty>0?"warn-text":""}>{sdLv}</span> — {sdP<=40?"자신의 약점도 솔직하게 인정하는 응답 패턴이에요. 실제 검사에서도 신뢰 받는 방향입니다.":sdP<=60?"대체로 솔직하지만 일부 '너무 완벽한' 응답이 섞여 있어요. 한두 문항만 더 현실적으로 답하면 충분히 통과할 수 있어요.":"과장 응답 경향이 강합니다. 약점을 인정하는 답변 1~2개만 포함해도 이 부분은 바로 개선됩니다."}</div>
              </div>
              {auth.penalty > 0 && (
                <div className="integrity-kv-row">
                  <div className="integrity-kv-key">감점 반영</div>
                  <div className="integrity-kv-val"><span className="penalty">-{auth.penalty}</span><span style={{color:"var(--text-muted)", marginLeft:8}}>응답 패턴 주의 신호</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* §05 Type-Specific Guidance */}
      <div className="fin-card">
        <div className="fin-section-head">
          <div className="fin-section-title">Type-Specific Guidance · {pType.name}</div>
          <div className="fin-section-num">§ 05</div>
        </div>
        <div className="tip-split">
          <div className="tip-col">
            <div className="tip-head tip">PRACTICE TIPS</div>
            <div className="tip-list">
              {(pType.tips || []).map((t, i) => (
                <div key={i} className="tip-item">
                  <span className="tip-bullet">0{i+1}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tip-col">
            <div className="tip-head caution">WATCH OUT</div>
            <div className="tip-list">
              {(pType.warnings || []).map((t, i) => (
                <div key={i} className="tip-item">
                  <span className="tip-bullet">0{i+1}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* §06 Coaching */}
      {(conP<70 || sdP>50 || hasAnyWarning) && (
        <div className="fin-card">
          <div className="fin-section-head">
            <div className="fin-section-title">Coaching Guide · 실전 통과</div>
            <div className="fin-section-num">§ 06</div>
          </div>
          <div className="coach-callout">
            아래 포인트를 <strong>하나씩만 반영</strong>해도 실제 검사에서 충분히 통과할 수 있어요. "부족해서"가 아니라 "이 부분만 다듬으면 확실히 통과"하는 관점으로 읽어주세요.
          </div>

          {hasAnyWarning && (
            <>
              <div className="coach-group-head">응답 패턴 개선 포인트</div>
              {vc.allSame.detected && (
                <div className="coach-item">
                  <div className="coach-n">01</div>
                  <div>
                    <h3 className="coach-title">같은 값만 계속 선택하지 마세요</h3>
                    <p className="coach-body">각 문항을 실제로 읽고 본인 성향에 맞춰 <strong>2~4점 사이에서 자연스럽게 분산</strong>하면 충분해요. 연속 10문항만 같아도 주의 대상이지만, 이것만 지키면 쉽게 통과할 수 있어요.</p>
                  </div>
                </div>
              )}
              {vc.lowVariance.detected && (
                <div className="coach-item">
                  <div className="coach-n">02</div>
                  <div>
                    <h3 className="coach-title">각 문항에 분명한 의견을 표현하세요</h3>
                    <p className="coach-body">응답 변동이 매우 적습니다. 모든 문항에 비슷한 점수만 주면 "생각 없이 답했다"로 해석돼요. <strong>확실히 동의하는 것엔 4~5점, 아닌 것엔 1~2점</strong>을 과감하게 사용하면 프로파일이 선명해집니다.</p>
                  </div>
                </div>
              )}
              {vc.extremeHigh.detected && (
                <div className="coach-item">
                  <div className="coach-n">03</div>
                  <div>
                    <h3 className="coach-title">자연스러운 강약 차이를 만드세요</h3>
                    <p className="coach-body">모든 차원에서 최고점을 받는 것보다 <strong>자연스러운 강약 차이</strong>가 있는 것이 오히려 좋은 평가를 받습니다. 2~3개 강점(보정 후 75~85)과 2~3개 보통(보정 후 55~65) 영역이 섞인 프로파일이 가장 설득력 있어요.</p>
                  </div>
                </div>
              )}
              {vc.outlier.extremeLows.length > 0 && (
                <div className="coach-item">
                  <div className="coach-n">04</div>
                  <div>
                    <h3 className="coach-title">역문항 읽는 법을 점검해보세요</h3>
                    <p className="coach-body">{vc.outlier.extremeLows.map(d => DIM_LABELS[d] || d).join(", ")} 영역이 많이 낮게 나왔어요. 역문항("~하지 않는다"류)을 반대로 읽지 않았는지 확인하면 금방 개선됩니다.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {conP < 70 && (
            <>
              <div className="coach-group-head" style={{marginTop:24}}>일관성 개선 방법</div>
              <div className="coach-item">
                <div className="coach-n">01</div>
                <div>
                  <h3 className="coach-title">역문항을 구분하세요</h3>
                  <p className="coach-body">"~하지 않는다", "~가 어렵다" 같은 부정적 표현이 들어간 문항이 역문항이에요. "계획을 세우고 실행한다"에 4점이면 "충동적으로 결정한다"에는 2점을 주는 식으로 맞추면 일관성이 올라갑니다.</p>
                </div>
              </div>
              <div className="coach-item">
                <div className="coach-n">02</div>
                <div>
                  <h3 className="coach-title">역문항 예시</h3>
                  <ul className="coach-examples">
                    <li>"일을 미루는 경향이 있다" → 성실성의 역문항</li>
                    <li>"걱정이 많은 편이다" → 정서안정성의 역문항</li>
                    <li>"쉽게 산만해지는 편이다" → 집중력의 역문항</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {sdP > 50 && (
            <>
              <div className="coach-group-head" style={{marginTop:24}}>솔직성 개선 방법</div>
              <div className="coach-item">
                <div className="coach-n">01</div>
                <div>
                  <h3 className="coach-title">이런 문항은 함정이에요</h3>
                  <ul className="coach-traps">
                    <li>"한 번도 거짓말을 한 적이 없다" → "매우 그렇다"로 답하면 과장으로 감점</li>
                    <li>"화가 난 적이 단 한 번도 없다" → 비현실적 응답으로 분류</li>
                  </ul>
                </div>
              </div>
              <div className="coach-item">
                <div className="coach-n">02</div>
                <div>
                  <h3 className="coach-title">적당한 약점 인정이 오히려 점수를 올려요</h3>
                  <p className="coach-body">약점 1~2개를 솔직하게 인정하는 응답을 넣으면 신뢰도가 크게 올라갑니다. "이 부분은 개선 중이에요" 정도의 뉘앙스로 답하면 충분히 통과할 수 있어요.</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* §07 Target Company */}
      {!skipCompanyAI && companyData && (
        <div className="fin-card fin-card-accent">
          <div className="fin-section-head hero">
            <div className="fin-section-title-emph">
              <div className="fin-section-kicker">§ 07 · Target Company</div>
              <h2 className="fin-section-heading">{companyData.companyName} <em>인재상</em></h2>
            </div>
            <div className="fin-section-num">FIT ANALYSIS</div>
          </div>
          <div className="info-note">
            <span className="info-note-label">NOTE</span>
            <span>아래 내용은 딥둥이 AI가 공개 정보를 기반으로 추론한 인재상입니다. 실제 기업의 내부 채용 기준과 다를 수 있습니다.</span>
          </div>
          {companyValues.length > 0 && (
            <div className="company-values">
              {companyValues.map(v => <div key={v} className="company-value">{v}</div>)}
            </div>
          )}
          {companyData.talentProfile && <p className="company-summary">{companyData.talentProfile}</p>}
        </div>
      )}

      {/* §08 Fit Score */}
      {!skipCompanyAI && aiResults && fitScore !== null && (
        <div className="fin-card">
          <div className="fin-section-head">
            <div className="fin-section-title">Fit Score{companyData?.companyName ? ` · ${companyData.companyName}` : ""}</div>
            <div className="fin-section-num">§ 08</div>
          </div>
          <div className="info-note">
            <span className="info-note-label">REF</span>
            <span>딥둥이 AI가 추론한 인재상과 비교한 참고용 적합도입니다.</span>
          </div>
          <div className="fit-hero">
            <div className="fit-pct-box">
              <div className="fit-pct-val">{fitScore}%</div>
              <div className="fit-pct-label">OVERALL FIT</div>
            </div>
            {aiResults.matchAnalysis && <p className="fit-summary">{aiResults.matchAnalysis}</p>}
          </div>

          {(aiResults.strengths?.length > 0 || aiResults.improvements?.length > 0) && (
            <div className="fit-cols">
              {aiResults.strengths?.length > 0 && (
                <div>
                  <div className="fit-col-head plus">강점 <span className="fit-col-head-tag">STRENGTH</span></div>
                  <ul className="fit-list">
                    {aiResults.strengths.map((s, i) => (
                      <li key={i}><span className="fit-list-bullet">0{i+1}</span><span>{s}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResults.improvements?.length > 0 && (
                <div>
                  <div className="fit-col-head minus">보완점 <span className="fit-col-head-tag">IMPROVE</span></div>
                  <ul className="fit-list">
                    {aiResults.improvements.map((s, i) => (
                      <li key={i}><span className="fit-list-bullet">0{i+1}</span><span>{s}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {aiResults.overallAdvice && (
            <div className="fit-overall">
              <span className="fit-overall-label">종합 조언</span>
              {aiResults.overallAdvice}
            </div>
          )}
        </div>
      )}

      {/* §09 AI Interview Questions */}
      {aiResults?.interviewQuestions?.length > 0 && (
        <div className="fin-card">
          <div className="fin-section-head">
            <div className="fin-section-title">Interview Questions</div>
            <div className="fin-section-num">§ 09</div>
          </div>
          <div className="info-note">
            <span className="info-note-label">INFO</span>
            <span>인성검사 결과에서 보완이 필요한 영역 중심으로 출제된 질문이에요.</span>
          </div>
          <div className="iq-intro">
            <div style={{fontSize:14, color:"var(--text)", fontWeight:500}}>나의 인성검사 결과 기반 면접 예상 질문</div>
            <div className="iq-count">TOTAL {aiResults.interviewQuestions.length}</div>
          </div>
          <div className="iq-list">
            {aiResults.interviewQuestions.map((q, i) => (
              <div key={i} className="iq-item">
                <div className="iq-n">Q{String(i+1).padStart(2,"0")}</div>
                <div>
                  <h3 className="iq-q">{q.question}</h3>
                  <div className="iq-meta">
                    {q.intent && (
                      <div className="iq-meta-row">
                        <div className="iq-meta-key">INTENT</div>
                        <div className="iq-meta-val">{q.intent}</div>
                      </div>
                    )}
                    {q.tip && (
                      <div className="iq-meta-row">
                        <div className="iq-meta-key">TIP</div>
                        <div className="iq-meta-val">{q.tip}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 에러 / 재시도 */}
      {aiError && (
        <div className="fin-card fin-card-critical" style={{textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:20}}>⏳</span>
            <span style={{color:"var(--warn)",fontSize:15,fontWeight:600,letterSpacing:"-0.01em"}}>AI 분석을 불러오는 중입니다</span>
          </div>
          <div style={{color:"var(--text-muted)",fontSize:13,lineHeight:1.7,marginBottom:16}}>
            잠시 후 다시 시도해주세요. 기본 결과는 위에서 확인하실 수 있어요.
          </div>
          <button className="footer-btn" onClick={onAiRetry}>AI 분석 다시 시도</button>
        </div>
      )}

      {/* FOOTER */}
      <div className="fin-footer">
        <div className="footer-char">
          <img src="/deepdungi.png" alt="딥둥이" width={72} height={72} style={{borderRadius:"50%", objectFit:"cover"}}/>
        </div>
        <div className="footer-disclaimer">본 검사는 모의 인성검사입니다.</div>
        <div className="footer-powered">POWERED BY 457DEEP · 딥둥이</div>
        <button className="footer-btn" onClick={onRetry}>다시 검사하기</button>
      </div>
    </div>
  );
}

// ═══ CSS ═══
const FIN_CSS = `
.fin-root {
  --accent: ${ACCENT};
  --accent-soft: ${ACCENT_SOFT};
  --bg: #0a0c10;
  --surface: #10141b;
  --surface-2: #151a23;
  --border: rgba(255,255,255,0.07);
  --border-strong: rgba(255,255,255,0.12);
  --text: #e5e7eb;
  --text-muted: #8b92a0;
  --text-dim: #5c6370;
  --warn: #f59e0b;
  --danger: #f87171;
  --ok: #4ade80;
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 32px 80px;
  background: var(--bg);
  color: var(--text);
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif;
  letter-spacing: -0.01em;
  min-height: 100vh;
}
.fin-root, .fin-root * { box-sizing: border-box; }

.fin-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px;
  padding: 28px 28px;
  margin-bottom: 14px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 24px rgba(0,0,0,0.3);
  position: relative;
}
.fin-card-accent {
  background:
    radial-gradient(circle at 0% 0%, var(--accent-soft) 0%, transparent 55%),
    radial-gradient(circle at 100% 100%, rgba(255,255,255,0.06) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%);
  border: 1px solid rgba(255,255,255,0.18);
}
.fin-card-header {
  background:
    radial-gradient(circle at 100% 0%, var(--accent-soft) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%);
  border: 1px solid rgba(255,255,255,0.2);
}
.fin-card-critical {
  background: linear-gradient(180deg, rgba(248,113,113,0.14) 0%, rgba(248,113,113,0.04) 100%);
  border: 1px solid rgba(248,113,113,0.3);
}

/* HEADER */
.fin-header { display: grid; grid-template-columns: auto 1fr auto; gap: 20px; align-items: center; }
.fin-hero-badge {
  position: relative; width: 96px; height: 96px;
  border: 1px solid var(--border-strong); border-radius: 16px;
  background: radial-gradient(circle at 50% 40%, var(--accent-soft), transparent 70%);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.fin-hero-badge .mini-radar-wrap { position: absolute; inset: 12px; opacity: 0.85; }
.fin-hero-badge .char-overlay { position: relative; z-index: 2; }
.fin-header-meta { min-width: 0; }
.fin-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 8px;
}
.fin-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; color: var(--text); }
.fin-sub { display: flex; gap: 10px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.fin-sub span.dot { color: var(--text-dim); }
.fin-header-right {
  text-align: right; font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em;
}
.fin-header-right .date { color: var(--text-dim); margin-top: 4px; }

/* VERDICT */
.fin-verdict { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.fin-verdict-cell { padding: 4px 28px; position: relative; }
.fin-verdict-cell:first-child { padding-left: 0; }
.fin-verdict-cell:last-child { padding-right: 0; border-left: 1px solid var(--border); }
.fin-verdict-label {
  font-size: 11px; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.14em;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 10px;
  display: flex; justify-content: space-between; align-items: center;
}
.fin-verdict-tag { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 4px; font-size: 10px; letter-spacing: 0.08em; }
.fin-verdict-tag.ok { background: rgba(74,222,128,0.12); color: var(--ok); border: 1px solid rgba(74,222,128,0.25); }
.fin-verdict-tag.warn { background: rgba(248,113,113,0.12); color: var(--danger); border: 1px solid rgba(248,113,113,0.25); }
.fin-verdict-warning {
  grid-column: 1 / -1; margin-top: 20px; padding: 12px 16px;
  background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
  border-radius: 6px; font-size: 12.5px; color: var(--text); line-height: 1.65;
}
.fin-verdict-warning strong { color: var(--danger); font-weight: 600; }
.fin-verdict-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px; font-weight: 500; color: var(--text);
  line-height: 1; letter-spacing: -0.02em;
  display: flex; align-items: baseline; gap: 8px;
}
.fin-verdict-value .pct { font-size: 18px; color: var(--text-muted); font-weight: 400; }
.fin-verdict-note { font-size: 12px; color: var(--text-muted); margin-top: 12px; line-height: 1.6; }

/* SECTION HEAD */
.fin-section-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.fin-section-title {
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted); letter-spacing: 0.18em;
  text-transform: uppercase; font-weight: 500;
}
.fin-section-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); letter-spacing: 0.1em; }
.fin-section-head.hero { padding-bottom: 22px; border-bottom: 1px solid var(--border-strong); align-items: flex-end; margin-bottom: 26px; }
.fin-section-head.hero .fin-section-title-emph { display: flex; flex-direction: column; gap: 6px; }
.fin-section-head.hero .fin-section-kicker {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--accent); letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;
}
.fin-section-head.hero .fin-section-heading {
  font-size: 30px; font-weight: 700; color: var(--accent);
  letter-spacing: -0.025em; line-height: 1.1; margin: 0;
  text-shadow: 0 0 24px rgba(129,140,248,0.3);
}
.fin-section-head.hero .fin-section-heading em { font-style: normal; color: var(--text); font-weight: 500; }

/* TYPE */
.fin-type { display: grid; grid-template-columns: 120px 1fr; gap: 32px; align-items: center; }
.fin-type-radar {
  aspect-ratio: 1; border: 1px solid var(--border); border-radius: 12px;
  background: var(--surface); padding: 12px;
  display: flex; align-items: center; justify-content: center;
}
.fin-type-name { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 4px; }
.fin-type-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); letter-spacing: 0.2em; margin-bottom: 14px; }
.fin-type-tagline { font-size: 14px; color: var(--text-muted); margin: 0 0 16px; line-height: 1.6; }
.fin-type-tags { display: flex; gap: 20px; font-size: 12px; flex-wrap: wrap; }
.fin-type-tags > div { display: flex; gap: 8px; align-items: baseline; }
.fin-type-tags .tag-label { color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.1em; }
.fin-type-tags .tag-items { color: var(--text); }

/* RADAR ROW */
.fin-radar-row { display: grid; grid-template-columns: 300px 1fr; gap: 36px; align-items: start; }
.fin-legend { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
.fin-legend-item { display: flex; align-items: center; gap: 6px; }
.fin-legend-swatch { width: 14px; height: 2px; }

/* SCORE BAR */
.score-list { display: flex; flex-direction: column; gap: 12px; }
.score-row { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 14px; padding: 6px 0; }
.score-label { font-size: 13px; color: var(--text); }
.score-track { position: relative; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: visible; }
.score-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; transition: width 0.4s ease; }
.score-bench { position: absolute; top: -3px; bottom: -3px; width: 2px; background: rgba(255,255,255,0.6); transform: translateX(-1px); }
.score-meta { font-family: 'JetBrains Mono', monospace; font-size: 12px; display: flex; justify-content: flex-end; gap: 8px; color: var(--text); }
.score-delta { color: var(--text-muted); font-size: 11px; }
.score-delta.pos { color: var(--ok); }
.score-delta.neg { color: var(--warn); }

/* TOP3 */
.top-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
.top-head {
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted); letter-spacing: 0.15em;
  text-transform: uppercase; margin-bottom: 4px; padding-bottom: 10px;
  border-bottom: 1px solid var(--border-strong);
  display: flex; justify-content: space-between; align-items: center;
}
.top-head-tag { font-size: 10px; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.08em; }
.top-head-tag.strength { background: rgba(74,222,128,0.1); color: var(--ok); border: 1px solid rgba(74,222,128,0.25); }
.top-head-tag.weak { background: rgba(245,158,11,0.1); color: var(--warn); border: 1px solid rgba(245,158,11,0.25); }
.top-row { display: grid; grid-template-columns: 20px 1fr auto auto auto; gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--border); align-items: center; }
.top-row:last-child { border-bottom: none; }
.top-num { font-family: 'JetBrains Mono', monospace; color: var(--text-dim); font-size: 12px; }
.top-label { font-size: 14px; font-weight: 500; }
.top-score { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
.top-pct {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted);
  padding: 3px 8px; background: rgba(255,255,255,0.04);
  border: 1px solid var(--border); border-radius: 4px;
  white-space: nowrap;
}
.top-grade { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.05em; min-width: 22px; text-align: center; }
.top-grade.s { color: var(--accent); background: var(--accent-soft); border: 1px solid rgba(255,255,255,0.12); }
.top-grade.a { color: var(--text); background: rgba(255,255,255,0.06); border: 1px solid var(--border); }
.top-grade.b { color: var(--warn); background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
.top-grade.c { color: var(--danger); background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); }
.top-grade.d { color: #ef4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); }

/* INTEGRITY */
.integrity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.integrity-cell { padding: 24px; background: var(--surface); }
.integrity-cell + .integrity-cell { border-left: 1px solid var(--border); }
.integrity-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; }
.integrity-name { font-size: 13px; color: var(--text); font-weight: 500; }
.integrity-pct { font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
.integrity-pct.ok { color: var(--ok); background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); }
.integrity-pct.warn { color: var(--danger); background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); }
.integrity-body { font-size: 12.5px; color: var(--text-muted); line-height: 1.7; margin-bottom: 14px; }
.integrity-kv { display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
.integrity-kv-row { display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline; }
.integrity-kv-key { font-family: 'JetBrains Mono', monospace; color: var(--text-dim); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
.integrity-kv-val { color: var(--text); line-height: 1.65; }
.integrity-kv-val .warn-text { color: var(--warn); font-weight: 500; }
.integrity-kv-val .penalty { font-family: 'JetBrains Mono', monospace; color: var(--danger); font-weight: 500; }

/* TIP SPLIT */
.tip-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: 8px; }
.tip-col { padding: 22px 24px; }
.tip-col + .tip-col { border-left: 1px solid var(--border); }
.tip-head {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.15em; text-transform: uppercase;
  margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
}
.tip-head.tip { color: var(--accent); }
.tip-head.caution { color: var(--warn); }
.tip-list { display: flex; flex-direction: column; gap: 14px; }
.tip-item { display: grid; grid-template-columns: 24px 1fr; gap: 10px; font-size: 13px; color: var(--text); line-height: 1.55; }
.tip-bullet { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); padding-top: 2px; }

/* COACHING */
.coach-callout {
  border-left: 2px solid var(--accent); padding: 16px 0 16px 20px;
  margin-bottom: 24px; font-size: 13px; color: var(--text); line-height: 1.7;
  background: linear-gradient(90deg, var(--accent-soft), transparent);
}
.coach-callout strong { color: var(--accent); font-weight: 600; }
.coach-item { display: grid; grid-template-columns: 40px 1fr; gap: 18px; padding: 20px 0; border-bottom: 1px solid var(--border); }
.coach-item:last-child { border-bottom: none; }
.coach-n { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); font-weight: 500; letter-spacing: 0.05em; padding-top: 2px; }
.coach-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
.coach-body { font-size: 13px; color: var(--text-muted); line-height: 1.7; margin: 0; }
.coach-body strong { color: var(--text); font-weight: 600; }
.coach-group-head {
  font-size: 12px; font-family: 'JetBrains Mono', monospace;
  color: var(--accent); letter-spacing: 0.15em;
  text-transform: uppercase; font-weight: 500;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-strong); margin-bottom: 6px;
}
.coach-examples, .coach-traps { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.coach-examples li, .coach-traps li {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text);
  padding: 8px 12px; background: rgba(255,255,255,0.03);
  border: 1px solid var(--border); border-left: 2px solid var(--accent);
  border-radius: 4px; line-height: 1.55;
}
.coach-traps li { border-left-color: var(--danger); background: rgba(248,113,113,0.04); }
.coach-examples li::before { content: "\\2713  "; color: var(--accent); font-weight: 600; }
.coach-traps li::before { content: "\\2717  "; color: var(--danger); font-weight: 600; }

/* COMPANY / FIT */
.info-note {
  display: flex; gap: 10px; padding: 12px 14px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border);
  border-left: 2px solid var(--accent); border-radius: 6px;
  font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;
}
.info-note-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--accent); letter-spacing: 0.1em; flex-shrink: 0; }
.company-values { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.company-value {
  padding: 6px 12px; background: var(--accent-soft);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
  font-size: 12px; color: var(--text);
}
.company-summary { font-size: 14px; color: var(--text); line-height: 1.75; margin: 0; }
.fit-hero { display: grid; grid-template-columns: 180px 1fr; gap: 32px; align-items: center; padding: 4px 0 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
.fit-pct-box {
  border: 1px solid var(--border-strong); border-radius: 12px;
  padding: 20px 16px; text-align: center;
  background: radial-gradient(circle at 50% 0%, var(--accent-soft), transparent 70%);
}
.fit-pct-val { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 500; color: var(--accent); line-height: 1; letter-spacing: -0.02em; }
.fit-pct-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase; margin-top: 10px; }
.fit-summary { font-size: 14px; color: var(--text); line-height: 1.8; margin: 0; }
.fit-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
.fit-col-head {
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.15em; text-transform: uppercase;
  margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border-strong);
  display: flex; justify-content: space-between; align-items: center;
}
.fit-col-head.plus { color: var(--ok); }
.fit-col-head.minus { color: var(--warn); }
.fit-col-head-tag { font-size: 9px; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.08em; }
.fit-col-head.plus .fit-col-head-tag { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25); }
.fit-col-head.minus .fit-col-head-tag { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); }
.fit-list { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.fit-list li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; font-size: 13px; color: var(--text); line-height: 1.65; }
.fit-list-bullet { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); padding-top: 2px; }
.fit-overall { padding: 18px 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; font-size: 13.5px; color: var(--text); line-height: 1.75; }
.fit-overall-label {
  display: block; font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--accent); letter-spacing: 0.15em;
  text-transform: uppercase; margin-bottom: 10px;
}

/* INTERVIEW */
.iq-intro { display: flex; gap: 16px; align-items: baseline; margin-bottom: 4px; flex-wrap: wrap; }
.iq-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); letter-spacing: 0.1em; }
.iq-list { display: flex; flex-direction: column; }
.iq-item { display: grid; grid-template-columns: 48px 1fr; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--border); align-items: start; }
.iq-item:last-child { border-bottom: none; }
.iq-n { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); font-weight: 500; letter-spacing: 0.05em; padding-top: 2px; }
.iq-q { font-size: 14px; color: var(--text); font-weight: 500; line-height: 1.6; margin: 0 0 10px; }
.iq-meta { display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.6; }
.iq-meta-row { display: grid; grid-template-columns: 60px 1fr; gap: 10px; }
.iq-meta-key { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; padding-top: 1px; }
.iq-meta-val { color: var(--text-muted); }

/* FOOTER */
.fin-footer { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 36px; padding: 32px 0 16px; }
.footer-char { width: 72px; height: 72px; border-radius: 50%; background: var(--accent-soft); border: 1px solid var(--border-strong); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.footer-disclaimer { font-size: 12px; color: var(--text-muted); text-align: center; }
.footer-powered { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); letter-spacing: 0.12em; margin-top: 2px; }
.footer-btn {
  margin-top: 20px; padding: 14px 48px;
  border: 1px solid var(--accent); background: var(--accent-soft);
  color: var(--text); font-family: inherit;
  font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
  border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}
.footer-btn:hover { background: var(--accent); color: #0a0c10; }

/* MOBILE */
@media (max-width: 680px) {
  .fin-root { padding: 20px 16px 60px; }
  .fin-card { padding: 20px 18px; }
  .fin-header { grid-template-columns: auto 1fr; gap: 16px; }
  .fin-header-right { display: none; }
  .fin-title { font-size: 22px; }
  .fin-verdict { grid-template-columns: 1fr; }
  .fin-verdict-cell { padding: 0; }
  .fin-verdict-cell:last-child { padding-left: 0; border-left: none; border-top: 1px solid var(--border); padding-top: 20px; margin-top: 20px; }
  .fin-verdict-value { font-size: 40px; }
  .fin-type { grid-template-columns: 1fr; gap: 20px; }
  .fin-type-radar { max-width: 120px; margin: 0 auto; }
  .fin-radar-row { grid-template-columns: 1fr; gap: 24px; }
  .top-groups { grid-template-columns: 1fr; gap: 24px; }
  .integrity-grid { grid-template-columns: 1fr; }
  .integrity-cell + .integrity-cell { border-left: none; border-top: 1px solid var(--border); }
  .tip-split { grid-template-columns: 1fr; }
  .tip-col + .tip-col { border-left: none; border-top: 1px solid var(--border); }
  .fit-hero { grid-template-columns: 1fr; gap: 20px; text-align: center; }
  .fit-cols { grid-template-columns: 1fr; gap: 24px; }
  .fin-section-head.hero .fin-section-heading { font-size: 24px; }
  .top-row { grid-template-columns: 20px 1fr auto auto; }
  .top-row .top-pct { display: none; }
}
`;
