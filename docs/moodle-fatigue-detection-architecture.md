# Moodle LMS Integration & Fatigue Detection Architecture

## 1. Overview

This document outlines the architecture for integrating the AI Education System with Moodle 3.7 LMS and implementing learning fatigue detection with cognitive switching routines.

### Target Environment
- **Moodle Version**: 3.7
- **PHP Version**: 7.1.9
- **MySQL Version**: 5.7
- **Integration Method**: LTI 1.3 + Custom REST API

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Moodle LMS (3.7)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Course      │  │  Student     │  │  Activity    │         │
│  │  Management  │  │  Tracking    │  │  Logs        │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │ LTI 1.3 Launch + REST API
┌────────────────────────────▼─────────────────────────────────────┐
│              Moodle Integration Middleware (PHP)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - LTI Provider Authentication                            │   │
│  │ - Session Management & JWT Token Exchange               │   │
│  │ - Activity Log Streaming                                 │   │
│  │ - Student Progress Sync                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS/WebSocket
┌────────────────────────────▼─────────────────────────────────────┐
│              API Gateway (Node.js/Express)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - Request Routing & Load Balancing                       │   │
│  │ - JWT Authentication & Authorization                     │   │
│  │ - Rate Limiting (100 req/min per student)               │   │
│  │ - WebSocket Manager (Real-time fatigue alerts)         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────┬────────────────────────┬──────────────────┬──────────────┘
       │                        │                  │
       │                        │                  │
┌──────▼─────────┐    ┌────────▼─────────┐  ┌────▼──────────────┐
│   Fatigue      │    │  Cognitive       │  │   Moodle Data    │
│   Detection    │    │  Switching       │  │   Sync Service   │
│   Engine       │    │  Recommender     │  │   (Python)       │
│   (Python)     │    │  (Python)        │  │                  │
└────────────────┘    └──────────────────┘  └───────────────────┘
       │                        │                  │
       └────────────────────────┼──────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│              PostgreSQL Database                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - student_fatigue_metrics                                │   │
│  │ - learning_sessions                                      │   │
│  │ - cognitive_switching_routines                           │   │
│  │ - moodle_activity_logs                                   │   │
│  │ - fatigue_alerts                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## 3. Moodle Integration Components

### 3.1 Moodle Plugin (PHP)

**Plugin Type**: `mod_alt42fatigue` (Activity Module)

**Features**:
- LTI 1.3 consumer authentication
- Activity log capture and streaming
- Student session tracking
- Gradebook integration

**Installation Path**: `moodle/mod/alt42fatigue/`

### 3.2 LTI 1.3 Authentication Flow

```
1. Teacher adds Alt42 activity in Moodle course
2. Student clicks on Alt42 activity
3. Moodle sends LTI launch request (with JWT)
4. Alt42 validates JWT signature
5. Alt42 creates/updates student session
6. Alt42 returns embedded UI (iframe)
7. Continuous WebSocket connection for real-time monitoring
```

### 3.3 REST API Integration

**Base URL**: `https://alt42.kaist.ac.kr/api/v1/moodle`

**Endpoints**:

```
POST   /auth/lti-launch              # LTI 1.3 launch handler
GET    /auth/jwks                    # Public keys for JWT verification
POST   /sync/activity-logs           # Receive activity logs from Moodle
POST   /sync/student-progress        # Sync student progress
GET    /students/{id}/fatigue-status # Get current fatigue level
POST   /students/{id}/alert          # Send fatigue alert to Moodle
```

## 4. Fatigue Detection Engine

### 4.1 Multi-Factor Fatigue Analysis

The system analyzes **7 key metrics** to detect learning fatigue:

| Metric | Weight | Description | Threshold |
|--------|--------|-------------|-----------|
| **Session Duration** | 20% | Continuous learning time | >45 min = fatigue risk |
| **Interaction Frequency** | 15% | Clicks/actions per minute | <3/min = declining engagement |
| **Error Rate Trend** | 25% | Increasing incorrect answers | >30% increase = cognitive overload |
| **Response Time** | 15% | Time to answer questions | >2x baseline = fatigue |
| **Break Patterns** | 10% | Time since last break | >60 min = break needed |
| **Content Difficulty** | 10% | Bloom's taxonomy level | High cognitive load |
| **Time of Day** | 5% | Circadian rhythm factors | 14:00-16:00 = high fatigue risk |

### 4.2 Fatigue Score Calculation

```python
fatigue_score = (
    0.20 * session_duration_score +
    0.15 * interaction_frequency_score +
    0.25 * error_rate_score +
    0.15 * response_time_score +
    0.10 * break_pattern_score +
    0.10 * content_difficulty_score +
    0.05 * time_of_day_score
)

# Fatigue Levels
# 0-30:  Low fatigue (green)
# 31-60: Moderate fatigue (yellow) - Suggest break
# 61-80: High fatigue (orange) - Recommend cognitive switch
# 81-100: Critical fatigue (red) - Mandatory break
```

### 4.3 Real-time Monitoring

- **Sampling Rate**: Every 30 seconds
- **Data Sources**:
  - Mouse/keyboard activity (Moodle)
  - Quiz submission timestamps
  - Video playback progress
  - Forum participation
  - Assignment completion time

## 5. Cognitive Switching Routines

### 5.1 Routine Types

Based on fatigue level, the system recommends different routines:

#### **Level 1: Light Switch (30-60 fatigue score)**
**Duration**: 5-10 minutes
**Activities**:
- Physical stretching exercises (animated guide)
- Eye movement exercises (20-20-20 rule)
- Mindful breathing (guided 3-minute session)
- Quick puzzle games (different cognitive domain)

#### **Level 2: Medium Switch (61-80 fatigue score)**
**Duration**: 15-20 minutes
**Activities**:
- Short walk recommendation (outdoor if possible)
- Different subject material (verbal ↔ spatial switch)
- Creative exercise (drawing, music)
- Social interaction (discussion forum)
- Light snack break

#### **Level 3: Deep Switch (81-100 fatigue score)**
**Duration**: 30-60 minutes
**Activities**:
- Mandatory break with lockout
- Physical activity (exercise recommendations)
- Nap suggestion (10-20 min power nap)
- Completely different task
- Schedule continuation for next day

### 5.2 Switching Algorithm

```python
def recommend_routine(student_id, fatigue_score, current_subject):
    # Analyze learning history
    recent_activities = get_recent_activities(student_id, hours=2)
    subject_domain = classify_cognitive_domain(current_subject)

    # Domain switching matrix
    # Verbal/Linguistic → Spatial/Visual
    # Logical/Mathematical → Creative/Artistic
    # Analytical → Social/Collaborative

    if fatigue_score >= 81:
        return {
            "type": "deep_switch",
            "duration": 30,
            "activities": get_deep_switch_activities(),
            "lockout": True  # Prevent immediate return
        }
    elif fatigue_score >= 61:
        opposite_domain = get_opposite_domain(subject_domain)
        return {
            "type": "medium_switch",
            "duration": 15,
            "activities": get_domain_activities(opposite_domain),
            "suggestion": "Switch to different subject area"
        }
    else:
        return {
            "type": "light_switch",
            "duration": 5,
            "activities": ["stretching", "eye_rest", "breathing"],
            "optional": True
        }
```

### 5.3 Personalization

The system learns from student behavior:

- **Preferred break activities**: Track which routines students complete
- **Optimal break timing**: Identify individual fatigue patterns
- **Subject-specific thresholds**: Adjust for different course types
- **Historical effectiveness**: Measure post-break performance improvement

## 6. Database Schema

### 6.1 Core Tables

```sql
-- Student fatigue metrics
CREATE TABLE student_fatigue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Fatigue indicators
    session_duration_minutes INTEGER,
    interaction_count INTEGER,
    error_rate DECIMAL(5,2),
    avg_response_time_seconds INTEGER,
    minutes_since_last_break INTEGER,

    -- Calculated scores
    fatigue_score INTEGER CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
    fatigue_level VARCHAR(20), -- low, moderate, high, critical

    -- Context
    current_course_id VARCHAR(100),
    current_activity_type VARCHAR(50),
    content_difficulty VARCHAR(20), -- bloom's taxonomy
    time_of_day TIME,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

CREATE INDEX idx_fatigue_student_timestamp ON student_fatigue_metrics(student_id, timestamp DESC);
CREATE INDEX idx_fatigue_level ON student_fatigue_metrics(fatigue_level, timestamp DESC);

-- Learning sessions
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    moodle_session_id VARCHAR(100),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_duration_minutes INTEGER,

    course_id VARCHAR(100),
    course_name VARCHAR(255),

    -- Aggregated metrics
    total_interactions INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    break_count INTEGER DEFAULT 0,
    switching_routine_count INTEGER DEFAULT 0,

    -- Outcomes
    completion_status VARCHAR(20), -- active, completed, abandoned
    final_fatigue_score INTEGER,

    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Cognitive switching routines
CREATE TABLE cognitive_switching_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    routine_type VARCHAR(20), -- light, medium, deep
    duration_minutes INTEGER,

    -- Cognitive domain
    source_domain VARCHAR(50), -- verbal, logical, spatial, etc.
    target_domain VARCHAR(50), -- opposite domain

    -- Activities (JSONB array)
    activities JSONB NOT NULL,
    -- Example: [
    --   {"type": "stretching", "duration": 5, "instructions": "..."},
    --   {"type": "breathing", "duration": 3, "guide_url": "..."}
    -- ]

    -- Effectiveness tracking
    times_recommended INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    avg_effectiveness_score DECIMAL(3,2), -- post-break improvement

    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Student routine history
CREATE TABLE student_routine_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,
    routine_id UUID NOT NULL,

    recommended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Pre-break state
    pre_fatigue_score INTEGER,
    pre_error_rate DECIMAL(5,2),

    -- Post-break state (measured 10 min after return)
    post_fatigue_score INTEGER,
    post_error_rate DECIMAL(5,2),

    -- Student feedback
    was_helpful BOOLEAN,
    student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
    completion_status VARCHAR(20), -- completed, skipped, partial

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id),
    FOREIGN KEY (routine_id) REFERENCES cognitive_switching_routines(id)
);

-- Moodle activity logs (synced from Moodle)
CREATE TABLE moodle_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_log_id BIGINT UNIQUE,

    student_id UUID NOT NULL,
    session_id UUID,

    event_time TIMESTAMPTZ NOT NULL,
    event_name VARCHAR(100), -- quiz_attempt, forum_post, resource_view
    course_id VARCHAR(100),
    module_id VARCHAR(100),

    -- Event data
    action VARCHAR(50), -- view, submit, update, delete
    target VARCHAR(50), -- course, module, question

    -- Additional context (JSONB)
    event_data JSONB,
    -- Example: {
    --   "quiz_score": 85,
    --   "time_spent": 120,
    --   "attempt_number": 2
    -- }

    synced_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_moodle_logs_student ON moodle_activity_logs(student_id, event_time DESC);

-- Fatigue alerts
CREATE TABLE fatigue_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,

    alert_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fatigue_score INTEGER,
    alert_level VARCHAR(20), -- warning, urgent, critical

    message TEXT,
    recommended_routine_id UUID,

    -- Alert delivery
    sent_to_student BOOLEAN DEFAULT FALSE,
    sent_to_teacher BOOLEAN DEFAULT FALSE,
    sent_to_moodle BOOLEAN DEFAULT FALSE,

    -- Student response
    acknowledged_at TIMESTAMPTZ,
    action_taken VARCHAR(50), -- accepted_break, ignored, postponed

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id),
    FOREIGN KEY (recommended_routine_id) REFERENCES cognitive_switching_routines(id)
);
```

## 7. API Implementation

### 7.1 Backend Services

**Directory Structure**:
```
backend/
├── moodle_integration/
│   ├── lti_provider.py          # LTI 1.3 authentication
│   ├── moodle_sync.py           # Activity log sync
│   └── session_manager.py       # Session tracking
│
├── fatigue_detection/
│   ├── metrics_collector.py     # Collect fatigue indicators
│   ├── fatigue_calculator.py    # Calculate fatigue scores
│   ├── realtime_monitor.py      # WebSocket monitoring
│   └── alert_manager.py         # Send alerts
│
├── cognitive_switching/
│   ├── routine_recommender.py   # Recommend routines
│   ├── personalization.py       # Student-specific tuning
│   └── effectiveness_tracker.py # Measure outcomes
│
└── api/
    ├── moodle_routes.py         # Moodle API endpoints
    ├── fatigue_routes.py        # Fatigue monitoring API
    └── routine_routes.py        # Routine management API
```

### 7.2 Key API Endpoints

```python
# Moodle Integration Endpoints
POST   /api/v1/moodle/auth/lti-launch
GET    /api/v1/moodle/auth/jwks
POST   /api/v1/moodle/sync/activity-logs
POST   /api/v1/moodle/sync/student-progress

# Fatigue Detection Endpoints
GET    /api/v1/fatigue/students/{student_id}/current
GET    /api/v1/fatigue/students/{student_id}/history
POST   /api/v1/fatigue/metrics/record
GET    /api/v1/fatigue/sessions/{session_id}/metrics
POST   /api/v1/fatigue/alerts/send

# Cognitive Switching Endpoints
GET    /api/v1/routines/recommend/{student_id}
GET    /api/v1/routines/list
POST   /api/v1/routines/start
POST   /api/v1/routines/complete
GET    /api/v1/routines/effectiveness/{routine_id}

# WebSocket Endpoints
WS     /api/v1/ws/fatigue-monitor/{student_id}
```

## 8. Moodle Plugin Implementation

### 8.1 Plugin Files

```
moodle/mod/alt42fatigue/
├── version.php              # Plugin metadata
├── lib.php                  # Core functions
├── view.php                 # Main view page
├── settings.php             # Admin settings
├── db/
│   ├── install.xml          # Database schema
│   └── access.php           # Capabilities
├── classes/
│   ├── lti_consumer.php     # LTI client
│   ├── activity_tracker.php # Log activities
│   └── api_client.php       # REST API client
├── lang/
│   └── en/
│       └── alt42fatigue.php # English strings
└── amd/src/
    └── fatigue_monitor.js   # Frontend JS
```

### 8.2 Moodle Event Observers

Monitor these Moodle events:

```php
// events.php
$observers = [
    [
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => 'mod_alt42fatigue_observer::quiz_submitted',
    ],
    [
        'eventname' => '\mod_assign\event\submission_created',
        'callback' => 'mod_alt42fatigue_observer::assignment_submitted',
    ],
    [
        'eventname' => '\core\event\user_loggedin',
        'callback' => 'mod_alt42fatigue_observer::session_started',
    ],
    [
        'eventname' => '\core\event\user_loggedout',
        'callback' => 'mod_alt42fatigue_observer::session_ended',
    ],
];
```

## 9. Frontend Components

### 9.1 Fatigue Monitoring Widget

Embedded in Moodle course page (React component):

```javascript
// FatigueMonitorWidget.jsx
{
  currentFatigueLevel: "moderate",  // low, moderate, high, critical
  fatigueScore: 45,
  sessionDuration: "42 minutes",
  lastBreak: "25 minutes ago",
  suggestedAction: "Take a 10-minute break",
  routineRecommendation: {
    type: "light_switch",
    activities: ["Stretching", "Eye rest", "Breathing"],
    estimatedDuration: "8 minutes"
  }
}
```

### 9.2 Cognitive Switching Routine UI

Interactive guide for break activities:

- **Progress tracker**: Shows routine completion
- **Timer**: Countdown for each activity
- **Instructions**: Step-by-step guidance with animations
- **Feedback**: Rate effectiveness after completion

## 10. Security & Privacy

### 10.1 Data Protection

- **GDPR/PIPA Compliance**: Student data encrypted at rest
- **Minimal Data Collection**: Only essential metrics
- **Anonymization**: Personal identifiers hashed
- **Retention Policy**: Fatigue metrics deleted after 90 days
- **Consent Management**: Students opt-in to monitoring

### 10.2 Authentication Security

- **LTI 1.3**: OAuth 2.0 + JWT signatures
- **Token Expiration**: 1-hour access tokens, 7-day refresh tokens
- **HTTPS Only**: All API communication encrypted
- **CORS Policy**: Whitelist Moodle domains only

## 11. Performance Considerations

### 11.1 Scalability

- **Expected Load**: 10,000 concurrent students
- **Database**: PostgreSQL with read replicas
- **Caching**: Redis for session data and fatigue scores
- **WebSocket**: Socket.io with Redis adapter for clustering

### 11.2 Optimization

- **Batch Processing**: Activity logs synced every 60 seconds
- **Lazy Calculation**: Fatigue scores computed only when requested
- **Indexing**: All timestamp and student_id columns indexed
- **Connection Pooling**: 20-connection pool for PostgreSQL

## 12. Monitoring & Logging

### 12.1 Key Metrics

- **Fatigue Detection Accuracy**: Compared to student self-reports
- **Alert Response Rate**: % of students who take breaks
- **Routine Completion Rate**: % who complete suggested routines
- **Performance Improvement**: Pre/post-break comparison
- **System Latency**: API response times
- **WebSocket Uptime**: Real-time connection stability

### 12.2 Logging Strategy

- **Application Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Audit Trail**: All Moodle sync operations logged
- **Error Tracking**: Sentry for exception monitoring
- **Performance Metrics**: Prometheus + Grafana dashboards

## 13. Deployment

### 13.1 Infrastructure

- **Hosting**: AWS or on-premise KAIST servers
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional for scale)
- **CI/CD**: GitHub Actions

### 13.2 Rollout Plan

1. **Phase 1**: Single course pilot (100 students)
2. **Phase 2**: Department-wide (500 students)
3. **Phase 3**: University rollout (10,000+ students)

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Fatigue Detection Accuracy** | >80% | Self-report validation |
| **Alert Response Rate** | >60% | Students taking breaks |
| **Performance Improvement** | +15% | Post-break quiz scores |
| **System Uptime** | 99.5% | Continuous monitoring |
| **Student Satisfaction** | NPS >40 | Quarterly surveys |
| **Moodle Sync Latency** | <2 seconds | Average sync time |

## 15. Future Enhancements

- **AI-Powered Routine Generation**: Claude generates personalized break activities
- **Biometric Integration**: Smartwatch heart rate variability
- **Group Fatigue Analysis**: Class-wide patterns and interventions
- **Teacher Dashboard**: Real-time student fatigue monitoring
- **Predictive Alerts**: Anticipate fatigue before it occurs
- **Adaptive Difficulty**: Automatically adjust content based on fatigue
