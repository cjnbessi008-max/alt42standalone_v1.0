# Alt42 Standalone - Codebase Analysis Report

## Current Repository Status

**Repository**: alt42standalone_v1.0
**Current State**: Fresh project, PRD phase only
**Commits**: 1 (Initial PRD)
**Active Branch**: claude/lms-practice-integration-01TgKWSNdTDbXcMSjEaeDxpG

## EXECUTIVE SUMMARY

This is a **greenfield project** for KAIST Touch Math Academy's AI Education System Pipeline. 
Currently, there is NO existing codebase - only a comprehensive Product Requirements Document (PRD).

The project aims to build a sophisticated system that enables non-technical teachers to create complete educational modules using natural language descriptions, with AI-powered generation of databases, business rules, and user interfaces.

---

## PROJECT STRUCTURE & ORGANIZATION

### Directory Structure (Current)
```
alt42standalone_v1.0/
├── .git/                          # Git repository metadata
└── tasks/
    └── 0001-prd-ai-education-pipeline.md   # Main PRD document (1262 lines, 49KB)
```

### What Exists
- **1 file**: Comprehensive PRD covering all aspects of the system

### What Does NOT Exist Yet
- NO source code (PHP, JavaScript, Python)
- NO database schemas or migrations
- NO Docker/deployment configuration
- NO test suites
- NO configuration files (.env, docker-compose, etc.)
- NO API endpoints
- NO UI components
- NO package.json, requirements.txt, or composer.json

---

## PLANNED ARCHITECTURE & TECHNOLOGY STACK

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React)                            │
│  Teacher UI | Student UI | Admin Dashboard              │
└────────────────────┬────────────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼────────────────────────────────────┐
│            API Gateway (Node.js/Express)                │
│  Authentication | Rate Limiting | Request Routing      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────┐
│   AI Pipeline Orchestrator (Python/FastAPI)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ World Model → Rule Engine → Data Manager         │  │
│  │      ↓           ↓             ↓                 │  │
│  │ Input Strategy → UI Generator → Deployer        │  │
│  └──────────────────────────────────────────────────┘  │
└───────┬─────────────────────┬──────────────────┬────────┘
        │                     │                  │
┌───────▼──────┐    ┌────────▼─────────┐   ┌───▼──────────┐
│   Claude     │    │   PostgreSQL     │   │  Redis Cache │
│  API (LLM)   │    │ (Schemas, Data)  │   │  (Sessions)  │
└──────────────┘    └──────────────────┘   └──────────────┘
```

### Technology Stack (Planned)

**Frontend**
- Framework: React 18+ with TypeScript
- State Management: Redux Toolkit or Zustand
- Routing: React Router v6
- UI Components: Material-UI (MUI) or Ant Design
- Forms: React Hook Form + Yup validation
- API Client: Axios with interceptors
- Real-time: Socket.io-client

**Backend**
- API Gateway: Node.js with Express/Fastify
- Pipeline Orchestrator: Python 3.11+ with FastAPI
- Task Queue: Celery with Redis as broker
- AI Integration: Anthropic Claude API (Python SDK)
- Code Generation: Jinja2 templates + AST manipulation

**Database**
- Primary: PostgreSQL 15+ (with JSONB support)
- Caching: Redis 7+
- Future: Neo4j for ontologies

**DevOps**
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack
- Future: Kubernetes

---

## PLANNED 6-PHASE PIPELINE (DOES NOT EXIST YET)

### Phase 1: World Model Reconstruction
**Purpose**: Extract semantic understanding from teacher's natural language request

**Key Components** (To be built):
- Natural language input processor (Korean/English support)
- Domain model generator
- Concept graph builder
- Relationship mapper
- **Output**: JSONB domain model stored in database

**Example**: 
- Input: "Create a fractions module for 3rd graders"
- Output: Concepts (Fraction, Numerator, Denominator), Operations (Add, Subtract), Relationships

### Phase 2: Rule Generation Engine
**Purpose**: Convert domain understanding into executable business rules

**Key Components** (To be built):
- Rule extractor from world models
- Complexity analyzer
  - Metrics: Condition count, nesting depth, entity count, cyclic dependencies
  - Threshold: >5 conditions OR >3 nesting levels → Use ontology
- Rule-to-code generator (Python/JavaScript)
- Ontology converter (OWL/RDF for complex rules)
- **Output**: Executable rule code + unit tests

### Phase 3: Data Management
**Purpose**: Design and create database schemas, handle data availability

**Key Components** (To be built):
- Data availability scanner
- Pseudo data generator (statistically realistic)
- Database schema designer (3NF normalized)
- Schema creation automation
- Migration file generator
- Data seeding engine
- **Output**: PostgreSQL schemas, migration scripts, initial data

### Phase 4: Input Strategy Design
**Purpose**: Determine how data will be collected from students

**Key Components** (To be built):
- Input method determiner (forms, tracking, prompts)
- Validation rule generator
- Data flow mapper
- **Output**: Input specifications for UI

### Phase 5: UI Auto-Generation
**Purpose**: Create React components for student/teacher interaction

**Key Components** (To be built):
- Existing UI assessment (component reuse detection)
- UX journey analyzer
- React component generator
- Form builder
- Styling engine (design system compliance)
- Accessibility enhancer (WCAG 2.1 AA)
- **Output**: Functional React components

### Phase 6: Integration & Deployment
**Purpose**: Create complete, deployable systems

**Key Components** (To be built):
- RESTful API generator
- Integration test generator
- Docker container creator
- Deployment automation
- Documentation generator
- **Output**: Deployable, documented systems

---

## PLANNED DATA MODELS (NOT YET IMPLEMENTED)

### Core Tables (Planned for PostgreSQL)

#### 1. Module
```
- id (UUID, PK)
- name (string)
- description (text)
- subject (enum: mathematics)
- grade_level (string)
- teacher_id (FK)
- status (enum: generating, active, archived)
- world_model (JSONB) - AI-generated domain model
- generated_schema (JSONB) - Database schema definition
- generated_ui (JSONB) - UI component definitions
- version (integer)
- created_at, updated_at (timestamps)
```

#### 2. Teacher
```
- id (UUID, PK)
- name (string)
- email (string, unique)
- institution (string)
- role (enum: teacher, admin, system_maintainer)
- preferences (JSONB)
```

#### 3. Student
```
- id (UUID, PK)
- name (string)
- grade_level (string)
- enrolled_modules (array)
```

#### 4. GenerationJob (Tracks pipeline execution)
```
- id (UUID, PK)
- module_id (FK)
- stage (enum: world_model, rules, data, input_strategy, ui, deployment)
- status (enum: pending, in_progress, completed, failed)
- input_data (JSONB)
- output_data (JSONB)
- error_log (text)
- started_at, completed_at (timestamps)
```

#### 5. Rule (Business rules)
```
- id (UUID, PK)
- module_id (FK)
- name (string)
- type (enum: validation, calculation, progression, feedback)
- complexity_score (integer)
- is_ontology (boolean)
- code (text) - generated rule code
- ontology_reference (string, nullable)
```

#### 6. DynamicSchema (Metadata for generated schemas)
```
- id (UUID, PK)
- module_id (FK)
- table_name (string)
- schema_definition (JSONB)
- migration_script (text)
- is_applied (boolean)
```

#### 7. StudentProgress (Dynamic per module)
```
- Always includes:
  - student_id (FK)
  - module_id (FK)
  - started_at (timestamp)
  - completed_at (timestamp)
  - progress_percentage (integer)
- PLUS: Module-specific fields
```

### Example Generated Schema (Not yet created)
```sql
-- Example: Fractions module
CREATE TABLE fraction_problems (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_type VARCHAR(50) NOT NULL,
    numerator_1 INTEGER NOT NULL,
    denominator_1 INTEGER NOT NULL CHECK (denominator_1 > 0),
    numerator_2 INTEGER,
    denominator_2 INTEGER,
    visual_representation VARCHAR(20),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    correct_answer_numerator INTEGER NOT NULL,
    correct_answer_denominator INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_attempts (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES fraction_problems(id),
    answer_numerator INTEGER NOT NULL,
    answer_denominator INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW()
);
```

---

## PLANNED API ENDPOINTS (NOT YET IMPLEMENTED)

### Example Generated API (Per Module)
```
POST   /api/modules/{module_id}/problems          - Generate new problem
GET    /api/modules/{module_id}/problems/{id}     - Get problem details
POST   /api/modules/{module_id}/submit            - Submit student answer
GET    /api/modules/{module_id}/progress/{student_id} - Get student progress
PUT    /api/modules/{module_id}/settings          - Update module settings
```

---

## EXISTING MOODLE/LMS INTEGRATION

### Current Status: NOT IMPLEMENTED

**Key Points from PRD**:
- Explicitly stated as out-of-scope for MVP
- "Third-party LMS Integration: Standalone system initially; LTI integration is future work"
- System is designed as standalone, not embedded in Moodle
- No current Moodle/LMS integration code exists

**Future Plans** (Phase 3):
- LTI (Learning Tools Interoperability) integration
- Potential support for Canvas, Moodle, Blackboard (decision pending)
- Module embedding capabilities
- Grade sync with host LMS

---

## EXISTING PROBLEM/EXERCISE/PRACTICE FUNCTIONALITY

### Current Status: NOT IMPLEMENTED

**Planned Approach** (Per PRD):
- Each teacher creates domain-specific practice modules
- AI generates appropriate problem types based on concepts
- Problem types automatically generated (visualization, calculation, progression-based)
- Support for:
  - Interactive visualizations (pizza fractions example)
  - Input validation and feedback
  - Behavior tracking
  - Progressive difficulty
  - Real-time assessment

**Example** (Planned but not built):
```javascript
// Auto-generated component (does not exist yet)
export const FractionVisualizer: React.FC<FractionVisualizerProps> = ({
  numerator,
  denominator,
  visualType,
  onInteraction
}) => {
  // Would include:
  // - SVG visualization
  // - Drag-and-drop interaction
  // - Accessibility features
  // - Progress tracking
};
```

---

## PHP AND MYSQL INTEGRATION PATTERNS

### Current Status: NOT USING PHP OR MYSQL

**Technology Choice** (Per PRD):
- NO PHP planned
- **Database**: PostgreSQL 15+ (NOT MySQL)
- **Rationale**:
  - JSONB support for storing generated models
  - Better JSON handling for complex data structures
  - Superior query capabilities
  - Normalization support (3NF minimum)

**Backend Language**: Python 3.11+ (not PHP)
- Reasons: Better for AI/ML, Claude API integration, ML libraries

---

## KEY ARCHITECTURAL DECISIONS

### 1. **Multi-Language Support**
- Primary: Korean
- Secondary: English
- Generated UIs support both languages

### 2. **Microservices Architecture**
- Separate components for each pipeline stage
- Independent scaling of services
- Loose coupling for flexibility

### 3. **AI-First Design**
- Claude Anthropic API as core reasoning engine
- Structured prompts for consistency
- Full conversation context maintained across stages
- All AI interactions logged for audit

### 4. **Code Generation as First-Class**
- Generated code treated as production artifacts
- Security scanning (no eval/exec, whitelist-only imports)
- Containerized execution for safety
- Comprehensive validation gates

### 5. **Version Control & Rollback**
- All generated artifacts versioned
- Change history maintained
- Rollback to previous versions supported
- Change reasons tracked

---

## SECURITY & COMPLIANCE

### Planned Security Measures
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Role-Based Access Control (RBAC)
- JWT authentication (1-hour expiration)
- Rate limiting (100 requests/hour for generation)
- Comprehensive audit logging
- Input sanitization (SQL injection, XSS prevention)
- WCAG 2.1 AA accessibility compliance

### Planned Data Privacy
- FERPA/COPPA compliance (educational data)
- Korean PIPA compliance (if applicable)
- PII handling carefully managed
- Student data anonymization in logs/monitoring

### Code Safety
- Static analysis for generated code
- Whitelist-only function/library usage
- Sandboxed execution (Docker containers)
- Automatic security scanning
- Manual review for complex patterns

---

## FUNCTIONAL REQUIREMENTS SUMMARY

### Total Planned: 47 Functional Requirements

**FR-1**: World Model Reconstruction (4 requirements)
- Natural language input processing
- Domain model generation
- Data structure analysis
- Event flow definition

**FR-2**: Rule Generation Engine (4 requirements)
- Rule identification and categorization
- Complexity assessment algorithm
- Rule-to-code generation
- Ontology conversion (for complex rules)

**FR-3**: Data Management (4 requirements)
- Data availability checking
- Pseudo data generation
- Database schema design
- Automated schema creation & migration

**FR-4**: Input Strategy Design (3 requirements)
- Input method determination
- Input validation strategy
- Data flow mapping

**FR-5**: UI Auto-Generation (6 requirements)
- Existing UI assessment
- UX journey analysis
- Component generation
- Form generation (Priority 1)
- Web interface generation (Priority 2)
- Conversational UI (Priority 3)

**FR-6**: Integration & Deployment (4 requirements)
- API generation
- End-to-end testing
- Deployment package creation
- Documentation generation

**FR-7**: Cross-Cutting (5+ requirements)
- AI/LLM integration
- Version control
- Configuration management
- Security & privacy
- Internationalization

---

## SUCCESS METRICS (PLANNED)

### Primary KPIs
1. **Adoption**: >70% of teachers within 6 months
2. **Speed**: <2 hours average module creation time
3. **Accuracy**: >85% of modules need minimal adjustments
4. **Time Savings**: 80% reduction vs. manual development (40-80 hours → ~8 hours)
5. **Satisfaction**: NPS > 50

### Secondary Metrics
- Student learning outcomes maintained or improved
- Module diversity (variety of concepts/interactions)
- System reliability (99% uptime)
- Cost efficiency (<$5 Claude API cost per module)
- Iteration speed (<30 minutes for updates)

---

## DEVELOPMENT TIMELINE (PLANNED)

### Phase 0: Discovery & Setup (Weeks 1-2)
- Codebase exploration and assessment
- Infrastructure setup
- Stakeholder interviews
- Technical feasibility report

### Phase 1: Core Pipeline (Weeks 3-8)
- World Model Reconstruction (2 sprints)
- Rule Generation Engine (2 sprints)

### Phase 2: Data & Persistence (Weeks 9-12)
- Data Management (1 sprint)
- Database Integration (1 sprint)

### Phase 3: Input & Interaction (Weeks 13-16)
- Input Strategy (1 sprint)
- Form Generation (1 sprint)

### Phase 4: UI Generation (Weeks 17-22)
- UI Component Generator (2 sprints)
- Integration & Polish (1 sprint)

### Phase 5: Deployment & Testing (Weeks 23-26)
- API & Deployment (1 sprint)
- End-to-End Testing (1 sprint)

### Phase 6: Launch & Iteration (Weeks 27-30)
- Beta Launch (1 sprint)
- Refinement (1 sprint)
- General Availability (1 sprint)

**Total**: 30 weeks (6-7 months) to MVP

---

## OPEN QUESTIONS FROM PRD

### High Priority (Need answers before development)
1. Authentication system integration (SSO, OAuth, SAML, custom?)
2. Integration with existing KAIST platform or standalone?
3. Deployment environment (On-premise, AWS, Azure, GCP?)
4. Monthly budget for Claude API costs
5. Real example teacher requests for validation

### Medium Priority (Answer during development)
6. Data privacy & compliance requirements
7. Existing KAIST design system/brand guidelines
8. Student data access and availability
9. Module approval workflow requirements
10. Existing module migration needs

---

## CURRENT GAPS & NEXT STEPS

### What's Missing
- All source code
- All configuration files
- All infrastructure setup
- All development/test environments
- All deployment documentation
- Team assignments

### Immediate Next Steps
1. Answer the 5 "High Priority" open questions
2. Set up development environment (Docker, Node, Python)
3. Create project structure with proper directory layout
4. Set up CI/CD pipeline
5. Begin Phase 1: World Model Reconstruction
6. Interview 5-10 teachers for real module requests

### Repository Setup Needed
- src/frontend/ (React app)
- src/backend/ (Node.js API Gateway)
- src/pipeline/ (Python orchestrator)
- src/database/ (Schema migrations)
- docker/
- tests/
- docs/
- .github/workflows/ (CI/CD)
- config/

---

## SUMMARY: ZERO EXISTING CODE, COMPREHENSIVE PLAN

This is a **greenfield project** with:
- **0 lines** of implementation code
- **1,262 lines** of comprehensive PRD
- **47 documented** functional requirements
- **6 planned** pipeline stages
- **~30 weeks** timeline to MVP

The PRD is excellent and detailed. What's needed now is:
1. Answer open questions
2. Build the technical infrastructure
3. Implement the 6-phase pipeline
4. Validate with real users

