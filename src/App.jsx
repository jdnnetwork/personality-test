import { useState, useMemo, useEffect, useRef } from "react";
import { selectQuestions, DIM_LABELS, DIMS_ORDER } from "./questions.js";
import { computeResults as computeResultsLib, adjustCompanyScore, getGrade } from "./scoring.js";

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

function Spinner({text}){return(<div style={{textAlign:"center",padding:40}}><div style={{width:44,height:44,border:"3px solid rgba(96,165,250,0.2)",borderTop:"3px solid #60a5fa",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><div style={{color:"#e2e8f0",fontSize:16,fontWeight:600}}>{text}</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);}

function DeepHeader({subtitle}){return(<div style={{textAlign:"center",marginBottom:24}}><img src="/deepdungi.png" alt="딥둥이" style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",marginBottom:12,border:"3px solid rgba(96,165,250,0.3)"}}/><div style={{fontSize:12,letterSpacing:6,color:"#94a3b8",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>457deep</div><h1 style={{fontSize:26,fontWeight:900,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.3,marginBottom:8}}>딥둥이 모의 인성검사</h1>{subtitle&&<p style={{color:"#cbd5e0",fontSize:14,lineHeight:1.6,whiteSpace:"pre-line"}}>{subtitle}</p>}</div>);}

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
    if(finalName){ setCompanyName(finalName); analyzeCompanyInBackground(finalName); }
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
    try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"generate_results",testResults:{companyName:companyData?.companyName||companyName||"일반",companyProfile:companyData?.bigFiveProfile||null,scores:basic.scores,adjustedScores:basic.adjustedScores,personalityType:basic.personalityType.name,consistencyScore:basic.consistencyPct,honestyScore:100-basic.sdPct,stabilityScore:basic.stabilityScore?.display,authenticityScore:basic.authenticityScore?.display,validityChecks:basic.validityChecks}})});
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
  if(stage==="intro") return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{height:80}}/>
      <DeepHeader subtitle={"200문항 · AI 맞춤 분석 · 약 25분"}/>
      <div style={{height:32}}/>
      <button style={{...S.btn(true),display:"block",width:"100%",padding:"18px",fontSize:18,fontWeight:800,boxShadow:"0 6px 24px rgba(99,102,241,0.3)"}} onClick={()=>setStage("company_input")}>
        검사 시작하기
      </button>
      <div style={{textAlign:"center",marginTop:24,fontSize:12,color:"#64748b"}}>Powered by 457deep · 딥둥이</div>
      <div style={{height:32}}/>
    </div></div>
  );

  // ═══ COMPANY INPUT ═══
  if(stage==="company_input") {
    const vs=companyValidation?.state;
    const isValidating=vs==="validating";
    const isConfirm=vs==="confirm";
    const isError=vs==="error";
    return(
    <div style={S.wrap}><div style={S.box}>
      <div style={{height:32}}/>
      <DeepHeader subtitle={"사기업 인성검사 · 200문항 · 약 25분"}/>
      <div style={S.card}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:14,color:"#f1f5f9"}}>지원 기업 (선택)</div>
        <div style={{marginBottom:16}}>
          <input style={{...S.input,borderColor:isError?"rgba(248,113,113,0.5)":S.input.borderColor}} placeholder="기업명 입력 (예: 삼성전자)" value={companyName} disabled={isValidating||isConfirm} onChange={e=>{setCompanyName(e.target.value);if(companyValidation)setCompanyValidation(null);}} onKeyDown={e=>{if(e.key==="Enter"&&!isValidating&&!isConfirm)validateCompanyAndStart();}}/>
        </div>
        {isConfirm&&<div style={{marginBottom:14,padding:"14px 16px",background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.3)",borderRadius:12}}>
          <div style={{fontSize:14,color:"#cbd5e0",lineHeight:1.7,marginBottom:12}}>
            혹시 <span style={{fontWeight:800,color:"#93c5fd"}}>"{companyValidation.correctedName}"</span>을(를) 말씀하시나요?
            {companyValidation.message&&companyValidation.message!==`'${companyValidation.correctedName}'를 말씀하시나요?`&&<div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>{companyValidation.message}</div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(true),flex:1,padding:"12px"}} onClick={acceptCorrection}>네, 맞아요</button>
            <button style={{padding:"12px 20px",border:"1px solid rgba(71,85,105,0.5)",borderRadius:12,background:"rgba(15,23,42,0.5)",color:"#cbd5e0",fontSize:15,fontWeight:700,cursor:"pointer"}} onClick={rejectCorrection}>다시 입력</button>
          </div>
        </div>}
        {isError&&<div style={{marginBottom:14,padding:"12px 16px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:10}}>
          <div style={{fontSize:13,color:"#fca5a5",lineHeight:1.7}}>⚠️ {companyValidation.message}</div>
        </div>}
        <button style={{...S.btn(true),width:"100%",opacity:isValidating||isConfirm?0.55:1,cursor:isValidating||isConfirm?"not-allowed":"pointer"}} disabled={isValidating||isConfirm} onClick={validateCompanyAndStart}>
          {isValidating?"기업명 확인 중...":"검사 시작하기"}
        </button>
        <div style={{textAlign:"center",marginTop:12,fontSize:13,color:"#94a3b8"}}>입력하지 않아도 검사는 진행됩니다</div>
      </div>
    </div></div>
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

  if(stage==="test_loading") return(<div style={S.wrap}><div style={S.box}><div style={{height:60}}/><DeepHeader/><Spinner text="딥둥이가 맞춤 결과 리포트를 만들고 있어요..."/></div></div>);

  // ═══ RESULT ═══
  if(stage==="result"&&basicResults){
    const{scores:sc,adjustedScores:adj,sdPct:sdP,consistencyPct:conP,stabilityScore:stab,authenticityScore:auth,personalityType:pType,validityChecks:vc}=basicResults;
    const mins=endTime&&startTime?Math.round((endTime-startTime)/60000):"–";
    const radarDims=DIMS_ORDER;
    const radarLabels={...DIM_LABELS};
    const getPercentile=(s)=>s>=90?"상위 5%":s>=80?"상위 10%":s>=70?"상위 20%":s>=60?"상위 35%":s>=50?"평균":s>=40?"하위 35%":s>=30?"하위 20%":"하위 10%";
    const getPctColor=(s)=>s>=70?"#6ee7b7":s>=50?"#fbbf24":"#f87171";

    const scoreColor = (raw) => raw >= 80 ? "#6ee7b7" : raw >= 65 ? "#fbbf24" : raw >= 50 ? "#fb923c" : "#f87171";
    const stabColor = scoreColor(stab.raw);
    const authColor = scoreColor(auth.raw);
    // 간단 해석 한 줄
    const stabOneLine = stab.raw >= 65 ? "비슷한 문항에 일관되게 응답" : stab.raw >= 50 ? "대체로 일관적이지만 일부 모순" : "응답 패턴 변동이 커 재점검 권장";
    const authOneLine = auth.raw >= 65 ? "솔직하고 현실적인 응답 패턴" : auth.raw >= 50 ? "대체로 솔직하나 일부 과장 경향" : "과장/비현실적 응답 신호 감지";
    // 상세 설명용
    const conLv = conP>=80?"매우 일관적":conP>=60?"양호":conP>=40?"일부 모순":"응답 모순 심각";
    const sdLv = sdP<=40?"매우 솔직":sdP<=60?"양호":"과장 응답 경향 일부 감지";

    // 종합 경고 레벨 (비빈도는 직접 언급하지 않음)
    const hasAnyWarning = vc.allSame.detected || vc.lowVariance.detected || vc.extremeHigh.detected || vc.outlier.extremeLows.length > 0;

    return(
      <div style={S.wrap}><div style={S.box}>
        <div style={{height:16}}/>
        <DeepHeader subtitle={`사기업 인성검사 · 소요: ${mins}분 · ${total}/${TOTAL_Q}문항`}/>

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

        {/* 응답 안정성 + 응답 진정성 (2개 카드 나란히) */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:12,marginBottom:16}}>
          <div style={{...S.card,textAlign:"center",padding:"20px 16px",marginBottom:0}}>
            <div style={{fontSize:11,letterSpacing:2,color:"#94a3b8",fontWeight:700,marginBottom:6}}>응답 안정성</div>
            <div style={{fontSize:42,fontWeight:900,color:stabColor,lineHeight:1.1,marginBottom:4}}>{stab.display}%</div>
            <div style={{fontSize:12,fontWeight:700,color:stabColor,marginBottom:8}}>{stab.level}</div>
            <div style={{fontSize:12,color:"#cbd5e0",lineHeight:1.5,padding:"8px 10px",background:"rgba(15,23,42,0.45)",borderRadius:8}}>{stabOneLine}</div>
          </div>
          <div style={{...S.card,textAlign:"center",padding:"20px 16px",marginBottom:0}}>
            <div style={{fontSize:11,letterSpacing:2,color:"#94a3b8",fontWeight:700,marginBottom:6}}>응답 진정성</div>
            <div style={{fontSize:42,fontWeight:900,color:authColor,lineHeight:1.1,marginBottom:4}}>{auth.display}%</div>
            <div style={{fontSize:12,fontWeight:700,color:authColor,marginBottom:8}}>{auth.level}</div>
            <div style={{fontSize:12,color:"#cbd5e0",lineHeight:1.5,padding:"8px 10px",background:"rgba(15,23,42,0.45)",borderRadius:8}}>{authOneLine}</div>
          </div>
        </div>
        {(stab.raw < 40 || auth.raw < 40) && <div style={{...S.card,marginBottom:16,background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.25)",padding:"12px 16px"}}>
          <div style={{fontSize:13,color:"#fdba74",lineHeight:1.7}}>
            ⚠️ {stab.raw < 40 && auth.raw < 40 ? "안정성과 진정성 모두" : stab.raw < 40 ? "응답 안정성" : "응답 진정성"} 원점수가 낮습니다. 문항을 한 번 더 천천히 읽고 재검사를 권장해요. (실제 검사에서는 재검사 대상이 될 수 있는 구간이에요.)
          </div>
        </div>}

        {/* 레이더 — 보정 점수 기반 */}
        <div style={S.card}>
          <div style={S.secTtl}>성격 프로파일{companyData?" vs 기업 인재상":""}</div>
          <div style={{display:"flex",justifyContent:"center"}}><AnimatedRadar scores={adj} dims={radarDims} labels={radarLabels} companyProfile={companyData?.bigFiveProfile}/></div>
          <div style={{fontSize:12,color:"#64748b",textAlign:"center",marginTop:8}}>※ 차원별 점수는 실전 감각에 맞춰 보정(scaling)된 표시 점수입니다.</div>
        </div>

        {/* 차원별 점수 — 보정 점수 + 등급 */}
        <div style={S.card}>
          <div style={S.secTtl}>차원별 상세 점수</div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,lineHeight:1.6}}>
            등급 기준: <span style={{fontWeight:700,color:"#10b981"}}>S</span> 65초과 · <span style={{fontWeight:700,color:"#3b82f6"}}>A</span> 55초과 · <span style={{fontWeight:700,color:"#f97316"}}>B</span> 40초과 · <span style={{fontWeight:700,color:"#ef4444"}}>C</span> 30초과 · <span style={{fontWeight:700,color:"#991b1b"}}>D</span> 30이하
          </div>
          {radarDims.map(d=>{
            const g = getGrade(adj[d]);
            return (<div key={d} style={S.dimBar}>
              <div style={S.dimLbl}>
                <span>{radarLabels[d]||d}</span>
                <span style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,fontWeight:900,padding:"2px 8px",borderRadius:6,background:g.bg,color:g.color,letterSpacing:0.5}}>{g.grade}등급</span>
                  <span style={{fontWeight:800,color:g.color,minWidth:28,textAlign:"right"}}>{adj[d]}</span>
                </span>
              </div>
              <div style={S.barBg}><div style={S.barFill(adj[d], g.color)}/></div>
            </div>);
          })}
        </div>

        {/* 강약점 맵 — 보정 점수 */}
        {(()=>{
          const sorted=radarDims.map(d=>({d,s:adj[d]})).sort((a,b)=>b.s-a.s);
          const top3=sorted.slice(0,3),bot3=sorted.slice(-3).reverse();
          return(<div style={S.card}>
            <div style={S.secTtl}>📌 나의 강약점 맵</div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:700,color:"#6ee7b7",marginBottom:10}}>🔺 강점 TOP 3</div>
              {top3.map(({d,s},i)=>{const g=getGrade(s);return(<div key={d} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"10px 14px",background:"rgba(52,211,153,0.06)",borderRadius:10,border:"1px solid rgba(52,211,153,0.15)"}}><span style={{fontSize:20,fontWeight:900,color:"#6ee7b7",width:24}}>{i+1}</span><span style={{fontSize:15,fontWeight:700,color:"#e2e8f0",flex:1}}>{radarLabels[d]||d}</span><span style={{fontSize:11,fontWeight:900,padding:"2px 8px",borderRadius:6,background:g.bg,color:g.color,letterSpacing:0.5}}>{g.grade}</span><span style={{fontSize:18,fontWeight:800,color:g.color}}>{s}점</span><span style={{fontSize:12,fontWeight:700,color:getPctColor(s),background:"rgba(0,0,0,0.2)",padding:"3px 8px",borderRadius:8}}>{getPercentile(s)}</span></div>);})}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fb923c",marginBottom:10}}>🔻 보완 필요 TOP 3</div>
              {bot3.map(({d,s},i)=>{const g=getGrade(s);return(<div key={d} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"10px 14px",background:"rgba(251,146,60,0.06)",borderRadius:10,border:"1px solid rgba(251,146,60,0.15)"}}><span style={{fontSize:20,fontWeight:900,color:"#fb923c",width:24}}>{i+1}</span><span style={{fontSize:15,fontWeight:700,color:"#e2e8f0",flex:1}}>{radarLabels[d]||d}</span><span style={{fontSize:11,fontWeight:900,padding:"2px 8px",borderRadius:6,background:g.bg,color:g.color,letterSpacing:0.5}}>{g.grade}</span><span style={{fontSize:18,fontWeight:800,color:g.color}}>{s}점</span><span style={{fontSize:12,fontWeight:700,color:getPctColor(s),background:"rgba(0,0,0,0.2)",padding:"3px 8px",borderRadius:8}}>{getPercentile(s)}</span></div>);})}
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

        {/* 응답 안정성/진정성 상세 해석 — 두 지표를 분리해 풀어 설명 */}
        <div style={S.card}>
          <div style={S.secTtl}>📊 응답 안정성 · 진정성 상세 해석</div>

          {/* 응답 안정성 */}
          <div style={{marginBottom:22,padding:"14px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10,borderLeft:`3px solid ${stabColor}`}}>
            <div style={{fontSize:15,fontWeight:700,color:stabColor,marginBottom:6}}>응답 안정성 {stab.display}% — {stab.level}</div>
            <div style={{fontSize:13,color:"#94a3b8",marginBottom:8,lineHeight:1.6}}>
              비슷한 질문에 일관되게 답했는지를 보는 지표예요. 같은 값만 연속해서 고르거나 모든 문항에 비슷한 점수만 주면 점수가 낮아집니다.
            </div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#e2e8f0"}}>
              <div style={{marginBottom:4}}>· 일관성 요소 — <span style={{fontWeight:700}}>{conLv}</span></div>
              <div style={{paddingLeft:10}}>{conP>=80?"비슷한 내용의 문항에 일관되게 응답했어요. 아주 좋은 신호입니다.":conP>=60?"대체로 일관적이지만 몇 문항에서 소소한 모순이 있어요. 역문항만 조금 주의하면 쉽게 끌어올릴 수 있어요.":conP>=40?"역문항과 정문항 사이 모순이 꽤 보입니다. '~하지 않는다'류 표현을 반대로 읽었는지 점검하면 빠르게 개선됩니다.":"응답 일관성이 낮아 실제 검사에서 재검사 대상이 될 수 있어요. 다음엔 문항을 한 번 더 천천히 읽어주세요."}</div>
            </div>
            {stab.penalty > 0 && <div style={{marginTop:10,fontSize:13,color:"#fdba74",lineHeight:1.6}}>
              · 무성의 패턴으로 <span style={{fontWeight:700}}>-{stab.penalty}점</span> 감점 반영 ({vc.allSame.detected?"연속 동일값":""}{vc.allSame.detected&&vc.lowVariance.detected?" · ":""}{vc.lowVariance.detected?"응답 변동 매우 적음":""})
            </div>}
          </div>

          {/* 응답 진정성 */}
          <div style={{padding:"14px 16px",background:"rgba(15,23,42,0.4)",borderRadius:10,borderLeft:`3px solid ${authColor}`}}>
            <div style={{fontSize:15,fontWeight:700,color:authColor,marginBottom:6}}>응답 진정성 {auth.display}% — {auth.level}</div>
            <div style={{fontSize:13,color:"#94a3b8",marginBottom:8,lineHeight:1.6}}>
              답변이 얼마나 솔직한지를 보는 지표예요. 모든 차원에서 지나치게 완벽한 점수가 나오거나 과장된 답변이 감지되면 점수가 낮아집니다.
            </div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#e2e8f0"}}>
              <div style={{marginBottom:4}}>· 솔직성 요소 — <span style={{fontWeight:700}}>{sdLv}</span></div>
              <div style={{paddingLeft:10}}>{sdP<=40?"자신의 약점도 솔직하게 인정하는 응답 패턴이에요. 실제 검사에서도 신뢰 받는 방향입니다.":sdP<=60?"대체로 솔직하지만 일부 '너무 완벽한' 응답이 섞여 있어요. 한두 문항만 더 현실적으로 답하면 충분히 통과할 수 있어요.":"과장 응답 경향이 강합니다. 약점을 인정하는 답변 1~2개만 포함해도 이 부분은 바로 개선됩니다."}</div>
            </div>
            {auth.penalty > 0 && <div style={{marginTop:10,fontSize:13,color:"#fdba74",lineHeight:1.6}}>
              · 응답 패턴으로 <span style={{fontWeight:700}}>-{auth.penalty}점</span> 감점 반영 ({vc.infrequency.detected?"일부 응답 주의 신호":""}{vc.infrequency.detected&&vc.extremeHigh.detected?" · ":""}{vc.extremeHigh.detected?"전반적 고점 과다":""})
            </div>}
          </div>
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

        {aiError&&<div style={{...S.card,borderColor:"rgba(251,146,60,0.35)",background:"rgba(251,146,60,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:22}}>⏳</span>
            <span style={{color:"#fdba74",fontSize:16,fontWeight:800}}>AI 분석을 불러오는 중입니다</span>
          </div>
          <div style={{color:"#cbd5e0",fontSize:14,lineHeight:1.7,marginBottom:14}}>
            잠시 후 다시 시도해주세요. 기본 결과는 위에서 확인하실 수 있어요.
          </div>
          <button style={{...S.btn(true),width:"100%",padding:"12px"}} onClick={()=>{if(basicResults)generateAiResults(basicResults);}}>
            🔄 AI 분석 다시 시도
          </button>
        </div>}

        <div style={{textAlign:"center",padding:20}}>
          <img src="/deepdungi.png" alt="딥둥이" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",marginBottom:10}}/>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.8}}>본 검사는 모의 인성검사입니다.<br/><span style={{color:"#94a3b8",fontWeight:600}}>Powered by 457deep · 딥둥이</span></div>
        </div>
        <button style={{...S.btn(true),width:"100%",padding:"16px",fontSize:16,marginBottom:32}} onClick={()=>{setStage("company_input");setPage(1);setAnswers({});setAiResults(null);setAiError("");setBasicResults(null);setStartTime(null);setEndTime(null);setTestSet(null);setCompanyValidation(null);}}>다시 검사하기</button>
      </div></div>
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
