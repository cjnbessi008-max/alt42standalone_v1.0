# Comprehensive Codebase Analysis: ALT42 Standalone v1.0

## Executive Summary

The `alt42standalone_v1.0` repository is a **brand-new project with minimal existing code**. It contains only a comprehensive Product Requirements Document (PRD) for an "AI Education System Pipeline" - an intelligent system designed to automatically generate educational modules from natural language teacher requests.

**Repository Status**: 
- **Current Files**: Only 1 markdown file (PRD)
- **Branch**: `claude/symmetric-gear-solver-01KCiDh7fgWVfTKnhMx2hEse`
- **Status**: No code implementation yet; PRD only
- **Recent Commits**: Only 1 commit with the PRD document

---

## 1. PROJECT STRUCTURE & MAIN COMPONENTS

### Current State
```
/home/user/alt42standalone_v1.0/
├── .git/                          # Git repository only
└── tasks/
    └── 0001-prd-ai-education-pipeline.md  # 1,263 lines, comprehensive PRD
```

### Planned Architecture (from PRD)

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
│         AI Pipeline Orchestrator (Python FastAPI)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ World Model  → Rule Engine  → Data Manager           │   │
│  │      ↓            ↓              ↓                   │   │
│  │ Input Strategy → UI Generator → Deployer            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Schemas, Data)  │   │  (Sessions)    │
└─────────────┘    └──────────────────┘   └────────────────┘
```

### 6 Pipeline Phases (Not Yet Implemented)

1. **Phase 1: World Model Reconstruction** (세계관 재구성)
   - Natural language input processing
   - Domain model extraction
   - Concept graph generation

2. **Phase 2: Rule Generation Engine** (룰 자동 생성)
   - Business rule extraction
   - Complexity assessment
   - Rule-to-code generation

3. **Phase 3: Data Management** (데이터 검증 및 생성)
   - Data availability checking
   - Pseudo data generation
   - Database schema design

4. **Phase 4: Input Strategy Design** (입력 전략 설계)
   - Input method determination
   - Validation strategy
   - Data flow mapping

5. **Phase 5: UI Auto-Generation** (UI 자동 생성)
   - Existing UI assessment
   - React component generation
   - Form builder

6. **Phase 6: Integration & Deployment** (시스템 완성)
   - API generation
   - End-to-end testing
   - Documentation generation

---

## 2. SYMMETRIC GEAR SOLVER IMPLEMENTATION (MISSING)

### Status: ❌ NOT FOUND IN CODEBASE

**Important Note**: The branch name references "symmetric-gear-solver" but:
- No implementation exists in the repository
- The PRD does NOT explicitly document this feature
- This appears to be the NEXT FEATURE TO BUILD

### Symmetric Gear Feature Concept
**Korean Description**: "방정식 양변에 같은 연산을 적용하면 톱니바퀴처럼 움직이는 기능"

**English Translation**: "A feature where applying the same operation to both sides of an equation makes it work like a gear mechanism"

### What This Likely Means
This is an educational feature for teaching algebraic equation solving through a visual "gear" metaphor:
- When you apply an operation to the left side of an equation, it automatically applies to the right side
- Visual representation shows gears moving synchronously
- Helps students understand the fundamental principle: "whatever you do to one side, you must do to the other"

### Implementation Requirements (Inferred)

**Expected Components**:
1. **Visual UI Component** (React)
   - SVG-based gear visualization
   - Synchronized animation of left/right operations
   - Interactive controls for applying operations

2. **Mathematical Engine** (Python/JavaScript)
   - Equation parser (parse algebraic expressions)
   - Symbolic math manipulation (sympy/algebra-related)
   - Validation rules (ensure operations preserve equality)

3. **Database Models**
   - EquationProblems table
   - StudentEquationAttempts table
   - ProgressTracking table (per student)

4. **Business Logic**
   - Rule validation (both sides must remain equal)
   - Difficulty progression (simple to complex equations)
   - Step-by-step solving hints

5. **API Endpoints**
   - POST /api/equations/problems - Generate new problem
   - POST /api/equations/apply-operation - Apply operation to both sides
   - GET /api/equations/progress - Get student progress
   - POST /api/equations/verify - Verify equation state

---

## 3. LMS/MOODLE INTEGRATION (MISSING)

### Status: ❌ NOT IMPLEMENTED

### Current Plan (from PRD)

**Section 7.6 - Integration Points**:
- **Future Feature**: "Embed generated modules in existing LMS (future)"
- **Explicit Out of Scope**: "Third-party LMS Integration is Phase 3"

**Mentioned Standards**:
- LTI (Learning Tools Interoperability) integration is deferred to Phase 3
- No specific Moodle integration documented

### Required for LMS Integration (When Implemented)

1. **LTI 1.3 Protocol** (Learning Tools Interoperability)
   - OAuth/JWT authentication
   - Deep linking support
   - Grade passback capability

2. **Moodle Specific**:
   - Activities/resources plugin
   - Grade book integration
   - User enrollment sync

3. **Data Exchange**:
   - User roster import
   - Grade export
   - Completion tracking

---

## 4. WEB APP & MOBILE APP STRUCTURE (PLANNED, NOT IMPLEMENTED)

### Status: ❌ NO CODE; SPECIFICATIONS ONLY

### Frontend Architecture (from PRD)

**Technology Stack**:
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router v6
- **UI Components**: Material-UI (MUI) or Ant Design
- **Forms**: React Hook Form + Yup validation
- **API Client**: Axios with interceptors
- **Real-time**: Socket.io-client

### Planned User Interfaces

1. **Teacher Dashboard**
   - New module request (prominent CTA)
   - List of existing modules with status
   - Quick actions (duplicate, edit, archive)
   - Performance metrics

2. **Module Request Wizard** (5 steps)
   - Step 1: Describe your module (natural language)
   - Step 2: Review AI's understanding (concept map)
   - Step 3: Clarify details (AI-generated questions)
   - Step 4: Preview generated system
   - Step 5: Deploy or refine

3. **Generated Module UI** (student-facing)
   - Clean, distraction-free design
   - Clear progress indicators
   - Contextual help and hints

4. **Module Management**
   - Edit metadata
   - View analytics dashboard
   - Manage student access
   - Version history/rollback

5. **Admin Dashboard**
   - Module overview
   - Student engagement metrics
   - System health monitoring

### Mobile Approach

**Explicitly Out of Scope for MVP**:
- Native iOS/Android apps
- Mobile-specific features
- Offline support

**Actual Plan**:
- Responsive web design (works on mobile browsers)
- Optimized for mobile devices (tablet + phone)
- Future phase: Native apps

---

## 5. DATABASE SCHEMA & MODELS (DESIGNED, NOT IMPLEMENTED)

### Status: ✅ PARTIALLY DOCUMENTED (Design Only)

### Core Data Models (from PRD Section 6.3)

#### Module
```
- id (UUID)
- name (string)
- description (text)
- subject (enum: mathematics)
- grade_level (string)
- teacher_id (foreign key)
- status (enum: generating, active, archived)
- world_model (JSONB) - AI-generated domain model
- generated_schema (JSONB) - Database schema definition
- generated_ui (JSONB) - UI component definitions
- version (integer)
- created_at, updated_at
```

#### Teacher
```
- id (UUID)
- name (string)
- email (string, unique)
- institution (string)
- role (enum: teacher, admin, system_maintainer)
- preferences (JSONB)
```

#### Student
```
- id (UUID)
- name (string)
- grade_level (string)
- enrolled_modules (array of module_ids)
```

#### GenerationJob (tracks pipeline progress)
```
- id (UUID)
- module_id (foreign key)
- stage (enum: world_model, rules, data, input_strategy, ui, deployment)
- status (enum: pending, in_progress, completed, failed)
- input_data (JSONB)
- output_data (JSONB)
- error_log (text)
- started_at, completed_at
```

#### Rule
```
- id (UUID)
- module_id (foreign key)
- name (string)
- type (enum: validation, calculation, progression, feedback)
- complexity_score (integer)
- is_ontology (boolean)
- code (text)
- ontology_reference (string)
```

#### DynamicSchema (metadata about generated schemas)
```
- id (UUID)
- module_id (foreign key)
- table_name (string)
- schema_definition (JSONB)
- migration_script (text)
- is_applied (boolean)
```

#### StudentProgress (dynamically generated per module)
```
- Dynamic schema per module
- Always includes: student_id, module_id, started_at, completed_at, progress_percentage
```

### Database Technology

**Primary**: PostgreSQL 15+ with JSONB support
**Caching**: Redis 7+
**Graph Storage** (future): Neo4j for ontologies

### Example: Fractions Module Schema (from PRD)

```sql
CREATE TABLE fraction_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_type VARCHAR(50) NOT NULL 
        CHECK (problem_type IN ('visualization', 'addition', 'subtraction')),
    numerator_1 INTEGER NOT NULL,
    denominator_1 INTEGER NOT NULL CHECK (denominator_1 > 0),
    numerator_2 INTEGER,
    denominator_2 INTEGER CHECK (denominator_2 IS NULL OR denominator_2 > 0),
    visual_representation VARCHAR(20) DEFAULT 'pizza',
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    correct_answer_numerator INTEGER NOT NULL,
    correct_answer_denominator INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES fraction_problems(id),
    answer_numerator INTEGER NOT NULL,
    answer_denominator INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW()
);
```

### Similar Schema Pattern for Symmetric Gear Solver

```sql
CREATE TABLE equation_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    equation_type VARCHAR(50) CHECK (equation_type IN ('linear', 'quadratic', ...)),
    left_side TEXT NOT NULL,  -- e.g., "2x + 3"
    right_side TEXT NOT NULL,  -- e.g., "11"
    variable_name VARCHAR(10) NOT NULL DEFAULT 'x',
    correct_solution TEXT NOT NULL,  -- e.g., "x = 4"
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    allowed_operations TEXT[] DEFAULT ARRAY['add', 'subtract', 'multiply', 'divide'],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_equation_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES equation_problems(id),
    operation_sequence JSONB NOT NULL,  -- Records each operation applied
    final_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    num_steps INTEGER,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. DOCUMENTATION ABOUT SYMMETRIC GEAR FEATURE (MISSING)

### Status: ❌ NO SPECIFIC DOCUMENTATION

**Key Findings**:
1. ❌ No explicit "Symmetric Gear" documentation in PRD
2. ❌ No feature spec for equation solver
3. ❌ No UI mockups for gear visualization
4. ❌ No algorithm documentation
5. ✅ Infrastructure exists to support such features (via AI generation)

### Where It Should Be Documented

Given the project's architecture, Symmetric Gear Solver would be documented in:
1. **A new PRD** specific to this feature
2. **UI/UX specification** with gear visualization details
3. **Mathematical algorithm documentation** for equation manipulation
4. **Integration guide** showing how to request this via the pipeline

---

## 7. TECHNOLOGY STACK (PLANNED)

### Backend
- **API Gateway**: Node.js with Express or Fastify
- **Pipeline Orchestrator**: Python 3.11+ with FastAPI
- **Task Queue**: Celery with Redis broker
- **AI Integration**: Anthropic Claude API (Python SDK)
- **Code Generation**: Jinja2 templates + AST manipulation

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Libraries**: Material-UI or Ant Design
- **Forms**: React Hook Form + Yup
- **State**: Redux Toolkit or Zustand

### Database
- **Primary**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Graph** (future): Neo4j

### DevOps
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

### AI/ML
- **LLM**: Claude 3 (Anthropic)
- **Embeddings**: Voyage AI or OpenAI
- **Vector Store**: pgvector (PostgreSQL)

---

## 8. KEY FEATURES & FUNCTIONAL REQUIREMENTS

### Implemented ❌
- None (repository is just the PRD)

### Planned in PRD ✅

#### Phase 1: World Model Reconstruction
- Natural language input processing (Korean/English)
- Domain model extraction via Claude
- Concept graph generation
- Relationship mapping

#### Phase 2: Rule Generation
- Business rule extraction
- Complexity analysis (conditions, nesting, entities)
- Automatic code generation (Python/JavaScript)
- Ontology conversion for complex rules

#### Phase 3: Data Management
- Data availability assessment
- Pseudo data generation (realistic test data)
- PostgreSQL schema auto-generation
- Migration management

#### Phase 4: Input Strategy Design
- Optimal input method selection
- Validation rule generation
- Data flow mapping

#### Phase 5: UI Auto-Generation
- React component generation
- Responsive design
- Accessibility features (WCAG 2.1 AA)
- Form builders

#### Phase 6: Integration & Deployment
- RESTful API auto-generation
- Docker containerization
- Documentation generation
- End-to-end testing

---

## 9. WHAT EXISTS vs. WHAT NEEDS TO BE BUILT

### ✅ COMPLETE (Exists)

1. **Comprehensive PRD** (1,263 lines)
   - Clear vision and goals
   - User stories and acceptance criteria
   - Detailed functional requirements
   - Technical architecture design
   - Success metrics
   - Development roadmap (16 sprints)

2. **Architectural Design**
   - Microservices architecture defined
   - Data models documented
   - Technology stack chosen
   - Integration points identified

3. **Example Patterns**
   - Fractions learning module example
   - Database schema templates
   - React component examples
   - API endpoint specifications

### ❌ MISSING (Needs Implementation)

#### Core Infrastructure
- [ ] API Gateway (Node.js)
- [ ] Python FastAPI pipeline orchestrator
- [ ] PostgreSQL database setup
- [ ] Redis caching layer
- [ ] Docker containers and compose files

#### Pipeline Components
- [ ] World Model Service (NLP, concept extraction)
- [ ] Rule Engine (extraction, generation, complexity analysis)
- [ ] Data Manager (schema generation, pseudo data)
- [ ] Input Strategy Designer
- [ ] UI Generator (React component generation)
- [ ] Deployment Service

#### Frontend Application
- [ ] Teacher Dashboard UI
- [ ] Module Request Wizard
- [ ] Generated Module UI (student-facing)
- [ ] Module Management interface
- [ ] Admin Dashboard
- [ ] Mobile responsive design

#### Symmetric Gear Solver (Specific)
- [ ] Feature specification and UX design
- [ ] Mathematical equation parser
- [ ] Symbolic math engine
- [ ] Gear visualization component (SVG/Canvas)
- [ ] Equation solver business logic
- [ ] Database models for equations
- [ ] API endpoints for equation handling
- [ ] Step-by-step solving algorithm
- [ ] Hint and feedback system

#### Database & Migrations
- [ ] PostgreSQL schema implementation
- [ ] Migration scripts
- [ ] Indexes and optimization
- [ ] User authentication tables
- [ ] Module tracking tables

#### Testing & Quality
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] UI/UX testing
- [ ] Load testing

#### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Technical documentation
- [ ] Deployment guide
- [ ] User guides
- [ ] Developer onboarding

#### DevOps & Deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker images and Compose
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Logging setup (ELK)
- [ ] Deployment automation

#### Integration & Security
- [ ] KAIST SSO integration
- [ ] Security implementation
  - JWT authentication
  - Role-based access control
  - Input validation
  - Rate limiting
  - Encryption
- [ ] Error handling and resilience
- [ ] LMS integration (Phase 3)

---

## 10. DEVELOPMENT ROADMAP (from PRD)

### Phase 0: Discovery & Setup (Weeks 1-2)
- Codebase exploration ← **YOU ARE HERE**
- Infrastructure setup
- AI API experimentation
- Stakeholder interviews

### Phase 1: Core Pipeline (Weeks 3-8)
- World Model Service (Sprints 1-2)
- Rule Generation Engine (Sprints 3-4)

### Phase 2: Data & Persistence (Weeks 9-12)
- Data Management (Sprint 5)
- Database Integration (Sprint 6)

### Phase 3: Input & Interaction (Weeks 13-16)
- Input Strategy (Sprint 7)
- Form Generation (Sprint 8)

### Phase 4: UI Generation (Weeks 17-22)
- UI Component Generator (Sprints 9-10)
- Integration & Polish (Sprint 11)

### Phase 5: Deployment & Testing (Weeks 23-26)
- API & Deployment (Sprint 12)
- End-to-End Testing (Sprint 13)

### Phase 6: Launch & Iteration (Weeks 27-30)
- Beta Launch (Sprint 14)
- Refinement (Sprint 15)
- General Availability (Sprint 16)

---

## 11. CRITICAL GAPS FOR SYMMETRIC GEAR SOLVER

### 1. Feature Specification
- **Missing**: Detailed feature requirements
- **Needed**: Complete PRD for symmetric gear solver
- **Should Include**: Learning objectives, interaction patterns, success criteria

### 2. UI/UX Design
- **Missing**: Wireframes for gear visualization
- **Missing**: Interaction flow specification
- **Needed**: High-fidelity mockups showing synchronized gears

### 3. Mathematical Algorithm
- **Missing**: Equation parsing logic
- **Missing**: Operation validation rules
- **Missing**: Step-by-step solving algorithm
- **Needed**: Technical specification for math engine

### 4. Database Schema
- **Missing**: Equation-specific tables
- **Missing**: Operation tracking schema
- **Needed**: Migration scripts for equation solver

### 5. React Components
- **Missing**: GearVisualizer component
- **Missing**: EquationEditor component
- **Missing**: OperationApplier component
- **Missing**: ProgressTracker component

### 6. Backend APIs
- **Missing**: Equation endpoint specifications
- **Missing**: Operation validation endpoints
- **Needed**: Clear API contract

### 7. Integration with Pipeline
- **Missing**: How AI generates gear solver modules
- **Needed**: Prompts for world model generation
- **Needed**: Rules for equation solving

### 8. Testing Strategy
- **Missing**: Test cases for equation solving
- **Missing**: UI interaction tests
- **Needed**: Mathematical correctness validation

---

## 12. RECOMMENDED NEXT STEPS

### Immediate Actions (Next Sprint)

1. **Clarify Symmetric Gear Requirements**
   - Interview teachers about learning objectives
   - Define what equations should be supported (linear, quadratic, etc.)
   - Specify interaction metaphors (gear visualization details)
   - Document expected student outcomes

2. **Create Symmetric Gear Feature PRD**
   - Build on the main PRD
   - Include detailed user stories
   - Specify acceptance criteria
   - Define mathematical scope

3. **Design Gear Visualization**
   - Create wireframes
   - Prototype SVG gear animation
   - Test user interactions
   - Validate pedagogical effectiveness

4. **Set Up Development Environment**
   - Initialize backend services (Node.js, Python, PostgreSQL)
   - Set up React frontend scaffold
   - Configure Docker Compose
   - Set up CI/CD pipeline

5. **Create Mathematical Specification**
   - Define equation grammar/parser
   - Specify allowed operations
   - Document validation rules
   - Create algorithm flowcharts

### Resource Allocation

**Required Team**:
- 1 Product Manager (requirements)
- 1-2 Full-stack Developers (backend + frontend)
- 1 Machine Learning/Prompt Engineer (Claude integration)
- 1 UI/UX Designer (gear visualization)
- 1 Database Architect (schema design)
- 1 DevOps Engineer (infrastructure)
- Teachers/Educators (subject matter experts)

### Success Criteria

- [ ] Core pipeline components operational
- [ ] Symmetric gear solver feature complete
- [ ] 85%+ accuracy in generated modules
- [ ] Teachers can create modules in < 2 hours
- [ ] 70%+ teacher adoption rate within 6 months

---

## CONCLUSION

The `alt42standalone_v1.0` repository is a **greenfield project** with an excellent architectural blueprint (the PRD) but **zero code implementation**. The Symmetric Gear Solver feature is implied by the branch name but not explicitly documented. 

**The next step is to:**
1. Develop a specific PRD for the Symmetric Gear Solver
2. Implement the pipeline infrastructure
3. Build the gear visualization and equation solver
4. Integrate everything into the broader educational platform

This is an ambitious project that requires coordinated development across multiple domains (AI, education, mathematics, UI/UX, full-stack development, DevOps).
