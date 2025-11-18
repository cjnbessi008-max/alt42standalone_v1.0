# AI Education Pipeline - Standalone Web Application Architecture
**독립형 웹앱 아키텍처 설계**

## 🎯 설계 철학

**목표**: LMS 의존성 없이 독립적으로 동작하는 AI 기반 교육 모듈 생성 시스템

**핵심 원칙**:
1. **Self-Contained**: 모든 기능이 독립적으로 작동
2. **Scalable**: 마이크로서비스 아키텍처로 확장 가능
3. **AI-First**: Claude API를 중심으로 한 지능형 자동화
4. **Teacher-Friendly**: 코딩 지식 없이 사용 가능한 UI/UX

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Teacher UI   │  │ Student UI   │  │ Admin Panel  │          │
│  │ (모듈 생성)   │  │ (학습 활동)   │  │ (모니터링)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │            REST API / WebSocket     │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│              API Gateway (Node.js + Express)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Authentication (JWT)                                   │    │
│  │ • Rate Limiting                                          │    │
│  │ • Request Routing                                        │    │
│  │ • WebSocket Management                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────┬──────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────┐
│         AI Pipeline Orchestrator (Python + FastAPI)              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                 Pipeline Stages                         │     │
│  │                                                         │     │
│  │  1. World Model      →  Domain model construction      │     │
│  │  2. Rule Generator   →  Business logic extraction      │     │
│  │  3. Data Manager     →  Schema & data generation       │     │
│  │  4. Input Strategy   →  Input method design            │     │
│  │  5. UI Generator     →  Component generation           │     │
│  │  6. Deployer         →  Module deployment              │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
└──────┬────────────────────┬─────────────────────┬────────────────┘
       │                    │                     │
┌──────▼────────┐  ┌────────▼──────────┐  ┌──────▼──────────┐
│   Claude API  │  │   PostgreSQL      │  │  Redis Cache    │
│   (Anthropic) │  │   • Modules       │  │  • Sessions     │
│               │  │   • Users         │  │  • Queue Jobs   │
│   GPT-4 등     │  │   • Generated     │  │  • Temp Data    │
│   (Fallback)  │  │     Schemas       │  │                 │
└───────────────┘  └───────────────────┘  └─────────────────┘
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── teacher/          # 교사 UI
│   │   │   │   ├── ModuleCreator.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── ModuleManager.tsx
│   │   │   ├── student/          # 학생 UI
│   │   │   │   ├── ModuleViewer.tsx
│   │   │   │   └── ProgressTracker.tsx
│   │   │   └── common/           # 공통 컴포넌트
│   │   │       ├── Button.tsx
│   │   │       └── Form.tsx
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── StudentPortal.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── services/
│   │   │   ├── api.ts            # API 클라이언트
│   │   │   └── websocket.ts
│   │   ├── store/                # Redux/Zustand
│   │   │   ├── moduleSlice.ts
│   │   │   └── userSlice.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── api-gateway/              # Node.js API Gateway
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── modules.ts
│   │   │   │   └── users.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── rateLimit.ts
│   │   │   ├── websocket/
│   │   │   │   └── handler.ts
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── ai-pipeline/              # Python AI Pipeline
│       ├── app/
│       │   ├── services/
│       │   │   ├── orchestrator.py     # 파이프라인 오케스트레이터
│       │   │   ├── world_model.py      # 세계관 재구성
│       │   │   ├── rule_generator.py   # 룰 생성
│       │   │   ├── data_manager.py     # 데이터 관리
│       │   │   ├── input_strategy.py   # 입력 전략
│       │   │   ├── ui_generator.py     # UI 생성
│       │   │   └── deployer.py         # 배포
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── pipeline.py
│       │   │   │   └── modules.py
│       │   │   └── main.py
│       │   ├── models/
│       │   │   ├── module.py
│       │   │   ├── user.py
│       │   │   └── generation_job.py
│       │   ├── integrations/
│       │   │   ├── claude_client.py
│       │   │   └── database.py
│       │   └── utils/
│       │       ├── prompts.py
│       │       └── validators.py
│       ├── requirements.txt
│       └── pyproject.toml
│
├── database/
│   ├── migrations/               # SQL 마이그레이션
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_modules.sql
│   │   └── 003_add_jobs.sql
│   └── seeds/                    # 초기 데이터
│       └── demo_data.sql
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.gateway
│   ├── Dockerfile.pipeline
│   └── docker-compose.yml
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔧 기술 스택 (추천 선택)

### Frontend
- **Framework**: React 18.2+ with TypeScript
- **State Management**: Zustand (가벼움) or Redux Toolkit
- **Styling**: Tailwind CSS + Shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **API**: Axios + React Query
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

### Backend - API Gateway
- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4.18+ or Fastify (더 빠름)
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **WebSocket**: Socket.io
- **Validation**: Zod
- **ORM**: Prisma (PostgreSQL)

### Backend - AI Pipeline
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.104+
- **AI SDK**: Anthropic SDK (Claude)
- **Task Queue**: Celery + Redis
- **ORM**: SQLAlchemy 2.0+
- **Migration**: Alembic
- **Code Generation**: Jinja2 + ast (Python AST)

### Database
- **Primary DB**: PostgreSQL 15+
  - JSON support (JSONB)
  - Full-text search
  - Vector extension (pgvector) for embeddings
- **Cache**: Redis 7+
  - Session storage
  - Job queue
  - Rate limiting

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston (Node.js) + structlog (Python)

---

## 🗄️ 데이터베이스 스키마

### Core Tables

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules Table (AI 생성 모듈)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'generating'
        CHECK (status IN ('generating', 'active', 'archived', 'failed')),

    -- AI 생성 데이터 (JSONB)
    world_model JSONB,              -- 세계관 모델
    generated_rules JSONB,           -- 생성된 룰
    generated_schema JSONB,          -- DB 스키마
    generated_ui JSONB,              -- UI 컴포넌트 정의
    input_strategy JSONB,            -- 입력 전략

    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 인덱스
    CONSTRAINT modules_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_subject ON modules(subject);

-- Generation Jobs Table (생성 작업 추적)
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL CHECK (stage IN (
        'world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),

    -- 입력/출력 데이터
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,

    -- AI API 사용량
    tokens_used INTEGER DEFAULT 0,
    api_cost DECIMAL(10, 4) DEFAULT 0,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_module ON generation_jobs(module_id);
CREATE INDEX idx_jobs_status ON generation_jobs(status);

-- Student Progress Table (학생 진도)
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,

    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

    -- 동적 진도 데이터 (모듈마다 다름)
    progress_data JSONB,

    -- 성적
    score DECIMAL(5, 2),
    max_score DECIMAL(5, 2),

    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id)
);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_module ON student_progress(module_id);

-- Dynamic Schemas Table (생성된 스키마 메타데이터)
CREATE TABLE dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(module_id, table_name)
);

-- AI Prompts Log (AI 프롬프트 로그 - 디버깅용)
CREATE TABLE ai_prompts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES generation_jobs(id) ON DELETE CASCADE,
    stage VARCHAR(100),
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prompts_job ON ai_prompts_log(job_id);
```

---

## 🔄 AI Pipeline 워크플로우

### Phase 1: World Model Reconstruction (세계관 재구성)

```python
# Input: 교사의 자연어 요청
teacher_request = """
3학년 학생들을 위한 분수 학습 모듈을 만들어주세요.
학생들이 분수의 개념을 시각적으로 이해하고,
분수의 덧셈과 뺄셈을 연습할 수 있어야 합니다.
"""

# Claude API 호출
world_model = await claude_client.generate_world_model(teacher_request)

# Output: 구조화된 도메인 모델
{
  "concepts": [
    {"name": "Fraction", "attributes": ["numerator", "denominator"]},
    {"name": "Pizza", "attributes": ["slices", "total_slices"]},
    {"name": "Operation", "attributes": ["type", "operands"]}
  ],
  "relationships": [
    {"from": "Fraction", "to": "Numerator", "type": "has-a"},
    {"from": "Fraction", "to": "Denominator", "type": "has-a"}
  ],
  "operations": [
    {"name": "add_fractions", "inputs": ["Fraction", "Fraction"], "output": "Fraction"},
    {"name": "visualize_fraction", "inputs": ["Fraction"], "output": "PizzaVisualization"}
  ]
}
```

### Phase 2: Rule Generation (룰 생성)

```python
# Input: World Model
# Output: 실행 가능한 룰
{
  "validation_rules": [
    {
      "name": "denominator_not_zero",
      "condition": "denominator != 0",
      "error_message": "분모는 0이 될 수 없습니다"
    }
  ],
  "calculation_rules": [
    {
      "name": "add_same_denominator",
      "code": "def add_fractions(f1, f2):\n    if f1.denominator == f2.denominator:\n        return Fraction(f1.numerator + f2.numerator, f1.denominator)\n    else:\n        # Find common denominator\n        ...",
      "complexity": "simple"
    }
  ],
  "progression_rules": [
    {
      "name": "mastery_before_arithmetic",
      "condition": "visualization_mastery >= 0.8",
      "action": "unlock_arithmetic_operations"
    }
  ]
}
```

### Phase 3: Data Management (데이터 생성)

```python
# 동적 스키마 생성
CREATE TABLE fraction_problems (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES modules(id),
    problem_type VARCHAR(50),
    numerator_1 INTEGER NOT NULL,
    denominator_1 INTEGER NOT NULL CHECK (denominator_1 > 0),
    numerator_2 INTEGER,
    denominator_2 INTEGER,
    correct_answer JSONB,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5)
);

# Pseudo 데이터 생성
INSERT INTO fraction_problems VALUES
    (gen_random_uuid(), '<module_id>', 'addition', 1, 4, 1, 4, '{"numerator": 2, "denominator": 4}', 1),
    (gen_random_uuid(), '<module_id>', 'addition', 2, 3, 1, 3, '{"numerator": 3, "denominator": 3}', 2);
```

### Phase 4: Input Strategy (입력 전략)

```json
{
  "input_methods": [
    {
      "data_field": "student_answer",
      "method": "manual_input",
      "ui_type": "fraction_input",
      "components": [
        {"type": "number_input", "name": "numerator", "label": "분자"},
        {"type": "number_input", "name": "denominator", "label": "분모"}
      ],
      "validation": {
        "denominator": {"min": 1, "required": true}
      }
    },
    {
      "data_field": "interaction_time",
      "method": "behavior_tracking",
      "auto_capture": true
    }
  ]
}
```

### Phase 5: UI Generation (UI 생성)

```typescript
// Auto-generated React component
export const FractionInput: React.FC<FractionInputProps> = ({ onSubmit }) => {
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(1);

  return (
    <div className="fraction-input">
      <div className="fraction-visual">
        <input
          type="number"
          value={numerator}
          onChange={(e) => setNumerator(parseInt(e.target.value))}
          aria-label="분자"
        />
        <div className="fraction-bar" />
        <input
          type="number"
          value={denominator}
          min={1}
          onChange={(e) => setDenominator(parseInt(e.target.value))}
          aria-label="분모"
        />
      </div>
      <button onClick={() => onSubmit({numerator, denominator})}>
        제출
      </button>
    </div>
  );
};
```

---

## 🔐 인증 및 권한

### JWT 기반 인증

```typescript
// Token 구조
interface JWTPayload {
  userId: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  exp: number;
}

// 권한 미들웨어
const requireRole = (roles: string[]) => {
  return (req, res, next) => {
    const user = req.user; // JWT에서 추출
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// 사용 예
router.post('/modules', requireRole(['teacher']), createModule);
router.get('/admin/stats', requireRole(['admin']), getStats);
```

---

## 📡 API 엔드포인트

### Teacher API

```
POST   /api/modules              # 모듈 생성 요청
GET    /api/modules              # 내 모듈 목록
GET    /api/modules/:id          # 모듈 상세
PUT    /api/modules/:id          # 모듈 수정
DELETE /api/modules/:id          # 모듈 삭제
GET    /api/modules/:id/status   # 생성 진행 상황
POST   /api/modules/:id/deploy   # 모듈 배포
```

### Student API

```
GET    /api/student/modules           # 내가 접근 가능한 모듈
GET    /api/student/modules/:id       # 모듈 실행
POST   /api/student/modules/:id/answer # 답안 제출
GET    /api/student/progress          # 내 진도
```

### Admin API

```
GET    /api/admin/modules        # 모든 모듈
GET    /api/admin/users          # 사용자 관리
GET    /api/admin/stats          # 시스템 통계
GET    /api/admin/jobs           # 생성 작업 모니터링
```

### WebSocket Events

```typescript
// 클라이언트 → 서버
socket.emit('subscribe_job', { jobId: '...' });

// 서버 → 클라이언트 (실시간 진행 상황)
socket.on('job_progress', (data) => {
  console.log(`Stage: ${data.stage}, Progress: ${data.progress}%`);
});

socket.on('job_completed', (data) => {
  console.log('Module generation completed!', data.moduleId);
});
```

---

## 🚀 배포 전략

### Development

```bash
# 전체 스택 실행
docker-compose up

# Frontend: http://localhost:3000
# API Gateway: http://localhost:4000
# AI Pipeline: http://localhost:8000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Production

```yaml
# docker-compose.prod.yml
services:
  frontend:
    build: ./frontend
    environment:
      - NODE_ENV=production
    ports:
      - "80:80"

  api-gateway:
    build: ./backend/api-gateway
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "4000:4000"

  ai-pipeline:
    build: ./backend/ai-pipeline
    environment:
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    ports:
      - "8000:8000"

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
```

---

## 📊 모니터링 및 로깅

### 주요 메트릭

```typescript
// Prometheus 메트릭
const metrics = {
  modules_created_total: new Counter({
    name: 'modules_created_total',
    help: 'Total number of modules created'
  }),

  generation_duration_seconds: new Histogram({
    name: 'generation_duration_seconds',
    help: 'Module generation duration',
    buckets: [60, 300, 600, 1200, 1800] // 1min, 5min, 10min, 20min, 30min
  }),

  claude_api_calls_total: new Counter({
    name: 'claude_api_calls_total',
    help: 'Total Claude API calls'
  }),

  claude_api_cost_dollars: new Counter({
    name: 'claude_api_cost_dollars',
    help: 'Total Claude API cost in dollars'
  })
};
```

---

## 🎨 UI/UX 플로우

### 교사 워크플로우

```
1. 로그인
   ↓
2. 대시보드 (내 모듈 목록)
   ↓
3. "새 모듈 만들기" 클릭
   ↓
4. 자연어로 요청 입력 (예: "분수 학습 모듈을 만들어주세요...")
   ↓
5. AI가 이해한 내용 확인 (컨셉 맵 시각화)
   ↓
6. 필요시 추가 질문에 답변
   ↓
7. 생성 진행 상황 실시간 모니터링 (WebSocket)
   ↓
8. 미리보기 및 테스트
   ↓
9. 배포 → 학생들에게 공개
```

### 학생 워크플로우

```
1. 로그인
   ↓
2. 내 학습 모듈 목록
   ↓
3. 모듈 선택
   ↓
4. AI 생성 UI와 상호작용
   ↓
5. 자동 진도 추적
   ↓
6. 완료 및 성적 확인
```

---

## 💡 Next Steps (구현 순서)

### Week 1-2: Foundation
1. ✅ 프로젝트 구조 생성
2. ✅ Database 스키마 설정
3. 🔄 API Gateway 기본 구조
4. 🔄 Frontend 초기 설정

### Week 3-4: Core Pipeline
1. World Model Service 구현
2. Claude API 통합
3. Rule Generator 구현

### Week 5-6: Data & UI
1. Data Manager 구현
2. UI Generator 기본 구현
3. Teacher Dashboard

### Week 7-8: Integration & Testing
1. End-to-end 통합
2. 테스트 및 버그 수정
3. MVP 배포

---

**작성일**: 2025-11-18
**버전**: 1.0.0
**다음 작업**: 프로젝트 구조 생성 및 초기 설정
