# Codebase Exploration - Final Findings

**Date**: November 18, 2025  
**Repository**: /home/user/alt42standalone_v1.0  
**Status**: Comprehensive exploration complete

---

## QUICK OVERVIEW

This is a **greenfield project** for KAIST Touch Math Academy. The repository contains **only** a comprehensive PRD document (1,262 lines) - no production code yet exists. This is the ideal time to design and implement distraction detection functionality.

---

## WHAT WAS FOUND

### 1. LMS (Learning Management System) Related Code
**Status**: DESIGNED IN PRD, NOT YET IMPLEMENTED

**Key LMS Components Planned**:
- Teacher database (id, email, role, preferences)
- Student database (id, grade_level, enrolled_modules)
- Module management system (lifecycle: generating → active → archived)
- RBAC system (4 roles: teacher, admin, system_maintainer, student)
- Student enrollment tracking
- Module versioning and rollback
- Authentication integration (KAIST SSO)

**Integration Points**:
- KAIST SSO (SAML/OAuth) for authentication
- Student roster read-only access
- Optional grade system export
- Future: Embed modules in existing LMS via LTI

**Location in PRD**: Section 6.3 (Data Models), Section 7.6 (Integration Points)

---

### 2. Distraction Detection Functionality
**Status**: NOT IN PRD - THIS IS YOUR NEW FEATURE

**Current State**:
- The term "distraction" appears 1 time in the PRD (line 390: "clean, distraction-free design" - a UI principle)
- The branch name explicitly signals: `claude/lms-distraction-detection-01HTiEBMWNkdN9UFQeN6MqVH`
- A foundation exists for behavior tracking (time spent, click patterns, interaction sequences)

**Proposed Integration Points**:

1. **Phase 4 - Input Strategy Design**: Define what distraction signals to collect
   - Page blur (window lost focus)
   - Tab switching
   - Mouse idle / keyboard idle
   - Inactivity periods
   - Window resizing
   - Off-screen gaze (future)

2. **Phase 2 - Rule Generation**: Auto-generate distraction-triggered rules
   - IF distraction% > threshold THEN alert_teacher
   - IF consecutive_events > 3 THEN suggest_break
   - IF distraction_during_difficult THEN provide_help

3. **Phase 5 - UI Generation**: Auto-generate student & teacher components
   - DistractionIndicator (show focus status)
   - BreakRecommendation (prompt for breaks)
   - DistractionAlert (real-time notifications)
   - DistactionMarkingDashboard (teacher annotation tool)

4. **Phase 3 - Data Management**: Include distraction tables in auto-generated schemas
   - distraction_events (raw events)
   - distraction_sessions (aggregated per session)
   - distraction_marks (teacher annotations) **CORE FEATURE**
   - distraction_interventions (log of actions)
   - daily_distraction_analytics (trends)

---

### 3. Web Application Structure & Frontend Components
**Status**: DESIGNED, NOT IMPLEMENTED

**Frontend Stack**: React 18+ with TypeScript

**Component Hierarchy**:

```
TEACHER DASHBOARD
├── Module List (with quick actions)
├── Module Request Wizard (5-step process)
├── Module Management (metadata, analytics, access control)
└── Distraction Marking Dashboard (NEW - core feature)

STUDENT INTERFACE (Per Module)
├── Problem Container
├── Input Form (dynamically generated)
├── Progress Bar & Navigation
├── Hints & Help System
└── Distraction-related Components (NEW)
    ├── FocusStatus indicator
    ├── DistractionAlert
    └── BreakRecommendation

ADMIN DASHBOARD
├── Module Overview & Performance
├── Student Engagement Metrics
├── Module Review & Approval
├── System Health Monitoring
└── Distraction Analytics (NEW)
```

**State Management**: Redux Toolkit or Zustand with:
- auth (user, role, permissions)
- modules (list, current, generating)
- studentSession (distractionEvents, focusMetrics) **NEW**
- ui (wizard step, loading, notifications)
- analytics (data for charts)

**Key Frontend Patterns**:
- Auto-generated React components (output of Phase 5)
- Form components for problem input
- Progress tracking visualizations
- Real-time WebSocket updates for dashboards

---

### 4. Video & Learning Analytics Features
**Status**: PARTIAL - Videos OUT OF SCOPE, Analytics Framework Exists

**Video Content**: 
- Explicitly OUT OF SCOPE for MVP (PRD Section 5)
- Future enhancement
- But schema designed to support video metadata

**Learning Analytics Framework** (Exists in PRD):
- Problem-level tracking (attempted, correct, time spent)
- Student mastery scores (0-1 scale)
- Engagement metrics (completion %, accuracy, hints used)
- Learning events (problem_viewed, attempt_submitted, hint_requested, etc.)

**New Analytics** (Proposed for Distraction):
- Distraction events per session
- Distraction percentage of time
- Event type breakdown (page_blur, tab_switch, inactivity, etc.)
- Correlation with academic performance
- Focus improvement trends (week-over-week)
- Intervention effectiveness tracking

**Teacher Dashboards**:
- Per-module engagement (completion, scores, time-to-mastery)
- Problem-level analysis (error rates, hint usage)
- Student progress grid (sortable, searchable, exportable)
- Learning curves (mastery over time)

**Admin Dashboards**:
- System-wide adoption metrics
- Performance metrics (latency, cost per module, success rate)
- Comparative analysis (AI-generated vs. manually-created)
- Top error patterns

---

### 5. Database Models for Learning Data
**Status**: CORE SCHEMA DESIGNED, DISTRACTION TABLES NEEDED

**Core Tables** (From PRD Section 6.3):
```
PLATFORM TABLES:
- teachers (email unique, role, preferences)
- students (grade_level, enrolled_modules)
- modules (AI-generated: world_model, schema, ui, rules as JSONB)
- generation_jobs (tracks each pipeline execution)
- rules (auto-generated business logic)
- dynamic_schemas (metadata about generated DB schemas)

DYNAMICALLY GENERATED PER MODULE:
- [module_name]_student_progress
- [module_name]_problem_submissions
- [module_name]_[custom_tables] (e.g., fraction_problems)
```

**Distraction-Specific Tables** (Proposed - NOT YET IN CODE):

```
DISTRACTION EVENTS (fine-grained):
CREATE TABLE distraction_events (
  id UUID PRIMARY KEY,
  student_id, module_id, problem_id, session_id,
  event_type (page_blur, tab_switch, inactivity, etc.),
  severity_level (minor, moderate, major),
  duration_seconds,
  metadata JSONB,
  timestamp
);

DISTRACTION SESSIONS (aggregated):
CREATE TABLE distraction_sessions (
  id UUID PRIMARY KEY,
  student_id, module_id,
  total_events, total_duration, distraction_%,
  distraction_types JSONB,
  focus_sessions_count,
  flagged_for_intervention
);

DISTRACTION MARKS (teacher annotations - CORE FEATURE):
CREATE TABLE distraction_marks (
  id UUID PRIMARY KEY,
  distraction_event_id (unique reference),
  student_id, module_id, problem_id,
  marked_at, marked_by_user_id,
  category (legitimate_break, off-task, technical_issue),
  severity (critical, major, moderate, minor),
  context_notes, root_cause_analysis,
  action_taken, intervention_recommended
);

DISTRACTION ANALYTICS (daily trends):
CREATE TABLE daily_distraction_analytics (
  id UUID PRIMARY KEY,
  student_id, module_id, date,
  sessions_count,
  avg_events_per_session,
  avg_distraction_%,
  trend_week_over_week
);

DISTRACTION INTERVENTIONS (action log):
CREATE TABLE distraction_interventions (
  id UUID PRIMARY KEY,
  student_id, module_id,
  intervention_type (auto_pause, alert, notification, suggested_break),
  message, student_response, timestamp
);

DISTRACTION THRESHOLDS (teacher-configurable):
CREATE TABLE distraction_thresholds (
  id UUID PRIMARY KEY,
  module_id, teacher_id,
  critical_percentage (e.g., 50%),
  warning_percentage (e.g., 30%),
  minor_percentage (e.g., 10%),
  auto_pause_on_distraction,
  alert_settings
);
```

**Relationships**:
```
teachers (1) → modules (N) → students (N via enrollment)
                              → distraction_thresholds
                              → problem_submissions
                                  → distraction_events
                                  → distraction_sessions
                                  → distraction_marks
                                  → distraction_interventions
```

---

## INTEGRATION ARCHITECTURE

### Complete Data Flow - Distraction Event Lifecycle

```
STUDENT LEARNING:
1. Student works on problem in browser
2. Event occurs (page blur, tab switch, idle, etc.)
3. JavaScript detects and sends to: POST /api/modules/{id}/distraction-events

BACKEND PROCESSING:
4. API Gateway validates and persists to distraction_events table
5. Rules engine checks thresholds
6. If critical: queue notification, flag session
7. Update distraction_sessions with aggregates
8. WebSocket push to teacher dashboard

TEACHER INTERFACE:
9. Teacher sees unmarked distraction event
10. Reviews context (student, problem, event type, time)
11. Teacher marks event: POST /api/modules/{id}/distraction-marks
    {
      "distraction_event_id": "uuid",
      "category": "legitimate_break",
      "severity": "minor",
      "context_notes": "...",
      "action_taken": "..."
    }

ANALYTICS:
12. Mark stored in distraction_marks table
13. Daily job aggregates into daily_distraction_analytics
14. Teacher dashboard shows trends, patterns, correlations
```

### API Endpoints (Auto-Generated Per Module)

```
POST   /api/modules/{module_id}/distraction-events
       → Ingest raw distraction events

POST   /api/modules/{module_id}/distraction-marks
       → Teacher marks/annotates distraction events

GET    /api/modules/{module_id}/distraction-marks
       → Retrieve marks (filter by status, student, date)

GET    /api/modules/{module_id}/student/{sid}/distraction-summary
       → Get student's distraction profile

GET    /api/modules/{module_id}/distraction-analytics
       → Get analytics (trends, correlations, patterns)

PUT    /api/modules/{module_id}/distraction-thresholds
       → Configure teacher's thresholds
```

---

## MISSING COMPONENTS (Not Yet Implemented)

### Backend Services
- [ ] API Gateway (Node.js/Express)
- [ ] AI Pipeline Orchestrator (Python/FastAPI)
- [ ] Event processing & aggregation service
- [ ] Rule engine
- [ ] Notification service
- [ ] Analytics aggregation jobs

### Frontend
- [ ] React application boilerplate
- [ ] Component library
- [ ] State management (Redux/Zustand)
- [ ] Distraction event collection library
- [ ] Dashboard components
- [ ] Marking interface

### Database & Infrastructure
- [ ] PostgreSQL schema (core tables)
- [ ] Distraction tables (events, sessions, marks, analytics)
- [ ] Database migrations system
- [ ] Indexing strategy
- [ ] Backup/recovery procedures

### Distraction-Specific Features
- [ ] Page blur event detection
- [ ] Tab switch detection
- [ ] Mouse/keyboard idle tracking
- [ ] Inactivity timer service
- [ ] Event aggregation algorithm
- [ ] Distraction marking UI
- [ ] Analytics calculation engine
- [ ] Teacher dashboard
- [ ] Student alert system

---

## RECOMMENDED NEXT STEPS

### 1. Extend PRD (High Priority)
Add distraction detection feature requirements to the existing PRD:
- Add to Phase 4 (Input Strategy): Distraction signal types and collection methods
- Add to Phase 2 (Rules): Distraction-triggered rule generation
- Add to Phase 5 (UI): Distraction indicator and alert components
- Add functional requirements (FR-D.1 through FR-D.5) for distraction system

### 2. Design Database Schema (High Priority)
Finalize SQL schema for:
- distraction_events (raw event storage)
- distraction_sessions (aggregated summaries)
- distraction_marks (teacher annotations) **Most important**
- distraction_analytics (daily/weekly trends)
- distraction_thresholds (teacher configuration)
- distraction_interventions (action logs)

### 3. Build Event Collection Library (High Priority)
Create a JavaScript/TypeScript library for browser-side detection:
```
detectPageBlur()      // window.blur/focus events
detectTabSwitch()     // visibility API
trackMouseIdle()      // mousemove timer
trackKeyboardIdle()   // keystroke timer
trackInactivity()     // combined idle
sendEvent(event)      // POST to API
```

### 4. Implement Teacher Marking Dashboard (Medium Priority)
React component for teachers to:
- View unmarked distraction events
- Filter by student, problem, date, event type
- Mark with category, severity, context notes
- Add root cause analysis
- Recommend interventions
- Bulk operations support

### 5. Create Integration Tests (Medium Priority)
Test the complete flow:
- Event emission → API ingestion → DB persistence
- Teacher marking → Analytics aggregation → Dashboard display
- Alert triggering → Student notification
- Correlation analysis with academic performance

### 6. Plan Analytics Pipeline (Lower Priority)
Design daily/weekly jobs for:
- Aggregating distraction_sessions from distraction_events
- Calculating daily_distraction_analytics
- Correlation analysis (distraction vs. performance)
- Trend detection (week-over-week improvements)
- Pattern detection (distraction by time-of-day, student, etc.)

---

## KEY INSIGHTS

1. **Perfect Timing**: This is a greenfield project. Distraction detection can be designed in from the start rather than retrofitted.

2. **Pipeline Integration**: Distraction feature spans all 6 pipeline phases - this is a full-stack feature.

3. **Auto-Generation Opportunity**: Once designed, distraction components can be auto-generated like other system components.

4. **Teacher-Centric Design**: The marking dashboard is the critical UI - teachers need to validate automatic detection.

5. **Foundation Exists**: Behavior tracking framework already designed, distraction is a natural extension.

6. **Analytics-Rich**: Distraction data can be correlated with learning outcomes to measure intervention effectiveness.

---

## DOCUMENTATION

Two detailed analysis documents have been created and saved to the repository:

1. **ARCHITECTURE_ANALYSIS.md** (20KB)
   - Executive summary
   - LMS architecture overview
   - Distraction detection integration points
   - Frontend component hierarchy
   - Database models (core + distraction)
   - Complete distraction event data flow
   - API endpoints design
   - Sample React components
   - Implementation roadmap

2. **DETAILED_ANALYSIS.md** (45KB)
   - Extended version of architecture analysis
   - Full database schemas with SQL
   - Complete component specifications
   - State management structure
   - Error handling strategies
   - Security considerations
   - Performance metrics
   - Success criteria

Both files are located in `/home/user/alt42standalone_v1.0/`

---

## SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| **LMS Integration** | Designed in PRD | Teachers, students, modules, RBAC, authentication planned |
| **Distraction Detection** | NOT IN PRD (NEW FEATURE) | Needs design - spans all 6 pipeline phases |
| **Frontend** | Designed in PRD | React 18+, Redux/Zustand, auto-generated components |
| **Video Analytics** | OUT OF SCOPE | Videos are out of scope for MVP |
| **Learning Analytics** | Framework designed | Event tracking, mastery, engagement metrics |
| **Database** | Core schema designed | 6 main tables + dynamically generated per module |
| **Distraction Tables** | Proposed design | Need implementation: events, sessions, marks, analytics |
| **API Endpoints** | Blueprint designed | 6-phase pipeline generates modules + APIs |
| **Code Examples** | Provided | Sample React components, SQL schemas included |

---

**Exploration completed**: November 18, 2025  
**Repository status**: Ready for implementation  
**Recommended action**: Begin with database schema design and PRD extension
