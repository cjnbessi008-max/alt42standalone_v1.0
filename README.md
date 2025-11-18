# LMS Wrong Answer Analysis System

**학생이 스스로 확신했던 문제 중 틀린 문제만 골라서 분석하는 시스템**

## 🎯 핵심 기능

### 메타인지 분석
- 학생이 "알고 있다고 확신했지만 실제로 틀린" 문제 식별
- 확신도(Confidence Level) 기반 학습 효율성 향상
- 진짜 약점에 집중한 맞춤형 학습

### 교사 인사이트
- 학급 전체의 오개념(Misconception) 패턴 파악
- 학생별 개념 이해도 시각화
- AI 기반 학습 추천

### Moodle 3.7 연동
- Moodle REST API를 통한 퀴즈 데이터 수집
- 독립형 웹앱으로 고급 분석 제공
- 기존 LMS 워크플로우 유지

## 🏗️ 시스템 아키텍처

```
Frontend (React)  →  API Gateway (Node.js)  →  Analysis Engine (Python)
                             ↓
                     PostgreSQL Database
                             ↓
                        Moodle 3.7 LMS
```

자세한 아키텍처는 [ARCHITECTURE.md](./ARCHITECTURE.md) 참조

## 🚀 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- Moodle 3.7 (PHP 7.1.9, MySQL 5.7) 인스턴스
- Moodle Web Services API 토큰

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 Moodle URL과 API 토큰 입력

# 3. Docker Compose로 실행
docker-compose up -d

# 4. 데이터베이스 마이그레이션
docker-compose exec backend npm run migrate

# 5. 웹 브라우저에서 접속
# http://localhost:3000
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 (Dashboard, Analysis, etc.)
│   │   ├── services/      # API 클라이언트
│   │   └── hooks/         # 커스텀 React Hooks
│   └── package.json
│
├── backend/               # Node.js + Express API Gateway
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── middleware/    # 인증, 로깅 등
│   │   └── moodle/        # Moodle API 클라이언트
│   └── package.json
│
├── analysis-engine/       # Python + FastAPI 분석 엔진
│   ├── app/
│   │   ├── analysis/      # 분석 알고리즘
│   │   ├── ai/            # Claude API 통합
│   │   └── models/        # 데이터 모델
│   └── requirements.txt
│
├── database/              # 데이터베이스 스키마
│   ├── schemas/           # SQL 스키마 정의
│   └── migrations/        # 마이그레이션 스크립트
│
├── moodle-plugin/         # Moodle 확신도 수집 플러그인
│   └── mod_quiz_confidence/
│
├── docker/                # Docker 설정
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── Dockerfile.analysis
│
├── docs/                  # 문서
│   ├── api.md            # API 문서
│   ├── setup.md          # 설치 가이드
│   └── user-guide.md     # 사용자 가이드
│
├── docker-compose.yml     # Docker Compose 설정
├── ARCHITECTURE.md        # 시스템 아키텍처 상세 문서
└── README.md             # 이 파일
```

## 🔧 개발 환경 설정

### Frontend 개발
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Backend 개발
```bash
cd backend
npm install
npm run dev
# http://localhost:3001
```

### Analysis Engine 개발
```bash
cd analysis-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# http://localhost:8000
```

## 📊 주요 기능

### 1. 확신도 수집
- Moodle 퀴즈에 확신도 평가 통합 (1-5 척도)
- 각 문제마다 학생이 자신의 확신도 표시
- 퀴즈 완료 후 또는 실시간 수집 가능

### 2. 확신 오답 분석
- **고확신 오답**: 확신도 ≥ 4점이지만 틀린 문제
- 개념별 취약점 히트맵
- 시간별 메타인지 개선 추이

### 3. AI 기반 오개념 분석
- Claude API를 사용한 답안 분석
- 오개념 유형 자동 분류
- 맞춤형 학습 전략 제안

### 4. 교사 대시보드
- 학급 전체 확신 오답 통계
- 주의가 필요한 학생 식별
- 개념별 교수 전략 추천

### 5. 학생 대시보드
- 자기 반성(Self-reflection) 뷰
- 개인 약점 개념 시각화
- 추천 복습 문제

## 🔐 보안

- Moodle API 토큰 암호화 저장
- JWT 기반 인증 (1시간 만료)
- Role-based Access Control (RBAC)
- HTTPS only in production
- GDPR/PIPA 준수

## 📈 성능

- PostgreSQL 인덱싱 최적화
- Redis 캐싱 (선택적)
- React Query로 프론트엔드 캐싱
- 증분 동기화 (변경분만 가져오기)

## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test

# Analysis Engine 테스트
cd analysis-engine
pytest
```

## 📝 API 문서

API 문서는 다음에서 확인:
- Swagger UI: http://localhost:3001/api-docs (Backend)
- ReDoc: http://localhost:8000/docs (Analysis Engine)

자세한 내용은 [docs/api.md](./docs/api.md) 참조

## 🤝 기여

기여는 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 참조

## 👥 팀

- **KAIST Touch Math Academy**
- AI Education System Pipeline Project

## 📞 지원

문제가 있거나 질문이 있으시면 Issue를 생성해주세요.

## 🗺️ 로드맵

### Phase 1: MVP (현재)
- ✅ Moodle 데이터 동기화
- ✅ 확신도 수집
- ✅ 기본 분석 대시보드

### Phase 2: 고급 분석 (3개월)
- 예측 모델 (틀릴 가능성 예측)
- 학습 스타일 분석
- 또래 비교 분석

### Phase 3: 확장 (6개월)
- Canvas, Blackboard 지원
- 모바일 앱 (React Native)
- 실시간 알림

## 🙏 감사의 말

이 프로젝트는 다음 기술을 사용합니다:
- React, TypeScript, Material-UI
- Node.js, Express, Prisma
- Python, FastAPI, pandas
- PostgreSQL, Redis
- Claude API (Anthropic)
- Moodle Web Services API
