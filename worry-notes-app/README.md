# Worry Notes System

LMS와 연동되는 학생 걱정거리 자동 정리 웹앱

## 🎯 Overview

학생들의 학습 과정에서 발생하는 걱정거리, 어려움, 질문 등을 수집하고 AI로 자동 분류하여 교사가 효율적으로 대응할 수 있도록 돕는 시스템입니다.

### 주요 기능

- **학생 기능**
  - 걱정거리 메모 작성 (익명 옵션 지원)
  - 제출한 메모 상태 확인
  - 교사 응답 확인

- **교사 기능**
  - 학생 걱정거리 대시보드
  - AI 자동 분류 (학업, 정서, 기술, 환경, 사회적 문제)
  - 우선순위 자동 평가 (긴급, 높음, 중간, 낮음)
  - 위기 상황 자동 감지
  - AI 응답 제안
  - LMS 학생 컨텍스트 연동

- **AI 기능**
  - Claude 3.5 Sonnet 기반 자동 분류
  - 감정 분석
  - 키워드 추출
  - 응답 제안 생성
  - 위기 상황 감지

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   FastAPI   │────▶│ PostgreSQL  │
│  Frontend   │     │   Backend   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Claude AI  │
                    │   (Anthropic)│
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │  (Cache)    │
                    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Anthropic API Key (Claude)

### 1. Clone & Setup

```bash
cd worry-notes-app
cp backend/.env.example backend/.env
```

### 2. Configure Environment

`backend/.env` 파일을 열고 필수 설정을 입력:

```bash
# Claude AI API Key (필수)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# JWT Secret (프로덕션에서는 강력한 키로 변경)
JWT_SECRET_KEY=your-secure-jwt-secret-key
SECRET_KEY=your-secure-secret-key
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Initialize Database

데이터베이스가 자동으로 초기화됩니다. 테스트 데이터를 추가하려면:

```bash
docker-compose exec backend python scripts/seed_data.py
```

## 📁 Project Structure

```
worry-notes-app/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API Routes
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic
│   │   │   └── ai_service.py    # Claude AI Integration
│   │   ├── core/           # Configuration
│   │   └── utils/          # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/         # Page Components
│   │   ├── services/      # API Services
│   │   └── types/         # TypeScript Types
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── schema.sql         # Database Schema
├── tasks/
│   ├── 0001-prd-ai-education-pipeline.md
│   └── 0002-prd-lms-worry-notes.md    # Product Requirements
└── docker-compose.yml
```

## 🔧 Development

### Backend Development

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Run tests
pytest
```

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📊 Database Schema

주요 테이블:

- **users**: 사용자 (학생, 교사, 상담사, 관리자)
- **worry_notes**: 걱정거리 메모
- **responses**: 교사 응답
- **lms_context**: LMS 학생 컨텍스트 캐시
- **notifications**: 알림
- **categories**: 카테고리 정의
- **audit_logs**: 감사 로그

전체 스키마: `database/schema.sql` 참조

## 🤖 AI Integration

### Claude API 사용

걱정거리 메모 자동 분석:

```python
from app.services.ai_service import ai_service

# 걱정거리 분석
analysis = await ai_service.categorize_worry_note(
    content="숙제 문제 15번을 모르겠어요...",
    student_context={
        "average_grade": 85.5,
        "engagement_score": 0.75
    }
)

# 결과
{
    "category": "academic",
    "priority": "high",
    "is_crisis": false,
    "themes": ["homework", "problem-solving"],
    "sentiment": -0.4,
    "suggested_response": "...",
    "confidence": 0.85
}
```

## 🔐 Security

- JWT 기반 인증
- Role-based Access Control (RBAC)
- 데이터베이스 암호화 (AES-256)
- HTTPS/TLS 1.3
- FERPA/COPPA 준수
- 위기 상황 자동 감지 및 알림

## 📈 Monitoring

- **Health Check**: http://localhost:8000/health
- **Logs**: `backend/logs/app.log`
- **Metrics**: Prometheus (설정 필요)

## 🔄 LMS Integration

### Supported LMS Platforms

- Canvas LMS
- Moodle
- Google Classroom
- LTI 1.3 Standard

### Setup Canvas Integration

```bash
# backend/.env
CANVAS_API_URL=https://your-institution.instructure.com/api/v1
CANVAS_API_KEY=your-canvas-api-key
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📝 API Documentation

FastAPI가 자동으로 API 문서를 생성합니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 주요 Endpoints

```
POST   /api/v1/auth/login              # 로그인
GET    /api/v1/auth/me                 # 현재 사용자 정보

POST   /api/v1/notes                   # 걱정거리 메모 생성
GET    /api/v1/notes                   # 걱정거리 목록 (필터링)
GET    /api/v1/notes/{id}              # 특정 메모 조회
PATCH  /api/v1/notes/{id}              # 메모 수정 (교사)
PATCH  /api/v1/notes/{id}/resolve      # 메모 해결 표시
PATCH  /api/v1/notes/{id}/assign       # 상담사 배정

POST   /api/v1/responses               # 응답 작성
GET    /api/v1/responses               # 응답 조회

GET    /api/v1/analytics/overview      # 통계 개요
GET    /api/v1/analytics/trends        # 트렌드 분석

GET    /api/v1/lms/context/{student_id} # LMS 컨텍스트 조회
```

## 🌐 Deployment

### Production Deployment

1. 환경 변수 설정:

```bash
ENV=production
DEBUG=False
SECRET_KEY=your-production-secret-key
ANTHROPIC_API_KEY=your-api-key
DATABASE_URL=postgresql://...
```

2. SSL/TLS 설정
3. 도메인 설정
4. 백업 설정

### Cloud Deployment Options

- AWS (ECS/RDS/ElastiCache)
- Google Cloud Platform
- Azure
- DigitalOcean

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 📞 Support

- Documentation: `tasks/0002-prd-lms-worry-notes.md`
- Issues: GitHub Issues
- Email: support@example.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core worry note system
- ✅ AI categorization
- ✅ Teacher dashboard
- ✅ Student dashboard

### Phase 2 (Q1 2025)
- [ ] LMS integration (Canvas, Moodle)
- [ ] Email notifications
- [ ] Mobile responsive design
- [ ] Advanced analytics

### Phase 3 (Q2 2025)
- [ ] Multi-language support
- [ ] Parent portal
- [ ] Counselor workflow
- [ ] Predictive analytics

## 📊 Success Metrics

- Student adoption: 80%+ students using system
- Response time: <4 hours for urgent concerns
- AI accuracy: 90%+ categorization accuracy
- Teacher time savings: 70% reduction in concern management time

---

Made with ❤️ for educational support
