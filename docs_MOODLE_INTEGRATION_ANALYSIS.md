# Moodle 3.7 Integration Analysis for "Missed Question Feedback" Feature

## Current Repository Status
- **Repository**: alt42standalone_v1.0 (NEW)
- **Current Content**: Only PRD document (tasks/0001-prd-ai-education-pipeline.md)
- **Target Stack**: Moodle 3.7 + MySQL 5.7 + PHP 7.1.9
- **Feature Branch**: claude/lms-missed-question-feedback-01P7ho5XDY2FyWmdjNvmxxmm

## 1. MOODLE 3.7 ARCHITECTURE OVERVIEW

### 1.1 Core Directory Structure (Standard Moodle 3.7)
```
moodle/
├── admin/                 # Administration interfaces
├── auth/                  # Authentication plugins
├── blocks/                # Block plugins (widgets)
├── cache/                 # Caching system
├── cohort/                # User cohorts
├── completion/            # Course completion tracking
├── course/                # Course management
├── db/                    # Database abstraction layer (DML/DDL)
├── files/                 # File handling
├── filter/                # Text filters
├── grade/                 # Grading system
├── group/                 # Group management
├── lang/                  # Language packs
├── lib/                   # Core libraries
├── local/                 # Custom local plugins
├── login/                 # Login functionality
├── mod/                   # Activity modules
│   ├── quiz/             # QUIZ MODULE (KEY FOR YOUR FEATURE)
│   ├── assign/
│   ├── forum/
│   └── ...
├── my/                    # Dashboard
├── question/              # Question engine (CRITICAL)
│   ├── bank/             # Question bank
│   ├── type/             # Question types
│   ├── format/           # Import/export formats
│   └── ...
├── repository/            # File repositories
├── search/                # Search functionality
├── theme/                 # Theming system
├── webservice/            # Web services & APIs
└── config.php            # Main configuration

```

### 1.2 Moodle Database Schema - Quiz & Question System

#### Key Tables for Quiz System:
```
mdl_quiz                    # Quiz instances
├── id, course, name, intro, timeopen, timeclose, ...

mdl_quiz_attempts          # Student quiz attempts
├── id, quiz, userid, attempt, sumgrades, ...

mdl_question_attempts      # Individual question attempts
├── id, questionusageid, slot, questio nid, ...

mdl_questions              # Question definitions
├── id, category, type, name, questiontext, ...

mdl_question_answers       # Question answer options
├── id, question, answer, fraction, feedback, ...

mdl_question_steps         # Step-by-step student responses
├── id, questionattemptid, sequencenumber, state, ...

mdl_question_step_data     # State data for each step
├── id, attemptstepid, name, value
```

#### Critical for Feedback Feature:
```
mdl_question_answers table fields:
- feedback: TEXT         # Feedback shown for this answer
- feedbackformat: TINYINT  # HTML format type

mdl_quiz_feedback          # Quiz-level feedback
- feedbacktext
- mingrade, maxgrade

mdl_question_attempts fields:
- responsesummary: LONGTEXT
- state (wrong/partial/correct)
```

## 2. QUIZ AND QUESTION SYSTEM IMPLEMENTATION

### 2.1 Question Engine (mod/question/)

**Purpose**: Handles all question-related operations
- Question instantiation
- Rendering question in different contexts
- Collecting and processing responses
- Grading
- Generating feedback

**Key Classes**:
```php
// /question/engine/lib.php
class qubaid_condition          # Quiz usage by attempt ID
class question_usage_by_activity # Question usage tracker

// /question/bank/
class question_bank            # Question retrieval and management

// /question/type/
class question_type            # Base class for question types
class qtype_multichoice        # Specific question type
class qtype_truefalse
class qtype_essay
class qtype_shortanswer
class qtype_numerical
etc.
```

### 2.2 Quiz Module (mod/quiz/)

**Key Files**:
```
mod/quiz/
├── mod_form.php              # Quiz configuration form
├── view.php                  # View quiz content
├── attempt.php               # Quiz attempt interface
├── review.php                # Review attempt results
├── report/                   # Reporting plugins
│   ├── attemptsreport/      # Attempts report
│   ├── statistics/          # Statistical analysis
│   └── responses/           # Item analysis
├── locallib.php              # Local functions
├── lib.php                   # Plugin callbacks
└── classes/
    ├── event/               # Event definitions
    ├── output/              # Rendering classes
    ├── privacy/             # Privacy compliance
    └── ...
```

**Key Classes**:
```php
// quiz/classes/
class quiz                      # Main quiz class
class quiz_settings             # Quiz configuration
class quiz_access_manager       # Access control
class quiz_attempt              # Student's quiz attempt
class quiz_attempt_walker       # Iterate through questions
```

### 2.3 Feedback Mechanism in Moodle

**Current Feedback Types**:
1. **Immediate Feedback** (during quiz)
   - Available in: mdl_question_answers.feedback
   - Shown for each answer choice

2. **Delayed Feedback** (after quiz completion)
   - Available in: mdl_quiz_feedback based on score ranges
   - Shown on review page

3. **Adaptive Feedback** (conditional responses)
   - Some question types support richer feedback
   - Custom feedback per answer

**Feedback Display Chain**:
```
mod/quiz/review.php (displays review)
  ↓
question/classes/renderer.php (renders questions)
  ↓
question/type/{type}/renderer.php (type-specific rendering)
  ↓
Shows mdl_question_answers.feedback for selected answer(s)
```

## 3. WHERE THE "MISSED QUESTION FEEDBACK" FEATURE INTEGRATES

### 3.1 Integration Points

**Option A: Question Answer Feedback Enhancement** (RECOMMENDED)
```
Location: mdl_question_answers table
- Add new columns: 
  - missed_feedback (TEXT)           # What student missed
  - common_misconceptions (TEXT)     # Typical student errors
  - concept_explanation (TEXT)       # Concept link
  
- Extend: mod/quiz/review.php
  - Display missed feedback when question is marked incorrect
  - Show concept links for remediation
```

**Option B: Quiz Feedback Plugin** (CUSTOM FEEDBACK)
```
Location: Create local/missedquestionfeedback/
- Custom feedback engine
- Interfaces with question engine
- Can be conditionally displayed during/after quiz
```

**Option C: Question Type Extension**
```
Location: question/type/multichoice_enhanced/
- Extend existing question types
- Add missed_question_feedback field
- Custom rendering of feedback
```

### 3.2 Feature Implementation Architecture

```
┌─────────────────────────────────────────────────────┐
│          Student Reviews Incorrect Answer             │
│  (mod/quiz/review.php -> question/renderer.php)      │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│     Load Question Attempt & Answer Details           │
│  (mdl_question_attempts, mdl_question_answers)       │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│    Display Standard Feedback (existing)              │
│   (mdl_question_answers.feedback)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│   NEW: Display Missed Question Feedback             │
│  - What concept was tested                          │
│  - What misconception student shows                 │
│  - What correct understanding should be            │
│  - Links to learning resources                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  Log Feedback Interaction for Analytics              │
│  (optional: custom events table)                     │
└─────────────────────────────────────────────────────┘
```

## 4. DATABASE SCHEMA FOR MISSED QUESTION FEEDBACK

### 4.1 Schema Modifications

**Modify: mdl_question_answers**
```sql
ALTER TABLE mdl_question_answers ADD COLUMN (
    `missed_question_feedback` LONGTEXT DEFAULT NULL COMMENT 'Feedback for when student selects this wrong answer',
    `missed_feedback_format` TINYINT(2) UNSIGNED DEFAULT 1 COMMENT 'HTML format version',
    `concept_id` BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'Concept this tests',
    `is_common_misconception` TINYINT(1) DEFAULT 0 COMMENT 'Is this a known wrong answer pattern',
    `misconception_id` BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'Reference to misconception database',
    `remediation_link` TEXT DEFAULT NULL COMMENT 'Link to remediation resource'
);
```

**New Table: mdl_missed_feedback_concepts**
```sql
CREATE TABLE mdl_missed_feedback_concepts (
    `id` BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL COMMENT 'Concept name (e.g., "Fraction Addition")',
    `description` LONGTEXT COMMENT 'Concept description',
    `timecreated` BIGINT(10) UNSIGNED NOT NULL,
    `timemodified` BIGINT(10) UNSIGNED NOT NULL
);
```

**New Table: mdl_missed_feedback_misconceptions**
```sql
CREATE TABLE mdl_missed_feedback_misconceptions (
    `id` BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `concept_id` BIGINT(10) UNSIGNED NOT NULL,
    `misconception_text` LONGTEXT COMMENT 'What wrong understanding student has',
    `correct_understanding` LONGTEXT COMMENT 'What they should know',
    `typical_student_answer` VARCHAR(255) COMMENT 'Example wrong answer',
    `remediation_strategy` LONGTEXT COMMENT 'How to address this',
    `resource_url` TEXT COMMENT 'Learning resource URL',
    `timecreated` BIGINT(10) UNSIGNED NOT NULL,
    `timemodified` BIGINT(10) UNSIGNED NOT NULL,
    FOREIGN KEY (`concept_id`) REFERENCES `mdl_missed_feedback_concepts`(`id`)
);
```

**New Table: mdl_missed_feedback_interactions** (Analytics)
```sql
CREATE TABLE mdl_missed_feedback_interactions (
    `id` BIGINT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `userid` BIGINT(10) UNSIGNED NOT NULL,
    `questionid` BIGINT(10) UNSIGNED NOT NULL,
    `attemptid` BIGINT(10) UNSIGNED NOT NULL,
    `misconceptionid` BIGINT(10) UNSIGNED DEFAULT NULL,
    `feedback_viewed` TINYINT(1) DEFAULT 0,
    `viewed_at` BIGINT(10) UNSIGNED DEFAULT NULL,
    `time_spent_seconds` INT UNSIGNED DEFAULT 0,
    `action_after_feedback` VARCHAR(50) COMMENT 'reattempt|continue|exit',
    `timecreated` BIGINT(10) UNSIGNED NOT NULL,
    FOREIGN KEY (`userid`) REFERENCES `mdl_user`(`id`),
    FOREIGN KEY (`questionid`) REFERENCES `mdl_question`(`id`),
    FOREIGN KEY (`attemptid`) REFERENCES `mdl_quiz_attempts`(`id`),
    FOREIGN KEY (`misconceptionid`) REFERENCES `mdl_missed_feedback_misconceptions`(`id`),
    KEY (`userid`),
    KEY (`questionid`),
    KEY (`attemptid`)
);
```

## 5. IMPLEMENTATION CHECKLIST

### Phase 1: Database Setup
- [ ] Create migration scripts for schema additions
- [ ] Create tables for concepts and misconceptions
- [ ] Add fields to mdl_question_answers

### Phase 2: Backend Implementation
- [ ] Create local plugin: local/missedquestionfeedback/
- [ ] Create feedback loader class
- [ ] Implement event tracking
- [ ] Create admin form for managing misconceptions

### Phase 3: Frontend Integration
- [ ] Extend mod/quiz/review.php to display missed feedback
- [ ] Create renderer for feedback display
- [ ] Add JavaScript for interaction tracking
- [ ] Style feedback according to Moodle theme

### Phase 4: Content Management
- [ ] Create admin interface to add/edit concepts
- [ ] Create admin interface to add/edit misconceptions
- [ ] Map misconceptions to questions
- [ ] Add remediation resources

### Phase 5: Analytics & Reporting
- [ ] Create analytics report for missed feedback effectiveness
- [ ] Track feedback interactions
- [ ] Generate insights on common misconceptions

## 6. KEY FILES THAT WILL NEED MODIFICATION

### Core Files to Extend:
1. **mod/quiz/review.php** - Display missed feedback
2. **question/renderer.php** - Render question with feedback
3. **question/type/{type}/renderer.php** - Type-specific rendering
4. **mod/quiz/locallib.php** - Add helper functions
5. **config.php** - Register new capabilities

### New Files to Create:
1. **local/missedquestionfeedback/lib.php** - Main API
2. **local/missedquestionfeedback/classes/api.php** - Data access
3. **local/missedquestionfeedback/classes/renderer.php** - Rendering
4. **local/missedquestionfeedback/admin/manage_concepts.php** - Admin UI
5. **local/missedquestionfeedback/version.php** - Plugin metadata
6. **local/missedquestionfeedback/db/install.xml** - Schema definition
7. **local/missedquestionfeedback/lang/en/local_missedquestionfeedback.php** - Strings

## 7. MOODLE 3.7 CAPABILITIES & PERMISSIONS

Required capabilities to define:
```php
'local/missedquestionfeedback:manage_feedback'
'local/missedquestionfeedback:manage_misconceptions'
'local/missedquestionfeedback:view_analytics'
'local/missedquestionfeedback:view_feedback'  // Students
```

## 8. EXISTING MOODLE FEEDBACK MECHANISM

### Current Quiz Feedback:
1. **Per-answer feedback** (mdl_question_answers.feedback)
2. **Range-based quiz feedback** (mdl_quiz_feedback)
3. **Overall quiz feedback** (mdl_quiz.feedbacktext)

### What We're Enhancing:
Adding **concept-based, misconception-aware feedback** that:
- Identifies WHY the student got it wrong
- Connects to learning concepts
- Provides targeted remediation
- Tracks student interaction with feedback

## 9. KEY QUESTION ENGINE CLASSES TO UNDERSTAND

```
/question/engine/lib.php:
- question_usage_by_activity    # Track all questions in a quiz
- qubaid_condition              # Filter conditions for questions
- question_state                # Current state of each question

/question/bank/:(Core question retrieval and management)
- qbank_search                  # Search questions
- question_bank                 # Main API

/question/type/::
- question_type                 # Base class
- Each specific type extends this
- Handles: rendering, grading, feedback
```

## 10. INTEGRATION WITH AI EDUCATION SYSTEM PIPELINE

Per the PRD (Phase 4: Input Strategy Design and Phase 6 feedback mechanisms):

The missed question feedback feature should:
1. Integrate with auto-generated quiz feedback content
2. Support concept mapping from world model
3. Track misconceptions for student analytics
4. Provide data for continuous system improvement
5. Be compatible with both manually-created and AI-generated questions

