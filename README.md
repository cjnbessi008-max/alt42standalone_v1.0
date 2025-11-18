# 🎯 Key Condition Auto-Highlighter

확률 및 조합론 문제의 핵심 조건을 **자동으로 분석하고 강조**하는 AI 교육 시스템

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [설치 및 실행](#설치-및-실행)
- [사용 방법](#사용-방법)
- [기술 스택](#기술-스택)
- [향후 계획](#향후-계획)

## 개요

이 시스템은 **KAIST Touch Math Academy**를 위한 AI 교육 파이프라인의 핵심 기능으로, 수학 문제(특히 확률 및 조합론)에서 학생들이 반드시 이해해야 할 **핵심 조건을 자동으로 식별하고 시각적으로 강조**합니다.

### 💡 문제 해결

학생들은 종종 문제를 읽을 때 중요한 조건을 놓치거나 간과합니다:
- ❌ "단, 각 공을 선택할 확률은 모두 같다" → 놓치면 틀린 접근
- ❌ "독립적으로 던져진다" → 조건부 확률 vs 독립 확률
- ❌ "순서를 고려하지 않는다" → 순열 vs 조합

### ✅ 우리의 솔루션

AI가 자동으로:
1. 📖 문제 텍스트를 분석
2. 🔍 핵심 조건을 추출 (독립성, 제약조건, 가정 등)
3. 🎨 조건별로 색상 코딩하여 강조
4. 💬 각 조건에 대한 설명 툴팁 제공
5. 📱 모바일 최적화 UI로 표시

## 주요 기능

### 🔍 자동 조건 추출

Python NLP 엔진이 다음을 자동으로 감지합니다:

| 조건 유형 | 예시 | 중요도 | 색상 |
|---------|------|-------|------|
| **독립성** 🔗 | "독립적으로", "서로 독립" | Critical | 파란색 |
| **제약조건** ⚠️ | "단", "다만", "조건은" | Critical | 노란색 |
| **가정** ℹ️ | "가정하자", "~라고 할 때" | High | 녹색 |
| **확률** 📊 | "확률은", "P(A)" | High | 분홍색 |
| **사건** 🎯 | "경우", "사건 A" | Medium | 청록색 |
| **표본공간** 📋 | "표본 공간", "전체 경우의 수" | Medium | 주황색 |

### 🎨 시각적 하이라이트

- **색상 코딩**: 조건 유형별 구분 (색맹 접근성 고려)
- **중요도 표시**: 굵기, 밑줄 등으로 중요도 구분
- **인터랙티브 툴팁**: 클릭/탭으로 자세한 설명 표시
- **모바일 최적화**: 375px 스마트폰 화면 완벽 지원

### 📱 반응형 디자인

```
📱 Mobile (375px)  →  태블릿 (768px)  →  🖥️ Desktop (1200px+)
```

- 터치 친화적 인터페이스
- 가독성 높은 폰트 크기
- 스크린 리더 지원 (접근성)

## 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│         Frontend (React + TypeScript)       │
│  ┌──────────────────────────────────────┐  │
│  │ HighlightedProblemRenderer Component │  │
│  │  - 문제 표시                          │  │
│  │  - 하이라이트 렌더링                   │  │
│  │  - 툴팁 관리                          │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ JSON API
┌─────────────────▼───────────────────────────┐
│      Backend (Python + FastAPI)             │
│  ┌──────────────────────────────────────┐  │
│  │ ProbabilityTextProcessor             │  │
│  │  - 정규식 패턴 매칭                   │  │
│  │  - 조건 추출 및 분류                  │  │
│  │  - 중요도 분석                        │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ ProblemRenderer                      │  │
│  │  - 렌더링 데이터 생성                 │  │
│  │  - JSON 직렬화                        │  │
│  │  - 스타일 정보 제공                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Database (PostgreSQL)                 │
│  - problems (문제 저장)                     │
│  - key_conditions (조건 메타데이터)         │
│  - highlight_styles (스타일 정의)           │
│  - student_interactions (학습 분석)         │
└─────────────────────────────────────────────┘
```

## 설치 및 실행

### 1️⃣ 사전 요구사항

```bash
# Python 3.11+
python --version

# Node.js 18+ (프론트엔드)
node --version

# PostgreSQL 15+ (옵션)
psql --version
```

### 2️⃣ 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 3️⃣ 백엔드 설정 (Python)

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치 (향후 requirements.txt 추가 예정)
# pip install -r requirements.txt

# 텍스트 프로세서 테스트
cd backend/pipeline_orchestrator/rule_engine
python text_processor.py
```

### 4️⃣ 프론트엔드 설정 (React)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 5️⃣ 데이터베이스 설정 (옵션)

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE key_condition_db;

# 스키마 적용
\i database/schemas/problem_metadata.sql
```

### 6️⃣ 데모 실행

가장 빠른 방법:

```bash
# 브라우저에서 열기
open frontend/public/demo.html
# 또는
firefox frontend/public/demo.html
```

## 사용 방법

### Python API 사용

```python
from rule_engine.text_processor import ProbabilityTextProcessor

# 프로세서 초기화
processor = ProbabilityTextProcessor()

# 문제 텍스트
problem = """
주머니에 빨간 공 3개와 파란 공 5개가 들어있다.
이 주머니에서 임의로 2개의 공을 동시에 꺼낼 때,
두 공이 모두 같은 색일 확률을 구하시오.
단, 각 공을 선택할 확률은 모두 같다.
"""

# 조건 추출
result = processor.generate_highlight_metadata(problem, "prob_001")

# 결과 확인
print(f"발견된 조건: {result['total_conditions']}개")
for condition in result['conditions']:
    print(f"- {condition['type']}: {condition['text']}")
```

### React 컴포넌트 사용

```typescript
import { HighlightedProblemRenderer } from './components/ProblemDisplay/HighlightedProblemRenderer';

const App = () => {
  const problemData = {
    problem_id: "prob_001",
    problem_text: "주머니에 빨간 공 3개와...",
    total_conditions: 2,
    conditions: [
      {
        id: 0,
        text: "단, 각 공을 선택할 확률은 모두 같다",
        start_pos: 85,
        end_pos: 107,
        type: "constraint",
        category: "constraint",
        importance: "critical",
        explanation: "문제 해결을 위해 반드시 고려해야 할 제약 조건입니다."
      }
    ]
  };

  return (
    <HighlightedProblemRenderer
      problemData={problemData}
      enableTooltips={true}
      highlightMode="click"
    />
  );
};
```

### 완전한 파이프라인 예제

```python
from ui_generator.problem_renderer import ProblemRenderer

renderer = ProblemRenderer()

# 문제 처리
problem = "주머니에 빨간 공 3개와 파란 공 5개가..."
result = renderer.process_problem(
    problem,
    problem_id="prob_001",
    problem_type="probability",
    language="ko"
)

# JSON으로 저장 (API 응답용)
renderer.save_to_file(problem, "output.json")

# 또는 JSON 문자열 생성
json_str = renderer.generate_json(problem)
```

## 기술 스택

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI (향후)
- **NLP**: 정규식 기반 패턴 매칭 (향후 spaCy/NLTK 통합 고려)
- **Database**: PostgreSQL 15+

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 (모바일 우선)

### Database Schema
- `problems`: 문제 저장
- `key_conditions`: 추출된 조건 메타데이터
- `highlight_styles`: 조건 유형별 스타일 정의
- `student_interactions`: 학습 분석 데이터

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   └── pipeline_orchestrator/
│       ├── rule_engine/
│       │   └── text_processor.py      # 핵심 조건 추출 엔진
│       └── ui_generator/
│           └── problem_renderer.py    # 렌더링 데이터 생성
│
├── database/
│   └── schemas/
│       └── problem_metadata.sql       # DB 스키마
│
├── frontend/
│   ├── src/
│   │   └── components/
│   │       └── ProblemDisplay/
│   │           ├── HighlightedProblemRenderer.tsx  # 메인 컴포넌트
│   │           └── styles.css                       # 스타일
│   ├── public/
│   │   └── demo.html                  # 독립 실행형 데모
│   └── package.json
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # PRD
│
└── README.md                          # 이 문서
```

## 향후 계획

### Phase 1: 코어 기능 완성 ✅
- [x] Python 텍스트 프로세서
- [x] React 하이라이트 컴포넌트
- [x] 데이터베이스 스키마
- [x] 독립 실행형 데모

### Phase 2: AI 강화 (진행 예정)
- [ ] Claude AI 통합 (더 정확한 조건 추출)
- [ ] 의미론적 분석 (단순 키워드를 넘어서)
- [ ] 다국어 지원 확장

### Phase 3: LMS 통합 (진행 예정)
- [ ] Moodle 3.7+ 플러그인
- [ ] LTI (Learning Tools Interoperability) 표준 지원
- [ ] Canvas, Blackboard 연동

### Phase 4: 학습 분석 (진행 예정)
- [ ] 학생 인터랙션 추적
- [ ] 조건별 이해도 분석
- [ ] 적응형 난이도 조절

## 기여 방법

이 프로젝트는 KAIST Touch Math Academy의 일부입니다. 기여를 원하시면:

1. 이슈 생성
2. Pull Request 제출
3. 코드 리뷰 참여

## 라이센스

MIT License

## 문의

- **기술 문의**: [개발팀 이메일]
- **교육 관련 문의**: [교육팀 이메일]
- **버그 리포트**: GitHub Issues

---

**Made with ❤️ by KAIST Touch Math Academy**
