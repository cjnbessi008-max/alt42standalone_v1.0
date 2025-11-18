# DMN Rest Detection & Recommendation System

## Overview

This document describes the DMN (Default Mode Network) activity detection and rest recommendation system integrated with the AI Education Pipeline. The system monitors student engagement patterns and cognitive load indicators to provide timely break recommendations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LMS Integration Layer                     │
│              (Canvas, Moodle, Custom LMS APIs)               │
└───────────────────┬─────────────────────────────────────────┘
                    │ Student Activity Events
┌───────────────────▼─────────────────────────────────────────┐
│                  Activity Monitoring Service                 │
│       (WebSocket Server + REST API Gateway)                  │
└───────────┬─────────────────────────────────────────────────┘
            │ Real-time Activity Stream
┌───────────▼──────────────────────────────────────────────────┐
│            DMN Detection & Analysis Engine                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ - Interaction Pattern Analysis                         │  │
│  │ - Cognitive Load Calculation                           │  │
│  │ - Attention Span Monitoring                            │  │
│  │ - Fatigue Detection                                    │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────┬──────────────────────────────────────────────────┘
            │ DMN Activation Signal
┌───────────▼──────────────────────────────────────────────────┐
│          Break Recommendation Engine                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ - Personalized Break Suggestions                       │  │
│  │ - Break Duration Calculation                           │  │
│  │ - Break Activity Recommendation                        │  │
│  │ - Timing Optimization                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────┬──────────────────────────────────────────────────┘
            │ Break Recommendations
┌───────────▼──────────────────────────────────────────────────┐
│           Notification & UI Service                           │
│       (Student Webapp + Mobile Push Notifications)            │
└──────────────────────────────────────────────────────────────┘
```

## DMN Activation Detection Algorithm

### Signal Indicators

The system monitors multiple behavioral indicators to detect DMN activation:

1. **Interaction Patterns**
   - Decreased click/tap frequency
   - Increased time between interactions
   - Random or unfocused clicking patterns
   - Navigation away from core learning content

2. **Response Quality**
   - Increased error rates
   - Decreased response accuracy
   - Incomplete submissions
   - Random answer patterns

3. **Time-Based Metrics**
   - Continuous study duration (> 25-45 minutes)
   - Time of day effects (post-lunch dip)
   - Total session duration

4. **Engagement Metrics**
   - Decreased scroll velocity
   - Reduced content consumption rate
   - Increased idle time
   - Window focus loss frequency

### DMN Score Calculation

```python
DMN_Score = (
    w1 * InteractionSlowdown +
    w2 * ErrorRateIncrease +
    w3 * StudyDurationFactor +
    w4 * EngagementDropoff +
    w5 * IdleTimeFactor
)

# Default weights
w1 = 0.25  # Interaction patterns
w2 = 0.30  # Response quality
w3 = 0.20  # Time-based
w4 = 0.15  # Engagement
w5 = 0.10  # Idle time

# Break recommendation threshold
BREAK_THRESHOLD = 0.65  # Scale 0-1
URGENT_BREAK_THRESHOLD = 0.85
```

### Thresholds

- **DMN Score < 0.40**: Active learning state (no intervention)
- **DMN Score 0.40-0.64**: Mild fatigue (gentle reminder)
- **DMN Score 0.65-0.84**: Moderate fatigue (break recommendation)
- **DMN Score >= 0.85**: High fatigue (urgent break suggestion)

## REST API Specification

### Endpoints

#### 1. Activity Tracking

**POST /api/v1/dmn/activity**

Submit student activity event for analysis.

```json
{
  "student_id": "uuid",
  "session_id": "uuid",
  "module_id": "uuid",
  "event_type": "click|submit|scroll|focus_loss|idle",
  "timestamp": "ISO8601",
  "metadata": {
    "response_time_ms": 1500,
    "is_correct": true,
    "content_position": 0.75,
    "idle_duration_seconds": 30
  }
}
```

**Response**: 200 OK
```json
{
  "dmn_score": 0.42,
  "status": "active_learning",
  "recommendation": null
}
```

#### 2. DMN Status Check

**GET /api/v1/dmn/status/{student_id}**

Get current DMN activation status for a student.

**Response**: 200 OK
```json
{
  "student_id": "uuid",
  "current_session": {
    "session_id": "uuid",
    "started_at": "ISO8601",
    "duration_minutes": 32,
    "dmn_score": 0.68,
    "status": "moderate_fatigue",
    "last_break": "ISO8601"
  },
  "recommendation": {
    "type": "break",
    "urgency": "moderate",
    "suggested_duration_minutes": 5,
    "activity_suggestions": [
      "stretch",
      "walk",
      "water_break"
    ]
  }
}
```

#### 3. Break Recommendation

**POST /api/v1/dmn/recommend-break**

Request a personalized break recommendation.

```json
{
  "student_id": "uuid",
  "session_id": "uuid",
  "context": {
    "current_module": "fractions",
    "difficulty": "medium",
    "time_of_day": "afternoon"
  }
}
```

**Response**: 200 OK
```json
{
  "recommendation_id": "uuid",
  "break_type": "active_rest",
  "duration_minutes": 5,
  "activities": [
    {
      "type": "physical",
      "description": "5-minute stretching routine",
      "instructions": "Stand up and stretch your arms, neck, and back"
    },
    {
      "type": "cognitive",
      "description": "Mindful breathing",
      "instructions": "Take 5 deep breaths, focusing on your breathing"
    }
  ],
  "return_time": "ISO8601",
  "motivational_message": "Great work! Take a short break to refresh your mind."
}
```

#### 4. Break Acknowledgment

**POST /api/v1/dmn/break/acknowledge**

Student acknowledges and accepts the break recommendation.

```json
{
  "recommendation_id": "uuid",
  "student_id": "uuid",
  "action": "accept|defer|dismiss"
}
```

#### 5. LMS Webhook Integration

**POST /api/v1/dmn/lms/webhook**

Receive activity events from LMS systems.

```json
{
  "source": "canvas|moodle|blackboard",
  "event_type": "assignment_view|quiz_submit|discussion_post",
  "user_id": "lms_user_id",
  "timestamp": "ISO8601",
  "payload": {}
}
```

## Database Schema

### Tables

#### 1. student_engagement_sessions

```sql
CREATE TABLE student_engagement_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID REFERENCES modules(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    total_interactions INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(3,2),
    dmn_score_max DECIMAL(3,2),
    dmn_score_avg DECIMAL(3,2),
    breaks_taken INTEGER DEFAULT 0,
    session_quality_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON student_engagement_sessions(student_id);
CREATE INDEX idx_sessions_started_at ON student_engagement_sessions(started_at);
```

#### 2. cognitive_activity_logs

```sql
CREATE TABLE cognitive_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id),
    student_id UUID NOT NULL REFERENCES students(id),
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    is_correct BOOLEAN,
    idle_duration_seconds INTEGER,
    content_position DECIMAL(3,2),
    interaction_quality DECIMAL(3,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_session ON cognitive_activity_logs(session_id);
CREATE INDEX idx_activity_logs_timestamp ON cognitive_activity_logs(timestamp);
CREATE INDEX idx_activity_logs_student ON cognitive_activity_logs(student_id);
```

#### 3. dmn_detection_scores

```sql
CREATE TABLE dmn_detection_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id),
    student_id UUID NOT NULL REFERENCES students(id),
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    dmn_score DECIMAL(3,2) NOT NULL,
    interaction_slowdown_score DECIMAL(3,2),
    error_rate_score DECIMAL(3,2),
    study_duration_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    idle_time_score DECIMAL(3,2),
    fatigue_level VARCHAR(20) NOT NULL CHECK (
        fatigue_level IN ('active', 'mild', 'moderate', 'high')
    ),
    recommendation_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dmn_scores_session ON dmn_detection_scores(session_id);
CREATE INDEX idx_dmn_scores_calculated_at ON dmn_detection_scores(calculated_at);
```

#### 4. break_recommendations

```sql
CREATE TABLE break_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id),
    student_id UUID NOT NULL REFERENCES students(id),
    dmn_score_id UUID REFERENCES dmn_detection_scores(id),
    recommended_at TIMESTAMP NOT NULL DEFAULT NOW(),
    break_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    urgency_level VARCHAR(20) NOT NULL,
    activities JSONB,
    motivational_message TEXT,
    student_response VARCHAR(20) CHECK (
        student_response IN ('accept', 'defer', 'dismiss', 'pending')
    ),
    responded_at TIMESTAMP,
    break_started_at TIMESTAMP,
    break_ended_at TIMESTAMP,
    actual_duration_minutes INTEGER,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_student ON break_recommendations(student_id);
CREATE INDEX idx_recommendations_recommended_at ON break_recommendations(recommended_at);
```

#### 5. lms_integration_logs

```sql
CREATE TABLE lms_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_source VARCHAR(50) NOT NULL,
    lms_user_id VARCHAR(255) NOT NULL,
    student_id UUID REFERENCES students(id),
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_logs_student ON lms_integration_logs(student_id);
CREATE INDEX idx_lms_logs_processed ON lms_integration_logs(processed);
```

#### 6. student_preferences

```sql
CREATE TABLE student_rest_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) UNIQUE,
    preferred_break_duration INTEGER DEFAULT 5,
    break_notification_enabled BOOLEAN DEFAULT TRUE,
    preferred_break_activities JSONB,
    dmn_detection_sensitivity DECIMAL(2,1) DEFAULT 1.0 CHECK (
        dmn_detection_sensitivity BETWEEN 0.5 AND 2.0
    ),
    study_session_target_minutes INTEGER DEFAULT 25,
    break_interval_minutes INTEGER DEFAULT 25,
    quiet_hours JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Break Recommendation Algorithm

### Break Type Selection

```python
def select_break_type(dmn_score, session_duration, time_of_day, student_preferences):
    if dmn_score >= 0.85:
        return {
            'type': 'extended_rest',
            'duration': 10,
            'activities': ['walk', 'snack', 'social_interaction']
        }
    elif dmn_score >= 0.65:
        return {
            'type': 'active_rest',
            'duration': 5,
            'activities': ['stretch', 'water', 'window_gaze']
        }
    elif session_duration >= 45:
        return {
            'type': 'scheduled_break',
            'duration': 5,
            'activities': ['stand', 'stretch', 'eye_rest']
        }
    else:
        return {
            'type': 'micro_break',
            'duration': 2,
            'activities': ['deep_breathing', 'eye_exercises']
        }
```

### Personalization Factors

1. **Learning Style**: Visual learners → eye rest breaks; kinesthetic → movement breaks
2. **Historical Data**: Effective break types from past sessions
3. **Time of Day**: Morning → shorter breaks; afternoon → longer breaks
4. **Module Difficulty**: High difficulty → more frequent, shorter breaks
5. **Student Preferences**: Customizable break activities and durations

## LMS Integration

### Supported LMS Platforms

1. **Canvas LMS**
   - API: Canvas REST API
   - Events: Page views, assignment submissions, quiz attempts
   - Authentication: OAuth 2.0

2. **Moodle**
   - API: Moodle Web Services
   - Events: Course access, resource views, forum posts
   - Authentication: Token-based

3. **Custom LMS**
   - API: Webhook-based event streaming
   - Events: Configurable event types
   - Authentication: API key or JWT

### Integration Flow

```
LMS Activity → Webhook → Activity Monitoring Service
                           ↓
                    Map LMS User to Student ID
                           ↓
                    Process Activity Event
                           ↓
                    Update DMN Detection Pipeline
                           ↓
                    Trigger Recommendation if needed
```

## Frontend Components

### 1. Break Notification Component

```typescript
interface BreakNotificationProps {
  recommendation: BreakRecommendation;
  onAccept: () => void;
  onDefer: () => void;
  onDismiss: () => void;
}

// Visual design: Non-intrusive slide-in notification
// Timing: Appears between activities, not during active work
// Dismissal: Auto-dismiss after 60 seconds if no response
```

### 2. Break Activity Guide

Interactive guide showing:
- Break duration countdown
- Step-by-step activity instructions
- Visual demonstrations (animations/videos)
- Optional break extension

### 3. Engagement Dashboard (Teacher View)

Shows:
- Student DMN scores over time
- Break recommendation history
- Break effectiveness metrics
- Class-wide cognitive load trends

## Implementation Phases

### Phase 1: Core Detection Engine (Week 1-2)
- Database schema setup
- Activity tracking API
- Basic DMN score calculation
- Unit tests

### Phase 2: Recommendation Engine (Week 3)
- Break recommendation logic
- Personalization algorithm
- Notification service
- Integration tests

### Phase 3: LMS Integration (Week 4)
- Canvas webhook handler
- Moodle integration
- Generic webhook API
- Authentication & security

### Phase 4: Frontend Components (Week 5-6)
- Break notification UI
- Activity guide component
- Teacher dashboard
- Student preferences settings

### Phase 5: Testing & Refinement (Week 7-8)
- End-to-end testing
- User acceptance testing
- Algorithm tuning based on real data
- Performance optimization

## Success Metrics

1. **Detection Accuracy**: >80% correlation between DMN score and self-reported fatigue
2. **Recommendation Acceptance**: >60% of recommendations accepted by students
3. **Break Effectiveness**: >70% of students report feeling refreshed after breaks
4. **Learning Improvement**: 10-15% increase in post-break problem-solving accuracy
5. **Student Satisfaction**: NPS > 40 for the break recommendation feature

## Privacy & Ethics

1. **Data Minimization**: Collect only necessary engagement metrics
2. **Transparency**: Students can view their own DMN scores and activity logs
3. **Opt-out Option**: Students can disable DMN detection if desired
4. **No Surveillance**: System focuses on helping, not monitoring for punishment
5. **Data Retention**: Activity logs retained for 90 days, aggregated data indefinitely

## Future Enhancements

1. **Biometric Integration**: Heart rate variability, eye-tracking for more accurate detection
2. **ML Model**: Train supervised learning model on labeled fatigue data
3. **Social Breaks**: Group break coordination for collaborative learning environments
4. **Gamification**: Break streak rewards, wellness challenges
5. **Adaptive Thresholds**: Personalized DMN thresholds per student
6. **Multi-modal Detection**: Voice analysis, facial expression recognition (with consent)

## References

- Raichle, M. E. (2015). The brain's default mode network. Annual Review of Neuroscience.
- Esterman, M. & Rothlein, D. (2019). Models of sustained attention. Current Opinion in Psychology.
- Ariga, A. & Lleras, A. (2011). Brief and rare mental "breaks" keep you focused. Cognition.
