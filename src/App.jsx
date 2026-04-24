import { useState, useMemo, useEffect, useRef } from "react";
import { BASE_QUESTIONS, PUBLIC_QUESTIONS, CC_PAIRS, DIM_LABELS, DIMS_ORDER, PUBLIC_DIMS, NEGATIVE_DIMS, NEG_LABELS, PERSONALITY_TYPES, IF_IDS, IF_THRESHOLD, IF_FLAG_MIN } from "./questions.js";

function shuffleWithSeed(arr,seed=42){const a=[...arr];let s=seed;for(let i=a.length-1;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const PER_PAGE=10;

// ═══ Animated Radar ═══
function AnimatedRadar({scores,dims,labels,companyProfile,size=360}){
  const[progress,setProgress]=useState(0);
  const animRef=useRef(null);
  useEffect(()=>{let start=null;const dur=1200;const anim=(ts)=>{if(!start)start=ts;const p=Math.min((ts-start)/dur,1);setProgress(1-Math.pow(1-p,3));if(p<1)animRef.current=requestAnimationFrame(anim);};animRef.current=requestAnimationFrame(anim);return()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};},[]);
  const cx=size/2,cy=size/2,r=size*0.33,step=(2*Math.PI)/dims.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*step;return{x:cx+r*(v/100)*Math.cos(a),y:cy+r*(v/100)*Math.sin(a)};};
  const myPoly=dims.map((d,i)=>{const p=pt(i,Math.round((scores[d]||0)*progress));return`${p.x},${p.y}`;}).join(" ");
  const coPoly=companyProfile?dims.map((d,i)=>{const p=pt(i,(companyProfile[d]||0)*progress);return`${p.x},${p.y}`;}).join(" "):null;
  const gid="g"+Math.random().toString(36).slice(2,6);
  return(
    <svg viewBox={`0 0 ${size} ${size}`} style={{width:"100%",maxWidth:380}}>
      <defs><filter id={gid}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      {[20,40,60,80,100].map(lv=><polygon key={lv} points={dims.map((_,i)=>{const p=pt(i,lv);return`${p.x},${p.y}`;}).join(" ")} fill="none" stroke={lv===60?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"} strokeWidth={lv===60?"1.5":"1"}/>)}
      {dims.map((_,i)=>{const p=pt(i,100);return<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>;})}
      {coPoly&&<polygon points={coPoly} fill="rgba(251,146,60,0.1)" stroke="#fb923c" strokeWidth="2" strokeDasharray="6 3" opacity={progress}/>}
      <polygon points={myPoly} fill="rgba(96,165,250,0.2)" stroke="#60a5fa" strokeWidth="2.5" filter={`url(#${gid})`}/>
      {dims.map((d,i)=>{const p=pt(i,Math.round((scores[d]||0)*progress));return<circle key={d} cx={p.x} cy={p.y} r="5" fill="#60a5fa" stroke="#0f172a" strokeWidth="2.5" style={{filter:"drop-shadow(0 0 4px rgba(96,165,250,0.6))"}}/>;})}{dims.map((d,i)=>{const p=pt(i,125);const anc=p.x<cx-10?"end":p.x>cx+10?"start":"middle";
        return<text key={d} x={p.x} y={p.y} textAnchor={anc} dominantBaseline="central" style={{fontSize:dims.length>9?9.5:11,fill:"#e2e8f0",fontWeight:700}}>{labels[d]||d} <tspan style={{fill:"#60a5fa"}}>{Math.round((scores[d]||0)*progress)}</tspan></text>;})}
      {companyProfile&&progress>0.5&&<><rect x={12} y={size-32} width={12} height={12} rx={2} fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth="1.5"/><text x={28} y={size-23} style={{fontSize:10,fill:"#cbd5e0"}}>나</text><rect x={50} y={size-32} width={12} height={12} rx={2} fill="rgba(251,146,60,0.15)" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="3 2"/><text x={66} y={size-23} style={{fontSize:10,fill:"#cbd5e0"}}>기업</text></>}
    </svg>);
}

function Spinner({text}){return(<div style={{textAlign:"center",padding:40}}><div style={{width:44,height:44,border:"3px solid rgba(96,165,250,0.2)",borderTop:"3px solid #60a5fa",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><div style={{color:"#e2e8f0",fontSize:16,fontWeight:600}}>{text}</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);}

function DeepHeader({subtitle}){return(<div style={{textAlign:"center",marginBottom:24}}><img src="/deepdungi.png" alt="딥둥이" style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",marginBottom:12,border:"3px solid rgba(96,165,250,0.3)"}}/><div style={{fontSize:12,letterSpacing:6,color:"#94a3b8",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>457deep</div><h1 style={{fontSize:26,fontWeight:900,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.3,marginBottom:8}}>딥둥이 모의 인성검사</h1>{subtitle&&<p style={{color:"#cbd5e0",fontSize:14,lineHeight:1.6,whiteSpace:"pre-line"}}>{subtitle}</p>}</div>);}

// ═══ 이상치/무성의 탐지 함수 ═══
function detectAllSame(answers, questions) {
  // 셔플된 원래 순서대로 답변 배열 생성
  const orderedAnswers = questions.map(q => answers[q.id]).filter(a => a !== undefined);
  let maxRun = 1, curRun = 1;
  for (let i = 1; i < orderedAnswers.length; i++) {
    if (orderedAnswers[i] === orderedAnswers[i - 1]) { curRun++; if (curRun > maxRun) maxRun = curRun; }
    else curRun = 1;
  }
  return { detected: maxRun >= 20, maxRun };
}

function detectInfrequency(answers) {
  let flagged = 0;
  const flaggedItems = [];
  IF_IDS.forEach(id => {
    const a = answers[id];
    if (a !== undefined && a >= IF_THRESHOLD) { flagged++; flaggedItems.push(id); }
  });
  // IF_FLAG_MIN개 이상 동의 시에만 감점 대상 (단, 결과에서는 직접 언급하지 않음)
  return { detected: flagged >= IF_FLAG_MIN, count: flagged, flaggedItems };
}

function detectLowVariance(answers, questions) {
  // 성격 차원 측정 문항만 (CC/SD/IF 제외) 대상으로 표준편차 계산
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

function detectExtremeHigh(adjustedScores, dims) {
  // 보정 후 85점 이상인 차원 개수
  const highCount = dims.filter(d => (adjustedScores[d] || 0) >= 85).length;
  return { detected: highCount >= 7, count: highCount, total: dims.length };
}

function detectStatisticalOutlier(scores) {
  const mainDims = DIMS_ORDER;
  const vals = mainDims.map(d => scores[d] || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const allAbove85 = vals.every(v => v >= 85);
  const avgAbove80 = avg >= 80;
  const extremeLows = mainDims.filter(d => (scores[d] || 0) <= 20);
  return {
    allHigh: allAbove85,
    avgHigh: avgAbove80,
    avg: Math.round(avg),
    extremeLows,
    detected: allAbove85 || avgAbove80 || extremeLows.length > 0
  };
}

// ═══ 점수 보정 ═══
function adjustScore(raw) {
  // 표시점수 = 원점수 × 0.6 + 30, 하한 25 · 상한 95
  return Math.min(95, Math.max(25, Math.round(raw * 0.6 + 30)));
}
function adjustCompanyScore(raw) {
  // 기업 적합도 = AI 결과 + 10, 상한 95
  if (typeof raw !== "number") return raw;
  return Math.min(95, Math.max(0, Math.round(raw + 10)));
}

function computeTrustScore(conP, sdP, vc) {
  const honesty = 100 - sdP;
  let raw = conP * 0.6 + honesty * 0.4;
  let penalty = 0;
  if (vc.allSame?.detected) penalty += 20;
  if (vc.infrequency?.detected) penalty += 15;
  if (vc.lowVariance?.detected) penalty += 15;
  if (vc.extremeHigh?.detected) penalty += 10;
  raw = Math.max(0, Math.round(raw - penalty));
  const display = Math.max(35, raw); // 하한 35 (원점수 40 미만이면 35로 끌어올림)
  const level = raw >= 80 ? "매우 높음" : raw >= 65 ? "양호" : raw >= 50 ? "보통" : raw >= 40 ? "주의" : "경고";
  return { raw, display, penalty, level };
}

export default function App(){
  const[stage,setStage]=useState("intro");
  const[mode,setMode]=useState(null);
  const[companyName,setCompanyName]=useState("");
  const[companyData,setCompanyData]=useState(null);
  const[page,setPage]=useState(1);
  const[answers,setAnswers]=useState({});
  const[startTime,setStartTime]=useState(null);
  const[endTime,setEndTime]=useState(null);
  const[aiResults,setAiResults]=useState(null);
  const[aiError,setAiError]=useState("");
  const[basicResults,setBasicResults]=useState(null);

  const questions=useMemo(()=>{
    const base=[...BASE_QUESTIONS];
    if(mode==="public") return shuffleWithSeed([...base,...PUBLIC_QUESTIONS],777);
    return shuffleWithSeed(base,777);
  },[mode]);

  const TOTAL_Q=questions.length;
  const TOTAL_PAGES=Math.ceil(TOTAL_Q/PER_PAGE);

  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[page,stage]);

  const curQs=useMemo(()=>{
    if(stage!=="test")return[];
    return questions.slice((page-1)*PER_PAGE,page*PER_PAGE);
  },[page,stage,questions]);

  const allAnswered=useMemo(()=>curQs.every(q=>answers[q.id]!==undefined),[answers,curQs]);
  const total=Object.keys(answers).length;
  const pct=Math.round(total/TOTAL_Q*100);

  function computeResults(){
    const allDims=[...DIMS_ORDER,...(mode==="public"?[...PUBLIC_DIMS,...NEGATIVE_DIMS]:[])];
    const ds={};allDims.forEach(d=>{ds[d]=[];});
    questions.forEach(q=>{
      if(q.dim==="CC"||q.dim==="SD"||q.dim==="IF")return;
      const a=answers[q.id];if(a===undefined)return;
      if(!ds[q.dim])ds[q.dim]=[];
      if(NEGATIVE_DIMS.includes(q.dim)){ds[q.dim].push(a);}
      else{ds[q.dim].push(q.rev?(6-a):a);}
    });
    const sc={};
    Object.keys(ds).forEach(d=>{const arr=ds[d];sc[d]=arr.length?Math.round((arr.reduce((a,b)=>a+b,0)/arr.length-1)/4*100):50;});

    const sdQ=questions.filter(q=>q.dim==="SD");
    const sdS=sdQ.reduce((s,q)=>s+(answers[q.id]||3),0);
    const sdP=Math.round(sdS/(sdQ.length*5)*100);

    let ccDiffs=[];
    CC_PAIRS.forEach(([c,o])=>{const a1=answers[c],a2=answers[o];if(a1!==undefined&&a2!==undefined)ccDiffs.push(Math.abs(a1-a2));});
    const revPairs=[[1,6],[23,28],[45,48],[67,77],[89,90],[23,33],[47,58],[141,144],[159,163],[129,134]];
    let dimDiffs=[];
    revPairs.forEach(([p,r])=>{const a1=answers[p],a2=answers[r];if(a1!==undefined&&a2!==undefined){const q=questions.find(q=>q.id===r);if(q&&q.rev)dimDiffs.push(Math.abs(a1-(6-a2)));else dimDiffs.push(Math.abs(a1-a2));}});
    let conP=50;const allD=[...ccDiffs,...dimDiffs];
    if(allD.length>0){conP=Math.max(0,Math.round((1-allD.reduce((a,b)=>a+b,0)/allD.length/4)*100));}

    // ═══ 보정 점수 (일반 차원만; 부적격 요인은 원점수 유지) ═══
    const posDims = [...DIMS_ORDER, ...(mode==="public"?PUBLIC_DIMS:[])];
    const adjScores = {...sc};
    posDims.forEach(d => { adjScores[d] = adjustScore(sc[d] || 0); });

    // ═══ 이상치 탐지 ═══
    const allSame = detectAllSame(answers, questions);
    const ifResult = detectInfrequency(answers);
    const outlier = detectStatisticalOutlier(sc);
    const lowVariance = detectLowVariance(answers, questions);
    const extremeHigh = detectExtremeHigh(adjScores, posDims);

    const vc = { allSame, infrequency: ifResult, outlier, lowVariance, extremeHigh };
    const trust = computeTrustScore(conP, sdP, vc);

    const pType=PERSONALITY_TYPES.find(t=>t.condition(sc))||PERSONALITY_TYPES[7];
    return{scores:sc, adjustedScores:adjScores, sdPct:sdP, consistencyPct:conP, trustScore:trust, personalityType:pType,
      validityChecks: vc
    };
  }

  async function analyzeCompanyInBackground(){
    if(!companyName.trim())return;
    try{const res=await fetch("/.netlify/functions/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"analyze_company",companyName})});if(res.ok){const data=await res.json();if(!data.error&&!data.parseError)setCompanyData(data);}}catch(e){}
  }

  async function generateAiResults(basic){
    setStage("test_loading");setAiError("");
    try{const res=await fetch("/.netlify/functions/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"generate_results",testResults:{companyName:companyData?.companyName||companyName||"일반",companyProfile:companyData?.bigFiveProfile||null,scores:basic.scores,adjustedScores:basic.adjustedScores,personalityType:basic.personalityType.name,consistencyScore:basic.consistencyPct,honestyScore:100-basic.sdPct,trustScore:basic.trustScore?.display,validityChecks:basic.validityChecks}})});
      if(!res.ok){setAiError(`서버 오류 (${res.status})`);setStage("result");return;}
      const data=await res.json();if(data.error||data.parseError){setAiError(data.error||"AI 결과 생성 실패");setStage("result");return;}
      setAiResults(data);setStage("result");
    }catch(e){setAiError("결과 생성 오류: "+e.message);setStage("result");}
  }

  function handleTestComplete(){setEndTime(Date.now());const basic=computeResults();setBasicResults(basic);generateAiResults(basic);}

  const S={
    wrap:{minHeight:"100vh",background:"linear-gradient(160deg,#0c1222 0%,#162032 50%,#0c1222 100%)",color:"#f1f5f9",fontFamily:"'Noto Sans KR',-apple-system,sans-serif",padding:0},
    box:{maxWidth:640,margin:"0 auto",padding:"20px 16px"},
    card:{background:"rgba(22,32,50,0.9)",border:"1px solid rgba(71,85,105,0.3)",borderRadius:14,padding:22,marginBottom:16},
    progBg:{width:"100%",height:6,background:"rgba(71,85,105,0.3)",borderRadius:3,overflow:"hidden",marginBottom:6},
    progFill:w=>({width:`${w}%`,height:"100%",background:"linear-gradient(90deg,#3b82f6,#8b5cf6)",borderRadius:3,transition:"width .4s"}),
    qNum:{fontSize:13,color:"#94a3b8",fontWeight:700,marginBottom:8},
    qTxt:{fontSize:17,fontWeight:600,lineHeight:1.7,color:"#f1f5f9",marginBottom:16},
    scRow:{display:"flex",gap:8,justifyContent:"center"},
    scBtn:a=>({flex:1,minWidth:52,padding:"12px 4px",border:a?"2px solid #60a5fa":"1px solid rgba(71,85,105,0.4)",borderRadius:10,background:a?"rgba(96,165,250,0.15)":"rgba(15,23,42,0.5)",color:a?"#93c5fd":"#94a3b8",cursor:"pointer",fontSize:15,fontWeight:a?800:600,textAlign:"center",transition:"all .15s"}),
    scLbl:{display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8",marginTop:6,padding:"0 4px"},
    nav:{display:"flex",gap:10,justifyContent:"space-between",marginTop:20},
    btn:p=>({padding:"15px 28px",border:"none",borderRadius:12,background:p?"linear-gradient(135deg,#3b82f6,#7c3aed)":"rgba(71,85,105,0.25)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",flex:p?1:undefined}),
    btnOff:{padding:"15px 28px",border:"none",borderRadius:12,background:"rgba(71,85,105,0.1)",color:"rgba(100,116,139,0.35)",fontSize:16,fontWeight:700,cursor:"not-allowed",flex:1},
    input:{width:"100%",padding:"16px 20px",border:"1px solid rgba(71,85,105,0.4)",borderRadius:12,background:"rgba(15,23,42,0.6)",color:"#f1f5f9",fontSize:18,fontWeight:600,outline:"none",fontFamily:"inherit"},
    secTtl:{fontSize:19,fontWeight:800,marginBottom:16,color:"#f1f5f9"},
    dimBar:{marginBottom:12},dimLbl:{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:4,color:"#e2e8f0"},
    barBg:{height:8,background:"rgba(71,85,105,0.25)",borderRadius:4,overflow:"hidden"},
    barFill:(w,c="#60a5fa")=>({width:`${w}%`,height:"100%",background:c,borderRadius:4,transition:"width .7s"}),
    typeCard:{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12))",border:"1px solid rgba(139,92,246,0.3)",borderRadius:16,padding:28,textAlign:"center",marginBottom:20},
    badge:g=>({display:"inline-block",padding:"4px 12px",borderRadius:16,fontSize:13,fontWeight:700,background:g?"rgba(52,211,153,0.12)":"rgba(251,146,60,0.12)",color:g?"#6ee7b7":"#fdba74",marginRight:6}),
    iq:{padding:"14px 18px",background:"rgba(15,23,42,0.5)",borderRadius:10,marginBottom:10,fontSize:15,lineHeight:1.7,color:"#cbd5e0",borderLeft:"3px solid #7c3aed"},
    tag:{display:"inline-block",padding:"5px 12px",borderRadius:8,fontSize:14,fontWeight:600,background:"rgba(96,165,250,0.1)",color:"#93c5fd",margin:"0 4px 6px 0"},
    tipCard:{background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:14,padding:22,marginBottom:16},
    warnCard:{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.25)",borderRadius:14,padding:22,marginBottom:16},
    tipItem:{fontSize:15,lineHeight:1.8,color:"#e2e8f0",marginBottom:12,paddingLeft:20,position:"relative"},
    modeBtn:(sel)=>({flex:1,padding:"20px 16px",border:sel?"2px solid #60a5fa":"1px solid rgba(71,85,105,0.4)",borderRadius:14,background:sel?"rgba(96,165,250,0.1)":"rgba(15,23,42,0.5)",cursor:"pointer",textAlign:"center",transition:"all .2s"}),
    alertCard:(color)=>({background:`rgba(${color},0.06)`,border:`1px solid rgba(${color},0.35)`,borderRadius:14,padding:22,marginBottom:16}),
  };

  // ═══ INTRO ═══
  if(stage==="intro") return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{height:32}}/>
      <DeepHeader subtitle={"Big5+자주성+집중력 기반 AI 맞춤 분석\n사기업 / 공공기관 모드 선택 가능"}/>
      <div style={{...S.card,padding:20}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:16,color:"#f1f5f9"}}>검사 유형을 선택하세요</div>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={S.modeBtn(mode==="private")} onClick={()=>setMode("private")}>
            <div style={{fontSize:28,marginBottom:8}}>🏢</div>
            <div style={{fontSize:16,fontWeight:700,color:mode==="private"?"#60a5fa":"#cbd5e0"}}>사기업</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>204문항 · 약 25분</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:6}}>삼성, SK, 현대, LG, CJ 등</div>
          </div>
          <div style={S.modeBtn(mode==="public")} onClick={()=>setMode("public")}>
            <div style={{fontSize:28,marginBottom:8}}>🏛️</div>
            <div style={{fontSize:16,fontWeight:700,color:mode==="public"?"#60a5fa":"#cbd5e0"}}>공공기관</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>244문항 · 약 30분</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:6}}>공기업, 준정부, 공공기관</div>
          </div>
        </div>
        {mode==="public"&&<div style={{fontSize:13,color:"#a78bfa",padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10,border:"1px solid rgba(139,92,246,0.15)",lineHeight:1.7}}>
          공공기관 모드에는 <span style={{fontWeight:700}}>윤리성</span> 차원 + <span style={{fontWeight:700}}>부적격 요인</span>(반사회성, 대인불신, 공격성, 스트레스취약성, 편집증) 탐지 문항이 추가됩니다.
        </div>}
      </div>
      <div style={{...S.card,padding:20}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12,color:"#f1f5f9"}}>측정 차원</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {DIMS_ORDER.map(d=><span key={d} style={S.tag}>{DIM_LABELS[d]}</span>)}
          {mode==="public"&&<><span style={{...S.tag,background:"rgba(139,92,246,0.15)",color:"#c4b5fd"}}>윤리성</span><span style={{...S.tag,background:"rgba(248,113,113,0.1)",color:"#fca5a5"}}>부적격 요인 탐지</span></>}
        </div>
        <div style={{fontSize:13,color:"#a78bfa",padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10,border:"1px solid rgba(139,92,246,0.15)",lineHeight:1.7,marginBottom:12}}>
          🔍 <span style={{fontWeight:700}}>탐지 시스템</span>: 응답 신뢰도 통합 지표 · 사회적 바람직성(SD) 5문항 · 일관성 검증(CC) 9쌍 · 차원 내 정역 쌍 10개 · <span style={{color:"#f87171",fontWeight:700}}>비빈도(IF) 4문항</span> · <span style={{color:"#f87171",fontWeight:700}}>올-세임/로우-배리언스 탐지</span> · <span style={{color:"#f87171",fontWeight:700}}>극단값 패턴 탐지</span>
        </div>
        <div style={{fontSize:15,lineHeight:2.2,color:"#cbd5e0"}}>
          <span style={{color:"#60a5fa",fontWeight:700}}>STEP 1</span> 지원 기업/기관명 입력 (선택)<br/>
          <span style={{color:"#a78bfa",fontWeight:700}}>STEP 2</span> {mode==="public"?"244":"204"}문항 인성검사<br/>
          <span style={{color:"#c084fc",fontWeight:700}}>STEP 3</span> AI 맞춤 결과 + TIP 제공
        </div>
      </div>
      <button style={mode?{...S.btn(true),display:"block",width:"100%",padding:"18px",fontSize:18,fontWeight:800,boxShadow:"0 6px 24px rgba(99,102,241,0.3)"}:{...S.btnOff,display:"block",width:"100%",padding:"18px",fontSize:18}} disabled={!mode} onClick={()=>setStage("company_input")}>
        {mode?"다음으로":"유형을 선택하세요"}
      </button>
      <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#64748b"}}>Powered by 457deep · 딥둥이</div>
      <div style={{height:32}}/>
    </div></div>
  );

  // ═══ COMPANY INPUT ═══
  if(stage==="company_input") return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{height:32}}/>
      <DeepHeader subtitle={`${mode==="public"?"공공기관":"사기업"} 모드 · ${mode==="public"?"244":"204"}문항`}/>
      <div style={S.card}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:14,color:"#f1f5f9"}}>지원 {mode==="public"?"기관":"기업"} (선택)</div>
        <div style={{marginBottom:16}}>
          <input style={S.input} placeholder={mode==="public"?"기관명 입력 (예: 한국전력공사)":"기업명 입력 (예: 삼성전자)"} value={companyName} onChange={e=>setCompanyName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(companyName.trim())analyzeCompanyInBackground();setStage("test");setStartTime(Date.now());}}}/>
        </div>
        <button style={{...S.btn(true),width:"100%"}} onClick={()=>{if(companyName.trim())analyzeCompanyInBackground();setStage("test");setStartTime(Date.now());}}>검사 시작하기</button>
        <div style={{textAlign:"center",marginTop:12,fontSize:13,color:"#94a3b8"}}>입력하지 않아도 검사는 진행됩니다</div>
      </div>
    </div></div>
  );

  if(stage==="test_loading") return(<div style={S.wrap}><div style={S.box}><div style={{height:60}}/><DeepHeader/><Spinner text="딥둥이가 맞춤 결과 리포트를 만들고 있어요..."/></div></div>);

  // ═══ RESULT ═══
  if(stage==="result"&&basicResults){
    const{scores:sc,adjustedScores:adj,sdPct:sdP,consistencyPct:conP,trustScore:trust,personalityType:pType,validityChecks:vc}=basicResults;
    const mins=endTime&&startTime?Math.round((endTime-startTime)/60000):"–";
    const radarDims=mode==="public"?[...DIMS_ORDER,...PUBLIC_DIMS]:DIMS_ORDER;
    const radarLabels={...DIM_LABELS};
    const getPercentile=(s)=>s>=90?"상위 5%":s>=80?"상위 10%":s>=70?"상위 20%":s>=60?"상위 35%":s>=50?"평균":s>=40?"하위 35%":s>=30?"하위 20%":"하위 10%";
    const getPctColor=(s)=>s>=70?"#6ee7b7":s>=50?"#fbbf24":"#f87171";

    // 응답 신뢰도 색상
    const trustColor = trust.raw >= 80 ? "#6ee7b7" : trust.raw >= 65 ? "#fbbf24" : trust.raw >= 50 ? "#fb923c" : "#f87171";
    // 신뢰도 내부 요소 해석 (일관성·솔직성·탐지 이슈를 풀어서 설명)
    const conLv = conP>=80?"매우 일관적":conP>=60?"양호":conP>=40?"일부 모순":"응답 모순 심각";
    const sdLv = sdP<=40?"매우 솔직":sdP<=60?"양호":"과장 응답 경향 일부 감지";
    const trustNarrative = (() => {
      const parts = [];
      parts.push(`일관성은 ${conLv}`);
      parts.push(`솔직성은 ${sdLv}`);
      if (vc.allSame.detected) parts.push("연속 동일값 패턴이 감지되어 감점");
      if (vc.lowVariance.detected) parts.push("응답 변동이 매우 적어 감점");
      if (vc.extremeHigh.detected) parts.push("전반적으로 점수가 과도하게 높아 감점");
      if (vc.infrequency.detected) parts.push("일부 응답 패턴에서 주의가 필요해 감점");
      return parts.join(" · ");
    })();

    // 종합 경고 레벨 (비빈도는 직접 언급하지 않음)
    const hasAnyWarning = vc.allSame.detected || vc.lowVariance.detected || vc.extremeHigh.detected || vc.outlier.extremeLows.length > 0;

    return(
      <div style={S.wrap}><div style={S.box}>
        <div style={{height:16}}/>
        <DeepHeader subtitle={`${mode==="public"?"공공기관":"사기업"} 모드 · 소요: ${mins}분 · ${total}/${TOTAL_Q}문항`}/>

        {/* ═══ 응답 패턴 점검 카드 (최상단) — 진단+코칭 톤 ═══ */}
        {hasAnyWarning && <div style={{...S.alertCard("251,146,60"),border:"2px solid rgba(251,146,60,0.45)",background:"rgba(251,146,60,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{fontSize:26}}>🧭</span>
            <span style={{fontSize:20,fontWeight:900,color:"#fdba74"}}>응답 패턴 점검</span>
          </div>
          <div style={{fontSize:14,color:"#fcd9b6",lineHeight:1.9,marginBottom:16}}>
            아래 몇 가지 포인트만 <span style={{fontWeight:800,color:"#fdba74"}}>조금만 조정하면</span> 실제 검사에서 충분히 통과할 수 있는 프로파일이에요. 완벽함보다 <span style={{fontWeight:700}}>자연스러운 강약 차이</span>가 좋은 평가를 받습니다.
          </div>

          {/* 올-세임 탐지 */}
          {vc.allSame.detected && <div style={{padding:"14px 18px",background:"rgba(248,113,113,0.06)",borderRadius:12,border:"1px solid rgba(248,113,113,0.2)",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fca5a5",marginBottom:6}}>🔁 연속 동일값 패턴</div>
            <div style={{fontSize:14,color:"#e2e8f0",lineHeight:1.8}}>
              연속 <span style={{fontWeight:800,color:"#fca5a5"}}>{vc.allSame.maxRun}문항</span>이 같은 값으로 응답되었어요.
              각 문항을 찬찬히 읽고 본인 성향에 맞게 <span style={{fontWeight:700}}>2~4점 사이에서 분산</span>만 해도 이 포인트는 자연스럽게 해결됩니다.
            </div>
          </div>}

          {/* 로우-배리언스 (무성의 응답 — 응답 변동 매우 적음) */}
          {vc.lowVariance.detected && <div style={{padding:"14px 18px",background:"rgba(248,113,113,0.06)",borderRadius:12,border:"1px solid rgba(248,113,113,0.2)",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fca5a5",marginBottom:6}}>📉 무성의 응답 — 응답 변동 적음</div>
            <div style={{fontSize:14,color:"#e2e8f0",lineHeight:1.8}}>
              응답 변동이 매우 적습니다. 각 문항에 분명한 의견을 표현해보세요.
              문항마다 <span style={{fontWeight:700}}>"나는 정말 이런 사람인가?"</span>를 떠올리며 2~4점대에서 강약을 주면 자연스러운 프로파일이 됩니다.
            </div>
          </div>}

          {/* 극단값 패턴 — 보정 후 85+ 차원 7개 이상 */}
          {vc.extremeHigh.detected && <div style={{padding:"14px 18px",background:"rgba(251,146,60,0.08)",borderRadius:12,border:"1px solid rgba(251,146,60,0.25)",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fdba74",marginBottom:6}}>✨ 전반적 고점 — 강약 조절이 필요해요</div>
            <div style={{fontSize:14,color:"#e2e8f0",lineHeight:1.8}}>
              모든 차원에서 최고점을 받는 것보다 <span style={{fontWeight:700}}>자연스러운 강약 차이</span>가 있는 것이 오히려 좋은 평가를 받습니다.
              실제 검사에서 이런 패턴은 <span style={{fontWeight:700}}>비현실적 응답으로 분류</span>될 수 있어요.
              강점 2~3개는 확실히 드러내되, 나머지 영역은 솔직하게 "보통"으로 두면 훨씬 설득력 있는 결과가 됩니다.
            </div>
          </div>}

          {/* 기존: 평균 과도 — 코칭 톤으로 유지 */}
          {vc.outlier.avgHigh && !vc.extremeHigh.detected && <div style={{padding:"14px 18px",background:"rgba(251,146,60,0.06)",borderRadius:12,border:"1px solid rgba(251,146,60,0.2)",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fdba74",marginBottom:6}}>📊 전체 평균이 조금 높아요</div>
            <div style={{fontSize:14,color:"#e2e8f0",lineHeight:1.8}}>
              자연스러운 성격 프로파일에는 강점과 보완점이 공존해요. 과도한 고점은 오히려 신뢰도를 낮출 수 있으니,
              본인이 <span style={{fontWeight:700}}>덜 자신 있는 영역</span>은 솔직하게 응답해도 괜찮아요.
            </div>
          </div>}

          {/* 극단적 저점 — 코칭 톤 */}
          {vc.outlier.extremeLows.length > 0 && <div style={{padding:"14px 18px",background:"rgba(251,146,60,0.06)",borderRadius:12,border:"1px solid rgba(251,146,60,0.2)",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fdba74",marginBottom:6}}>🎯 특정 영역 보강 포인트</div>
            <div style={{fontSize:14,color:"#e2e8f0",lineHeight:1.8}}>
              {vc.outlier.extremeLows.map(d => DIM_LABELS[d] || d).join(", ")} 영역이 상당히 낮게 나왔어요.
              역문항을 반대로 읽지 않았는지 한 번만 점검하면, 이 부분은 금방 자연스러운 범위로 올라옵니다.
            </div>
          </div>}
        </div>}

        {/* 응답 신뢰도 (통합 지표) */}
        <div style={{...S.card,textAlign:"center",padding:"28px 22px"}}>
          <div style={{fontSize:13,letterSpacing:2,color:"#94a3b8",fontWeight:700,marginBottom:8}}>응답 신뢰도</div>
          <div style={{fontSize:64,fontWeight:900,color:trustColor,lineHeight:1.1,marginBottom:6}}>{trust.display}%</div>
          <div style={{fontSize:14,fontWeight:700,color:trustColor,marginBottom:14}}>{trust.level}</div>
          <div style={{fontSize:13,color:"#cbd5e0",lineHeight:1.7,padding:"10px 14px",background:"rgba(15,23,42,0.45)",borderRadius:10,textAlign:"left"}}>
            {trustNarrative}
          </div>
          {trust.raw < 40 && <div style={{fontSize:12,color:"#fdba74",marginTop:10,lineHeight:1.6,textAlign:"left",padding:"8px 12px",background:"rgba(251,146,60,0.08)",borderRadius:8,border:"1px solid rgba(251,146,60,0.2)"}}>
            ⚠️ 신뢰도 내부 원점수가 낮습니다. 문항을 한 번 더 천천히 읽고 재검사를 권장해요. (실제 검사에서는 재검사 대상이 될 수 있는 구간이에요.)
          </div>}
        </div>

        {/* 레이더 — 보정 점수 기반 */}
        <div style={S.card}>
          <div style={S.secTtl}>성격 프로파일{companyData?" vs 기업 인재상":""}</div>
          <div style={{display:"flex",justifyContent:"center"}}><AnimatedRadar scores={adj} dims={radarDims} labels={radarLabels} companyProfile={companyData?.bigFiveProfile}/></div>
          <div style={{fontSize:12,color:"#64748b",textAlign:"center",marginTop:8}}>※ 차원별 점수는 실전 감각에 맞춰 보정(scaling)된 표시 점수입니다.</div>
        </div>

        {/* 차원별 점수 — 보정 점수 */}
        <div style={S.card}>
          <div style={S.secTtl}>차원별 상세 점수</div>
          {radarDims.map(d=>(
            <div key={d} style={S.dimBar}>
              <div style={S.dimLbl}><span>{radarLabels[d]||d}</span><span style={{fontWeight:700,color:"#60a5fa"}}>{adj[d]}</span></div>
              <div style={S.barBg}><div style={S.barFill(adj[d])}/></div>
            </div>
          ))}
        </div>

        {/* 강약점 맵 — 보정 점수 */}
        {(()=>{
          const sorted=radarDims.map(d=>({d,s:adj[d]})).sort((a,b)=>b.s-a.s);
          const top3=sorted.slice(0,3),bot3=sorted.slice(-3).reverse();
          return(<div style={S.card}>
            <div style={S.secTtl}>📌 나의 강약점 맵</div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:700,color:"#6ee7b7",marginBottom:10}}>🔺 강점 TOP 3</div>
              {top3.map(({d,s},i)=>(<div key={d} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"10px 14px",background:"rgba(52,211,153,0.06)",borderRadius:10,border:"1px solid rgba(52,211,153,0.15)"}}><span style={{fontSize:20,fontWeight:900,color:"#6ee7b7",width:24}}>{i+1}</span><span style={{fontSize:15,fontWeight:700,color:"#e2e8f0",flex:1}}>{radarLabels[d]||d}</span><span style={{fontSize:18,fontWeight:800,color:"#60a5fa"}}>{s}점</span><span style={{fontSize:12,fontWeight:700,color:getPctColor(s),background:"rgba(0,0,0,0.2)",padding:"3px 8px",borderRadius:8}}>{getPercentile(s)}</span></div>))}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fb923c",marginBottom:10}}>🔻 보완 필요 TOP 3</div>
              {bot3.map(({d,s},i)=>(<div key={d} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"10px 14px",background:"rgba(251,146,60,0.06)",borderRadius:10,border:"1px solid rgba(251,146,60,0.15)"}}><span style={{fontSize:20,fontWeight:900,color:"#fb923c",width:24}}>{i+1}</span><span style={{fontSize:15,fontWeight:700,color:"#e2e8f0",flex:1}}>{radarLabels[d]||d}</span><span style={{fontSize:18,fontWeight:800,color:"#60a5fa"}}>{s}점</span><span style={{fontSize:12,fontWeight:700,color:getPctColor(s),background:"rgba(0,0,0,0.2)",padding:"3px 8px",borderRadius:8}}>{getPercentile(s)}</span></div>))}
            </div>
            {bot3[0]&&bot3[0].s<40&&<div style={{fontSize:13,color:"#fb923c"}}>💡 {radarLabels[bot3[0].d]||bot3[0].d} 영역을 조금만 보완하면 프로파일이 훨씬 균형 잡힐 수 있어요. 관련 경험을 한두 개 준비해두면 면접에서 강점으로 바꿀 수 있습니다.</div>}
          </div>);
        })()}

        {/* 유형 */}
        <div style={S.typeCard}>
          <div style={{fontSize:48,marginBottom:8}}>{pType.emoji}</div>
          <div style={{fontSize:24,fontWeight:800,marginBottom:12,color:"#c4b5fd"}}>"{pType.name}" 유형</div>
          <div style={{fontSize:15,lineHeight:1.8,color:"#e2e8f0"}}>{pType.desc}</div>
          <div style={{marginTop:16}}><span style={{...S.badge(true),fontSize:14}}>강점: {pType.strengths}</span></div>
          <div style={{marginTop:8}}><span style={{...S.badge(false),fontSize:14}}>보완점: {pType.weaknesses}</span></div>
        </div>

        {/* TIP */}
        <div style={S.tipCard}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><span style={{fontSize:22}}>💡</span><span style={{fontSize:19,fontWeight:800,color:"#6ee7b7"}}>{pType.name} 유형의 인성검사 TIP</span></div>
          {pType.tips.map((t,i)=>(<div key={i} style={S.tipItem}><span style={{position:"absolute",left:0,color:"#6ee7b7",fontWeight:700,fontSize:16}}>✓</span>{t}</div>))}
        </div>
        <div style={S.warnCard}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><span style={{fontSize:22}}>⚠️</span><span style={{fontSize:19,fontWeight:800,color:"#fdba74"}}>{pType.name} 유형이 주의할 점</span></div>
          {pType.warnings.map((w,i)=>(<div key={i} style={S.tipItem}><span style={{position:"absolute",left:0,color:"#fdba74",fontWeight:700,fontSize:16}}>!</span>{w}</div>))}
        </div>

        {/* 공공기관: 부적격 요인 */}
        {mode==="public"&&<div style={{...S.card,border:"1px solid rgba(248,113,113,0.25)"}}>
          <div style={S.secTtl}>🚨 공공기관 부적격 인성요인 탐지</div>
          <div style={{fontSize:13,color:"#cbd5e0",marginBottom:16,padding:"10px 14px",background:"rgba(248,113,113,0.06)",borderRadius:10,lineHeight:1.7}}>
            아래 항목이 높을수록 공공기관 인성검사에서 부적격 판정 위험이 높아집니다. 60점 이상이면 주의가 필요합니다.
          </div>
          {NEGATIVE_DIMS.map(d=>{
            const v=sc[d]||0;
            const danger=v>=60;
            const warn=v>=40&&v<60;
            return(<div key={d} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:15,fontWeight:700,color:danger?"#f87171":warn?"#fdba74":"#6ee7b7"}}>{NEG_LABELS[d]}</span>
                <span style={{fontSize:16,fontWeight:800,color:danger?"#f87171":warn?"#fdba74":"#6ee7b7"}}>{v}점</span>
              </div>
              <div style={S.barBg}><div style={S.barFill(v,danger?"#f87171":warn?"#fdba74":"#6ee7b7")}/></div>
              {danger&&<div style={{fontSize:13,color:"#f87171",marginTop:4}}>⚠️ 위험 수준 — 실제 검사에서 부적격 판정 가능성이 높습니다. 관련 문항 응답을 점검하세요.</div>}
              {warn&&<div style={{fontSize:13,color:"#fdba74",marginTop:4}}>주의 — 경계선 수준입니다. 면접에서 관련 질문이 나올 수 있습니다.</div>}
            </div>);
          })}
        </div>}

        {/* 응답 신뢰도 상세 해석 (일관성+솔직성을 풀어서 설명) */}
        <div style={S.card}>
          <div style={S.secTtl}>📊 응답 신뢰도 상세 해석</div>
          <div style={{fontSize:15,lineHeight:1.9,color:"#e2e8f0",marginBottom:14,padding:"12px 16px",background:"rgba(15,23,42,0.5)",borderRadius:10}}>
            응답 신뢰도는 <span style={{fontWeight:700,color:"#a78bfa"}}>일관성(60%) + 솔직성(40%)</span>을 합산하고,
            무성의 응답·극단값 패턴이 감지되면 감점을 반영한 통합 지표입니다.
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:15,fontWeight:700,color:conP>=80?"#6ee7b7":conP>=60?"#fbbf24":conP>=40?"#fb923c":"#f87171",marginBottom:6}}>· 일관성 요소 — {conLv}</div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#cbd5e0",paddingLeft:12}}>{conP>=80?"비슷한 내용의 문항에 일관되게 응답했어요. 아주 좋은 신호입니다.":conP>=60?"대체로 일관적이지만 몇 문항에서 소소한 모순이 있어요. 역문항만 조금 주의하면 쉽게 끌어올릴 수 있어요.":conP>=40?"역문항과 정문항 사이 모순이 꽤 보입니다. '~하지 않는다'류 표현을 반대로 읽었는지 점검하면 빠르게 개선됩니다.":"응답 일관성이 낮아 실제 검사에서 재검사 대상이 될 수 있어요. 다음엔 문항을 한 번 더 천천히 읽어주세요."}</div>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:sdP<=40?"#6ee7b7":sdP<=60?"#fbbf24":"#f87171",marginBottom:6}}>· 솔직성 요소 — {sdLv}</div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#cbd5e0",paddingLeft:12}}>{sdP<=40?"자신의 약점도 솔직하게 인정하는 응답 패턴이에요. 실제 검사에서도 신뢰 받는 방향입니다.":sdP<=60?"대체로 솔직하지만 일부 '너무 완벽한' 응답이 섞여 있어요. 한두 문항만 더 현실적으로 답하면 충분히 통과할 수 있어요.":"과장 응답 경향이 강합니다. 약점을 인정하는 답변 1~2개만 포함해도 이 부분은 바로 개선됩니다."}</div>
          </div>
          {trust.penalty > 0 && <div style={{marginTop:18,padding:"12px 16px",background:"rgba(251,146,60,0.06)",borderRadius:10,border:"1px solid rgba(251,146,60,0.2)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fdba74",marginBottom:6}}>· 응답 패턴 감점 반영</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#cbd5e0"}}>
              응답 패턴 점검 카드에서 언급된 항목으로 인해 신뢰도에서 일부 감점이 반영되었어요.
              위 "응답 패턴 점검" 섹션의 코칭 포인트만 반영하면 신뢰도는 빠르게 회복됩니다.
            </div>
          </div>}
        </div>

        {/* 실전 대비 코칭 가이드 — 진단+코칭 톤 */}
        {(conP<70||sdP>50||hasAnyWarning)&&<div style={{...S.card,border:"1px solid rgba(139,92,246,0.3)",background:"rgba(139,92,246,0.06)"}}>
          <div style={S.secTtl}>📝 실전 통과를 위한 코칭 가이드</div>
          <div style={{fontSize:14,color:"#cbd5e0",lineHeight:1.8,marginBottom:16,padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10}}>
            아래 포인트를 <span style={{fontWeight:700,color:"#c4b5fd"}}>하나씩만 반영</span>해도 실제 검사에서 충분히 통과할 수 있어요. "부족해서"가 아니라 "이 부분만 다듬으면 확실히 통과"하는 관점으로 읽어주세요.
          </div>

          {hasAnyWarning&&<div style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:"#a78bfa",marginBottom:10}}>응답 패턴 개선 포인트</div>
            <div style={{fontSize:14,lineHeight:1.9,color:"#e2e8f0"}}>
              {vc.allSame.detected&&<div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>1. 같은 값만 계속 선택하지 마세요</div>
                각 문항을 실제로 읽고 본인 성향에 맞춰 <span style={{fontWeight:700}}>2~4점 사이에서 자연스럽게 분산</span>하면 충분해요. 연속 10문항만 같아도 주의 대상이지만, 이것만 지키면 쉽게 통과할 수 있어요.
              </div>}
              {vc.lowVariance.detected&&<div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>2. 각 문항에 분명한 의견을 표현하세요</div>
                응답 변동이 매우 적습니다. 모든 문항에 비슷한 점수만 주면 "생각 없이 답했다"로 해석돼요. <span style={{fontWeight:700}}>확실히 동의하는 것엔 4~5점, 아닌 것엔 1~2점</span>을 과감하게 사용하면 프로파일이 선명해집니다.
              </div>}
              {vc.extremeHigh.detected&&<div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>3. 자연스러운 강약 차이를 만드세요</div>
                모든 차원에서 최고점을 받는 것보다 <span style={{fontWeight:700}}>자연스러운 강약 차이</span>가 있는 것이 오히려 좋은 평가를 받습니다. 2~3개 강점(보정 후 75~85)과 2~3개 보통(보정 후 55~65) 영역이 섞인 프로파일이 가장 설득력 있어요.
              </div>}
              {vc.outlier.avgHigh && !vc.extremeHigh.detected && <div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>4. 약점 인정으로 신뢰도를 높이세요</div>
                전체 평균이 다소 높습니다. 덜 자신 있는 영역 1~2개만 솔직하게 응답해도 자연스러운 프로파일이 돼요.
              </div>}
              {vc.outlier.extremeLows.length>0&&<div style={{padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>5. 역문항 읽는 법을 점검해보세요</div>
                {vc.outlier.extremeLows.map(d=>DIM_LABELS[d]||d).join(", ")} 영역이 많이 낮게 나왔어요. 역문항("~하지 않는다"류)을 반대로 읽지 않았는지 확인하면 금방 개선됩니다.
              </div>}
            </div>
          </div>}

          {conP<70&&<div style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:"#a78bfa",marginBottom:10}}>일관성 개선 방법</div>
            <div style={{fontSize:14,lineHeight:1.9,color:"#e2e8f0"}}>
              <div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>1. 역문항을 구분하세요</div>
                "~하지 않는다", "~가 어렵다" 같은 부정적 표현이 들어간 문항이 역문항이에요. "계획을 세우고 실행한다"에 4점이면 "충동적으로 결정한다"에는 2점을 주는 식으로 맞추면 일관성이 올라갑니다.
              </div>
              <div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>2. 역문항 예시</div>
                <div>✓ "일을 미루는 경향이 있다" → 성실성의 <span style={{color:"#fb923c"}}>역문항</span></div>
                <div>✓ "걱정이 많은 편이다" → 정서안정성의 <span style={{color:"#fb923c"}}>역문항</span></div>
                <div>✓ "쉽게 산만해지는 편이다" → 집중력의 <span style={{color:"#fb923c"}}>역문항</span></div>
              </div>
            </div>
          </div>}
          {sdP>50&&<div>
            <div style={{fontSize:16,fontWeight:700,color:"#a78bfa",marginBottom:10}}>솔직성 개선 방법</div>
            <div style={{fontSize:14,lineHeight:1.9,color:"#e2e8f0"}}>
              <div style={{marginBottom:12,padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>이런 문항은 함정이에요</div>
                <div>❌ "한 번도 거짓말을 한 적이 없다" → <span style={{color:"#fdba74"}}>"매우 그렇다"로 답하면 과장으로 감점</span></div>
                <div>❌ "화가 난 적이 단 한 번도 없다" → <span style={{color:"#fdba74"}}>비현실적 응답으로 분류</span></div>
              </div>
              <div style={{padding:"12px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10}}>
                <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:6}}>적당한 약점 인정이 오히려 점수를 올려요</div>
                약점 1~2개를 솔직하게 인정하는 응답을 넣으면 신뢰도가 크게 올라갑니다. "이 부분은 개선 중이에요" 정도의 뉘앙스로 답하면 충분히 통과할 수 있어요.
              </div>
            </div>
          </div>}
        </div>}

        {/* 기업 인재상 */}
        {companyData&&<div style={S.card}>
          <div style={S.secTtl}>🏢 {companyData.companyName} 인재상 분석</div>
          <div style={{fontSize:13,color:"#cbd5e0",marginBottom:14,padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10,border:"1px solid rgba(139,92,246,0.15)",lineHeight:1.7}}>💡 아래 내용은 <span style={{color:"#a78bfa",fontWeight:700}}>딥둥이 AI가 공개 정보를 기반으로 추론한 인재상</span>입니다. 실제 기업의 내부 채용 기준과 다를 수 있습니다.</div>
          <div style={{marginBottom:12}}>{(companyData.coreValues||"").split(",").map((v,i)=><span key={i} style={S.tag}>{v.trim()}</span>)}</div>
          <p style={{fontSize:14,lineHeight:1.8,color:"#e2e8f0"}}>{companyData.talentProfile}</p>
        </div>}

        {/* AI 적합도 + 면접 질문 */}
        {aiResults&&<>
          <div style={S.card}>
            <div style={S.secTtl}>📈 적합도</div>
            <div style={{fontSize:13,color:"#cbd5e0",marginBottom:14,padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10,border:"1px solid rgba(139,92,246,0.15)",lineHeight:1.7}}>💡 딥둥이 AI가 추론한 인재상과 비교한 <span style={{color:"#a78bfa",fontWeight:700}}>참고용 적합도</span>입니다.</div>
            <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:52,fontWeight:900,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{adjustCompanyScore(aiResults.matchScore)}%</div></div>
            <p style={{fontSize:15,lineHeight:1.8,color:"#e2e8f0"}}>{aiResults.matchAnalysis}</p>
            {aiResults.strengths&&<div style={{marginTop:16}}><div style={{fontSize:15,fontWeight:700,color:"#6ee7b7",marginBottom:8}}>강점</div>{aiResults.strengths.map((s,i)=><div key={i} style={{fontSize:14,color:"#e2e8f0",marginBottom:5,paddingLeft:14}}>• {s}</div>)}</div>}
            {aiResults.improvements&&<div style={{marginTop:14}}><div style={{fontSize:15,fontWeight:700,color:"#fdba74",marginBottom:8}}>보완점</div>{aiResults.improvements.map((s,i)=><div key={i} style={{fontSize:14,color:"#e2e8f0",marginBottom:5,paddingLeft:14}}>• {s}</div>)}</div>}
            {aiResults.overallAdvice&&<div style={{marginTop:16,padding:"14px 16px",background:"rgba(99,102,241,0.08)",borderRadius:12,border:"1px solid rgba(99,102,241,0.2)"}}><div style={{fontSize:14,fontWeight:700,color:"#a78bfa",marginBottom:6}}>종합 조언</div><div style={{fontSize:14,lineHeight:1.8,color:"#e2e8f0"}}>{aiResults.overallAdvice}</div></div>}
          </div>
          {aiResults.interviewQuestions&&<div style={S.card}>
            <div style={S.secTtl}>🎤 AI 맞춤 면접 예상 질문 ({aiResults.interviewQuestions.length}개)</div>
            {aiResults.interviewQuestions.map((item,i)=>(<div key={i} style={{...S.iq,marginBottom:14}}><div style={{marginBottom:8}}><span style={{color:"#7c3aed",fontWeight:700,marginRight:8}}>Q{i+1}.</span><span style={{color:"#f1f5f9",fontWeight:600}}>{item.question}</span></div>{item.intent&&<div style={{fontSize:13,color:"#94a3b8",marginBottom:4,paddingLeft:30}}><span style={{color:"#cbd5e0",fontWeight:600}}>출제 의도:</span> {item.intent}</div>}{item.tip&&<div style={{fontSize:13,color:"#94a3b8",paddingLeft:30}}><span style={{color:"#6ee7b7",fontWeight:600}}>답변 팁:</span> {item.tip}</div>}</div>))}
          </div>}
        </>}

        {aiError&&<div style={{...S.card,borderColor:"rgba(248,113,113,0.3)"}}><div style={{color:"#f87171",fontSize:15,fontWeight:600}}>AI 분석 오류: {aiError}</div><div style={{color:"#cbd5e0",fontSize:14,marginTop:8}}>기본 결과와 TIP은 위에서 확인하세요.</div></div>}

        <div style={{textAlign:"center",padding:20}}>
          <img src="/deepdungi.png" alt="딥둥이" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",marginBottom:10}}/>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.8}}>본 검사는 모의 인성검사입니다.<br/><span style={{color:"#94a3b8",fontWeight:600}}>Powered by 457deep · 딥둥이</span></div>
        </div>
        <button style={{...S.btn(true),width:"100%",padding:"16px",fontSize:16,marginBottom:32}} onClick={()=>{setStage("intro");setMode(null);setPage(1);setAnswers({});setCompanyData(null);setCompanyName("");setAiResults(null);setBasicResults(null);setStartTime(null);setEndTime(null);}}>처음부터 다시하기</button>
      </div></div>
    );
  }

  // ═══ TEST ═══
  return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(12,18,34,0.97)",backdropFilter:"blur(10px)",padding:"12px 0 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <img src="/deepdungi.png" alt="" style={{width:30,height:30,borderRadius:"50%",objectFit:"cover"}}/>
          <span style={{fontSize:13,fontWeight:700,color:"#cbd5e0"}}>딥둥이 {mode==="public"?"공공기관":"사기업"} 인성검사</span>
          {companyName&&<span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto"}}>{companyName}</span>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <span style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>{total}/{TOTAL_Q}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>{pct}%</span>
        </div>
        <div style={S.progBg}><div style={S.progFill(pct)}/></div>
      </div>
      <div style={{textAlign:"center",fontSize:14,color:"#94a3b8",marginBottom:14,fontWeight:600}}>페이지 {page} / {TOTAL_PAGES}</div>
      {curQs.map((q,idx)=>{
        const gi=(page-1)*PER_PAGE+idx+1;
        return(<div key={q.id} style={{...S.card,padding:20}}>
          <div style={S.qNum}>Q{gi}</div>
          <div style={S.qTxt}>{q.text}</div>
          <div style={S.scRow}>{[1,2,3,4,5].map(v=><button key={v} style={S.scBtn(answers[q.id]===v)} onClick={()=>setAnswers(p=>({...p,[q.id]:v}))}>{v}</button>)}</div>
          <div style={S.scLbl}><span>전혀 아니다</span><span>매우 그렇다</span></div>
        </div>);
      })}
      <div style={S.nav}>
        {page>1&&<button style={S.btn(false)} onClick={()=>setPage(page-1)}>← 이전</button>}
        <button style={allAnswered?S.btn(true):S.btnOff} onClick={allAnswered?()=>{if(page===TOTAL_PAGES){handleTestComplete();}else setPage(page+1);}:undefined} disabled={!allAnswered}>
          {page===TOTAL_PAGES?"결과 분석 →":"다음 →"}
        </button>
      </div>
      <div style={{height:32}}/>
    </div></div>
  );
}
