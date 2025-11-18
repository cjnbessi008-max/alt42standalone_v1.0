# AI Education System - Focus Card & LMS Integration

복잡도 높은 문제를 풀기 전에 학생들이 정신을 가다듬을 수 있도록 돕는 **Focus Card** 시스템입니다.

LMS(Learning Management System)와 연동되어, 문제의 복잡도를 자동으로 분석하고 필요한 경우 학생들에게 집중을 위한 카드를 표시합니다.

## 🎯 주요 기능

- **자동 복잡도 분석**: PRD FR-2.2 기준에 따라 문제의 복잡도를 자동으로 평가
- **정신 가다듬기 카드**: 복잡한 문제 전에 학생들이 준비할 수 있도록 안내
- **호흡 운동**: 5초간의 호흡 운동으로 집중력 향상
- **LMS 연동**: 기존 LMS 시스템과 쉽게 통합
- **다국어 지원**: 한국어 및 영어 지원
- **접근성**: WCAG 2.1 AA 준수

## 📊 복잡도 평가 기준 (PRD FR-2.2)

문제가 다음 기준 중 하나라도 초과하면 "복잡"으로 판단됩니다:

| 지표 | 복잡 기준 |
|------|----------|
| 조건 수 (Condition Count) | > 5 |
| 중첩 깊이 (Nesting Depth) | > 3 |
| 관련 개념 수 (Entity Count) | > 4 |
| 순환 의존성 | 있음 |

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                      # Python/FastAPI 백엔드
│   ├── services/
│   │   ├── complexity_analyzer.py    # 복잡도 분석 엔진
│   │   └── test_complexity_analyzer.py
│   ├── api/
│   │   └── complexity_api.py         # REST API 엔드포인트
│   └── models/
│
├── frontend/                     # React/TypeScript 프론트엔드
│   └── src/
│       ├── components/
│       │   ├── ui/
│       │   │   ├── FocusCard.tsx     # Focus Card 컴포넌트
│       │   │   └── FocusCard.css
│       │   └── ExampleUsage.tsx       # 사용 예제
│       ├── hooks/
│       │   └── useFocusCard.ts       # React Hook
│       ├── services/
│       │   └── complexityApi.ts      # API 클라이언트
│       └── types/
│           └── complexity.ts          # TypeScript 타입
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md
```

## 🚀 빠른 시작

### 백엔드 실행

```bash
# Python 의존성 설치
pip install fastapi uvicorn pydantic

# 백엔드 서버 실행
cd backend/api
python complexity_api.py
```

서버가 http://localhost:8000 에서 실행됩니다.

### API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 프론트엔드 설정

```bash
cd frontend

# package.json 생성 (예정)
npm init -y

# 의존성 설치
npm install react react-dom typescript @types/react @types/react-dom

# 개발 서버 실행
npm start
```

## 📖 사용 방법

### 1. 기본 사용 (React Hook 사용)

```typescript
import { useFocusCard } from './hooks/useFocusCard';
import FocusCard from './components/ui/FocusCard';

function ProblemPage() {
  const {
    assessment,
    showFocusCard,
    assessComplexity,
    handleContinue,
  } = useFocusCard({ language: 'ko' });

  // 문제 로드 시 복잡도 평가
  useEffect(() => {
    assessComplexity({
      condition_count: 6,
      nesting_depth: 4,
      entity_count: 5,
      has_cyclical_dependencies: false,
    });
  }, []);

  return (
    <>
      {/* Focus Card 표시 */}
      {showFocusCard && assessment && (
        <FocusCard
          assessment={assessment}
          onContinue={handleContinue}
          language="ko"
        />
      )}

      {/* 문제 내용 */}
      <div>...</div>
    </>
  );
}
```

### 2. LMS 연동

```typescript
// LMS에서 문제 메타데이터를 사용하여 복잡도 평가
const { assessFromLMS } = useFocusCard();

assessFromLMS({
  problem_id: 'fraction-advanced-001',
  problem_type: 'fraction_arithmetic',
  difficulty_level: 5,  // LMS의 난이도 레벨
  estimated_time_minutes: 15,
  prerequisites: ['basic_fractions', 'common_denominator'],
});
```

### 3. 직접 API 호출

```bash
# 복잡도 평가
curl -X POST "http://localhost:8000/api/v1/assess-complexity" \
  -H "Content-Type: application/json" \
  -d '{
    "condition_count": 6,
    "nesting_depth": 4,
    "entity_count": 5,
    "has_cyclical_dependencies": false,
    "language": "ko"
  }'
```

## 🧪 테스트

### 백엔드 테스트

```bash
cd backend/services

# pytest 설치
pip install pytest

# 테스트 실행
python test_complexity_analyzer.py
# 또는
pytest test_complexity_analyzer.py -v
```

### 복잡도 분석기 직접 테스트

```bash
cd backend/services
python complexity_analyzer.py
```

출력 예시:
```
=== Simple Problem ===
Level: simple
Requires Focus Card: False

=== Complex Problem ===
Level: complex
Requires Focus Card: True
Focus Message: 🎯 잠깐! 이 문제는 복잡도가 높습니다.

심호흡을 하고 차근차근 풀어봅시다.
```

## 🎨 Focus Card 기능

### 호흡 운동
- 카드가 표시되면 처음 5초 동안 호흡 운동 안내
- 들숨(3초) / 날숨(3초) 애니메이션

### 복잡도 정보
- 복잡도 레벨 표시 (Simple, Moderate, Complex, Very Complex)
- 세부 지표 (조건 수, 중첩 깊이, 관련 개념, 순환 관계)

### 추천 전략
- 문제 해결을 위한 맞춤형 학습 전략 제공
- 복잡도에 따른 구체적인 조언

### 행동 옵션
- **문제 풀러 가기**: Focus Card를 닫고 문제로 이동
- **도움 요청**: 선생님이나 튜터에게 도움 요청

## 🔌 API 엔드포인트

### POST `/api/v1/assess-complexity`
단일 문제의 복잡도 평가

**Request:**
```json
{
  "condition_count": 6,
  "nesting_depth": 4,
  "entity_count": 5,
  "has_cyclical_dependencies": false,
  "language": "ko"
}
```

**Response:**
```json
{
  "metrics": {
    "condition_count": 6,
    "nesting_depth": 4,
    "entity_count": 5,
    "has_cyclical_dependencies": false
  },
  "level": "complex",
  "requires_focus_card": true,
  "recommendations": [
    "Break down the conditions into smaller logical groups",
    "Consider simplifying the nested logic or using visual aids"
  ],
  "focus_message": "🎯 잠깐! 이 문제는 복잡도가 높습니다.\n\n심호흡을 하고 차근차근 풀어봅시다."
}
```

### POST `/api/v1/assess-complexity/batch`
여러 문제를 한 번에 평가

### POST `/api/v1/lms/problem-metadata`
LMS 메타데이터를 사용한 복잡도 평가

### GET `/api/v1/statistics`
복잡도 기준 및 통계 정보

### GET `/health`
서버 상태 확인

## 🌐 LMS 통합 가이드

### Canvas LMS
```javascript
// Canvas LMS assignment에서 호출
const assessComplexity = async (assignmentId) => {
  const response = await fetch('/api/v1/lms/problem-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_id: assignmentId,
      problem_type: 'assignment',
      difficulty_level: assignment.points_possible / 20,  // 100점 만점 -> 5점 척도
    }),
  });
  return response.json();
};
```

### Moodle
```php
// Moodle quiz에서 호출
$complexity_data = array(
    'problem_id' => $question->id,
    'problem_type' => $question->qtype,
    'difficulty_level' => $question->difficulty,
);

$ch = curl_init('http://localhost:8000/api/v1/lms/problem-metadata');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($complexity_data));
// ...
```

## 📱 접근성 (Accessibility)

- **키보드 탐색**: 모든 기능을 키보드로 사용 가능
- **스크린 리더**: ARIA labels 및 역할 정의
- **고대비 모드**: 시각 장애인을 위한 고대비 지원
- **애니메이션 감소**: `prefers-reduced-motion` 지원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🔧 환경 변수

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

### Backend
```
# 추후 추가 예정
# DATABASE_URL=postgresql://...
# KAIST_SSO_URL=...
```

## 📋 요구사항

### Backend
- Python 3.8+
- FastAPI
- Pydantic
- Uvicorn

### Frontend
- React 18+
- TypeScript 4.5+
- Node.js 16+

## 🗺️ 로드맵

### Phase 1 (현재)
- ✅ 복잡도 분석 엔진
- ✅ Focus Card UI 컴포넌트
- ✅ REST API
- ✅ LMS 통합 인터페이스

### Phase 2 (예정)
- [ ] 데이터베이스 연동 (PostgreSQL)
- [ ] 사용자 인증 (KAIST SSO)
- [ ] 분석 결과 저장 및 이력 관리
- [ ] 학생별 맞춤 복잡도 기준

### Phase 3 (예정)
- [ ] 머신러닝 기반 복잡도 예측
- [ ] 실시간 학생 반응 분석
- [ ] A/B 테스트 프레임워크
- [ ] 다양한 LMS 플랫폼 공식 플러그인

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 📄 라이선스

내부 프로젝트 - KAIST Touch Math Academy

## 📞 문의

- 기술 문의: Development Team Lead
- 교육 관련 문의: Educational Team Lead
- 제품 관련 문의: Product Owner

---

**Built with ❤️ for better education**
