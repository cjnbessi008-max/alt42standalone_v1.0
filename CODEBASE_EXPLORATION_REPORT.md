# COMPREHENSIVE CODEBASE EXPLORATION REPORT
## ALT42 Standalone v1.0 - AI Education System Pipeline

**Date**: November 18, 2025  
**Repository**: alt42standalone_v1.0  
**Current Status**: **EARLY PLANNING PHASE - PRE-DEVELOPMENT**  
**Current Branch**: claude/equation-fold-feature-01Sw6pkrof9KRTcP4bmkE2AR

---

## EXECUTIVE SUMMARY

This repository represents the **planning phase** of an ambitious AI-powered educational system pipeline for KAIST Touch Math Academy. Currently, the repository contains **only one file**: a comprehensive Product Requirements Document (PRD). **No actual codebase exists yet** - this is a greenfield project ready for implementation.

The system is designed to automatically transform teacher requests into complete educational modules, including databases, business logic, and user interfaces - without requiring coding knowledge.

**Key Project Characteristics**:
- Focus: Elementary/Middle school mathematics education (grades 1-8)
- Language Support: Korean (primary) and English
- Target Users: Teachers, Students, Administrators
- Technology Approach: AI-driven code and content generation using Claude LLM

---

## 1. PROJECT ORGANIZATION & FILE STRUCTURE

### Current Repository Structure

```
/home/user/alt42standalone_v1.0/
├── .git/                                    # Git version control metadata
└── tasks/
    └── 0001-prd-ai-education-pipeline.md   # Comprehensive PRD (50KB, 1263 lines)
```

### Project Status

| Aspect | Status |
|--------|--------|
| Source Code | Not Started |
| Frontend Implementation | Not Started |
| Backend Implementation | Not Started |
| Database Schema | Not Started |
| Configuration Files | Not Started |
| Tests | Not Started |
| Documentation (Code) | Not Started |
| Deployment Setup | Not Started |

### Git Information

- **Remote**: http://local_proxy@127.0.0.1:35704/git/cjnbessi008-max/alt42standalone_v1.0
- **Current Branch**: `claude/equation-fold-feature-01Sw6pkrof9KRTcP4bmkE2AR`
- **Commits**: 1 initial commit
- **Last Commit**: `01c4378 feat: add comprehensive PRD for AI Education System Pipeline`

---

## 2. MOODLE LMS & DATABASE INTEGRATION

### Current Status: NOT IMPLEMENTED (Planned as Future Integration)

#### What the PRD Plans

**Section 5 - Non-Goals**:
```
"Third-party LMS Integration: Standalone system initially; LTI integration is future work"
```

The PRD explicitly states:
- MVP (Minimum Viable Product) is a **standalone system**
- LMS integration is **Phase 3** (not Phase 1 or 2)
- Potential LMS targets mentioned: Canvas, Moodle, Blackboard, custom
- Integration method: LTI (Learning Tools Interoperability) standard

#### Database Technology (NOT MySQL/PHP)

The PRD specifies:

**Primary Database**: PostgreSQL 15+
```sql
-- Not MySQL
-- Features: JSONB support, pgvector extension for embeddings
-- Used for: Schemas, data storage, module metadata
```

**No PHP specified** - Instead:
- **Backend Language**: Python 3.11+ (AI Pipeline Orchestrator)
- **API Gateway**: Node.js with Express or Fastify
- **Frontend**: React 18+ with TypeScript

#### Database Architecture (Planned)

```
Primary DB: PostgreSQL
├── Module Management
│   ├── Modules (name, description, subject, status, world_model)
│   ├── Rules (validation, calculation, progression, feedback)
│   ├── DynamicSchema (generated per module)
│   └── GenerationJob (tracking pipeline stages)
├── User Management
│   ├── Teachers
│   ├── Students
│   └── Authentication (JWT-based, not custom)
└── Analytics
    └── StudentProgress (dynamically generated per module)
```

**Caching Layer**: Redis 7+ (for sessions, caching)

#### Authentication/Authorization

**Current**: SAML/OAuth integration with KAIST SSO (planned, not implemented)
**Method**: JWT tokens (1-hour expiration)
**Access Control**: Role-Based Access Control (RBAC)

### Key Integration Questions (Open in PRD)

1. **What authentication system does KAIST currently use?** (SSO, OAuth, SAML, custom?)
2. **Is there an existing platform this should integrate with?**
3. **Which LMS platforms need integration?** (Canvas, Moodle, Blackboard, custom?)

---

## 3. MOBILE/SMARTPHONE UI COMPONENTS

### Current Status: NOT IMPLEMENTED (Web Responsive Design Planned)

#### Design Approach

**NOT Native Mobile Apps** - MVP strategy:
- **Responsive web design** (mobile, tablet, desktop)
- **Modern browsers only** (Chrome, Firefox, Safari, Edge - last 2 versions)
- Native iOS/Android apps are **Phase 2+** (future enhancement)

#### Mobile/Responsive Design Specifications

**Framework**: React 18+ with TypeScript

**Responsive Breakpoints**:
- Mobile: Implied (not specified, but standard: < 768px)
- Tablet: Standard breakpoints
- Desktop: Standard layout

**UI Component Technology**:
- **Material-UI (MUI)** or **Ant Design** for component library
- **React Hook Form** for form handling
- **Responsive Design**: Built-in with CSS-in-JS or CSS modules
- **Accessibility**: WCAG 2.1 AA compliance minimum

#### Key Mobile Design Principles (from PRD)

```
- Large, readable fonts (minimum 16px body text)
- Generous whitespace to reduce cognitive load
- Subtle transitions and animations
- High contrast mode support
- Keyboard navigation support
- Screen reader support
- Adjustable text size
```

#### Planned Mobile UI Screens

1. **Teacher Dashboard** (mobile-responsive)
   - New module request (prominent CTA)
   - List of existing modules
   - Quick actions (duplicate, edit, archive)
   - Performance metrics

2. **Module Request Wizard** (mobile-optimized flow)
   - Step 1: Describe your module
   - Step 2: Review AI's understanding
   - Step 3: Clarify details
   - Step 4: Preview generated system
   - Step 5: Deploy or refine

3. **Generated Module UI** (mobile-first design)
   - Student-facing interface
   - Clean, distraction-free
   - Progress indicators
   - Contextual help

4. **Module Management** (mobile dashboard)
   - Edit metadata
   - View analytics
   - Manage student access

#### Real-Time Communication

**Technology**: Socket.io for WebSocket support
- Live progress updates during module generation
- Real-time student interaction tracking

---

## 4. EQUATION & MATH-RELATED FUNCTIONALITY

### Current Status: PLANNED IN DETAIL (Not Implemented)

The **entire system** is built around mathematical education. This is not a peripheral feature but the core domain.

#### Mathematical Concepts Supported

**Subject**: Mathematics only (MVP), grades 1-8

**Example Module**: Fractions Learning (from PRD Appendix B)

```
Concepts:
  - Fraction, Numerator, Denominator, Whole, Part
  - Visual representations (Pizza, Cake, Bar)
  
Operations:
  - Add fractions with same denominator
  - Add fractions with different denominators (find common denominator)
  - Subtract fractions
  - Simplify fractions
  - Visualize fractions
  
Data Structures:
  - fraction_problems table
  - student_attempts table
  - difficulty_level (1-5 scale)
  - visual_representation (pizza, cake, bar)
```

#### Equation/Math Rendering

**Technology**: LaTeX + MathJax
- Mentioned in assumptions: "Mathematical notation can be handled via standard LaTeX or MathJax rendering"
- **NOT explicitly implemented** - assumption made in PRD

#### Dynamic Math Problem Generation

**AI-Generated Rule Examples**:

```python
# Validation Rules
rule: denominator cannot be zero

# Calculation Rules
rule: add_fractions(num1, den1, num2, den2)
  if den1 == den2:
    result = (num1 + num2) / den1
  else:
    common_den = lcm(den1, den2)
    result = (num1 * (common_den/den1) + num2 * (common_den/den2)) / common_den

# Progression Rules
rule: students master visualization before arithmetic operations
```

#### Rule Complexity Assessment

**Complexity Metrics** (to determine when to use ontologies):
```
Thresholds for complexity:
- Condition count > 5 = complex
- Nesting depth > 3 = complex
- Entity count > 4 = complex
- Cyclic dependencies = complex

If complex: Convert to OWL 2 (Web Ontology Language)
Tools: Owlready2 (Python), HermiT/Pellet reasoners
```

#### Interactive Math Components (Not Yet Built)

Planned React components mentioned in PRD:
```typescript
- FractionVisualizer (pizza/cake graphic)
- FractionInputForm (numerator/denominator fields)
- ProgressBar (mastery tracking)
- ProblemFeedback (correct/incorrect with explanation)
```

#### Educational Ontologies & Knowledge Bases

**Research Needed** (Section 9.7):
- Survey existing math education ontologies
- Common Core Standards (CCSSM)
- KAIST-specific curricula

**Future Tools**:
- Vector Store: pgvector (PostgreSQL extension)
- Embeddings: Voyage AI or OpenAI embeddings
- Graph Database: Neo4j (Phase 2+, for ontologies)

#### Mathematical Assessment Features

**Planned Data Collection**:
```
- Problem type (visualization, addition, subtraction, etc.)
- Difficulty level (1-5 scale)
- Time spent solving (behavior tracking)
- Number of attempts
- Correct/incorrect answers
- Student interaction patterns
```

**Student Progress Tracking**:
- Mastery scoring
- Learning progression (visualization → arithmetic)
- Completion percentages
- Performance analytics

---

## 5. DOCUMENTATION & PROJECT ARCHITECTURE

### Current Documentation

**Only Document**: `tasks/0001-prd-ai-education-pipeline.md` (1263 lines)

**Contents of PRD**:

| Section | Lines | Status |
|---------|-------|--------|
| 1. Introduction & Overview | 30 | Complete |
| 2. Goals (Primary & Secondary) | 20 | Complete |
| 3. User Stories (6 detailed stories) | 50 | Complete |
| 4. Functional Requirements (7 phases) | 200 | Complete |
| 5. Non-Goals | 30 | Complete |
| 6. Design Considerations | 150 | Complete |
| 7. Technical Considerations | 150 | Complete |
| 8. Success Metrics | 110 | Complete |
| 9. Open Questions | 100 | Complete |
| 10. Development Phases & Milestones | 95 | Complete |
| 11. Appendices | 125 | Complete |

### Planned System Architecture

#### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  Teacher UI | Student UI | Admin Dashboard                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│                   API Gateway (Node.js)                      │
│  Authentication | Rate Limiting | Request Routing           │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│              AI Pipeline Orchestrator (Python)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ World Model   →  Rule Engine  →  Data Manager        │  │
│  │      ↓               ↓               ↓               │  │
│  │ Input Strategy  →  UI Generator  →  Deployer        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Schemas, Data)  │   │  (Sessions)    │
└─────────────┘    └──────────────────┘   └────────────────┘
```

#### AI Pipeline Stages (6 Phases)

```
Phase 1: World Model Reconstruction (세계관 재구성)
├── Natural Language Input Processing
├── Domain Model Generation
├── Data Structure Analysis
└── Event Flow Definition

Phase 2: Rule Generation Engine (룰 자동 생성)
├── Rule Identification
├── Complexity Assessment
├── Rule-to-Code Generation
└── Ontology Conversion (for complex rules)

Phase 3: Data Management (데이터 검증 및 생성)
├── Data Availability Check
├── Pseudo Data Generation
├── Database Schema Design
└── Database Creation & Migration

Phase 4: Input Strategy Design (입력 전략 설계)
├── Input Method Determination
├── Input Validation Strategy
└── Data Flow Mapping

Phase 5: UI Auto-Generation (UI 자동 생성)
├── Existing UI Assessment
├── UX Journey Analysis
├── UI Component Generation
├── Form Generation (Priority 1)
├── Web Interface Generation (Priority 2)
└── Conversational UI (Priority 3)

Phase 6: Integration & Deployment (시스템 완성)
├── API Generation
├── End-to-End Testing
├── Deployment Package
└── Documentation Generation
```

### Planned Technology Stack

#### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router v6
- **UI Components**: Material-UI or Ant Design
- **Forms**: React Hook Form + Yup
- **API Client**: Axios
- **Real-time**: Socket.io-client

#### Backend
- **API Gateway**: Node.js with Express or Fastify
- **Pipeline Orchestrator**: Python 3.11+ with FastAPI
- **Task Queue**: Celery with Redis broker
- **LLM Integration**: Anthropic Claude API (Python SDK)
- **Code Generation**: Jinja2 templates + AST manipulation

#### Database & Cache
- **Primary DB**: PostgreSQL 15+ (JSONB, pgvector)
- **Cache**: Redis 7+
- **Graph DB** (future): Neo4j for ontologies

#### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Orchestration** (future): Kubernetes

#### AI/ML
- **LLM**: Claude 3 Sonnet/Opus (Anthropic)
- **Embeddings**: Voyage AI or OpenAI embeddings
- **Vector Store**: pgvector (PostgreSQL extension)
- **Ontology Tools**: Owlready2, HermiT/Pellet

### Core Data Models (Planned)

```
Module
├── id, name, description, subject, grade_level
├── teacher_id, status (generating/active/archived)
├── world_model (JSONB), generated_schema (JSONB)
├── generated_ui (JSONB), version
└── created_at, updated_at

Teacher
├── id, name, email, institution, role
└── preferences (JSONB)

Student
├── id, name, grade_level
└── enrolled_modules (array)

GenerationJob
├── id, module_id, stage, status
├── input_data, output_data, error_log
└── started_at, completed_at

Rule
├── id, module_id, name, type
├── complexity_score, is_ontology
├── code, ontology_reference
└── Generated per module requirement

DynamicSchema
├── id, module_id, table_name
├── schema_definition, migration_script
└── is_applied

StudentProgress (dynamically generated per module)
├── Always includes: student_id, module_id, started_at, completed_at, progress_percentage
└── Extended fields vary per module
```

---

## 6. DEPLOYMENT & LAUNCH TIMELINE

### Development Phases (16 Sprints Total)

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 0 | Weeks 1-2 | Discovery & Setup | **NOT STARTED** |
| Phase 1 | Weeks 3-8 | Core Pipeline (World Model + Rules) | **NOT STARTED** |
| Phase 2 | Weeks 9-12 | Data & Persistence | **NOT STARTED** |
| Phase 3 | Weeks 13-16 | Input & Interaction | **NOT STARTED** |
| Phase 4 | Weeks 17-22 | UI Generation | **NOT STARTED** |
| Phase 5 | Weeks 23-26 | Deployment & Testing | **NOT STARTED** |
| Phase 6 | Weeks 27-30 | Launch & Iteration | **NOT STARTED** |

**Timeline**: ~7.5 months to MVP launch
**Current Progress**: 0% (Planning phase)

---

## 7. SUCCESS METRICS & KPIs

### Primary KPIs (from PRD Section 8)

1. **Adoption Rate**: >70% of teachers within 6 months
2. **Generation Speed**: <2 hours average module creation time
3. **System Accuracy**: >85% of modules require minimal adjustments
4. **Time Savings**: 80% reduction vs. manual development (40-80 hours → 8 hours)
5. **Teacher Satisfaction (NPS)**: Net Promoter Score > 50

### Secondary Metrics

- Student learning outcome parity/improvement
- Module diversity across concepts
- 99% uptime, <1% generation failure rate
- <$5 per module generation (AI API costs)
- <30 minutes for module updates

---

## 8. CRITICAL OPEN QUESTIONS (Not Yet Answered)

### High Priority (Blocking Development Start)

1. **Authentication**: KAIST current auth system? (SSO, OAuth, SAML, custom?)
2. **Integration**: Is there an existing platform to integrate with?
3. **Deployment**: On-premise, AWS, Azure, GCP, or other?
4. **Budget**: Monthly budget for Claude API costs?
5. **Example Requests**: 5-10 real teacher request examples for testing?

### Medium Priority (During Development)

6. Data privacy/compliance requirements (PIPA, FERPA, GDPR)?
7. Existing KAIST design system for UI generation?
8. Student data access and availability?
9. Module approval workflow requirements?
10. Existing module migration needs?

### Low Priority (Post-MVP)

11. Robot avatar hardware specifications?
12. Multi-language support beyond Korean/English?
13. Mobile native app requirements?
14. Third-party LMS integration priority?

---

## 9. KEY FINDINGS & RECOMMENDATIONS

### What Exists Today

1. **Comprehensive PRD**: 1263-line requirements document covering all aspects
2. **Clear Vision**: AI-powered educational module generation system
3. **Detailed Architecture**: Technology stack, data models, development plan
4. **Success Metrics**: Clear KPIs and evaluation criteria
5. **User Research**: Multiple user stories and personas documented

### What Does NOT Exist

1. **Source Code**: Zero lines of application code
2. **Database Schema**: Only conceptual design, no actual implementation
3. **Frontend**: No React components, UI, or CSS
4. **Backend**: No API endpoints, services, or pipeline logic
5. **Tests**: No unit, integration, or E2E tests
6. **DevOps**: No Docker, deployment scripts, or CI/CD pipelines
7. **Documentation** (technical): Only high-level PRD, no API docs, component docs, etc.

### Technology Stack Observations

| Aspect | Choice | Notes |
|--------|--------|-------|
| **Database** | PostgreSQL | NOT MySQL; good choice for flexible JSONB data |
| **Backend** | Python + Node.js | Python for AI pipeline, Node.js for API gateway |
| **Frontend** | React + TypeScript | Good for responsive, interactive UI generation |
| **LLM** | Claude (Anthropic) | Primary reasoning engine, well-suited for code generation |
| **Deployment** | Docker + Cloud-agnostic | Good for portability |
| **LMS Integration** | NOT included in MVP | Planned for Phase 3, LTI standard approach |

### Moodle Integration Status

**Current**: NONE - NOT IMPLEMENTED  
**Planned**: Phase 3 (future work)  
**Approach**: LTI (Learning Tools Interoperability)  
**Database**: Will use PostgreSQL, not MySQL  
**Backend**: Python/Node.js, not PHP  

**Note**: The PRD explicitly states "Standalone system initially; LTI integration is future work"

---

## 10. NEXT STEPS FOR DEVELOPMENT

### Phase 0 - Discovery (Weeks 1-2)

1. **Answer Open Questions** (Section 9)
   - Confirm authentication approach with KAIST
   - Identify deployment environment
   - Establish API budget
   - Collect real teacher request examples

2. **Infrastructure Setup**
   - Set up development environment (Docker, PostgreSQL, Redis)
   - Create GitHub Actions CI/CD pipeline
   - Set up monitoring/logging infrastructure
   - Obtain Claude API credentials and budget

3. **Proof of Concept**
   - Test Claude API for world model generation
   - Prototype natural language → concept graph conversion
   - Validate prompt engineering approach
   - Establish baseline performance metrics

### Phase 1 - Core Pipeline (Weeks 3-8)

1. **World Model Service** (Python/FastAPI)
   - NLP pipeline for teacher requests
   - Concept extraction and graph generation
   - Domain model construction

2. **Rule Engine** (Python)
   - Rule extraction from world models
   - Code generation (Python/JavaScript)
   - Complexity analysis algorithm

3. **API Gateway** (Node.js/Express)
   - Authentication middleware (JWT)
   - Request routing and rate limiting
   - WebSocket support for real-time updates

### Architecture Recommendations

1. **Microservices** for pipeline stages (scalability)
2. **Event-driven** for progress tracking and notifications
3. **Repository pattern** for data access abstraction
4. **Factory pattern** for dynamic component generation
5. **Prompt versioning** for A/B testing and optimization

---

## CONCLUSION

This is a **well-planned, ambitious greenfield project** with:
- Clear vision and comprehensive PRD
- Thoughtful technology choices
- Realistic development timeline
- Detailed success metrics

**Current Status**: Ready to begin Phase 0 (Discovery & Setup) once critical open questions are answered.

**Not Implemented Yet**: 
- Moodle integration (Phase 3)
- Mobile native apps (Phase 2)
- All equation/math components (Phases 3-5)
- MySQL/PHP approach (using PostgreSQL/Python instead)

**Next Action**: Answer high-priority open questions from Section 9 before beginning Sprint 1 development.

