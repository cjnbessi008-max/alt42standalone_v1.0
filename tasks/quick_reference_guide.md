# Alt42 Standalone - Quick Reference Guide

## What Is This Project?

**Project Name**: AI Education System Pipeline (Alt42 Standalone)

**Mission**: Enable non-technical teachers to create sophisticated educational modules by simply describing what they want in natural language. The AI system automatically generates the complete technical infrastructure.

**Current Status**: Greenfield project - PRD phase complete, zero implementation code

**Key User**: Math teachers at KAIST Touch Math Academy wanting to create practice modules

**Key Achievement**: 80% reduction in module creation time (40-80 hours → ~2 hours)

---

## Architecture at a Glance

### 3-Tier System

```
FRONTEND (React)
Teacher Dashboard → Module Generator → Student Learning Interface
         ↓
API GATEWAY (Node.js)
Authentication, Rate Limiting, Routing
         ↓
PIPELINE (Python)
World Model → Rules → Data → Input Strategy → UI → Deployment
         ↓
SERVICES
Claude API | PostgreSQL | Redis | Docker
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, MUI | Teacher & student interfaces |
| **Gateway** | Node.js, Express/Fastify | API routing, auth |
| **Pipeline** | Python 3.11, FastAPI | Core AI generation engine |
| **AI** | Claude (Anthropic) | Domain understanding, code generation |
| **Database** | PostgreSQL 15+ | Module schemas, generation metadata |
| **Cache** | Redis 7+ | Sessions, caching |
| **Deployment** | Docker, GitHub Actions | Containerization & CI/CD |

---

## The 6 Pipeline Stages

### Quick Summary

| Stage | Duration | Output | Status |
|-------|----------|--------|--------|
| 1. World Model | 1-3 min | Domain understanding (JSON) | TBD |
| 2. Rules | 2-5 min | Executable business logic | TBD |
| 3. Data | 2-5 min | PostgreSQL schemas + migrations | TBD |
| 4. Input Strategy | 1-2 min | Input specs & validation | TBD |
| 5. UI Generation | 3-10 min | React components | TBD |
| 6. Deployment | 2-5 min | Docker image, APIs, docs | TBD |
| **TOTAL** | **2-30 min** | **Complete module** | **Not started** |

### Stage Details

**Stage 1: World Model Reconstruction** (Language Understanding)
- Extracts concepts, relationships, operations from teacher request
- Builds concept graphs
- Identifies learning progression
- Example: "fractions module" → Concepts: Fraction, Numerator, Denominator

**Stage 2: Rule Generation Engine** (Business Logic)
- Converts domain understanding into executable rules
- Analyzes rule complexity
- Generates Python/JavaScript code
- Converts complex rules to ontologies
- Example: "denominator cannot be zero" → Validation rule code

**Stage 3: Data Management** (Database)
- Designs PostgreSQL schemas (3NF normalized)
- Checks data availability
- Generates pseudo data if needed
- Creates migration scripts
- Example: Tables for problems, student attempts, progress

**Stage 4: Input Strategy Design** (Data Collection)
- Determines how students provide input
- Chooses input methods (forms, tracking, prompts)
- Defines validation rules
- Example: Number input for fraction numerator, drag-drop for visualization

**Stage 5: UI Auto-Generation** (React Components)
- Generates React components for interaction
- Applies styling (KAIST brand)
- Ensures accessibility (WCAG 2.1 AA)
- Example: FractionVisualizer, ProblemForm, ProgressBar

**Stage 6: Integration & Deployment** (Production Ready)
- Generates API endpoints
- Creates Docker containers
- Generates tests and documentation
- Example: Complete deployable module with monitoring

---

## Database Schema (Planned)

### Core System Tables

```sql
modules              -- One per AI-generated educational module
├── id (UUID)
├── name
├── teacher_id (FK)
├── status (generating|active|archived)
├── world_model (JSONB)      -- AI output from Stage 1
├── generated_schema (JSONB)  -- Generated schema spec
├── generated_ui (JSONB)      -- Component definitions

teachers
├── id (UUID)
├── name, email
├── role (teacher|admin|maintainer)

students
├── id (UUID)
├── name, grade_level
├── enrolled_modules

generation_jobs      -- Track pipeline execution
├── id (UUID)
├── module_id (FK)
├── stage (1-6)
├── status (pending|in_progress|completed|failed)
├── input_data (JSONB)
├── output_data (JSONB)
├── error_log

rules               -- Business rules
├── id (UUID)
├── module_id (FK)
├── name
├── type (validation|calculation|progression|feedback)
├── complexity_score
├── code (generated)

dynamic_schemas     -- Metadata for generated schemas
├── id (UUID)
├── module_id (FK)
├── table_name
├── schema_definition (JSONB)
├── migration_script
├── is_applied
```

### Dynamically Generated Tables

Each module creates its own problem/progress tables:
- `{module_name}_problems` - Exercise data
- `{module_name}_attempts` - Student submissions
- `{module_name}_progress` - Learning progress

Example for fractions module:
- `fraction_problems`
- `fraction_attempts`
- `fraction_progress`

---

## Key Design Decisions

### 1. PostgreSQL, Not MySQL
**Why?**
- JSONB support (store AI-generated models)
- Better normalization (3NF compliance)
- Superior indexing for complex queries
- Ontology support (future with Neo4j)

### 2. Python Pipeline, Not PHP
**Why?**
- Claude API integration (better Python support)
- ML/AI libraries (numpy, pandas)
- Code generation (AST manipulation)
- Structured code generation with Jinja2

### 3. React Frontend, Not Traditional Server-Rendered
**Why?**
- Rich interactive UI (visualizations, drag-drop)
- Real-time updates (WebSocket)
- Responsive design (mobile-first)
- Accessibility (WCAG compliant)

### 4. Microservices Architecture
**Why?**
- Independent scaling of pipeline stages
- Loose coupling (easier to modify stages)
- Clear responsibilities (single purpose per service)
- Testability (easier to test individual stages)

### 5. Claude API for AI Reasoning
**Why?**
- Superior understanding of educational concepts
- Excellent at code generation
- Structured output support (JSON mode)
- Better than other LLMs for this use case

### 6. Code Generation as First-Class
**Why?**
- Ensure consistency and reproducibility
- All artifacts version controlled
- Complete audit trail
- Rollback capability

---

## What's NOT Included (MVP Scope)

### Explicitly Out of Scope
- Moodle/LMS integration (future Phase 3)
- Mobile native apps (responsive web only)
- Robot avatar interaction (future Phase 2)
- Multi-subject support (math only for MVP)
- Advanced analytics & ML (future)
- Real-time collaboration (single teacher per module)

### Deliberately Excluded
- Manual code editing by teachers (security risk)
- Voice input processing (future)
- Video content generation (out of scope)
- Gamification (future enhancement)

---

## Critical Success Factors

### For Users
1. **Speed**: <2 hours from request to deployment
2. **Accuracy**: >85% of modules need minimal adjustments
3. **Simplicity**: No coding required, educational terminology only
4. **Quality**: Generated modules work correctly first time

### For System
1. **Reliability**: 99% uptime
2. **Scalability**: Handle 50-100 concurrent teachers
3. **Cost**: <$5 Claude API cost per module
4. **Security**: AES-256 encryption, RBAC, audit logging

### For Business
1. **Adoption**: >70% of teachers within 6 months
2. **Satisfaction**: NPS > 50
3. **Learning Outcomes**: Equal or better than manual modules
4. **Time Savings**: 80% reduction vs. manual development

---

## File Organization (To Be Created)

```
alt42standalone_v1.0/
│
├── src/
│   ├── frontend/              # React app
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.tsx
│   │
│   ├── backend/               # Node.js API Gateway
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── server.ts
│   │
│   ├── pipeline/              # Python orchestrator
│   │   ├── stages/
│   │   │   ├── stage1_world_model/
│   │   │   ├── stage2_rules/
│   │   │   ├── stage3_data/
│   │   │   ├── stage4_input_strategy/
│   │   │   ├── stage5_ui_generator/
│   │   │   └── stage6_deployer/
│   │   ├── orchestrator.py
│   │   ├── prompts/           # Claude prompt templates
│   │   └── validators/
│   │
│   └── database/
│       ├── migrations/
│       ├── schemas/
│       └── seeds/
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.pipeline
│   └── docker-compose.yml
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   └── CONTRIBUTING.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── config/
│   ├── development.env
│   ├── production.env
│   └── database.yml
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── build.yml
│       └── deploy.yml
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md (CURRENT)
│
├── .gitignore
├── package.json
├── requirements.txt
└── README.md
```

---

## Implementation Priority

### Phase 1 (Weeks 1-8): Core Pipeline
1. **Must Have**: World Model Reconstruction
2. **Must Have**: Rule Generation Engine
3. **High Priority**: Data Management
4. **High Priority**: Basic API

### Phase 2 (Weeks 9-18): UI & Interaction
5. **High Priority**: Input Strategy Design
6. **High Priority**: UI Auto-Generation
7. **Medium Priority**: Form Generation
8. **Medium Priority**: Basic Dashboard

### Phase 3 (Weeks 19-26): Deployment & Testing
9. **High Priority**: API Generation
10. **High Priority**: Integration Tests
11. **High Priority**: Docker Setup
12. **High Priority**: Documentation

### Phase 4 (Weeks 27-30): Launch
13. **Beta Testing** with 5-10 teachers
14. **Iterate** on feedback
15. **General Availability** rollout

---

## Open Questions (MUST ANSWER BEFORE CODING)

### Authentication
- Q: How do we authenticate with KAIST systems?
- Options: SSO/OAuth, SAML, custom
- Impact: API design, frontend flow

### Deployment
- Q: Where will this be hosted?
- Options: On-premise, AWS, Azure, GCP
- Impact: Infrastructure setup, security compliance

### Budget
- Q: What's the monthly budget for Claude API?
- Range: $500-$5000/month?
- Impact: Rate limiting, optimization strategy

### Design System
- Q: Do we have KAIST brand guidelines?
- Need: Colors, fonts, components, patterns
- Impact: UI generator styling

### Examples
- Q: Can we get 5-10 real teacher requests?
- Need: Real module request examples
- Impact: Prompt engineering validation

---

## Quick Command Reference (Once Built)

```bash
# Development setup
docker-compose up -d

# Run tests
npm run test:frontend
python -m pytest tests/
npm run test:backend

# Generate a module (manual)
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d '{"request": "Create fractions module for 3rd grade"}'

# View generated module
# Open browser: http://localhost:3000/modules/{id}/preview

# Deploy generated module
curl -X POST http://localhost:3000/api/modules/{id}/deploy

# Check system health
curl http://localhost:3000/health
```

---

## Success Metrics Checklist

### Before Launch (MVP Validation)
- [ ] Simple module generation works end-to-end
- [ ] Generated code passes security scanning
- [ ] 5+ teachers can create modules successfully
- [ ] Student UI is intuitive and accessible
- [ ] System handles 10 concurrent generations

### At Launch (6-Month Goals)
- [ ] 70% of teachers actively using system
- [ ] <2 hours average module creation time
- [ ] >85% of modules require minimal adjustment
- [ ] NPS > 50
- [ ] Student learning outcomes maintained

### 12 Months
- [ ] Scale to 200+ modules
- [ ] <$5 average API cost per module
- [ ] 99% system uptime
- [ ] Complete documentation & knowledge base

---

## Key Takeaways

1. **Greenfield Project**: Everything needs to be built from scratch
2. **Clear Architecture**: 6-stage pipeline with well-defined inputs/outputs
3. **Technology Choices Made**: React, Node.js, Python, PostgreSQL, Claude
4. **No Legacy Code**: Clean slate to implement best practices
5. **Comprehensive PRD**: 1,262-line document defining all requirements
6. **30-Week Timeline**: ~7 months to MVP
7. **High Impact**: 80% time savings for teachers
8. **Educational Focus**: WCAG accessibility, pedagogical quality first

---

## Next Steps

1. **Answer Open Questions** - Get stakeholder decisions
2. **Set Up Infrastructure** - Dev environment, CI/CD
3. **Create Directory Structure** - Per file organization above
4. **Begin Phase 1** - Implement World Model Reconstruction
5. **Recruit Users** - Identify 5-10 early-adopter teachers
6. **Iterate Rapidly** - Test with real educational use cases

---

