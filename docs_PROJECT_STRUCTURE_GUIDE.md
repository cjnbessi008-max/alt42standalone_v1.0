# Project Structure & Implementation Guide

## CURRENT REPOSITORY STATE

```
/home/user/alt42standalone_v1.0/
├── .git/                                  # Git repository
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # Comprehensive PRD document (49KB)
└── (NO implementation code yet)

Branch: claude/lms-missed-question-feedback-01P7ho5XDY2FyWmdjNvmxxmm
Status: Clean (ready for feature development)
```

## RECOMMENDED PROJECT STRUCTURE AFTER IMPLEMENTATION

This is how the repository SHOULD be structured once implementation begins:

```
/alt42standalone_v1.0/
├── .git/
├── .github/
│   └── workflows/              # CI/CD pipelines
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
├── docs/
│   ├── ARCHITECTURE.md         # Technical architecture
│   ├── MOODLE_INTEGRATION.md   # Moodle-specific docs
│   ├── DATABASE.md             # Database schema docs
│   ├── API.md                  # API documentation
│   └── INSTALLATION.md         # Setup instructions
├── moodle-plugins/             # All Moodle-related code
│   ├── local/missedquestionfeedback/
│   │   ├── version.php
│   │   ├── lib.php
│   │   ├── classes/
│   │   │   ├── api.php
│   │   │   ├── renderer.php
│   │   │   ├── event/
│   │   │   ├── observer/
│   │   │   └── privacy/
│   │   ├── admin/
│   │   │   ├── manage_concepts.php
│   │   │   ├── manage_misconceptions.php
│   │   │   └── view_analytics.php
│   │   ├── db/
│   │   │   ├── install.xml       # Schema definitions
│   │   │   ├── upgrade.php       # Migration scripts
│   │   │   └── access.php        # Capabilities
│   │   ├── lang/
│   │   │   ├── en/
│   │   │   └── ko/               # Korean language pack
│   │   ├── templates/            # Mustache templates
│   │   ├── amd/src/              # AMD JavaScript modules
│   │   ├── styles/
│   │   │   └── style.css
│   │   ├── tests/
│   │   │   ├── fixtures/
│   │   │   ├── generator/
│   │   │   └── unit/
│   │   └── README.md
│   └── mod/quiz/
│       └── (extensions to quiz module)
├── database/
│   ├── migrations/               # Database migration scripts
│   │   ├──001_create_concepts_table.sql
│   │   ├── 002_create_misconceptions_table.sql
│   │   ├── 003_create_feedback_interactions.sql
│   │   └── 004_add_fields_to_question_answers.sql
│   └── seeds/                    # Initial data
│       └── concepts.sql
├── tests/
│   ├── integration/              # Integration tests with Moodle
│   ├── acceptance/               # Acceptance tests
│   └── fixtures/                 # Test data
├── scripts/
│   ├── install.sh               # Installation script
│   ├── migrate.sh               # Database migration
│   └── reset.sh                 # Reset for testing
├── config/
│   ├── default.php              # Default settings
│   └── example-moodle.php       # Example Moodle config
├── README.md                    # Project overview
├── CONTRIBUTING.md              # Contributing guidelines
├── LICENSE                      # License
└── docker-compose.yml           # Local dev environment (optional)
```

## TECHNOLOGY STACK SUMMARY

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| LMS | Moodle | 3.7 | Host platform for quiz system |
| Database | MySQL | 5.7 | Data persistence |
| Server-side Language | PHP | 7.1.9 | Moodle compatibility |
| Template Engine | Mustache | 2.x | Moodle standard |
| Frontend JS | AMD/jQuery | - | Moodle standard |
| CSS | SCSS/CSS | - | Moodle theme-compatible |
| Testing | PHPUnit | 5.x | Unit testing |

## CRITICAL DATABASE TABLES

### Existing Moodle Tables (Used by feature)

```
┌─────────────────────────────────────────────────────────┐
│                   mdl_quiz                              │
│ Quiz instance configuration                             │
│ - id, course, name, timeopen, timeclose, feedbacktext   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ mdl_quiz_attempts (Student attempts)
                 │   - id, quiz, userid, attempt, state
                 │
                 └─→ mdl_question_usage_by_activity (Questions in quiz)
                     - id, quizid, questions

┌─────────────────────────────────────────────────────────┐
│               mdl_questions                             │
│ Question definitions                                    │
│ - id, category, type, name, questiontext               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ mdl_question_answers (Answer choices)
                 │   - id, question, answer, fraction, feedback
                 │   [EXTEND WITH: missed_feedback, concept_id]
                 │
                 └─→ mdl_question_attempts (Student responses)
                     - id, slot, questioned, state
```

### New Tables (For missed feedback feature)

```
mdl_missed_feedback_concepts
├── id (PK)
├── name
├── description
├── timecreated
└── timemodified

mdl_missed_feedback_misconceptions
├── id (PK)
├── concept_id (FK → concepts)
├── misconception_text
├── correct_understanding
├── typical_student_answer
├── remediation_strategy
├── resource_url
├── timecreated
└── timemodified

mdl_missed_feedback_interactions (Analytics)
├── id (PK)
├── userid (FK → mdl_user)
├── questionid (FK → mdl_question)
├── attemptid (FK → mdl_quiz_attempts)
├── misconceptionid (FK → misconceptions)
├── feedback_viewed
├── viewed_at
├── time_spent_seconds
├── action_after_feedback
└── timecreated
```

## FEATURE WORKFLOW

### Student Perspective
```
1. Student takes quiz
   ↓
2. Submits answer to a question
   ↓
3. Submits quiz
   ↓
4. Reviews quiz results (mod/quiz/review.php)
   ↓
5. Views question they got wrong
   ↓
6. Sees standard feedback (existing)
   ↓
7. NEW: Sees "What did you miss?" feedback
   - Concept being tested
   - Your misconception explanation
   - Correct understanding
   - Link to learning resource
   ↓
8. Interaction logged to mdl_missed_feedback_interactions
```

### Teacher Perspective
```
1. Teacher creates/edits quiz questions
   ↓
2. NEW: Maps misconceptions to wrong answers
   ↓
3. NEW: Creates "What did you miss?" feedback for each wrong answer
   ↓
4. NEW: Links to remediation resources
   ↓
5. Students see the feedback when reviewing
   ↓
6. NEW: Teacher views analytics:
   - Which misconceptions are most common
   - How many students viewed feedback
   - Which remediation resources help most
```

## KEY PHP FILES & CLASSES TO UNDERSTAND

### Moodle Core Classes (Already exist)

**Question Rendering Chain:**
```php
// question/renderer.php
class question_renderer {
    public function question($qa, $options) { ... }
    // Renders individual question
}

// question/type/multichoice/renderer.php
class qtype_multichoice_renderer extends question_type_with_combined_feedback_renderer {
    public function feedback_class_name() { ... }
    // Renders multichoice feedback
}
```

**Quiz Review:**
```php
// mod/quiz/review.php
// - Shows quiz attempt review
// - Displays feedback for each question
// - Entry point for our feature
```

**Question Engine:**
```php
// question/engine/lib.php
class question_usage_by_activity {
    public function get_question_attempt($slot) { ... }
    // Retrieve attempt for specific question
}

class question_attempt {
    public function get_state() { ... }
    public function get_correct_response() { ... }
    // Access to question state and answer data
}
```

### New Classes We'll Create

**Plugin Main API:**
```php
// local/missedquestionfeedback/classes/api.php
class local_missedquestionfeedback_api {
    public static function get_misconceptions_for_question($questionid) { ... }
    public static function get_feedback_for_answer($questionid, $answerid) { ... }
    public static function log_feedback_interaction($data) { ... }
    public static function get_concept_info($conceptid) { ... }
}
```

**Rendering:**
```php
// local/missedquestionfeedback/classes/renderer.php
class local_missedquestionfeedback_renderer extends plugin_renderer_base {
    public function render_missed_feedback($question_attempt, $response) { ... }
    // Render the "What did you miss?" feedback block
}
```

**Events & Logging:**
```php
// local/missedquestionfeedback/classes/event/feedback_viewed.php
class \local_missedquestionfeedback\event\feedback_viewed extends \core\event\base { ... }
// Track when students view feedback
```

## INTEGRATION HOOKS IN QUIZ MODULE

### Where to Insert the Feature

**File: mod/quiz/review.php**
- After line that renders question attempt
- Add hook to display missed feedback
- Check if feature is enabled before displaying

```php
// Example integration point
if (local_missedquestionfeedback_is_enabled($quiz->id)) {
    $feedback = local_missedquestionfeedback_get_feedback($qa);
    echo $renderer->render_missed_feedback($qa, $feedback);
}
```

**File: question/renderer.php (or type-specific)**
- Could render feedback directly in question
- Alternative to adding it after question block

## MOODLE CONVENTIONS TO FOLLOW

1. **Plugin Structure**: Follows Moodle plugin standard (local/missedquestionfeedback)
2. **Namespacing**: Use `\local_missedquestionfeedback` namespace
3. **Strings**: Store all text in lang files (lang/en/local_missedquestionfeedback.php)
4. **Capabilities**: Define in db/access.php
5. **Logging**: Use Moodle's event system
6. **Testing**: Create testcase classes extending `\advanced_testcase`
7. **Database**: Use Moodle's DML (data_mapper_layer) for queries
8. **Output**: Use Mustache templates for rendering

## DATABASE MODIFICATION STRATEGY

### Safe Migration Approach
```
1. Create install.xml with new tables
2. Create upgrade.php for existing installations
3. Test migrations thoroughly
4. Provide rollback script
5. Document all schema changes
```

### Install.xml Example Structure
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="local/missedquestionfeedback/db" VERSION="20251118">
  <TABLES>
    <TABLE NAME="missed_feedback_concepts" COMMENT="Feedback concepts">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="name" TYPE="char" LENGTH="255" NOTNULL="true"/>
        ...
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
      </KEYS>
    </TABLE>
  </TABLES>
</XMLDB>
```

## RECOMMENDED IMPLEMENTATION PHASES

### Phase 1: Database & Core Plugin (Week 1-2)
- [ ] Set up local/missedquestionfeedback plugin structure
- [ ] Create install.xml with new tables
- [ ] Create migration script
- [ ] Create API classes

### Phase 2: Admin Interface (Week 2-3)
- [ ] Create admin forms for concepts
- [ ] Create admin forms for misconceptions
- [ ] Create mapping interface (question → misconception)
- [ ] Create basic UI for management

### Phase 3: Integration with Quiz Review (Week 3-4)
- [ ] Extend mod/quiz/review.php to display missed feedback
- [ ] Create renderer for feedback display
- [ ] Style according to Moodle theme
- [ ] Add JavaScript for interaction tracking

### Phase 4: Analytics & Reporting (Week 4-5)
- [ ] Create analytics queries
- [ ] Build teacher report interface
- [ ] Create visualizations
- [ ] Add to admin dashboard

### Phase 5: Testing & Polish (Week 5-6)
- [ ] Unit tests for all API methods
- [ ] Integration tests with Moodle quiz
- [ ] Acceptance tests (teacher perspective)
- [ ] Performance optimization

## KEY DECISION POINTS

1. **Where to store feedback content?**
   - Option A: In mdl_question_answers table (simpler, less flexible)
   - Option B: In separate misconceptions table (recommended, more powerful)

2. **When to show the feedback?**
   - Option A: During quiz attempt (immediate feedback)
   - Option B: Only in review (after quiz ends) (recommended for safety)
   - Option C: Configurable by teacher

3. **How detailed should misconception mapping be?**
   - Option A: Simple misconception list per question
   - Option B: Map each wrong answer to specific misconceptions (recommended)

4. **Should this integrate with Moodle's built-in feedback?**
   - Yes, enhance rather than replace existing feedback mechanism

## FILES THAT NEED READING BEFORE CODING

1. Moodle documentation on plugins: https://docs.moodle.org/dev/
2. Question engine: question/README.md in Moodle source
3. Quiz module: mod/quiz/README.md
4. Plugin structure: https://docs.moodle.org/dev/Plugin_types

## ASSUMPTIONS TO VALIDATE

1. Moodle 3.7 is already installed and running
2. You have admin access to the Moodle instance
3. You have database access (direct or through Moodle)
4. Teachers can configure misconceptions via UI
5. Students should only see feedback in review, not during quiz
6. Feature should work with all question types (multichoice, short answer, etc.)

## TESTING STRATEGY

```
Unit Tests:
- Test API methods independently
- Mock Moodle database calls
- Test validation logic

Integration Tests:
- Test with real Moodle database
- Test quiz creation → attempt → review workflow
- Test feedback rendering

Acceptance Tests:
- Teacher creates misconceptions
- Student takes quiz and views feedback
- Analytics reports work correctly
```

