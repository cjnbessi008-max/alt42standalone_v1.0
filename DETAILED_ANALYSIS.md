# ALT42 Standalone v1.0 - Codebase Exploration & Architecture Analysis

**Repository**: `/home/user/alt42standalone_v1.0`  
**Date**: November 18, 2025  
**Current Branch**: `claude/lms-distraction-detection-01HTiEBMWNkdN9UFQeN6MqVH`

---

## 1. EXECUTIVE SUMMARY

This is a **greenfield project** for KAIST Touch Math Academy - a sophisticated AI Education System Pipeline that automatically generates complete educational modules from natural language teacher requests. The repository currently contains a comprehensive 1,262-line PRD document that defines the complete system architecture.

**Key Status**: Pre-development phase - Architecture is defined, no production code yet exists. This is the ideal time to plan distraction detection functionality integration.

**Project Scope**: An end-to-end system that transforms teacher requests into deployable educational modules, including automatically generated databases, business rules, input strategies, and user interfaces.

---

## 2. CURRENT CODEBASE STRUCTURE

### 2.1 Repository Layout
```
/home/user/alt42standalone_v1.0/
├── .git/                              # Git repository metadata
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # Main PRD (1,262 lines)
└── [NO SOURCE CODE YET - PLANNED COMPONENTS ONLY]
```

### 2.2 Files Present
- **Single Document**: `tasks/0001-prd-ai-education-pipeline.md` - Comprehensive PRD covering all 6 pipeline phases

### 2.3 Development Status
- Git commits: 1 (just the PRD)
- Branches: Only the distraction-detection feature branch
- Code artifacts: None yet - all planned

---

## 3. LMS (LEARNING MANAGEMENT SYSTEM) ARCHITECTURE

### 3.1 Integration Points

The PRD explicitly addresses LMS integration:

#### From PRD Section 7.6 - Integration Points:

```
Existing KAIST Systems:
1. **Authentication**: Integrate with KAIST SSO (SAML/OAuth)
2. **Student Database**: Read-only access to student roster
3. **Grade System**: Optional export of student progress/grades
4. **LMS Integration**: Embed generated modules in existing LMS (future)
```

#### Key LMS Entities (Section 6.3 - Data Models):

```
Teacher Entity:
- id (UUID)
- name (string)
- email (string, unique)
- institution (string)
- role (enum: teacher, admin, system_maintainer)
- preferences (JSONB)

Student Entity:
- id (UUID)
- name (string)
- grade_level (string)
- enrolled_modules (array of module_ids)

Module Entity:
- id (UUID)
- name (string)
- description (text)
- subject (enum: mathematics)
- grade_level (string)
- teacher_id (foreign key)
- status (enum: generating, active, archived)
- version (integer)
- created_at, updated_at
```

### 3.2 Module Lifecycle in LMS Context

**Phase 6: Integration & Deployment** (Section 4.6)

The system generates:
- RESTful API endpoints per module
- Authentication/authorization layers
- Module versioning and rollback
- Deployment containers

**Generated API Endpoints** (Appendix C):
```
POST   /api/modules/{module_id}/problems
GET    /api/modules/{module_id}/problems/{id}
POST   /api/modules/{module_id}/submit
GET    /api/modules/{module_id}/progress/{student_id}
PUT    /api/modules/{module_id}/settings
```

### 3.3 Role-Based Access Control (RBAC)

**Roles Defined**:
- **Teacher**: Create and manage modules
- **Admin**: Monitor modules, approve before deployment
- **System Maintainer**: Review generated code/schemas for security
- **Student**: Access assigned modules

---

## 4. DISTRACTION DETECTION FUNCTIONALITY

### 4.1 Current References in PRD

The term "distraction" appears in context of **UI Design** (not detection):
- Line 390: "Clean, distraction-free design" (a UI principle)
- The branch name explicitly signals: `claude/lms-distraction-detection-01HTiEBMWNkdN9UFQeN6MqVH`

**Key Insight**: Distraction detection is NOT in the PRD - this is your integration task!

### 4.2 Existing Tracking Capabilities (Foundation)

The PRD includes **behavior tracking** as a planned input method (Section 4.1):

```yaml
Input Methods:
  - Manual input forms: Direct text, number, or selection inputs
  - Behavior tracking: 
      * Click patterns
      * Time spent [per question/section]
      * Interaction sequences
  - Interactive prompts: Conversational questions that guide learning
```

### 4.3 Where Distraction Detection Should Integrate

#### 4.3.1 Input Strategy Phase (Phase 4)

**Current Requirement (FR-4.1)**: System identifies what data needs to be collected from students and determines optimal input method.

**Enhancement Point**: Add distraction detection collection methods
```
Input Methods to Generate:
  ✓ Manual input (existing)
  ✓ Behavior tracking (existing)
  ✓ Distraction signals (NEW):
      - Off-screen time (eye tracking, page blur detection)
      - Rapid page switching
      - Inactivity duration
      - Multiple tabs/window switching
      - Mouse movement patterns during problems
      - Typing pause analysis
```

#### 4.3.2 Database Schema Phase (Phase 3)

**Where**: Generated database schemas for each module should include distraction tracking tables

**Schema Example for Fractions Module** (from Appendix C):
```sql
-- EXISTING (from PRD)
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY,
    student_id UUID,
    problem_id UUID,
    answer_numerator INTEGER,
    answer_denominator INTEGER,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,  -- Existing
    attempted_at TIMESTAMP
);

-- NEW: Distraction Tracking
CREATE TABLE distraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES fraction_problems(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'page_blur',           -- Window lost focus
        'tab_switch',          -- Switched to another tab
        'off_screen',          -- Eye tracking shows gaze off-screen
        'rapid_scroll',        -- Scrolling up/down rapidly
        'inactivity',          -- No interaction for X seconds
        'window_resize',       -- Browser window resized
        'multiple_tabs',       -- Detected multiple tabs
        'mouse_idle'           -- Mouse not moved for duration
    )),
    duration_seconds INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB  -- Store additional context
);

-- NEW: Distraction Summary per attempt
CREATE TABLE attempt_distraction_summary (
    id UUID PRIMARY KEY,
    student_attempt_id UUID UNIQUE REFERENCES student_attempts(id),
    total_distraction_events INTEGER,
    total_distraction_duration_seconds INTEGER,
    distraction_percentage DECIMAL(5,2),  -- % of attempt time
    distraction_types JSONB,  -- Count per type
    focus_sessions INTEGER,  -- Continuous focus periods
    flagged_for_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.3.3 Data Collection Layer

**Where**: Frontend React components should emit distraction events

**Component-Level Integration** (Phase 5):

```typescript
// Generated React component enhancement for distraction tracking
interface ProblemComponentProps {
  problem: FractionProblem;
  studentId: UUID;
  onDistractionEvent?: (event: DistractionEvent) => void;
  distractionTrackingEnabled?: boolean;
}

const ProblemComponent: React.FC<ProblemComponentProps> = ({
  problem,
  studentId,
  onDistractionEvent,
  distractionTrackingEnabled = true
}) => {
  // Track window blur events
  useEffect(() => {
    const handleBlur = () => {
      if (distractionTrackingEnabled) {
        onDistractionEvent?.({
          type: 'page_blur',
          timestamp: Date.now()
        });
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Track mouse idle periods
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        onDistractionEvent?.({
          type: 'mouse_idle',
          duration: 5 * 60, // 5 minutes default
          timestamp: Date.now()
        });
      }, 5 * 60 * 1000);
    };

    document.addEventListener('mousemove', resetIdleTimer);
    return () => {
      document.removeEventListener('mousemove', resetIdleTimer);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div className="problem-container">
      {/* Problem content */}
    </div>
  );
};
```

---

## 5. WEB APPLICATION STRUCTURE & FRONTEND COMPONENTS

### 5.1 Frontend Architecture (from PRD Section 6.2)

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  Teacher UI | Student UI | Admin Dashboard                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│                   API Gateway (Node.js)                      │
│  Authentication | Rate Limiting | Request Routing           │
└───────────────────────────────────────────────────────────────┘
```

### 5.2 Planned Frontend Stack

**Technology**: React 18+ with TypeScript (Section 6.4)

```
React Components (Auto-Generated):
├── Teacher Dashboard
│   ├── Module Request Wizard
│   ├── Module List
│   ├── Analytics Dashboard
│   └── Version Management
│
├── Student Interface (Per Module)
│   ├── Auto-Generated Problem Components
│   ├── Progress Indicators
│   ├── Feedback Components
│   └── Navigation
│
└── Admin Dashboard
    ├── Module Overview
    ├── Student Engagement Metrics
    ├── Quality Review Interface
    └── Approval Workflow
```

### 5.3 Frontend Components - Detailed Breakdown

#### 5.3.1 Teacher UI Components
```
Teacher Dashboard:
├── NewModuleButton (CTA)
├── ModuleList
│   ├── ModuleCard
│   │   ├── QuickActions (duplicate, edit, archive)
│   │   ├── StatusBadge (generating, active, archived)
│   │   └── PerformanceMetrics
│   └── Pagination/Search
│
├── ModuleRequestWizard (5-step wizard)
│   ├── Step 1: DescribeModule (textarea for natural language)
│   ├── Step 2: ReviewUnderstanding (concept map visualization)
│   ├── Step 3: ClarifyDetails (AI-generated questions)
│   ├── Step 4: PreviewGenerated (interactive prototype)
│   └── Step 5: DeployOrRefine (deploy/revise buttons)
│
├── ModuleManagement
│   ├── MetadataEditor (title, description, grade)
│   ├── AnalyticsDashboard
│   ├── AccessControl
│   └── VersionHistory
│
└── StateManagement: Redux/Zustand + Context API
    ├── moduleState (list, current, generating)
    ├── authState (user, permissions)
    ├── uiState (wizard step, loading states)
    └── generationProgress (pipeline stage, percent complete)
```

#### 5.3.2 Student UI Components
```
Generated Module Interface:
├── ProblemContainer
│   ├── ProblemStatement
│   ├── InputForm (dynamically generated)
│   │   ├── TextInput
│   │   ├── NumberInput
│   │   ├── SelectInput
│   │   ├── InteractiveDragDrop
│   │   └── CustomComponents (module-specific)
│   │
│   ├── ProgressBar (mastery tracking)
│   ├── HintButton
│   └── FeedbackDisplay
│
├── Navigation
│   ├── PreviousButton
│   ├── NextButton
│   └── ProgressIndicator
│
├── SupportPanel
│   ├── ContextualHelp
│   ├── ExampleProblems
│   └── Glossary
│
└── DistractionIndicators (NEW - PROPOSED)
    ├── FocusStatus
    ├── DistractionAlert
    └── BreakReminder
```

#### 5.3.3 Admin Dashboard Components
```
AdminDashboard:
├── ModuleOverview
│   ├── TotalModules (generating, active, archived)
│   ├── ModulePerformanceGrid
│   └── TopPerformingModules
│
├── StudentEngagementMetrics
│   ├── CompletionRateChart
│   ├── AverageScoreChart
│   ├── TimeToMasteryChart
│   └── StudentProgressTable
│
├── ModuleReview (Quality Control)
│   ├── PendingApprovalList
│   ├── CodeReviewInterface
│   ├── TestResultsViewer
│   └── ApprovalWorkflow
│
└── SystemHealth
    ├── UpstreamMonitor
    ├── APILatencyChart
    ├── ErrorRateAlert
    └── CostAnalysis
```

### 5.4 Frontend State Management

**Tools**: Redux Toolkit or Zustand (Section 6.4)

```typescript
// Proposed state structure
interface RootState {
  // Auth
  auth: {
    user: User;
    role: Role;
    token: JWT;
    permissions: Permission[];
  };

  // Modules
  modules: {
    list: Module[];
    current: Module | null;
    generating: GenerationJob | null;
    generationProgress: {
      stage: PipelineStage;
      percentComplete: number;
      estimatedTimeRemaining: number;
    };
  };

  // Student Session (Per Module)
  studentSession: {
    moduleId: UUID;
    studentId: UUID;
    currentProblemId: UUID;
    startTime: timestamp;
    distractionEvents: DistractionEvent[];  // NEW
    focusMetrics: FocusMetrics;             // NEW
  };

  // UI
  ui: {
    wizardStep: number;
    loading: boolean;
    notifications: Notification[];
    sidebarOpen: boolean;
  };

  // Analytics (Teacher View)
  analytics: {
    selectedModuleId: UUID;
    timeRange: DateRange;
    studentEngagementData: EngagementMetrics[];
    chartData: any;
  };
}
```

---

## 6. VIDEO & LEARNING ANALYTICS FEATURES

### 6.1 Video Content in MVP

**Status**: Explicitly OUT OF SCOPE (PRD Section 5)
```
Non-Goals - Out of Scope for MVP:
"9. Video Content Generation: Automatic instructional video creation is out of scope"
```

**However**: The system is designed to support future video integration:
```
Database schemas will support video metadata storage
UI can embed video players as custom components
API endpoints can be extended for video streaming
```

### 6.2 Learning Analytics Framework (Planned)

**Data Collection Points** (Section 4.3 - FR-4.3: Data Flow Mapping):

```
System MUST:
├── Map how collected data flows through the system
├── Identify data transformations needed
├── Establish data persistence points
└── Define analytics and reporting touchpoints
```

**Analytics Dashboard Metrics** (Section 8):

#### 6.2.1 Teacher-Facing Analytics
```
Per-Module Metrics:
├── Student Engagement
│   ├── Completion rate (%)
│   ├── Average score
│   ├── Time-to-mastery
│   └── Attempt patterns
│
├── Interaction Analytics
│   ├── Total interactions
│   ├── Most common mistakes
│   ├── Help button usage
│   └── Hint acceptance rate
│
└── Learning Progression
    ├── Mastery timeline
    ├── Concept understanding curve
    ├── Performance vs. time-spent
    └── Learning outcome trends
```

#### 6.2.2 System-Level Analytics
```
Administrative Metrics (Section 8):
├── Adoption Rate (target >70% of teachers within 6 months)
├── Generation Speed (target <2 hours per module)
├── System Accuracy (target >85% require minimal adjustments)
├── Time Savings (80% reduction vs. manual)
├── Teacher Satisfaction (NPS > 50)
├── Student Learning Outcomes (maintained/improved)
├── Module Diversity (unique concepts covered)
├── System Reliability (99% uptime, <1% failure)
├── Cost Efficiency (<$5 per module generation)
└── Iteration Speed (<30 min for updates)
```

### 6.3 Proposed Analytics Database Schema

```sql
-- Learning Analytics Tables (To be auto-generated per module)

CREATE TABLE learning_events (
    id UUID PRIMARY KEY,
    student_id UUID,
    module_id UUID,
    event_type VARCHAR(50) CHECK (event_type IN (
        'problem_viewed',
        'attempt_submitted',
        'hint_requested',
        'help_requested',
        'problem_completed',
        'session_started',
        'session_ended'
    )),
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_mastery (
    id UUID PRIMARY KEY,
    student_id UUID,
    module_id UUID,
    concept_id VARCHAR(100),
    mastery_score DECIMAL(3,2),  -- 0-1 scale
    last_updated TIMESTAMP,
    confidence_score DECIMAL(3,2),
    time_to_mastery_seconds INTEGER
);

CREATE TABLE learning_engagement (
    id UUID PRIMARY KEY,
    student_id UUID,
    module_id UUID,
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    problems_attempted INTEGER,
    problems_correct INTEGER,
    accuracy_percentage DECIMAL(5,2),
    total_hints_used INTEGER,
    total_help_requests INTEGER,
    session_duration_seconds INTEGER
);

-- NEW: Distraction Analytics
CREATE TABLE distraction_analytics (
    id UUID PRIMARY KEY,
    student_id UUID,
    module_id UUID,
    date DATE,
    total_distraction_events INTEGER,
    avg_distraction_duration_seconds DECIMAL(8,2),
    distraction_types JSONB,  -- JSON histogram of event types
    correlation_with_performance DECIMAL(5,2),
    focus_improvement_trend DECIMAL(5,2)  -- Week-over-week
);
```

### 6.4 Analytics Reporting & Visualization

**Teacher Dashboard** (Section 6.1 - Design Considerations):
```
Teacher-Facing Analytics View:
├── Module Performance Overview
│   ├── Enrollment: X students
│   ├── Completion Rate: Y%
│   ├── Average Score: Z points
│   └── Time on Task: A minutes
│
├── Student Progress Grid
│   ├── Name | Progress % | Score | Time Spent | Status
│   ├── Click for individual student details
│   └── Export to CSV option
│
├── Learning Curves
│   ├── Concept mastery over time (line chart)
│   ├── Performance distribution (histogram)
│   ├── Time spent vs. accuracy (scatter)
│   └── Engagement trend (area chart)
│
└── Problem-Level Analytics
    ├── Most attempted problems
    ├── Highest error rate problems
    ├── Problems requiring most hints
    └── Problem difficulty ranking
```

**Admin Dashboard** (Section 8 - Success Metrics):
```
System-Wide Analytics:
├── Module Adoption
│   ├── Total modules created (chart over time)
│   ├── Active teachers (% of institution)
│   ├── Student engagement (avg completion %)
│   └── Module quality distribution
│
├── System Performance
│   ├── API latency (ms)
│   ├── Generation time per stage
│   ├── Success rate (%)
│   ├── Error patterns (top 10)
│   └── Cost per module ($)
│
└── Comparative Analysis
    ├── AI-generated vs. manually-created modules
    ├── Student outcome comparison
    ├── Teacher satisfaction (NPS)
    └── Feature usage patterns
```

---

## 7. DATABASE MODELS FOR LEARNING DATA

### 7.1 Core Data Model (from PRD Section 6.3)

#### 7.1.1 Main Entities

```sql
-- Teachers Table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('teacher', 'admin', 'system_maintainer')),
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    institution_id UUID,
    enrolled_modules UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules Table (Core)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) CHECK (subject IN ('mathematics')),
    grade_level VARCHAR(50),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    status VARCHAR(50) CHECK (status IN ('generating', 'active', 'archived')),
    
    -- AI-Generated Artifacts
    world_model JSONB,              -- Domain model/concepts
    generated_schema JSONB,         -- Database schema definition
    generated_ui JSONB,             -- UI component definitions
    generated_rules JSONB,          -- Business logic rules
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Generation Job Tracking
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    stage VARCHAR(50) CHECK (stage IN (
        'world_model',
        'rules',
        'data',
        'input_strategy',
        'ui',
        'deployment'
    )),
    status VARCHAR(50) CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'failed'
    )),
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rules Generated by Pipeline
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    name VARCHAR(255),
    type VARCHAR(50) CHECK (type IN (
        'validation',
        'calculation',
        'progression',
        'feedback'
    )),
    complexity_score INTEGER,
    is_ontology BOOLEAN DEFAULT FALSE,
    code TEXT,  -- Generated rule code
    ontology_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Dynamic Schema Metadata
CREATE TABLE dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (module_id) REFERENCES modules(id)
);
```

#### 7.1.2 Student Progress Tables (Dynamically Generated Per Module)

```sql
-- Example: Fraction Module Student Progress
CREATE TABLE fraction_student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2),
    
    current_difficulty_level INTEGER,
    mastery_score DECIMAL(3,2),
    
    total_problems_attempted INTEGER,
    total_problems_correct INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problem Submission Tracking
CREATE TABLE problem_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id VARCHAR(255) NOT NULL,
    
    submitted_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    feedback JSONB,
    
    time_spent_seconds INTEGER,
    attempt_number INTEGER,
    hints_used INTEGER,
    
    submitted_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Distraction Detection Database Schema

#### 7.2.1 Event Tracking Tables

```sql
-- Distraction Events (Fine-grained tracking)
CREATE TABLE distraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id VARCHAR(255),
    session_id UUID,
    
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'page_blur',          -- Browser window lost focus
        'tab_switch',         -- User switched browser tabs
        'off_screen',         -- Eye gaze tracking shows off-screen
        'rapid_scroll',       -- Rapid scrolling detected
        'inactivity',         -- No interaction detected
        'window_resize',      -- Browser window resized
        'multiple_tabs',      -- Multiple tabs detected
        'mouse_idle',         -- Mouse idle for duration
        'keyboard_idle',      -- Keyboard idle for duration
        'app_switch'          -- Switched to different application
    )),
    
    duration_seconds INTEGER,
    severity_level VARCHAR(50) CHECK (severity_level IN (
        'minor',      -- < 10 seconds
        'moderate',   -- 10-60 seconds
        'major'       -- > 60 seconds
    )),
    
    metadata JSONB,  -- Event-specific data
    timestamp TIMESTAMP DEFAULT NOW(),
    INDEX idx_student_timestamp (student_id, timestamp),
    INDEX idx_module_timestamp (module_id, timestamp)
);

-- Session-Level Distraction Summary
CREATE TABLE distraction_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    session_duration_seconds INTEGER,
    
    total_distraction_events INTEGER,
    total_distraction_duration_seconds INTEGER,
    distraction_percentage DECIMAL(5,2),
    
    distraction_types JSONB,  -- Count per event type
    focus_sessions INTEGER,   -- # of continuous focus periods
    
    flagged_for_intervention BOOLEAN DEFAULT FALSE,
    intervention_reason VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Per-Problem Distraction Summary
CREATE TABLE problem_distraction_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    problem_id VARCHAR(255) NOT NULL,
    module_id UUID NOT NULL,
    submission_id UUID UNIQUE REFERENCES problem_submissions(id),
    
    distraction_events_during_problem INTEGER,
    distraction_duration_seconds INTEGER,
    distraction_percentage_of_time DECIMAL(5,2),
    
    event_types_encountered JSONB,
    max_distraction_severity VARCHAR(50),
    
    -- Correlation with performance
    was_correct BOOLEAN,
    correlation_to_accuracy DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7.2.2 Distraction Analytics Tables

```sql
-- Daily Distraction Trends
CREATE TABLE daily_distraction_analytics (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    date DATE NOT NULL,
    
    sessions_count INTEGER,
    avg_distraction_events_per_session DECIMAL(8,2),
    avg_distraction_percentage DECIMAL(5,2),
    
    trend_week_over_week DECIMAL(5,2),  -- Improvement/decline
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_id, module_id, date)
);

-- Distraction Thresholds & Alerts
CREATE TABLE distraction_thresholds (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES modules(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    
    -- Configurable thresholds per teacher
    critical_distraction_percentage DECIMAL(5,2) DEFAULT 50.0,
    warning_distraction_percentage DECIMAL(5,2) DEFAULT 30.0,
    minor_distraction_percentage DECIMAL(5,2) DEFAULT 10.0,
    
    auto_pause_on_distraction BOOLEAN DEFAULT FALSE,
    send_alerts_to_student BOOLEAN DEFAULT TRUE,
    send_alerts_to_teacher BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Distraction Intervention Log
CREATE TABLE distraction_interventions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    distraction_session_id UUID REFERENCES distraction_sessions(id),
    
    intervention_type VARCHAR(50) CHECK (intervention_type IN (
        'auto_pause',         -- Paused problem automatically
        'student_alert',      -- Shown alert to student
        'teacher_notification', -- Notified teacher
        'suggested_break'     -- Suggested break recommendation
    )),
    
    intervention_message TEXT,
    student_response VARCHAR(50),  -- 'acknowledged', 'dismissed', 'requested_break'
    
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Distraction Marking (Core Feature)
CREATE TABLE distraction_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to the event being marked
    distraction_event_id UUID UNIQUE REFERENCES distraction_events(id),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id VARCHAR(255),
    
    -- Marking attributes
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by_user_id UUID,  -- Teacher or system admin
    marked_by_system BOOLEAN DEFAULT FALSE,
    
    -- Distraction characterization
    distraction_category VARCHAR(100),
    severity VARCHAR(50) CHECK (severity IN (
        'critical',
        'major',
        'moderate',
        'minor'
    )),
    
    -- Contextual notes
    context_notes TEXT,
    root_cause_analysis TEXT,
    
    -- Action taken
    action_taken VARCHAR(255),
    intervention_recommended BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_student_marked (student_id, marked_at),
    INDEX idx_problem_marked (problem_id, marked_at)
);
```

### 7.3 Data Relationships Diagram

```
Teachers (1)
    ↓
    └─→ Modules (N) ─→ GenerationJobs
                    ├─→ Rules
                    ├─→ DynamicSchemas
                    ├─→ StudentProgress (per module)
                    └─→ StudentEnrollments
                         ↓
                      Students (N)
                         ↓
                      ProblemSubmissions
                      ├─→ DistractionEvents
                      ├─→ DistractionSessions
                      ├─→ ProblemDistractionMetrics
                      └─→ DistractionMarks
```

---

## 8. INTEGRATION ARCHITECTURE FOR DISTRACTION DETECTION

### 8.1 Complete Pipeline Integration

The distraction detection feature spans ALL 6 pipeline phases:

#### Phase 1: World Model Reconstruction
```
Teacher Request Analysis:
When teacher describes module, the system should also ask:
- "How much focus do you expect for this problem?"
- "Should the system track and alert on distraction?"
- "What distraction thresholds should trigger intervention?"

These become part of the world_model JSONB:
{
  "concepts": [...],
  "relationships": [...],
  "distraction_tracking": {
    "enabled": true,
    "event_types": ["page_blur", "tab_switch", "inactivity"],
    "thresholds": {
      "critical": 50,
      "warning": 30,
      "minor": 10
    },
    "auto_pause_on_critical": false
  }
}
```

#### Phase 2: Rule Generation Engine
```
Generated Business Rules:
- Rule: IF distraction_percentage > threshold THEN notify_teacher
- Rule: IF consecutive_distractions > 3 THEN suggest_break
- Rule: IF distraction_during_difficult_problem THEN provide_help

These become entries in the rules table with:
- type: 'distraction_detection'
- complexity_score: calculated
- code: generated Python/JavaScript
```

#### Phase 3: Data Management
```
Auto-Generated Schema Includes:
- distraction_events table
- distraction_sessions table
- distraction_analytics tables
- distraction_marks table
- distraction_interventions table

Schema created via migration scripts automatically.
```

#### Phase 4: Input Strategy Design
```
Input Method Determination:
- Identify what distraction signals to collect
- Determine optimal detection methods per context
- Plan data flow for distraction events
- Map how distraction data affects problem progression

Output:
- Distraction event collection configuration
- Threshold settings
- Intervention strategies
- Analytics touchpoints
```

#### Phase 5: UI Auto-Generation
```
Generated Components Include:
- DistractionIndicator component (shows focus status)
- AlertModal for distraction warnings
- BreakRecommendation component
- DistrationDashboard for teachers
- DistractionMetricsDisplay

All with accessibility, responsive design, analytics tracking.
```

#### Phase 6: Integration & Deployment
```
API Endpoints Generated:
- POST /api/modules/{id}/distraction-events
- GET /api/modules/{id}/student/{sid}/distraction-summary
- POST /api/modules/{id}/distraction-marks
- GET /api/modules/{id}/distraction-analytics

Docker Container includes:
- Distraction event processing
- Real-time alert notifications
- Analytics aggregation jobs
```

### 8.2 Distraction Marking Feature

**Location in Architecture**: Core feature in database layer

#### 8.2.1 Distraction Marking Database Schema

**Purpose**: Allow teachers and administrators to manually mark/annotate distraction events for:
- Quality assurance of automated detection
- Building training data for ML models
- Contextual understanding of student behavior
- Intervention documentation

#### 8.2.2 Marking Workflow

```typescript
// Teacher marks a distraction event
interface MarkDistractionRequest {
  distraction_event_id: UUID;
  category: string;  // 'legitimate_break', 'off-task', 'technical_issue', etc.
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  context_notes: string;
  root_cause: string;
  action_taken: string;
  intervention_recommended: boolean;
  intervention_type?: string;
}

// Mark distraction API endpoint (auto-generated)
POST /api/modules/{module_id}/distraction-marks
{
  "distraction_event_id": "uuid-here",
  "category": "legitimate_break",
  "severity": "minor",
  "context_notes": "Student took break after 20 min of work",
  "root_cause": "Natural fatigue",
  "action_taken": "Student resumed after 5-minute break",
  "intervention_recommended": false
}

// Teacher reviews marked distractions
GET /api/modules/{module_id}/distraction-marks?status=pending_review
```

#### 8.2.3 Marking Dashboard Component

```typescript
interface DistractionMarkingDashboard {
  // Sections
  UnmarkedEvents: DistractionEvent[];  // Needs teacher review
  MarkedEvents: DistractionMark[];     // Already reviewed
  AnalyticsByCategory: {
    'legitimate_break': count;
    'off-task': count;
    'technical_issue': count;
    'unknown': count;
  };
  
  // Actions
  MarkAsLegitimate();
  MarkAsOffTask();
  MarkAsTechnicalIssue();
  AddContextNotes();
  RecommendIntervention();
  ExportForAnalysis();
  
  // Filtering
  FilterByStudent();
  FilterByProblem();
  FilterByDateRange();
  FilterByCategory();
  
  // Insights
  MostCommonDistractionType;
  TimeOfDayTrends;
  StudentVsClassComparison;
  InterventionEffectiveness;
}
```

---

## 9. MISSING FUNCTIONALITY TO BE DEVELOPED

Based on the PRD and distraction detection requirements, the following components need to be built:

### 9.1 Core Infrastructure

```
NOT YET IMPLEMENTED:
├── Frontend React Application
│   ├── Teacher Dashboard
│   ├── Student Module Interface
│   ├── Admin Dashboard
│   ├── Distraction Monitoring UI
│   └── Component Library
│
├── Backend API Gateway (Node.js/Express)
│   ├── Authentication/Authorization
│   ├── Module API endpoints
│   ├── Distraction event API
│   └── Analytics endpoints
│
├── AI Pipeline Orchestrator (Python/FastAPI)
│   ├── World Model Reconstruction
│   ├── Rule Generation Engine
│   ├── Data Manager Service
│   ├── Input Strategy Designer
│   ├── UI Generator
│   └── Deployment Service
│
├── Database
│   ├── PostgreSQL schema for core tables
│   ├── Distraction tracking tables
│   ├── Analytics aggregation
│   └── Migration system
│
└── DevOps
    ├── Docker configuration
    ├── CI/CD pipeline
    ├── Monitoring/Logging
    └── Deployment automation
```

### 9.2 Distraction-Specific Components

```
DISTRACTION DETECTION SYSTEM:
├── Client-Side Event Collection (Browser)
│   ├── Page blur detection
│   ├── Tab switch detection
│   ├── Mouse idle tracking
│   ├── Keyboard idle tracking
│   ├── Window resize detection
│   └── Inactivity timer
│
├── Backend Event Processing
│   ├── Event validation
│   ├── Persistence to database
│   ├── Real-time processing
│   ├── Alert triggering
│   └── Analytics aggregation
│
├── Teacher Marking Interface
│   ├── Event review dashboard
│   ├── Marking UI
│   ├── Category taxonomy
│   ├── Severity assessment
│   ├── Context note recording
│   └── Intervention logging
│
├── Student Intervention System
│   ├── Real-time alerts
│   ├── Break recommendations
│   ├── Refocus prompts
│   ├── Message queue
│   └── Notification service
│
└── Analytics & Reporting
    ├── Distraction trend analysis
    ├── Student pattern detection
    ├── Intervention effectiveness
    ├── Dashboard widgets
    └── Export functionality
```

---

## 10. ARCHITECTURAL INTEGRATION POINTS FOR DISTRACTION MARKING

### 10.1 Complete Integration Matrix

| System Component | Distraction Integration | Details |
|---|---|---|
| **Frontend** | Distraction Event Collection | React components emit events to backend |
| **Frontend** | Marking Dashboard | Teachers review and mark events |
| **Frontend** | Real-time Alerts | Show distraction indicators to students/teachers |
| **API Gateway** | Event Ingestion Endpoint | POST `/distraction-events` |
| **API Gateway** | Marking Endpoint | POST `/distraction-marks` |
| **API Gateway** | Analytics Endpoint | GET `/distraction-analytics` |
| **Database** | Event Storage | `distraction_events` table |
| **Database** | Marking Storage | `distraction_marks` table |
| **Database** | Analytics Aggregation | `daily_distraction_analytics` table |
| **Rule Engine** | Distraction Rules | Auto-generate from world model |
| **Input Strategy** | Collection Methods | Define which events to collect |
| **UI Generator** | Alert Components | Auto-generate based on rules |
| **Deployment** | Notification Service | Queue system for alerts |

### 10.2 Data Flow Diagram

```
Student Browser
    ↓
    └→ [Page Blur] → DistractionEvent {type: 'page_blur'}
    └→ [Tab Switch] → DistractionEvent {type: 'tab_switch'}
    └→ [Mouse Idle] → DistractionEvent {type: 'mouse_idle'}
    ↓
[Event Aggregation]
    ↓
[API Gateway]
    ├→ Persist to DB
    ├→ Check Rules Engine
    ├→ Trigger Alerts if needed
    ├→ Update Real-time Session
    └→ Queue for Analytics
    ↓
[Database]
    ├→ distraction_events table
    ├→ distraction_sessions table
    └→ distraction_marks table (when teacher marks)
    ↓
[Teacher Dashboard]
    ├→ View unmarked events
    ├→ Mark with category/severity
    ├→ Add context notes
    ├→ Recommend interventions
    └→ Export for analysis
    ↓
[Analytics Engine]
    ├→ Aggregate daily trends
    ├→ Calculate correlations
    ├→ Detect patterns
    └→ Update teacher reports
```

---

## 11. SUCCESS CRITERIA FOR DISTRACTION DETECTION FEATURE

### 11.1 Functional Requirements

```
FR-D.1: Event Collection
☐ Capture all distraction event types with >95% accuracy
☐ <100ms latency from event occurrence to backend receipt
☐ Graceful handling of offline periods (queue locally)

FR-D.2: Real-time Processing
☐ Process incoming events in <500ms
☐ Trigger alerts within 2 seconds of threshold breach
☐ Update dashboards with <2 second latency

FR-D.3: Teacher Marking
☐ Teachers mark events in <30 seconds per event
☐ Support bulk operations (mark 10+ events at once)
☐ Maintain audit trail of all marks

FR-D.4: Analytics
☐ Generate daily reports within 1 hour of midnight
☐ Correlate distraction with academic performance
☐ Identify students needing intervention

FR-D.5: Student Experience
☐ <5% false positive rate (unnecessary alerts)
☐ Alerts don't distract from learning (non-intrusive)
☐ Students can dismiss/snooze alerts
```

### 11.2 Performance Metrics

```
Latency:
- Event capture to storage: <100ms
- Alert notification: <2 seconds
- Dashboard update: <2 seconds

Throughput:
- Support 1000 concurrent students
- Process 10,000 events/minute
- Support 100 marks/minute from teachers

Reliability:
- 99.9% uptime
- Event loss rate: <0.1%
- Automatic recovery from failures
```

### 11.3 Accuracy Metrics

```
Detection Quality:
- False positive rate: <5%
- False negative rate: <10%
- Precision: >95%
- Recall: >90%

Teacher Marking Consistency:
- Inter-rater reliability: >0.85 (Cohen's kappa)
- Mark completion rate: >80%
- Convergence with automated marks: >75%
```

---

## 12. RECOMMENDATIONS FOR IMPLEMENTATION

### 12.1 Immediate Next Steps

1. **Extend the PRD** with distraction detection feature requirements
   - Add to Phase 4 (Input Strategy): Distraction signal collection
   - Add to Phase 5 (UI Generation): Distraction alert components
   - Add to Phase 2 (Rules): Distraction-triggered rules

2. **Design database schema in detail**
   - Finalize `distraction_events` table structure
   - Design `distraction_marks` annotation schema
   - Plan for time-series analytics tables

3. **Plan frontend components**
   - Event collection library (browser-agnostic)
   - Alert/notification components
   - Teacher marking dashboard
   - Student distraction indicator

4. **Implement distraction detection rules**
   - Page blur tracking
   - Tab switch detection
   - Inactivity timeouts
   - Mouse/keyboard idle detection

### 12.2 Phased Implementation Plan

```
Phase 1 (Weeks 1-2): Foundation
├── Design distraction database schema
├── Implement distraction event API
└── Build event collection JavaScript library

Phase 2 (Weeks 3-4): Core Detection
├── Implement event aggregation service
├── Create distraction session logic
├── Add threshold-based alerts

Phase 3 (Weeks 5-6): Teacher Interface
├── Build marking dashboard UI
├── Implement teacher mark API
├── Create marking categories taxonomy

Phase 4 (Weeks 7-8): Analytics
├── Implement analytics aggregation
├── Build trend analysis
├── Create teacher reports

Phase 5 (Weeks 9-10): Integration
├── Integrate with module generation pipeline
├── Add rules for distraction-triggered actions
├── Connect alerts to notification system

Phase 6 (Weeks 11-12): Testing & Optimization
├── End-to-end testing
├── Performance optimization
├── Accuracy validation
```

### 12.3 Risk Mitigation

| Risk | Mitigation |
|---|---|
| **Privacy concerns with tracking** | Get explicit consent, anonymize in reports, secure encryption |
| **High false positive rate** | Tuning algorithms with teacher feedback, baseline calibration |
| **Intervention effectiveness questionable** | A/B test interventions, measure with student surveys |
| **Performance impact on module** | Async event processing, batching, worker threads |
| **Teacher marking burden** | Batch operations, auto-categorization suggestions, shortcuts |

---

## 13. SUMMARY

### Current State
- **Codebase Status**: Greenfield - only PRD exists
- **Key Architecture**: 6-phase AI pipeline (World Model → Rules → Data → Input Strategy → UI → Deployment)
- **LMS Integration**: Planned via API Gateway, authentication, student database access
- **Analytics Foundation**: Behavior tracking framework exists, extensible for distraction
- **Database Model**: Well-defined core schema, ready for distraction tables

### Distraction Detection Integration
- **Not in PRD yet** - This is your new feature to design
- **Natural fit** at Phase 4 (Input Strategy) and Phase 5 (UI Generation)
- **Database tables needed**: `distraction_events`, `distraction_sessions`, `distraction_marks`, analytics tables
- **Frontend work**: Event collection library, alert components, marking dashboard
- **API work**: Event ingestion, marking endpoints, analytics endpoints

### Key Integration Points
1. **Database Layer**: Add distraction-specific tables
2. **Frontend Layer**: Event collection + UI components
3. **Backend API**: New endpoints for distraction management
4. **Rule Engine**: Auto-generate distraction-triggered rules
5. **Analytics**: Distraction as observable metric
6. **Intervention System**: Automatic + teacher-driven responses

### Deliverable Components
- Database schema with `distraction_events`, `distraction_marks` tables
- Browser-side event collection library
- Teacher marking dashboard
- Real-time alert system
- Analytics aggregation
- API endpoints (POST distraction-events, POST distraction-marks, GET analytics)

