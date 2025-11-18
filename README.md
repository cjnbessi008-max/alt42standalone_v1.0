# ALT42 - AI Learning & Teaching Platform
## LMS 연동 및 맞춤 관점 전환 팁 제공 시스템

한국 수학 교육을 위한 LMS(Learning Management System) 연동 및 문제 유형별 맞춤 관점 전환 팁 제공 시스템입니다.

---

## 🎯 주요 기능

### 1. LMS 연동
- **Canvas, Moodle** 등 주요 LMS 플랫폼과 연동
- 학생 정보 및 문제 자동 동기화
- 실시간 성적 제출

### 2. 문제 유형 자동 분류
- 한국 수학 교육과정 기반 자동 분류
  - 이차함수
  - 평면도형 / 입체도형
  - 삼각함수
  - 확률 / 통계
  - 미분 / 적분
  - 등등...

### 3. 맞춤 관점 전환 팁 (Perspective Shift Tips)
- **4가지 관점 제공**:
  - 👁️ **시각적 (Visual)**: 그래프, 도형으로 이해
  - 🔢 **대수적 (Algebraic)**: 식 변형, 공식 활용
  - 📐 **기하학적 (Geometric)**: 기하학적 성질 이해
  - 💡 **개념적 (Conceptual)**: 본질적 개념 이해

- **맞춤 추천 알고리즘**:
  - 학생의 학습 프로필 분석
  - 과거 팁 효과성 추적
  - 시도 횟수 및 소요 시간 고려
  - 실시간 적응형 추천

### 4. 학습 분석
- 학생별 선호 학습 관점 분석
- 팁 효과성 측정
- 약점/강점 영역 추적

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│          프론트엔드 (React + TypeScript)      │
│  - 문제 보기 컴포넌트                         │
│  - 팁 표시 UI                                │
│  - LMS 연동 대시보드                          │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│        백엔드 (FastAPI + Python)             │
│  - LMS Integration Service                  │
│  - Tip Recommendation Engine                │
│  - Problem Type Classifier                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          데이터베이스 (PostgreSQL)            │
│  - 문제 유형                                 │
│  - 관점 전환 팁                              │
│  - 학생 학습 프로필                          │
│  - LMS 연동 설정                             │
└─────────────────────────────────────────────┘
```

---

## 📦 설치 및 실행

### 필수 요구사항
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 백엔드 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 데이터베이스 초기화
psql -U postgres -d alt42 -f database/schema.sql

# 서버 실행
python -m app.main
# 또는
uvicorn app.main:app --reload --port 8000
```

API 문서: http://localhost:8000/api/docs

### 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

웹앱: http://localhost:5173

---

## 📊 데이터베이스 스키마

### 주요 테이블

#### `problem_types` - 문제 유형
```sql
- id: UUID
- name: VARCHAR (예: "quadratic_functions")
- name_ko: VARCHAR (예: "이차함수")
- category: VARCHAR (algebra, geometry, calculus, statistics)
- description_ko: TEXT
```

#### `perspective_tips` - 관점 전환 팁
```sql
- id: UUID
- problem_type_id: UUID
- tip_level: INTEGER (1: basic, 2: intermediate, 3: advanced)
- perspective_type: VARCHAR (visual, algebraic, geometric, conceptual)
- title_ko: VARCHAR
- content_ko: TEXT
- effectiveness_score: DECIMAL
```

#### `student_learning_profiles` - 학생 학습 프로필
```sql
- id: UUID
- student_id: UUID
- problem_type_id: UUID
- preferred_perspective_type: VARCHAR
- weak_areas: JSONB
- strong_areas: JSONB
- tip_effectiveness: JSONB
```

#### `lms_integrations` - LMS 연동 설정
```sql
- id: UUID
- lms_type: VARCHAR (canvas, moodle, blackboard)
- institution_name: VARCHAR
- api_endpoint: VARCHAR
- is_active: BOOLEAN
```

---

## 🔌 API 엔드포인트

### 팁 관련 API

#### `POST /api/tips/recommend` - 맞춤 팁 추천
```json
Request:
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "current_attempt_number": 3,
  "time_spent_seconds": 180
}

Response:
{
  "tip": {
    "title_ko": "포물선을 그려보세요",
    "content_ko": "이차함수를 그래프로...",
    "perspective_type": "visual",
    "tip_level": 1
  },
  "confidence_score": 0.85,
  "personalized": true,
  "alternative_tips": [...]
}
```

#### `POST /api/tips/feedback/{recommendation_id}` - 팁 피드백 제출
```json
{
  "was_helpful": true,
  "student_feedback": "그래프를 그리니 이해가 되었어요!"
}
```

#### `POST /api/tips/classify-problem` - 문제 유형 자동 분류
```json
Request:
{
  "problem_content": "y = x² - 4x + 3의 그래프를 그리고 꼭짓점을 구하세요"
}

Response:
{
  "problem_type": "이차함수",
  "confidence": 0.9,
  "message": "'이차함수' 유형으로 분류되었습니다"
}
```

### LMS 연동 API

#### `POST /api/lms/integrations` - LMS 연동 설정
```json
{
  "lms_type": "canvas",
  "institution_name": "KAIST",
  "api_endpoint": "https://canvas.kaist.ac.kr",
  "api_key": "your_api_key",
  "course_id": "12345"
}
```

#### `POST /api/lms/sync` - LMS 데이터 동기화
```json
{
  "lms_integration_id": "uuid",
  "course_id": "12345",
  "sync_students": true,
  "sync_problems": true
}
```

---

## 💡 사용 예시

### 1. LMS에서 학생과 문제 가져오기

```typescript
import { api } from './services/api';

// Canvas LMS 연동 설정
const integration = await api.createLMSIntegration({
  lms_type: 'canvas',
  institution_name: 'KAIST',
  api_endpoint: 'https://canvas.kaist.ac.kr',
  api_key: 'your_api_key',
  course_id: '12345'
});

// 데이터 동기화
const result = await api.syncLMSData(
  integration.integration_id,
  '12345',
  true,  // 학생 동기화
  true   // 문제 동기화
);

console.log(`${result.synced_students}명 학생, ${result.synced_problems}개 문제 동기화됨`);
```

### 2. 학생이 문제 풀 때 팁 요청

```typescript
// 학생이 문제를 2번 틀렸을 때
const tipResponse = await api.requestTip({
  student_id: 'student-uuid',
  problem_id: 'problem-uuid',
  current_attempt_number: 3,
  time_spent_seconds: 180
});

// 맞춤 팁 표시
console.log(`
  추천 팁 (신뢰도: ${tipResponse.confidence_score * 100}%)
  [${tipResponse.tip.perspective_type}] ${tipResponse.tip.title_ko}

  ${tipResponse.tip.content_ko}

  대안: ${tipResponse.alternative_tips.length}개의 다른 관점 팁
`);
```

### 3. React 컴포넌트에서 사용

```tsx
import ProblemView from './components/ProblemView';

function App() {
  const problem = {
    id: 'problem-1',
    title: '이차함수의 그래프',
    content: {
      description: 'y = x² - 4x + 3의 그래프를 그리고 꼭짓점을 구하세요'
    },
    difficulty_level: 2,
    problem_type_id: 'quadratic-functions-uuid'
  };

  return (
    <ProblemView
      problem={problem}
      studentId="student-uuid"
      onSubmitAnswer={(answer, isCorrect) => {
        console.log('답안:', answer, '정답 여부:', isCorrect);
      }}
    />
  );
}
```

---

## 📈 팁 추천 알고리즘

### 스코어링 요소

1. **학생 선호 관점 일치도 (40%)**
   - 과거 효과적이었던 관점 우선 추천

2. **과거 팁 효과성 (30%)**
   - 이 학생에게 효과적이었던 팁 우선

3. **전체 사용자 효과성 (20%)**
   - 모든 학생에게 효과적인 팁

4. **시도 횟수/시간 적합도 (10%)**
   - 현재 상황에 맞는 팁

### 적응형 학습

- 학생이 팁에 피드백을 제공하면 학습 프로필 업데이트
- 어떤 관점이 효과적인지 지속적으로 학습
- 약점 영역에 대해 더 기초적인 팁 제공

---

## 🌐 지원 LMS

- ✅ **Canvas LMS**
- ✅ **Moodle**
- 🔄 **Blackboard** (계획 중)
- 🔄 **Google Classroom** (계획 중)

---

## 📝 개발 예제 데이터

`data/korean_math_tips.json` 파일에 다음 문제 유형별 팁 예제가 포함되어 있습니다:

- 이차함수 (3개 팁)
- 평면도형 (3개 팁)
- 입체도형 (3개 팁)
- 삼각함수 (3개 팁)
- 확률 (3개 팁)
- 미분 (3개 팁)
- 적분 (3개 팁)

---

## 🤝 기여하기

이 프로젝트는 한국 수학 교육 개선을 위한 오픈소스 프로젝트입니다.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

MIT License

---

## 📧 문의

- 프로젝트 관련 문의: alt42@kaist.ac.kr
- 이슈 트래킹: https://github.com/your-org/alt42/issues

---

## 🙏 감사의 말

이 프로젝트는 KAIST AI 교육 연구팀의 지원을 받아 개발되었습니다.
