# KAIST Touch Math Academy - AI Education System

## LMS 연동 수식 정리 시각 애니메이션 기능

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)

---

## 📋 프로젝트 개요

KAIST Touch Math Academy의 AI 교육 시스템 파이프라인 중 **수식 정리 시각 애니메이션** 기능을 구현한 프로젝트입니다. 학생들이 수학 방정식의 단계별 풀이 과정을 시각적으로 이해할 수 있도록 돕습니다.

### 주요 기능

- 🧮 **자동 수식 정리**: SymPy를 활용한 지능형 방정식 단순화
- 🎬 **단계별 애니메이션**: Framer Motion 기반의 부드러운 전환 효과
- 📊 **학습 분석**: 학생 상호작용 및 성과 추적
- 🔗 **LMS 연동**: RESTful API를 통한 LMS 통합 지원

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 설치

#### 1. 백엔드 설정
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env

# 서버 실행
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

#### 3. 데이터베이스 설정
```bash
createdb kaist_math_academy
psql -d kaist_math_academy -f database/schema.sql
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── equations/
│   │   │       ├── EquationRenderer.tsx
│   │   │       ├── EquationAnimator.tsx
│   │   │       └── StepViewer.tsx
│   │   ├── types/
│   │   │   └── equation.types.ts
│   │   └── styles/
│   └── package.json
├── backend/                # Python FastAPI 백엔드
│   ├── src/
│   │   ├── api/
│   │   │   └── equations.py
│   │   ├── services/
│   │   │   └── equation_simplifier.py
│   │   └── main.py
│   └── requirements.txt
├── database/               # PostgreSQL 스키마
│   └── schema.sql
├── docs/                   # 문서
│   └── EQUATION_ANIMATION_FEATURE.md
└── tasks/                  # PRD 및 작업 문서
    └── 0001-prd-ai-education-pipeline.md
```

---

## 🎯 사용 예제

### API 호출
```bash
# 수식 정리
curl -X POST "http://localhost:8000/api/equations/simplify" \
  -H "Content-Type: application/json" \
  -d '{
    "equation": "(x + 2) * (x + 3)",
    "strategy": "auto",
    "topic": "polynomials",
    "gradeLevel": "8",
    "difficulty": 3
  }'
```

### React 컴포넌트 사용
```tsx
import { EquationAnimator } from './components/equations/EquationAnimator';

function App() {
  return (
    <EquationAnimator
      problem={problemData}
      config={{
        autoPlay: true,
        speedMultiplier: 1.0,
      }}
      onComplete={() => console.log('Animation complete!')}
    />
  );
}
```

---

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **KaTeX** - 수학 수식 렌더링
- **Framer Motion** - 애니메이션
- **Vite** - 빌드 도구

### Backend
- **FastAPI** - 웹 프레임워크
- **SymPy** - 수학 처리
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐싱
- **Pydantic** - 데이터 검증

---

## 📖 문서

- [전체 기능 문서](./docs/EQUATION_ANIMATION_FEATURE.md)
- [PRD 문서](./tasks/0001-prd-ai-education-pipeline.md)
- [API 문서](http://localhost:8000/docs) - 서버 실행 후 접속

---

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
pytest
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

---

## 📊 데이터베이스 스키마

주요 테이블:
- `equation_problems` - 수식 문제
- `equation_steps` - 단계별 풀이
- `student_attempts` - 학생 시도
- `student_progress` - 학습 진도
- `animation_events` - 상호작용 이벤트

자세한 내용은 [schema.sql](./database/schema.sql) 참조

---

## 🔐 보안

- JWT 기반 인증
- SQL Injection 방지 (파라미터화된 쿼리)
- XSS 방지 (입력 이스케이프)
- HTTPS/TLS 1.3 암호화
- CORS 정책 적용

---

## 🚧 개발 로드맵

### ✅ Phase 1 (완료)
- [x] 기본 수식 정리 기능
- [x] 단계별 애니메이션
- [x] React 컴포넌트
- [x] FastAPI 백엔드
- [x] PostgreSQL 스키마

### 🔄 Phase 2 (진행 중)
- [ ] LMS 통합 (Canvas, Moodle)
- [ ] 고급 수식 지원
- [ ] 실시간 협업
- [ ] AI 힌트 제공

### 📋 Phase 3 (계획)
- [ ] 모바일 앱
- [ ] 음성 지원
- [ ] 3D 시각화
- [ ] 게임화

---

## 🤝 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코드 스타일
- Python: PEP 8, Black formatter
- TypeScript: ESLint, Prettier
- Commits: Conventional Commits

---

## 📝 라이선스

MIT License - KAIST Touch Math Academy

---

## 📧 문의

- **이메일**: support@kaist-math.edu
- **프로젝트**: KAIST Touch Math Academy AI Education System
- **버전**: 1.0.0

---

## 🙏 감사의 말

- KAIST Touch Math Academy
- SymPy Community
- FastAPI Team
- React & Framer Motion Teams

---

## 📚 참고 자료

- [SymPy Documentation](https://docs.sympy.org/)
- [KaTeX Documentation](https://katex.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [FastAPI](https://fastapi.tiangolo.com/)

---

**Made with ❤️ by KAIST Touch Math Academy**
