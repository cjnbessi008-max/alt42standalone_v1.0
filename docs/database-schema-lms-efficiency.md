# Database Schema: Moodle Integration & Efficiency Scoring

**Version**: 1.0
**Date**: 2025-11-18
**Database**: PostgreSQL 15+ (with JSONB support)
**Target LMS**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)

---

## 1. Overview

This document defines the extended database schema required to support:
1. **Moodle LTI 1.3 Integration** - User mapping, launch context, grade passback
2. **Thought Efficiency Score (TES)** - Calculation, storage, and historical tracking
3. **Analytics & Insights** - Cohort statistics, trend analysis, teacher recommendations

### Schema Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CORE TABLES (from PRD)                │
│  - modules                                              │
│  - teachers                                             │
│  - students                                             │
│  - student_attempts (time_spent, is_correct, etc.)     │
└─────────────────────────────────────────────────────────┘
                          │
                          │ extends with
                          ↓
┌─────────────────────────────────────────────────────────┐
│              NEW TABLES (LMS + Efficiency)               │
│  - lms_integrations                                     │
│  - lms_user_mappings                                    │
│  - lms_launch_sessions                                  │
│  - efficiency_scores                                    │
│  - efficiency_score_history                             │
│  - cohort_statistics                                    │
│  - teacher_insights                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. LMS Integration Tables

### 2.1 `lms_integrations`

Stores configuration for each Moodle instance connected to the system.

```sql
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS Identification
    lms_platform VARCHAR(50) NOT NULL DEFAULT 'moodle', -- 'moodle', 'canvas', 'blackboard'
    lms_version VARCHAR(20) NOT NULL,                   -- e.g., '3.7', '3.9', '4.0'
    institution_name VARCHAR(255) NOT NULL,
    lms_url VARCHAR(500) NOT NULL,                      -- Base URL of Moodle instance

    -- LTI 1.3 Configuration
    client_id VARCHAR(255) NOT NULL UNIQUE,             -- OAuth2 client ID
    deployment_id VARCHAR(255) NOT NULL,                -- LTI deployment ID
    auth_url TEXT NOT NULL,                             -- OIDC auth endpoint
    token_url TEXT NOT NULL,                            -- OAuth2 token endpoint
    jwks_url TEXT NOT NULL,                             -- Public key set endpoint

    -- Security
    public_key TEXT,                                    -- LMS public key (JWK format)
    private_key_id VARCHAR(100),                        -- Reference to our private key

    -- Grade Passback Configuration
    grade_passback_enabled BOOLEAN DEFAULT true,
    grade_scale_min DECIMAL(5,2) DEFAULT 0,             -- Typically 0
    grade_scale_max DECIMAL(5,2) DEFAULT 100,           -- Typically 100

    -- Metadata
    contact_email VARCHAR(255),
    contact_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES teachers(id),

    -- Constraints
    CONSTRAINT valid_lms_url CHECK (lms_url ~ '^https?://'),
    CONSTRAINT valid_grade_scale CHECK (grade_scale_max > grade_scale_min)
);

CREATE INDEX idx_lms_client_id ON lms_integrations(client_id);
CREATE INDEX idx_lms_active ON lms_integrations(is_active) WHERE is_active = true;
```

**Example Data**:
```sql
INSERT INTO lms_integrations VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'moodle',
    '3.7',
    'KAIST Touch Math Academy',
    'https://lms.kaist.ac.kr',
    'kaist_client_2025',
    'deployment_1',
    'https://lms.kaist.ac.kr/mod/lti/auth.php',
    'https://lms.kaist.ac.kr/mod/lti/token.php',
    'https://lms.kaist.ac.kr/mod/lti/certs.php',
    '{"kty":"RSA","n":"...","e":"AQAB"}',
    'our_private_key_2025',
    true,
    0, 100,
    'admin@kaist.ac.kr',
    'LMS Administrator',
    true,
    NOW(), NOW(),
    NULL
);
```

---

### 2.2 `lms_user_mappings`

Maps Moodle users to internal system users (students/teachers).

```sql
CREATE TABLE lms_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS Integration
    lms_integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,

    -- LMS User Data
    lms_user_id VARCHAR(255) NOT NULL,                  -- Moodle user ID (from LTI launch)
    lms_user_email VARCHAR(255),
    lms_user_name VARCHAR(255),
    lms_roles TEXT[],                                   -- ['Learner', 'Instructor', etc.]

    -- Internal User Mapping
    user_type VARCHAR(20) NOT NULL,                     -- 'student' or 'teacher'
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,

    -- Synchronization
    first_launch_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_launch_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_launches INTEGER DEFAULT 1,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT user_mapping_type_check CHECK (
        (user_type = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL) OR
        (user_type = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
    ),
    CONSTRAINT unique_lms_user_per_integration UNIQUE (lms_integration_id, lms_user_id)
);

CREATE INDEX idx_lms_mapping_student ON lms_user_mappings(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_lms_mapping_teacher ON lms_user_mappings(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_lms_mapping_lms_user ON lms_user_mappings(lms_integration_id, lms_user_id);
```

**Example Data**:
```sql
-- Student mapping
INSERT INTO lms_user_mappings VALUES (
    gen_random_uuid(),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- lms_integration_id
    'moodle_user_12345',
    'alice.student@kaist.ac.kr',
    'Alice Kim',
    ARRAY['Learner'],
    'student',
    'student-uuid-1234',  -- student_id
    NULL,                 -- teacher_id
    NOW(), NOW(), 1,
    true, NOW(), NOW()
);
```

---

### 2.3 `lms_launch_sessions`

Tracks each LTI launch from Moodle for audit and debugging.

```sql
CREATE TABLE lms_launch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS Context
    lms_integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    user_mapping_id UUID NOT NULL REFERENCES lms_user_mappings(id) ON DELETE CASCADE,

    -- LTI Launch Data
    context_id VARCHAR(255),                            -- Moodle course ID
    resource_link_id VARCHAR(255),                      -- LTI resource link ID
    launch_presentation_return_url TEXT,                 -- Return URL after session

    -- Module Context
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,

    -- Session Management
    session_token VARCHAR(500) UNIQUE,                  -- JWT session token
    launched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,                      -- Session expiry
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    -- Grade Passback
    lis_outcome_service_url TEXT,                       -- LTI 1.1 grade endpoint (fallback)
    lis_result_sourcedid TEXT,                          -- LTI 1.1 grade identifier

    -- Audit Trail
    launch_payload JSONB,                               -- Full LTI launch request
    ip_address INET,
    user_agent TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_launch_user_mapping ON lms_launch_sessions(user_mapping_id);
CREATE INDEX idx_launch_module ON lms_launch_sessions(module_id);
CREATE INDEX idx_launch_active ON lms_launch_sessions(is_active, expires_at)
    WHERE is_active = true;
CREATE INDEX idx_launch_session_token ON lms_launch_sessions(session_token);
```

---

## 3. Efficiency Scoring Tables

### 3.1 `efficiency_scores`

Stores current TES (Thought Efficiency Score) for each student per module.

```sql
CREATE TABLE efficiency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Student & Module
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Overall TES
    tes_score DECIMAL(5,2) NOT NULL,                    -- 0-100 scale
    tes_percentile INTEGER,                             -- 0-100 percentile rank
    tes_grade VARCHAR(2),                               -- 'A', 'B', 'C', 'D', 'F'

    -- Component Scores (0-100 each)
    correctness_score DECIMAL(5,2) NOT NULL,
    speed_score DECIMAL(5,2) NOT NULL,
    first_try_score DECIMAL(5,2) NOT NULL,
    consistency_score DECIMAL(5,2) NOT NULL,

    -- Raw Metrics
    total_attempts INTEGER NOT NULL,
    correct_attempts INTEGER NOT NULL,
    total_problems INTEGER NOT NULL,
    first_try_correct INTEGER NOT NULL,
    avg_time_seconds DECIMAL(10,2) NOT NULL,

    -- Problem Type Breakdown (JSONB for flexibility)
    problem_type_scores JSONB,                          -- {"visualization": 95, "addition": 85, ...}

    -- Cohort Context
    cohort_id UUID,                                     -- Optional: group students into cohorts
    cohort_median_time DECIMAL(10,2),
    cohort_avg_tes DECIMAL(5,2),

    -- Sample Size Validation
    sufficient_data BOOLEAN DEFAULT false,              -- true if >= 10 attempts

    -- Timestamps
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_student_module_tes UNIQUE (student_id, module_id),
    CONSTRAINT valid_tes_score CHECK (tes_score BETWEEN 0 AND 100),
    CONSTRAINT valid_percentile CHECK (tes_percentile IS NULL OR tes_percentile BETWEEN 0 AND 100),
    CONSTRAINT valid_component_scores CHECK (
        correctness_score BETWEEN 0 AND 100 AND
        speed_score BETWEEN 0 AND 100 AND
        first_try_score BETWEEN 0 AND 100 AND
        consistency_score BETWEEN 0 AND 100
    ),
    CONSTRAINT sufficient_attempts CHECK (total_attempts >= total_problems)
);

CREATE INDEX idx_tes_student ON efficiency_scores(student_id);
CREATE INDEX idx_tes_module ON efficiency_scores(module_id);
CREATE INDEX idx_tes_score ON efficiency_scores(tes_score DESC);
CREATE INDEX idx_tes_percentile ON efficiency_scores(tes_percentile DESC);
CREATE INDEX idx_tes_cohort ON efficiency_scores(cohort_id) WHERE cohort_id IS NOT NULL;
CREATE INDEX idx_tes_sufficient_data ON efficiency_scores(sufficient_data) WHERE sufficient_data = true;
```

**Example Data**:
```sql
INSERT INTO efficiency_scores VALUES (
    gen_random_uuid(),
    'student-uuid-1234',
    'module-fractions-uuid',
    96.00,              -- tes_score
    95,                 -- tes_percentile (top 5%)
    'A',                -- tes_grade
    95.00,              -- correctness_score
    100.00,             -- speed_score
    90.00,              -- first_try_score
    100.00,             -- consistency_score
    20,                 -- total_attempts
    19,                 -- correct_attempts
    20,                 -- total_problems
    18,                 -- first_try_correct
    45.00,              -- avg_time_seconds
    '{"visualization": 95, "addition": 95, "subtraction": 95}'::jsonb,
    'cohort-2025-spring',
    90.00,              -- cohort_median_time
    72.00,              -- cohort_avg_tes
    true,               -- sufficient_data
    NOW(), NOW(), NOW(), NOW()
);
```

---

### 3.2 `efficiency_score_history`

Tracks TES changes over time for trend analysis.

```sql
CREATE TABLE efficiency_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to current score
    efficiency_score_id UUID NOT NULL REFERENCES efficiency_scores(id) ON DELETE CASCADE,

    -- Student & Module (denormalized for faster queries)
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Snapshot at this point in time
    tes_score DECIMAL(5,2) NOT NULL,
    correctness_score DECIMAL(5,2) NOT NULL,
    speed_score DECIMAL(5,2) NOT NULL,
    first_try_score DECIMAL(5,2) NOT NULL,
    consistency_score DECIMAL(5,2) NOT NULL,

    -- Context
    total_attempts_at_snapshot INTEGER NOT NULL,
    snapshot_date DATE NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_snapshot UNIQUE (efficiency_score_id, snapshot_date)
);

CREATE INDEX idx_history_score ON efficiency_score_history(efficiency_score_id);
CREATE INDEX idx_history_student ON efficiency_score_history(student_id, snapshot_date DESC);
CREATE INDEX idx_history_module ON efficiency_score_history(module_id, snapshot_date DESC);
```

**Usage**: Triggered daily by a cron job to create snapshots for trend charts.

---

### 3.3 `cohort_statistics`

Aggregated statistics for groups of students (class, semester, etc.).

```sql
CREATE TABLE cohort_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cohort Definition
    cohort_id VARCHAR(100) NOT NULL,                    -- e.g., 'spring-2025-grade3'
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Aggregate Metrics
    total_students INTEGER NOT NULL,
    avg_tes DECIMAL(5,2) NOT NULL,
    median_tes DECIMAL(5,2) NOT NULL,
    std_dev_tes DECIMAL(5,2),
    min_tes DECIMAL(5,2),
    max_tes DECIMAL(5,2),

    -- Distribution
    tes_distribution JSONB,                             -- {"90-100": 5, "80-89": 12, ...}

    -- Time Metrics
    avg_time_seconds DECIMAL(10,2),
    median_time_seconds DECIMAL(10,2),

    -- Performance Bands
    high_performers_count INTEGER,                      -- TES > 85
    medium_performers_count INTEGER,                    -- TES 70-85
    low_performers_count INTEGER,                       -- TES < 70

    -- Calculation Metadata
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculation_period_start DATE,
    calculation_period_end DATE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_cohort_module UNIQUE (cohort_id, module_id, calculation_period_end)
);

CREATE INDEX idx_cohort_stats_cohort ON cohort_statistics(cohort_id);
CREATE INDEX idx_cohort_stats_module ON cohort_statistics(module_id);
CREATE INDEX idx_cohort_stats_calc_at ON cohort_statistics(calculated_at DESC);
```

---

### 3.4 `teacher_insights`

AI-generated insights and recommendations for teachers about student performance.

```sql
CREATE TABLE teacher_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE, -- NULL for cohort-level insights

    -- Insight Content
    insight_type VARCHAR(50) NOT NULL,                  -- 'student_performance', 'cohort_trend', 'intervention_needed'
    insight_category VARCHAR(50),                       -- 'at_risk', 'high_performer', 'trend_alert'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Supporting Data
    tes_score DECIMAL(5,2),
    tes_change DECIMAL(5,2),                            -- Week-over-week change
    supporting_metrics JSONB,                           -- {"weak_areas": ["subtraction"], "strength": "speed"}

    -- Recommendations
    recommended_actions TEXT[],                         -- ["Review subtraction concepts", "Provide additional practice"]

    -- Priority
    priority VARCHAR(20) DEFAULT 'medium',              -- 'low', 'medium', 'high', 'urgent'
    is_actionable BOOLEAN DEFAULT true,

    -- Status
    status VARCHAR(20) DEFAULT 'active',                -- 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES teachers(id),

    -- Metadata
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                               -- Auto-dismiss after this date
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed'))
);

CREATE INDEX idx_insights_teacher ON teacher_insights(teacher_id, status);
CREATE INDEX idx_insights_module ON teacher_insights(module_id);
CREATE INDEX idx_insights_student ON teacher_insights(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_insights_priority ON teacher_insights(priority, status);
CREATE INDEX idx_insights_active ON teacher_insights(status, expires_at)
    WHERE status = 'active';
```

**Example Data**:
```sql
INSERT INTO teacher_insights VALUES (
    gen_random_uuid(),
    'teacher-uuid-5678',
    'module-fractions-uuid',
    'student-uuid-9999',        -- Specific student
    'student_performance',
    'at_risk',
    'Student Charlie showing declining efficiency',
    'Charlie''s TES has dropped from 78 to 65 over the past week. Heavy reliance on trial-and-error and inconsistent performance on subtraction problems.',
    65.00,                      -- current tes_score
    -13.00,                     -- tes_change (declined)
    '{"weak_areas": ["subtraction"], "strong_areas": ["visualization"], "trial_error_rate": "60%"}'::jsonb,
    ARRAY['Schedule 1-on-1 tutoring session', 'Review subtraction prerequisites', 'Provide additional practice problems'],
    'high',                     -- priority
    true,                       -- is_actionable
    'active',
    NULL, NULL,
    NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
);
```

---

## 4. Indexes for Performance

### Query Patterns We Need to Optimize

1. **Student Dashboard**: Fetch all scores for a student
2. **Teacher Dashboard**: Fetch all scores for a module/cohort
3. **Grade Passback**: Update Moodle with TES scores
4. **Cohort Analytics**: Aggregate statistics across students
5. **Trend Analysis**: Historical TES over time

```sql
-- Composite indexes for common queries
CREATE INDEX idx_tes_student_module_time ON efficiency_scores(student_id, module_id, calculated_at DESC);
CREATE INDEX idx_tes_module_student_score ON efficiency_scores(module_id, student_id, tes_score DESC);

-- Covering index for leaderboard queries
CREATE INDEX idx_tes_leaderboard ON efficiency_scores(module_id, tes_score DESC, student_id)
    WHERE sufficient_data = true;

-- Partial index for at-risk students
CREATE INDEX idx_tes_at_risk ON efficiency_scores(module_id, student_id, tes_score)
    WHERE tes_score < 70 AND sufficient_data = true;

-- GIN index for JSONB queries
CREATE INDEX idx_tes_problem_types ON efficiency_scores USING GIN (problem_type_scores);
CREATE INDEX idx_insights_metrics ON teacher_insights USING GIN (supporting_metrics);
```

---

## 5. Partitioning Strategy (for scale)

If the system grows beyond 1M+ records, partition historical tables:

```sql
-- Partition efficiency_score_history by month
CREATE TABLE efficiency_score_history (
    -- columns as defined above
) PARTITION BY RANGE (snapshot_date);

CREATE TABLE efficiency_score_history_2025_01 PARTITION OF efficiency_score_history
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE efficiency_score_history_2025_02 PARTITION OF efficiency_score_history
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Create new partitions monthly via scheduled job
```

---

## 6. Triggers & Automation

### 6.1 Auto-update `updated_at` timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lms_integrations_updated_at
    BEFORE UPDATE ON lms_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_user_mappings_updated_at
    BEFORE UPDATE ON lms_user_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_efficiency_scores_updated_at
    BEFORE UPDATE ON efficiency_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_insights_updated_at
    BEFORE UPDATE ON teacher_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 6.2 Auto-calculate TES percentile

```sql
CREATE OR REPLACE FUNCTION calculate_tes_percentile()
RETURNS TRIGGER AS $$
DECLARE
    percentile_rank INTEGER;
BEGIN
    -- Calculate percentile within module cohort
    SELECT FLOOR(
        (COUNT(*) FILTER (WHERE tes_score < NEW.tes_score) * 100.0 / NULLIF(COUNT(*), 0))
    )
    INTO percentile_rank
    FROM efficiency_scores
    WHERE module_id = NEW.module_id
      AND sufficient_data = true
      AND id != NEW.id;

    NEW.tes_percentile = COALESCE(percentile_rank, 50);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_percentile_before_insert_update
    BEFORE INSERT OR UPDATE OF tes_score ON efficiency_scores
    FOR EACH ROW EXECUTE FUNCTION calculate_tes_percentile();
```

---

### 6.3 Auto-assign letter grade

```sql
CREATE OR REPLACE FUNCTION assign_tes_grade()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tes_grade = CASE
        WHEN NEW.tes_score >= 90 THEN 'A'
        WHEN NEW.tes_score >= 80 THEN 'B'
        WHEN NEW.tes_score >= 70 THEN 'C'
        WHEN NEW.tes_score >= 60 THEN 'D'
        ELSE 'F'
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_grade_before_insert_update
    BEFORE INSERT OR UPDATE OF tes_score ON efficiency_scores
    FOR EACH ROW EXECUTE FUNCTION assign_tes_grade();
```

---

## 7. Migration Scripts

### Step 1: Create extension for UUID support

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

### Step 2: Run DDL in order

```bash
# Execute in this order:
psql -U postgres -d ai_education_db -f 001_lms_integrations.sql
psql -U postgres -d ai_education_db -f 002_lms_user_mappings.sql
psql -U postgres -d ai_education_db -f 003_lms_launch_sessions.sql
psql -U postgres -d ai_education_db -f 004_efficiency_scores.sql
psql -U postgres -d ai_education_db -f 005_efficiency_score_history.sql
psql -U postgres -d ai_education_db -f 006_cohort_statistics.sql
psql -U postgres -d ai_education_db -f 007_teacher_insights.sql
psql -U postgres -d ai_education_db -f 008_triggers.sql
psql -U postgres -d ai_education_db -f 009_indexes.sql
```

---

### Step 3: Seed test data (optional)

```sql
-- Insert test LMS integration
INSERT INTO lms_integrations (
    lms_platform, lms_version, institution_name, lms_url,
    client_id, deployment_id, auth_url, token_url, jwks_url
) VALUES (
    'moodle', '3.7', 'Test Institution', 'https://test-moodle.local',
    'test_client', 'test_deployment',
    'https://test-moodle.local/mod/lti/auth.php',
    'https://test-moodle.local/mod/lti/token.php',
    'https://test-moodle.local/mod/lti/certs.php'
);
```

---

## 8. Backup & Maintenance

### Backup Strategy
```bash
# Daily backup of critical tables
pg_dump -U postgres -d ai_education_db \
    -t lms_integrations \
    -t lms_user_mappings \
    -t efficiency_scores \
    -t teacher_insights \
    > backup_$(date +%Y%m%d).sql
```

### Archival Policy
- **lms_launch_sessions**: Archive sessions older than 90 days
- **efficiency_score_history**: Archive data older than 2 years
- **teacher_insights**: Delete dismissed insights older than 6 months

```sql
-- Example archival job (run monthly)
DELETE FROM lms_launch_sessions
WHERE launched_at < NOW() - INTERVAL '90 days';

UPDATE teacher_insights
SET status = 'dismissed', updated_at = NOW()
WHERE expires_at < NOW() AND status = 'active';
```

---

## 9. Security Considerations

### Row-Level Security (RLS)

Enable RLS for multi-tenancy if multiple institutions share the database:

```sql
ALTER TABLE efficiency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY efficiency_scores_teacher_access ON efficiency_scores
    FOR SELECT
    USING (
        module_id IN (
            SELECT id FROM modules WHERE teacher_id = current_user_id()
        )
    );

CREATE POLICY efficiency_scores_student_access ON efficiency_scores
    FOR SELECT
    USING (student_id = current_user_id());
```

### Encryption
- **At Rest**: Enable PostgreSQL encryption for sensitive columns (private keys, emails)
- **In Transit**: Enforce SSL/TLS for all connections
- **Application-Level**: Encrypt `lms_integrations.private_key_id` with application key vault

---

## 10. Performance Benchmarks

Expected query performance on 100,000 students:

| Query | Expected Time | Notes |
|-------|---------------|-------|
| Fetch single student TES | < 5ms | Direct index lookup |
| Fetch module cohort stats | < 50ms | Pre-aggregated in cohort_statistics |
| Calculate TES for 1 student | < 100ms | Includes aggregation from student_attempts |
| Leaderboard (top 100) | < 20ms | Covering index |
| Historical trend (1 student, 6 months) | < 30ms | Indexed by student_id + date |

---

## 11. Testing Checklist

- [ ] All foreign keys enforce referential integrity
- [ ] Triggers correctly update timestamps
- [ ] Percentile calculation works with edge cases (single student, ties)
- [ ] JSONB queries perform well (< 50ms)
- [ ] Backup and restore scripts work
- [ ] Migration scripts are idempotent (can run multiple times)
- [ ] Indexes are used by query planner (verify with EXPLAIN ANALYZE)

---

**Document Status**: Complete - Ready for Implementation
**Next Steps**: Create API specifications and backend services
**Dependencies**: Requires core tables from PRD (modules, students, teachers, student_attempts)
