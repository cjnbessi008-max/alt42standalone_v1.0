# DMN Rest Routine System - Architecture Design

## Overview
The DMN (Default Mode Network) Rest Routine System integrates with Moodle LMS to automatically suggest brain break activities before and after students work on problems, optimizing learning through strategic rest periods.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle LMS (3.7)                          │
│                   (PHP 7.1.9, MySQL 5.7)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DMN Moodle Plugin (local_dmnrest)                  │   │
│  │  - Quiz event listeners                             │   │
│  │  - Problem before/after hooks                       │   │
│  │  - Rest routine UI display                          │   │
│  └────────────┬────────────────────────────────────────┘   │
└───────────────┼──────────────────────────────────────────────┘
                │ HTTP REST API
┌───────────────▼──────────────────────────────────────────────┐
│            DMN Rest Routine API (Node.js/Express)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/dmn/suggest - Get rest routine suggestion     │   │
│  │  /api/dmn/complete - Record completion              │   │
│  │  /api/dmn/routines - Manage routines                │   │
│  │  /api/dmn/analytics - Get effectiveness data        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Recommendation Engine                               │   │
│  │  - Context analyzer (problem complexity, duration)   │   │
│  │  - Student state tracker (fatigue, performance)      │   │
│  │  - Routine selector (optimal rest activity)          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  dmn_routines - Rest routine definitions            │   │
│  │  dmn_sessions - Student session tracking            │   │
│  │  dmn_events - Rest routine usage events             │   │
│  │  dmn_analytics - Effectiveness metrics              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### dmn_routines
Stores available rest routine activities.

```sql
CREATE TABLE dmn_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL, -- Expected duration (30-300 seconds)
    type VARCHAR(50) NOT NULL CHECK (type IN ('breathing', 'visualization', 'physical', 'mindfulness', 'cognitive_break')),
    complexity_level INTEGER CHECK (complexity_level BETWEEN 1 AND 5), -- Which problem complexity levels this suits
    instructions JSONB NOT NULL, -- Step-by-step instructions
    media_url VARCHAR(500), -- Optional video/audio guide
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example routines
INSERT INTO dmn_routines (name, description, duration_seconds, type, complexity_level, instructions) VALUES
('Deep Breathing Exercise', 'Simple breathing to reset focus', 60, 'breathing', 1,
 '{"steps": ["Sit comfortably", "Close your eyes", "Breathe in for 4 counts", "Hold for 4 counts", "Breathe out for 4 counts", "Repeat 5 times"]}'),
('Tree Visualization', 'Imagine a growing tree to relax mind', 120, 'visualization', 2,
 '{"steps": ["Close your eyes", "Imagine a small seed", "Watch it grow into a tree", "See the branches spread", "Notice the leaves", "Feel the calm"]}'),
('Desk Stretch', 'Physical movement to refresh', 90, 'physical', 1,
 '{"steps": ["Stand up", "Stretch arms overhead", "Roll shoulders back", "Gentle neck rolls", "Touch toes (if comfortable)", "Sit back down"]}'),
('Mindful Observation', 'Notice 5 things around you', 120, 'mindfulness', 3,
 '{"steps": ["Pause current task", "Notice 5 things you can see", "Notice 4 things you can touch", "Notice 3 things you can hear", "Notice 2 things you can smell", "Notice 1 thing you can taste"]}');
```

### dmn_sessions
Tracks student problem-solving sessions.

```sql
CREATE TABLE dmn_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) NOT NULL, -- Moodle user ID
    module_id VARCHAR(255), -- Moodle course module ID
    problem_type VARCHAR(100),
    problem_complexity INTEGER CHECK (problem_complexity BETWEEN 1 AND 5),
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    total_active_time_seconds INTEGER DEFAULT 0,
    fatigue_score FLOAT DEFAULT 0.0, -- 0-1 scale, higher = more fatigued
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dmn_sessions_student ON dmn_sessions(student_id);
CREATE INDEX idx_dmn_sessions_module ON dmn_sessions(module_id);
```

### dmn_events
Records when rest routines are suggested and completed.

```sql
CREATE TABLE dmn_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES dmn_sessions(id),
    routine_id UUID REFERENCES dmn_routines(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('suggested_before', 'suggested_after', 'completed', 'skipped')),
    trigger_reason VARCHAR(100), -- 'high_complexity', 'fatigue_detected', 'time_interval', etc.
    problem_id VARCHAR(255), -- Moodle question ID
    suggested_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    actual_duration_seconds INTEGER,
    student_feedback INTEGER CHECK (student_feedback BETWEEN 1 AND 5), -- Optional 1-5 rating
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dmn_events_session ON dmn_events(session_id);
CREATE INDEX idx_dmn_events_routine ON dmn_events(routine_id);
```

### dmn_analytics
Aggregated analytics on rest routine effectiveness.

```sql
CREATE TABLE dmn_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES dmn_routines(id),
    date DATE NOT NULL,
    times_suggested INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    times_skipped INTEGER DEFAULT 0,
    avg_completion_duration_seconds FLOAT,
    avg_student_feedback FLOAT,
    problems_after_rest_correct_rate FLOAT, -- % correct on problems after rest
    problems_without_rest_correct_rate FLOAT, -- % correct on problems without prior rest
    effectiveness_score FLOAT, -- Calculated metric (0-100)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(routine_id, date)
);

CREATE INDEX idx_dmn_analytics_date ON dmn_analytics(date);
```

## REST API Endpoints

### POST /api/dmn/suggest
Get a rest routine suggestion.

**Request:**
```json
{
  "student_id": "12345",
  "module_id": "course-module-67",
  "problem_id": "question-890",
  "problem_complexity": 3,
  "trigger_point": "before", // or "after"
  "session_context": {
    "problems_attempted": 5,
    "problems_correct": 3,
    "active_time_minutes": 15,
    "time_since_last_rest": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "routine": {
    "id": "uuid-xxx",
    "name": "Deep Breathing Exercise",
    "description": "Simple breathing to reset focus",
    "duration_seconds": 60,
    "type": "breathing",
    "instructions": {
      "steps": [
        "Sit comfortably",
        "Close your eyes",
        "Breathe in for 4 counts",
        "Hold for 4 counts",
        "Breathe out for 4 counts",
        "Repeat 5 times"
      ]
    },
    "media_url": null
  },
  "trigger_reason": "problem_complexity_high",
  "estimated_duration": 60,
  "session_id": "uuid-session",
  "event_id": "uuid-event"
}
```

### POST /api/dmn/complete
Record routine completion.

**Request:**
```json
{
  "event_id": "uuid-event",
  "completed": true,
  "actual_duration_seconds": 65,
  "student_feedback": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rest routine completion recorded"
}
```

### GET /api/dmn/routines
List available routines (for admin management).

**Response:**
```json
{
  "success": true,
  "routines": [
    {
      "id": "uuid-xxx",
      "name": "Deep Breathing Exercise",
      "type": "breathing",
      "duration_seconds": 60,
      "complexity_level": 1,
      "is_active": true
    }
  ]
}
```

### GET /api/dmn/analytics
Get effectiveness analytics.

**Query Parameters:**
- `student_id` (optional): Filter by student
- `routine_id` (optional): Filter by routine
- `start_date`, `end_date`: Date range

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total_routines_suggested": 150,
    "total_routines_completed": 120,
    "completion_rate": 0.80,
    "avg_student_feedback": 4.2,
    "effectiveness_improvement": 0.15,
    "top_routines": [
      {
        "routine_name": "Deep Breathing Exercise",
        "completion_rate": 0.95,
        "effectiveness_score": 85.3
      }
    ]
  }
}
```

## Recommendation Engine Logic

### Context Analysis
The engine considers:

1. **Problem Complexity** (1-5 scale)
   - Level 1-2: Simple routines, shorter duration
   - Level 3-4: Moderate routines
   - Level 5: Comprehensive routines, longer duration

2. **Student Fatigue Score** (calculated from):
   - Time on task (longer = higher fatigue)
   - Error rate (more errors = higher fatigue)
   - Response time trend (slowing = higher fatigue)
   - Time since last break

3. **Trigger Point**
   - **Before problem**: Prepare mind, set focus
   - **After problem**: Reset, consolidate learning

### Selection Algorithm

```javascript
function selectRoutine(context) {
  // Calculate fatigue score (0-1)
  const fatigueScore = calculateFatigue(context);

  // Determine required duration
  let minDuration = 30;
  let maxDuration = 120;

  if (context.problem_complexity >= 4) {
    minDuration = 60;
    maxDuration = 180;
  }

  if (fatigueScore > 0.7) {
    minDuration = 90;
    maxDuration = 300;
  }

  // Filter routines by criteria
  let candidates = routines.filter(r =>
    r.is_active &&
    r.complexity_level >= context.problem_complexity - 1 &&
    r.complexity_level <= context.problem_complexity + 1 &&
    r.duration_seconds >= minDuration &&
    r.duration_seconds <= maxDuration
  );

  // Prioritize variety (avoid repeating recent routines)
  candidates = prioritizeVariety(candidates, context.recent_routines);

  // Select based on effectiveness history
  const selected = selectByEffectiveness(candidates, context.student_id);

  return selected;
}

function calculateFatigue(context) {
  const timeWeight = Math.min(context.active_time_minutes / 30, 1.0) * 0.4;
  const errorWeight = (1 - context.problems_correct / Math.max(context.problems_attempted, 1)) * 0.3;
  const restWeight = Math.min(context.time_since_last_rest / 30, 1.0) * 0.3;

  return timeWeight + errorWeight + restWeight;
}
```

## Moodle Plugin Integration

### Plugin Structure
```
moodle/local/dmnrest/
├── version.php
├── lib.php
├── settings.php
├── lang/
│   ├── en/
│   │   └── local_dmnrest.php
│   └── ko/
│       └── local_dmnrest.php
├── classes/
│   ├── api_client.php          // REST API communication
│   ├── event_observer.php      // Quiz event listeners
│   └── rest_routine_display.php // UI rendering
├── amd/src/
│   └── rest_routine.js         // JavaScript for interactive UI
├── styles.css
└── db/
    └── events.php              // Event observer registration
```

### Event Hooks

The plugin hooks into Moodle quiz events:

1. **\mod_quiz\event\attempt_started** - Before first question
2. **\mod_quiz\event\question_viewed** - Before each question
3. **\mod_quiz\event\question_answered** - After each question
4. **\mod_quiz\event\attempt_submitted** - After quiz completion

### Configuration Settings

Admin configurable settings in Moodle:
- **Enable DMN Rest Routines**: On/Off toggle
- **API Endpoint**: URL of the DMN REST API
- **API Key**: Authentication key
- **Trigger Strategy**:
  - Before every problem
  - Before complex problems only (complexity >= 3)
  - After every N problems
  - When fatigue detected
- **Allow Student Skip**: Whether students can skip rest routines
- **Minimum Rest Interval**: Minimum time between rest suggestions (minutes)

## Integration Flow

### Scenario 1: Before Problem

```
1. Student starts quiz attempt in Moodle
   ↓
2. Moodle plugin detects attempt_started event
   ↓
3. Plugin calls POST /api/dmn/suggest with context
   ↓
4. API analyzes context and returns routine
   ↓
5. Plugin displays rest routine UI in Moodle
   ↓
6. Student completes routine (or skips)
   ↓
7. Plugin calls POST /api/dmn/complete
   ↓
8. Moodle proceeds to first question
```

### Scenario 2: After Problem

```
1. Student answers a question
   ↓
2. Moodle plugin detects question_answered event
   ↓
3. Plugin checks if rest routine is needed
   ↓
4. Plugin calls POST /api/dmn/suggest
   ↓
5. API determines routine based on complexity + fatigue
   ↓
6. Plugin displays rest routine
   ↓
7. Student completes routine
   ↓
8. Plugin records completion
   ↓
9. Moodle proceeds to next question
```

## Technology Stack

### Backend API
- **Runtime**: Node.js 18+ with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma or TypeORM
- **Validation**: Joi or Zod
- **Authentication**: API Key + JWT (for future)
- **Logging**: Winston
- **Testing**: Jest

### Moodle Plugin
- **Language**: PHP 7.1+ (compatible with Moodle 3.7)
- **Database**: Uses Moodle's MySQL 5.7
- **JavaScript**: ES5 compatible (Moodle 3.7 limitations)
- **AJAX**: Moodle's AJAX framework
- **Styling**: Moodle's Bootstrap 4

### Deployment
- **API**: Docker container
- **Database**: PostgreSQL Docker container
- **Reverse Proxy**: Nginx
- **Environment**: Docker Compose for development

## Security Considerations

1. **API Authentication**
   - API key required for all requests
   - Rate limiting: 100 requests/minute per Moodle instance
   - CORS: Whitelist Moodle domain only

2. **Data Privacy**
   - Student IDs are hashed before storage
   - No PII stored in DMN system
   - Data retention: 1 year, then anonymized

3. **Moodle Plugin Security**
   - Capability checks (mod/quiz:attempt required)
   - XSS prevention (all output escaped)
   - SQL injection prevention (Moodle DML API)
   - CSRF protection (Moodle sesskey)

## Performance Considerations

1. **API Response Time**: Target < 200ms for suggestion endpoint
2. **Caching**: Cache routine definitions in Redis
3. **Database Indexing**: Indexes on all foreign keys and query fields
4. **Batch Analytics**: Calculate effectiveness metrics daily (not real-time)

## Future Enhancements

1. **Adaptive Learning**: ML model to predict optimal routines per student
2. **Biometric Integration**: Heart rate, eye tracking for fatigue detection
3. **Multi-language Support**: Routine instructions in Korean, English, others
4. **Mobile App**: Native iOS/Android for routine guides
5. **Social Features**: Group rest routines for classroom settings
6. **VR Integration**: Virtual reality guided meditation/visualization

## Success Metrics

1. **Completion Rate**: % of suggested routines actually completed (target: > 70%)
2. **Effectiveness**: Improvement in problem accuracy after rest (target: > 10%)
3. **Student Satisfaction**: Average feedback rating (target: > 4.0/5.0)
4. **Engagement**: % of students who regularly use routines (target: > 60%)
5. **Performance**: API response time (target: < 200ms p95)
