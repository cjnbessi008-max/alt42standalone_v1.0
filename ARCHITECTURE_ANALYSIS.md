# Codebase Exploration Summary: AI Education System Pipeline

## Repository Status
- **Location**: `/home/user/alt42standalone_v1.0`
- **Current State**: Project planning phase - contains only PRD document
- **Current Branch**: claude/add-meditation-routine-015gQn5rXzXRTgndqfUab9v7
- **Latest Commit**: feat: add comprehensive PRD for AI Education System Pipeline (01c4378)

---

## 1. PROJECT OVERVIEW

### Purpose
KAIST Touch Math Academy's AI-powered educational module generation system. Teachers describe learning objectives in natural language, and the system automatically generates complete functional modules (database + UI + business logic).

### Project Status
- **Phase**: 0 - Discovery & Setup
- **Implementation**: Not yet started (only requirements documentation completed)
- **Target Users**: Teachers (primary), Students, Admins, System Maintainers

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router v6
- **UI Components**: Material-UI (MUI) or Ant Design
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios with interceptors
- **Real-time Communication**: Socket.io-client

### Backend
- **API Gateway**: Node.js (Express or Fastify)
- **Pipeline Orchestrator**: Python 3.11+ with FastAPI
- **Task Queue**: Celery with Redis broker
- **AI LLM Integration**: Anthropic Claude API (Python SDK)
- **Code Generation**: Jinja2 templates + Python AST manipulation

### Database & Caching
- **Primary DB**: PostgreSQL 15+ (JSONB support)
- **Cache**: Redis 7+
- **Future**: Neo4j for ontology storage

### DevOps & Monitoring
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### AI/ML
- **LLM**: Claude 3 Sonnet/Opus
- **Embeddings**: Voyage AI or OpenAI
- **Vector Store**: pgvector (PostgreSQL extension)

---

## 3. SYSTEM ARCHITECTURE

### High-Level Design
```
Frontend (React)
    ↓ REST API / WebSocket
API Gateway (Node.js)
    ↓
AI Pipeline Orchestrator (Python FastAPI)
    ├─ World Model Reconstruction
    ├─ Rule Generation Engine
    ├─ Data Management
    ├─ Input Strategy Design
    ├─ UI Auto-Generation
    └─ Deployment Service
    ↓
External Services
    ├─ Claude API (LLM)
    ├─ PostgreSQL (Schemas, Data)
    └─ Redis (Sessions, Caching)
```

### Core Pipeline Stages (Sequential)
1. **World Model Reconstruction** (15 min target)
   - NLP processing of teacher requests
   - Domain concept extraction
   - Concept graph generation
   - Relationship mapping

2. **Rule Generation Engine** (30 min target)
   - Business rule extraction
   - Complexity analysis
   - Code generation (Python/JavaScript)
   - Ontology conversion for complex rules

3. **Data Management** (varies)
   - Schema design and generation
   - Data availability checking
   - Pseudo data generation
   - Database migration

4. **Input Strategy Design**
   - Input method determination (forms, behavior tracking, prompts)
   - Validation rule generation
   - Data flow mapping

5. **UI Auto-Generation** (45 min target)
   - React component generation
   - Styling and theming
   - Accessibility implementation
   - Form builder

6. **Integration & Deployment** (30 min target)
   - API endpoint generation
   - Docker containerization
   - Documentation generation

---

## 4. QUIZ/PROBLEM FUNCTIONALITY ARCHITECTURE

### How Problem/Quiz Systems Are Generated

**Data Models Generated Per Module:**
```
fraction_problems
├── id (UUID)
├── module_id (FK)
├── problem_type (enum: visualization, addition, subtraction)
├── numerator_1, denominator_1
├── numerator_2, denominator_2
├── visual_representation (pizza, cake, bar)
├── difficulty_level (1-5)
└── correct_answer fields

student_attempts
├── id (UUID)
├── student_id (FK)
├── problem_id (FK)
├── answer_numerator, answer_denominator
├── is_correct (boolean)
├── time_spent_seconds
└── attempted_at (timestamp)
```

**Generated API Endpoints Per Module:**
```
POST   /api/modules/{module_id}/problems          - Generate new problem
GET    /api/modules/{module_id}/problems/{id}     - Get problem details
POST   /api/modules/{module_id}/submit            - Submit student answer
GET    /api/modules/{module_id}/progress/{student_id}
PUT    /api/modules/{module_id}/settings          - Update module settings
```

**React Components Generated:**
```typescript
- FractionVisualizer (interactive graphics)
- FractionInputForm (numerator/denominator inputs)
- ProblemFeedback (correct/incorrect with explanation)
- ProgressBar (mastery tracking)
- [Custom components based on teacher requirements]
```

### Input Methods for Problems
1. **Manual Input Forms**: Text, number, or selection inputs
2. **Behavior Tracking**: Click patterns, time spent, interaction sequences
3. **Interactive Prompts**: Conversational guidance

---

## 5. MOODLE INTEGRATION STATUS

### Current Status: **NOT IMPLEMENTED**

The PRD mentions Moodle only as a **Phase 3 (Future Enhancement)**:
- **Timeline**: Post-MVP (after general availability)
- **Current Focus**: Standalone system
- **Integration Type**: LTI (Learning Tools Interoperability) considered for future
- **Question**: "Which LMS platforms need integration? (Canvas, Moodle, Blackboard, custom?)"

**What would need to be added:**
- LTI provider implementation
- NRPS (Names and Role Provisioning Services) support
- Moodle authentication integration
- Deep linking for module launch

---

## 6. EXISTING MEDITATION/ROUTINE FEATURES

### Current Status: **NOT IMPLEMENTED**

**No existing meditation or routine features found in the codebase.**

This is a **new feature** to be implemented:
- 5-second meditation routine before complex problems
- Not mentioned in PRD
- **Opportunity**: Perfect for enhancing student focus before difficult tasks

---

## 7. DESIGN CONSIDERATIONS FOR MEDITATION FEATURE

### Proposed Integration Points

**Option A: Pre-Problem Routine (Most Direct)**
```
Student clicks "Start Problem"
    ↓
[5-second meditation routine screen]
    ├─ Guided breathing animation
    ├─ Calm background color/music
    └─ "Get Ready" countdown
    ↓
Problem presentation begins
```

**Option B: Module-Level Routine (Before Complex Problems)**
```
AI complexity analyzer determines problem is "complex"
    ↓
Trigger pre-problem meditation
    ↓
Present problem after routine
```

**Database Model Addition:**
```sql
student_meditation_sessions
├── id (UUID)
├── student_id (FK)
├── problem_id (FK)
├── module_id (FK)
├── routine_type (enum: breathing, mindfulness, focus-prep)
├── duration_seconds (default: 5)
├── completed (boolean)
└── completed_at (timestamp)

module_settings
├── enable_pre_problem_routine (boolean)
├── routine_type (enum)
├── problem_complexity_threshold (1-5)
└── routine_duration (seconds)
```

### React Components Needed:
```typescript
MeditationRoutine
├── BreathingAnimation (visual guidance)
├── GuidanceAudio (optional audio overlay)
├── Countdown (5 second timer)
├── FocusPrompt (motivational text)
└── ReadyButton (user confirms ready)
```

### Backend Features:
- Detect problem complexity (1-5 scale)
- Track meditation completion rates
- Measure impact on student performance
- Allow teachers to customize routine settings

---

## 8. KEY FILES AND ARTIFACTS RELEVANT TO MEDITATION FEATURE

### Primary Document
- **PRD Location**: `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md`
  - Sections 4 (Functional Requirements) and 6 (Design Considerations)
  - Specifically: FR-5.3 (UI Components), FR-6.1 (API Generation)

### Where Code Will Be Generated/Located (Once Implementation Starts)

**Frontend Components:**
- `src/components/problems/MeditationRoutine.tsx`
- `src/components/animations/BreathingAnimation.tsx`
- `src/pages/StudentProblemView.tsx` (modified to include meditation)

**Backend API:**
- `api/modules/{module_id}/meditation` (new endpoints)
- `api/student-progress/meditation-stats` (analytics)

**Database Migrations:**
- `migrations/add_meditation_sessions_table.sql`
- `migrations/add_module_meditation_settings.sql`

**Generated Module-Specific:**
- Each module will have meditation routine configuration in `module.settings`
- Student meditation data stored in dynamically generated tables

---

## 9. ARCHITECTURAL CONSIDERATIONS FOR MEDITATION

### Complexity Assessment
- **Complexity Score**: LOW
- **Conditions**: 1-2 (simple boolean checks)
- **Dependencies**: Few (meditation → problem flow)
- **Implementation Approach**: Simple procedural rules (no ontology needed)

### Performance Impact
- **Latency**: 5 seconds (user-initiated, not server-dependent)
- **Database**: Minimal new tables
- **API Calls**: 1 completion call after meditation
- **Caching**: No caching needed

### Integration Points
1. **Rule Engine**: Add "complexity_level >= threshold" rule
2. **Input Strategy**: Meditation as pre-problem input strategy
3. **UI Generator**: Generate meditation screen based on module settings
4. **Data Manager**: Create meditation tracking tables
5. **API Gateway**: New meditation endpoints

### Configuration (Teacher-Facing)
```json
{
  "meditation_settings": {
    "enabled": true,
    "trigger_on_complexity": 4,
    "duration_seconds": 5,
    "routine_type": "breathing",
    "allow_skip": false,
    "show_timer": true
  }
}
```

---

## 10. RECOMMENDED IMPLEMENTATION STEPS

### Phase 0: Setup (Weeks 1-2)
1. ✅ Review PRD (completed)
2. Set up development environment
3. Create meditation feature specification
4. Design meditation UX mockups

### Phase 1: Backend Integration (Weeks 3-4)
1. Add meditation tables to data manager
2. Implement complexity detection logic
3. Create meditation API endpoints
4. Add meditation settings to rule engine

### Phase 2: Frontend Components (Weeks 5-6)
1. Build BreathingAnimation component
2. Build MeditationRoutine container
3. Integrate with problem flow
4. Add teacher configuration UI

### Phase 3: Integration & Testing (Weeks 7-8)
1. End-to-end testing
2. Student UX testing
3. Teacher configuration testing
4. Analytics and reporting

### Phase 4: Optimization (Week 9)
1. Performance optimization
2. Accessibility audit
3. Mobile responsiveness
4. Analytics dashboard

---

## 11. OUTSTANDING QUESTIONS (FROM PRD)

**Critical for Implementation:**
1. What authentication system does KAIST use? (SSO, OAuth, SAML?)
2. Is there an existing platform to integrate with?
3. Where will the system be hosted? (On-prem, AWS, Azure, GCP?)
4. What's the monthly budget for Claude API costs?
5. What's the KAIST design system/brand guide?

**For Meditation Feature Specifically:**
1. Should meditation be mandatory or skippable?
2. What meditation types are preferred? (breathing, mindfulness, focus preparation?)
3. Should audio guidance be included?
4. How should the routine adapt for different student ages?
5. Should teachers be able to customize meditation content?

---

## 12. SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| **Codebase State** | Planning | Only PRD exists, no implementation code |
| **Frontend Framework** | Planned | React 18+ with TypeScript |
| **Backend Framework** | Planned | Node.js (API) + Python FastAPI (Pipeline) |
| **Database** | Planned | PostgreSQL 15+ with Redis caching |
| **Moodle Integration** | Not Started | Phase 3 feature (future) |
| **Quiz/Problem System** | Designed | Auto-generated per module, endpoints planned |
| **Meditation Feature** | Proposed | NEW feature, requires design & implementation |
| **UI Generation** | Designed | React component auto-generation via Claude |
| **Implementation Start** | Q4 2025 | Phase 1 begins after discovery |

