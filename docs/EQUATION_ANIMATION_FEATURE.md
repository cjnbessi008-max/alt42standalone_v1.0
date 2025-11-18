# Equation Simplification Animation Feature

## 개요 (Overview)

KAIST Touch Math Academy AI 교육 시스템을 위한 수식 정리 시각 애니메이션 기능입니다. 이 기능은 수학 방정식의 단계별 풀이 과정을 시각적 애니메이션으로 제공하여 학생들의 이해를 돕습니다.

This is an equation simplification visual animation feature for the KAIST Touch Math Academy AI Education System. It helps students understand mathematical concepts by providing step-by-step visual animations of equation solving processes.

---

## 주요 기능 (Key Features)

### 1. 자동 수식 정리 (Automatic Equation Simplification)
- **SymPy 기반**: Python의 강력한 수학 라이브러리 사용
- **다양한 전략**: 자동(auto), 전개(expand), 인수분해(factor), 정리(collect)
- **LaTeX 지원**: 수학 표기법 표준 지원

### 2. 단계별 애니메이션 (Step-by-Step Animation)
- **Framer Motion**: 부드러운 전환 효과
- **하이라이팅**: 변경된 요소 강조 표시
- **재생 제어**: 재생/일시정지, 이전/다음 단계, 속도 조절

### 3. 학습 추적 (Learning Analytics)
- **상호작용 기록**: 모든 학생 행동 추적
- **진도 관리**: 모듈별 학습 진도 확인
- **성과 분석**: 정답률, 소요 시간, 힌트 사용 등

### 4. LMS 연동 (LMS Integration)
- **RESTful API**: 표준 HTTP API로 통합 용이
- **모듈화 설계**: 기존 시스템에 쉽게 통합
- **확장 가능**: 향후 LTI 표준 지원 예정

---

## 기술 스택 (Technology Stack)

### Frontend
- **React 18+**: 컴포넌트 기반 UI 프레임워크
- **TypeScript**: 타입 안전성
- **KaTeX**: 수학 수식 렌더링
- **Framer Motion**: 애니메이션 라이브러리
- **Material-UI**: UI 컴포넌트 라이브러리

### Backend
- **FastAPI**: 고성능 Python 웹 프레임워크
- **SymPy**: 수학 처리 라이브러리
- **PostgreSQL**: 관계형 데이터베이스
- **Redis**: 캐싱 및 세션 관리

---

## 프로젝트 구조 (Project Structure)

```
alt42standalone_v1.0/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── equations/
│       │       ├── EquationRenderer.tsx      # 수식 렌더링
│       │       ├── EquationAnimator.tsx      # 애니메이션 제어
│       │       └── StepViewer.tsx            # 단계 목록
│       ├── types/
│       │   └── equation.types.ts             # TypeScript 타입
│       └── styles/
│           ├── equation-renderer.css
│           ├── equation-animator.css
│           └── step-viewer.css
├── backend/
│   └── src/
│       ├── api/
│       │   └── equations.py                  # API 엔드포인트
│       ├── services/
│       │   └── equation_simplifier.py        # 수식 처리 서비스
│       ├── main.py                           # FastAPI 앱
│       └── requirements.txt
├── database/
│   └── schema.sql                            # PostgreSQL 스키마
└── docs/
    └── EQUATION_ANIMATION_FEATURE.md         # 이 문서
```

---

## 설치 및 실행 (Installation & Setup)

### 1. 사전 요구사항 (Prerequisites)
```bash
# Node.js 18+ and Python 3.11+
node --version  # v18.0.0 or higher
python --version  # 3.11.0 or higher

# PostgreSQL 15+
psql --version  # 15.0 or higher
```

### 2. 백엔드 설정 (Backend Setup)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run the server
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정 (Frontend Setup)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install required packages
npm install katex framer-motion @types/katex

# Start development server
npm run dev  # or npm start
```

### 4. 데이터베이스 설정 (Database Setup)
```bash
# Create database
createdb kaist_math_academy

# Run schema
psql -d kaist_math_academy -f database/schema.sql
```

---

## API 사용법 (API Usage)

### 엔드포인트 (Endpoints)

#### 1. 수식 정리 (Simplify Equation)
```http
POST /api/equations/simplify
Content-Type: application/json

{
  "equation": "(x + 2) * (x + 3)",
  "strategy": "auto",
  "topic": "polynomials",
  "gradeLevel": "8",
  "difficulty": 3
}
```

**응답 (Response):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "original": "\\left(x + 2\\right) \\left(x + 3\\right)",
  "simplified": "x^{2} + 5 x + 6",
  "steps": [
    {
      "id": "step-1",
      "equation": "\\left(x + 2\\right) \\left(x + 3\\right)",
      "description": "시작 수식",
      "rule": "입력",
      "delay": 0,
      "changedElements": [],
      "highlightColor": "#FFA726"
    },
    {
      "id": "step-2",
      "equation": "x^{2} + 3 x + 2 x + 6",
      "description": "괄호를 풀어서 전개합니다",
      "rule": "분배 법칙",
      "delay": 1500,
      "changedElements": ["x^2", "3*x", "2*x", "6"],
      "highlightColor": "#FFA726"
    },
    {
      "id": "step-3",
      "equation": "x^{2} + 5 x + 6",
      "description": "동류항을 모읍니다",
      "rule": "동류항 정리",
      "delay": 1500,
      "changedElements": ["5*x"],
      "highlightColor": "#FFA726"
    }
  ],
  "difficulty": 3,
  "topic": "polynomials",
  "gradeLevel": "8"
}
```

#### 2. 방정식 풀이 (Solve Equation)
```http
POST /api/equations/solve
Content-Type: application/json

{
  "equation": "2*x + 5 = 13",
  "variable": "x",
  "topic": "linear_equations",
  "gradeLevel": "7",
  "difficulty": 2
}
```

#### 3. 헬스 체크 (Health Check)
```http
GET /api/equations/health
```

---

## React 컴포넌트 사용법 (React Component Usage)

### EquationRenderer
수식을 LaTeX 형식으로 렌더링합니다.

```tsx
import { EquationRenderer } from './components/equations/EquationRenderer';

function MyComponent() {
  return (
    <EquationRenderer
      equation="x^2 + 5x + 6"
      displayMode={true}
      highlightElements={["5x"]}
      highlightColor="#FFA726"
    />
  );
}
```

### EquationAnimator
수식 정리 과정을 애니메이션으로 표시합니다.

```tsx
import { EquationAnimator } from './components/equations/EquationAnimator';
import { EquationProblem } from './types/equation.types';

function MyComponent() {
  const problem: EquationProblem = {
    // ... problem data from API
  };

  const handleStepChange = (stepIndex: number, step: EquationStep) => {
    console.log(`Now showing step ${stepIndex + 1}`);
  };

  const handleComplete = () => {
    console.log('Animation completed!');
  };

  const handleInteraction = (event: InteractionEvent) => {
    console.log('User interaction:', event);
  };

  return (
    <EquationAnimator
      problem={problem}
      config={{
        autoPlay: false,
        speedMultiplier: 1.0,
        highlightColor: '#FFA726',
      }}
      onStepChange={handleStepChange}
      onComplete={handleComplete}
      onInteraction={handleInteraction}
    />
  );
}
```

### StepViewer
수식 단계를 목록으로 표시합니다.

```tsx
import { StepViewer } from './components/equations/StepViewer';

function MyComponent() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <StepViewer
      steps={problem.steps}
      currentStep={currentStep}
      onStepSelect={(index) => setCurrentStep(index)}
      showDescriptions={true}
      showRules={true}
    />
  );
}
```

---

## 데이터베이스 스키마 (Database Schema)

### 주요 테이블 (Main Tables)

#### equation_problems
수식 문제 정보를 저장합니다.

```sql
CREATE TABLE equation_problems (
    id UUID PRIMARY KEY,
    module_id UUID,
    original_equation TEXT,
    simplified_equation TEXT,
    topic VARCHAR(100),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### equation_steps
각 문제의 단계별 풀이를 저장합니다.

```sql
CREATE TABLE equation_steps (
    id UUID PRIMARY KEY,
    problem_id UUID REFERENCES equation_problems(id),
    step_number INTEGER,
    equation_latex TEXT,
    description TEXT,
    rule_applied VARCHAR(255),
    delay_ms INTEGER DEFAULT 1500,
    changed_elements JSONB DEFAULT '[]'
);
```

#### student_attempts
학생의 문제 풀이 시도를 기록합니다.

```sql
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY,
    student_id UUID,
    problem_id UUID,
    student_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hints_requested INTEGER,
    interactions JSONB,
    attempted_at TIMESTAMP DEFAULT NOW()
);
```

---

## 기능 확장 (Feature Extensions)

### 1. 새로운 수식 전략 추가
```python
# backend/src/services/equation_simplifier.py

def _custom_strategy_with_steps(self, expr: Expr) -> None:
    """Custom simplification strategy"""
    # Implement your custom logic
    result = your_custom_simplification(expr)

    self.steps.append(EquationStep(
        equation=self.to_latex(result),
        description="사용자 정의 규칙 적용",
        rule="Custom rule",
        changed_elements=self._find_changed_terms(expr, result),
    ))
```

### 2. 새로운 애니메이션 효과
```tsx
// frontend/src/components/equations/EquationAnimator.tsx

const customVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.2 }
};
```

### 3. LMS 연동 확장
```python
# backend/src/api/lms_integration.py

@router.post("/api/lms/canvas/sync")
async def sync_with_canvas(assignment_id: str):
    """Sync equation problems with Canvas LMS"""
    # Implementation for Canvas integration
    pass
```

---

## 성능 최적화 (Performance Optimization)

### 1. 캐싱 전략
- **Redis**: 자주 사용되는 수식 결과 캐싱
- **CDN**: 정적 리소스(CSS, 이미지) 전송 최적화
- **메모이제이션**: React 컴포넌트 렌더링 최적화

### 2. 데이터베이스 최적화
- **인덱스**: 자주 쿼리되는 컬럼에 인덱스 생성
- **파티셔닝**: 대용량 데이터 테이블 분할
- **쿼리 최적화**: N+1 문제 해결

### 3. 프론트엔드 최적화
- **코드 스플리팅**: 필요한 코드만 로드
- **Lazy Loading**: 컴포넌트 지연 로딩
- **Virtual Scrolling**: 긴 단계 목록 최적화

---

## 보안 고려사항 (Security Considerations)

### 1. 입력 검증
- **수식 검증**: 안전하지 않은 수식 차단
- **SQL Injection 방지**: 파라미터화된 쿼리 사용
- **XSS 방지**: 사용자 입력 이스케이프

### 2. 인증 및 권한
- **JWT 토큰**: API 인증
- **RBAC**: 역할 기반 접근 제어
- **CORS**: 허용된 도메인만 API 접근

### 3. 데이터 보호
- **암호화**: 민감 데이터 암호화 (AES-256)
- **HTTPS**: 전송 중 데이터 보호 (TLS 1.3)
- **감사 로그**: 모든 중요 작업 기록

---

## 테스트 (Testing)

### 1. 단위 테스트 (Unit Tests)
```python
# backend/tests/test_equation_simplifier.py

def test_simplify_polynomial():
    simplifier = EquationSimplifier()
    steps = simplifier.simplify_with_steps("(x+2)*(x+3)")
    assert len(steps) > 0
    assert steps[-1].equation.contains("x^2")
```

### 2. 통합 테스트 (Integration Tests)
```python
# backend/tests/test_api.py

async def test_simplify_endpoint():
    response = await client.post("/api/equations/simplify", json={
        "equation": "(x+2)*(x+3)",
        "strategy": "auto"
    })
    assert response.status_code == 200
    assert "steps" in response.json()
```

### 3. E2E 테스트 (End-to-End Tests)
```typescript
// frontend/tests/e2e/equation-animator.spec.ts

test('should animate equation simplification', async ({ page }) => {
  await page.goto('/equation-animator');
  await page.click('button[aria-label="Play"]');
  await expect(page.locator('.equation-display')).toBeVisible();
});
```

---

## 트러블슈팅 (Troubleshooting)

### 문제: KaTeX 렌더링 오류
**해결**: KaTeX가 지원하는 LaTeX 문법 확인
```tsx
// Invalid LaTeX 확인
try {
  katex.render(equation, container);
} catch (error) {
  console.error('LaTeX error:', error);
}
```

### 문제: 애니메이션 끊김
**해결**: requestAnimationFrame 사용
```tsx
const smoothTransition = useCallback(() => {
  requestAnimationFrame(() => {
    // Animation logic
  });
}, []);
```

### 문제: SymPy 파싱 실패
**해결**: 입력 형식 검증
```python
def validate_equation(equation_str: str) -> bool:
    """Validate equation format before parsing"""
    # Check for dangerous patterns
    if 'eval' in equation_str or 'exec' in equation_str:
        return False
    return True
```

---

## 향후 개발 계획 (Future Roadmap)

### Phase 1 (완료 / Completed)
- ✅ 기본 수식 정리 기능
- ✅ 단계별 애니메이션
- ✅ React 컴포넌트
- ✅ FastAPI 백엔드
- ✅ PostgreSQL 스키마

### Phase 2 (진행 중 / In Progress)
- 🔄 LMS 통합 (Canvas, Moodle)
- 🔄 고급 수식 지원 (미적분, 삼각함수)
- 🔄 실시간 협업 기능
- 🔄 AI 기반 힌트 제공

### Phase 3 (계획 / Planned)
- 📋 모바일 앱 지원
- 📋 음성 입력/출력
- 📋 3D 시각화
- 📋 게임화 요소

---

## 기여 가이드 (Contributing)

### 코드 스타일
- **Python**: PEP 8 준수, Black 포맷터 사용
- **TypeScript**: ESLint 규칙 준수, Prettier 사용
- **Commit**: Conventional Commits 형식

### Pull Request 프로세스
1. 기능 브랜치 생성: `git checkout -b feature/new-feature`
2. 변경사항 커밋: `git commit -m "feat: add new feature"`
3. 테스트 작성 및 실행: `pytest` / `npm test`
4. PR 생성 및 리뷰 요청

---

## 라이선스 (License)

MIT License - KAIST Touch Math Academy

---

## 문의 (Contact)

- **이메일**: support@kaist-math.edu
- **문서**: https://docs.kaist-math.edu
- **이슈 트래커**: https://github.com/kaist-math/issues

---

## 참고 자료 (References)

- [SymPy Documentation](https://docs.sympy.org/)
- [KaTeX Documentation](https://katex.org/docs/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
