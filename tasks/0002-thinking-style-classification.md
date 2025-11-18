# Thinking Style Classification System

## 1. Overview

### Purpose
Implement a thinking style classification system integrated with LMS (Learning Management System) to identify and categorize students' cognitive approaches into three primary styles:
- **계산형 (Computational/Algorithmic)**: Students who prefer step-by-step logical reasoning
- **직관형 (Intuitive)**: Students who rely on pattern recognition and gut feelings
- **그림형 (Visual/Pictorial)**: Students who think in images and spatial relationships

### Goals
- Automatically classify student thinking styles based on interaction patterns
- Provide personalized learning paths based on thinking styles
- Enable teachers to understand student cognitive preferences
- Integrate seamlessly with existing LMS platforms

---

## 2. Thinking Style Definitions

### 2.1 계산형 (Computational Thinking)
**Characteristics**:
- Prefers systematic, step-by-step approaches
- Strong in logical reasoning and algorithmic problem-solving
- Comfortable with formulas and symbolic manipulation
- Tends to write out detailed work
- Focuses on procedural accuracy

**Indicators**:
- High usage of calculation tools and formula references
- Consistent step-by-step problem solving
- Preference for textual explanations over diagrams
- Longer time on calculation steps, shorter on visualization
- High accuracy in multi-step problems

### 2.2 직관형 (Intuitive Thinking)
**Characteristics**:
- Relies on pattern recognition and hunches
- Quick to see relationships without explicit reasoning
- May struggle to explain "how" they arrived at answers
- Strong in estimation and approximation
- Comfortable with ambiguity

**Indicators**:
- Fast problem completion times
- Skips intermediate steps
- Preference for multiple-choice or quick-answer formats
- High accuracy on pattern recognition tasks
- Less interaction with detailed explanations

### 2.3 그림형 (Visual/Spatial Thinking)
**Characteristics**:
- Thinks in images, diagrams, and spatial relationships
- Strong visual memory
- Prefers graphs, charts, and pictorial representations
- Good at geometry and spatial reasoning
- Creates mental models and visualizations

**Indicators**:
- High usage of visual tools (diagrams, graphs, manipulatives)
- Preference for visual problem representations
- Long interaction times with visual elements
- Drawing or sketching tendencies
- High performance on geometry and spatial tasks

---

## 3. Classification Methodology

### 3.1 Data Collection Points

**Behavioral Tracking**:
1. **Time Allocation**:
   - Time spent on text vs. visual content
   - Time on calculation vs. estimation tasks
   - Time on each problem-solving step

2. **Interaction Patterns**:
   - Tool usage (calculator, formula sheet, diagram tools, sketch pad)
   - Click patterns (sequential vs. jumping around)
   - Help resource preferences (text guides vs. video vs. diagrams)

3. **Problem-Solving Approach**:
   - Number of intermediate steps shown
   - Use of scratch work area
   - Pattern of answer revisions

4. **Content Preferences**:
   - Selection of problem types when given choice
   - Voluntary use of visual aids
   - Engagement with different explanation formats

### 3.2 Classification Algorithm

**Multi-Factor Scoring System**:

```python
thinking_style_score = {
    'computational': 0.0,  # 0-100
    'intuitive': 0.0,      # 0-100
    'visual': 0.0          # 0-100
}

# Factors (each normalized 0-1, weighted):
factors = {
    'computational': [
        ('step_by_step_usage', weight=0.25),
        ('formula_reference_time', weight=0.20),
        ('calculation_tool_usage', weight=0.20),
        ('text_preference', weight=0.15),
        ('detailed_work_shown', weight=0.20)
    ],
    'intuitive': [
        ('completion_speed', weight=0.30),
        ('skip_intermediate_steps', weight=0.25),
        ('pattern_recognition_accuracy', weight=0.25),
        ('estimation_preference', weight=0.20)
    ],
    'visual': [
        ('visual_tool_usage', weight=0.30),
        ('diagram_interaction_time', weight=0.25),
        ('spatial_task_performance', weight=0.25),
        ('image_preference', weight=0.20)
    ]
}
```

**Classification Rules**:
1. **Primary Style**: Highest score (must be >40 to be significant)
2. **Secondary Style**: Second highest (if >30)
3. **Hybrid**: If two styles within 10 points of each other
4. **Confidence Level**: Based on data volume and consistency

**Minimum Data Requirements**:
- At least 10 completed problems across different types
- Minimum 30 minutes of interaction time
- At least 3 different activity types

### 3.3 Dynamic Assessment

**Initial Assessment** (15-20 minutes):
- Purposefully designed multi-modal problems
- Tasks that allow different solution approaches
- Balanced content (calculations, patterns, visuals)

**Ongoing Refinement**:
- Continuous tracking during regular learning activities
- Classification confidence increases over time
- Adaptation to student development and changes

---

## 4. Database Schema

### 4.1 New Tables

```sql
-- Student thinking style profiles
CREATE TABLE student_thinking_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID REFERENCES modules(id),

    -- Current classification
    primary_style VARCHAR(20) NOT NULL CHECK (primary_style IN ('computational', 'intuitive', 'visual')),
    secondary_style VARCHAR(20) CHECK (secondary_style IN ('computational', 'intuitive', 'visual', 'none')),
    is_hybrid BOOLEAN DEFAULT false,

    -- Scores (0-100)
    computational_score DECIMAL(5,2) NOT NULL CHECK (computational_score BETWEEN 0 AND 100),
    intuitive_score DECIMAL(5,2) NOT NULL CHECK (intuitive_score BETWEEN 0 AND 100),
    visual_score DECIMAL(5,2) NOT NULL CHECK (visual_score BETWEEN 0 AND 100),

    -- Metadata
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
    data_points_count INTEGER DEFAULT 0,
    first_assessed_at TIMESTAMP,
    last_assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id)
);

-- Behavioral tracking data
CREATE TABLE thinking_style_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id UUID,

    -- Interaction type
    interaction_type VARCHAR(50) NOT NULL,
    interaction_category VARCHAR(20) NOT NULL CHECK (interaction_category IN ('computational', 'intuitive', 'visual', 'neutral')),

    -- Metrics
    duration_seconds INTEGER,
    success BOOLEAN,
    metadata JSONB,  -- Flexible storage for interaction-specific data

    -- Timestamp
    occurred_at TIMESTAMP DEFAULT NOW(),

    -- Indexes for querying
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX idx_thinking_style_interactions_student ON thinking_style_interactions(student_id);
CREATE INDEX idx_thinking_style_interactions_occurred ON thinking_style_interactions(occurred_at);
CREATE INDEX idx_thinking_style_interactions_category ON thinking_style_interactions(interaction_category);

-- Assessment sessions
CREATE TABLE thinking_style_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID REFERENCES modules(id),

    -- Assessment details
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('initial', 'periodic', 'on_demand')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

    -- Results
    computational_raw_score DECIMAL(5,2),
    intuitive_raw_score DECIMAL(5,2),
    visual_raw_score DECIMAL(5,2),

    recommended_style VARCHAR(20),
    confidence DECIMAL(5,2),

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- LMS integration logs
CREATE TABLE lms_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    lms_platform VARCHAR(50) NOT NULL,

    -- Sync details
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('export', 'import')),
    data_type VARCHAR(50) NOT NULL,  -- 'thinking_style', 'progress', etc.

    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,

    -- Data
    request_payload JSONB,
    response_payload JSONB,

    -- Timing
    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_sync_logs_student ON lms_sync_logs(student_id);
CREATE INDEX idx_lms_sync_logs_platform ON lms_sync_logs(lms_platform);
```

### 4.2 Schema Extensions

```sql
-- Add thinking style preference to existing students table
ALTER TABLE students
ADD COLUMN preferred_learning_style VARCHAR(20),
ADD COLUMN style_last_updated TIMESTAMP;

-- Add thinking style metadata to modules
ALTER TABLE modules
ADD COLUMN supports_style_detection BOOLEAN DEFAULT true,
ADD COLUMN style_weights JSONB;  -- Custom weights for this module
```

---

## 5. Backend API Design

### 5.1 REST API Endpoints

```typescript
// Base path: /api/v1/thinking-styles

// ============ Student Assessment ============

// Start a new thinking style assessment
POST /api/v1/thinking-styles/assessments
{
  "student_id": "uuid",
  "module_id": "uuid",  // optional
  "assessment_type": "initial" | "periodic" | "on_demand"
}
Response: { "assessment_id": "uuid", "status": "pending" }

// Get assessment status
GET /api/v1/thinking-styles/assessments/{assessment_id}
Response: {
  "assessment_id": "uuid",
  "status": "in_progress" | "completed",
  "progress": 0.75,
  "estimated_completion_minutes": 5
}

// Submit interaction data (called frequently during learning)
POST /api/v1/thinking-styles/interactions
{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "interaction_type": "tool_usage" | "time_spent" | "answer_submission",
  "interaction_category": "computational" | "intuitive" | "visual" | "neutral",
  "duration_seconds": 45,
  "metadata": {
    "tool_name": "calculator",
    "steps_shown": 5
  }
}
Response: { "recorded": true, "interaction_id": "uuid" }

// ============ Classification Results ============

// Get student's current thinking style profile
GET /api/v1/thinking-styles/students/{student_id}
Query params:
  - module_id: uuid (optional, for module-specific profile)
Response: {
  "student_id": "uuid",
  "primary_style": "computational",
  "secondary_style": "visual",
  "is_hybrid": false,
  "scores": {
    "computational": 72.5,
    "intuitive": 35.0,
    "visual": 58.0
  },
  "confidence_level": "high",
  "data_points_count": 145,
  "last_assessed_at": "2025-11-18T10:30:00Z",
  "recommendations": [
    "Provide step-by-step solutions",
    "Include visual aids to support learning"
  ]
}

// Get thinking style history (trend over time)
GET /api/v1/thinking-styles/students/{student_id}/history
Query params:
  - start_date: ISO8601
  - end_date: ISO8601
Response: {
  "timeline": [
    {
      "date": "2025-10-01",
      "scores": { "computational": 65, "intuitive": 40, "visual": 50 }
    },
    {
      "date": "2025-11-01",
      "scores": { "computational": 72, "intuitive": 35, "visual": 58 }
    }
  ]
}

// ============ Teacher Dashboard ============

// Get class thinking style distribution
GET /api/v1/thinking-styles/classes/{class_id}/distribution
Response: {
  "class_id": "uuid",
  "total_students": 25,
  "distribution": {
    "computational": { "count": 8, "percentage": 32 },
    "intuitive": { "count": 7, "percentage": 28 },
    "visual": { "count": 10, "percentage": 40 }
  },
  "hybrids": { "count": 5, "percentage": 20 }
}

// Get recommendations for teaching a specific student
GET /api/v1/thinking-styles/students/{student_id}/recommendations
Response: {
  "student_id": "uuid",
  "primary_style": "visual",
  "recommendations": {
    "content_format": ["diagrams", "videos", "interactive_visualizations"],
    "problem_types": ["geometry", "spatial_reasoning", "graph_analysis"],
    "teaching_tips": [
      "Use visual aids consistently",
      "Encourage drawing and sketching",
      "Provide concept maps"
    ]
  }
}

// ============ LMS Integration ============

// Export thinking style data to LMS
POST /api/v1/thinking-styles/lms/export
{
  "lms_platform": "canvas" | "moodle" | "blackboard",
  "student_ids": ["uuid1", "uuid2"],
  "data_format": "lti" | "csv" | "json"
}
Response: {
  "export_id": "uuid",
  "status": "processing",
  "download_url": "/api/v1/exports/{export_id}"
}

// Import student data from LMS
POST /api/v1/thinking-styles/lms/import
{
  "lms_platform": "canvas",
  "course_id": "external_course_id",
  "data_url": "https://lms.example.com/api/students"
}
Response: {
  "import_id": "uuid",
  "students_processed": 25,
  "status": "completed"
}

// LMS webhook endpoint (receive updates from LMS)
POST /api/v1/thinking-styles/lms/webhook
Headers: { "X-LMS-Signature": "hmac_signature" }
Body: {
  "event_type": "student.enrolled" | "student.completed_activity",
  "student_id": "external_id",
  "data": { /* event-specific data */ }
}
Response: { "received": true }

// ============ Admin & Analytics ============

// Trigger manual re-classification
POST /api/v1/thinking-styles/students/{student_id}/reclassify
Response: { "job_id": "uuid", "status": "queued" }

// Get classification algorithm metrics
GET /api/v1/thinking-styles/admin/metrics
Response: {
  "total_classifications": 1500,
  "average_confidence": 0.82,
  "classification_distribution": { /* ... */ },
  "algorithm_accuracy": 0.91  // if validation data available
}
```

### 5.2 WebSocket Events (Real-time Updates)

```typescript
// Connect to WebSocket
ws://api.example.com/ws/thinking-styles

// Client subscribes to student updates
SEND: {
  "action": "subscribe",
  "student_id": "uuid"
}

// Server sends real-time classification updates
RECEIVE: {
  "event": "classification_updated",
  "student_id": "uuid",
  "scores": {
    "computational": 73.0,
    "intuitive": 35.5,
    "visual": 58.5
  },
  "confidence_change": "+5%"
}
```

---

## 6. Frontend Web Application

### 6.1 Student-Facing UI

**Assessment Interface**:
- **Initial Assessment Screen**:
  - Welcome message explaining thinking styles
  - Estimated time (15-20 minutes)
  - Privacy notice
  - Start button

- **Multi-modal Problem Interface**:
  - Problem statement (center)
  - Multiple solution tools available:
    - Text input for calculations
    - Visual diagram tools
    - Quick answer options
  - Subtle tracking (non-intrusive)

- **Results Screen** (optional, for explicit assessment):
  - Friendly visualization of thinking style
  - Strengths and learning tips
  - No negative framing ("you're not good at...")

**Learning Dashboard Widget**:
```jsx
<ThinkingStyleBadge
  primaryStyle="visual"
  score={72}
  variant="compact"
/>
```
- Small indicator showing student's style
- Click to see detailed breakdown
- Recommendations for effective learning

### 6.2 Teacher Dashboard

**Class Overview**:
```jsx
<ThinkingStyleDistribution classId="class-123">
  <PieChart
    data={distributionData}
    colors={styleColors}
  />
  <StudentList
    groupBy="thinkingStyle"
    sortBy="confidence"
  />
</ThinkingStyleDistribution>
```

**Individual Student View**:
```jsx
<StudentThinkingStyleProfile studentId="student-456">
  <StyleScoreChart />
  <HistoricalTrend />
  <PersonalizedRecommendations />
  <ExportToLMSButton />
</StudentThinkingStyleProfile>
```

**Features**:
- Filter students by thinking style
- Group activities for homogeneous/heterogeneous groups
- Personalized content recommendations
- Export reports to LMS

### 6.3 Admin Configuration

**Algorithm Tuning**:
- Adjust factor weights
- Set classification thresholds
- Configure minimum data requirements
- A/B test different algorithms

**LMS Integration Setup**:
- Configure LMS credentials
- Map student IDs
- Set sync frequency
- Configure webhook endpoints

---

## 7. LMS Integration Specifications

### 7.1 Supported Platforms (MVP)

1. **Canvas LMS**
   - LTI 1.3 integration
   - Canvas API for data sync

2. **Moodle**
   - LTI integration
   - Moodle Web Services API

3. **Google Classroom**
   - Google Classroom API
   - OAuth 2.0 authentication

### 7.2 Integration Patterns

**Pattern 1: LTI Embed** (Recommended)
- Embed thinking style assessment as LTI tool in LMS course
- Single sign-on via LTI
- Automatic grade passback (for assessment completion)

**Pattern 2: API Sync**
- Periodic sync of student data
- Export thinking style profiles to LMS custom fields
- Webhook notifications for real-time updates

**Pattern 3: Data Export**
- Manual or scheduled exports (CSV, JSON)
- Teacher downloads and uploads to LMS

### 7.3 Data Mapping

**Student Identity Mapping**:
```json
{
  "internal_student_id": "uuid",
  "lms_platform": "canvas",
  "lms_student_id": "external_id",
  "lms_email": "student@example.com",
  "mapping_verified": true,
  "last_synced": "2025-11-18T10:30:00Z"
}
```

**Thinking Style Export Format** (LMS Custom Fields):
```json
{
  "custom_field_thinking_style_primary": "visual",
  "custom_field_thinking_style_score_comp": 65.5,
  "custom_field_thinking_style_score_intuit": 42.0,
  "custom_field_thinking_style_score_visual": 78.5,
  "custom_field_thinking_style_confidence": "high",
  "custom_field_thinking_style_updated": "2025-11-18"
}
```

### 7.4 Security

- **OAuth 2.0** for LMS authentication
- **HMAC signatures** for webhook verification
- **Encrypted credentials** storage
- **Rate limiting** on API calls
- **Audit logging** of all LMS interactions

---

## 8. Implementation Plan

### Phase 1: Core Classification Engine (Weeks 1-2)
- [ ] Implement database schema
- [ ] Build interaction tracking system
- [ ] Develop classification algorithm
- [ ] Create unit tests for algorithm

### Phase 2: Backend API (Weeks 3-4)
- [ ] Implement REST API endpoints
- [ ] Add WebSocket support for real-time updates
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Integration tests

### Phase 3: Student UI (Week 5)
- [ ] Initial assessment interface
- [ ] Real-time interaction tracking
- [ ] Results visualization
- [ ] Responsive design

### Phase 4: Teacher Dashboard (Week 6)
- [ ] Class distribution view
- [ ] Individual student profiles
- [ ] Recommendations engine
- [ ] Export functionality

### Phase 5: LMS Integration (Weeks 7-8)
- [ ] LTI 1.3 implementation
- [ ] Canvas API integration
- [ ] Data mapping and sync logic
- [ ] Webhook handlers
- [ ] Integration testing with LMS sandbox

### Phase 6: Testing & Refinement (Week 9)
- [ ] End-to-end testing
- [ ] User acceptance testing with teachers
- [ ] Performance optimization
- [ ] Security audit

### Phase 7: Deployment (Week 10)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation
- [ ] Teacher training materials

---

## 9. Success Metrics

### Classification Accuracy
- **Target**: 85% agreement with teacher assessments
- **Measurement**: Teacher validation survey after auto-classification

### Adoption Rate
- **Target**: 70% of teachers using thinking style data within 3 months
- **Measurement**: Usage analytics

### Student Engagement
- **Target**: Students with personalized content show 15% higher engagement
- **Measurement**: Time on task, completion rates

### LMS Integration Success
- **Target**: <2% error rate in LMS syncs
- **Measurement**: Sync logs analysis

---

## 10. Technical Considerations

### Performance
- Classification should complete in <2 seconds
- Real-time interaction tracking with <100ms latency
- Support 1000+ concurrent students

### Scalability
- Horizontal scaling of API servers
- Database read replicas for analytics queries
- Caching of classification results (Redis)

### Privacy & Compliance
- FERPA compliance (US educational data privacy)
- GDPR compliance (if applicable)
- Opt-out mechanism for students
- Anonymous data aggregation for research

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Color-blind friendly visualizations

---

## 11. Future Enhancements

1. **AI-Powered Recommendations**: Use LLM to generate personalized study strategies
2. **Adaptive Content**: Automatically adjust content format based on thinking style
3. **Peer Grouping**: Suggest optimal study groups (mixed vs. homogeneous styles)
4. **Parent Portal**: Share thinking style insights with parents
5. **Multi-language Support**: Extend beyond Korean/English
6. **Mobile App**: Native iOS/Android apps with offline assessment

---

## Document Control

- **Version**: 1.0.0
- **Created**: 2025-11-18
- **Status**: Design Specification
- **Related PRD**: 0001-prd-ai-education-pipeline.md
