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
      if (vc.allSame?.detected) validityWarnings.push("연속 동일값 응답 " + vc.allSame.maxRun + "문항 (무성의 응답 패턴)");
      // 비빈도(IF) 관련은 결과 텍스트에서 직접 언급하지 않되, 응답 패턴 주의 신호로만 추상화 전달
      if (vc.infrequency?.detected) validityWarnings.push("일부 응답 패턴에서 주의 신호 감지");
      if (vc.lowVariance?.detected) validityWarnings.push("응답 변동이 매우 낮음 (각 문항에 분명한 의견 표현 필요)");
      if (vc.extremeHigh?.detected) validityWarnings.push("보정 후 85점 이상 차원이 " + vc.extremeHigh.count + "개 (전반적으로 고점 과다)");
      if (vc.outlier?.avgHigh) validityWarnings.push("전체 평균 " + vc.outlier.avg + "점: 다소 높은 수준");
      if (vc.outlier?.extremeLows?.length > 0) validityWarnings.push("극단적 저점(20이하): " + vc.outlier.extremeLows.join(", "));

      systemPrompt = `당신은 한국 대기업 채용 인성검사 분석 전문가이자 코칭 전문가입니다. 검사 결과를 분석하여 맞춤형 리포트를 생성합니다.

톤 지침:
- "부족합니다", "탈락입니다" 같은 단정적/부정적 표현을 쓰지 말고, "여기를 이렇게 개선하면 충분히 통과할 수 있어요" 같은 진단+코칭 톤으로 작성합니다.
- "비빈도", "IF 문항", "함정 문항" 같은 전문 용어를 직접 언급하지 말고, "응답 패턴", "자연스러운 응답" 같은 완곡한 표현을 사용합니다.
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
응답 신뢰도(통합): ${testResults.trustScore !== undefined ? testResults.trustScore + "%" : "N/A"}
${validityWarnings.length > 0 ? "\n📌 응답 패턴 참고 사항 (결과 텍스트에서는 전문 용어 없이 완곡하게 반영):\n" + validityWarnings.map(function(w) { return "- " + w; }).join("\n") : ""}

아래 JSON 형식으로 분석 결과를 생성해주세요:

{
  "matchScore": 0~100 사이의 기업 적합도 점수(원점수, 프론트에서 +10 보정 후 상한 95로 표시됨),
  "matchAnalysis": "이 사람이 해당 기업에 얼마나 적합한지 3~4문장 분석. 응답 패턴 참고 사항이 있다면 '비빈도/IF' 같은 용어 없이 '응답 패턴'이라는 완곡한 표현으로 언급하고, 진단+코칭 톤으로 작성",
  "strengths": ["이 기업에서 강점이 될 특성 3개"],
  "improvements": ["보완 포인트 2~3개 — '부족하다'가 아니라 '이렇게 개선하면 통과 가능' 톤으로"],
  "interviewQuestions": [
    {"question": "면접 예상 질문", "intent": "이 질문의 출제 의도", "tip": "답변 팁"},
    ... 총 20개
  ],
  "overallAdvice": "이 기업 면접을 위한 종합 조언 3~4문장 (진단+코칭 톤, '여기만 다듬으면 충분히 통과할 수 있어요' 방향)"
}

면접 질문은 응시자의 **차원별 점수(O/C/E/A/N/L/S/I/F)에 기반**해 총 20개를 출제합니다. 유형 이름보다 점수 분포를 우선 기준으로 삼으세요.

[배분 규칙]
- **점수가 가장 낮은 3개 차원**에서 각 4개씩 = **12개**
  → 면접관이 해당 차원의 약점을 검증하려는 의도의 행동 기반 질문으로 작성
  → 예: 집중력이 38점이면 "장시간 반복 업무를 할 때 집중력을 어떻게 유지하시나요?"
  → 예: 친화성이 40점이면 "동료와 의견이 충돌했을 때 어떻게 풀어왔는지 구체 사례로 말씀해 주세요"
  → 예: 자주성이 35점이면 "지시를 받기 전에 스스로 일을 찾아 진행한 경험이 있나요?"
  → "당신은 ○○이 부족하군요" 식으로 약점을 직접 지적하지 말고, 자연스럽게 검증하는 행동/경험 질문으로 작성
  → 각 질문의 "intent" 필드에 "○○ 차원(XX점) 약점 검증" 뉘앙스를 명시
- **나머지 6개 차원**에서 총 **8개**
  → 강점 확인, 행동 일관성 검증, 조직 적합성, 가치관 검증 용도
  → 차원 간 균형을 유지하되 기업 인재상과 연결

[전체 규칙]
- 인성검사 기반 면접이므로 직무역량/기술적 위기관리 질문은 제외
- 해당 기업의 인재상도 함께 반영해 실제 인성 면접에서 나올 만한 톤으로 작성
- 응답 패턴 참고 사항이 있으면 위 20개 중 1~2개를 해당 패턴을 자연스럽게 검증하는 질문으로 대체 가능 (단 '비빈도/IF' 같은 전문 용어는 질문 텍스트에 쓰지 말 것)`;
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
