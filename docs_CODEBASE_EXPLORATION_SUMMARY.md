# Comprehensive Codebase Exploration Summary

## EXECUTIVE SUMMARY

### Repository Status
- **Current State**: Early-stage repository with PRD only
- **Branch**: Feature branch for "missed question feedback" feature
- **Technology Stack**: Moodle 3.7 + MySQL 5.7 + PHP 7.1.9
- **Status**: Ready for implementation

### Key Findings

1. **No existing implementation code** - Only PRD document present
2. **Well-defined requirements** - Comprehensive PRD covers AI Education System Pipeline
3. **Clear integration path** - Feature fits naturally into Moodle quiz system
4. **Moodle 3.7 standard architecture** - Well-documented patterns to follow

---

## 1. PROJECT STRUCTURE OVERVIEW

### What Currently Exists
```
/home/user/alt42standalone_v1.0/
├── .git/                 # Git repository
└── tasks/
    └── 0001-prd-ai-education-pipeline.md  # 49KB comprehensive PRD
```

### What Should Be Built
A Moodle local plugin (`local/missedquestionfeedback`) that:
- Enhances question feedback with misconception analysis
- Displays "What did you miss in this question?" content for incorrect answers
- Tracks student interactions with feedback
- Provides teacher analytics on misconceptions

---

## 2. TECHNOLOGY STACK DETAILS

### Platform & Database
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **LMS** | Moodle | 3.7 | Learning management system hosting quiz system |
| **Database** | MySQL | 5.7 | Data storage for all Moodle content |
| **Server Language** | PHP | 7.1.9 | Backend processing (Moodle requirement) |
| **Template Engine** | Mustache | 2.x+ | HTML rendering (Moodle standard) |
| **Frontend JS** | AMD/jQuery | latest | Interactive features (Moodle standard) |

### Key Framework Components
- **Moodle Plugin Framework** - For extending functionality
- **Moodle DML** - Database access layer (abstraction)
- **Moodle Events** - Event system for logging interactions
- **Moodle Capabilities** - Permission/access control system

---

## 3. MOODLE QUIZ & QUESTION SYSTEM ARCHITECTURE

### Core Components

```
┌─────────────────────────────────────────────────┐
│          Quiz Module (mod/quiz/)                 │
│  - Quiz creation and configuration              │
│  - Attempt management (quiz taking)             │
│  - Review interface (viewing results)           │
└────────────┬────────────────────────────────────┘
             │ Uses
┌────────────▼────────────────────────────────────┐
│       Question Engine (mod/question/)            │
│  - Question instantiation                       │
│  - Response collection & grading                │
│  - Feedback rendering                           │
└────────────┬────────────────────────────────────┘
             │ Manages
┌────────────▼────────────────────────────────────┐
│     Question Types (qtype_*)                     │
│  - Multiple choice                              │
│  - Short answer                                 │
│  - True/False                                   │
│  - Essay, Numerical, etc.                       │
└─────────────────────────────────────────────────┘
```

### Critical Database Tables

**mdl_quiz** - Quiz definition
- id, course, name, intro, timeopen, timeclose, feedbacktext

**mdl_quiz_attempts** - Student quiz attempts
- id, quiz, userid, attempt, state, sumgrades, timefinish

**mdl_questions** - Question definitions
- id, category, type, name, questiontext, generalfeedback

**mdl_question_answers** - Answer choices for questions
- id, question, answer, fraction, feedback, feedbackformat
- **[EXTEND WITH]: missed_feedback, concept_id, misconception_id**

**mdl_question_attempts** - Individual question responses
- id, questionusageid, slot, questionid, responsesummary, state

---

## 4. EXISTING FEEDBACK MECHANISM IN MOODLE 3.7

### Current Feedback Types

#### 1. Per-Answer Feedback (Immediate)
```php
// Shown when student selects an answer
// From: mdl_question_answers.feedback
Example: "Incorrect. 3/4 + 1/4 = 4/4, not 3/5"
```

#### 2. Range-Based Quiz Feedback (After completion)
```php
// Based on total score
// From: mdl_quiz_feedback
Example: "Score 0-50%: You need more practice"
         "Score 50-100%: Great job!"
```

#### 3. General Feedback (Per question)
```php
// From: mdl_questions.generalfeedback
Example: "This question tests your understanding of fractions"
```

### Feedback Display Chain
```
mod/quiz/review.php (entry point)
  ↓
question/renderer.php (renders question)
  ↓
question/type/{type}/renderer.php (type-specific rendering)
  ↓
Displays mdl_question_answers.feedback for selected answer
```

---

## 5. WHERE THE MISSED QUESTION FEEDBACK FEATURE INTEGRATES

### Integration Architecture

```
Student views quiz review (mod/quiz/review.php)
  ↓
System renders question with standard feedback
  ↓
[NEW] Check if answer is incorrect AND misconception feedback exists
  ↓
[NEW] Load misconception data from:
      - mdl_missed_feedback_concepts
      - mdl_missed_feedback_misconceptions
  ↓
[NEW] Render "What did you miss?" section containing:
      - Concept being tested
      - Student's misconception
      - Correct understanding
      - Link to remediation resource
  ↓
[NEW] Log interaction to mdl_missed_feedback_interactions
```

### Recommended Integration Point

**File to modify**: `mod/quiz/review.php` (approx. line 150-200)

```php
// After existing question feedback is rendered:
if (local_missedquestionfeedback_is_enabled($quiz)) {
    $misconception_feedback = local_missedquestionfeedback_api
        ::get_feedback_for_answer($qa->question->id, $selected_answer_id);
    
    if ($misconception_feedback && $qa->get_state() == 'wrong') {
        echo $renderer->render_missed_feedback_block($misconception_feedback);
    }
}
```

---

## 6. DATABASE SCHEMA FOR MISSED QUESTION FEEDBACK

### New Tables Required

#### Table 1: Concepts
```sql
CREATE TABLE mdl_missed_feedback_concepts (
    id BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,          -- "Fraction Addition", "Decimal Places"
    description LONGTEXT,                 -- Topic description
    timecreated BIGINT(10) UNSIGNED,
    timemodified BIGINT(10) UNSIGNED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Table 2: Misconceptions
```sql
CREATE TABLE mdl_missed_feedback_misconceptions (
    id BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    concept_id BIGINT(10) UNSIGNED NOT NULL,  -- Which concept this addresses
    misconception_text LONGTEXT NOT NULL,     -- What students think (wrong)
    correct_understanding LONGTEXT NOT NULL,  -- What they should know
    typical_student_answer VARCHAR(255),      -- Example: "3 + 1 = 4/4"
    remediation_strategy LONGTEXT,            -- How to teach it
    resource_url TEXT,                        -- Link to learning material
    timecreated BIGINT(10) UNSIGNED,
    timemodified BIGINT(10) UNSIGNED,
    FOREIGN KEY (concept_id) REFERENCES mdl_missed_feedback_concepts(id),
    KEY idx_concept (concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Table 3: Analytics/Interactions
```sql
CREATE TABLE mdl_missed_feedback_interactions (
    id BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    userid BIGINT(10) UNSIGNED NOT NULL,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    attemptid BIGINT(10) UNSIGNED NOT NULL,
    misconceptionid BIGINT(10) UNSIGNED,
    feedback_viewed TINYINT(1) DEFAULT 0,
    viewed_at BIGINT(10) UNSIGNED,
    time_spent_seconds INT UNSIGNED,
    action_after_feedback VARCHAR(50),        -- 'reattempt', 'continue', 'exit'
    timecreated BIGINT(10) UNSIGNED,
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (questionid) REFERENCES mdl_question(id),
    FOREIGN KEY (attemptid) REFERENCES mdl_quiz_attempts(id),
    FOREIGN KEY (misconceptionid) REFERENCES mdl_missed_feedback_misconceptions(id),
    KEY idx_user (userid),
    KEY idx_question (questionid),
    KEY idx_attempt (attemptid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Modification to Existing Table

#### mdl_question_answers
Add optional columns to link answers to misconceptions:
```sql
ALTER TABLE mdl_question_answers ADD COLUMNS (
    misconception_id BIGINT(10) UNSIGNED DEFAULT NULL,
    missed_feedback LONGTEXT DEFAULT NULL,
    missed_feedback_format TINYINT(2) UNSIGNED DEFAULT 1
);
```

---

## 7. KEY MOODLE CLASSES & FILES TO UNDERSTAND

### Question Engine (Core to feature)

**Class**: `question_attempt` (question/engine/lib.php)
```php
// Access student's response to specific question
$qa->get_state();                    // 'wrong', 'correct', 'partial'
$qa->get_response_summary();         // Student's answer text
$qa->get_question();                 // Full question object
$qa->get_correct_response();         // Correct answer
```

**Class**: `question_usage_by_activity` (question/engine/lib.php)
```php
// Access all questions in a quiz attempt
$quba->get_question_attempt($slot);  // Get specific question
$quba->get_num_questions();          // Total questions
```

### Quiz Module Integration

**File**: `mod/quiz/review.php`
- Displays quiz attempt review
- **Integration point**: After displaying each question's feedback
- Shows answers, feedback, and grades

**File**: `mod/quiz/locallib.php`
- Helper functions for quiz operations
- **Use for**: Loading quiz configuration, checking permissions

**File**: `mod/quiz/lib.php`
- Plugin callbacks and Moodle hooks
- **Use for**: Event observers, activity module integration

### Rendering Questions

**Class**: `question_renderer` (question/renderer.php)
```php
public function question($qa, $options) {
    // Renders complete question including feedback
    // $qa is question_attempt object
    // This is where we inject missed feedback
}
```

**Class**: Type-specific renderers (question/type/{type}/renderer.php)
```php
// Extend for different question types:
// - qtype_multichoice_renderer
// - qtype_shortanswer_renderer
// - etc.
```

---

## 8. PLUGIN STRUCTURE (What to Create)

### Recommended Plugin Location
```
{MOODLE_HOME}/local/missedquestionfeedback/
```

### Plugin File Structure
```
local/missedquestionfeedback/
├── version.php                    # Plugin metadata
├── lib.php                        # Main plugin callbacks
├── classes/
│   ├── api.php                   # Main API class
│   ├── renderer.php              # Output rendering
│   ├── event/
│   │   └── feedback_viewed.php   # Event class
│   └── observer.php              # Event observers
├── db/
│   ├── install.xml               # Schema definition (Moodle format)
│   ├── upgrade.php               # Migration scripts
│   └── access.php                # Capability definitions
├── admin/
│   ├── manage_concepts.php       # Concept management UI
│   ├── manage_misconceptions.php # Misconception UI
│   └── view_analytics.php        # Analytics dashboard
├── templates/                    # Mustache templates
│   └── missed_feedback.mustache  # Feedback rendering template
├── amd/src/                      # JavaScript modules
│   └── feedback_tracker.js       # Track user interaction
├── styles/
│   └── styles.css               # Plugin-specific CSS
├── lang/
│   ├── en/
│   │   └── local_missedquestionfeedback.php
│   └── ko/                       # Korean translation
│       └── local_missedquestionfeedback.php
└── tests/
    └── *_test.php               # PHPUnit tests
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Create local/missedquestionfeedback plugin structure
- [ ] Define install.xml with new database tables
- [ ] Create API class with basic methods
- [ ] Set up version.php and metadata

### Phase 2: Data Management (Week 2-3)
- [ ] Create admin form for managing concepts
- [ ] Create admin form for managing misconceptions
- [ ] Create UI to map questions → misconceptions
- [ ] Implement data loading/caching

### Phase 3: Display & Integration (Week 3-4)
- [ ] Create renderer for missed feedback display
- [ ] Integrate with mod/quiz/review.php
- [ ] Create Mustache template for UI
- [ ] Add CSS styling

### Phase 4: Analytics (Week 4-5)
- [ ] Implement feedback interaction logging
- [ ] Create analytics queries
- [ ] Build teacher dashboard
- [ ] Generate reports

### Phase 5: Testing & Polish (Week 5-6)
- [ ] Write unit tests (PHPUnit)
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Bug fixes and refinement

---

## 10. CRITICAL CODE EXAMPLES

### Example 1: API Method to Get Misconception Feedback
```php
<?php
// local/missedquestionfeedback/classes/api.php

namespace local_missedquestionfeedback;

class api {
    /**
     * Get misconception feedback for a given wrong answer
     * 
     * @param int $questionid Question ID
     * @param int $answerid Answer choice ID
     * @return object|null Feedback object or null
     */
    public static function get_feedback_for_answer($questionid, $answerid) {
        global $DB;
        
        $sql = "SELECT m.*, c.name as concept_name
                FROM {missed_feedback_misconceptions} m
                JOIN {missed_feedback_concepts} c ON m.concept_id = c.id
                WHERE m.id = (
                    SELECT misconception_id FROM {question_answers}
                    WHERE id = :answerid AND question = :questionid
                )";
        
        return $DB->get_record_sql($sql, [
            'answerid' => $answerid,
            'questionid' => $questionid
        ]);
    }
}
```

### Example 2: Integration in mod/quiz/review.php
```php
<?php
// Location: mod/quiz/review.php (around line 150-200)

// After rendering standard question feedback:
if (plugin_exists('local_missedquestionfeedback')) {
    require_once($CFG->dirroot . '/local/missedquestionfeedback/lib.php');
    
    // Check if student got this question wrong
    if ($qa->get_state() != 'correct') {
        $feedback = local_missedquestionfeedback_get_feedback(
            $qa->question->id, 
            $selected_answer_id
        );
        
        if ($feedback) {
            echo $renderer->render_missed_feedback_block($feedback);
            local_missedquestionfeedback_log_interaction($feedback->id);
        }
    }
}
```

### Example 3: Mustache Template for Feedback Display
```mustache
{{! local/missedquestionfeedback/templates/missed_feedback.mustache }}

<div class="alert alert-info missed-feedback-container">
    <h4 class="missed-feedback-title">
        <i class="fa fa-lightbulb-o"></i> {{#str}}whatyoumissed{{/str}}
    </h4>
    
    <div class="missed-feedback-content">
        <div class="concept-section">
            <strong>{{#str}}concepttested{{/str}}:</strong>
            {{concept_name}}
        </div>
        
        <div class="misconception-section">
            <strong>{{#str}}yourmisunderstanding{{/str}}:</strong>
            <p>{{misconception_text}}</p>
        </div>
        
        <div class="correct-section">
            <strong>{{#str}}correctunderstanding{{/str}}:</strong>
            <p>{{correct_understanding}}</p>
        </div>
        
        {{#resource_url}}
        <div class="remediation-section">
            <a href="{{resource_url}}" class="btn btn-primary">
                {{#str}}learnmore{{/str}}
            </a>
        </div>
        {{/resource_url}}
    </div>
</div>
```

### Example 4: Event for Logging Feedback Interaction
```php
<?php
// local/missedquestionfeedback/classes/event/feedback_viewed.php

namespace local_missedquestionfeedback\event;

defined('MOODLE_INTERNAL') || die();

class feedback_viewed extends \core\event\base {
    protected function init() {
        $this->data['crud'] = 'c'; // create
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'missed_feedback_interactions';
    }
    
    public static function create_from_interaction($data) {
        $event = self::create([
            'objectid' => $data['misconceptionid'],
            'userid' => $data['userid'],
            'context' => \context_course::instance($data['courseid']),
            'other' => [
                'questionid' => $data['questionid'],
                'attemptid' => $data['attemptid'],
            ]
        ]);
        
        return $event;
    }
    
    public function get_description() {
        return "User {$this->userid} viewed missed question feedback for " .
               "question {$this->data['other']['questionid']}";
    }
}
```

---

## 11. MOODLE CONVENTIONS TO FOLLOW

### 1. Plugin Structure
- Must follow Moodle plugin naming: `local/{pluginname}`
- Must include `version.php` with metadata
- Must include `lang/` directory with English strings
- Must include `db/` directory with schema

### 2. Database Access
```php
// Use Moodle DML, never raw SQL
global $DB;

// Select
$record = $DB->get_record('mytable', ['id' => $id]);
$records = $DB->get_records('mytable', ['status' => 1]);

// Insert
$DB->insert_record('mytable', $data);

// Update
$DB->update_record('mytable', $record);

// Delete
$DB->delete_records('mytable', ['id' => $id]);
```

### 3. Capabilities & Permissions
```php
// In db/access.php
$capabilities = array(
    'local/missedquestionfeedback:manage_feedback' => array(
        'riskbitmask' => RISK_PERSONAL,
        'captype' => 'manage',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => array('manager', 'teacher'),
    ),
);
```

### 4. String Management
```php
// Always use get_string() for all user-facing text
echo get_string('whatyoumissed', 'local_missedquestionfeedback');

// Define in lang/{lang}/local_missedquestionfeedback.php
$string['whatyoumissed'] = 'What did you miss in this question?';
$string['concepttested'] = 'Concept tested';
$string['yourmisunderstanding'] = 'Your misunderstanding';
```

### 5. Output & Templates
```php
// Use plugin_renderer_base for output
// Use Mustache templates for HTML
echo $renderer->render_from_template(
    'local_missedquestionfeedback/missed_feedback',
    $templatedata
);
```

---

## 12. TESTING CONSIDERATIONS

### Unit Tests (with PHPUnit)
```php
class api_test extends \advanced_testcase {
    public function test_get_feedback_for_answer() {
        $this->resetAfterTest(true);
        
        // Create test data
        $concept = $this->create_concept('Fractions');
        $misconception = $this->create_misconception($concept);
        
        // Test API
        $feedback = api::get_feedback_for_answer(1, 2);
        
        $this->assertNotNull($feedback);
        $this->assertEquals($misconception->id, $feedback->id);
    }
}
```

### Integration Tests
- Test with real Moodle quiz
- Verify feedback displays correctly in review
- Check analytics data is logged properly

---

## 13. KEY TAKEAWAYS FOR IMPLEMENTATION

1. **Start with database schema** - Define tables in install.xml
2. **Build API layer first** - Create classes for data access
3. **Integration point is mod/quiz/review.php** - Where feedback displays
4. **Follow Moodle conventions** - Use DML, capabilities, string management
5. **Test thoroughly** - Quiz system is critical, impacts student experience
6. **Consider performance** - Quiz reviews are frequently accessed
7. **Plan for localization** - Korean + English language support needed
8. **Use Moodle events** - For logging and analytics
9. **Build incremental** - Get basic feedback working, then add analytics
10. **Document well** - Plugin development is complex

---

## 14. RESOURCES & REFERENCES

### Official Moodle Documentation
- Plugin development: https://docs.moodle.org/dev/Plugin_types
- Question engine: https://docs.moodle.org/dev/Question_engine
- Database API: https://docs.moodle.org/dev/Data_manipulation_API
- Output API: https://docs.moodle.org/dev/Output_API

### Moodle 3.7 Specific
- Release notes: https://docs.moodle.org/37/en/
- API changes from 3.6: https://docs.moodle.org/dev/Moodle_3.7_release_notes

---

## NEXT STEPS

1. Review this document with development team
2. Validate assumptions with Moodle admin (existing schema)
3. Create initial plugin scaffold
4. Design database schema in detail
5. Implement API layer
6. Build admin UI for misconception management
7. Integrate with quiz review page
8. Add analytics and reporting
9. Testing and refinement
10. Deployment and monitoring

