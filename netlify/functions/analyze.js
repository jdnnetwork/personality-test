exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  try {
    const { type, companyName, testResults } = JSON.parse(event.body);

    let systemPrompt, userPrompt;

    if (type === "analyze_company") {
      systemPrompt = `당신은 한국 대기업 채용 전문가입니다. 기업의 인재상과 핵심가치를 분석하여 Big5 성격 프로파일로 변환합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

      userPrompt = `"${companyName}" 기업을 분석해주세요.

이 기업의 인재상, 핵심가치, 조직문화를 기반으로 아래 JSON을 채워주세요:

{
  "companyName": "${companyName}",
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
      const vc = testResults.validityChecks || {};
      const validityWarnings = [];
      if (vc.allSame?.detected) validityWarnings.push("무성의 응답 탐지: 연속 " + vc.allSame.maxRun + "문항 동일 값");
      if (vc.infrequency?.detected) validityWarnings.push("비빈도 문항 " + vc.infrequency.count + "개 탐지 (비정상 응답 패턴)");
      if (vc.outlier?.allHigh) validityWarnings.push("전 차원 85+ 이상: 통계적 이상치");
      if (vc.outlier?.avgHigh) validityWarnings.push("전체 평균 " + vc.outlier.avg + "점: 비현실적 고점");
      if (vc.outlier?.extremeLows?.length > 0) validityWarnings.push("극단적 저점(20이하): " + vc.outlier.extremeLows.join(", "));

      systemPrompt = `당신은 한국 대기업 채용 인성검사 분석 전문가입니다. 검사 결과를 분석하여 맞춤형 리포트를 생성합니다.
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
${validityWarnings.length > 0 ? "\n⚠️ 응답 유효성 경고:\n" + validityWarnings.map(function(w) { return "- " + w; }).join("\n") : ""}

아래 JSON 형식으로 분석 결과를 생성해주세요:

{
  "matchScore": 0~100 사이의 기업 적합도 점수,
  "matchAnalysis": "이 사람이 해당 기업에 얼마나 적합한지 3~4문장 분석. 유효성 경고가 있다면 반드시 언급",
  "strengths": ["이 기업에서 강점이 될 특성 3개"],
  "improvements": ["보완하면 좋을 점 2~3개"],
  "interviewQuestions": [
    {"question": "면접 예상 질문", "intent": "이 질문의 출제 의도", "tip": "답변 팁"},
    ... 총 20개
  ],
  "overallAdvice": "이 기업 면접을 위한 종합 조언 3~4문장"
}

면접 질문은 다음 카테고리에서 골고루 출제해주세요:
- 인성/가치관 질문 5개
- 조직적합성 질문 5개  
- 직무역량 질문 5개
- 상황대처/위기관리 질문 5개

질문은 해당 기업의 인재상과 응시자의 성격 유형을 고려하여 실제 면접에서 나올 만한 질문으로 만들어주세요.
유효성 경고가 있는 경우, 해당 패턴과 관련된 면접 질문도 2~3개 포함해주세요.`;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid request type" }),
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "API error: " + response.status, details: errText }),
      };
    }

    const data = await response.json();
    const text = data.content
      .filter(function(b) { return b.type === "text"; })
      .map(function(b) { return b.text; })
      .join("");

    let parsed;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ raw: text, parseError: true }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
