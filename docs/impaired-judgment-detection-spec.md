# Moodle LMS Impaired Judgment Detection System
## Technical Specification Document

**Version**: 1.0.0
**Created**: 2025-11-18
**Status**: Implementation Ready

---

## 1. Executive Summary

This system integrates with **Moodle 3.7 LMS** to automatically detect when a student's judgment becomes impaired during learning activities. The system monitors behavioral patterns, performance metrics, and interaction data to identify signs of cognitive fatigue, confusion, or declining decision-making ability.

### Target LMS Environment
- **Moodle Version**: 3.7
- **Database**: MySQL 5.7
- **Server**: PHP 7.1.9
- **Integration Type**: External analytics service with database access

---

## 2. Problem Statement

Students experiencing impaired judgment due to:
- **Cognitive fatigue**: Extended study sessions without breaks
- **Confusion**: Difficulty understanding concepts
- **Frustration**: Repeated failures on exercises
- **Distraction**: Loss of focus and attention

These conditions lead to:
- Poor learning outcomes
- Decreased retention
- Negative emotional association with learning
- Wasted study time

### Solution

Real-time detection system that:
1. **Monitors** student behavior patterns across Moodle activities
2. **Analyzes** performance degradation indicators
3. **Detects** impairment onset using multi-factor algorithms
4. **Alerts** teachers and suggests interventions
5. **Recommends** breaks or alternative learning approaches

---

## 3. Detection Indicators & Algorithms

### 3.1 Primary Indicators

#### A. Performance Degradation
```python
indicators = {
    "accuracy_decline": {
        "metric": "Correct answers / Total attempts",
        "baseline": "Rolling 10-question average",
        "threshold": "20% decline from baseline",
        "weight": 0.30
    },
    "response_time_increase": {
        "metric": "Time to answer (seconds)",
        "baseline": "Student's average for question type",
        "threshold": "50% increase or >2 SD above mean",
        "weight": 0.25
    },
    "error_pattern_change": {
        "metric": "Type of errors (careless vs. conceptual)",
        "threshold": "Increase in careless errors by 30%",
        "weight": 0.20
    }
}
```

#### B. Behavioral Patterns
```python
behavioral_indicators = {
    "rapid_clicking": {
        "metric": "Click rate without reading",
        "threshold": "Answer submitted <5 sec after question display",
        "weight": 0.15
    },
    "hesitation_increase": {
        "metric": "Time hovering before action",
        "threshold": "3x increase in pre-click hesitation",
        "weight": 0.10
    },
    "navigation_confusion": {
        "metric": "Back/forward clicks, page reloads",
        "threshold": ">5 navigation changes per question",
        "weight": 0.10
    },
    "session_duration": {
        "metric": "Continuous activity time",
        "threshold": ">90 minutes without 5+ min break",
        "weight": 0.15
    }
}
```

### 3.2 Impairment Score Calculation

```python
def calculate_impairment_score(student_data, timeframe='last_30min'):
    """
    Calculate impairment probability score (0-100)

    Returns:
        score: 0-100 (0=optimal, 100=severely impaired)
        confidence: 0-1 (confidence in assessment)
        triggers: List of contributing factors
    """

    weighted_score = 0
    triggers = []

    # Performance degradation (30% weight)
    accuracy_decline = detect_accuracy_decline(student_data)
    if accuracy_decline > 0.20:
        weighted_score += 30 * (accuracy_decline / 0.40)  # Cap at 40% decline
        triggers.append(f"Accuracy declined by {accuracy_decline*100:.1f}%")

    # Response time increase (25% weight)
    response_time_factor = detect_response_time_change(student_data)
    if response_time_factor > 1.50:
        weighted_score += 25 * min((response_time_factor - 1.0) / 2.0, 1.0)
        triggers.append(f"Response time {response_time_factor:.1f}x slower")

    # Careless errors (20% weight)
    careless_error_rate = detect_error_pattern(student_data)
    if careless_error_rate > 0.30:
        weighted_score += 20 * (careless_error_rate / 0.60)
        triggers.append(f"Careless errors: {careless_error_rate*100:.1f}%")

    # Behavioral indicators (25% combined weight)
    behavioral_score = analyze_behavioral_patterns(student_data)
    weighted_score += behavioral_score * 25

    # Confidence based on data quantity
    data_points = count_interactions(student_data, timeframe)
    confidence = min(data_points / 10, 1.0)  # Need 10+ interactions for full confidence

    return {
        'score': min(weighted_score, 100),
        'confidence': confidence,
        'triggers': triggers,
        'recommendation': get_recommendation(weighted_score)
    }
```

### 3.3 Alert Thresholds

| Impairment Score | Status | Action |
|------------------|--------|--------|
| 0-30 | **Optimal** | No action needed |
| 31-50 | **Early Warning** | Monitor closely, suggest break |
| 51-70 | **Moderate Impairment** | Recommend break, notify teacher |
| 71-100 | **Severe Impairment** | Force break, alert teacher immediately |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS (PHP 7.1.9)              │
│  Student Activities | Quiz Attempts | Forum Posts           │
│                      MySQL 5.7 Database                      │
└────────────┬────────────────────────────────────────────────┘
             │ (Read-only DB access)
             │
┌────────────▼─────────────────────────────────────────────────┐
│         Impairment Detection Service (Python/Node.js)       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Collector  →  Behavior Analyzer  →  Detector  │  │
│  │       ↓                   ↓                   ↓      │  │
│  │  Alert Engine  ←  ML Model (Optional)  ←  Logger    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬────────────────────┬──────────┘
       │                      │                    │
┌──────▼────────┐  ┌─────────▼────────┐  ┌───────▼──────────┐
│  PostgreSQL   │  │  Redis Cache     │  │  Alert Queue     │
│  (Analytics)  │  │  (Real-time)     │  │  (RabbitMQ)      │
└───────────────┘  └──────────────────┘  └──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │  Teacher Portal  │
                   │   (React App)    │
                   └──────────────────┘
```

### 4.2 Components

#### A. Moodle Data Collector
**Technology**: Python 3.11+ with SQLAlchemy
**Function**: Extract student activity data from Moodle database

```python
# Moodle tables to monitor
moodle_tables = {
    'mdl_quiz_attempts': 'Quiz attempts and scores',
    'mdl_question_attempts': 'Individual question responses',
    'mdl_logstore_standard_log': 'All user activities',
    'mdl_grade_grades': 'Grading history',
    'mdl_user': 'User information',
    'mdl_course': 'Course information'
}
```

#### B. Behavior Analyzer
**Technology**: Python with pandas, numpy
**Function**: Process raw data into behavioral metrics

Features:
- Session reconstruction (group activities by time windows)
- Performance trend analysis (moving averages, regression)
- Error pattern classification (careless vs. conceptual)
- Interaction sequence analysis

#### C. Impairment Detector
**Technology**: Python with scikit-learn (optional ML)
**Function**: Calculate impairment scores and trigger alerts

Methods:
- **Rule-based**: Threshold-based detection (MVP)
- **ML-enhanced**: Random Forest or XGBoost classifier (Phase 2)

#### D. Alert Engine
**Technology**: Node.js with Express + WebSocket
**Function**: Real-time alerting to teachers

Alert channels:
- Teacher dashboard (real-time)
- Email notifications (configurable)
- Webhook to LMS (future)

---

## 5. Database Schema

### 5.1 Analytics Database (PostgreSQL)

```sql
-- Student behavior sessions
CREATE TABLE behavior_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER NOT NULL,
    moodle_course_id INTEGER NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    total_interactions INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual interactions (quiz answers, clicks, etc.)
CREATE TABLE student_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES behavior_sessions(id),
    moodle_user_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- quiz_answer, page_view, click, etc.
    moodle_context_id INTEGER, -- quiz_id, question_id, etc.
    response_time_ms INTEGER,
    is_correct BOOLEAN,
    metadata JSONB, -- Flexible storage for interaction details
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Impairment assessments
CREATE TABLE impairment_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES behavior_sessions(id),
    moodle_user_id INTEGER NOT NULL,
    impairment_score DECIMAL(5,2) NOT NULL CHECK (impairment_score BETWEEN 0 AND 100),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    status VARCHAR(20) NOT NULL, -- optimal, early_warning, moderate, severe
    triggers JSONB, -- Array of trigger reasons
    recommendation TEXT,
    assessed_at TIMESTAMP DEFAULT NOW()
);

-- Alerts sent to teachers
CREATE TABLE impairment_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES impairment_assessments(id),
    moodle_user_id INTEGER NOT NULL,
    moodle_teacher_id INTEGER NOT NULL,
    alert_level VARCHAR(20) NOT NULL, -- warning, critical
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Performance baselines (per student, per activity type)
CREATE TABLE student_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- quiz, forum, assignment, etc.
    avg_accuracy DECIMAL(5,4),
    avg_response_time_ms INTEGER,
    std_response_time_ms INTEGER,
    sample_size INTEGER,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(moodle_user_id, activity_type)
);

-- Indexes for performance
CREATE INDEX idx_behavior_sessions_user ON behavior_sessions(moodle_user_id);
CREATE INDEX idx_behavior_sessions_active ON behavior_sessions(is_active);
CREATE INDEX idx_interactions_session ON student_interactions(session_id);
CREATE INDEX idx_interactions_user ON student_interactions(moodle_user_id);
CREATE INDEX idx_interactions_timestamp ON student_interactions(timestamp);
CREATE INDEX idx_assessments_session ON impairment_assessments(session_id);
CREATE INDEX idx_alerts_user ON impairment_alerts(moodle_user_id);
CREATE INDEX idx_alerts_teacher ON impairment_alerts(moodle_teacher_id);
```

### 5.2 Moodle Database Queries (Read-Only)

```sql
-- Get recent quiz attempts with response times
SELECT
    qa.id AS attempt_id,
    qa.userid,
    qa.quiz AS quiz_id,
    qa.timestart,
    qa.timefinish,
    qa.sumgrades,
    que.questionid,
    que.responsesummary,
    que.rightanswer,
    que.maxmark,
    que.minfraction,
    UNIX_TIMESTAMP(que.timemodified) - UNIX_TIMESTAMP(que.timecreated) AS response_time_sec
FROM mdl_quiz_attempts qa
JOIN mdl_question_attempts que ON que.questionusageid = qa.uniqueid
WHERE qa.userid = :user_id
  AND qa.timestart > :start_time
ORDER BY qa.timestart DESC;

-- Get user activity log
SELECT
    id,
    userid,
    courseid,
    eventname,
    component,
    action,
    target,
    objectid,
    timecreated
FROM mdl_logstore_standard_log
WHERE userid = :user_id
  AND timecreated > :start_timestamp
ORDER BY timecreated ASC;

-- Get student grade history for trend analysis
SELECT
    gg.id,
    gg.userid,
    gg.itemid,
    gi.itemname,
    gg.finalgrade,
    gg.rawgrademax,
    gg.timemodified
FROM mdl_grade_grades gg
JOIN mdl_grade_items gi ON gi.id = gg.itemid
WHERE gg.userid = :user_id
  AND gg.timemodified > :start_time
ORDER BY gg.timemodified ASC;
```

---

## 6. API Design

### 6.1 RESTful Endpoints

```typescript
// Base URL: /api/v1

/**
 * Get current impairment status for a student
 */
GET /students/:moodle_user_id/impairment/current
Response: {
  student_id: number,
  session_id: string,
  impairment_score: number,
  status: 'optimal' | 'early_warning' | 'moderate' | 'severe',
  confidence: number,
  triggers: string[],
  recommendation: string,
  assessed_at: string (ISO 8601)
}

/**
 * Get impairment history for a student
 */
GET /students/:moodle_user_id/impairment/history?from=<timestamp>&to=<timestamp>
Response: {
  student_id: number,
  assessments: Array<ImpairmentAssessment>,
  total_sessions: number,
  avg_impairment_score: number
}

/**
 * Get all students with current impairment warnings (for teacher dashboard)
 */
GET /teachers/:moodle_teacher_id/alerts?status=<filter>&course_id=<course_id>
Response: {
  alerts: Array<{
    alert_id: string,
    student_id: number,
    student_name: string,
    course_id: number,
    course_name: string,
    impairment_score: number,
    status: string,
    triggers: string[],
    assessed_at: string
  }>,
  total_count: number,
  unacknowledged_count: number
}

/**
 * Acknowledge an alert (teacher has seen it)
 */
POST /alerts/:alert_id/acknowledge
Request: {
  teacher_id: number,
  notes?: string
}
Response: {
  success: boolean,
  acknowledged_at: string
}

/**
 * Get real-time monitoring data (WebSocket)
 */
WebSocket /ws/monitor?teacher_id=<id>&course_id=<id>
Events:
  - impairment_detected: New impairment detected
  - impairment_resolved: Student recovered
  - session_started: Student started session
  - session_ended: Student ended session
```

### 6.2 Internal Service APIs

```python
# Data Collector Service
class MoodleDataCollector:
    def fetch_recent_interactions(user_id: int, since: datetime) -> List[Interaction]
    def fetch_quiz_attempts(user_id: int, since: datetime) -> List[QuizAttempt]
    def fetch_activity_log(user_id: int, since: datetime) -> List[ActivityLog]
    def get_user_baseline(user_id: int, activity_type: str) -> Baseline

# Behavior Analyzer Service
class BehaviorAnalyzer:
    def reconstruct_sessions(interactions: List[Interaction]) -> List[Session]
    def calculate_performance_metrics(session: Session) -> PerformanceMetrics
    def detect_behavioral_patterns(session: Session) -> BehavioralPatterns
    def compare_to_baseline(metrics: PerformanceMetrics, baseline: Baseline) -> Comparison

# Impairment Detector Service
class ImpairmentDetector:
    def assess_impairment(session: Session, comparison: Comparison) -> ImpairmentAssessment
    def should_alert(assessment: ImpairmentAssessment) -> bool
    def get_recommendation(assessment: ImpairmentAssessment) -> str

# Alert Engine Service
class AlertEngine:
    def create_alert(assessment: ImpairmentAssessment) -> Alert
    def send_to_teacher(alert: Alert, teacher_id: int) -> bool
    def broadcast_websocket(alert: Alert, room: str) -> None
```

---

## 7. Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Infrastructure Setup**
- [ ] Set up PostgreSQL database for analytics
- [ ] Configure read-only connection to Moodle MySQL database
- [ ] Create Docker development environment
- [ ] Set up Python/Node.js project structure
- [ ] Implement database schema migration system

**Week 2: Data Collection**
- [ ] Implement Moodle database connector
- [ ] Create data extraction queries for quiz attempts
- [ ] Build activity log parser
- [ ] Implement session reconstruction algorithm
- [ ] Create baseline calculation system

**Week 3: Core Detection Logic**
- [ ] Implement performance degradation detection
- [ ] Build behavioral pattern analyzer
- [ ] Create impairment score calculator
- [ ] Develop rule-based detection engine
- [ ] Write unit tests for detection algorithms

### Phase 2: API & Alerting (Weeks 4-5)

**Week 4: API Development**
- [ ] Build RESTful API endpoints
- [ ] Implement authentication/authorization
- [ ] Create WebSocket server for real-time updates
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Write integration tests

**Week 5: Alert System**
- [ ] Implement alert generation logic
- [ ] Build notification queue system
- [ ] Create email notification service
- [ ] Develop teacher dashboard API
- [ ] Test end-to-end alerting flow

### Phase 3: Dashboard & Testing (Weeks 6-7)

**Week 6: Teacher Dashboard**
- [ ] Create React dashboard application
- [ ] Build real-time monitoring interface
- [ ] Implement alert management UI
- [ ] Add student history visualization
- [ ] Design responsive mobile layout

**Week 7: Testing & Optimization**
- [ ] Load testing with simulated data
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing with teachers
- [ ] Bug fixes and refinements

### Phase 4: Deployment (Week 8)

- [ ] Production environment setup
- [ ] Database migration to production
- [ ] Deploy API services
- [ ] Deploy teacher dashboard
- [ ] Configure monitoring and logging
- [ ] Create operational documentation
- [ ] Conduct training for teachers

---

## 8. Technology Stack

### Backend Services
- **Language**: Python 3.11+ (data processing) + Node.js 18+ (API gateway)
- **Framework**: FastAPI (Python), Express.js (Node.js)
- **Database ORM**: SQLAlchemy (PostgreSQL), mysql2 (Moodle read-only)
- **Task Queue**: Celery + Redis (background processing)
- **WebSocket**: Socket.io (real-time updates)

### Data Processing
- **Analytics**: pandas, numpy (data manipulation)
- **Statistics**: scipy, statsmodels (statistical analysis)
- **ML (Phase 2)**: scikit-learn, XGBoost (advanced detection)

### Database
- **Analytics**: PostgreSQL 15+ (JSONB support)
- **Cache**: Redis 7+ (session storage, real-time data)
- **Moodle**: MySQL 5.7 (read-only access)

### Frontend
- **Framework**: React 18+ with TypeScript
- **State**: Redux Toolkit or Zustand
- **UI Components**: Material-UI or Ant Design
- **Charts**: Recharts or Chart.js
- **Real-time**: Socket.io-client

### DevOps
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **CI/CD**: GitHub Actions

---

## 9. Security & Privacy

### Data Access
- **Moodle Database**: Read-only access with dedicated user
- **Connection**: Encrypted TLS connection to MySQL
- **Credentials**: Stored in environment variables, never in code
- **Access Control**: IP whitelist for database access

### Student Privacy
- **Data Minimization**: Only collect necessary behavioral data
- **Anonymization**: Option to anonymize data for research
- **Retention Policy**: Delete raw interaction data after 90 days
- **Compliance**: FERPA, GDPR, COPPA compliance
- **Consent**: Student/parent consent for monitoring (if required)

### API Security
- **Authentication**: JWT tokens or OAuth 2.0
- **Authorization**: Role-based access control (teacher, admin)
- **Rate Limiting**: Prevent abuse (100 req/min per user)
- **Input Validation**: Strict validation of all inputs
- **Audit Logging**: Log all access to student data

---

## 10. Testing Strategy

### Unit Tests
- Detection algorithm accuracy tests
- Baseline calculation validation
- Session reconstruction logic
- Alert threshold verification

### Integration Tests
- Moodle database connection
- End-to-end data flow (Moodle → Detection → Alert)
- API endpoint functionality
- WebSocket real-time updates

### Performance Tests
- Handle 1000+ concurrent students
- Detection latency < 5 seconds
- API response time < 200ms (p95)
- Database query optimization

### User Acceptance Tests
- Teacher dashboard usability
- Alert accuracy (false positive rate < 10%)
- Recommendation quality
- Mobile responsiveness

---

## 11. Success Metrics

### Detection Accuracy
- **Target**: 85%+ true positive rate
- **Measurement**: Teacher feedback on alert relevance
- **Acceptable**: <15% false positive rate

### System Performance
- **Detection Latency**: <5 seconds from interaction to assessment
- **API Response Time**: <200ms (p95)
- **Uptime**: 99.5%+

### Teacher Adoption
- **Target**: 70%+ of teachers actively use dashboard
- **Measurement**: Weekly active users
- **Feedback**: Net Promoter Score >50

### Student Outcomes
- **Target**: Improved learning efficiency
- **Measurement**: Comparison of grades before/after break recommendations
- **Survey**: Student self-reported fatigue levels

---

## 12. Future Enhancements (Post-MVP)

### Machine Learning Models
- Train supervised ML model on labeled data (teacher-verified impairment)
- Use neural networks for complex pattern recognition
- Personalized baselines per student

### Advanced Features
- Predictive alerts (predict impairment before it occurs)
- Automated interventions (suggest specific break activities)
- Adaptive difficulty adjustment (integrate with Moodle quiz engine)
- Emotional state detection (sentiment analysis of forum posts)

### Integration Expansion
- LTI integration for other LMS platforms (Canvas, Blackboard)
- Mobile app for students (self-monitoring)
- Wearable device integration (heart rate, activity tracking)
- AI tutor recommendations (suggest personalized learning paths)

---

## Appendix A: Sample Data Flow

```
1. Student answers quiz question in Moodle
   ↓
2. Activity logged in mdl_quiz_attempts and mdl_question_attempts
   ↓
3. Data Collector polls Moodle DB every 30 seconds
   ↓
4. New interaction detected → stored in student_interactions table
   ↓
5. Behavior Analyzer reconstructs session (groups interactions)
   ↓
6. Performance metrics calculated (accuracy, response time, patterns)
   ↓
7. Comparison to student baseline
   ↓
8. Impairment Detector calculates score
   ↓
9. If score > threshold → create impairment_assessment record
   ↓
10. Alert Engine checks if teacher notification needed
    ↓
11. If yes → create alert, send via WebSocket to teacher dashboard
    ↓
12. Teacher sees real-time notification: "Student X showing signs of fatigue"
    ↓
13. Teacher can view details and acknowledge alert
```

---

## Appendix B: Configuration Examples

### Moodle Database Connection
```yaml
# config/moodle.yaml
moodle_db:
  host: moodle.university.edu
  port: 3306
  database: moodle
  user: readonly_analytics
  password: ${MOODLE_DB_PASSWORD}  # From environment
  ssl: true
  pool_size: 5
  read_only: true
```

### Detection Parameters
```yaml
# config/detection.yaml
detection:
  assessment_interval: 30  # seconds
  session_timeout: 900     # 15 minutes of inactivity = session end
  min_interactions_for_baseline: 20
  min_interactions_for_assessment: 5

  thresholds:
    accuracy_decline: 0.20      # 20% drop
    response_time_increase: 1.50  # 1.5x slower
    careless_error_rate: 0.30   # 30% careless errors
    session_duration_warning: 5400  # 90 minutes

  alert_levels:
    early_warning: 31
    moderate: 51
    severe: 71
```

---

## Document Control

- **Version**: 1.0.0
- **Author**: Claude AI Assistant
- **Created**: 2025-11-18
- **Status**: Ready for Implementation
- **Next Review**: After Phase 1 completion
