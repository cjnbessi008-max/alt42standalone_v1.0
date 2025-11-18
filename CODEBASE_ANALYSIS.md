# KAIST AI Education System Pipeline - Codebase Structure Analysis

## Executive Summary

This is a **greenfield project** - there is currently no implementation code, only a comprehensive PRD (Product Requirements Document). The system being designed is an AI-powered platform for automatically generating educational modules for KAIST Touch Math Academy.

**Current Status**: Architecture design complete; ready for implementation
**Key Technology Stack**: React (Frontend), Node.js/Express (API Gateway), Python/FastAPI (Pipeline Orchestrator)

---

## 1. Overall Project Architecture

### 1.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER (React)                     │
│  - Teacher Dashboard (module creation)                       │
│  - Student UI (generated modules)                            │
│  - Admin Dashboard (monitoring & analytics)                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│              MIDDLEWARE LAYER (Node.js/Express)              │
│  - Authentication (JWT with KAIST SSO integration)           │
│  - Request validation & rate limiting (100 req/hour)         │
│  - WebSocket for real-time progress updates                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ Internal API / Task Queue
┌───────────────────▼─────────────────────────────────────────┐
│        PIPELINE ORCHESTRATION LAYER (Python/FastAPI)         │
│  - 6-Phase Generation Pipeline (World Model → Deploy)        │
│  - Claude AI integration                                     │
│  - Database & schema management                              │
│  - Code generation & validation                              │
└─────────────────┬───────────┬────────────┬───────────────────┘
                  │           │            │
         ┌────────▼──┐ ┌─────▼────┐ ┌────▼─────────┐
         │ Claude    │ │PostgreSQL│ │Redis Cache   │
         │ API       │ │Database  │ │& Sessions    │
         └───────────┘ └──────────┘ └──────────────┘
```

### 1.2 Key Architectural Decisions

1. **Separation of Concerns**: Teacher-facing (module creation) separate from student-facing (module consumption)
2. **Asynchronous Generation**: Module creation happens in background (2-30 minutes depending on complexity)
3. **LLM-Driven**: Claude 3 Sonnet/Opus as primary reasoning engine for all generation stages
4. **Modular Pipeline**: 6 independent but sequential stages (can be parallelized for certain tasks)
5. **Database per Module**: Each generated module gets its own database schema (PostgreSQL with JSONB for flexibility)

---

## 2. The Six-Phase Generation Pipeline

### Phase 1: World Model Reconstruction
**Input**: Natural language teacher request (Korean or English)
**Output**: Semantic model of educational domain
**Components to be built**:
- NLP processor for teacher requests
- Concept extraction engine
- Relationship mapper
- Concept graph generator

**Generated Artifacts**:
```json
{
  "concepts": ["Fraction", "Numerator", "Denominator"],
  "relationships": {
    "Fraction": ["has_numerator", "has_denominator"],
    "Numerator": ["is_part_of_fraction"]
  },
  "operations": ["add_fractions", "subtract_fractions"],
  "difficulty_hierarchy": {
    "conceptual_understanding": ["visualization"],
    "arithmetic": ["simple_arithmetic", "complex_arithmetic"]
  }
}
```

### Phase 2: Rule Generation Engine
**Input**: World model
**Output**: Business rules for the domain
**Components to be built**:
- Rule extraction engine
- Complexity assessment (>5 conditions = complex)
- Rule-to-code generator
- Ontology conversion (for complex rules)

**Generated Artifacts**: Python/JavaScript code for validation, calculation, progression, feedback

**KEY FOR CALMING MESSAGES**: This phase determines the rules for problem progression, which is where difficulty levels are established

### Phase 3: Data Management
**Input**: World model + rules
**Output**: Database schema + pseudo data
**Components to be built**:
- Data availability checker
- Pseudo data generator (statistically realistic)
- Schema designer (3NF normalized PostgreSQL)
- Migration executor

**Generated Schema Example**:
```sql
-- Difficulty tracking is critical here
CREATE TABLE problems (
    id UUID PRIMARY KEY,
    module_id UUID,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    concept_tags JSONB,
    created_at TIMESTAMP
);

CREATE TABLE student_progress (
    id UUID PRIMARY KEY,
    student_id UUID,
    problem_id UUID,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP
);
```

### Phase 4: Input Strategy Design
**Input**: Data schema + rules
**Output**: Plan for data collection
**Components to be built**:
- Input method determiner (forms vs. behavioral tracking vs. interactive prompts)
- Validation strategy designer
- Data flow mapper

**Result**: Specification for what interactions student performs and when

### Phase 5: UI Auto-Generation
**Input**: Input strategy + design system
**Output**: React components
**Components to be built**:
- Existing component assessor (reuse where possible)
- UX journey analyzer
- React component generator
- Form builder
- Styling engine (Material-UI based)

**Generated Components**:
- ProblemDisplay
- AnswerInput
- ProgressTracker
- FeedbackPanel
- NavigationControls

**KEY FOR CALMING MESSAGES**: ProblemDisplay component would trigger audio playback when difficulty threshold is reached

### Phase 6: Integration & Deployment
**Input**: All generated artifacts
**Output**: Complete deployable module
**Components to be built**:
- API endpoint generator
- Docker containerization
- Deployment orchestrator
- Documentation generator

---

## 3. LMS-Related Components & Problem Display

### 3.1 Problem Display Architecture

```
Module (Generated)
├── StudentUI (React Container)
│   ├── ProblemDisplay
│   │   ├── ProblemContent (text, equations, visuals)
│   │   ├── DifficultyIndicator
│   │   ├── CalmingMessageTrigger ← **CALMING MESSAGES HERE**
│   │   └── AudioPlayer (for audio instructions/feedback)
│   ├── AnswerInput
│   │   ├── FormFields (dynamically generated)
│   │   ├── ValidationFeedback
│   │   └── SubmitButton
│   └── ProgressTracker
│       ├── CurrentProblemPosition
│       ├── MasteryLevel
│       └── NextProgressionCriteria
└── Backend API (Generated)
    ├── /problems (GET/POST)
    ├── /submit (POST)
    ├── /progress (GET)
    └── /hint (GET)
```

### 3.2 Problem Navigation Entry Points

From the PRD, problems are displayed through:

1. **Linear Progression**: Student moves through sequence of problems
2. **Difficulty-Based Branching**: Easier/harder problems based on performance
3. **Concept Mastery Tracking**: Different problem types unlocked by mastery
4. **Interactive Prompts**: Conversational elements guide problem selection

**Where problems enter the student journey**:
- Dashboard: "Start Module" button
- Navigation: Previous/Next problem, Jump to concept
- Adaptive routing: System suggests next problem based on performance

### 3.3 LMS Integration Points

Currently designed as **standalone** (no third-party LMS integration in MVP), but architecture allows:

1. **Authentication Integration**: 
   - KAIST SSO (SAML/OAuth)
   - JWT tokens for API calls

2. **Student Roster Integration**:
   - Read-only access to student database
   - Enroll students in modules

3. **Grade Export**:
   - Optional export to existing LMS gradebook

4. **Future LTI Support**:
   - Standardized Learning Tools Interoperability
   - Would use generated API endpoints

---

## 4. Difficulty Level & Problem Categorization

### 4.1 How Difficulty is Determined

From **Phase 1 & 2** of the pipeline:

**In World Model**: Difficulty hierarchy is established during domain analysis
```json
{
  "difficulty_progression": {
    "level_1": "visualization_only",
    "level_2": "simple_arithmetic",
    "level_3": "multi_step_arithmetic",
    "level_4": "complex_scenarios",
    "level_5": "edge_cases"
  }
}
```

**In Rules**: Business rules determine progression criteria
```python
# Generated rule examples
def can_progress_to_next_level(student_attempts):
    correct_count = sum(1 for a in student_attempts if a.is_correct)
    success_rate = correct_count / len(student_attempts)
    return success_rate >= 0.85  # 85% mastery required

def should_show_hint(failed_attempts):
    return len(failed_attempts) >= 2
```

### 4.2 Problem Categorization System

**Stored in Generated Database**:
```sql
CREATE TABLE problem_metadata (
    id UUID PRIMARY KEY,
    difficulty_level INTEGER (1-5),
    required_concepts JSONB,  -- ["fractions", "numerator"]
    estimated_time_seconds INTEGER,
    is_hint_eligible BOOLEAN,
    progression_weight FLOAT
);
```

**Difficulty is determined by**:
- Number of concepts involved
- Complexity of arithmetic/logic required
- Time constraints
- Prerequisite knowledge needed

---

## 5. Audio/Media Playback Capabilities

### 5.1 Current Design (from PRD)

The PRD mentions:
- **Priority 3 feature**: "Conversational UI" with "voice input options" (future)
- **Not in MVP**: "Voice Input" for teacher requests or "Video Content Generation"

### 5.2 What CAN Be Done in MVP (Audio for Calming Messages)

**Frontend Components Needed** (in React):
```typescript
// Auto-generated component stub
interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, autoPlay }) => {
  return (
    <audio 
      src={audioUrl} 
      autoPlay={autoPlay}
      onEnded={() => { /* trigger next UI state */ }}
    />
  );
};
```

**Backend Capability Needed** (Python/Node.js):
- Serve pre-recorded audio files or generate them via TTS
- Store audio URLs in module configuration
- Track which students have listened to audio

**Audio File Storage**:
- AWS S3 / MinIO (S3-compatible)
- Redis cache for frequently-accessed audio
- CDN distribution for performance

### 5.3 Implementation Approach for Calming Messages

Since PRD mentions support for "voice input options" and natural language, the infrastructure could support:

1. **Pre-recorded audio files**: Teachers upload or AI generates once
2. **Text-to-Speech (TTS)**: Real-time generation via Google Cloud / Azure Speech Services
3. **Streaming**: WebSocket for live audio feedback

---

## 6. Technical File Structure (When Implemented)

Based on PRD, the actual implementation would have:

```
/home/user/alt42standalone_v1.0/
├── frontend/                          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── ProblemDisplay.tsx     # ← Problem display component
│   │   │   ├── AudioPlayer.tsx        # ← Audio playback
│   │   │   ├── CalmingMessageOverlay.tsx  # ← NEW: Calming messages
│   │   │   └── ...generated-components/
│   │   ├── pages/
│   │   │   ├── ModuleView.tsx
│   │   │   └── StudentDashboard.tsx
│   │   ├── redux/                     # State management
│   │   └── api/                       # API client
│   └── package.json
│
├── backend/                           # Node.js/Express API Gateway
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   ├── routes/
│   │   │   ├── modules.ts
│   │   │   ├── problems.ts
│   │   │   └── audio.ts               # ← Audio file serving
│   │   └── server.ts
│   └── package.json
│
├── pipeline/                          # Python FastAPI Orchestrator
│   ├── phases/
│   │   ├── 01_world_model.py
│   │   ├── 02_rule_engine.py
│   │   ├── 03_data_manager.py
│   │   ├── 04_input_strategy.py
│   │   ├── 05_ui_generator.py         # ← Generates ProblemDisplay components
│   │   └── 06_deployer.py
│   ├── ai/
│   │   └── claude_integration.py      # Claude API calls
│   ├── generators/
│   │   ├── schema_generator.py
│   │   ├── component_generator.py     # ← Generates React components
│   │   ├── audio_generator.py         # ← NEW: Generate/serve audio
│   │   └── rule_generator.py
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   │   ├── 001_init_schema.sql
│   │   └── 002_difficulty_tracking.sql
│   └── seeds/
│
├── tasks/                             # Existing PRD
│   └── 0001-prd-ai-education-pipeline.md
│
├── docker-compose.yml                 # PostgreSQL, Redis, services
└── README.md
```

---

## 7. Key Components for Calming Message Feature

### 7.1 Where Calming Messages Fit in the Architecture

**Trigger Point**: When a problem with difficulty_level >= 4 is displayed to student

**Flow**:
```
StudentUI.ProblemDisplay
  → Check problem.difficulty_level
  → If >= 4 (Hard/Very Hard):
    → Show CalmingMessageOverlay
    → Play audio: calm_message_{difficulty_level}.mp3
    → Display visual calming content
    → Wait for student acknowledgment or timeout
  → Then display actual problem
```

### 7.2 Database Schema Changes Needed

```sql
-- Track which calming messages have been served
CREATE TABLE calming_message_log (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    difficulty_level INTEGER,
    message_type VARCHAR(50),  -- 'audio' | 'visual' | 'combined'
    played_at TIMESTAMP,
    duration_seconds FLOAT
);

-- Calming message configuration (teacher-editable)
CREATE TABLE module_calming_config (
    id UUID PRIMARY KEY,
    module_id UUID UNIQUE,
    difficulty_threshold INTEGER DEFAULT 4,  -- Trigger at level 4+
    message_templates JSONB,  -- Predefined messages per difficulty
    audio_enabled BOOLEAN DEFAULT TRUE,
    text_enabled BOOLEAN DEFAULT TRUE
);
```

### 7.3 React Component Design

```typescript
// CalmingMessageOverlay.tsx (to be auto-generated)
interface CalmingMessageProps {
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  problem_id: string;
  student_id: string;
  on_continue: () => void;
}

export const CalmingMessageOverlay: React.FC<CalmingMessageProps> = ({
  difficulty_level,
  problem_id,
  student_id,
  on_continue
}) => {
  const [audioPlayed, setAudioPlayed] = useState(false);
  
  const message_map = {
    4: "This is a challenging problem. Take your time and think it through step by step.",
    5: "This is a very challenging problem. Remember, mistakes help you learn!"
  };

  return (
    <div className="calming-overlay">
      <div className="message-content">
        <svg className="breathing-animation">
          {/* Breathing circle or similar calming visual */}
        </svg>
        <p className="calm-message">{message_map[difficulty_level]}</p>
        {audioPlayed && <button onClick={on_continue}>Continue to Problem</button>}
      </div>
      <AudioPlayer 
        src={`/audio/calming_message_level_${difficulty_level}.mp3`}
        onComplete={() => setAudioPlayed(true)}
      />
    </div>
  );
};
```

### 7.4 Backend API Changes

```typescript
// Generated API endpoints for calming messages
GET /api/modules/:module_id/audio/:difficulty_level
  → Serves pre-generated audio file

POST /api/modules/:module_id/calming-config
  → Teacher updates calming message settings

GET /api/students/:student_id/calming-stats
  → Analytics: how often messages served, effectiveness
```

---

## 8. Current Project Status & Next Steps

### What Exists Now:
- ✅ Comprehensive PRD (50KB document with architecture design)
- ✅ Clear technical specifications
- ✅ Technology stack decisions
- ✅ Success metrics and KPIs
- ✅ Open questions identified

### What Needs to Be Built:
1. Frontend React application (phases 4-5 of pipeline)
2. Backend API Gateway (authentication, routing)
3. Python Pipeline Orchestrator (all 6 phases)
4. Database infrastructure setup
5. Claude API integration layer

### For Calming Message Feature:
- **Scope**: Relatively small feature (fits in Phase 5: UI Generation)
- **Dependencies**: 
  - Database schema with difficulty levels (Phase 3)
  - Problem display component (Phase 5)
  - Audio asset storage infrastructure
- **Implementation timeline**: ~1-2 sprints once core UI generation is working

---

## 9. Key Files & Artifacts When Implementation Starts

### Configuration Files to Create:
1. `/package.json` - Node.js dependencies
2. `/requirements.txt` - Python dependencies
3. `/docker-compose.yml` - Service orchestration
4. `/.env.example` - Configuration template
5. `/Dockerfile` - Container definitions

### Generated Artifacts (from pipeline):
- Module-specific database schemas
- Module-specific React components
- Module-specific API endpoint definitions
- Module-specific business logic

### Template Systems to Build:
- React component templates (Jinja2/etc.)
- Database schema templates
- API endpoint templates
- Documentation templates

---

## 10. Risk Factors & Mitigation

### Risks:
1. **Claude API Costs**: Could exceed budget if not optimized
   - Mitigation: Caching, prompt optimization, usage limits

2. **Code Generation Quality**: AI-generated code might have bugs
   - Mitigation: Validation gates, static analysis, testing framework

3. **Teacher Adoption**: Complex system might be intimidating
   - Mitigation: Progressive disclosure, wizard interfaces, help system

4. **Audio Latency**: Calming messages need to be instantaneous
   - Mitigation: Pre-generate audio files, CDN distribution, local caching

### For Calming Messages Specifically:
- **Effectiveness**: Need to validate that messages actually calm students
- **Accessibility**: Ensure audio works for hearing-impaired students (provide text alternative)
- **Personalization**: Messages should adapt to student preferences
