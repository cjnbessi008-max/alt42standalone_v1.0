# AI Education System - Derivative Pulse

KAIST Touch Math Academy를 위한 AI 교육 시스템의 Derivative Pulse 기능 구현

## 🎯 주요 기능

### 1. **Derivative Pulse 애니메이션** ✨
- 미분 버튼을 클릭하면 그래프가 **살짝 수축하는 펄스 애니메이션** 실행
- 시각적 효과를 통해 미분 개념을 직관적으로 이해
- Framer Motion을 활용한 부드러운 애니메이션

### 2. **스마트폰 화면 시뮬레이터** 📱
- 우측 하단에 가상 스마트폰 프레임으로 앱 표시
- 실제 모바일 앱 경험 시뮬레이션
- 노치, 홈 인디케이터 등 디테일한 디자인

### 3. **LMS 연동 준비** 🔗
- Moodle API 연동을 위한 Mock 데이터 구조
- `fetchProblemFromLMS()`: 문제 가져오기
- `submitAnswerToLMS()`: 답안 제출
- 실제 API 엔드포인트로 쉽게 교체 가능

### 4. **실시간 그래프 시각화** 📊
- Recharts를 사용한 인터랙티브 그래프
- 원본 함수와 미분 함수 동시 표시
- 자동 색상 구분 (원본: 파란색, 미분: 빨간색)

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── SmartphoneFrame.tsx    # 스마트폰 프레임 컴포넌트
│   ├── GraphView.tsx           # 그래프 시각화 컴포넌트
│   └── ProblemDisplay.tsx      # 문제 표시 컴포넌트
├── utils/
│   ├── derivative.ts           # 미분 계산 로직 (mathjs)
│   └── lmsAdapter.ts           # LMS 연동 어댑터 (Mock)
├── types/
│   └── index.ts                # TypeScript 타입 정의
├── styles/
│   └── index.css               # Tailwind CSS 스타일
├── App.tsx                     # 메인 앱 컴포넌트
└── main.tsx                    # 엔트리 포인트
```

## 🛠 기술 스택

| 레이어 | 기술 |
|--------|------|
| **프론트엔드** | React 18 + TypeScript |
| **빌드 도구** | Vite 5 |
| **그래프** | Recharts 2.10 |
| **애니메이션** | Framer Motion 10 |
| **수학 계산** | mathjs 12 |
| **스타일링** | Tailwind CSS 3 |

## 🎨 Derivative Pulse 작동 방식

1. **초기 상태**: 원본 함수 f(x) 그래프 표시
2. **미분 버튼 클릭**:
   - 그래프가 0.95배로 수축하는 펄스 애니메이션 (600ms)
   - mathjs를 사용해 자동 미분 계산
3. **미분 함수 추가**:
   - f'(x) 그래프가 빨간색 선으로 추가 (800ms 전환 애니메이션)
   - 두 함수를 동시에 비교하며 학습

## 📱 스마트폰 프레임 기능

- **위치**: 우측 하단 고정
- **크기**: 360x640px (표준 모바일 해상도)
- **디자인 요소**:
  - 상단 노치 (카메라 영역)
  - 상태바 (시간, 배터리)
  - 홈 인디케이터
  - 물리 버튼 (전원, 볼륨)

## 🔗 LMS 연동 가이드

현재는 Mock 데이터를 사용하지만, 실제 Moodle API로 연동하려면:

### 1. `src/utils/lmsAdapter.ts` 수정

```typescript
export async function fetchProblemFromLMS(problemId?: string): Promise<Problem> {
  // Mock 코드 제거하고 실제 API 호출
  const response = await fetch(`https://moodle.example.com/api/problem/${problemId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
    },
  });
  return await response.json();
}
```

### 2. 환경 변수 설정

`.env` 파일 생성:
```env
VITE_LMS_API_URL=https://moodle.example.com/api
VITE_LMS_API_KEY=your_api_key_here
```

### 3. Moodle API 엔드포인트 예시
- `GET /api/problem/:id` - 문제 가져오기
- `POST /api/submit` - 답안 제출
- `GET /api/student/:id/progress` - 학습 진도 조회

## 🧮 지원하는 수학 함수

mathjs 라이브러리를 사용하여 다양한 함수의 미분 지원:

- **다항함수**: `x^2 + 2*x + 1`
- **삼각함수**: `sin(x)`, `cos(x)`, `tan(x)`
- **지수함수**: `exp(x)`, `e^x`
- **로그함수**: `log(x)`, `ln(x)`
- **복합함수**: `sin(x^2)`, `exp(cos(x))`

## 📊 샘플 문제

시스템에 포함된 Mock 문제들:

1. **이차함수**: f(x) = x² + 2x + 1
2. **삼차함수**: f(x) = x³ - 3x² + 2x
3. **삼각함수**: f(x) = sin(x) + cos(x)

## 🎯 향후 개발 계획

- [ ] 실제 Moodle API 연동
- [ ] 사용자 인증 시스템
- [ ] 학습 진도 추적
- [ ] 다양한 애니메이션 효과 추가
- [ ] 음성 안내 기능
- [ ] 오프라인 모드 지원
- [ ] 다국어 지원 확대

## 📄 라이선스

ISC License - KAIST Touch Math Academy

## 👥 기여자

- AI Agent (Claude) - Initial Development

## 📞 문의

- 기술 문의: [개발팀 이메일]
- 교육 문의: [교육팀 이메일]

---

**Made with ❤️ for KAIST Touch Math Academy**
