# ALT42 Architecture Analysis - Executive Summary

## REPOSITORY STATUS

**Location**: `/home/user/alt42standalone_v1.0`
**Current State**: Greenfield project - only PRD document exists
**Git Status**: Single commit with comprehensive 1,262-line PRD
**Branch**: `claude/lms-distraction-detection-01HTiEBMWNkdN9UFQeN6MqVH`

---

## 1. LMS ARCHITECTURE OVERVIEW

### 1.1 Core LMS Entities
```
TEACHERS
├── id (UUID)
├── email (unique)
├── role (teacher/admin/system_maintainer)
└── preferences (JSONB)

STUDENTS  
├── id (UUID)
├── grade_level
└── enrolled_modules (array)

MODULES (Core Learning Unit)
├── id (UUID)
├── name, description
├── subject (mathematics)
├── teacher_id (foreign key)
├── status (generating/active/archived)
├── world_model (JSONB - AI-generated)
├── generated_schema (JSONB)
├── generated_ui (JSONB)
└── version (integer)
```

### 1.2 LMS Integration Points
1. **Authentication**: KAIST SSO (SAML/OAuth)
2. **Student Database**: Read-only roster access
3. **Grade System**: Optional progress export
4. **Module Embedding**: Future - embed in existing LMS
5. **Role-Based Access Control**: RBAC with 4 roles

### 1.3 Module Lifecycle
```
Teacher Request (Natural Language)
    ↓
[AI Pipeline - 6 Phases]
    ├─ Phase 1: World Model Reconstruction
    ├─ Phase 2: Rule Generation Engine
    ├─ Phase 3: Data Management
    ├─ Phase 4: Input Strategy Design
    ├─ Phase 5: UI Auto-Generation
    └─ Phase 6: Integration & Deployment
    ↓
Generated Module (Complete with DB, API, UI)
    ↓
Deploy to Students
    ↓
Student Learning Sessions
    ↓
Analytics & Reporting
```

---

## 2. DISTRACTION DETECTION ARCHITECTURE

### 2.1 Current State in PRD
**NOT YET IN PRD** - This is the new feature being designed!
- PRD mentions "clean, distraction-free design" (UI principle only)
- Branch name signals distraction detection is primary feature
- Behavior tracking foundation exists (click patterns, time spent, interaction sequences)

### 2.2 Integration Points - Where Distraction Fits

#### Phase 4: Input Strategy Design
**What data to collect?** → ADD: Distraction signals
- Page blur (window lost focus)
- Tab switching
- Mouse idle time
- Keyboard idle time
- Inactivity periods
- Off-screen gaze (future eye-tracking)

#### Phase 5: UI Auto-Generation
**How to display?** → ADD: Distraction UI Components
- FocusStatus indicator
- DistractionAlert modal
- BreakReminder prompt
- DistrationDashboard (teacher view)

#### Phase 2: Rule Generation
**What business logic?** → AUTO-GENERATE: Distraction rules
- IF distraction% > threshold THEN alert_teacher
- IF 3+ consecutive events THEN suggest_break
- IF distraction_during_difficult THEN provide_help

---

## 3. WEB APPLICATION STRUCTURE

### 3.1 Frontend Architecture (React 18+)

```
┌─────────────────────────────────────────────┐
│          REACT FRONTEND (Auto-Generated)    │
│                                             │
│  ┌──────────────┬──────────┬──────────┐    │
│  │   Teacher    │ Student  │  Admin   │    │
│  │  Dashboard   │   UI     │Dashboard │    │
│  └──────────────┴──────────┴──────────┘    │
│                    ↓                        │
│        Redux/Zustand State Management      │
│        (module, auth, analytics, session)  │
└─────────────────────────────────────────────┘
         ↓
         REST API / WebSocket
         ↓
┌─────────────────────────────────────────────┐
│    API Gateway (Node.js/Express)            │
│  ├─ Authentication & RBAC                   │
│  ├─ Rate Limiting                           │
│  ├─ Request Routing                         │
│  └─ Distraction Event Ingestion (NEW)       │
└─────────────────────────────────────────────┘
```

### 3.2 Frontend Component Hierarchy

**Teacher Components**:
- Dashboard (module list, quick actions, metrics)
- Module Request Wizard (5-step process)
- Module Management (metadata, analytics, access control)
- **Distraction Marking Dashboard (NEW)**

**Student Components**:
- Problem Container (statement + input form)
- Progress Bar & Navigation
- Hints & Help System
- **Distraction Indicators (NEW)**
- **Break Recommendations (NEW)**

**Admin Components**:
- Module Overview & Performance Grid
- Student Engagement Metrics
- Module Review & Approval Workflow
- System Health Monitoring
- **Distraction Analytics Dashboard (NEW)**

### 3.3 Frontend State Management

Key state slices:
```
{
  auth: { user, role, permissions },
  modules: { list, current, generating, progress },
  studentSession: { 
    moduleId, studentId, currentProblem,
    distractionEvents (NEW),    // Track distraction
    focusMetrics (NEW)          // Analytics
  },
  ui: { wizardStep, loading, notifications },
  analytics: { selectedModule, timeRange, chartData }
}
```

---

## 4. LEARNING ANALYTICS FRAMEWORK

### 4.1 Video Content
**Status**: OUT OF SCOPE for MVP
- No automatic video generation planned
- But schema supports future video metadata storage
- UI can embed video players as custom components

### 4.2 Analytics Data Collection

**Learning Events Tracked**:
- problem_viewed
- attempt_submitted
- hint_requested
- help_requested
- problem_completed
- session_started/ended

**Student Mastery Tracking**:
- Mastery score (0-1)
- Confidence score
- Time-to-mastery
- Concept progression

**Learning Engagement**:
- Completion rate (%)
- Accuracy percentage
- Hints/help usage
- Session duration

**Distraction Analytics (NEW)**:
- Total distraction events per session
- Distraction duration (seconds)
- Distraction percentage (%)
- Event type breakdown
- Correlation with performance
- Focus improvement trends

### 4.3 Teacher-Facing Analytics Dashboard

Shows per-module:
- Student engagement (completion %, scores)
- Problem-level analytics (error rates, hint usage)
- Learning curves (mastery over time)
- Individual student progress

Admin dashboard shows:
- Module adoption metrics
- System performance (latency, cost)
- Comparative analysis (AI vs. manual modules)
- Top error patterns

---

## 5. DATABASE MODELS FOR LEARNING DATA

### 5.1 Core Tables (From PRD)

```
MAIN TABLES:
├── teachers
├── students
├── modules (stores AI-generated artifacts)
├── generation_jobs (tracks pipeline execution)
├── rules (generated business logic)
├── dynamic_schemas (metadata about generated DB schemas)
│
└─ DYNAMICALLY GENERATED PER MODULE:
   ├── [module_name]_student_progress
   └── [module_name]_problem_submissions
```

### 5.2 Distraction-Specific Tables (NEW)

```
DISTRACTION EVENT TRACKING:
├── distraction_events
│   ├── event_type (page_blur, tab_switch, inactivity, etc.)
│   ├── severity_level (minor, moderate, major)
│   ├── duration_seconds
│   ├── metadata (JSONB)
│   └── timestamp
│
├── distraction_sessions (session-level summaries)
│   ├── total_events
│   ├── total_duration
│   ├── distraction_percentage
│   ├── flagged_for_intervention
│   └── focus_sessions_count
│
├── problem_distraction_metrics
│   ├── events_during_problem
│   ├── duration_seconds
│   ├── distraction_percentage_of_time
│   ├── was_correct (correlation with performance)
│   └── max_severity
│
└─ DISTRACTION MANAGEMENT:
   ├── distraction_marks (CORE FEATURE)
   │   ├── distraction_event_id (reference)
   │   ├── category (legitimate_break, off-task, technical_issue)
   │   ├── severity (critical, major, moderate, minor)
   │   ├── context_notes
   │   ├── root_cause_analysis
   │   ├── action_taken
   │   ├── intervention_recommended
   │   └── marked_by (teacher ID)
   │
   ├── distraction_thresholds (per module, configurable by teacher)
   │   ├── critical_percentage (e.g., 50%)
   │   ├── warning_percentage (e.g., 30%)
   │   ├── minor_percentage (e.g., 10%)
   │   ├── auto_pause_on_distraction
   │   └── alert_settings
   │
   ├── distraction_interventions (log of actions taken)
   │   ├── type (auto_pause, alert, notification, suggested_break)
   │   ├── message
   │   ├── student_response
   │   └── timestamp
   │
   └── daily_distraction_analytics (aggregated trends)
       ├── sessions_count
       ├── avg_events_per_session
       ├── avg_distraction_percentage
       └── week_over_week_trend
```

### 5.3 Table Relationships

```
teachers (1)
    └─→ modules (N) ─→ generation_jobs, rules, dynamic_schemas
            │
            └─→ distraction_thresholds (per module config)
                    │
                    └─→ students (N) via enrollments
                        │
                        └─→ problem_submissions
                            ├─→ distraction_events
                            ├─→ distraction_sessions
                            ├─→ problem_distraction_metrics
                            └─→ distraction_marks (teacher annotations)
```

---

## 6. COMPLETE DISTRACTION DETECTION INTEGRATION

### 6.1 Data Flow - Distraction Event Lifecycle

```
STUDENT USING MODULE:
1. Student works on problem in browser
2. [Event Occurs] Page blur, tab switch, mouse idle, etc.
3. JavaScript detects event
4. Send to: POST /api/modules/{id}/distraction-events
   
BACKEND PROCESSING:
5. API Gateway receives event
6. Validate & persist to distraction_events table
7. Check rules engine for thresholds
8. IF critical: queue notification, flag session
9. Update distraction_sessions summary
10. Emit WebSocket update to teacher dashboard

TEACHER VIEWING DASHBOARD:
11. Teacher sees unmarked distraction event
12. Reviews: student, problem, event type, time
13. Teacher marks event:
    POST /api/modules/{id}/distraction-marks
    {
      "distraction_event_id": "uuid",
      "category": "legitimate_break",
      "severity": "minor",
      "context_notes": "Student took break after 20 min",
      "action_taken": "Resumed after break"
    }

ANALYTICS:
14. Mark stored in distraction_marks table
15. Daily aggregation job creates daily_distraction_analytics
16. Teacher can see:
    - Trends over time
    - Most common distraction types
    - Correlation with performance
    - Pattern analysis per student
```

### 6.2 API Endpoints (Auto-Generated Per Module)

```
DISTRACTION MANAGEMENT:
POST   /api/modules/{module_id}/distraction-events
       Body: { event_type, duration, metadata, timestamp }
       
POST   /api/modules/{module_id}/distraction-marks
       Body: { event_id, category, severity, notes, action }
       
GET    /api/modules/{module_id}/distraction-marks
       Query: ?status=pending_review&student_id=uuid&date_range=1w
       
GET    /api/modules/{module_id}/student/{student_id}/distraction-summary
       Response: { sessions, total_events, trends, alerts }
       
GET    /api/modules/{module_id}/distraction-analytics
       Response: { daily_trends, correlations, patterns, recommendations }
       
PUT    /api/modules/{module_id}/distraction-thresholds
       Body: { critical_%, warning_%, auto_pause, alert_settings }
```

---

## 7. FRONTEND COMPONENT EXAMPLES

### 7.1 Student-Facing Components (React)

```typescript
// Distraction Indicator - Shows real-time focus status
<DistractionIndicator 
  focusScore={85}  // 0-100
  lastDistractionTime={2}  // minutes ago
  onBreakNeeded={handleBreakRequest}
/>

// Break Recommendation - Suggests break after extended focus
<BreakRecommendation 
  focusMinutes={45}
  threshold={40}
  onAcknowledge={handleAcknowledge}
/>

// Distraction Alert - Shows when threshold breached
<DistrationAlert 
  severity="moderate"  // critical, major, moderate, minor
  message="You seem focused! Keep going!"
  isDismissible={true}
/>
```

### 7.2 Teacher-Facing Components (React)

```typescript
// Distraction Marking Dashboard
<DistractionMarkingDashboard>
  <UnmarkedEventsGrid
    events={unmarkedEvents}
    onMark={handleMarkEvent}
    columns={[
      'timestamp', 'student', 'problem', 
      'event_type', 'duration'
    ]}
  />
  
  <MarkingPanel
    event={selectedEvent}
    onSubmitMark={handleSubmitMark}
    categoryOptions={[
      'legitimate_break',
      'off-task',
      'technical_issue',
      'unknown'
    ]}
    severityOptions={[
      'critical', 'major', 'moderate', 'minor'
    ]}
  />
  
  <AnalyticsWidget
    data={distractionAnalytics}
    metric="distraction_types"
    visualization="pie_chart"
  />
</DistractionMarkingDashboard>

// Distraction Trends Chart
<DistractionTrendsChart
  studentId={studentId}
  moduleId={moduleId}
  timeRange="7d"  // 7 days
  metrics={['events', 'duration', 'percentage']}
  onDateRangeChange={handleRangeChange}
/>
```

---

## 8. FRONTEND STATE FOR DISTRACTION TRACKING

```typescript
interface DistractionState {
  // Current session tracking
  session: {
    sessionId: UUID;
    startTime: timestamp;
    currentProblemId: UUID;
    focusScore: number;  // 0-100
    lastInteractionTime: timestamp;
  };
  
  // Events collected
  events: DistractionEvent[];  // Array of events in this session
  
  // Real-time metrics
  metrics: {
    totalEvents: number;
    totalDuration: number;
    distraction%: number;
    focusSessionsCount: number;
  };
  
  // UI state
  ui: {
    showAlert: boolean;
    alertSeverity: 'critical' | 'major' | 'moderate' | 'minor';
    showBreakPrompt: boolean;
    expandedMetrics: boolean;
  };
  
  // Teacher dashboard state
  marking: {
    selectedEventId: UUID | null;
    pendingMarks: number;
    filterCategory: string;
    sortBy: 'timestamp' | 'severity' | 'duration';
  };
}
```

---

## 9. MISSING COMPONENTS TO BUILD

### 9.1 Core Infrastructure (Not Yet Implemented)

```
FRONTEND:
- React application (auto-generated components)
- State management (Redux/Zustand)
- Component library
- Distraction event collection library

BACKEND:
- API Gateway (Node.js/Express)
- AI Pipeline Orchestrator (Python/FastAPI)
- Event processing & aggregation
- Notification service
- Analytics aggregation jobs

DATABASE:
- PostgreSQL schema (core + distraction tables)
- Migration system
- Index optimization

DEVOPS:
- Docker configuration
- CI/CD pipeline (GitHub Actions)
- Monitoring & logging (Prometheus, ELK)
- Deployment automation
```

### 9.2 Distraction-Specific Components

```
CLIENT-SIDE:
✓ Page blur detection (window focus events)
✓ Tab switch detection (visibility API)
✓ Mouse idle tracking (mousemove events)
✓ Keyboard idle tracking (keystroke detection)
✓ Inactivity timers
✓ Real-time event sending (WebSocket/HTTP)

SERVER-SIDE:
✓ Event validation & persistence
✓ Rule engine integration
✓ Alert/notification queuing
✓ Session aggregation
✓ Analytics aggregation jobs
✓ Intervention triggering

TEACHER TOOLS:
✓ Marking dashboard UI
✓ Event filter/search
✓ Category/severity classification
✓ Context note recording
✓ Bulk operations support
✓ Export to CSV/reports

ANALYTICS:
✓ Daily trend aggregation
✓ Student pattern detection
✓ Correlation analysis
✓ Intervention effectiveness tracking
✓ Dashboard widgets
✓ Report generation
```

---

## 10. KEY ARCHITECTURAL DECISIONS

### 10.1 Where Distraction Detection Lives

```
LAYER 1: Event Collection (Browser)
└─ React components detect events & send to API

LAYER 2: Event Ingestion (API Gateway)
└─ Validate, route, persist distraction_events

LAYER 3: Processing (Event Stream)
└─ Aggregate into sessions
└─ Check against rules engine
└─ Trigger interventions

LAYER 4: Storage (PostgreSQL)
└─ distraction_events (raw)
└─ distraction_sessions (aggregated)
└─ distraction_marks (teacher annotations)
└─ daily_distraction_analytics (trends)

LAYER 5: Display (Frontend)
└─ Student: Alerts & focus indicators
└─ Teacher: Marking dashboard & trends
└─ Admin: System-wide analytics
```

### 10.2 Auto-Generation in the Pipeline

When teacher creates module with distraction tracking:

```
PHASE 1 - World Model:
Teacher asks → AI extracts distraction tracking needs
Result: world_model includes distraction_tracking config

PHASE 2 - Rules:
AI generates rules like:
- IF distraction% > 50 THEN critical_alert
- IF 3+ consecutive THEN suggest_break

PHASE 3 - Data:
AI generates schema including:
- distraction_events table
- distraction_sessions table
- distraction_marks table

PHASE 4 - Input Strategy:
AI determines what events to collect:
- page_blur (high priority)
- inactivity (high priority)
- tab_switch (medium priority)

PHASE 5 - UI:
AI generates components:
- DistractionIndicator
- BreakRecommendation
- DistractionAlert

PHASE 6 - Deployment:
API endpoints generated:
- POST /distraction-events
- POST /distraction-marks
- GET /distraction-analytics
```

---

## 11. SUCCESS METRICS FOR DISTRACTION DETECTION

```
FUNCTIONAL:
- Capture events with >95% accuracy
- <100ms latency from event to backend
- <5% false positive rate
- 99.9% uptime

PERFORMANCE:
- Support 1,000 concurrent students
- Process 10,000 events/minute
- 100 teacher marks/minute
- <2 second dashboard update

QUALITY:
- Teacher marking consistency (>0.85 kappa)
- >80% mark completion rate
- Correlation analysis accurate (>0.75)

PEDAGOGICAL:
- Interventions improve focus (measured via A/B test)
- No learning outcome decrease
- >70% teacher adoption
- >80% student satisfaction
```

---

## 12. IMPLEMENTATION ROADMAP

### Phase 1 (Weeks 1-2): Foundation
- [ ] Design distraction database schema
- [ ] Implement distraction event API endpoint
- [ ] Build browser-side event collection library

### Phase 2 (Weeks 3-4): Core Detection
- [ ] Event aggregation service
- [ ] Distraction session logic
- [ ] Threshold-based alerts

### Phase 3 (Weeks 5-6): Teacher Interface
- [ ] Marking dashboard UI
- [ ] Mark API endpoint
- [ ] Category taxonomy definition

### Phase 4 (Weeks 7-8): Analytics
- [ ] Aggregation jobs (daily, weekly)
- [ ] Trend analysis & correlation
- [ ] Teacher reports

### Phase 5 (Weeks 9-10): Integration
- [ ] Pipeline integration (all 6 phases)
- [ ] Auto-generation of distraction components
- [ ] Notification system

### Phase 6 (Weeks 11-12): Testing & Launch
- [ ] E2E testing
- [ ] Performance optimization
- [ ] Beta release with teachers

---

## KEY FILES IN REPOSITORY

**Currently Available**:
- `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md` (1,262 lines)
  - Complete PRD document with all 6 phases
  - Technical architecture specs
  - Success metrics & KPIs
  - Example teacher request
  - Data model definitions

**Planned (To Be Created)**:
- Backend API (Node.js)
- Frontend (React)
- AI Pipeline (Python)
- Database migrations
- Component libraries
- Configuration files

---

## RECOMMENDATIONS

1. **Extend PRD** to include distraction detection feature requirements
2. **Design distraction schema** - finalize all table structures
3. **Build event collection** library as first component
4. **Implement marking dashboard** as teaching interface
5. **Create integration tests** for distraction workflow
6. **Plan A/B testing** for intervention effectiveness

