// Vercel Serverless Function — Anthropic Claude 프록시
// POST /api/analyze
// env: ANTHROPIC_API_KEY

// 약자 → 정식명칭 매핑 테이블 (대기업·사립/국립대학교·사립병원 커버)
// Claude Sonnet 4가 약자 해석에 보수적이라 서버측에서 먼저 확장
const ABBREV_MAP = {
  // ── 대기업 ──
  "현차": "현대자동차", "삼성": "삼성전자", "삼전": "삼성전자",
  "LG": "LG전자", "엘지": "LG전자", "LGE": "LG전자",
  "SKT": "SK텔레콤", "SKH": "SK하이닉스", "SK하이": "SK하이닉스",
  "현대": "현대자동차", "기아": "기아",
  "한전": "한국전력공사", "한수원": "한국수력원자력",
  "LH": "한국토지주택공사", "코레일": "한국철도공사", "KTX": "한국철도공사",
  "포스코": "POSCO", "POSCO": "POSCO",
  "한화": "한화그룹", "롯데": "롯데그룹", "CJ": "CJ그룹",
  "신세계": "신세계그룹", "두산": "두산그룹", "GS": "GS그룹",
  "네이버": "네이버", "카카오": "카카오", "쿠팡": "쿠팡",
  "배민": "우아한형제들", "당근": "당근마켓", "토스": "토스",
  // ── 사립대학교 ──
  "연대": "연세대학교", "고대": "고려대학교", "성대": "성균관대학교",
  "한양대": "한양대학교", "이대": "이화여자대학교", "중대": "중앙대학교",
  "경희대": "경희대학교", "외대": "한국외국어대학교", "서강대": "서강대학교",
  "동국대": "동국대학교", "건국대": "건국대학교", "홍대": "홍익대학교",
  "숙대": "숙명여자대학교", "숭실대": "숭실대학교", "세종대": "세종대학교",
  "포스텍": "포항공과대학교", "포항공대": "포항공과대학교", "카이스트": "KAIST",
  "KAIST": "KAIST", "UNIST": "UNIST", "지스트": "GIST", "GIST": "GIST",
  // ── 국립대학교 ──
  "서울대": "서울대학교", "부산대": "부산대학교", "경북대": "경북대학교",
  "전남대": "전남대학교", "충남대": "충남대학교", "충북대": "충북대학교",
  "전북대": "전북대학교", "강원대": "강원대학교", "제주대": "제주대학교",
  "경상대": "경상국립대학교", "서울시립대": "서울시립대학교", "시립대": "서울시립대학교",
  // ── 사립 병원 ──
  "세브란스": "연세대학교 세브란스병원", "신촌세브란스": "연세대학교 세브란스병원",
  "강남세브란스": "강남세브란스병원",
  "삼성서울": "삼성서울병원", "삼성서울병원": "삼성서울병원",
  "서울아산": "서울아산병원", "아산병원": "서울아산병원",
  "서울성모": "가톨릭대학교 서울성모병원", "성모병원": "가톨릭대학교 서울성모병원",
  "분당서울대": "분당서울대학교병원",
};

function resolveAbbreviation(raw) {
  const name = (raw || "").trim();
  return ABBREV_MAP[name] || name;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { type, companyName, testResults } = body;

    // ── validate_company: AI 호출 없이 서버측 heuristic + 약자 매핑 ──
    if (type === "validate_company") {
      const name = (companyName || "").trim();
      if (name.length < 2) {
        return res.status(200).json({
          valid: false,
          correctedName: null,
          message: "해당 기업을 찾을 수 없습니다. 정확한 기업명을 입력해주세요.",
        });
      }
      const resolved = resolveAbbreviation(name);
      const expanded = resolved !== name;
      return res.status(200).json({
        valid: true,
        correctedName: resolved,
        message: expanded ? `${resolved}(으)로 검색합니다` : null,
      });
    }

    let systemPrompt, userPrompt;

    if (type === "analyze_company") {
      systemPrompt = `당신은 한국 조직의 채용·인재상 전문가입니다. 대기업·중견기업·스타트업·국립 및 사립 대학교·사립 병원 등 다양한 한국 조직을 다룹니다. 각 조직의 인재상과 핵심 가치를 분석하여 Big5 성격 프로파일로 변환합니다.

⚠️ 절대 준수: 사용자가 입력한 **그 조직만** 분석하세요. 다른 조직을 임의로 대체·생성하지 마세요.

입력값은 이미 서버측에서 약칭이 풀네임으로 확장된 상태로 전달됩니다. 그대로 사용해 분석하면 됩니다. (예: 사용자가 "연대"로 입력했으면 이미 "연세대학교"로 들어옵니다.)

조직 유형별 분석 지침:
- 대기업·중견·스타트업: 기업의 핵심 가치·조직문화 중심 분석
- 사립대학교·국립대학교: 교직원 채용 관점의 교육 이념·학풍·인재상 분석
- 사립병원: 의료진·행정직 채용 관점의 의료 철학·조직문화 분석

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

      const resolvedName = resolveAbbreviation(companyName);
      userPrompt = `분석할 조직(입력값): "${resolvedName}"

위 입력값에 해당하는 **실제 그 한국 조직**(기업·대학·병원 등)을 분석하세요. 절대 다른 조직으로 바꿔 분석하지 마세요.

이 조직의 인재상, 핵심가치, 조직문화를 기반으로 아래 JSON을 채워주세요:

{
  "companyName": "${resolvedName}",
  "coreValues": "핵심가치 3~4개를 쉼표로 나열",
  "talentProfile": "이 기업이 원하는 인재상을 2~3문장으로 설명",
  "bigFiveProfile": {
    "O": 0~100 사이 숫자 (개방성/혁신 중시 정도),
    "C": 0~100 사이 숫자 (성실성/실행력 중시 정도),
    "E": 0~100 사이 숫자 (외향성/소통 중시 정도),
    "A": 0~100 사이 숫자 (친화성/협업 중시 정도),
    "N": 0~100 사이 숫자 (정서안정성/스트레스내성 중시 정도),
    "L": 0~100 사이 숫자 (리더십/주도성 중시 정도),
    "S": 0~100 사이 숫자 (스트레스 대처 중시 정도)
  },
  "keyTraits": ["이 기업에서 중요하게 보는 특성 5개를 배열로"],
  "cultureFit": "조직문화 특성을 1~2문장으로"
}`;
    } else if (type === "generate_results") {
      const vc = (testResults && testResults.validityChecks) || {};
      const validityWarnings = [];
      if (vc.allSame?.detected) validityWarnings.push("연속 동일값 응답 " + vc.allSame.maxRun + "문항 (무성의 응답 패턴)");
      if (vc.infrequency?.detected) validityWarnings.push("일부 응답 패턴에서 주의 신호 감지");
      if (vc.lowVariance?.detected) validityWarnings.push("응답 변동이 매우 낮음 (각 문항에 분명한 의견 표현 필요)");
      if (vc.extremeHigh?.detected) validityWarnings.push("보정 후 85점 이상 차원이 " + vc.extremeHigh.count + "개 (전반적으로 고점 과다)");
      if (vc.outlier?.avgHigh) validityWarnings.push("전체 평균 " + vc.outlier.avg + "점: 다소 높은 수준");
      if (vc.outlier?.extremeLows?.length > 0) validityWarnings.push("극단적 저점(20이하): " + vc.outlier.extremeLows.join(", "));

      systemPrompt = `당신은 한국 대기업 채용 인성검사 분석 전문가이자 코칭 전문가입니다. 검사 결과를 분석하여 맞춤형 리포트를 생성합니다.

톤 지침:
- "부족합니다", "탈락입니다" 같은 단정적/부정적 표현을 쓰지 말고, "여기를 이렇게 개선하면 충분히 통과할 수 있어요" 같은 진단+코칭 톤으로 작성합니다.
- "비빈도", "IF 문항", "함정 문항", "SD", "CC" 같은 전문 용어를 직접 언급하지 말고, "응답 패턴", "자연스러운 응답" 같은 완곡한 표현을 사용합니다.
- 약점도 "보완 포인트"로 긍정적으로 재구성하여 전달합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

      userPrompt = `다음은 인성검사 결과입니다:

기업: ${testResults.companyName}
기업 인재상 프로파일: ${JSON.stringify(testResults.companyProfile)}

응시자 Big5 점수:
- 개방성(O): ${testResults.scores.O}
- 성실성(C): ${testResults.scores.C}
- 외향성(E): ${testResults.scores.E}
- 친화성(A): ${testResults.scores.A}
- 정서안정성(N): ${testResults.scores.N}
- 리더십(L): ${testResults.scores.L}
- 스트레스대처(S): ${testResults.scores.S}
- 자주성(I): ${testResults.scores.I || "N/A"}
- 집중력(F): ${testResults.scores.F || "N/A"}

응시자 유형: ${testResults.personalityType}
일관성 점수: ${testResults.consistencyScore}%
솔직성 점수: ${testResults.honestyScore}%
응답 안정성: ${testResults.stabilityScore !== undefined ? testResults.stabilityScore + "%" : "N/A"}
응답 진정성: ${testResults.authenticityScore !== undefined ? testResults.authenticityScore + "%" : "N/A"}
${validityWarnings.length > 0 ? "\n📌 응답 패턴 참고 사항 (결과 텍스트에서는 전문 용어 없이 완곡하게 반영):\n" + validityWarnings.map(function(w) { return "- " + w; }).join("\n") : ""}

아래 JSON 형식으로 분석 결과를 생성해주세요:

{
  "matchScore": 0~100 사이의 기업 적합도 점수(원점수, 프론트에서 +10 보정 후 상한 95로 표시됨),
  "matchAnalysis": "이 사람이 해당 기업에 얼마나 적합한지 3~4문장 분석. 응답 패턴 참고 사항이 있다면 '비빈도/IF' 용어 없이 '응답 패턴'이라는 완곡 표현으로 언급하고, 진단+코칭 톤으로 작성",
  "strengths": ["이 기업에서 강점이 될 특성 3개"],
  "improvements": ["보완 포인트 2~3개 — '부족하다'가 아니라 '이렇게 개선하면 통과 가능' 톤"],
  "interviewQuestions": [
    {"question": "면접 예상 질문", "intent": "이 질문의 출제 의도", "tip": "답변 팁"},
    ... 총 20개
  ],
  "overallAdvice": "이 기업 면접을 위한 종합 조언 3~4문장 (진단+코칭 톤, '여기만 다듬으면 충분히 통과할 수 있어요' 방향)"
}

면접 질문은 응시자의 **차원별 점수(O/C/E/A/N/L/S/I/F)에 기반**해 총 20개를 출제합니다. 유형 이름이나 기업 가치관이 아니라 **점수 분포**가 절대적 기준입니다.

[차원별 배분 규칙]
- **점수가 가장 낮은 3개 차원**에서 각 4개씩 = **12개**
  → 면접관이 해당 차원의 약점을 검증하려는 의도의 행동 기반 질문으로 작성
  → 예: 집중력이 38점이면 "장시간 반복 업무를 할 때 집중력을 어떻게 유지하시나요?"
  → 예: 친화성이 40점이면 "동료와 의견이 충돌했을 때 어떻게 풀어왔는지 구체 사례로 말씀해 주세요"
  → 예: 자주성이 35점이면 "지시를 받기 전에 스스로 일을 찾아 진행한 경험이 있나요?"
  → "당신은 ○○이 부족하군요" 식으로 약점을 직접 지적하지 말고, 자연스럽게 검증하는 행동/경험 질문으로 작성
  → 각 질문의 "intent" 필드에 "○○ 차원(XX점) 약점 검증" 뉘앙스를 명시
- **나머지 6개 차원**에서 총 **8개**
  → 강점 확인 + 행동 일관성 검증 용도
  → 차원 간 균형을 유지

[카테고리 배분 — 총 20개]
- 인성/가치관 7개
- 업무 스타일/태도 7개
- 대인관계/소통 6개
※ "조직적합성/문화" 카테고리는 사용하지 않습니다.

[전체 규칙 — 매우 중요]
- **모든 20개 질문은 반드시 인성검사 차원별 점수에 기반해 출제**합니다. 점수와 무관한 질문은 만들지 마세요.
- **"이 기업의 가치관을 어떻게 생각하나요?", "○○사의 인재상에 본인이 부합한다고 보나요?", "왜 우리 회사여야 하나요?" 같은 조직 적합성/문화 적합성 질문은 절대 만들지 마세요.** 기업명은 질문의 **맥락**(예: "○○ 영업조직에서 동료와 의견이 충돌했을 때…")에만 활용하고, 핵심은 인성검사에서 낮게 나온 차원의 **약점 검증**입니다.
- 인성검사 기반 면접이므로 직무역량/기술적 위기관리 질문은 제외
- 응답 패턴 참고 사항이 있으면 위 20개 중 1~2개를 해당 패턴을 자연스럽게 검증하는 질문으로 대체 가능 (단 '비빈도/IF' 같은 전문 용어는 질문 텍스트에 쓰지 말 것)`;
    } else {
      return res.status(400).json({ error: "Invalid request type" });
    }

    // 타입별 max_tokens
    // analyze_company: 프로파일 요약
    // generate_results: 20개 면접 질문 포함 리포트 (가장 긴 응답)
    const maxTokens = type === "analyze_company" ? 1024 : 4096;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "API error: " + response.status, details: errText });
    }

    const data = await response.json();
    const text = data.content
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("");

    let parsed;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(200).json({ raw: text, parseError: true });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
