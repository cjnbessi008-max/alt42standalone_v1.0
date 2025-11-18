# 🚀 Quick Start Guide

LMS 연동 Focus Card 시스템을 빠르게 시작하는 가이드입니다.

## 📋 사전 준비

### 필수 요구사항
- Python 3.8 이상
- Node.js 16 이상 (프론트엔드 사용 시)
- pip (Python 패키지 관리자)

### 선택사항
- Docker (컨테이너 환경 실행 시)
- PostgreSQL (데이터베이스 연동 시)

## ⚡ 5분 안에 시작하기

### 1단계: 저장소 클론

```bash
git clone [repository-url]
cd alt42standalone_v1.0
```

### 2단계: 백엔드 설정 및 실행

```bash
# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r backend/requirements.txt

# 서버 실행
cd backend/api
python complexity_api.py
```

서버가 http://localhost:8000 에서 실행됩니다!

### 3단계: API 테스트

브라우저에서 http://localhost:8000/docs 를 열어 Swagger UI를 확인하세요.

또는 curl로 테스트:

```bash
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

### 4단계: 복잡도 분석기 직접 테스트

```bash
cd backend/services
python complexity_analyzer.py
```

출력 예시:
```
=== Complex Problem ===
Level: complex
Requires Focus Card: True
Focus Message: 🎯 잠깐! 이 문제는 복잡도가 높습니다.

심호흡을 하고 차근차근 풀어봅시다.
```

## 🎨 프론트엔드 시작 (선택사항)

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

### 3. 환경변수 설정

`.env` 파일 생성:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 🧪 테스트 실행

### 백엔드 테스트

```bash
cd backend/services
pytest test_complexity_analyzer.py -v
```

기대 결과:
```
test_simple_problem_not_complex PASSED
test_high_condition_count_is_complex PASSED
test_analyze_complex_problem PASSED
...
```

## 📊 주요 API 엔드포인트

### 1. 복잡도 평가

```bash
POST http://localhost:8000/api/v1/assess-complexity
```

요청 예시:
```json
{
  "condition_count": 6,
  "nesting_depth": 4,
  "entity_count": 5,
  "has_cyclical_dependencies": false,
  "language": "ko"
}
```

### 2. LMS 메타데이터로 평가

```bash
POST http://localhost:8000/api/v1/lms/problem-metadata
```

요청 예시:
```json
{
  "problem_id": "math-001",
  "problem_type": "algebra",
  "difficulty_level": 4
}
```

### 3. 통계 정보

```bash
GET http://localhost:8000/api/v1/statistics
```

## 🔧 일반적인 문제 해결

### 문제: "ModuleNotFoundError: No module named 'fastapi'"

**해결책:**
```bash
pip install -r backend/requirements.txt
```

### 문제: "Port 8000 already in use"

**해결책:**
```bash
# 다른 포트 사용
uvicorn complexity_api:app --port 8001

# 또는 기존 프로세스 종료
lsof -ti:8000 | xargs kill -9  # Mac/Linux
```

### 문제: CORS 오류

**해결책:**
`backend/api/complexity_api.py`에서 CORS 설정 확인:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 주소
    ...
)
```

## 📚 다음 단계

### 학습 자료
1. [README.md](./README.md) - 전체 문서
2. [CHANGELOG.md](./CHANGELOG.md) - 변경 이력
3. [PRD](./tasks/0001-prd-ai-education-pipeline.md) - 제품 요구사항

### 코드 탐색
1. `backend/services/complexity_analyzer.py` - 핵심 로직
2. `frontend/src/components/ui/FocusCard.tsx` - UI 컴포넌트
3. `frontend/src/hooks/useFocusCard.ts` - React Hook

### 실전 예제
1. `frontend/src/components/ExampleUsage.tsx` - 통합 예제
2. `backend/services/test_complexity_analyzer.py` - 테스트 예제

## 🎯 실무 통합 예제

### React 앱에 통합

```typescript
import { useFocusCard } from './hooks/useFocusCard';
import FocusCard from './components/ui/FocusCard';

function MyProblemPage() {
  const {
    assessment,
    showFocusCard,
    assessComplexity,
    handleContinue
  } = useFocusCard();

  useEffect(() => {
    // 문제 로드 시 복잡도 평가
    assessComplexity({
      condition_count: 6,
      nesting_depth: 4,
      entity_count: 5,
      has_cyclical_dependencies: false,
    });
  }, []);

  return (
    <>
      {showFocusCard && assessment && (
        <FocusCard
          assessment={assessment}
          onContinue={handleContinue}
        />
      )}
      <div>/* 문제 내용 */</div>
    </>
  );
}
```

### LMS 플러그인 통합

```javascript
// Canvas LMS 예제
async function loadProblem(problemId) {
  // 1. LMS에서 문제 메타데이터 가져오기
  const problem = await canvas.getProblem(problemId);

  // 2. 복잡도 평가
  const assessment = await fetch('/api/v1/lms/problem-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_id: problemId,
      difficulty_level: problem.difficulty,
    }),
  }).then(r => r.json());

  // 3. Focus Card 표시 여부 결정
  if (assessment.requires_focus_card) {
    showFocusCard(assessment);
  }
}
```

## 💡 팁과 모범 사례

### 1. 복잡도 기준 조정
실제 학생 데이터를 기반으로 기준값 조정:

```python
# complexity_analyzer.py 수정
CONDITION_THRESHOLD = 5  # 기본값
NESTING_THRESHOLD = 3    # 기본값
ENTITY_THRESHOLD = 4     # 기본값
```

### 2. 캐싱 활용
반복 평가 시 캐싱으로 성능 향상:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def assess_cached(condition_count, nesting_depth, entity_count, has_cycles):
    # ...
```

### 3. 로깅 추가
프로덕션 환경에서 모니터링:

```python
import logging

logging.info(f"Assessment: {assessment.level}, Focus: {assessment.requires_focus_card}")
```

## 📞 도움말

### 문제가 해결되지 않나요?

1. **문서 확인**: [README.md](./README.md) 전체 문서
2. **API 문서**: http://localhost:8000/docs
3. **예제 코드**: `frontend/src/components/ExampleUsage.tsx`
4. **테스트 코드**: `backend/services/test_complexity_analyzer.py`

### 버그 리포트

이슈 발생 시 다음 정보를 포함해주세요:
- Python/Node.js 버전
- 에러 메시지 전체
- 재현 단계
- 기대 동작 vs 실제 동작

---

**즐거운 개발 되세요! 🚀**
