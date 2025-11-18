# Moodle Integration: Reasoning Path Grading System

## Overview
추론 경로 완성도 기반 채점 시스템 - Moodle 3.7 LMS 통합

## System Requirements
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **AI Engine**: Claude API (for reasoning analysis)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Custom Question Type: qtype_reasoningpath          │   │
│  │  - Student Answer Capture                           │   │
│  │  - Step-by-step Input Interface                     │   │
│  │  - Visual Reasoning Path Builder                    │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │  Custom Grading Behavior: qbehaviour_reasoning      │   │
│  │  - Capture all intermediate steps                   │   │
│  │  - Store reasoning path data                        │   │
│  │  - Trigger AI analysis                              │   │
│  └──────────────────┬──────────────────────────────────┘   │
└────────────────────┬┼────────────────────────────────────────┘
                     ││
┌────────────────────▼▼────────────────────────────────────────┐
│              MySQL 5.7 Database                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ mdl_qtype_reasoningpath_steps                      │     │
│  │ - step_id, question_attempt_id                     │     │
│  │ - step_number, step_type, step_content             │     │
│  │ - is_correct, reasoning_quality_score              │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ mdl_qtype_reasoningpath_analysis                   │     │
│  │ - analysis_id, question_attempt_id                 │     │
│  │ - completeness_score, logical_coherence_score      │     │
│  │ - method_appropriateness_score                     │     │
│  │ - final_grade, ai_feedback                         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────┬────────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────────┐
│         Reasoning Path Analysis Engine (Python)              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Path Analyzer                                     │     │
│  │  - Step validation                                 │     │
│  │  - Logical flow analysis                           │     │
│  │  - Completeness checking                           │     │
│  └─────────────────┬──────────────────────────────────┘     │
│  ┌─────────────────▼──────────────────────────────────┐     │
│  │  AI Grading Engine (Claude API)                    │     │
│  │  - Evaluate reasoning quality                      │     │
│  │  - Assess mathematical rigor                       │     │
│  │  - Generate constructive feedback                  │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Grading Criteria: Reasoning Path Completeness

### 1. Completeness Score (40%)
- **All necessary steps present**: Each logical step in problem solving
- **No missing gaps**: Continuous reasoning from problem to solution
- **Explicit assumptions**: Student states assumptions clearly

**Calculation**:
```
completeness = (steps_present / steps_required) * 40
```

### 2. Logical Coherence Score (30%)
- **Valid logical connections**: Each step follows from previous
- **No contradictions**: Reasoning is internally consistent
- **Proper sequencing**: Steps in appropriate order

**Criteria**:
- Each step has clear logical relationship to previous: +10%
- No logical fallacies detected: +10%
- Proper mathematical/logical notation: +10%

### 3. Method Appropriateness Score (20%)
- **Suitable approach**: Method is appropriate for problem type
- **Efficient strategy**: Not unnecessarily complex
- **Domain knowledge**: Shows understanding of concepts

**Evaluation**:
- Method matches problem type: +10%
- Demonstrates conceptual understanding: +10%

### 4. Clarity & Communication Score (10%)
- **Clear explanation**: Steps are understandable
- **Proper notation**: Correct mathematical symbols
- **Justification**: Student explains why steps are taken

## Integration Flow

### 1. Question Setup (Teacher)
```
Teacher creates question in Moodle:
├── Question Text: "Solve 2x + 5 = 13"
├── Expected Solution Steps:
│   ├── Step 1: Subtract 5 from both sides
│   ├── Step 2: Simplify to 2x = 8
│   ├── Step 3: Divide both sides by 2
│   └── Step 4: Simplify to x = 4
└── Grading Rubric:
    ├── Minimum steps required: 4
    ├── Key concepts: equation manipulation, inverse operations
    └── Common mistakes to check for
```

### 2. Student Attempt
```
Student interface:
├── Problem Display
├── Step-by-step input:
│   ├── Step 1: [Text input] + [Mathematical notation]
│   ├── Step 2: [Text input] + [Mathematical notation]
│   ├── ...
│   └── Add Step [Button]
├── Work space for scratch work
└── Submit [Button]
```

### 3. Grading Process
```
On submission:
1. Store all steps in database
2. Call Reasoning Path Analysis Engine
3. AI analyzes:
   - Step correctness
   - Logical flow
   - Completeness
   - Quality of reasoning
4. Generate scores per criterion
5. Compute final grade
6. Generate feedback
7. Store in Moodle gradebook
```

## Database Schema (MySQL 5.7)

### Table: mdl_qtype_reasoningpath
```sql
CREATE TABLE mdl_qtype_reasoningpath (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) NOT NULL,
    min_steps_required INT(3) NOT NULL DEFAULT 3,
    expected_steps TEXT,
    grading_rubric TEXT,
    allow_multiple_methods TINYINT(1) DEFAULT 1,
    enable_ai_grading TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id),
    KEY questionid (questionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Reasoning path question definitions';
```

### Table: mdl_qtype_reasoningpath_steps
```sql
CREATE TABLE mdl_qtype_reasoningpath_steps (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    questionattemptid BIGINT(10) NOT NULL,
    step_number INT(3) NOT NULL,
    step_type VARCHAR(50) DEFAULT 'calculation',
    step_description TEXT,
    step_content TEXT,
    mathematical_expression TEXT,
    is_correct TINYINT(1) DEFAULT NULL,
    partial_credit DECIMAL(10,5) DEFAULT NULL,
    reasoning_quality_score DECIMAL(10,5) DEFAULT NULL,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY questionattemptid (questionattemptid),
    KEY step_number (step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student reasoning steps';
```

### Table: mdl_qtype_reasoningpath_analysis
```sql
CREATE TABLE mdl_qtype_reasoningpath_analysis (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    questionattemptid BIGINT(10) NOT NULL,
    completeness_score DECIMAL(10,5) NOT NULL DEFAULT 0,
    logical_coherence_score DECIMAL(10,5) NOT NULL DEFAULT 0,
    method_appropriateness_score DECIMAL(10,5) NOT NULL DEFAULT 0,
    clarity_score DECIMAL(10,5) NOT NULL DEFAULT 0,
    final_grade DECIMAL(10,5) NOT NULL,
    ai_feedback TEXT,
    ai_model_used VARCHAR(100),
    analysis_metadata TEXT,
    graded_by VARCHAR(50) DEFAULT 'ai',
    timecreated BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY questionattemptid (questionattemptid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI grading analysis results';
```

## Moodle Plugin Structure

```
moodle/question/type/reasoningpath/
├── version.php                 # Plugin version and dependencies
├── db/
│   ├── install.xml            # Database schema
│   ├── upgrade.php            # Upgrade scripts
│   └── access.php             # Capabilities
├── lang/
│   ├── en/
│   │   └── qtype_reasoningpath.php
│   └── ko/
│       └── qtype_reasoningpath.php
├── classes/
│   ├── question.php           # Question type class
│   ├── edit_form.php          # Question editing form
│   ├── renderer.php           # Display renderer
│   └── privacy/
│       └── provider.php       # GDPR compliance
├── questiontype.php           # Main question type class
├── question.php               # Question definition
├── renderer.php               # Output renderer
├── edit_reasoningpath_form.php
├── api/
│   ├── analyze_reasoning.php  # API endpoint for AI analysis
│   └── save_step.php          # AJAX step saving
├── amd/src/                   # JavaScript modules
│   ├── step_builder.js        # Interactive step builder
│   └── math_input.js          # Mathematical notation input
└── styles.css

moodle/question/behaviour/reasoning/
├── version.php
├── behaviour.php              # Custom grading behavior
├── behaviourtype.php
└── renderer.php
```

## API Integration Points

### 1. Moodle → Analysis Engine
```php
// File: question/type/reasoningpath/classes/analyzer.php

class reasoning_analyzer {
    private $api_endpoint;

    public function analyze_reasoning_path($attempt_id, $steps) {
        // Prepare data
        $data = [
            'attempt_id' => $attempt_id,
            'steps' => $steps,
            'question_context' => $this->get_question_context($attempt_id)
        ];

        // Call Python analysis engine
        $response = $this->call_analysis_api($data);

        // Store results
        $this->store_analysis_results($attempt_id, $response);

        return $response;
    }
}
```

### 2. Analysis Engine API (Python/FastAPI)
```python
# File: analysis_engine/main.py

from fastapi import FastAPI
from anthropic import Anthropic

app = FastAPI()
anthropic_client = Anthropic()

@app.post("/analyze-reasoning")
async def analyze_reasoning_path(request: ReasoningPathRequest):
    """
    Analyze student's reasoning path for completeness and quality
    """
    # Extract steps
    steps = request.steps
    question = request.question_context

    # Build AI prompt
    prompt = build_reasoning_analysis_prompt(steps, question)

    # Call Claude API
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    # Parse AI response
    analysis = parse_ai_response(response.content[0].text)

    # Calculate scores
    scores = calculate_reasoning_scores(analysis, steps)

    return {
        "completeness_score": scores['completeness'],
        "logical_coherence_score": scores['coherence'],
        "method_appropriateness_score": scores['method'],
        "clarity_score": scores['clarity'],
        "final_grade": scores['final'],
        "feedback": analysis['feedback']
    }
```

## Deployment Strategy

### Phase 1: Moodle Plugin Development
1. Create custom question type plugin
2. Develop database schema
3. Build question editing interface
4. Implement student answer interface

### Phase 2: Analysis Engine
1. Set up Python FastAPI service
2. Integrate Claude API
3. Develop reasoning analysis algorithms
4. Create scoring rubrics

### Phase 3: Integration
1. Connect Moodle to Analysis Engine (REST API)
2. Implement asynchronous grading
3. Add feedback display in Moodle
4. Create teacher dashboard

### Phase 4: Testing & Deployment
1. Unit testing (PHP & Python)
2. Integration testing
3. User acceptance testing with teachers
4. Production deployment

## Security Considerations

### 1. API Security
- **Authentication**: JWT tokens for API calls
- **Rate limiting**: Prevent abuse of AI API
- **Input validation**: Sanitize all user inputs

### 2. Data Privacy
- **GDPR compliance**: Student data handling
- **Encryption**: Sensitive data encrypted at rest
- **Access control**: Role-based permissions

### 3. Code Security (PHP 7.1.9)
- **SQL injection prevention**: Use Moodle DML
- **XSS prevention**: Output escaping
- **CSRF protection**: Moodle form tokens

## Performance Optimization

### 1. Caching
- Cache AI analysis for identical reasoning paths
- Use Redis for session management

### 2. Asynchronous Processing
- Queue AI analysis jobs (Moodle's task API)
- Background processing for large batches

### 3. Database Optimization
- Proper indexing on frequently queried fields
- Denormalization where appropriate for reads

## Monitoring & Analytics

### Teacher Dashboard Metrics
- Average reasoning path completeness score
- Most common missing steps
- Student struggle points
- Comparison: reasoning path scores vs. final answer accuracy

### System Metrics
- AI API response times
- Grading accuracy (teacher review)
- Student engagement (step completion rates)
- Cost per analysis (Claude API usage)

## Future Enhancements

1. **Real-time hints**: AI-powered hints based on incomplete reasoning
2. **Peer comparison**: Show anonymized exemplar reasoning paths
3. **Adaptive difficulty**: Adjust problem complexity based on reasoning quality
4. **Multi-language support**: Reasoning in Korean and English
5. **Visual reasoning**: Support diagrams and geometric proofs
