# AI Education System Pipeline

> 교사의 자연어 요청을 완전한 교육 모듈로 자동 변환하는 지능형 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [최신 기능: LMS 연동 및 실수 재발률 자동 표시](#최신-기능-lms-연동-및-실수-재발률-자동-표시)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [설치 및 설정](#설치-및-설정)
- [사용법](#사용법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [개발 로드맵](#개발-로드맵)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

---

## 🎯 프로젝트 개요

**AI Education System Pipeline**은 KAIST Touch Math Academy를 위해 개발된 혁신적인 교육 시스템입니다. 교사가 자연어로 원하는 교육 모듈을 설명하면, AI가 자동으로 데이터베이스 스키마, 비즈니스 로직, 사용자 인터페이스를 생성하는 end-to-end 파이프라인입니다.

### 핵심 가치

- **교육 기술의 민주화**: 코딩 지식 없이도 복잡한 교육 시스템 생성
- **시간 절약**: 주-월 단위 개발 시간을 2시간 이내로 단축 (80% 감소)
- **교육적 품질 유지**: AI가 교육학적으로 검증된 시스템 자동 생성
- **유연성**: 다양한 수학 개념과 교수법 지원

---

## ✨ 주요 기능

### 1. 6단계 AI 파이프라인

```
자연어 요청 → 세계관 재구성 → 규칙 생성 → 데이터 관리 → 입력 전략 → UI 생성 → 배포
```

- **Phase 1: World Model Reconstruction** - 교육 개념 추출 및 도메인 모델 구축
- **Phase 2: Rule Generation** - 비즈니스 규칙 자동 생성 및 복잡도 분석
- **Phase 3: Data Management** - 데이터베이스 스키마 설계 및 의사 데이터 생성
- **Phase 4: Input Strategy** - 학생 데이터 수집 방법 설계
- **Phase 5: UI Auto-Generation** - React 컴포넌트 자동 생성
- **Phase 6: Integration & Deployment** - API 생성 및 배포

### 2. 지능형 규칙 엔진

- 조건부 로직 자동 생성
- 복잡도 분석 및 온톨로지 변환
- 단위 테스트 자동 생성

### 3. 동적 UI 생성

- React 컴포넌트 자동 생성
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 접근성 표준 준수 (WCAG 2.1 AA)

---

## 🆕 최신 기능: LMS 연동 및 실수 재발률 자동 표시

### 개요

학생들의 반복적인 실수를 자동으로 추적하고 분석하여, 교사에게 재발률이 높은 오류 포인트를 시각적으로 표시하는 기능입니다.

### 주요 특징

- ✅ **실시간 오류 추적**: 모든 학생 오답 자동 기록
- ✅ **AI 기반 패턴 분석**: 유사 오류 자동 그룹화 및 패턴 식별
- ✅ **재발률 자동 계산**: 오류 빈도 및 심각도 점수화
- ✅ **우선순위 자동 할당**: 중요도에 따른 자동 순위 지정
- ✅ **시각화 대시보드**: 교사용 직관적인 대시보드
- ✅ **LMS 양방향 통합**: Canvas, Moodle 등과 데이터 동기화
- ✅ **실행 가능한 권장사항**: 각 오류에 대한 교육적 조언 제공

### 빠른 시작

```tsx
// 프론트엔드: 재발 오류 대시보드 표시
import { RecurringErrorDashboard } from './components/RecurringErrorDashboard';

<RecurringErrorDashboard
  moduleId="module_123"
  autoRefresh={true}
  refreshInterval={60000}
/>
```

```python
# 백엔드: 학생 오류 기록
from backend.models.error_tracking import StudentError, ErrorCategory, ErrorSeverity

error = StudentError(
    student_id="student_001",
    module_id="module_123",
    error_type=ErrorCategory.CONCEPTUAL,
    error_description="분수 덧셈 시 분모를 더함",
    incorrect_answer="1/2 + 1/3 = 2/5",
    correct_answer="1/2 + 1/3 = 5/6",
    severity=ErrorSeverity.HIGH
)
```

### 상세 문서

전체 기능 설명, API 문서, 사용 예제는 [LMS 오류 추적 기능 문서](docs/LMS_ERROR_TRACKING_FEATURE.md)를 참조하세요.

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  Teacher UI | Student UI | Admin Dashboard                  │
│  + RecurringErrorDashboard (NEW)                            │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│                   API Gateway (Node.js)                      │
│  Authentication | Rate Limiting | Request Routing           │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│              AI Pipeline Orchestrator (Python)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ World Model   →  Rule Engine  →  Data Manager        │  │
│  │      ↓               ↓               ↓               │  │
│  │ Input Strategy  →  UI Generator  →  Deployer        │  │
│  │                                                      │  │
│  │ + Error Analyzer (NEW)                              │  │
│  │ + LMS Integration (NEW)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Schemas, Data)  │   │  (Sessions)    │
│             │    │ + Error Tracking │   │                │
└─────────────┘    └──────────────────┘   └────────────────┘
```

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit / Zustand
- **UI Components**: Material-UI (MUI)
- **Forms**: React Hook Form + Yup
- **API Client**: Axios
- **Real-time**: Socket.io-client

### Backend
- **API Gateway**: Node.js (Express/Fastify)
- **Pipeline**: Python 3.11+ (FastAPI)
- **Task Queue**: Celery + Redis
- **AI/LLM**: Anthropic Claude API
- **Code Generation**: Jinja2 + AST

### Database
- **Primary**: PostgreSQL 15+ (with JSONB)
- **Caching**: Redis 7+
- **Vector Store**: pgvector
- **Graph DB** (future): Neo4j

### DevOps
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

---

## 📦 설치 및 설정

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### 1. 저장소 클론

```bash
git clone https://github.com/kaist/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음을 설정합니다:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/education_db

# Claude API
CLAUDE_API_KEY=your_claude_api_key

# LMS Integration
CANVAS_API_KEY=your_canvas_api_key
CANVAS_BASE_URL=https://canvas.example.com

MOODLE_API_KEY=your_moodle_api_key
MOODLE_BASE_URL=https://moodle.example.com

# Redis
REDIS_URL=redis://localhost:6379/0

# Error Analysis Configuration
MIN_ERROR_OCCURRENCES=3
MIN_AFFECTED_STUDENTS=2
RECURRENCE_THRESHOLD=30.0
```

### 3. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb education_db

# 마이그레이션 실행
psql -U postgres -d education_db -f backend/migrations/001_create_error_tracking_tables.sql
```

### 4. 백엔드 설정

```bash
cd backend
pip install -r requirements.txt

# 개발 서버 시작
uvicorn api.error_tracking_api:app --reload --port 8000
```

### 5. 프론트엔드 설정

```bash
cd frontend
npm install

# 개발 서버 시작
npm run dev
```

### 6. Docker를 사용한 설정 (권장)

```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

---

## 📖 사용법

### 교사: 새 모듈 생성

1. 대시보드에서 "새 모듈 만들기" 클릭
2. 자연어로 모듈 설명 입력:
   ```
   3학년 학생들을 위한 분수 학습 모듈을 만들어주세요.
   학생들이 분수의 개념을 시각적으로 이해하고,
   분수의 덧셈과 뺄셈을 연습할 수 있어야 합니다.
   ```
3. AI가 이해한 내용 확인 및 수정
4. 생성된 모듈 미리보기
5. 배포 버튼 클릭

### 교사: 재발 오류 확인

1. 모듈 대시보드 접속
2. "오류 분석" 탭 선택
3. 재발률이 높은 오류 포인트 확인
4. 각 오류의 상세 정보 및 권장 조치 확인
5. 필요시 하이라이트 설정 변경

### 학생: 모듈 학습

1. 할당된 모듈 접속
2. 문제 풀이
3. 즉각적인 피드백 수신
4. 진행 상황 자동 저장

### 관리자: LMS 통합 설정

```python
from backend.services.lms_integration import LMSIntegrationService, create_lms_connector, LMSType

# Canvas 커넥터 생성
canvas = create_lms_connector(
    lms_type=LMSType.CANVAS,
    api_key="your_api_key",
    base_url="https://canvas.example.com"
)

# 서비스 등록
lms_service = LMSIntegrationService()
lms_service.register_connector("canvas", canvas)

# 학생 동기화
await lms_service.sync_students("canvas", "course_123", "module_456")
```

---

## 📚 API 문서

### 에러 추적 API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/error-tracking/errors` | POST | 학생 오류 기록 |
| `/api/error-tracking/modules/{id}/recurring-errors` | GET | 재발 오류 조회 |
| `/api/error-tracking/modules/{id}/analytics` | GET | 오류 분석 데이터 |
| `/api/error-tracking/students/{id}/risk-assessment` | GET | 학생 위험도 평가 |
| `/api/error-tracking/modules/{id}/at-risk-students` | GET | 위험군 학생 목록 |

전체 API 문서: [API Documentation](docs/API.md)

Swagger UI: `http://localhost:8000/docs`

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── models/
│   │   └── error_tracking.py         # 오류 추적 데이터 모델
│   ├── api/
│   │   └── error_tracking_api.py     # 오류 추적 API 엔드포인트
│   ├── services/
│   │   ├── error_analyzer.py         # 오류 분석 서비스
│   │   └── lms_integration.py        # LMS 통합 서비스
│   └── migrations/
│       └── 001_create_error_tracking_tables.sql  # DB 마이그레이션
├── frontend/
│   ├── components/
│   │   └── RecurringErrorDashboard.tsx  # 재발 오류 대시보드
│   ├── services/
│   │   └── api.ts                    # API 클라이언트
│   └── pages/
│       └── TeacherDashboard.tsx      # 교사 대시보드
├── docs/
│   ├── LMS_ERROR_TRACKING_FEATURE.md  # 기능 상세 문서
│   └── 0001-prd-ai-education-pipeline.md  # 제품 요구사항 문서
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # PRD
├── docker-compose.yml                 # Docker 구성
├── .env.example                       # 환경 변수 예제
└── README.md                          # 이 파일
```

---

## 🗺️ 개발 로드맵

### ✅ Completed (v1.0)

- [x] 6단계 AI 파이프라인 설계
- [x] 포괄적인 PRD 문서 작성
- [x] 오류 추적 시스템 구현
- [x] 재발 오류 자동 표시 기능
- [x] LMS 통합 (Canvas, Moodle)
- [x] 교사용 대시보드 UI

### 🔄 In Progress (v1.1)

- [ ] World Model Reconstruction 구현
- [ ] Rule Generation Engine 구현
- [ ] 실시간 알림 시스템
- [ ] 단위 테스트 작성

### 📋 Planned (v2.0)

- [ ] AI 기반 예측 분석
- [ ] 고급 시각화 (트렌드 그래프, 히트맵)
- [ ] 자동 개입 시스템 (맞춤형 힌트 생성)
- [ ] 모바일 앱 (iOS, Android)
- [ ] 다중 LMS 확대 (Blackboard, Google Classroom)
- [ ] 협업 기능 (교사 간 패턴 공유)

### 🎯 Future (v3.0+)

- [ ] 로봇 아바타 통합
- [ ] 센서 데이터 통합
- [ ] 다중 과목 지원 (물리, 화학, 생물)
- [ ] 마켓플레이스 (모듈 공유)
- [ ] 게임화 엔진

---

## 📊 성공 메트릭

### 현재 목표

- ⏱️ **모듈 생성 시간**: < 2시간 (목표: 80% 시간 절감)
- ✅ **시스템 정확도**: > 85% (최소 수정으로 사용 가능)
- 👥 **교사 채택률**: > 70% (6개월 내)
- 😊 **교사 만족도 (NPS)**: > 50
- 📈 **학생 학습 성과**: 수동 모듈과 동등 이상

### 오류 추적 메트릭

- 🎯 **오류 식별률**: > 90%
- ⚡ **분석 처리 시간**: < 30초
- 🔄 **LMS 동기화 성공률**: > 95%
- 📊 **위험군 학생 조기 발견**: > 80%

---

## 🤝 기여하기

프로젝트에 기여하고 싶으신가요? 환영합니다!

### 기여 절차

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 코딩 규칙

- Python: PEP 8 준수
- TypeScript: ESLint + Prettier
- Commit: Conventional Commits 사용

### 버그 리포트

[GitHub Issues](https://github.com/kaist/alt42standalone_v1.0/issues)에서 버그를 보고해주세요.

---

## 🧪 테스트

### 백엔드 테스트

```bash
cd backend
pytest tests/ -v --cov=.
```

### 프론트엔드 테스트

```bash
cd frontend
npm run test
npm run test:coverage
```

### End-to-End 테스트

```bash
npm run test:e2e
```

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

```
MIT License

Copyright (c) 2025 KAIST Touch Math Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 팀

**KAIST Touch Math Academy**
- Project Lead: [Name]
- Technical Lead: [Name]
- Educational Lead: [Name]

---

## 📞 문의

- **일반 문의**: info@kaist.edu
- **기술 지원**: tech-support@kaist.edu
- **기능 요청**: [GitHub Issues](https://github.com/kaist/alt42standalone_v1.0/issues)

---

## 🙏 감사의 말

이 프로젝트는 다음의 지원으로 만들어졌습니다:
- KAIST Touch Math Academy
- Anthropic (Claude API)
- 오픈소스 커뮤니티

---

## 📚 참고 자료

- [Product Requirements Document](tasks/0001-prd-ai-education-pipeline.md)
- [LMS Error Tracking Feature](docs/LMS_ERROR_TRACKING_FEATURE.md)
- [API Documentation](docs/API.md)
- [Architecture Design](docs/ARCHITECTURE.md)

---

<div align="center">

**Made with ❤️ by KAIST Touch Math Academy**

[Website](https://kaist.edu) • [Documentation](https://docs.kaist.edu) • [Support](https://support.kaist.edu)

</div>
