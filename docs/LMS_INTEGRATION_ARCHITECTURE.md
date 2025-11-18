# Moodle LMS Integration Architecture
## Daily Thinking Quality Score Evaluation System

**Version**: 1.0.0
**Date**: 2025-11-18
**Target LMS**: Moodle 3.7 (PHP 7.1.9, MySQL 5.7)

---

## 1. Overview

This document outlines the architecture for integrating the AI Education System Pipeline with Moodle LMS to enable daily automated evaluation of student thinking quality scores (사고 품질 점수).

### Goals
- **Automated Daily Evaluation**: Run quality assessments every day without manual intervention
- **Thinking Quality Metrics**: Evaluate student responses for depth, clarity, logical reasoning
- **Moodle Integration**: Seamlessly connect with existing Moodle 3.7 installation
- **Scalability**: Support 500-1000 students with efficient batch processing

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Moodle LMS (3.7)                            │
│              MySQL 5.7 | PHP 7.1.9                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Student Responses | Assignments | Quiz Attempts         │  │
│  └──────────────────────┬──────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │ Moodle Web Services API (REST/SOAP)
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│            LMS Integration Service (Python FastAPI)            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Moodle API Connector | Authentication | Data Sync        │ │
│  └──────────────────────┬───────────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│         Quality Score Evaluation Engine (Python + AI)          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Claude AI Integration | Thinking Analysis | Scoring      │ │
│  └──────────────────────┬───────────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│               Daily Scheduler (Celery + Redis)                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Cron: 02:00 KST | Batch Processing | Error Handling     │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Quality Scores | Student Responses | Evaluation History │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components

### 3.1 Moodle API Connector
**Purpose**: Interface with Moodle Web Services to fetch student data

**Technologies**:
- Python 3.11+
- `requests` library for HTTP communication
- Moodle Web Services API (REST)

**Key Functions**:
```python
- get_student_responses(course_id, assignment_id, date_range)
- get_quiz_attempts(quiz_id, date_range)
- get_forum_posts(forum_id, date_range)
- authenticate_moodle(token)
- sync_student_roster()
```

**Authentication**:
- Moodle Web Service Token (pre-generated in Moodle admin)
- Token stored securely in environment variables
- HTTPS/TLS for all API communications

### 3.2 Quality Score Evaluation Engine
**Purpose**: Analyze student thinking and assign quality scores

**Evaluation Criteria** (Based on Bloom's Taxonomy):
1. **Comprehension** (20%): Understanding of core concepts
2. **Analysis** (25%): Breaking down problems into components
3. **Synthesis** (25%): Combining ideas to form new understanding
4. **Logical Reasoning** (15%): Coherent argumentation
5. **Creativity** (10%): Novel approaches and insights
6. **Clarity** (5%): Clear expression of ideas

**Scoring System**:
- **Score Range**: 0-100 points
- **Grading Levels**:
  - 90-100: Exceptional thinking (A)
  - 80-89: Strong thinking (B)
  - 70-79: Adequate thinking (C)
  - 60-69: Developing thinking (D)
  - 0-59: Needs improvement (F)

**AI Integration**:
- Uses Claude 3 Sonnet for deep analysis
- Structured prompts for consistent evaluation
- Contextual understanding of subject matter (mathematics focus)

### 3.3 Daily Scheduler
**Purpose**: Automate daily quality score evaluation

**Schedule**:
- **Execution Time**: 02:00 KST (Korea Standard Time)
- **Frequency**: Daily
- **Duration**: 1-2 hours for 1000 students

**Task Flow**:
1. Fetch new responses from Moodle (previous 24 hours)
2. Filter responses needing evaluation
3. Batch process (50 responses per batch)
4. Evaluate thinking quality using AI
5. Store scores in database
6. Send summary report to administrators
7. Handle errors and retries

**Error Handling**:
- Retry failed evaluations (3 attempts)
- Alert administrators on persistent failures
- Log all errors for debugging

### 3.4 Database Schema
**Primary Database**: PostgreSQL 15+

**Key Tables**:

```sql
-- Moodle integration configuration
CREATE TABLE moodle_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_url VARCHAR(255) NOT NULL,
    api_token_encrypted TEXT NOT NULL,
    course_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student roster synced from Moodle
CREATE TABLE moodle_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    full_name VARCHAR(255),
    grade_level VARCHAR(20),
    enrolled_courses JSONB,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Student responses from Moodle
CREATE TABLE student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_student_id UUID REFERENCES moodle_students(id),
    moodle_user_id INTEGER NOT NULL,
    response_type VARCHAR(50), -- 'assignment', 'quiz', 'forum'
    activity_id INTEGER NOT NULL,
    activity_name VARCHAR(255),
    response_text TEXT,
    response_metadata JSONB, -- attachments, timestamps, etc.
    submitted_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    evaluation_status VARCHAR(50) DEFAULT 'pending',
    UNIQUE(moodle_user_id, activity_id, submitted_at)
);

-- Quality scores
CREATE TABLE quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_response_id UUID REFERENCES student_responses(id),
    moodle_student_id UUID REFERENCES moodle_students(id),

    -- Overall score
    total_score DECIMAL(5,2) CHECK (total_score BETWEEN 0 AND 100),
    grade_letter VARCHAR(2), -- A, B, C, D, F

    -- Detailed breakdown
    comprehension_score DECIMAL(5,2),
    analysis_score DECIMAL(5,2),
    synthesis_score DECIMAL(5,2),
    logical_reasoning_score DECIMAL(5,2),
    creativity_score DECIMAL(5,2),
    clarity_score DECIMAL(5,2),

    -- AI evaluation metadata
    ai_model_used VARCHAR(50),
    ai_analysis TEXT, -- detailed feedback
    confidence_level DECIMAL(3,2), -- 0.00 to 1.00

    -- Timestamps
    evaluated_at TIMESTAMP DEFAULT NOW(),
    evaluation_duration_ms INTEGER,

    -- Audit
    created_by VARCHAR(50) DEFAULT 'system',
    version INTEGER DEFAULT 1
);

-- Evaluation job history
CREATE TABLE evaluation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) DEFAULT 'daily_evaluation',
    status VARCHAR(50), -- 'pending', 'running', 'completed', 'failed'

    -- Metrics
    total_responses INTEGER,
    evaluated_count INTEGER,
    failed_count INTEGER,
    avg_score DECIMAL(5,2),

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Error tracking
    error_log TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_student_responses_status ON student_responses(evaluation_status);
CREATE INDEX idx_student_responses_submitted ON student_responses(submitted_at DESC);
CREATE INDEX idx_quality_scores_student ON quality_scores(moodle_student_id);
CREATE INDEX idx_quality_scores_evaluated ON quality_scores(evaluated_at DESC);
CREATE INDEX idx_evaluation_jobs_status ON evaluation_jobs(status, started_at);
```

---

## 4. Integration Workflow

### 4.1 Initial Setup
1. **Moodle Configuration**:
   - Enable Web Services in Moodle admin
   - Create dedicated service user with appropriate capabilities
   - Generate Web Service token
   - Configure CORS if needed

2. **System Configuration**:
   - Store Moodle URL and token in environment variables
   - Configure database connection
   - Set up Celery worker and Redis
   - Initialize database schema

3. **Data Sync**:
   - Import existing student roster from Moodle
   - Optionally backfill historical responses

### 4.2 Daily Evaluation Workflow

```
02:00 KST - Scheduler triggers daily job
    ↓
Fetch new responses from Moodle (last 24 hours)
    ↓
Filter responses needing evaluation
    ↓
Batch processing (50 responses/batch)
    ↓
For each response:
    - Extract response text
    - Prepare evaluation prompt
    - Call Claude API
    - Parse AI response
    - Calculate component scores
    - Store quality score in DB
    - Update response status
    ↓
Generate daily report
    ↓
Send notification to admins
    ↓
Job complete
```

### 4.3 Real-time Evaluation (Optional)
- Webhook from Moodle on new submission
- Immediate evaluation for urgent cases
- Push notification to student/teacher

---

## 5. API Endpoints

### 5.1 LMS Integration API

```
POST   /api/lms/moodle/sync                - Sync student roster from Moodle
GET    /api/lms/moodle/responses            - Fetch responses (with filters)
POST   /api/lms/moodle/responses/fetch      - Manually trigger fetch
GET    /api/lms/moodle/config               - Get Moodle configuration
PUT    /api/lms/moodle/config               - Update Moodle configuration
```

### 5.2 Quality Score API

```
GET    /api/quality-scores/student/{id}           - Get scores for student
GET    /api/quality-scores/response/{id}          - Get score for specific response
POST   /api/quality-scores/evaluate                - Manually trigger evaluation
GET    /api/quality-scores/stats                   - Get overall statistics
GET    /api/quality-scores/report/{date}          - Get daily report
```

### 5.3 Scheduler API

```
GET    /api/scheduler/jobs                  - List evaluation jobs
POST   /api/scheduler/jobs/trigger          - Manually trigger daily job
GET    /api/scheduler/jobs/{id}             - Get job details
GET    /api/scheduler/jobs/{id}/retry       - Retry failed job
```

---

## 6. AI Evaluation Prompt Template

```python
QUALITY_EVALUATION_PROMPT = """
Role: You are an expert educational assessment specialist focusing on evaluating student thinking quality in mathematics education.

Context:
- Student: {student_name} (Grade {grade_level})
- Activity: {activity_name}
- Subject: Mathematics
- Submission Date: {submitted_at}

Student Response:
{response_text}

Task: Evaluate the quality of thinking demonstrated in this student response based on the following criteria:

1. Comprehension (20%): Does the student understand core mathematical concepts?
2. Analysis (25%): Can the student break down problems into components?
3. Synthesis (25%): Does the student combine ideas to form new understanding?
4. Logical Reasoning (15%): Is the argumentation coherent and well-structured?
5. Creativity (10%): Does the student show novel approaches or insights?
6. Clarity (5%): Is the expression of ideas clear and well-organized?

Output Format (JSON):
{{
  "total_score": <0-100>,
  "grade_letter": "<A/B/C/D/F>",
  "component_scores": {{
    "comprehension": <0-20>,
    "analysis": <0-25>,
    "synthesis": <0-25>,
    "logical_reasoning": <0-15>,
    "creativity": <0-10>,
    "clarity": <0-5>
  }},
  "detailed_feedback": "<Specific, actionable feedback for the student>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_for_improvement": ["<area 1>", "<area 2>"],
  "confidence_level": <0.0-1.0>
}}

Evaluate now:
"""
```

---

## 7. Configuration Files

### 7.1 Environment Variables (.env)

```bash
# Moodle Configuration
MOODLE_URL=https://lms.kaist.ac.kr
MOODLE_WS_TOKEN=your_web_service_token_here
MOODLE_COURSE_ID=123

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/alt42_lms
REDIS_URL=redis://localhost:6379/0

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AI_MODEL=claude-3-sonnet-20240229
AI_MAX_TOKENS=4000

# Scheduler Configuration
EVALUATION_SCHEDULE_HOUR=2  # 02:00 KST
BATCH_SIZE=50
MAX_RETRIES=3

# Notifications
ADMIN_EMAIL=admin@kaist.ac.kr
SMTP_HOST=smtp.kaist.ac.kr
SMTP_PORT=587
```

### 7.2 Celery Configuration (celeryconfig.py)

```python
from celery.schedules import crontab

broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/0'

timezone = 'Asia/Seoul'

beat_schedule = {
    'daily-quality-evaluation': {
        'task': 'tasks.evaluate_daily_quality_scores',
        'schedule': crontab(hour=2, minute=0),  # 02:00 KST daily
    },
    'sync-moodle-roster': {
        'task': 'tasks.sync_student_roster',
        'schedule': crontab(hour=1, minute=0, day_of_week=1),  # Weekly Monday 01:00
    },
}

task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
task_track_started = True
task_time_limit = 3600  # 1 hour max per task
```

---

## 8. Security Considerations

### 8.1 Authentication & Authorization
- **Moodle Token**: Encrypted at rest using Fernet encryption
- **API Keys**: Stored in environment variables, never in code
- **Database**: Credentials managed via secrets management (e.g., Vault)

### 8.2 Data Privacy
- **Student PII**: Minimal storage, comply with FERPA/PIPA
- **Data Retention**: Quality scores retained for 2 years, then archived
- **Access Control**: Role-based access (RBAC) for API endpoints

### 8.3 API Security
- **Rate Limiting**: 100 requests/hour per user
- **Input Validation**: Sanitize all inputs to prevent injection
- **HTTPS Only**: All communications encrypted with TLS 1.3

---

## 9. Monitoring & Alerting

### 9.1 Key Metrics
- **Evaluation Success Rate**: Target >95%
- **Daily Job Completion**: Must finish within 2 hours
- **Average Score Trend**: Track over time
- **API Latency**: Moodle API response time
- **Error Rate**: Failed evaluations per day

### 9.2 Alerts
- Email admin if daily job fails
- Slack notification on evaluation error rate >5%
- Dashboard for real-time monitoring (Grafana)

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Moodle API connector (mocked responses)
- Quality score calculation logic
- Database operations (CRUD)

### 10.2 Integration Tests
- End-to-end workflow (fetch → evaluate → store)
- Moodle API integration (sandbox environment)
- Scheduler execution

### 10.3 Performance Tests
- Load test: 1000 responses in batch
- Stress test: API rate limits
- Database query optimization

---

## 11. Deployment

### 11.1 Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: alt42_lms
      POSTGRES_USER: alt42
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  api:
    build: .
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - MOODLE_URL=${MOODLE_URL}
      - MOODLE_WS_TOKEN=${MOODLE_WS_TOKEN}
    depends_on:
      - postgres
      - redis

  celery_worker:
    build: .
    command: celery -A tasks worker --loglevel=info
    depends_on:
      - postgres
      - redis

  celery_beat:
    build: .
    command: celery -A tasks beat --loglevel=info
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

---

## 12. Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Moodle API connector implementation
- [ ] Database schema setup
- [ ] Basic quality scoring engine
- [ ] Daily scheduler setup
- [ ] Manual testing

### Phase 2: Enhancement (Weeks 5-8)
- [ ] Advanced AI prompts for better evaluation
- [ ] Real-time evaluation webhook
- [ ] Admin dashboard for monitoring
- [ ] Comprehensive testing

### Phase 3: Scale (Weeks 9-12)
- [ ] Performance optimization
- [ ] Multi-course support
- [ ] Advanced analytics and reporting
- [ ] Production deployment

---

## 13. References

- [Moodle Web Services API](https://docs.moodle.org/dev/Web_services)
- [Moodle 3.7 Documentation](https://docs.moodle.org/37/en/Main_page)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Bloom's Taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)

---

**Document Status**: Draft for Implementation
**Next Steps**: Implementation of Moodle API connector and database schema
