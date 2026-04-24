# 대기업 인성검사 AI 모의 테스트

Big5 성격 모델 기반 150문항 인성검사 + AI 기업 맞춤 분석

## 기능
- 기업명 입력 → AI가 인재상/핵심가치 분석
- 150문항 인성검사 (Big5 + 리더십 + 스트레스 대처)
- 일관성 검증 + 사회적 바람직성 탐지
- AI 맞춤 결과 리포트 (기업 적합도 + 면접 예상 질문 20개)

## Netlify 배포 방법

### 1. GitHub에 코드 올리기
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/personality-test.git
git push -u origin main
```

### 2. Netlify에서 배포
1. [netlify.com](https://netlify.com) 가입/로그인
2. "Add new site" → "Import an existing project"
3. GitHub 연결 → 이 저장소 선택
4. Build settings는 자동 감지됨 (netlify.toml에 설정됨)
5. "Deploy site" 클릭

### 3. API 키 설정 (중요!)
1. Netlify 대시보드 → Site settings → Environment variables
2. "Add a variable" 클릭
3. Key: `ANTHROPIC_API_KEY`
4. Value: `sk-ant-api03-...` (발급받은 API 키 입력)
5. 저장 후 Redeploy

### 4. 완료!
배포된 URL을 학생에게 공유하면 됩니다.

## 프로젝트 구조
```
├── index.html              # HTML 진입점
├── src/
│   ├── main.jsx            # React 진입점
│   └── App.jsx             # 메인 앱 (150문항 + AI 분석)
├── netlify/
│   └── functions/
│       └── analyze.js      # 서버리스 API (API 키 보호)
├── netlify.toml            # Netlify 설정
├── package.json            # 의존성
└── vite.config.js          # Vite 빌드 설정
```

## API 비용 참고
- 기업 분석 1회: 약 $0.01~0.02
- 결과 리포트 1회: 약 $0.03~0.05
- 1명 검사 전체: 약 $0.04~0.07
