# AI Education System - Inverse Reflection Module

현대적인 아키텍처로 구축된 AI 기반 수학 교육 플랫폼입니다. Claude AI를 활용하여 자동으로 교육 콘텐츠를 생성하고, 학생들에게 인터랙티브한 시각화를 제공합니다.

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Material-UI (MUI) for UI components
- HTML5 Canvas for visualization
- Math.js for mathematical calculations
- Socket.IO for real-time updates

**Backend**
- Node.js + Express (API Gateway)
- Python 3.11 + FastAPI (AI Pipeline Orchestrator)
- PostgreSQL 15+ (Primary database)
- Redis 7+ (Caching and task queue)

**AI/ML**
- Claude 3.5 Sonnet (Anthropic) for content generation
- Natural language processing for teacher requests

**DevOps**
- Docker + Docker Compose
- Multi-container architecture
- Environment-based configuration

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│            (TypeScript + Material-UI)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┴────────────────────────────────────┐
│              Node.js API Gateway                         │
│                 (Express + Socket.IO)                    │
└──────┬───────────────────────────────────┬──────────────┘
       │                                   │
       │ PostgreSQL                        │ HTTP
       │                                   │
┌──────┴────────┐              ┌──────────┴──────────────┐
│  PostgreSQL   │              │  Python FastAPI         │
│   Database    │              │  Pipeline Orchestrator  │
└───────────────┘              │  (Claude AI Integration)│
                               └─────────────────────────┘
       │
┌──────┴────────┐
│  Redis Cache  │
└───────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Claude API key (from Anthropic)
- 8GB+ RAM recommended

### 1. Clone and Setup

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**
```bash
# Claude API (Get from https://console.anthropic.com/)
CLAUDE_API_KEY=your_claude_api_key_here

# Database
DB_PASSWORD=your_secure_password

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_minimum_32_characters
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Python Pipeline**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 5. Initialize Database

The database schema is automatically created on first startup. To verify:

```bash
# Connect to database
docker-compose exec postgres psql -U ai_edu_user -d ai_education

# List tables
\dt ai_education.*

# View sample data
SELECT * FROM ai_education.inverse_problems;

# Exit
\q
```

## 📁 Project Structure

```
alt42standalone_v1.0/
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   └── InverseReflectionCanvas.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.tsx
│   │   │   └── InverseReflectionPage.tsx
│   │   ├── services/           # API clients
│   │   │   └── api.ts
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── api-gateway/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── problemRoutes.js
│   │   │   ├── attemptRoutes.js
│   │   │   ├── moduleRoutes.js
│   │   │   └── authRoutes.js
│   │   ├── middleware/         # Express middleware
│   │   ├── config/             # Configuration
│   │   └── server.js           # Entry point
│   ├── package.json
│   └── Dockerfile
│
├── pipeline/                    # Python FastAPI orchestrator
│   ├── routers/                # API routes
│   │   ├── health.py
│   │   ├── problems.py
│   │   └── generation.py
│   ├── services/               # Business logic
│   │   ├── claude_service.py   # Claude AI integration
│   │   └── cache_service.py    # Redis caching
│   ├── schemas/                # Pydantic schemas
│   ├── database/               # Database config
│   ├── main.py                 # Entry point
│   ├── config.py               # Settings
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/                    # Database migrations
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── docker-compose.yml          # Multi-container orchestration
├── .env.example                # Environment template
└── README_MODERN.md            # This file
```

## 🎯 Features

### 1. Inverse Reflection Visualization

**역함수를 거울 반사로 시각화**

- 원함수 f(x)와 역함수 f⁻¹(x)를 동시에 표시
- y=x 선을 기준으로 대칭 관계 확인
- 클릭으로 점 반사 애니메이션 실행
- 실시간 좌표 표시

**Technologies:**
- HTML5 Canvas for rendering
- Math.js for function evaluation
- TypeScript for type safety
- Material-UI for controls

### 2. AI-Powered Problem Generation

**Claude AI가 자동으로 문제 생성**

```python
# Example API call
POST /api/v1/problems/generate
{
  "original_function": "2*x + 3",
  "function_type": "linear",
  "difficulty_level": "easy"
}

# Response includes:
# - Calculated inverse function
# - Domain/range restrictions
# - Step-by-step solution
# - Pedagogical hints
# - Key concepts
```

### 3. Real-time Progress Tracking

**학생 진도 및 상호작용 로깅**

- 클릭 이벤트 기록
- 소요 시간 측정
- 시도 횟수 추적
- 정답률 분석

### 4. Moodle LMS Integration (Optional)

**Moodle 3.7+ 연동 지원**

- SSO authentication
- Grade export
- Student roster sync
- External tool (LTI) embedding

## 🔧 API Documentation

### API Gateway (Node.js - Port 3001)

#### Problems
- `GET /api/v1/problems` - List problems
- `GET /api/v1/problems/:id` - Get specific problem
- `POST /api/v1/problems/generate` - Generate new problem (proxies to Python)

#### Attempts
- `POST /api/v1/attempts` - Submit student attempt
- `GET /api/v1/attempts/student/:id` - Get student attempts

#### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### AI Pipeline (Python FastAPI - Port 8000)

#### Problems
- `POST /api/v1/problems/generate` - Generate problem using Claude
- `POST /api/v1/problems/batch-generate` - Generate multiple problems

#### Generation
- `POST /api/v1/generation/request` - Create generation request
- `GET /api/v1/generation/request/:id` - Get request status
- `WebSocket /api/v1/generation/ws/:id` - Real-time progress

#### Health
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health

### Interactive API Documentation

- **Python Pipeline**: http://localhost:8000/docs (Swagger UI)
- **Python Pipeline**: http://localhost:8000/redoc (ReDoc)

## 🧪 Development

### Running Locally (without Docker)

**Frontend:**
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

**API Gateway:**
```bash
cd api-gateway
npm install
npm run dev
# Runs on http://localhost:3001
```

**Python Pipeline:**
```bash
cd pipeline
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

**PostgreSQL & Redis:**
```bash
docker-compose up -d postgres redis
```

### Testing

**Frontend:**
```bash
cd frontend
npm test
```

**API Gateway:**
```bash
cd api-gateway
npm test
```

**Python Pipeline:**
```bash
cd pipeline
pytest
```

## 📊 Database Schema

### Key Tables

**users** - User accounts (students, teachers, admins)
**modules** - Educational modules
**inverse_problems** - Inverse function problems
**student_attempts** - Student submissions
**generation_requests** - AI generation tasks
**student_progress** - Learning analytics

### Schema Diagram

```sql
users (id, username, email, role)
  ↓
modules (id, name, module_type, created_by)
  ↓
inverse_problems (id, module_id, original_function, inverse_function, ...)
  ↓
student_attempts (id, problem_id, student_id, is_correct, interaction_log, ...)
```

## 🔐 Security

- **Authentication**: JWT tokens
- **SQL Injection**: Parameterized queries (PDO/SQLAlchemy)
- **XSS Protection**: React auto-escaping + Helmet.js
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Express rate limiter
- **Secrets Management**: Environment variables
- **HTTPS**: Recommended for production

## 📈 Monitoring & Logging

### Logs Location

- **API Gateway**: `api-gateway/logs/`
- **Python Pipeline**: `pipeline/logs/`
- **Docker logs**: `docker-compose logs <service>`

### Log Levels

- Development: `DEBUG`
- Production: `INFO` or `WARNING`

Configure via environment:
```bash
LOG_LEVEL=INFO
NODE_ENV=production
ENVIRONMENT=production
```

## 🚢 Production Deployment

### Using Docker Compose (Recommended)

```bash
# Production docker-compose file
docker-compose -f docker-compose.prod.yml up -d

# Enable HTTPS with reverse proxy (Nginx/Traefik)
# Configure domain and SSL certificates
```

### Environment Variables for Production

```bash
# Set secure values
ENVIRONMENT=production
NODE_ENV=production
DB_PASSWORD=<strong-password>
JWT_SECRET=<64-character-random-string>
CLAUDE_API_KEY=<your-key>

# Update CORS origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Scaling

**Horizontal Scaling:**
```bash
# Scale API Gateway
docker-compose up -d --scale api-gateway=3

# Use load balancer (Nginx/HAProxy) in front
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify credentials in .env
```

### Claude API Errors

```bash
# Verify API key
echo $CLAUDE_API_KEY

# Check rate limits (Anthropic console)
# Increase timeout if needed
```

### Frontend Can't Connect to Backend

```bash
# Check REACT_APP_API_URL in .env
REACT_APP_API_URL=http://localhost:3001

# Verify CORS settings in api-gateway/src/config/config.js
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- **Claude AI** by Anthropic - AI content generation
- **Material-UI** - React component library
- **FastAPI** - Modern Python web framework
- **Express.js** - Node.js web framework

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check documentation at `/docs`
- Review API docs at http://localhost:8000/docs

---

**Built with ❤️ for mathematics education**
