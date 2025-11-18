# Reading Time Tracking & Comprehension Summary - Architecture Deep Dive

## System Flow Diagram

### Complete Data Flow for Reading Time Tracking

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Student Reading Interface                                     │  │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │  │
│  │ │ Problem Display  │  │ Reading Timer    │  │ Feedback    │ │  │
│  │ │ (with text)      │  │ (starts on load) │  │ Components  │ │  │
│  │ └──────────────────┘  └──────────────────┘  └─────────────┘ │  │
│  │         │                     │                     │          │  │
│  │         └─────────────────────┼─────────────────────┘          │  │
│  │                               │                                 │  │
│  │         Event Stream: { time, scrolls, clicks, focus_lost }   │  │
│  └──────────────────────┬────────────────────────────────────────┘  │
│                         │ Socket.io / Batched POST                  │
├─────────────────────────▼─────────────────────────────────────────┤
│                    API GATEWAY (Node.js)                            │
│         POST /api/modules/{id}/reading-analytics                    │
│         ┌────────────────────────────────┐                         │
│         │ ✓ Authentication (JWT)         │                         │
│         │ ✓ Rate limiting                │                         │
│         │ ✓ Request validation           │                         │
│         │ ✓ Routing to backend           │                         │
│         └────────────────────┬───────────┘                         │
├─────────────────────────────▼─────────────────────────────────────┤
│         AI PIPELINE ORCHESTRATOR (Python FastAPI)                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Reading Analytics Handler                                  │  │
│  │  1. Parse request (student, problem, timestamps, events)  │  │
│  │  2. Call: reading_analytics_service.recordMetrics()      │  │
│  │  3. Trigger: comprehension_calculator.compute()          │  │
│  │  4. Store: reading_analytics table (PostgreSQL)          │  │
│  │                                                            │  │
│  │ Comprehension Score Calculator                           │  │
│  │  - reading_speed_wpm = words_in_problem / (time_sec/60) │  │
│  │  - baseline_speed = query historical avg for grade/type  │  │
│  │  - accuracy_score = 100 if first_attempt_correct else... │  │
│  │  - comprehension_score = WEIGHTED_AVERAGE(...)           │  │
│  │                                                            │  │
│  │ AI Summary Generator (Claude API Integration)            │  │
│  │  - Triggered on demand or scheduled                      │  │
│  │  - Uses Claude API with structured prompts              │  │
│  │  - Caches results in Redis (24 hour TTL)                 │  │
│  │  - Fallback: template-based summary if API fails        │  │
│  └────────────────────┬───────────────────────────────────┘  │
├─────────────────────▼─────────────────────────────────────────┤
│                    DATA LAYER                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL 15+                                       │   │
│  │                                                      │   │
│  │ reading_analytics TABLE:                            │   │
│  │ ┌──────────────────────────────────────────────┐   │   │
│  │ │ id | student_id | problem_id | module_id    │   │   │
│  │ │ reading_time_seconds | words | reading_wpm  │   │   │
│  │ │ re_reading_count | time_before_first_action │   │   │
│  │ │ first_attempt_correct | total_attempts      │   │   │
│  │ │ hint_count | comprehension_score            │   │   │
│  │ │ reading_difficulty_match | created_at       │   │   │
│  │ │ Indexes: (student_id), (problem_id),        │   │   │
│  │ │          (module_id), (created_at)          │   │   │
│  │ └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │ comprehension_summaries TABLE:                      │   │
│  │ ┌──────────────────────────────────────────────┐   │   │
│  │ │ id | student_id | module_id | period        │   │   │
│  │ │ avg_reading_time | avg_reading_speed        │   │   │
│  │ │ comprehension_score_avg | problems_too_*    │   │   │
│  │ │ generated_summary (TEXT) | recommendations  │   │   │
│  │ │ created_at | updated_at                     │   │   │
│  │ │ Indexes: (student_id, module_id, period)   │   │   │
│  │ └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │ Aggregation Queries (for dashboards):             │   │
│  │ - SELECT AVG(reading_time) BY student, day      │   │
│  │ - SELECT percentile_cont(...) BY grade_level    │   │
│  │ - SELECT COUNT(*) WHERE comprehension < 60      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Redis 7+                                         │   │
│  │ - Cache: AI-generated summaries (24h TTL)       │   │
│  │ - Session: Active reading timers                │   │
│  │ - Metrics: Pre-calculated class averages        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Claude API (Anthropic)                           │   │
│  │ - Generate comprehension summaries               │   │
│  │ - Provide recommendations                        │   │
│  │ - Detect intervention needs                      │   │
│  │ - Cost tracking per request                      │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
        ▲                                           ▲
        │                                           │
        └────────────────────┬──────────────────────┘
                             │
                    Data retrieval for
                     dashboards/reports
```

---

## Component Interaction Diagram

### How Components Work Together

```
STUDENT FLOW:
─────────────

┌──────────────────────────────┐
│ Student Opens Problem        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ ReadingProgressIndicator     │ (Component)
│ - Starts timer on mount      │
│ - Tracks: reading_time_sec   │
│ - Updates every 100ms        │
└──────────────┬───────────────┘
               │ Real-time updates
               ▼
┌──────────────────────────────┐
│ useReadingTimer Hook         │ (Custom Hook)
│ - Manages timer state        │
│ - Emits to Socket.io         │
│ - Tracks re-reading events   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ ComprehensionFeedback Component  │
│ - Real-time feedback             │
│ - "Reading too slowly..."        │
│ - "You're rushing, slow down"    │
│ - Based on: reading_speed vs avg │
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Socket.io / readingMetricsApi    │
│ POST /reading-analytics          │
│ { student, problem, metrics... } │
└──────────────┬──────────────────┘
               │
               ▼
        BACKEND PROCESSING
        (See above diagram)
               │
               ▼
┌──────────────────────────────────┐
│ Reading Data Stored              │
│ reading_analytics table          │
└──────────────┬──────────────────┘
               │
               ▼
   (End of problem attempt)


TEACHER/SUMMARY FLOW:
────────────────────

┌──────────────────────────────┐
│ Teacher Requests Insights    │
│ (button click)               │
└──────────────┬───────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ API: GET /comprehension-analytics      │
│ Params: student_id, module_id, period  │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Backend Check Redis Cache              │
│ Key: "comprehension:{sid}:{mid}:{per}" │
└──────────────┬─────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
      HIT       MISS
         │           │
         ▼           ▼
    Return      Query Database
     Cache      & Aggregate
         │           │
         └─────┬─────┘
               │
               ▼
┌────────────────────────────────────────┐
│ If summary needed:                     │
│ ai_summary_generator.generateSummary() │
│ Claude API call with prompt template   │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Store in Redis (24h TTL)               │
│ Return summary to frontend             │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Frontend Component: SummaryCard        │
│ Display: avg_reading_time, speed,      │
│ comprehension_score, recommendations   │
└────────────────────────────────────────┘
```

---

## Database Schema with Indexes

### Reading Analytics Table (Primary Data Store)

```sql
CREATE TABLE reading_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    
    -- Reading Metrics
    reading_time_seconds INTEGER NOT NULL CHECK (reading_time_seconds >= 0),
    words_in_problem INTEGER NOT NULL CHECK (words_in_problem > 0),
    reading_speed_wpm FLOAT GENERATED ALWAYS AS (
        words_in_problem * 60.0 / GREATEST(reading_time_seconds, 1)
    ) STORED,
    
    -- Engagement Metrics
    re_reading_count INTEGER DEFAULT 0 CHECK (re_reading_count >= 0),
    time_before_first_action INTEGER NOT NULL CHECK (time_before_first_action >= 0),
    scroll_depth_percent INTEGER CHECK (scroll_depth_percent BETWEEN 0 AND 100),
    
    -- Problem Difficulty
    problem_difficulty_level INTEGER CHECK (problem_difficulty_level BETWEEN 1 AND 5),
    problem_type VARCHAR(50) NOT NULL,
    
    -- Comprehension Indicators
    first_attempt_correct BOOLEAN NOT NULL,
    total_attempts INTEGER NOT NULL CHECK (total_attempts >= 1),
    time_to_correct_seconds INTEGER CHECK (time_to_correct_seconds IS NULL OR time_to_correct_seconds >= 0),
    hint_usage_count INTEGER DEFAULT 0 CHECK (hint_usage_count >= 0),
    
    -- Calculated Metrics
    comprehension_score FLOAT CHECK (comprehension_score BETWEEN 0 AND 100),
    reading_difficulty_match VARCHAR(20) CHECK (reading_difficulty_match IN ('too_easy', 'appropriate', 'too_hard')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_attempts CHECK (total_attempts >= 1),
    CONSTRAINT time_consistency CHECK (time_to_correct_seconds IS NULL OR time_to_correct_seconds >= reading_time_seconds)
);

-- Indexes for Query Performance
CREATE INDEX idx_reading_student ON reading_analytics(student_id);
CREATE INDEX idx_reading_problem ON reading_analytics(problem_id);
CREATE INDEX idx_reading_module ON reading_analytics(module_id);
CREATE INDEX idx_reading_created ON reading_analytics(created_at DESC);
CREATE INDEX idx_reading_student_module_date ON reading_analytics(student_id, module_id, DATE(created_at));
CREATE INDEX idx_reading_comprehension_score ON reading_analytics(comprehension_score) WHERE comprehension_score < 60;

-- Partial Index for Recent Data (optimization for dashboards)
CREATE INDEX idx_reading_recent ON reading_analytics(student_id, module_id, created_at DESC)
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';
```

### Comprehension Summaries Table (Aggregated Reporting)

```sql
CREATE TABLE comprehension_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    
    -- Aggregated Metrics
    total_problems_attempted INTEGER NOT NULL DEFAULT 0,
    avg_reading_time_seconds FLOAT NOT NULL,
    avg_reading_speed_wpm FLOAT NOT NULL,
    median_reading_time_seconds FLOAT NOT NULL,
    std_dev_reading_speed FLOAT,
    
    -- Comprehension Metrics
    comprehension_score_avg FLOAT NOT NULL CHECK (comprehension_score_avg BETWEEN 0 AND 100),
    comprehension_score_min FLOAT,
    comprehension_score_max FLOAT,
    
    -- Problem Difficulty Analysis
    problems_too_easy_count INTEGER DEFAULT 0,
    problems_too_easy_ratio FLOAT GENERATED ALWAYS AS (
        CASE WHEN total_problems_attempted > 0 
             THEN problems_too_easy_count::FLOAT / total_problems_attempted 
             ELSE 0 END
    ) STORED,
    
    problems_appropriate_count INTEGER DEFAULT 0,
    problems_too_hard_count INTEGER DEFAULT 0,
    problems_too_hard_ratio FLOAT GENERATED ALWAYS AS (
        CASE WHEN total_problems_attempted > 0 
             THEN problems_too_hard_count::FLOAT / total_problems_attempted 
             ELSE 0 END
    ) STORED,
    
    -- Accuracy Metrics
    first_attempt_success_rate FLOAT NOT NULL CHECK (first_attempt_success_rate BETWEEN 0 AND 1),
    avg_total_attempts FLOAT NOT NULL,
    
    -- AI-Generated Content
    generated_summary TEXT,
    ai_generation_timestamp TIMESTAMP,
    recommendations TEXT,
    intervention_needed BOOLEAN DEFAULT FALSE,
    intervention_level VARCHAR(20) CHECK (intervention_level IN ('none', 'monitor', 'immediate')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_id, module_id, period_start, period_type)
);

-- Indexes
CREATE INDEX idx_summaries_student ON comprehension_summaries(student_id);
CREATE INDEX idx_summaries_module ON comprehension_summaries(module_id);
CREATE INDEX idx_summaries_period ON comprehension_summaries(period_start, period_type);
CREATE INDEX idx_summaries_intervention ON comprehension_summaries(intervention_needed, module_id);

-- Materialized View for Class-Level Analytics
CREATE MATERIALIZED VIEW class_comprehension_stats AS
SELECT
    module_id,
    DATE_TRUNC('day', created_at)::DATE as date,
    COUNT(DISTINCT student_id) as total_students,
    AVG(comprehension_score_avg) as class_avg_comprehension,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY comprehension_score_avg) as q1_comprehension,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY comprehension_score_avg) as q3_comprehension,
    COUNT(*) FILTER (WHERE intervention_needed = TRUE) as students_needing_help
FROM comprehension_summaries
GROUP BY module_id, DATE_TRUNC('day', created_at)::DATE;

CREATE INDEX idx_class_stats_module_date ON class_comprehension_stats(module_id, date DESC);
```

---

## API Endpoint Specifications

### 1. Record Reading Metrics (Real-time Data Capture)

```
Endpoint: POST /api/modules/{module_id}/reading-analytics
Authentication: JWT Bearer Token
Rate Limit: 1000 req/hour per student

Request Body:
{
    "student_id": "uuid",
    "problem_id": "uuid",
    "reading_time_seconds": 45,
    "words_in_problem": 120,
    "reading_speed_wpm": 160,  // calculated frontend
    "re_reading_count": 2,
    "time_before_first_action": 8,
    "scroll_depth_percent": 85,
    "problem_difficulty_level": 3,
    "problem_type": "fraction_addition",
    "first_attempt_correct": true,
    "total_attempts": 1,
    "time_to_correct_seconds": 45,
    "hint_usage_count": 0,
    "comprehension_score": 92,  // calculated frontend
    "reading_difficulty_match": "appropriate"
}

Response (201 Created):
{
    "id": "uuid",
    "status": "recorded",
    "message": "Reading metrics saved successfully",
    "feedback": {
        "reading_status": "appropriate_pace",
        "comprehension_level": "excellent",
        "next_problem_difficulty": "increase"
    }
}

Error Cases:
- 400 Bad Request: Invalid metric values
- 401 Unauthorized: Invalid JWT
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Database error
```

### 2. Get Student Comprehension Analytics (Dashboard Data)

```
Endpoint: GET /api/modules/{module_id}/student/{student_id}/comprehension
Authentication: JWT Bearer Token
Query Parameters:
  - period: "daily" | "weekly" | "monthly" (default: weekly)
  - days: 30 (number of days to look back, default: 30)

Response (200 OK):
{
    "student_id": "uuid",
    "module_id": "uuid",
    "period": "weekly",
    "summaries": [
        {
            "period_start": "2025-11-11",
            "period_end": "2025-11-17",
            "total_problems_attempted": 25,
            "avg_reading_time_seconds": 42.5,
            "avg_reading_speed_wpm": 169,
            "comprehension_score_avg": 87,
            "first_attempt_success_rate": 0.88,
            "problems_too_easy_ratio": 0.12,
            "problems_too_hard_ratio": 0.08,
            "generated_summary": "...",  // From comprehension_summaries table
            "recommendations": "..."
        },
        // ... more weeks
    ],
    "trend": {
        "reading_speed_trend": "improving",  // improving | stable | declining
        "comprehension_trend": "stable",     // improving | stable | declining
        "efficiency_trend": "improving"      // reading faster with better comprehension
    },
    "alerts": [
        {
            "type": "comprehension_decline",
            "severity": "medium",
            "message": "Comprehension score dropping in last 3 days"
        }
    ]
}

Caching: 1 hour (Redis)
```

### 3. Generate AI Comprehension Report

```
Endpoint: POST /api/modules/{module_id}/generate-comprehension-report
Authentication: JWT Bearer Token (admin/teacher)
Rate Limit: 50 req/hour per module

Request Body:
{
    "student_id": "uuid",
    "period": "weekly",
    "focus_areas": ["reading_speed", "comprehension", "retention"],
    "include_recommendations": true,
    "student_grade_level": 4
}

Response (200 OK):
{
    "report_id": "uuid",
    "generated_at": "2025-11-18T12:30:00Z",
    "student_id": "uuid",
    
    "summary": "Sarah demonstrates strong reading comprehension with an average score of 87. However, her reading speed of 158 WPM is 15% below the class average of 186 WPM. She shows consistent improvement in complex problem types.",
    
    "metrics": {
        "reading_speed": {
            "value": 158,
            "unit": "wpm",
            "class_average": 186,
            "status": "below_average",
            "trend": "improving"
        },
        "comprehension": {
            "value": 87,
            "status": "excellent",
            "trend": "stable"
        }
    },
    
    "recommendations": [
        {
            "category": "reading_strategies",
            "priority": "high",
            "action": "Focus on pre-reading strategy - review problem briefly before solving",
            "expected_impact": "Could improve reading speed by 10-15%"
        },
        {
            "category": "problem_difficulty",
            "priority": "medium",
            "action": "Gradually introduce more complex multi-step problems",
            "expected_impact": "Maintain comprehension while building problem-solving skills"
        }
    ],
    
    "intervention_needed": false,
    "intervention_level": "none",
    
    "next_actions": [
        "Continue current difficulty level",
        "Monitor reading speed improvement over next 2 weeks",
        "Celebrate consistency in first-attempt success"
    ]
}

Note: Uses Claude API with cached results (24h TTL in Redis)
Cost: ~$0.002-0.005 per request
```

### 4. Class-Level Comprehension Dashboard

```
Endpoint: GET /api/modules/{module_id}/class/comprehension-analytics
Authentication: JWT Bearer Token (teacher/admin)
Query Parameters:
  - date: "2025-11-18" (specific date, default: today)

Response (200 OK):
{
    "module_id": "uuid",
    "date": "2025-11-18",
    "class_statistics": {
        "total_students": 28,
        "students_attempted_today": 24,
        "avg_comprehension_score": 81,
        "q1_comprehension": 74,
        "q3_comprehension": 89,
        "comprehension_score_std_dev": 8.2
    },
    
    "students_needing_help": [
        {
            "student_id": "uuid",
            "name": "Alex Chen",
            "comprehension_score": 52,
            "reading_speed_wpm": 95,
            "intervention_level": "immediate",
            "issues": ["reading too slowly", "low comprehension", "multiple attempts needed"],
            "suggested_actions": [
                "Check for reading difficulties",
                "Provide additional scaffolding",
                "Use simpler problem statements"
            ]
        },
        // ... more students
    ],
    
    "high_performers": [
        {
            "student_id": "uuid",
            "name": "Jordan Park",
            "comprehension_score": 98,
            "reading_speed_wpm": 215,
            "achievement": "Excellence in comprehension and efficiency"
        }
    ],
    
    "insights": [
        "30% of students reading below baseline speed",
        "Comprehension scores improved 5% this week",
        "Problem type 'complex_fractions' has 40% lower comprehension"
    ],
    
    "class_summary": "Class is tracking well overall. Focus on struggling readers and consider revisiting complex fraction notation."
}

Caching: 4 hours (updated less frequently)
```

---

## State Management (Frontend)

### Redux Store Structure

```typescript
// Store shape
type ReadingState = {
    // Current reading session
    currentSession: {
        problem_id: string;
        student_id: string;
        started_at: timestamp;
        reading_time_seconds: number;
        reread_count: number;
        events: ReadingEvent[];
    } | null;
    
    // Cached summaries
    summaries: Record<string, ComprehensionSummary>;
    
    // Dashboard data
    analytics: {
        daily: AnalyticsData[];
        weekly: AnalyticsData[];
        monthly: AnalyticsData[];
    };
    
    // UI state
    ui: {
        loading: boolean;
        error: string | null;
        selectedPeriod: 'daily' | 'weekly' | 'monthly';
    };
};

// Actions
- START_READING_SESSION
- END_READING_SESSION
- RECORD_READING_EVENT
- UPDATE_COMPREHENSION_SCORE
- FETCH_ANALYTICS_START
- FETCH_ANALYTICS_SUCCESS
- FETCH_ANALYTICS_ERROR
- GENERATE_SUMMARY_START
- GENERATE_SUMMARY_SUCCESS
```

---

## Performance Optimizations

### Query Optimization

1. **Aggregation Strategy**
   - Store raw events in `reading_analytics`
   - Pre-compute daily summaries in `comprehension_summaries`
   - Use materialized view for class-level stats
   - Update materialized view nightly

2. **Index Strategy**
   - Composite indexes for common query patterns
   - Partial indexes for active/recent data
   - Covering indexes for dashboard queries

3. **Caching Strategy**
   - Redis TTL 1h for student summaries
   - Redis TTL 4h for class summaries
   - Redis TTL 24h for AI-generated summaries
   - Cache invalidation on new problem attempts

### Data Retention Policy

```python
# Archive old raw data
- Keep 6 months of detailed reading_analytics
- Archive older data to cold storage
- Keep all comprehension_summaries indefinitely

# Cleanup job (runs nightly)
DELETE FROM reading_analytics
WHERE created_at < CURRENT_DATE - INTERVAL '180 days'
AND student_id NOT IN (SELECT id FROM students WHERE is_active = true);
```

---

## Error Handling & Resilience

### API Error Responses

```json
{
    "error": {
        "code": "READING_TIMEOUT",
        "message": "Failed to record reading metrics",
        "details": "Database connection timeout after 30s",
        "timestamp": "2025-11-18T12:30:00Z",
        "request_id": "uuid",
        "retry_after": 5
    }
}
```

### Fallback Strategies

1. **Claude API Failure**
   - Use template-based summary
   - Log error for monitoring
   - Return cached summary if available
   - Queue for retry

2. **Database Connection Issue**
   - Return cached summary from Redis
   - Batch metrics for retry
   - Alert admin if persistent

3. **Metric Calculation Error**
   - Skip comprehension score calculation
   - Return raw metrics
   - Flag for manual review

---

## Security Considerations

### Data Privacy

1. **Student Data Protection**
   - Encrypt reading_analytics at rest (AES-256)
   - TLS 1.3 for all data transmission
   - Separate read permissions for students/teachers
   - FERPA compliance audit logging

2. **Access Control**
   - Students can only view their own metrics
   - Teachers can view their class metrics
   - Admins have full access
   - Maintain audit log of all access

3. **Data Retention**
   - Anonymous aggregated data after 1 year
   - Delete on student withdrawal
   - Comply with FERPA deletion requests

---

## Monitoring & Alerting

### Key Metrics to Track

```
- API endpoint latencies (target: <200ms)
- Summary generation success rate (target: >99%)
- Claude API cost per month
- Cache hit ratio (target: >70%)
- Database query performance (slow query log)
```

### Alerts to Configure

```
- Comprehension API p95 latency > 500ms
- Claude API failures > 1% in 1h window
- Database connection pool exhausted
- Student attempting 50+ problems in 1 hour (suspicious)
- Cache hit ratio drops below 50%
```

