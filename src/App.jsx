import { useState, useMemo, useEffect, useRef } from "react";
import { selectQuestions, DIM_LABELS, DIMS_ORDER } from "./questions.js";
import { computeResults as computeResultsLib, adjustCompanyScore, getGrade } from "./scoring.js";
import ResultView from "./ResultView.jsx";
import IntroScreen from "./IntroScreen.jsx";

const PER_PAGE=10;
// URL에 ?dev=true 가 있을 때만 활성화되는 개발자 테스트 모드
const DEV_MODE = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "true";

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

function Spinner({text}){return(<div style={{textAlign:"center",padding:40}}><div style={{width:44,height:44,border:"3px solid rgba(96,165,250,0.2)",borderTop:"3px solid #60a5fa",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><div style={{color:"#e2e8f0",fontSize:16,fontWeight:600,whiteSpace:"pre-line",lineHeight:1.6}}>{text}</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);}

function DeepHeader({subtitle}){return(<div style={{textAlign:"center",marginBottom:24}}><img src="/deepdungi.png" alt="딥둥이" style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",marginBottom:12,border:"3px solid rgba(96,165,250,0.3)"}}/><div style={{fontSize:12,letterSpacing:6,color:"#94a3b8",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>457deep</div><h1 style={{fontSize:26,fontWeight:900,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.3,marginBottom:8}}>딥둥이 모의 인성검사</h1>{subtitle&&<p style={{color:"#cbd5e0",fontSize:14,lineHeight:1.6,whiteSpace:"pre-line"}}>{subtitle}</p>}</div>);}

const COMPANY_INPUT_CSS = `
.cinput-page {
  --accent: #818cf8;
  --accent-soft: rgba(129,140,248,0.12);
  --accent-glow: rgba(129,140,248,0.3);
  --bg: #0a0c10;
  --border: rgba(255,255,255,0.07);
  --border-strong: rgba(255,255,255,0.14);
  --text: #e5e7eb;
  --text-muted: #8b92a0;
  --text-dim: #5c6370;
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif;
  letter-spacing: -0.01em;
  overflow-x: hidden;
}
.cinput-page, .cinput-page * { box-sizing: border-box; }
.cinput-haze {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, var(--accent-soft), transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(129,140,248,0.06), transparent 60%);
}
.cinput-content {
  position: relative; z-index: 1; min-height: 100vh;
  display: flex; flex-direction: column; align-items: center;
  padding: 48px 24px;
}
.cinput-topbar {
  width: 100%; max-width: 820px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
}
.cinput-brand { color: var(--text-muted); display: inline-flex; align-items: center; }
.cinput-brand-dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); margin-right: 8px; box-shadow: 0 0 8px var(--accent-glow);
}
.cinput-version { color: var(--text-dim); }
.cinput-hero {
  margin-top: 56px; text-align: center; max-width: 560px;
}
.cinput-hero-badge {
  position: relative; width: 96px; height: 96px;
  margin: 0 auto 20px;
  border: 1px solid var(--border-strong); border-radius: 16px;
  background: radial-gradient(circle at 50% 40%, var(--accent-soft), transparent 70%);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.cinput-hero-badge img {
  width: 70px; height: 70px; object-fit: contain;
  border-radius: 50%; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4));
}
.cinput-hero-title {
  font-size: 28px; font-weight: 700; letter-spacing: -0.025em;
  margin: 0 0 12px; line-height: 1.2; color: var(--text);
}
.cinput-hero-title em {
  font-style: normal; color: var(--accent);
  text-shadow: 0 0 24px var(--accent-glow);
}
.cinput-hero-meta {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase;
}
.cinput-hero-meta .sep { color: var(--text-dim); margin: 0 8px; }
.cinput-card {
  width: 100%; max-width: 560px; margin-top: 36px;
  background:
    radial-gradient(circle at 50% 0%, var(--accent-soft) 0%, transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid var(--border-strong); border-radius: 16px;
  padding: 36px 36px 32px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px rgba(0,0,0,0.4);
  position: relative;
}
.cinput-corner {
  position: absolute; width: 14px; height: 14px;
  border-color: var(--accent); border-style: solid; opacity: 0.5;
}
.cinput-corner.tl { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
.cinput-corner.tr { top: 10px; right: 10px; border-width: 1px 1px 0 0; }
.cinput-corner.bl { bottom: 10px; left: 10px; border-width: 0 0 1px 1px; }
.cinput-corner.br { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }
.cinput-field-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 12px; padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.cinput-field-label {
  font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: -0.01em;
}
.cinput-field-tag {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--text-dim); letter-spacing: 0.15em; text-transform: uppercase;
}
.cinput-input-wrap { position: relative; margin-bottom: 22px; }
.cinput-input {
  width: 100%; padding: 16px 18px 16px 44px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-strong); border-radius: 10px;
  color: var(--text); font-family: inherit; font-size: 14px;
  letter-spacing: -0.01em; transition: all 0.15s ease; outline: none;
}
.cinput-input::placeholder { color: var(--text-dim); font-size: 13px; }
.cinput-input:focus {
  border-color: var(--accent); background: rgba(129,140,248,0.04);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.cinput-input-wrap[data-error="1"] .cinput-input {
  border-color: rgba(248,113,113,0.5);
}
.cinput-input-prefix {
  position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
  font-family: 'JetBrains Mono', monospace; font-size: 13px;
  color: var(--accent); pointer-events: none; opacity: 0.7;
}
.cinput-hint {
  font-size: 11.5px; color: var(--text-muted);
  margin: -14px 0 22px; padding-left: 4px; line-height: 1.5;
}
.cinput-hint code {
  font-family: 'JetBrains Mono', monospace; color: var(--accent);
  background: var(--accent-soft); padding: 1px 6px; border-radius: 3px; font-size: 11px;
}
.cinput-hint .arr { color: var(--text-dim); margin: 0 4px; }
.cinput-cta {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; width: 100%; padding: 16px 28px;
  background: var(--accent-soft); border: 1px solid var(--accent);
  color: var(--text); font-family: inherit; font-size: 14px; font-weight: 600;
  letter-spacing: 0.02em; border-radius: 10px; cursor: pointer;
  transition: all 0.15s ease; box-shadow: 0 0 24px rgba(129,140,248,0.15);
}
.cinput-cta:hover:not(:disabled) {
  background: var(--accent); color: var(--bg);
  box-shadow: 0 0 32px rgba(129,140,248,0.4);
}
.cinput-cta:disabled { opacity: 0.55; cursor: not-allowed; }
.cinput-arrow {
  font-family: 'JetBrains Mono', monospace; font-weight: 400;
  transition: transform 0.15s ease;
}
.cinput-cta:hover:not(:disabled) .cinput-arrow { transform: translateX(3px); }
.cinput-skip-note {
  margin-top: 16px; text-align: center;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--text-dim); letter-spacing: 0.12em; text-transform: uppercase;
}
.cinput-confirm {
  margin-bottom: 14px; padding: 14px 16px;
  background: rgba(129,140,248,0.08);
  border: 1px solid rgba(129,140,248,0.3);
  border-radius: 10px;
}
.cinput-confirm-text {
  font-size: 13px; color: #cbd5e0; line-height: 1.7; margin-bottom: 12px;
}
.cinput-confirm-text strong { color: var(--accent); font-weight: 700; }
.cinput-confirm-actions { display: flex; gap: 8px; }
.cinput-confirm-yes {
  flex: 1; padding: 11px;
  background: var(--accent-soft); border: 1px solid var(--accent);
  color: var(--text); font-family: inherit; font-size: 13px; font-weight: 600;
  border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}
.cinput-confirm-yes:hover { background: var(--accent); color: var(--bg); }
.cinput-confirm-no {
  padding: 11px 18px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--border-strong);
  color: var(--text-muted); font-family: inherit; font-size: 13px; font-weight: 600;
  border-radius: 8px; cursor: pointer;
}
.cinput-error {
  margin-bottom: 14px; padding: 14px 16px;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: 10px;
}
.cinput-error-text {
  font-size: 12.5px; color: #fca5a5; line-height: 1.7; margin-bottom: 12px;
}
.cinput-error-btn {
  width: 100%; padding: 10px 14px;
  font-size: 12.5px; font-weight: 600;
  border: 1px solid rgba(248,113,113,0.5);
  border-radius: 8px;
  background: rgba(15,23,42,0.4);
  color: #fca5a5; cursor: pointer; font-family: inherit;
}
.cinput-error-note {
  font-size: 10.5px; color: #fca5a5; opacity: 0.7;
  line-height: 1.6; margin-top: 8px; text-align: center;
}
@media (max-width: 640px) {
  .cinput-content { padding: 24px 16px; }
  .cinput-card { padding: 28px 22px 24px; margin-top: 24px; }
  .cinput-hero { margin-top: 32px; }
  .cinput-hero-title { font-size: 24px; }
}
`;

export default function App(){
  const[stage,setStage]=useState("intro");
  const[companyName,setCompanyName]=useState("");
  const[companyData,setCompanyData]=useState(null);
  const[page,setPage]=useState(1);
  const[answers,setAnswers]=useState({});
  const[startTime,setStartTime]=useState(null);
  const[endTime,setEndTime]=useState(null);
  const[aiResults,setAiResults]=useState(null);
  const[aiError,setAiError]=useState("");
  const[basicResults,setBasicResults]=useState(null);
  const[testSet,setTestSet]=useState(null); // {questions, ccPairs, ifIds, revPairs, seed}
  const[companyValidation,setCompanyValidation]=useState(null); // null | {state:"validating"} | {state:"confirm", correctedName, message} | {state:"error", message}
  const[skipCompanyAI,setSkipCompanyAI]=useState(false); // 사용자가 미검증 기업명으로 그대로 진행한 경우 AI 기업 분석 생략

  const questions = testSet?.questions || [];
  const TOTAL_Q=questions.length;
  const TOTAL_PAGES=Math.max(1, Math.ceil(TOTAL_Q/PER_PAGE));

  // 매 검사 세션 시작마다 새 시드로 문항 선정
  function startNewSession() {
    const seed = Math.floor(Math.random() * 2147483647);
    const set = selectQuestions(seed);
    setTestSet({ ...set, seed });
    setPage(1);
    setAnswers({});
    setStartTime(Date.now());
    setStage("test");
  }

  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[page,stage]);

  const curQs=useMemo(()=>{
    if(stage!=="test")return[];
    return questions.slice((page-1)*PER_PAGE,page*PER_PAGE);
  },[page,stage,questions]);

  const allAnswered=useMemo(()=>curQs.every(q=>answers[q.id]!==undefined),[answers,curQs]);
  const total=Object.keys(answers).length;
  const pct=Math.round(total/TOTAL_Q*100);

  function computeResults(){
    return computeResultsLib({
      questions,
      answers,
      ccPairs: testSet?.ccPairs || [],
      revPairs: testSet?.revPairs || [],
      ifIds: testSet?.ifIds || [],
    });
  }

  async function analyzeCompanyInBackground(nameArg){
    const name=(nameArg??companyName).trim();
    if(!name)return;
    try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"analyze_company",companyName:name})});if(res.ok){const data=await res.json();if(!data.error&&!data.parseError)setCompanyData(data);}}catch(e){}
  }

  // ═══ 기업명 검증 + 검사 시작 ═══
  function proceedToTest(finalName){
    setCompanyValidation(null);
    setSkipCompanyAI(false);
    if(finalName){ setCompanyName(finalName); analyzeCompanyInBackground(finalName); }
    setStage("pre_tip");
  }

  // 미검증 기업명으로 그대로 진행 — AI 기업 분석/적합도는 생략
  function proceedAsIs(){
    setCompanyValidation(null);
    setSkipCompanyAI(true);
    // companyName은 사용자가 입력한 그대로 유지. analyze_company 호출 생략(companyData=null).
    setStage("pre_tip");
  }

  async function validateCompanyAndStart(){
    const input=companyName.trim();
    if(!input){ setCompanyValidation(null); setStage("pre_tip"); return; }
    setCompanyValidation({state:"validating"});
    try{
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"validate_company",companyName:input})});
      if(!res.ok)throw new Error(`검증 서버 오류 (${res.status})`);
      const data=await res.json();
      if(data.error||data.parseError)throw new Error(data.error||"검증 결과 파싱 실패");
      if(!data.valid){
        setCompanyValidation({state:"error",message:data.message||"기업명을 찾을 수 없습니다. 정확한 기업명을 입력해주세요."});
        return;
      }
      const corrected=(data.correctedName||"").trim();
      if(corrected&&corrected!==input){
        setCompanyValidation({state:"confirm",correctedName:corrected,message:data.message||`'${corrected}'를 말씀하시나요?`});
        return;
      }
      proceedToTest(input);
    }catch(e){
      setCompanyValidation({state:"error",message:`검증 중 오류가 발생했어요. 다시 시도해주세요. (${e.message})`});
    }
  }

  function acceptCorrection(){
    if(companyValidation?.state!=="confirm")return;
    proceedToTest(companyValidation.correctedName);
  }
  function rejectCorrection(){ setCompanyValidation(null); }

  async function generateAiResults(basic){
    setStage("test_loading");setAiError("");
    // skipCompanyAI=true인 경우 AI에 기업 맥락 전달 안 함 → 일반 분석 + 면접 질문만 생성
    const aiCompanyName = skipCompanyAI ? "일반" : (companyData?.companyName || companyName || "일반");
    const aiCompanyProfile = skipCompanyAI ? null : (companyData?.bigFiveProfile || null);
    try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"generate_results",testResults:{companyName:aiCompanyName,companyProfile:aiCompanyProfile,scores:basic.scores,adjustedScores:basic.adjustedScores,personalityType:basic.personalityType.name,consistencyScore:basic.consistencyPct,honestyScore:100-basic.sdPct,stabilityScore:basic.stabilityScore?.display,authenticityScore:basic.authenticityScore?.display,validityChecks:basic.validityChecks}})});
      if(!res.ok){setAiError(`서버 오류 (${res.status})`);setStage("result");return;}
      const data=await res.json();if(data.error||data.parseError){setAiError(data.error||"AI 결과 생성 실패");setStage("result");return;}
      setAiResults(data);setStage("result");
    }catch(e){setAiError("결과 생성 오류: "+e.message);setStage("result");}
  }

  function handleTestComplete(){setEndTime(Date.now());const basic=computeResults();setBasicResults(basic);generateAiResults(basic);}

  // ═══ DEV MODE: 자동 채우기 + 결과로 이동 ═══
  function devAutoFill(fillFn){
    if(!testSet) return;
    const filled={};
    testSet.questions.forEach(q=>{ filled[q.id]=fillFn(q); });
    setAnswers(filled);
    setEndTime(Date.now());
    const basic=computeResultsLib({
      questions:testSet.questions,
      answers:filled,
      ccPairs:testSet.ccPairs||[],
      revPairs:testSet.revPairs||[],
      ifIds:testSet.ifIds||[],
    });
    setBasicResults(basic);
    generateAiResults(basic);
  }

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
  if(stage==="intro") return <IntroScreen onStart={()=>setStage("company_input")} />;

  // ═══ COMPANY INPUT ═══
  if(stage==="company_input") {
    const vs=companyValidation?.state;
    const isValidating=vs==="validating";
    const isConfirm=vs==="confirm";
    const isError=vs==="error";
    return(
      <div className="cinput-page">
        <style>{COMPANY_INPUT_CSS}</style>
        <div className="cinput-haze" />
        <div className="cinput-content">
          <div className="cinput-topbar">
            <div className="cinput-brand"><span className="cinput-brand-dot" />457DEEP · 딥둥이</div>
            <div className="cinput-version">v 2.1.0</div>
          </div>

          <div className="cinput-hero">
            <div className="cinput-hero-badge">
              <img src="/deepdungi.png" alt="딥둥이" />
            </div>
            <h1 className="cinput-hero-title">딥둥이 <em>모의 인성검사</em></h1>
            <div className="cinput-hero-meta">
              사기업 인성검사<span className="sep">·</span>200문항<span className="sep">·</span>약 25분
            </div>
          </div>

          <div className="cinput-card">
            <span className="cinput-corner tl" />
            <span className="cinput-corner tr" />
            <span className="cinput-corner bl" />
            <span className="cinput-corner br" />

            <div className="cinput-field-head">
              <div className="cinput-field-label">지원 기업</div>
              <div className="cinput-field-tag">OPTIONAL</div>
            </div>

            <div className="cinput-input-wrap" data-error={isError ? "1" : "0"}>
              <span className="cinput-input-prefix">›</span>
              <input
                className="cinput-input"
                type="text"
                placeholder="정확한 기업명을 입력해 주세요"
                autoComplete="off"
                value={companyName}
                disabled={isValidating||isConfirm}
                onChange={e=>{setCompanyName(e.target.value);if(companyValidation)setCompanyValidation(null);}}
                onKeyDown={e=>{if(e.key==="Enter"&&!isValidating&&!isConfirm)validateCompanyAndStart();}}
              />
            </div>

            <div className="cinput-hint">
              약어 대신 정식 명칭을 입력하면 더 정확해요. <code>현차</code><span className="arr">→</span><code>현대자동차</code>
            </div>

            {isConfirm && (
              <div className="cinput-confirm">
                <div className="cinput-confirm-text">
                  혹시 <strong>"{companyValidation.correctedName}"</strong>을(를) 말씀하시나요?
                  {companyValidation.message&&companyValidation.message!==`'${companyValidation.correctedName}'를 말씀하시나요?`&&<div style={{fontSize:12,color:"#8b92a0",marginTop:4}}>{companyValidation.message}</div>}
                </div>
                <div className="cinput-confirm-actions">
                  <button className="cinput-confirm-yes" onClick={acceptCorrection}>네, 맞아요</button>
                  <button className="cinput-confirm-no" onClick={rejectCorrection}>다시 입력</button>
                </div>
              </div>
            )}

            {isError && (
              <div className="cinput-error">
                <div className="cinput-error-text">⚠️ {companyValidation.message}</div>
                <button className="cinput-error-btn" onClick={proceedAsIs}>그래도 이 이름으로 검사 진행하기 →</button>
                <div className="cinput-error-note">기업 맞춤 분석 없이 기본 결과만 표시됩니다</div>
              </div>
            )}

            <button className="cinput-cta" disabled={isValidating||isConfirm} onClick={validateCompanyAndStart}>
              {isValidating ? "기업명 확인 중..." : <>검사 시작하기 <span className="cinput-arrow">→</span></>}
            </button>

            <div className="cinput-skip-note">입력하지 않아도 검사는 진행돼요</div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ PRE-TIP (검사 전 팁) ═══
  if(stage==="pre_tip") {
    const tips=[
      {emoji:"🎯",title:"정답은 없어요",body:"인성검사는 좋은 성격/나쁜 성격을 가리는 게 아니에요. \"이 사람이 어떤 사람인가\"를 보는 거예요. 솔직하게 답할수록 좋은 결과가 나와요."},
      {emoji:"🙅",title:"너무 완벽한 답변은 오히려 불리해요",body:"인성검사는 성인군자를 채용하는 게 아닙니다. 적당한 약점 인정이 오히려 신뢰도를 높여줍니다."},
      {emoji:"🔁",title:"비슷한 질문이 여러 번 나와요",body:"일부러 그렇게 설계되어 있어요. 앞에서 한 답과 뒤에서 한 답이 모순되면 신뢰도 점수가 떨어져요. 문항을 끝까지 읽고 답하세요."},
      {emoji:"↔️",title:"\"~하지 않는다\" 문항을 주의하세요",body:"\"일을 미루는 경향이 있다\"처럼 부정적 표현 문항이 섞여 있어요. 이런 문항은 점수가 반대로 계산돼요. 빠르게 풀되, 문장 끝까지 읽으세요."},
      {emoji:"⏱️",title:"시간은 충분해요, 하지만 너무 오래 고민하지 마세요",body:"직감적으로 1~2초 안에 답하는 게 가장 정확해요. 고민이 길어지면 오히려 솔직한 답에서 멀어져요."},
    ];
    return(
      <div style={S.wrap}><div style={S.box}>
        <div style={{height:24}}/>
        <DeepHeader subtitle={"검사 전 꼭 읽어주세요"}/>
        <div style={{...S.card,background:"rgba(99,102,241,0.06)",border:"1px solid rgba(139,92,246,0.3)",padding:"16px 18px",marginBottom:14}}>
          <div style={{fontSize:14,lineHeight:1.7,color:"#cbd5e0"}}>
            검사 시작 전에 <span style={{color:"#c4b5fd",fontWeight:700}}>5가지 핵심 팁</span>을 확인해 주세요. 이 팁만 알아도 실제 인성검사에서 통과 가능성이 크게 올라갑니다.
          </div>
        </div>
        {tips.map((t,i)=>(
          <div key={i} style={{...S.card,padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:24}}>{t.emoji}</span>
              <span style={{fontSize:11,fontWeight:900,color:"#a78bfa",background:"rgba(139,92,246,0.15)",padding:"2px 8px",borderRadius:6,letterSpacing:1}}>TIP {i+1}</span>
            </div>
            <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9",marginBottom:8,lineHeight:1.5}}>{t.title}</div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#cbd5e0"}}>{t.body}</div>
          </div>
        ))}
        <button style={{...S.btn(true),display:"block",width:"100%",padding:"18px",fontSize:18,fontWeight:800,marginTop:8,boxShadow:"0 6px 24px rgba(99,102,241,0.3)"}} onClick={()=>startNewSession()}>
          확인했어요, 검사 시작 →
        </button>
        <button style={{display:"block",width:"100%",marginTop:10,padding:"12px",background:"transparent",border:"none",color:"#94a3b8",fontSize:13,cursor:"pointer"}} onClick={()=>setStage("company_input")}>← 기업명 다시 입력</button>
        <div style={{height:32}}/>
      </div></div>
    );
  }

  if(stage==="test_loading") return(<div style={S.wrap}><div style={S.box}><div style={{height:60}}/><DeepHeader/><Spinner text={"딥둥이가 맞춤 결과 리포트를 만들고 있어요\n최대 2-3분까지 소요될 수 있어요"}/></div></div>);

  // ═══ RESULT ═══
  if(stage==="result"&&basicResults){
    const mins = endTime && startTime ? Math.round((endTime-startTime)/60000) : "–";
    return (
      <ResultView
        basicResults={basicResults}
        aiResults={aiResults}
        aiError={aiError}
        companyData={companyData}
        companyName={companyName}
        mins={mins}
        total={total}
        totalQ={TOTAL_Q}
        skipCompanyAI={skipCompanyAI}
        onRetry={()=>{setStage("company_input");setPage(1);setAnswers({});setAiResults(null);setAiError("");setBasicResults(null);setStartTime(null);setEndTime(null);setTestSet(null);setCompanyValidation(null);setSkipCompanyAI(false);}}
        onAiRetry={()=>{if(basicResults)generateAiResults(basicResults);}}
      />
    );
  }

  // ═══ TEST ═══
  return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(12,18,34,0.97)",backdropFilter:"blur(10px)",padding:"12px 0 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <img src="/deepdungi.png" alt="" style={{width:30,height:30,borderRadius:"50%",objectFit:"cover"}}/>
          <span style={{fontSize:13,fontWeight:700,color:"#cbd5e0"}}>딥둥이 사기업 인성검사</span>
          {companyName&&<span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto"}}>{companyName}</span>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <span style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>{total}/{TOTAL_Q}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>{pct}%</span>
        </div>
        <div style={S.progBg}><div style={S.progFill(pct)}/></div>
      </div>
      {DEV_MODE && <div style={{margin:"12px 0",padding:"12px 14px",background:"rgba(250,204,21,0.08)",border:"1px dashed rgba(250,204,21,0.45)",borderRadius:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:900,letterSpacing:1.5,color:"#fde047",background:"rgba(250,204,21,0.15)",padding:"3px 8px",borderRadius:6}}>🛠 DEV MODE</span>
          <span style={{fontSize:12,color:"#cbd5e0"}}>200문항 스킵 · 바로 결과로 이동</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:6}}>
          <button style={{padding:"10px 12px",border:"1px solid rgba(250,204,21,0.4)",borderRadius:8,background:"rgba(15,23,42,0.5)",color:"#fde047",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>devAutoFill(()=>4)}>전부 4로 자동 채우기</button>
          <button style={{padding:"10px 12px",border:"1px solid rgba(250,204,21,0.4)",borderRadius:8,background:"rgba(15,23,42,0.5)",color:"#fde047",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>devAutoFill(()=>Math.floor(Math.random()*5)+1)}>랜덤 자동 채우기</button>
          <button style={{padding:"10px 12px",border:"1px solid rgba(250,204,21,0.4)",borderRadius:8,background:"rgba(15,23,42,0.5)",color:"#fde047",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>devAutoFill(()=>5)}>극단 테스트 (전부 5)</button>
          <button style={{padding:"10px 12px",border:"1px solid rgba(250,204,21,0.4)",borderRadius:8,background:"rgba(15,23,42,0.5)",color:"#fde047",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>devAutoFill(()=>3)}>무성의 테스트 (전부 3)</button>
        </div>
      </div>}
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
