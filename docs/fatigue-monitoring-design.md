# LMS Fatigue Monitoring & Rest Notification System

## Overview
This system tracks student learning progress and predicts fatigue accumulation to recommend optimal rest periods, improving learning outcomes and preventing burnout.

## Fatigue Prediction Algorithm

### Core Concept
Fatigue accumulation is modeled based on:
1. **Learning Intensity**: Time spent actively learning
2. **Task Complexity**: Difficulty level of current material
3. **Progress Rate**: Speed of completion vs. expected pace
4. **Error Rate**: Frequency of mistakes indicating cognitive load
5. **Session Duration**: Continuous learning time without breaks
6. **Time of Day**: Circadian rhythm effects on cognitive performance

### Fatigue Score Formula

```
Fatigue Score (0-100) = weighted sum of:
  - Base Fatigue (40%): (session_duration_minutes / 60) * 100
  - Complexity Load (25%): (difficulty_level / 5) * 100
  - Error Impact (20%): (error_rate * 100)
  - Pace Pressure (15%): max(0, (actual_pace - expected_pace) / expected_pace) * 100
```

### Fatigue Levels & Thresholds

| Level | Score Range | Status | Action |
|-------|-------------|--------|--------|
| 1 | 0-30 | Fresh | Continue learning |
| 2 | 31-50 | Mild fatigue | Monitor closely |
| 3 | 51-70 | Moderate fatigue | Suggest 5-min break |
| 4 | 71-85 | High fatigue | Recommend 15-min break |
| 5 | 86-100 | Exhaustion | Require 30-min break or stop |

### Rest Recommendation Strategy

**Break Types:**
- **Micro-break (2-3 min)**: Every 20-25 minutes of continuous work
- **Short break (5-10 min)**: When fatigue score reaches 50-70
- **Medium break (15-20 min)**: When fatigue score reaches 71-85
- **Long break (30+ min)**: When fatigue score exceeds 85

**Break Activities:**
- Stretching exercises
- Eye relaxation (20-20-20 rule)
- Hydration reminder
- Light physical movement
- Breathing exercises

### Recovery Model

```
Recovery Rate = base_recovery * activity_multiplier

base_recovery = 1.5 points per minute (passive rest)
activity_multiplier:
  - Passive rest: 1.0x
  - Stretching: 1.3x
  - Walking: 1.5x
  - Physical activity: 2.0x
```

## Data Models

### FatigueSession
Tracks individual learning sessions with fatigue metrics.

```typescript
interface FatigueSession {
  id: string;                    // UUID
  student_id: string;            // FK to Student
  module_id: string;             // FK to Module
  session_start: Date;           // Session start timestamp
  session_end: Date | null;      // Session end (null if ongoing)
  duration_minutes: number;      // Total session duration
  active_learning_minutes: number; // Time actively engaged
  idle_minutes: number;          // Time inactive
  fatigue_score: number;         // Current fatigue score (0-100)
  peak_fatigue_score: number;    // Maximum fatigue reached
  fatigue_level: 1 | 2 | 3 | 4 | 5; // Current fatigue level
  break_count: number;           // Number of breaks taken
  total_break_minutes: number;   // Total break time
  created_at: Date;
  updated_at: Date;
}
```

### FatigueMetric
Captures detailed fatigue measurements at regular intervals.

```typescript
interface FatigueMetric {
  id: string;                    // UUID
  session_id: string;            // FK to FatigueSession
  student_id: string;            // FK to Student
  timestamp: Date;               // Measurement time
  fatigue_score: number;         // Calculated fatigue (0-100)
  session_duration_minutes: number;
  complexity_level: number;      // 1-5
  error_rate: number;            // 0-1 (percentage)
  problems_completed: number;    // Count since last metric
  correct_answers: number;       // Count of correct answers
  response_time_avg_seconds: number; // Average time per problem
  interaction_count: number;     // UI interactions per minute
  created_at: Date;
}
```

### BreakRecommendation
Stores break suggestions and whether they were followed.

```typescript
interface BreakRecommendation {
  id: string;                    // UUID
  session_id: string;            // FK to FatigueSession
  student_id: string;            // FK to Student
  recommended_at: Date;          // When break was suggested
  fatigue_score_at_recommendation: number;
  break_type: 'micro' | 'short' | 'medium' | 'long';
  duration_minutes: number;      // Recommended duration
  reason: string;                // Why break was recommended
  status: 'pending' | 'accepted' | 'dismissed' | 'deferred';
  actual_break_start: Date | null;
  actual_break_end: Date | null;
  actual_duration_minutes: number | null;
  activities_during_break: string[]; // ['stretch', 'walk', 'hydrate']
  fatigue_score_after_break: number | null;
  created_at: Date;
  updated_at: Date;
}
```

### StudentFatigueProfile
Personalized fatigue patterns for each student.

```typescript
interface StudentFatigueProfile {
  id: string;                    // UUID
  student_id: string;            // FK to Student (unique)
  optimal_session_duration: number; // Minutes before fatigue
  average_fatigue_rate: number;  // Points per hour
  recovery_rate: number;         // Points per minute of rest
  preferred_break_duration: number; // Minutes
  peak_performance_hours: number[]; // Hours of day (0-23)
  fatigue_threshold_level: number; // Custom threshold (default 70)
  total_sessions: number;        // Lifetime session count
  total_learning_minutes: number;
  total_break_minutes: number;
  compliance_rate: number;       // % of breaks actually taken
  created_at: Date;
  updated_at: Date;
}
```

## API Endpoints

### Session Management

```
POST   /api/fatigue/sessions
       Start new fatigue tracking session
       Body: { student_id, module_id }
       Response: FatigueSession

GET    /api/fatigue/sessions/{session_id}
       Get session details with current fatigue metrics

PUT    /api/fatigue/sessions/{session_id}/end
       End active session
       Response: FatigueSession with final metrics

GET    /api/fatigue/sessions/active
       Get all active sessions
       Query: ?student_id={id}
```

### Metrics Tracking

```
POST   /api/fatigue/metrics
       Record fatigue measurement
       Body: {
         session_id,
         complexity_level,
         problems_completed,
         correct_answers,
         response_times[]
       }
       Response: { fatigue_score, fatigue_level, recommendation? }

GET    /api/fatigue/metrics/{session_id}
       Get all metrics for a session
       Response: FatigueMetric[]

GET    /api/fatigue/realtime/{session_id}
       WebSocket endpoint for real-time fatigue updates
```

### Break Management

```
POST   /api/fatigue/breaks/recommend
       Manually request break recommendation
       Body: { session_id }
       Response: BreakRecommendation

PUT    /api/fatigue/breaks/{recommendation_id}/accept
       Student accepts break
       Response: BreakRecommendation

PUT    /api/fatigue/breaks/{recommendation_id}/dismiss
       Student dismisses break (with reason)
       Body: { reason: string }

PUT    /api/fatigue/breaks/{recommendation_id}/complete
       Mark break as completed
       Body: { activities: string[], actual_duration: number }

GET    /api/fatigue/breaks/{session_id}
       Get all break recommendations for session
```

### Profile & Analytics

```
GET    /api/fatigue/profile/{student_id}
       Get student fatigue profile
       Response: StudentFatigueProfile

PUT    /api/fatigue/profile/{student_id}
       Update fatigue preferences
       Body: Partial<StudentFatigueProfile>

GET    /api/fatigue/analytics/{student_id}
       Get fatigue analytics and insights
       Query: ?start_date, ?end_date
       Response: {
         average_fatigue_score,
         sessions_count,
         break_compliance_rate,
         optimal_learning_time,
         fatigue_patterns_by_hour,
         recommendations: string[]
       }
```

## Real-time Notification System

### WebSocket Events

**Server → Client:**
```javascript
// Fatigue level updated
{
  event: 'fatigue_updated',
  data: {
    session_id,
    fatigue_score,
    fatigue_level,
    trend: 'increasing' | 'stable' | 'decreasing'
  }
}

// Break recommended
{
  event: 'break_recommended',
  data: {
    recommendation_id,
    break_type,
    duration_minutes,
    reason,
    urgency: 'low' | 'medium' | 'high'
  }
}

// Break reminder (for dismissed breaks)
{
  event: 'break_reminder',
  data: {
    original_recommendation_id,
    minutes_since_dismissed,
    current_fatigue_score
  }
}

// Recovery progress
{
  event: 'recovery_progress',
  data: {
    recommendation_id,
    current_recovery_percentage,
    estimated_time_remaining
  }
}
```

**Client → Server:**
```javascript
// Subscribe to session updates
{
  event: 'subscribe_session',
  data: { session_id }
}

// Report activity during break
{
  event: 'break_activity',
  data: { recommendation_id, activity: string }
}

// Report learning interaction
{
  event: 'learning_interaction',
  data: {
    session_id,
    interaction_type: 'problem_viewed' | 'answer_submitted' | 'hint_requested',
    timestamp
  }
}
```

### Notification Triggers

1. **Preventive Alerts** (Before high fatigue):
   - Session duration reaches 25 minutes → micro-break suggestion
   - Fatigue score reaches 45 → "You're doing great! Consider a quick stretch"
   - Error rate increases suddenly → "Take a breath, you've got this"

2. **Intervention Alerts** (During high fatigue):
   - Fatigue score exceeds 70 → "Time for a break! Let's rest for 5 minutes"
   - Fatigue score exceeds 85 → "Important: Take a 15-minute break now"
   - Session exceeds 60 minutes without break → "Mandatory break required"

3. **Positive Reinforcement**:
   - Break completed → "Great job resting! You're recharged and ready"
   - Good break compliance → "You're taking care of yourself well!"
   - Effective learning session → "Excellent focused session today!"

## Frontend Components

### FatigueIndicator
```tsx
// Visual indicator showing current fatigue level
<FatigueIndicator
  fatigueScore={65}
  fatigueLevel={3}
  trend="increasing"
  showDetails={true}
/>
```

Features:
- Circular progress indicator (green → yellow → red)
- Animated transitions
- Tooltip with detailed breakdown
- Pulse animation at high levels

### BreakNotificationModal
```tsx
// Modal prompting student to take break
<BreakNotificationModal
  recommendation={breakRecommendation}
  onAccept={handleAccept}
  onDismiss={handleDismiss}
  onDefer={handleDefer}
/>
```

Features:
- Non-blocking overlay (can continue learning)
- Break activity suggestions
- Timer showing break duration
- Option to customize break length

### BreakTimer
```tsx
// Timer during break showing recovery progress
<BreakTimer
  durationMinutes={10}
  activitiesCompleted={['stretch', 'hydrate']}
  recoveryPercentage={75}
  onComplete={handleComplete}
/>
```

### FatigueAnalyticsDashboard
```tsx
// Teacher/student analytics view
<FatigueAnalyticsDashboard
  studentId={studentId}
  dateRange={{ start, end }}
/>
```

Features:
- Fatigue patterns over time (chart)
- Break compliance statistics
- Optimal learning times
- Personalized recommendations

## Implementation Priority

### Phase 1: Core Foundation (Week 1)
- [ ] Database schema creation
- [ ] Basic fatigue calculation service
- [ ] Session tracking endpoints

### Phase 2: Real-time Tracking (Week 2)
- [ ] WebSocket integration
- [ ] Metric collection endpoints
- [ ] Fatigue score calculation refinement

### Phase 3: Break System (Week 3)
- [ ] Break recommendation engine
- [ ] Notification service
- [ ] Frontend modal components

### Phase 4: Personalization (Week 4)
- [ ] Student profile learning
- [ ] Adaptive threshold adjustment
- [ ] Analytics dashboard

### Phase 5: Polish & Testing (Week 5)
- [ ] A/B testing different thresholds
- [ ] User feedback collection
- [ ] Performance optimization

## Success Metrics

### Primary KPIs
- **Break Compliance Rate**: Target >60% of recommendations followed
- **Fatigue Score Accuracy**: Correlation >0.7 with self-reported fatigue
- **Learning Efficiency**: 15-20% improvement in retention with breaks
- **Session Completion**: Reduce dropout rate by 25%

### Secondary Metrics
- Average session duration with breaks vs. without
- Student satisfaction with break recommendations
- Teacher-reported improvements in engagement
- Reduction in error rates after breaks

## Privacy & Ethics

- **Data Retention**: Fatigue metrics retained for 90 days
- **Student Control**: Can disable fatigue tracking or adjust thresholds
- **No Punishment**: Ignoring breaks doesn't affect grades
- **Transparency**: Students see how fatigue score is calculated
- **Parental Notification**: Optional alerts to parents for concerning patterns

## Technical Considerations

### Performance
- Fatigue calculation: <100ms
- Real-time updates: <500ms latency
- Database queries: Indexed on student_id, session_id, timestamp

### Scalability
- Supports 10,000+ concurrent sessions
- Metrics aggregated every 2-3 minutes (not every interaction)
- WebSocket server with Redis pub/sub for multi-instance scaling

### Error Handling
- Graceful degradation if fatigue service unavailable
- Client-side fatigue estimation fallback
- Retry logic for failed metric submissions

### Testing
- Unit tests for fatigue calculation algorithm
- Integration tests for API endpoints
- E2E tests for notification flow
- Load testing for concurrent sessions
