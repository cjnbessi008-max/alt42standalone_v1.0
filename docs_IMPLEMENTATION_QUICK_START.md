# Quick Start Guide: Missed Question Feedback Feature

## REPOSITORY INFORMATION

**Location**: `/home/user/alt42standalone_v1.0`
**Branch**: `claude/lms-missed-question-feedback-01P7ho5XDY2FyWmdjNvmxxmm`
**Status**: Ready for implementation (only PRD currently present)

---

## ARCHITECTURE SUMMARY

```
MOODLE QUIZ SYSTEM (MySQL Database)
│
├─ mdl_quiz              → Quiz instances
│
├─ mdl_questions         → Question definitions
│  ├─ mdl_question_answers  → Answer choices (EXTEND WITH: misconception mapping)
│  └─ mdl_question_attempts → Student responses
│
├─ mdl_quiz_attempts     → Student quiz attempts
│
└─ [NEW] mdl_missed_feedback_*  → Our feature tables
   ├─ mdl_missed_feedback_concepts
   ├─ mdl_missed_feedback_misconceptions
   └─ mdl_missed_feedback_interactions
```

---

## FEATURE OVERVIEW

### What It Does
When a student reviews a quiz and discovers they got a question wrong:

1. Shows standard feedback (existing Moodle)
2. PLUS: Shows "What did you miss?" section containing:
   - Concept being tested
   - Student's misconception explained
   - Correct understanding
   - Link to remediation resource
3. Tracks student interaction with feedback

### User Stories

**Student**: "I got a fraction question wrong. I want to understand what misconception I had."
→ Feature shows: "You thought 1/4 + 1/4 = 2/8, but..."

**Teacher**: "I want to see which misconceptions are most common in my class."
→ Feature provides: Analytics dashboard showing misconception patterns

---

## CRITICAL FILES TO WORK WITH

### In Moodle Installation

**For Quiz Review Display**:
- `/path/to/moodle/mod/quiz/review.php` (L150-200) - Add feedback display hook
- `/path/to/moodle/question/renderer.php` - Question rendering

**For Question Data**:
- `/path/to/moodle/question/engine/lib.php` - question_attempt class
- `/path/to/moodle/question/bank/` - Question retrieval

### In Our Plugin (To Create)

**Core Structure**:
```
{MOODLE_HOME}/local/missedquestionfeedback/
├── version.php                          # Plugin metadata
├── lib.php                              # Main hooks
├── classes/api.php                      # Data access layer
├── classes/renderer.php                 # Output rendering
├── db/install.xml                       # Database schema
├── db/access.php                        # Capabilities
├── admin/manage_misconceptions.php      # Admin UI
└── templates/missed_feedback.mustache   # HTML template
```

---

## DATABASE CHANGES NEEDED

### New Tables (3 total)

1. **mdl_missed_feedback_concepts**
   - Stores learning concepts (e.g., "Fraction Addition")
   
2. **mdl_missed_feedback_misconceptions**
   - Stores misconception patterns with explanations
   - Linked to concepts
   - Includes remediation strategy and resource URLs
   
3. **mdl_missed_feedback_interactions**
   - Tracks when students view feedback
   - Logs time spent
   - Records student actions after viewing

### Modified Tables (1 total)

**mdl_question_answers** - Add 3 columns:
- `misconception_id` - Links wrong answer to misconception
- `missed_feedback` - Optional rich feedback text
- `missed_feedback_format` - HTML format version

---

## KEY INTEGRATION POINTS

### Primary: Quiz Review Page
**File**: `mod/quiz/review.php`
**Location**: Around line 200
**Action**: After question feedback is displayed, check if misconception feedback exists

```php
// Pseudocode
if (question_state == WRONG) {
    misconception_feedback = load_misconception_data()
    if (misconception_feedback) {
        display_missed_feedback_block(misconception_feedback)
        log_feedback_interaction()
    }
}
```

### Secondary: Admin Interface
- Menu item for managing concepts
- Menu item for managing misconceptions
- Interface to map questions to misconceptions

---

## IMPLEMENTATION PHASES

### Phase 1: Setup (Week 1)
- [ ] Create plugin directory structure
- [ ] Create version.php with metadata
- [ ] Create install.xml database definition
- [ ] Register capabilities in access.php

**Deliverable**: Plugin scaffolding that Moodle recognizes and can install

### Phase 2: Data Layer (Week 2)
- [ ] Implement API class (get_feedback, save_concept, etc.)
- [ ] Create migrations/upgrade scripts
- [ ] Implement database queries using Moodle DML
- [ ] Create data fixtures for testing

**Deliverable**: Fully functional data access layer with unit tests

### Phase 3: Admin Interface (Week 2-3)
- [ ] Create concept management form
- [ ] Create misconception management form
- [ ] Create question → misconception mapping UI
- [ ] Implement CRUD operations

**Deliverable**: Teachers can create misconceptions and map them to questions

### Phase 4: Integration (Week 3-4)
- [ ] Create renderer class
- [ ] Create Mustache template for feedback display
- [ ] Hook into mod/quiz/review.php
- [ ] Add CSS styling
- [ ] Implement interaction logging

**Deliverable**: Feedback displays in quiz review, interactions logged

### Phase 5: Analytics (Week 4-5)
- [ ] Create analytics queries
- [ ] Build teacher report interface
- [ ] Create visualizations
- [ ] Add dashboard widget

**Deliverable**: Teachers can view misconception analytics

### Phase 6: Polish (Week 5-6)
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

**Deliverable**: Production-ready feature

---

## ESSENTIAL CODE PATTERNS

### 1. Database Access (Use Moodle DML)
```php
global $DB;

// Never write: "SELECT * FROM mdl_table"
// Always write:
$records = $DB->get_records('table', ['status' => 1]);
$record = $DB->get_record('table', ['id' => $id]);
$DB->insert_record('table', $data);
```

### 2. String Localization
```php
// Never write: echo "What did you miss?";
// Always write:
echo get_string('whatyoumissed', 'local_missedquestionfeedback');

// Define in lang/en/local_missedquestionfeedback.php:
$string['whatyoumissed'] = 'What did you miss in this question?';
```

### 3. Output Rendering
```php
// Use Mustache templates, not raw HTML
$data = ['title' => 'My Feedback'];
echo $renderer->render_from_template(
    'local_missedquestionfeedback/feedback_block',
    $data
);
```

### 4. Permission Checking
```php
// Before displaying:
if (!has_capability('local/missedquestionfeedback:view_feedback', $context)) {
    throw new moodle_exception('nopermission');
}
```

---

## TESTING STRATEGY

### Unit Tests (PHPUnit)
- Test API methods independently
- Mock database calls
- Test validation logic

**Run**: `phpunit local_missedquestionfeedback`

### Integration Tests
- Test with real Moodle quiz
- Complete workflow: question → wrong answer → view feedback

**Run**: `phpunit --filter=integration local_missedquestionfeedback`

### Manual Testing Checklist
- [ ] Create concept in admin
- [ ] Create misconception linked to concept
- [ ] Create quiz question
- [ ] Map misconception to wrong answer
- [ ] Take quiz, select wrong answer
- [ ] Review quiz, verify feedback displays
- [ ] Check interaction logged to database
- [ ] View analytics report

---

## MOODLE PLUGIN CONVENTIONS CHECKLIST

- [ ] Plugin in correct location: `local/missedquestionfeedback/`
- [ ] version.php with correct metadata
- [ ] lang/en/ directory with strings
- [ ] db/install.xml for schema
- [ ] db/access.php for capabilities
- [ ] No direct SQL (use DML always)
- [ ] All user text via get_string()
- [ ] Events for important actions
- [ ] Proper exception handling
- [ ] PSR coding standards

---

## PERFORMANCE CONSIDERATIONS

### Potential Bottlenecks
1. Loading misconception data on quiz review - Cache aggressively
2. Rendering complex feedback blocks - Use templates
3. Analytics queries - Optimize indexes

### Optimization Strategies
- Cache misconception data by question ID
- Use index on question_answers.misconception_id
- Batch load feedback for all questions at once
- Consider denormalizing frequently accessed data

---

## ACCESSIBILITY & LOCALIZATION

### Accessibility (WCAG 2.1 AA)
- [ ] Semantic HTML (headings, lists, etc.)
- [ ] ARIA labels for dynamic content
- [ ] Keyboard navigation support
- [ ] Color not sole conveyor of info

### Localization
- [ ] English (required)
- [ ] Korean (required for KAIST)
- [ ] All strings in lang files (never hardcoded)
- [ ] Support RTL if needed in future

---

## DEPLOYMENT CHECKLIST

Before going to production:
- [ ] All tests passing (100% pass rate)
- [ ] Code reviewed (PHP syntax, logic)
- [ ] Database migration tested on staging
- [ ] Performance tested (< 100ms for feedback load)
- [ ] Security review (no SQL injection, XSS, etc.)
- [ ] Backup/rollback plan documented
- [ ] Teacher training completed
- [ ] Student-facing UI text proofread
- [ ] Analytics reports verified accurate

---

## COMMON PITFALLS TO AVOID

1. **Direct Database Queries**: Always use Moodle DML ($DB)
2. **Hardcoded Strings**: Always use get_string() for UI text
3. **Missing Permissions**: Always check capabilities before action
4. **Insufficient Testing**: Test all code paths, not just happy path
5. **Performance Issues**: Profile before and after, optimize hot paths
6. **Schema Mistakes**: Test migrations on real data before production
7. **Accessibility Ignored**: Test with screen readers and keyboard
8. **Security Holes**: Validate all user input, escape output

---

## QUICK REFERENCE: KEY MOODLE OBJECTS

### question_attempt ($qa)
```php
$qa->get_state()                      // 'correct', 'wrong', 'partial'
$qa->get_response_summary()           // Student's textual answer
$qa->get_question()                   // Full question object
$qa->get_correct_response()           // What the right answer was
$qa->get_question_attempt_details()   // All attempt details
```

### quiz_attempt ($quizattempt)
```php
$quizattempt->get_questions()         // All questions in quiz
$quizattempt->get_attempt()           // Attempt number
$quizattempt->get_completion_state()  // Quiz completed?
$quizattempt->get_state()             // Overall state
```

### Moodle Database Layer ($DB)
```php
$DB->get_record()                     // Fetch single record
$DB->get_records()                    // Fetch multiple records
$DB->get_record_sql()                 // SQL query (wrapped)
$DB->insert_record()                  // Create new record
$DB->update_record()                  // Update existing
$DB->delete_records()                 // Delete records
```

---

## RESOURCES

### Moodle Documentation
- https://docs.moodle.org/dev/Plugin_types
- https://docs.moodle.org/dev/Question_engine
- https://docs.moodle.org/dev/Data_manipulation_API
- https://docs.moodle.org/37/en/

### Moodle 3.7 Specific
- Question engine structure
- Quiz module architecture
- Database schema

---

## NEXT IMMEDIATE ACTIONS

1. Read the comprehensive analysis documents (Moodle Integration Analysis, Project Structure Guide, Codebase Exploration Summary)
2. Review Moodle 3.7 documentation on plugin development
3. Create initial plugin directory structure
4. Design final database schema (review with team)
5. Implement API layer and database migration
6. Build admin UI for misconception management
7. Integrate with quiz review page
8. Add analytics and testing

---

## SUPPORT & ESCALATION

- **Architecture Questions**: Reference "Moodle Integration Analysis"
- **Database Questions**: Reference "Project Structure Guide" 
- **Implementation Questions**: Reference "Codebase Exploration Summary"
- **Code Examples**: See all three documents for specific code patterns

