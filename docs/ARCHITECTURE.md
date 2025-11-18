# System Architecture

## Overview

The AI Thinking Routine Engine is a multi-layered system that analyzes student learning patterns in Moodle LMS and generates personalized, AI-powered study recommendations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  (React/Vue/Angular - Not Included, Use REST API)               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                     FastAPI (Python 3.11+)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                               │  │
│  │  • /students/{id}/analysis                               │  │
│  │  • /courses/{id}/analytics                               │  │
│  │  • /students/{id}/courses/{id}/recommendations           │  │
│  │  • /students/{id}/courses/{id}/routine                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌──────────────┐
│  Moodle Data   │ │ AI Service │ │ Cache Layer  │
│  Service       │ │  (Claude)  │ │   (Redis)    │
└────────┬───────┘ └─────┬──────┘ └──────┬───────┘
         │               │                │
         ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Moodle MySQL    │  │  PostgreSQL      │  │    Redis     │ │
│  │  (Read-Only)     │  │  (Analytics DB)  │  │   (Cache)    │ │
│  │                  │  │                  │  │              │ │
│  │  • mdl_user      │  │  • analysis_cache│  │  • Sessions  │ │
│  │  • mdl_logs      │  │  • routines      │  │  • Results   │ │
│  │  • mdl_quiz_*    │  │  • patterns      │  │              │ │
│  │  • mdl_grades    │  │  • ai_logs       │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. API Gateway Layer (FastAPI)

**Responsibility**: HTTP request handling, routing, validation

**Technologies**:
- FastAPI 0.104+
- Uvicorn ASGI server
- Pydantic for validation

**Key Features**:
- RESTful API design
- Automatic OpenAPI documentation
- Input validation and serialization
- CORS handling
- Error handling and logging

**Endpoints Structure**:
```python
/api/v1/
├── students/
│   ├── {user_id}/analysis
│   └── {user_id}/courses/{course_id}/
│       ├── recommendations
│       ├── routine
│       └── gap-analysis
└── courses/
    └── {course_id}/
        ├── analytics
        └── leaderboard
```

### 2. Service Layer

#### 2.1 Moodle Data Service

**Responsibility**: Extract and process data from Moodle database

**Key Functions**:
- `get_user_logs()`: Extract activity logs
- `extract_learning_sessions()`: Identify learning sessions from logs
- `get_quiz_performance()`: Calculate quiz metrics
- `get_forum_participation()`: Track engagement
- `analyze_time_of_day_patterns()`: Time analysis
- `get_all_student_grades()`: Course-wide grade data

**Data Extracted**:
```
┌─────────────────────────────────────┐
│ Student Activity Data               │
├─────────────────────────────────────┤
│ • Total learning sessions           │
│ • Average session duration          │
│ • Total time spent                  │
│ • Completion rate                   │
│ • Average grades                    │
│ • Quiz attempts and scores          │
│ • Forum posts count                 │
│ • Resource views                    │
│ • Time-of-day patterns              │
│ • Peak performance time             │
│ • Learning velocity                 │
└─────────────────────────────────────┘
```

**Session Extraction Algorithm**:
```python
1. Sort logs by timestamp
2. Initialize session = None
3. For each log entry:
   a. If no current session, start new session
   b. Calculate gap from last activity
   c. If gap > 30 minutes:
      - Close current session
      - Start new session
   d. Else:
      - Add to current session
4. Close final session
5. Return all sessions
```

#### 2.2 Analysis Service

**Responsibility**: Analyze patterns and generate insights

**Key Functions**:
- `analyze_student_comprehensive()`: Full student analysis
- `analyze_top_performers()`: Identify success patterns
- `generate_personalized_recommendations()`: Create recommendations
- `calculate_learning_velocity()`: Measure improvement rate
- `generate_gap_analysis()`: Compare to benchmarks

**Analysis Pipeline**:
```
┌───────────────┐
│ Raw Data      │
│ (Logs, Grades)│
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌──────────────────┐
│ Session       │────▶│ Time Patterns    │
│ Extraction    │     │ (Morning/Evening)│
└───────┬───────┘     └──────────────────┘
        │
        ▼
┌───────────────┐     ┌──────────────────┐
│ Performance   │────▶│ Learning         │
│ Metrics       │     │ Velocity         │
└───────┬───────┘     └──────────────────┘
        │
        ▼
┌───────────────┐
│ Top Performer │
│ Comparison    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Gap Analysis  │
└───────────────┘
```

**Learning Velocity Calculation**:
```python
# Linear regression on quiz grades over time
velocity = (n * Σ(xy) - Σx * Σy) / (n * Σ(x²) - (Σx)²)

Where:
- x = attempt number (1, 2, 3, ...)
- y = grade for each attempt
- n = total attempts

Positive velocity = improving
Negative velocity = declining
Zero velocity = stagnant
```

#### 2.3 AI Service (Claude Integration)

**Responsibility**: Generate intelligent recommendations using Claude AI

**Key Functions**:
- `generate_thinking_routine()`: Create personalized routines
- `generate_recommendations()`: Generate action items
- `analyze_learning_patterns()`: Identify patterns

**Prompt Engineering Strategy**:
```
┌─────────────────────────────────────────┐
│ Prompt Structure                         │
├─────────────────────────────────────────┤
│ 1. Role Definition                      │
│    "You are an expert educational       │
│     psychologist..."                    │
│                                          │
│ 2. Context (Student Data)               │
│    - Current performance metrics        │
│    - Top performer benchmarks           │
│    - Identified gaps                    │
│                                          │
│ 3. Task Description                     │
│    - Specific output required           │
│    - Format specification (JSON)        │
│                                          │
│ 4. Constraints                          │
│    - Evidence-based only                │
│    - Actionable items                   │
│    - Prioritized by impact              │
│                                          │
│ 5. Output Format                        │
│    - JSON schema                        │
│    - Required fields                    │
└─────────────────────────────────────────┘
```

**Token Optimization**:
- Use Claude Sonnet (balanced cost/performance)
- Structured JSON output reduces tokens
- Cache frequently used prompts
- Batch similar requests
- Target: <$5 per student analysis

### 3. Data Layer

#### 3.1 Moodle MySQL Database (Read-Only)

**Purpose**: Source of truth for learning data

**Key Tables Used**:
```sql
mdl_user                      -- Student information
mdl_logstore_standard_log     -- Activity logs
mdl_quiz                      -- Quiz definitions
mdl_quiz_attempts             -- Quiz attempts
mdl_quiz_grades               -- Quiz grades
mdl_grade_grades              -- Overall grades
mdl_grade_items               -- Grade items
mdl_forum_posts               -- Forum participation
mdl_course_modules            -- Course activities
mdl_course_modules_completion -- Completion tracking
```

**Security**:
- Read-only user (SELECT only)
- No write operations
- Network isolation (private network)
- Connection pooling
- Prepared statements (SQL injection prevention)

#### 3.2 PostgreSQL Analytics Database

**Purpose**: Cache analysis results, store patterns, log AI interactions

**Schema**:
```sql
analysis_cache
├── id (PK)
├── cache_key (UNIQUE)
├── cache_type
├── user_id
├── course_id
├── data (JSONB)
├── created_at
└── expires_at

thinking_routines
├── id (PK)
├── user_id
├── course_id
├── routine_type
├── morning_routine (TEXT)
├── study_approach (TEXT)
├── problem_solving_steps (TEXT)
├── review_schedule (TEXT)
├── metadata (JSONB)
├── effectiveness_score
├── created_at
└── updated_at

performance_snapshots
├── id (PK)
├── user_id
├── course_id
├── snapshot_date
├── overall_grade
├── percentile_rank
├── metrics (JSONB)
└── created_at

ai_interactions
├── id (PK)
├── interaction_type
├── prompt (TEXT)
├── response (TEXT)
├── model
├── tokens_used
├── latency_ms
├── success
└── created_at

learning_patterns
├── id (PK)
├── course_id
├── pattern_type
├── pattern_name
├── description
├── frequency
├── impact_score
├── evidence (JSONB)
└── created_at
```

**Indexes**:
```sql
CREATE INDEX idx_cache_key ON analysis_cache(cache_key);
CREATE INDEX idx_routines_user_course ON thinking_routines(user_id, course_id);
CREATE INDEX idx_snapshots_user_date ON performance_snapshots(user_id, snapshot_date);
CREATE INDEX idx_ai_type_time ON ai_interactions(interaction_type, created_at);
```

#### 3.3 Redis Cache

**Purpose**: High-speed caching of frequently accessed data

**Cache Strategy**:
```
Key Pattern: {type}:{identifier}
TTL: Based on data volatility

Examples:
- student:123:course:5:analysis  (TTL: 1 hour)
- course:5:top_performers        (TTL: 6 hours)
- pattern:course:5               (TTL: 24 hours)
```

**Cache Invalidation**:
- Time-based expiration
- Manual invalidation on data updates
- Least Recently Used (LRU) eviction

## Data Flow

### Analysis Request Flow

```
1. Client Request
   GET /students/123/courses/5/recommendations
   │
   ▼
2. API Gateway
   • Validate input
   • Check authentication
   │
   ▼
3. Check Redis Cache
   • Key: student:123:course:5:recommendations
   │
   ├─── Cache Hit ──▶ Return cached data
   │
   └─── Cache Miss
        │
        ▼
4. Moodle Data Service
   • Extract logs, grades, activities
   • Process into metrics
   │
   ▼
5. Analysis Service
   • Analyze student performance
   • Get top performer patterns
   • Calculate gaps
   │
   ▼
6. AI Service
   • Send data to Claude
   • Generate recommendations
   • Generate thinking routine
   │
   ▼
7. Store Results
   • Save to PostgreSQL
   • Cache in Redis
   │
   ▼
8. Return Response
   • JSON formatted
   • Include recommendations, routine, gaps
```

### Top Performer Analysis Flow

```
1. Get all student grades
   │
   ▼
2. Sort by performance
   │
   ▼
3. Select top percentile (default 10%)
   │
   ▼
4. For each top performer:
   │ ├─ Extract activity data
   │ ├─ Calculate metrics
   │ └─ Identify patterns
   │
   ▼
5. Aggregate patterns
   │ ├─ Average session duration
   │ ├─ Average frequency
   │ ├─ Common time preferences
   │ └─ Behavioral patterns
   │
   ▼
6. AI Pattern Recognition
   │ • Send to Claude
   │ • Identify non-obvious patterns
   │
   ▼
7. Merge statistical + AI patterns
   │
   ▼
8. Rank by impact score
   │
   ▼
9. Return top patterns
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Multiple API instances behind load balancer
- Distributed caching with Redis Cluster

### Vertical Scaling
- Database query optimization
- Connection pooling
- Async I/O operations

### Performance Optimization
- Database indexing strategy
- Query result caching
- AI prompt optimization
- Background job processing

### Load Handling
```
Expected Load:
- 1000 students per course
- 100 courses
- Total: 100,000 students

Analysis frequency:
- Weekly full analysis: 14,285 requests/day
- Daily quick checks: 100,000 requests/day

Capacity:
- API: 100 req/s (single instance)
- Database: 1000 queries/s
- Redis: 10,000 ops/s
- AI: 50 req/min (rate limited by Anthropic)

Scaling strategy:
- 5 API instances = 500 req/s
- Background queue for AI requests
- Cache hit ratio > 80%
```

## Security Architecture

### Authentication & Authorization
```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ JWT Token
       ▼
┌──────────────┐
│  API Gateway │ ◀─── Verify token
└──────┬───────┘
       │ User ID
       ▼
┌──────────────┐
│  Authorization│ ◀─── Check permissions
│  Middleware   │       (Student own data,
└──────┬───────┘        Teacher course data,
       │                Admin all data)
       ▼
┌──────────────┐
│   Service    │
│   Layer      │
└──────────────┘
```

### Data Security
- TLS/SSL for all connections
- Database credentials in environment variables
- No PII in logs
- API key rotation
- Rate limiting

## Monitoring & Observability

### Metrics
- API response times
- Database query performance
- Cache hit ratios
- AI token usage
- Error rates

### Logging
- Structured JSON logs
- Request/response logging
- Error stack traces
- AI interaction audit trail

### Alerting
- API downtime
- Database connection failures
- High error rates
- AI API quota exceeded

## Deployment Architecture

### Docker Compose (Development)
```yaml
services:
  - api (FastAPI)
  - postgres (Analytics DB)
  - redis (Cache)
  - moodle (Optional)
  - mysql (Optional)
```

### Production (Kubernetes)
```
┌─────────────────────────────────────┐
│         Load Balancer (nginx)        │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐         ┌─────────┐
│ API Pod │         │ API Pod │
│ (x3)    │         │ (x3)    │
└────┬────┘         └────┬────┘
     │                   │
     └─────────┬─────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────┐        ┌──────────┐
│PostgreSQL│        │  Redis   │
│  (RDS)   │        │(ElastiCache)│
└──────────┘        └──────────┘
```

## Future Enhancements

1. **Real-time Analytics**: WebSocket support for live updates
2. **ML Models**: Train custom models on historical data
3. **A/B Testing**: Test different recommendation strategies
4. **Gamification**: Progress tracking and achievements
5. **Mobile App**: Native iOS/Android apps
6. **Integration Hub**: Connect with other LMS platforms
