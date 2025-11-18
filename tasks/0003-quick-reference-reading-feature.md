# Quick Reference: Key Files & Architecture for Reading Time Feature

## Project Overview at a Glance

| Aspect | Status | Details |
|--------|--------|---------|
| **Code Status** | Greenfield | No source files yet - PRD only |
| **Phase** | Planning | Architecture defined, implementation beginning |
| **Technology** | Decided | React (Frontend), Python/Node (Backend), PostgreSQL, Claude API |
| **Key Document** | `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md` | 1246-line comprehensive PRD |

---

## 1. WHERE TO FIND CRITICAL INFORMATION

### Main PRD Document
**File**: `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md`

**Key Sections for Reading Feature**:
- **Section 4 - Functional Requirements**: FR-4 (Input Strategy), FR-3 (Data Management), FR-7 (AI Integration)
- **Section 6.2** - System Architecture diagram
- **Section 6.3** - Data Models (tables to extend)
- **Section 6.4** - Technology Stack (tools to use)
- **Section 7.1** - AI Prompt Engineering patterns
- **Appendix B** - Example teacher request showing data flow

### This Analysis Document
**File**: `/home/user/alt42standalone_v1.0/tasks/0002-codebase-analysis-reading-feature.md` (NEW)

Comprehensive breakdown of architecture, data models, and implementation roadmap for reading feature.

---

## 2. CORE SYSTEM ARCHITECTURE

### 6-Phase AI Pipeline
```
Phase 1: World Model Reconstruction
  ↓
Phase 2: Rule Generation Engine (← Use for reading speed/comprehension rules)
  ↓
Phase 3: Data Management (← Add reading_analytics table here)
  ↓
Phase 4: Input Strategy Design (← Define behavioral tracking here)
  ↓
Phase 5: UI Auto-Generation (← Generate reading summary components)
  ↓
Phase 6: Integration & Deployment
```

### Stack Quick Reference
```
Frontend:   React 18+ TypeScript | Material-UI | Redux Toolkit
Backend:    Python FastAPI (Pipeline) + Node Express (Gateway)
Database:   PostgreSQL 15+ (primary) | Redis 7+ (caching)
AI Engine:  Claude API (Anthropic) - handles all generation
DevOps:     Docker, GitHub Actions, Prometheus/Grafana
```

---

## 3. DATA MODEL FOR READING FEATURE

### Tables to Create (PostgreSQL)

```sql
-- Captures reading behavior per problem attempt
TABLE reading_analytics {
  id, student_id, problem_id, module_id,
  reading_time_seconds, words_in_problem, reading_speed_wpm,
  re_reading_count, time_before_first_action,
  first_attempt_correct, total_attempts, time_to_correct,
  hint_usage_count, comprehension_score, reading_difficulty_match
}

-- Periodic summaries for teacher/student reporting
TABLE comprehension_summaries {
  id, student_id, module_id, period (daily/weekly/monthly),
  avg_reading_time, avg_reading_speed, comprehension_score_avg,
  problems_too_hard_ratio, problems_too_easy_ratio,
  generated_summary (AI-generated), recommendations
}

-- Integration point with existing attempts table
-- Extend existing {module_name}_attempts table with:
--   reading_time_seconds, hint_count, re_read_count
```

---

## 4. API ENDPOINTS FOR READING FEATURE

### Core Endpoints to Implement

```
# Recording reading data (called during problem solving)
POST   /api/modules/{module_id}/reading-analytics
       Body: { student_id, problem_id, reading_time, words, speed, ... }

# Getting reading summaries
GET    /api/modules/{module_id}/student/{student_id}/comprehension
       Returns: { daily_summary, weekly_summary, recommendations }

GET    /api/modules/{module_id}/class/comprehension-analytics
       Returns: Class-level aggregates, struggling students, etc.

# For AI summary generation
POST   /api/modules/{module_id}/generate-comprehension-report
       Body: { student_id, period, focus_areas }
       Returns: AI-generated summary via Claude API

# Dashboard data
GET    /api/admin/reading-insights/{module_id}
       Returns: Module-wide reading patterns, recommendations
```

---

## 5. AI PROMPTS FOR READING SUMMARIES

### Claude API Integration Points

**Prompt Type 1: Comprehension Analysis**
```
"Analyze student reading patterns:
- Reading speed: {avg_wpm} (class avg: {class_avg})
- Problems taking too long: {count}
- First-attempt accuracy: {percentage}
- Re-reading patterns: {pattern}

Generate a brief, encouraging summary for the {grade_level} student."
```

**Prompt Type 2: Teacher Recommendations**
```
"Based on this student's reading analytics:
- Struggles with: {problem_types}
- Strong in: {areas}
- Reading pace issues: {issues}

Provide 2-3 specific instructional recommendations."
```

**Prompt Type 3: Intervention Detection**
```
"Does this student need intervention?
- Reading speed significantly below average: {bool}
- Comprehension score below threshold: {bool}
- Pattern of rushing: {bool}

Recommend intervention level: none/monitor/immediate"
```

---

## 6. FRONTEND COMPONENTS (To Auto-Generate)

### Student-Facing
- `ReadingProgressIndicator` - Shows reading time elapsed
- `ComprehensionFeedback` - Real-time feedback if reading too fast/slow
- `SummaryCard` - Daily/weekly comprehension summary
- `HintSuggester` - Recommends help based on reading patterns

### Teacher-Facing
- `StudentReadingAnalytics` - Per-student reading metrics dashboard
- `ClassComprehensionDashboard` - Aggregate class insights
- `AIGeneratedReport` - Claude-generated summary & recommendations
- `ReadingPatternVisualizer` - Charts showing reading speed trends

---

## 7. INTEGRATION WITH EXISTING TABLES

### Extend These Existing Tables (from PRD Section 6.3)

**Table: {module_name}_attempts**
```sql
-- ADD COLUMNS:
reading_time_seconds INTEGER,
reading_speed_wpm FLOAT,
re_reading_count INTEGER,
time_before_first_action INTEGER,
hint_count INTEGER
```

**Table: student_progress_{module_id}**
```sql
-- ADD COLUMNS:
avg_reading_time_seconds FLOAT,
avg_comprehension_score FLOAT,
reading_efficiency_trend VARCHAR
```

**Table: modules**
```sql
-- ADD COLUMN:
reading_tracking_enabled BOOLEAN DEFAULT true,
reading_speed_baseline_wpm INTEGER,
comprehension_threshold FLOAT
```

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Schema Design (Week 1-2)
- [ ] Design `reading_analytics` table
- [ ] Design `comprehension_summaries` table
- [ ] Plan indexes (student_id, problem_id, module_id, created_at)
- [ ] Design aggregation queries
- [ ] Plan retention policy (how long to keep raw events)

### Phase 2: Backend Implementation (Week 3-8)
- [ ] Create reading_analytics_service.py
  - [ ] recordReadingMetrics()
  - [ ] calculateComprehensionScore()
  - [ ] generateAISummary()
- [ ] Create API endpoints (POST reading-analytics, GET comprehension-analytics)
- [ ] Implement time-series aggregation (daily, weekly, monthly)
- [ ] Add caching layer (Redis)
- [ ] Implement retention cleanup job

### Phase 3: AI Integration (Week 9-12)
- [ ] Design Claude API prompts (3 types as above)
- [ ] Implement prompt templates system
- [ ] Add error handling & fallback summaries
- [ ] Implement caching for generated summaries
- [ ] Add cost tracking for Claude API

### Phase 4: Frontend Implementation (Week 13-18)
- [ ] Create ReadingAnalyticsDashboard component
- [ ] Create ComprehensionFeedback component
- [ ] Implement Socket.io for real-time updates
- [ ] Add reading timer logic (useReadingTimer hook)
- [ ] Create teacher report views

### Phase 5: Testing & Optimization (Week 19-22)
- [ ] Unit tests for comprehension calculator
- [ ] Integration tests for reading pipeline
- [ ] Performance testing (large dataset queries)
- [ ] Load testing (concurrent reading sessions)
- [ ] Security audit for student data

### Phase 6: Deployment (Week 23-26)
- [ ] Database migrations
- [ ] API documentation
- [ ] Teacher/student guides
- [ ] Monitoring & alerts setup
- [ ] Production deployment

---

## 9. KEY TECHNICAL DECISIONS TO MAKE

1. **Comprehension Score Algorithm**
   - Option A: reading_speed + accuracy + attempts (weighted average)
   - Option B: ML-based (would require labeled training data)
   - Option C: Rule-based thresholds (simple but less accurate)

2. **Reading Baseline Calculation**
   - Per student (personalized)?
   - Per grade level (standardized)?
   - Per problem type (adaptive)?

3. **Real-time Feedback Triggering**
   - Always show feedback?
   - Only when threshold exceeded?
   - Configurable by teacher?

4. **Summary Generation Timing**
   - Immediate (on-demand via button)?
   - Scheduled (nightly batch)?
   - Hybrid (cached + refresh on demand)?

5. **Data Retention**
   - Keep raw events forever?
   - Archive after 1 year?
   - Keep summaries, discard events?

---

## 10. SUCCESS CRITERIA FOR READING FEATURE

### Technical Metrics
- [ ] 99% uptime for reading analytics API
- [ ] <200ms latency for recording reading metrics
- [ ] <500ms latency for generating summaries
- [ ] Comprehension score calculation accuracy >85%

### Product Metrics (from PRD Section 8)
- [ ] Teachers use reading insights in 40% of modules
- [ ] Students report helpful feedback 70%+ satisfaction
- [ ] Reading analytics reduces comprehension issues by 20%
- [ ] AI summaries require <10% manual editing

### Data Quality
- [ ] No missing reading_time data for attempts
- [ ] Outliers flagged (e.g., 5-hour reading sessions)
- [ ] Data consistency across student attempts

---

## 11. REFERENCES & RELATED PRD SECTIONS

| Need | PRD Reference |
|------|---------------|
| Data schema design | Section 6.3 |
| API architecture | FR-6.1, Section 6.2 |
| AI prompt patterns | Section 7.1 |
| Security/privacy | FR-7.4, 7.5 |
| UI generation | FR-5.3, 5.4, 5.5 |
| Input strategy | FR-4.1, 4.2, 4.3 |
| Success metrics | Section 8 |
| Deployment | FR-6.2 - 6.4 |

---

## 12. REPOSITORY STRUCTURE AFTER IMPLEMENTATION

```
/home/user/alt42standalone_v1.0/
├── tasks/
│   ├── 0001-prd-ai-education-pipeline.md          [EXISTING]
│   ├── 0002-codebase-analysis-reading-feature.md  [NEW - This doc]
│   └── 0003-reading-feature-specification.md      [TBD - Detailed spec]
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── reading_analytics_service.py       [NEW]
│   │   │   ├── comprehension_calculator.py        [NEW]
│   │   │   └── ai_summary_generator.py            [NEW]
│   │   ├── models/
│   │   │   └── reading_models.py                  [NEW]
│   │   ├── routes/
│   │   │   └── reading_routes.py                  [NEW]
│   │   └── prompts/
│   │       └── comprehension_summary_prompts.py   [NEW]
│   └── migrations/
│       ├── 001_create_reading_analytics.sql       [NEW]
│       └── 002_create_comprehension_summaries.sql [NEW]
├── frontend/
│   ├── src/components/
│   │   ├── ReadingProgressIndicator.tsx           [NEW]
│   │   ├── ComprehensionFeedback.tsx              [NEW]
│   │   ├── StudentSummaryCard.tsx                 [NEW]
│   │   └── ReadingAnalyticsDashboard.tsx          [NEW]
│   ├── src/hooks/
│   │   ├── useReadingTimer.ts                     [NEW]
│   │   └── useComprehensionMetrics.ts             [NEW]
│   └── src/api/
│       └── readingMetricsApi.ts                   [NEW]
└── docker-compose.yml                             [TBD]
```

---

## NEXT IMMEDIATE STEPS

1. **Review PRD Sections**:
   - Read Section 6.2 (System Architecture)
   - Read Section 6.3 (Data Models)
   - Read Section 7.1 (AI Prompts)

2. **Define Business Requirements**:
   - What exactly is "comprehension"?
   - What are acceptable reading speed ranges by grade?
   - How often should summaries be generated?

3. **Plan Database Schema**:
   - Map reading_analytics columns
   - Design indexes for performance
   - Plan data aggregation queries

4. **Start Development**:
   - Set up development environment (PostgreSQL, Node, Python)
   - Create initial database migrations
   - Implement reading_analytics_service.py
   - Build API endpoints

---

This document should be your go-to reference while implementing the reading feature!

