# Answer Classification Feature Design

## 1. Overview

### Purpose
Integrate with LMS (Learning Management System) to automatically classify student wrong answer reasons into three categories:
- **개념 (Concept)**: Conceptual misunderstanding or lack of knowledge
- **계산 (Calculation)**: Computational or arithmetic errors
- **조건누락 (Condition Omission)**: Missing or overlooking problem conditions/constraints

### Goals
- Provide actionable feedback to students about their mistakes
- Help teachers identify learning gaps at individual and class levels
- Enable personalized learning paths based on error patterns
- Integrate seamlessly with existing LMS platforms

### Success Metrics
- Classification accuracy > 85% (validated by teacher review)
- Response time < 500ms per answer evaluation
- Teacher approval rate > 80% for auto-classifications
- Student comprehension improvement > 20% after targeted feedback

---

## 2. System Architecture

### High-Level Flow
```
Student Answer → LMS Integration → Answer Evaluator → AI Classifier → Database
                                           ↓                ↓
                                    Is Correct?    Classify Error Type
                                           ↓                ↓
                                    Student UI ← Feedback Generator
```

### Components

#### 2.1 Answer Evaluator
- **Responsibility**: Determine if answer is correct/incorrect
- **Input**: Student answer, problem data, validation rules
- **Output**: Boolean (correct/incorrect) + detailed comparison

#### 2.2 AI Error Classifier
- **Responsibility**: Classify wrong answer into one of three categories
- **Approach**: Use Claude API with structured prompts
- **Input**: Problem, correct answer, student answer, work shown (if available)
- **Output**: Classification (개념/계산/조건누락) + confidence score + explanation

#### 2.3 LMS Integration Layer
- **Responsibility**: Handle communication with external LMS platforms
- **Standards**: LTI (Learning Tools Interoperability) 1.3
- **Authentication**: OAuth 2.0 / JWT tokens
- **Endpoints**: Answer submission, classification retrieval, analytics

#### 2.4 Analytics & Reporting
- **Student Dashboard**: Personal error pattern analysis
- **Teacher Dashboard**: Class-wide error distribution, student progress
- **Insights Engine**: Identify common misconceptions, recommend interventions

---

## 3. Data Models

### 3.1 AnswerSubmission
```typescript
interface AnswerSubmission {
  id: string;                    // UUID
  student_id: string;            // Foreign key to Student
  problem_id: string;            // Foreign key to Problem
  module_id: string;             // Foreign key to Module
  answer_content: string;        // Student's submitted answer
  work_shown?: string;           // Optional: student's work/steps
  is_correct: boolean;           // Evaluation result
  submitted_at: Date;            // Timestamp
  evaluated_at: Date;            // When evaluation completed
  time_spent_seconds: number;   // Time to complete
}
```

### 3.2 AnswerClassification
```typescript
interface AnswerClassification {
  id: string;                           // UUID
  submission_id: string;                // Foreign key to AnswerSubmission
  classification_type: ErrorType;       // 개념 | 계산 | 조건누락
  confidence_score: number;             // 0.0 - 1.0
  explanation: string;                  // Human-readable explanation (Korean)
  ai_reasoning: string;                 // Detailed AI analysis
  teacher_verified: boolean;            // Has teacher reviewed?
  teacher_override?: ErrorType;         // Teacher's classification if different
  classified_at: Date;                  // Timestamp
  feedback_message: string;             // Personalized feedback for student
}

enum ErrorType {
  CONCEPT = '개념',           // Conceptual misunderstanding
  CALCULATION = '계산',        // Calculation error
  CONDITION_OMISSION = '조건누락'  // Missed constraint
}
```

### 3.3 ErrorPattern
```typescript
interface ErrorPattern {
  id: string;                     // UUID
  student_id: string;             // Foreign key to Student
  module_id: string;              // Foreign key to Module
  error_type: ErrorType;          // 개념 | 계산 | 조건누락
  occurrence_count: number;       // How many times this error occurred
  first_occurrence: Date;         // When first seen
  last_occurrence: Date;          // Most recent occurrence
  is_resolved: boolean;           // Has student overcome this error?
  resolved_at?: Date;             // When pattern was resolved
}
```

### 3.4 ClassificationFeedback
```typescript
interface ClassificationFeedback {
  id: string;                        // UUID
  classification_id: string;         // Foreign key to AnswerClassification
  feedback_type: 'concept' | 'hint' | 'example' | 'resource';
  content: string;                   // Feedback content (Korean)
  resource_url?: string;             // Link to learning resource
  created_at: Date;
}
```

---

## 4. AI Classification Logic

### 4.1 Classification Prompt Template
```
You are an expert mathematics education AI assistant specializing in error analysis.

**Problem:**
{problem_text}

**Correct Answer:**
{correct_answer}

**Student's Answer:**
{student_answer}

**Student's Work (if shown):**
{work_shown}

**Task:**
Classify the student's error into ONE of these categories:
1. **개념 (Concept)**: The student misunderstands the fundamental concept or mathematical principle
2. **계산 (Calculation)**: The student understands the concept but made a computational/arithmetic error
3. **조건누락 (Condition Omission)**: The student missed or misread problem constraints/conditions

**Output Format (JSON):**
{
  "classification": "개념" | "계산" | "조건누락",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed analysis in Korean",
  "feedback": "Constructive feedback for the student in Korean",
  "recommended_action": "What the student should review/practice"
}

**Examples:**
[Few-shot examples for each category]
```

### 4.2 Classification Decision Tree

```
Is the answer incorrect?
  ├─ No → No classification needed
  └─ Yes → Analyze error
      │
      ├─ Did student use wrong formula/concept?
      │   └─ Yes → **개념 (Concept)**
      │
      ├─ Did student apply correct method but make arithmetic mistake?
      │   └─ Yes → **계산 (Calculation)**
      │
      └─ Did student ignore/miss a constraint in the problem?
          └─ Yes → **조건누락 (Condition Omission)**
```

### 4.3 Confidence Scoring
- **High Confidence (> 0.85)**: Clear error pattern matches one category
- **Medium Confidence (0.60 - 0.85)**: Some ambiguity, may need teacher review
- **Low Confidence (< 0.60)**: Unclear error, flag for mandatory teacher review

---

## 5. API Endpoints

### 5.1 Answer Submission & Classification
```
POST /api/v1/answers/submit
```
**Request:**
```json
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "answer_content": "student's answer",
  "work_shown": "optional work/steps",
  "time_spent_seconds": 120
}
```

**Response:**
```json
{
  "submission_id": "uuid",
  "is_correct": false,
  "classification": {
    "type": "개념",
    "confidence": 0.92,
    "explanation": "학생이 분수의 덧셈 개념을 이해하지 못했습니다...",
    "feedback": "분수를 더할 때는 분모를 같게 만들어야 합니다..."
  },
  "recommended_resources": [
    {
      "title": "분수 덧셈 기초",
      "url": "/resources/fraction-addition-basics"
    }
  ]
}
```

### 5.2 Get Student Error Patterns
```
GET /api/v1/students/{student_id}/error-patterns
```
**Response:**
```json
{
  "student_id": "uuid",
  "overall_stats": {
    "total_errors": 45,
    "개념_count": 20,
    "계산_count": 15,
    "조건누락_count": 10
  },
  "patterns": [
    {
      "module_id": "uuid",
      "module_name": "분수 학습",
      "error_type": "개념",
      "count": 8,
      "is_improving": true,
      "trend": "decreasing"
    }
  ]
}
```

### 5.3 Teacher Classification Review
```
PUT /api/v1/classifications/{classification_id}/review
```
**Request:**
```json
{
  "teacher_id": "uuid",
  "verified": true,
  "override_type": "계산",  // optional: if teacher disagrees
  "notes": "Actually a calculation error in step 3"
}
```

### 5.4 LMS Integration (LTI)
```
POST /api/v1/lti/outcomes
```
Implements LTI Outcomes Management Service for grade passback.

---

## 6. Frontend Components

### 6.1 Student View Components

#### AnswerFeedbackCard
Displays classification and feedback after submission.

```tsx
interface AnswerFeedbackCardProps {
  isCorrect: boolean;
  classification?: {
    type: ErrorType;
    explanation: string;
    feedback: string;
    confidence: number;
  };
  recommendedResources?: Resource[];
}
```

#### ErrorPatternDashboard
Shows student's personal error analysis.

```tsx
interface ErrorPatternDashboardProps {
  studentId: string;
  errorStats: {
    개념: number;
    계산: number;
    조건누락: number;
  };
  recentErrors: Classification[];
  improvementTrend: TrendData[];
}
```

### 6.2 Teacher View Components

#### ClassErrorAnalytics
Displays class-wide error distribution and insights.

```tsx
interface ClassErrorAnalyticsProps {
  moduleId: string;
  classId: string;
  errorDistribution: {
    개념: { count: number; students: string[] };
    계산: { count: number; students: string[] };
    조건누락: { count: number; students: string[] };
  };
  commonMisconceptions: Misconception[];
}
```

#### ClassificationReviewQueue
Teachers can review and verify AI classifications.

```tsx
interface ClassificationReviewQueueProps {
  pendingReviews: Classification[];
  onVerify: (id: string, verified: boolean, override?: ErrorType) => void;
  onBulkVerify: (ids: string[], verified: boolean) => void;
}
```

---

## 7. LMS Integration

### 7.1 Supported LMS Platforms (Phase 1)
- **Canvas**: LTI 1.3, REST API integration
- **Moodle**: LTI 1.3, plugin support
- **KAIST Internal LMS**: Custom API integration
- **Generic LTI**: Standard LTI 1.3 for other platforms

### 7.2 Integration Flow

```
LMS → Launch LTI Tool → Authenticate → Display Module → Student Submits Answer
                                                              ↓
                                                    Classify & Store
                                                              ↓
                                            Send Grade/Outcome back to LMS
```

### 7.3 Data Synchronization
- **Grade Passback**: Automatic via LTI Outcomes Service
- **Roster Sync**: Daily sync of student enrollment
- **Deep Linking**: Embed modules directly in LMS courses
- **SSO**: Single Sign-On via LTI authentication

---

## 8. Database Schema (SQL)

```sql
-- Answer submissions table
CREATE TABLE answer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES problems(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    answer_content TEXT NOT NULL,
    work_shown TEXT,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    time_spent_seconds INTEGER NOT NULL,
    lms_submission_id VARCHAR(255),  -- External LMS reference
    INDEX idx_student_submissions (student_id, submitted_at DESC),
    INDEX idx_problem_submissions (problem_id, submitted_at DESC)
);

-- Answer classifications table
CREATE TABLE answer_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES answer_submissions(id) ON DELETE CASCADE,
    classification_type VARCHAR(20) NOT NULL CHECK (
        classification_type IN ('개념', '계산', '조건누락')
    ),
    confidence_score DECIMAL(3, 2) NOT NULL CHECK (
        confidence_score >= 0.0 AND confidence_score <= 1.0
    ),
    explanation TEXT NOT NULL,
    ai_reasoning TEXT NOT NULL,
    teacher_verified BOOLEAN DEFAULT FALSE,
    teacher_override VARCHAR(20) CHECK (
        teacher_override IS NULL OR teacher_override IN ('개념', '계산', '조건누락')
    ),
    teacher_id UUID REFERENCES teachers(id),
    verified_at TIMESTAMP,
    classified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    feedback_message TEXT NOT NULL,
    INDEX idx_submission_classification (submission_id),
    INDEX idx_teacher_review (teacher_verified, classified_at DESC)
);

-- Error patterns tracking
CREATE TABLE error_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    error_type VARCHAR(20) NOT NULL CHECK (
        error_type IN ('개념', '계산', '조건누락')
    ),
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    first_occurrence TIMESTAMP NOT NULL DEFAULT NOW(),
    last_occurrence TIMESTAMP NOT NULL DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    UNIQUE (student_id, module_id, error_type),
    INDEX idx_student_patterns (student_id, module_id)
);

-- Classification feedback resources
CREATE TABLE classification_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES answer_classifications(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (
        feedback_type IN ('concept', 'hint', 'example', 'resource')
    ),
    content TEXT NOT NULL,
    resource_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_classification_feedback (classification_id, display_order)
);

-- LMS integration tracking
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_type VARCHAR(50) NOT NULL,  -- 'canvas', 'moodle', 'kaist', etc.
    lms_course_id VARCHAR(255) NOT NULL,
    module_id UUID NOT NULL REFERENCES modules(id),
    consumer_key VARCHAR(255) NOT NULL,
    shared_secret_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMP,
    INDEX idx_lms_course (lms_type, lms_course_id)
);
```

---

## 9. Implementation Phases

### Phase 1: Core Classification (Week 1-2)
- [ ] Implement Answer Evaluator
- [ ] Build AI Classifier with Claude API
- [ ] Create database schema and models
- [ ] Develop basic API endpoints
- [ ] Unit tests for classification logic

### Phase 2: Frontend UI (Week 3)
- [ ] Student answer feedback component
- [ ] Student error pattern dashboard
- [ ] Teacher classification review interface
- [ ] Class analytics dashboard

### Phase 3: LMS Integration (Week 4-5)
- [ ] LTI 1.3 implementation
- [ ] Canvas integration
- [ ] Moodle integration
- [ ] Grade passback functionality
- [ ] SSO and authentication

### Phase 4: Analytics & Refinement (Week 6)
- [ ] Error pattern detection algorithms
- [ ] Personalized feedback generation
- [ ] Resource recommendation engine
- [ ] Performance optimization
- [ ] Teacher training materials

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Answer evaluation accuracy (>95% for rule-based validation)
- Classification logic with mock LLM responses
- Database operations and constraints

### 10.2 Integration Tests
- End-to-end answer submission flow
- LMS integration workflows
- API endpoint contracts

### 10.3 AI Quality Tests
- Classification accuracy on labeled dataset (target >85%)
- Consistency across similar problems
- Handling edge cases (partial answers, nonsensical input)

### 10.4 User Acceptance Testing
- Teacher review of 100 classifications
- Student comprehension of feedback
- LMS integration with real courses

---

## 11. Security & Privacy

### 11.1 Data Protection
- Encrypt student answers and work at rest (AES-256)
- Anonymize data for AI training/improvement
- Comply with FERPA, COPPA, GDPR, K-PIPA

### 11.2 LMS Integration Security
- OAuth 2.0 for LTI authentication
- Signed JWT tokens with expiration
- Validate all incoming LTI launches
- Rate limiting: 100 submissions/minute per student

### 11.3 AI Safety
- No storage of student PII in Claude API logs
- Sanitize inputs to prevent prompt injection
- Audit all AI responses for appropriateness
- Fallback to rule-based classification if AI unavailable

---

## 12. Performance Requirements

- **Answer Evaluation**: < 200ms
- **AI Classification**: < 500ms (p95)
- **API Response Time**: < 1 second total (p95)
- **Dashboard Load**: < 2 seconds for 100 students
- **Concurrent Users**: Support 500 simultaneous answer submissions

---

## 13. Monitoring & Observability

### Metrics to Track
- Classification accuracy (teacher verification rate)
- Error type distribution over time
- Student improvement rates after targeted feedback
- API latency and error rates
- LMS integration health

### Alerts
- Classification confidence < 0.6 for > 10% of submissions
- API error rate > 1%
- LMS sync failures
- Database query performance degradation

---

## 14. Future Enhancements

### Post-MVP Features
- Multi-language support (English, Korean)
- Voice input for answers
- Handwriting recognition for math notation
- Adaptive difficulty based on error patterns
- Peer comparison analytics
- Gamification (badges for error type mastery)
- Mobile app for offline answer submission

### Advanced AI Features
- Fine-tuned classification model for KAIST curriculum
- Automatic hint generation
- Predicted error prevention (proactive feedback)
- Natural language explanation of solutions
- Multi-step problem analysis (classify errors in each step)

---

## Document Control
- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Status**: Design Document - Ready for Implementation
- **Related**: tasks/0001-prd-ai-education-pipeline.md
