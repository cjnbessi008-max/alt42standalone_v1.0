# Alt42 Standalone - Visual Architecture & Reference Guide

## One-Page System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                   TEACHER CREATES MODULE REQUEST                      │
│                  "Create fractions module for 3rd grade"             │
│                                                                        │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API GATEWAY (Node)    │
                    │  - Auth                 │
                    │  - Rate Limit           │
                    │  - Route to Pipeline    │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────▼─────────────────────────┐
        │        PYTHON AI PIPELINE ORCHESTRATOR            │
        │                                                   │
        │  ┌─────────────────────────────────────────────┐ │
        │  │ Stage 1: World Model Reconstruction         │ │
        │  │ Input:  "fractions, 3rd grade"              │ │
        │  │ Output: {concepts, operations, progression} │ │
        │  │ Claude API calls: 3-5                       │ │
        │  │ Duration: 1-3 min                           │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        │  ┌────────────────────▼────────────────────────┐ │
        │  │ Stage 2: Rule Generation Engine             │ │
        │  │ Input:  World model                         │ │
        │  │ Output: {rules, code, tests}                │ │
        │  │ Claude API calls: 2-4                       │ │
        │  │ Duration: 2-5 min                           │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        │  ┌────────────────────▼────────────────────────┐ │
        │  │ Stage 3: Data Management                    │ │
        │  │ Input:  Rules                               │ │
        │  │ Output: {schema, migrations, pseudo_data}   │ │
        │  │ PostgreSQL: Create tables, migrations       │ │
        │  │ Duration: 2-5 min                           │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        │  ┌────────────────────▼────────────────────────┐ │
        │  │ Stage 4: Input Strategy Design              │ │
        │  │ Input:  Schema                              │ │
        │  │ Output: {input_specs, validation}           │ │
        │  │ Claude API calls: 1-2                       │ │
        │  │ Duration: 1-2 min                           │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        │  ┌────────────────────▼────────────────────────┐ │
        │  │ Stage 5: UI Auto-Generation                 │ │
        │  │ Input:  Input strategy                      │ │
        │  │ Output: {React components, CSS}             │ │
        │  │ Claude API calls: 5-10                      │ │
        │  │ Duration: 3-10 min                          │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        │  ┌────────────────────▼────────────────────────┐ │
        │  │ Stage 6: Integration & Deployment           │ │
        │  │ Input:  All components                      │ │
        │  │ Output: {Docker, APIs, tests, docs}         │ │
        │  │ Duration: 2-5 min                           │ │
        │  └────────────────────┬────────────────────────┘ │
        │                       │                          │
        └───────────────────────┼──────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  DATABASE (PostgreSQL)│
                    │  - Core metadata     │
                    │  - Generated schemas │
                    │  - Student progress  │
                    └─────────────────────┘
                                │
        ┌───────────────────────▼──────────────────────────┐
        │           COMPLETE EDUCATIONAL MODULE             │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │ Docker Container                           │  │
        │  │ - React UI (Student Interface)             │  │
        │  │ - API Server (Express)                     │  │
        │  │ - Business Logic (Generated Rules)         │  │
        │  │ - Database (Postgres with generated schema)│  │
        │  │ - Tests & Documentation                    │  │
        │  └────────────────────────────────────────────┘  │
        │                                                   │
        │            READY FOR STUDENTS TO USE             │
        │                                                   │
        └───────────────────────────────────────────────────┘
```

---

## Data Flow Through Pipeline

```
Stage 1: Extract Concepts
┌──────────────────────────────┐
│ Teacher Input (Natural Lang) │
│ "fractions, add, subtract"   │
└──────────────┬───────────────┘
               │ Claude NLP
               ▼
        ┌──────────────────┐
        │ World Model      │
        │ {concepts: [...] │
        │  relations: [...]│
        │  ops: [...]}     │
        └────────┬─────────┘
                 │
Stage 2: Generate Rules
                 │
        ┌────────▼──────────────┐
        │ Rule Extractor        │
        │ - Validation rules    │
        │ - Calculation rules   │
        │ - Progression rules   │
        └────────┬──────────────┘
                 │ Claude Code Gen
                 ▼
        ┌────────────────────┐
        │ Generated Code     │
        │ .py files          │
        │ with unit tests    │
        └────────┬───────────┘
                 │
Stage 3: Design Database
                 │
        ┌────────▼─────────────────┐
        │ Schema Designer          │
        │ - Identify entities      │
        │ - Normalize (3NF)        │
        │ - Add constraints        │
        │ - Plan migrations        │
        └────────┬────────────────┘
                 │ Alembic
                 ▼
        ┌──────────────────────────┐
        │ PostgreSQL Schema        │
        │ - Tables created         │
        │ - Indexes created        │
        │ - Pseudo data seeded     │
        └────────┬─────────────────┘
                 │
Stage 4: Plan Input Methods
                 │
        ┌────────▼──────────────────┐
        │ Input Analyzer           │
        │ - Form fields            │
        │ - Validation rules       │
        │ - UX flow                │
        └────────┬──────────────────┘
                 │ Claude
                 ▼
        ┌──────────────────────┐
        │ Input Specs (JSON)   │
        │ {forms, validation,  │
        │  tracking}           │
        └────────┬─────────────┘
                 │
Stage 5: Generate UI
                 │
        ┌────────▼──────────────────────┐
        │ React Component Generator     │
        │ - Create .tsx files          │
        │ - Add styling               │
        │ - Accessibility check       │
        │ - Responsive design         │
        └────────┬──────────────────────┘
                 │ Claude
                 ▼
        ┌──────────────────────────┐
        │ React Components         │
        │ - FractionVisualizer.tsx │
        │ - ProblemForm.tsx        │
        │ - ProgressBar.tsx        │
        │ - With CSS modules       │
        └────────┬─────────────────┘
                 │
Stage 6: Package & Deploy
                 │
        ┌────────▼──────────────────────┐
        │ Integration & Deployment      │
        │ - Generate API routes         │
        │ - Create tests                │
        │ - Build Docker image          │
        │ - Generate documentation      │
        └────────┬──────────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │ Complete Module Ready    │
        │ (Docker container)       │
        │ Ready for deployment!    │
        └──────────────────────────┘
```

---

## Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER (Browser)                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React 18 + TypeScript                               │  │
│  │ - Redux Toolkit (state management)                  │  │
│  │ - Material-UI (components)                          │  │
│  │ - React Router (navigation)                         │  │
│  │ - Axios (API client)                                │  │
│  │ - Socket.io-client (real-time)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────▼─────────────────────────────────────┐
│ API GATEWAY (Node.js Server)                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Express.js or Fastify                              │   │
│  │ - JWT Authentication                               │   │
│  │ - Rate Limiting                                    │   │
│  │ - CORS & Security Headers                          │   │
│  │ - Request validation                               │   │
│  │ - Error handling & logging                         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼──────────────────────────────────────┐
│ PIPELINE ORCHESTRATOR (Python)                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ FastAPI Server (async processing)                  │   │
│  │ - Orchestrates 6-stage pipeline                    │   │
│  │ - Manages state machine                            │   │
│  │ - Handles errors & retries                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Stage 1: WORLD MODEL                                       │
│    └─ Claude API (NLP)                                      │
│                                                              │
│  Stage 2: RULES                                             │
│    └─ Claude API (Code Generation)                         │
│    └─ Python AST (Code validation)                          │
│                                                              │
│  Stage 3: DATA                                              │
│    └─ SQLAlchemy ORM                                        │
│    └─ Alembic (Migrations)                                  │
│    └─ Faker (Pseudo data)                                   │
│                                                              │
│  Stage 4: INPUT STRATEGY                                    │
│    └─ Claude API                                            │
│    └─ JSON Schema validator                                 │
│                                                              │
│  Stage 5: UI GENERATION                                     │
│    └─ Claude API                                            │
│    └─ Jinja2 (Templates)                                    │
│    └─ AST manipulation                                      │
│                                                              │
│  Stage 6: DEPLOYMENT                                        │
│    └─ Docker API                                            │
│    └─ Test runners                                          │
│    └─ Doc generators                                        │
│                                                              │
│  Supporting Services:                                       │
│    └─ Celery (Task queue)                                   │
│    └─ Logging & Monitoring                                  │
│    └─ Error tracking                                        │
└────────────────────────┬──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬──────────────────┐
        │                │                │                  │
        ▼                ▼                ▼                  ▼
    ┌────────┐    ┌──────────────┐   ┌────────┐      ┌────────────┐
    │ Claude │    │ PostgreSQL   │   │ Redis  │      │   Docker   │
    │  API   │    │     15+      │   │  7+    │      │            │
    │ (LLM)  │    │              │   │ Cache  │      │ Container  │
    │        │    │ - Core DB    │   │        │      │ Registry   │
    │        │    │ - Schemas    │   │ Sess   │      │            │
    │        │    │ - Generated  │   │ Queues │      │            │
    │        │    │   data       │   │        │      │            │
    └────────┘    └──────────────┘   └────────┘      └────────────┘
```

---

## Module Lifespan (From Request to Student Use)

```
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+0min                                                 │
│ STATUS: Request Submitted                                   │
│                                                              │
│ Teacher enters: "Create fractions module for 3rd graders"   │
│ System creates GenerationJob record (status: PENDING)       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+1-3min                                               │
│ STATUS: Stage 1 - World Model Reconstruction                │
│                                                              │
│ ✓ Claude analyzes teacher request                           │
│ ✓ Generates concept map                                     │
│ ✓ Identifies learning progression                           │
│ ✓ Stores in modules.world_model (JSONB)                     │
│ ✓ GenerationJob records progress                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+3-8min                                               │
│ STATUS: Stage 2 - Rule Generation                           │
│                                                              │
│ ✓ Claude generates business rules (Python code)             │
│ ✓ Analyzes rule complexity                                  │
│ ✓ Generates unit tests                                      │
│ ✓ Stores rules in database                                  │
│ ✓ Rules table populated with complexity_score               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+8-13min                                              │
│ STATUS: Stage 3 - Data Management                           │
│                                                              │
│ ✓ Analyzes data requirements from rules                     │
│ ✓ Generates normalized PostgreSQL schema                    │
│ ✓ Creates Alembic migration files                           │
│ ✓ Executes migrations (tables created)                      │
│ ✓ Generates & seeds pseudo data                             │
│ ✓ Stores schema spec in modules.generated_schema (JSONB)    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+13-15min                                             │
│ STATUS: Stage 4 - Input Strategy Design                     │
│                                                              │
│ ✓ Determines input methods (forms, tracking, etc)           │
│ ✓ Generates validation rules                                │
│ ✓ Plans data flow                                           │
│ ✓ Stores input specs (JSON)                                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+15-25min                                             │
│ STATUS: Stage 5 - UI Auto-Generation                        │
│                                                              │
│ ✓ Generates React components (TypeScript JSX)               │
│ ✓ Applies styling (KAIST brand)                             │
│ ✓ Ensures accessibility (WCAG 2.1 AA)                       │
│ ✓ Responsive design (mobile/tablet/desktop)                 │
│ ✓ Component library created                                 │
│ ✓ Stores UI specs in modules.generated_ui (JSONB)           │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+25-30min                                             │
│ STATUS: Stage 6 - Integration & Deployment                  │
│                                                              │
│ ✓ Generates Express API routes                              │
│ ✓ Creates integration tests                                 │
│ ✓ Builds Docker container                                   │
│ ✓ Generates API documentation (OpenAPI)                     │
│ ✓ Creates user guides                                       │
│ ✓ Sets up monitoring (Prometheus config)                    │
│ ✓ Module status = ACTIVE                                    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ TIME: T+30min - READY!                                       │
│ STATUS: ACTIVE - Ready for Students                         │
│                                                              │
│ Complete system ready for deployment:                       │
│ ✓ Database with schema & pseudo data                        │
│ ✓ Business logic (rules) validated                          │
│ ✓ React UI fully generated                                  │
│ ✓ API endpoints ready                                       │
│ ✓ Tests passing                                             │
│ ✓ Documentation generated                                   │
│ ✓ Docker container ready                                    │
│                                                              │
│ Teacher can now deploy to students!                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified View)

```
SYSTEM METADATA:
┌─────────────────────┐
│      modules        │  <- One per generated module
│                     │
│ id (UUID) PK        │
│ name                │
│ teacher_id (FK)     │────┐
│ status              │    │
│ world_model (JSONB) │    │
│ generated_schema    │    │
│ generated_ui        │    │
│ version             │    │
│ created_at          │    │
└─────────────────────┘    │
                           │
        ┌──────────────────┘
        │
        ▼
┌─────────────────────┐
│     teachers        │
│                     │
│ id (UUID) PK        │
│ name                │
│ email               │
│ role                │
│ preferences (JSON)  │
└─────────────────────┘

┌──────────────────────┐
│  generation_jobs     │  <- Track pipeline execution
│                      │
│ id (UUID) PK         │
│ module_id (FK)       │
│ stage (1-6)          │
│ status               │
│ input_data (JSONB)   │
│ output_data (JSONB)  │
│ error_log            │
│ started_at           │
│ completed_at         │
└──────────────────────┘

┌──────────────────────┐
│      rules           │  <- Generated business rules
│                      │
│ id (UUID) PK         │
│ module_id (FK)       │
│ name                 │
│ type                 │
│ complexity_score     │
│ is_ontology          │
│ code                 │
└──────────────────────┘

DYNAMICALLY GENERATED (Per Module):
┌─────────────────────────────────┐
│  fraction_problems              │
│  (auto-created for Fractions)   │
│                                 │
│ id (UUID) PK                    │
│ module_id (FK)                  │
│ numerator_1, denominator_1      │
│ numerator_2, denominator_2      │
│ visual_representation           │
│ difficulty_level                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  fraction_attempts              │
│  (student submissions)          │
│                                 │
│ id (UUID) PK                    │
│ student_id (FK)                 │
│ problem_id (FK)                 │
│ answer_numerator                │
│ answer_denominator              │
│ is_correct                      │
│ time_spent_seconds              │
│ attempted_at                    │
└─────────────────────────────────┘
```

---

## Complexity Threshold Decision Tree

```
                        New Rules Generated
                               │
                   ┌───────────┴───────────┐
                   │                       │
                   ▼                       ▼
         Conditions ≤ 5?          Nesting Depth ≤ 3?
           / Yes  \ No               / Yes  \ No
          /         \               /         \
        ✓           ✗              ✓           ✗
        │           │              │           │
        └───┬───────┘              └─────┬─────┘
            │                            │
            ▼                            ▼
    Entities ≤ 4?                   → COMPLEX
    / Yes  \ No                        │
   /         \                         ├─ Use Ontology
  ✓           ✗                        │  (OWL/RDF)
  │           │                        │
  └─────┬─────┘                        │
        │                              │
        ▼                              │
  Cyclic Deps?                         │
  / No  \ Yes                          │
 /       \                             │
✓         ✗                            │
│         │                            │
└────┬────┘                            │
     │                                 │
     ▼                                 ▼
  SIMPLE                            COMPLEX
  (Procedural Rules)                (Ontology)
     │                                 │
     ├─ Python code                    ├─ OWL schema
     ├─ Unit tests                     ├─ RDF reasoning
     ├─ Direct execution               ├─ Semantic queries
     └─ High performance               └─ Flexible inference
```

---

## Success Metrics Dashboard (6 Month View)

```
ADOPTION RATE
  Month 0: 0%      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Target: Start)
  Month 1: 20%     ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Target: 20%)
  Month 3: 40%     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Target: 40%)
  Month 6: 70%     ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░ (Target: 70%)

GENERATION SPEED (Hours)
  Target: <2 hours
  Week 1:  8 hours  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Week 4:  5 hours  █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Week 12: 2 hours  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Target:  <2h      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

SYSTEM ACCURACY (% Minimal Adjustments)
  Target: >85%
  Initial: 60%     ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Month 2: 75%     ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Month 4: 85%     █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Target:  >85%    █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

TEACHER SATISFACTION (NPS)
  Target: >50
  Month 1: 10      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Month 3: 35      ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Month 6: 65      █████████████░░░░░░░░░░░░░░░░░░░░░░░░░
  Target: >50      ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

---

## Critical Decisions Reference

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| Database | PostgreSQL | JSONB support, normalization | More complex than MySQL |
| Backend | Python | AI/ML, Claude API, code gen | Fewer developers than Node |
| Frontend | React | Rich UI, accessibility | Larger bundle size |
| Architecture | Microservices | Scalability, testability | Operational complexity |
| AI Provider | Claude API | Superior reasoning, code gen | Higher cost than others |
| MVP Scope | Standalone | Simpler MVP, cleaner arch | No LMS integration yet |
| Accessibility | WCAG 2.1 AA | Educational context | Extra development effort |

---

## What To Do First (Priority Order)

```
WEEK 1 - PLANNING
├─ Answer 5 open questions (auth, deployment, budget, design, examples)
├─ Interview stakeholders (teachers, IT, admins)
├─ Review KAIST infrastructure
└─ Get approval to proceed

WEEK 2 - SETUP
├─ Create project directories (src/, docker/, tests/, etc.)
├─ Setup Docker environment
├─ Create database migration system (Alembic)
├─ Setup CI/CD pipeline (GitHub Actions)
└─ Create coding standards document

WEEKS 3-8 - PHASE 1 (Core Pipeline)
├─ Implement Stage 1: World Model Reconstruction
├─ Implement Stage 2: Rule Generation Engine
├─ Write tests for both stages
└─ Document API design

WEEKS 9-12 - PHASE 2 (Data)
├─ Implement Stage 3: Data Management
├─ Test schema generation
└─ Build & test data seeding

WEEKS 13-22 - PHASE 3 (UI)
├─ Implement Stage 4: Input Strategy
├─ Implement Stage 5: UI Generation
└─ Build component library

WEEKS 23-26 - PHASE 4 (Deploy)
├─ Implement Stage 6: Deployment
├─ Create integration tests
├─ Build Docker images
└─ Generate documentation

WEEKS 27-30 - PHASE 5 (Launch)
├─ Beta test with 5-10 teachers
├─ Collect feedback
├─ Iterate on issues
└─ Full rollout

TOTAL: 30 weeks to MVP ✓
```

---

## Key Metrics Quick Reference

| Metric | Target | Threshold | Timeline |
|--------|--------|-----------|----------|
| **Adoption** | >70% | <30% = pivot | 6 months |
| **Speed** | <2h | N/A | Per module |
| **Accuracy** | >85% | <70% = issue | Per module |
| **Satisfaction** | NPS>50 | <0 = pivot | Quarterly |
| **Uptime** | 99% | <95% = issue | Continuous |
| **Cost** | <$5/module | N/A | Per module |
| **Outcomes** | Maintained+ | Decline = pause | End of semester |

---

