# AI Education System Pipeline - Codebase Structure Analysis
## Comprehensive Overview for "Practice a Bit More" Mode Implementation

**Repository**: `/home/user/alt42standalone_v1.0`  
**Current Branch**: `claude/lms-practice-mode-01HKrSNkgvsdFYTbQaox9Dqj`  
**Repository Status**: Early stage - PRD defined, no implementation code yet  
**Date**: 2025-11-18

---

## 1. PROJECT OVERVIEW

### System Purpose
KAIST Touch Math Academy's AI-powered system that automatically transforms teacher natural language requests into complete educational modules (database schemas + business logic + user interfaces).

### Key Components for "Practice a Bit More" Mode
The PRD describes a comprehensive pipeline that generates complete learning systems. The "practice a bit more" mode would leverage:
- **Learning Module Generation**: Auto-generated problem sets and practice materials
- **Student Progress Tracking**: Built-in progress monitoring per module
- **Adaptive Difficulty**: Rules-based progression system
- **Feedback Mechanisms**: Automated feedback generation for students

---

## 2. CURRENT CODEBASE STRUCTURE

```
/home/user/alt42standalone_v1.0/
├── .git/                                 # Git repository
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md # Complete PRD (49KB, 1262 lines)
└── README / configuration files (not yet created)
```

**Status**: This is a specification/planning repository with NO implementation code yet.
The PRD is the complete specification for how the system should be built.

---

## 3. PROPOSED ARCHITECTURE (From PRD Section 6.2)

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌──────────────────┬──────────────────┬──────────────────┐ │
│  │   Teacher UI     │  Student UI      │ Admin Dashboard  │ │
│  │  (Create        │  (Learn &        │  (Monitoring)    │ │
│  │   Modules)      │   Practice)      │                   │ │
│  └──────────────────┴──────────────────┴──────────────────┘ │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│          API GATEWAY (Node.js + Express/Fastify)            │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ Auth (JWT)   │ Rate Limit   │ Validation   │             │
│  └──────────────┴──────────────┴──────────────┘             │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│     AI PIPELINE ORCHESTRATOR (Python + FastAPI)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pipeline Stages (Sequential):                       │   │
│  │  1. World Model Reconstruction                      │   │
│  │  2. Rule Generation Engine                          │   │
│  │  3. Data Management (Schema + Pseudo Data)          │   │
│  │  4. Input Strategy Design                           │   │
│  │  5. UI Auto-Generation                              │   │
│  │  6. Integration & Deployment                        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Schemas, Data)  │   │  (Sessions)    │
└─────────────┘    └──────────────────┘   └────────────────┘
```

### Component Breakdown

#### Frontend (React.js 18+)
- **Technology**: React, TypeScript, Redux/Zustand, React Router
- **Responsibilities**:
  - User interface for teachers, students, and admins
  - Form handling and real-time validation
  - WebSocket for real-time updates on module generation
  - State management for complex module creation flows

#### API Gateway (Node.js)
- **Technology**: Express.js or Fastify
- **Responsibilities**:
  - JWT-based authentication/authorization
  - Request routing to appropriate microservices
  - Rate limiting (100 requests/hour for generation API)
  - Input validation and sanitization

#### AI Pipeline Orchestrator (Python)
- **Technology**: FastAPI, Python 3.11+
- **Responsibilities**:
  - Orchestrate 6 pipeline stages
  - Claude API integration for intelligent generation
  - State machine for tracking pipeline progress
  - Error handling and retry logic

#### Database Layer (PostgreSQL)
- **Technology**: PostgreSQL 15+ with JSONB support
- **Responsibilities**:
  - Store module definitions and generated schemas
  - Student progress tracking
  - Teacher activity logging
  - Generated code and configuration storage

#### Cache Layer (Redis)
- **Technology**: Redis 7+
- **Responsibilities**:
  - Session management
  - Cache common patterns and reusable components
  - Real-time progress updates via pub/sub

---

## 4. SIX-PHASE PIPELINE FOR MODULE GENERATION

### Phase 1: World Model Reconstruction (세계관 재구성)
**Purpose**: Parse teacher request and understand educational domain

**Inputs**: Teacher's natural language description in Korean/English
**Outputs**: 
- Domain model (concepts, relationships, operations)
- Entity definitions
- Event flow mapping

**Key FR Requirements**:
- FR-1.1: Natural language input processing
- FR-1.2: Domain model generation
- FR-1.3: Data structure analysis
- FR-1.4: Event flow definition

**For "Practice Mode"**: Identifies what should be practiced and progression flow

---

### Phase 2: Rule Generation Engine (룰 자동 생성)
**Purpose**: Generate business logic rules automatically

**Inputs**: Domain model from Phase 1
**Outputs**:
- Validation rules (e.g., "denominator cannot be zero")
- Calculation rules (e.g., "add fractions")
- Progression rules (e.g., "master visualization before arithmetic")
- Feedback rules (correct/incorrect responses)

**Key Features**:
- Complexity assessment (conditions, nesting depth, entity count)
- Ontology conversion for complex rules (OWL 2 format)
- Unit test generation
- Python/JavaScript code generation

**For "Practice Mode"**: Creates rules for problem generation, difficulty progression, and adaptive hints

---

### Phase 3: Data Management (데이터 검증 및 생성)
**Purpose**: Design database schemas and manage data

**Inputs**: Rules and data requirements from Phases 1-2
**Outputs**:
- PostgreSQL schema definition
- Migration scripts
- Pseudo data for testing/initialization

**Key Features**:
- Data availability checking (scan existing databases)
- Pseudo data generation (statistically realistic, rule-compliant)
- Schema optimization (3NF normalization)
- Automatic index creation

**Schema Generated**: Includes audit columns (created_at, updated_at, created_by)

**For "Practice Mode"**: Creates tables for StudentProgress, ProblemAttempts, and Learning History

---

### Phase 4: Input Strategy Design (입력 전략 설계)
**Purpose**: Determine how students interact with the system

**Inputs**: Data requirements and rules
**Outputs**:
- Input method specifications (forms, interactive prompts, behavior tracking)
- Validation strategy
- Data flow mapping

**Input Methods**:
- Manual input forms (text, numbers, selections)
- Behavior tracking (click patterns, time spent, sequences)
- Interactive prompts (conversational guidance)

**For "Practice Mode"**: Designs problem input, answer submission, and hint request flows

---

### Phase 5: UI Auto-Generation (UI 자동 생성)
**Purpose**: Generate React components for student interaction

**Inputs**: Input strategy and interaction requirements
**Outputs**:
- React components (TypeScript)
- Styling (follows design system)
- Responsive layouts (mobile, tablet, desktop)
- Accessible HTML (WCAG 2.1 AA)

**Key FR Requirements**:
- FR-5.1: Existing UI assessment (reuse when possible)
- FR-5.2: UX journey analysis
- FR-5.3: UI component generation
- FR-5.4: Dynamic form generation (Priority 1)
- FR-5.5: Web interface generation (Priority 2)
- FR-5.6: Conversational UI (Priority 3)

**For "Practice Mode"**: Generates problem display, solution input forms, feedback displays, progress indicators

---

### Phase 6: Integration & Deployment (시스템 완성)
**Purpose**: Complete system assembly and deployment

**Outputs**:
- RESTful API endpoints (with OpenAPI/Swagger documentation)
- Integration tests
- Docker containers
- Monitoring and logging configuration

**Generated API Endpoints** (example):
```
POST   /api/modules/{module_id}/problems          
GET    /api/modules/{module_id}/problems/{id}     
POST   /api/modules/{module_id}/submit            
GET    /api/modules/{module_id}/progress/{student_id} 
PUT    /api/modules/{module_id}/settings          
```

---

## 5. LMS INTEGRATION POINTS (FROM PRD SECTION 7.6)

### Current Integration Scope (MVP)
The system is designed as **STANDALONE** initially. LMS integration is deferred to Phase 3.

### Existing KAIST Systems (To Be Integrated)
1. **Authentication**: 
   - Type: SAIST SSO (SAML/OAuth)
   - Integration: Read-only for teacher/student identity verification
   - Security: JWT tokens with 1-hour expiration

2. **Student Database**:
   - Integration: Read-only access to student roster
   - Data Available: Student IDs, names, grade levels
   - Use: Pseudo data generation, student enrollment

3. **Grade System**:
   - Integration: Optional export of student progress/grades
   - Format: TBD (depends on KAIST system)

4. **LMS Integration** (Future Phase 3):
   - Standard: LTI (Learning Tools Interoperability)
   - Potential Platforms: Canvas, Moodle, Blackboard, custom systems

### Third-Party Service Integration
1. **Claude API** (Anthropic): Primary AI reasoning engine
2. **Email Service**: SendGrid or AWS SES (notifications)
3. **File Storage**: AWS S3 or MinIO (generated artifacts)
4. **Analytics**: Google Analytics or Mixpanel (usage tracking)

---

## 6. DATA MODELS (FROM PRD SECTION 6.3)

### Core Entities for "Practice Mode"

#### 1. Module
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50),           -- "mathematics"
    grade_level VARCHAR(50),       -- "3rd grade", "G3", etc.
    teacher_id UUID NOT NULL,
    status VARCHAR(20),            -- "generating", "active", "archived"
    world_model JSONB,             -- AI-generated domain model
    generated_schema JSONB,        -- Database schema definition
    generated_ui JSONB,            -- UI component definitions
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 2. Student
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    grade_level VARCHAR(50),
    enrolled_modules UUID[],       -- Array of module IDs
    created_at TIMESTAMP
);
```

#### 3. GenerationJob (Tracks pipeline progress)
```sql
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    stage VARCHAR(50),             -- "world_model", "rules", "data", "input_strategy", "ui", "deployment"
    status VARCHAR(20),            -- "pending", "in_progress", "completed", "failed"
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

#### 4. Rule (Generated business rules)
```sql
CREATE TABLE rules (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50),              -- "validation", "calculation", "progression", "feedback"
    complexity_score INTEGER,
    is_ontology BOOLEAN,
    code TEXT,                     -- Generated rule code
    ontology_reference VARCHAR(255)
);
```

#### 5. StudentProgress (Dynamically generated per module)
```sql
-- Schema varies per module, but always includes:
-- - student_id UUID
-- - module_id UUID
-- - started_at TIMESTAMP
-- - completed_at TIMESTAMP
-- - progress_percentage INTEGER
-- - custom_fields (depends on module rules)
```

#### 6. StudentAttempt (For practice mode tracking)
```sql
-- Example for Fractions module:
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    answer_numerator INTEGER,
    answer_denominator INTEGER,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP,
    created_at TIMESTAMP
);
```

---

## 7. TECHNOLOGY STACK

### Frontend Stack
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router v6
- **UI Components**: Material-UI (MUI) or Ant Design
- **Forms**: React Hook Form + Yup validation
- **API Client**: Axios with interceptors
- **Real-time**: Socket.io-client (WebSocket)

### Backend Stack
- **API Gateway**: Node.js (Express or Fastify)
- **Pipeline Orchestrator**: Python 3.11+ (FastAPI)
- **Task Queue**: Celery with Redis broker
- **AI Integration**: Anthropic Claude API (Python SDK)
- **Code Generation**: Jinja2 templates + AST manipulation

### Database Stack
- **Primary**: PostgreSQL 15+ (JSONB support)
- **Caching**: Redis 7+
- **Graph Storage (Future)**: Neo4j (for ontologies)

### DevOps Stack
- **Containerization**: Docker + Docker Compose
- **Orchestration (Future)**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## 8. PRACTICE MODE INTEGRATION POINTS

### How "Practice a Bit More" Would Work

Based on the PRD architecture, the practice mode would:

#### 1. **Rule-Based Adaptive Difficulty**
- Teachers define progression rules in Phase 2
- Rules determine when students are ready for more practice
- System tracks mastery metrics and suggests practice opportunities

#### 2. **Dynamic Problem Generation**
- Rules engine generates new problems on-demand
- Each problem follows teacher-specified constraints
- Problem difficulty adjusts based on student performance

#### 3. **Progress Tracking**
- StudentProgress table tracks completion percentage
- Custom fields per module store mastery metrics
- Triggers (defined in rules) identify when "practice more" should be suggested

#### 4. **Feedback & Guidance**
- Rules engine generates contextual feedback
- Hints are generated based on student attempts
- Encouragement messages support motivation

#### 5. **Real-time Updates**
- WebSocket connections push progress updates
- Real-time problem generation as student practices
- Live leaderboards or achievement displays (future)

### Integration with Student UI

The student-facing interface would include:
- Problem display area (auto-generated component)
- Answer input form (auto-generated)
- Feedback display (auto-generated based on rules)
- Progress indicator (shows mastery level)
- "Practice More" button/prompt (triggered by rules/heuristics)
- Help/hint request system

---

## 9. EXISTING IMPLEMENTATIONS IN PRD

The PRD specifies several components to be built from scratch:

### ✅ Well-Defined (In PRD)
1. **Complexity Assessment Metrics** (Section 7.2)
   - Condition count, nesting depth, entity count, cyclic dependencies
   - Ontology conversion thresholds defined

2. **Prompt Engineering Structure** (Section 7.1)
   - Template format specified
   - Prompt management approach defined

3. **Error Handling & Resilience** (Section 7.4)
   - Retry logic (exponential backoff, 3 attempts)
   - Validation gates at each stage
   - Rollback capability

4. **Security Considerations** (Section 7.5)
   - Code sandboxing in Docker containers
   - Static analysis for injection vulnerabilities
   - Whitelist approach for libraries
   - RBAC implementation
   - Encryption: AES-256 at rest, TLS 1.3 in transit

5. **Rate Limiting**
   - 100 requests/hour per teacher for generation API

### ⚠️ Partially Defined
1. **Design System**: Mentioned but details TBD (Question #7 in Section 9)
2. **Student Data Access**: Depends on KAIST systems (Question #8)
3. **Module Approval Workflow**: TBD (Question #9)

### ❌ Out of Scope (MVP)
1. Mobile native apps
2. Robot avatar integration
3. Sensor data integration
4. Multi-subject support beyond mathematics
5. Advanced adaptive learning/predictive analytics
6. Real-time collaboration between teachers
7. Module marketplace/sharing
8. Voice input for teacher requests
9. Automatic video content generation
10. Gamification (achievements, leaderboards)

---

## 10. OPEN QUESTIONS FOR IMPLEMENTATION

### Critical (Before Development)
1. **KAIST Authentication System**: What SSO/OAuth provider? (SAML, custom?)
2. **Existing Codebase**: Is there an existing platform to integrate with?
3. **Deployment Environment**: On-premise, AWS, Azure, GCP?
4. **Budget Constraints**: Monthly budget for Claude API costs?
5. **Example Teacher Requests**: Real examples for prompt validation

### Important (During Development)
6. **Data Privacy Compliance**: PIPA, FERPA, GDPR requirements?
7. **Design System**: Existing KAIST design system colors/components?
8. **Student Data Access**: What data is available from student database?
9. **Module Approval Workflow**: Admin approval before student access?
10. **Existing Module Migration**: Any legacy modules to migrate?

---

## 11. DIRECTORY STRUCTURE TO CREATE

```
alt42standalone_v1.0/
├── .github/
│   └── workflows/
│       ├── ci-test.yml
│       └── cd-deploy.yml
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TeacherDashboard/
│   │   │   ├── StudentUI/
│   │   │   ├── AdminDashboard/
│   │   │   └── GeneratedComponents/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── backend/
│   ├── api_gateway/          (Node.js + Express)
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── README.md
│   ├── pipeline_orchestrator/ (Python + FastAPI)
│   │   ├── src/
│   │   │   ├── stages/
│   │   │   │   ├── world_model/
│   │   │   │   ├── rule_engine/
│   │   │   │   ├── data_manager/
│   │   │   │   ├── input_strategy/
│   │   │   │   ├── ui_generator/
│   │   │   │   └── deployer/
│   │   │   ├── models/
│   │   │   ├── prompts/
│   │   │   ├── main.py
│   │   │   └── config.py
│   │   ├── requirements.txt
│   │   └── README.md
│   └── database/
│       ├── migrations/
│       ├── seeds/
│       └── schema.sql
├── tasks/
│   ├── 0001-prd-ai-education-pipeline.md
│   ├── 0002-implementation-guide.md
│   └── 0003-testing-strategy.md
├── docs/
│   ├── architecture.md
│   ├── api-documentation.md
│   └── deployment-guide.md
└── README.md
```

---

## 12. QUICK REFERENCE: PRACTICE MODE MAPPING

### How the PRD Components Map to "Practice a Bit More" Feature

| PRD Component | Practice Mode Application |
|---|---|
| **Phase 1: World Model** | Defines learning domain and practice concepts |
| **Phase 2: Rules** | Progression rules, difficulty adaptation, mastery thresholds |
| **Phase 3: Data** | StudentProgress tracking, ProblemAttempt logging, Mastery metrics |
| **Phase 4: Input Strategy** | Problem submission, answer input, hint requests |
| **Phase 5: UI Generation** | Problem display, feedback, progress indicators |
| **Phase 6: Deployment** | Practice endpoints, WebSocket updates, Analytics |
| **Authentication** | Read KAIST SSO for student/teacher identity |
| **Database** | StudentProgress (tracks completion %), StudentAttempt (tracks answers) |
| **Real-time** | WebSocket for live progress updates, hint delivery |
| **Rules Engine** | Determines when student should practice more based on mastery |
| **API Gateway** | Rate limiting on problem generation, authentication |

---

## SUMMARY

This is a **specification-stage project** with comprehensive PRD but **zero implementation code**. The PRD outlines:

✅ **Complete**: Architecture, technology stack, data models, functional requirements
✅ **Clear**: 47 specific functional requirements across 6 pipeline phases
✅ **Detailed**: Security, performance, error handling, success metrics
⚠️ **Pending**: Answers to 10+ open questions about KAIST integration
❌ **Not Started**: No code, no CI/CD, no infrastructure templates

The "Practice a Bit More" mode would leverage:
1. **Adaptive Rules** from the Rule Generation Engine
2. **Progress Tracking** from the Data Management Phase
3. **Dynamic UI** from the UI Auto-Generation Phase
4. **Real-time Updates** via WebSocket and Redis pub/sub
5. **Problem Generation** from rules-based templates

**Next Steps**: 
1. Answer the 10 open questions (Section 9 of PRD)
2. Create project scaffolding (repo structure above)
3. Implement Phase 1-2 of the pipeline
4. Begin practice mode feature design based on available rules and data models

