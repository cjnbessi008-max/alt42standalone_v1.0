# Moodle LMS Integration Architecture
## Automatic Reasoning Difficulty Level Prediction

**Version:** 1.0
**Target Platform:** Moodle 3.7, PHP 7.1.9, MySQL 5.7
**Date:** 2025-11-18

---

## 1. Overview

This document describes the architecture for integrating the AI Education System Pipeline with Moodle 3.7 LMS to automatically predict and assign reasoning difficulty levels to problems/questions.

### 1.1 Goals

- **Automatic Difficulty Prediction**: Analyze problem characteristics to predict reasoning difficulty (1-5 scale)
- **Moodle Integration**: Seamlessly integrate with Moodle's question bank and quiz system
- **Performance Tracking**: Update difficulty predictions based on actual student performance
- **Adaptive Learning**: Enable adaptive quizzes based on predicted difficulty levels

### 1.2 Key Features

- ✅ PHP 7.1.9 compatible code
- ✅ MySQL 5.7 compatible queries
- ✅ Moodle 3.7 plugin architecture
- ✅ Multi-factor difficulty prediction algorithm
- ✅ Real-time performance tracking
- ✅ REST API for external integration

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Moodle 3.7 LMS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Question Bank│  │  Quiz Module │  │ Gradebook    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│          Difficulty Prediction Plugin (PHP)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Difficulty Prediction Engine               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Feature    │  │  Prediction │  │  Feedback   │  │  │
│  │  │  Extractor  │→ │  Algorithm  │→ │  Loop       │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│  ┌──────────────────────────┼──────────────────────────┐  │
│  │         REST API          │                          │  │
│  │  • Predict Difficulty     │                          │  │
│  │  • Update Performance     │                          │  │
│  │  • Get Analytics          │                          │  │
│  └──────────────────────────┼──────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 5.7 Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │mdl_question_ │  │mdl_question_ │  │mdl_quiz_     │     │
│  │difficulty    │  │performance   │  │attempts      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Tables

#### `mdl_question_difficulty`
Stores predicted and actual difficulty levels for each question.

```sql
CREATE TABLE mdl_question_difficulty (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    predicted_difficulty DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    predicted_level INT(1) NOT NULL DEFAULT 1,
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    actual_difficulty DECIMAL(3,2) DEFAULT NULL,
    num_attempts INT(10) UNSIGNED DEFAULT 0,
    num_correct INT(10) UNSIGNED DEFAULT 0,
    avg_time_spent INT(10) UNSIGNED DEFAULT 0,
    feature_vector TEXT,
    algorithm_version VARCHAR(20) DEFAULT 'v1.0',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY mdl_quesdiff_que_uix (questionid),
    KEY mdl_quesdiff_pre_ix (predicted_level),
    CONSTRAINT mdl_quesdiff_que_fk
        FOREIGN KEY (questionid)
        REFERENCES mdl_question (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `predicted_difficulty`: Raw predicted difficulty (0.00-1.00)
- `predicted_level`: Discretized level (1-5)
- `confidence_score`: Prediction confidence (0.00-1.00)
- `actual_difficulty`: Calculated from student performance
- `feature_vector`: JSON-encoded problem features

#### `mdl_question_performance`
Tracks individual student performance on questions.

```sql
CREATE TABLE mdl_question_performance (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    userid BIGINT(10) UNSIGNED NOT NULL,
    attemptid BIGINT(10) UNSIGNED NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    time_spent INT(10) UNSIGNED DEFAULT 0,
    num_attempts INT(3) UNSIGNED DEFAULT 1,
    student_difficulty_rating INT(1) DEFAULT NULL,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY mdl_quesperf_que_ix (questionid),
    KEY mdl_quesperf_use_ix (userid),
    KEY mdl_quesperf_att_ix (attemptid),
    CONSTRAINT mdl_quesperf_que_fk
        FOREIGN KEY (questionid)
        REFERENCES mdl_question (id)
        ON DELETE CASCADE,
    CONSTRAINT mdl_quesperf_use_fk
        FOREIGN KEY (userid)
        REFERENCES mdl_user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `mdl_difficulty_config`
Configuration for difficulty prediction algorithms.

```sql
CREATE TABLE mdl_difficulty_config (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description TEXT,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY mdl_diffconf_key_uix (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Difficulty Prediction Algorithm

### 4.1 Multi-Factor Analysis

The difficulty prediction algorithm analyzes multiple factors:

#### **Factor 1: Problem Complexity (40% weight)**
- Number of operations required
- Nesting depth of mathematical expressions
- Number of variables/unknowns
- Presence of multi-step reasoning

#### **Factor 2: Cognitive Load (30% weight)**
- Question text length and readability
- Number of concepts required
- Abstract vs. concrete thinking required
- Visual/spatial reasoning requirements

#### **Factor 3: Historical Data (20% weight)**
- Similar question performance
- Category/tag-based difficulty
- Previous student success rates

#### **Factor 4: Question Type (10% weight)**
- Multiple choice vs. numerical
- Short answer vs. essay
- Structured vs. open-ended

### 4.2 Prediction Formula

```
predicted_difficulty =
    (complexity_score × 0.40) +
    (cognitive_load_score × 0.30) +
    (historical_score × 0.20) +
    (question_type_score × 0.10)

predicted_level = CEIL(predicted_difficulty × 5)
```

### 4.3 Adaptive Refinement

After students attempt questions:

```
actual_difficulty = 1 - (num_correct / num_attempts) +
                    (avg_time_spent / max_time) × 0.3

# Update prediction using exponential moving average
updated_difficulty = (0.7 × actual_difficulty) + (0.3 × predicted_difficulty)
```

---

## 5. Moodle Plugin Structure

### 5.1 Directory Layout

```
moodle/
└── local/
    └── difficulty_prediction/
        ├── version.php
        ├── db/
        │   ├── install.xml
        │   ├── upgrade.php
        │   └── access.php
        ├── classes/
        │   ├── difficulty_predictor.php
        │   ├── feature_extractor.php
        │   ├── performance_tracker.php
        │   └── api_controller.php
        ├── lib.php
        ├── settings.php
        ├── lang/
        │   ├── en/
        │   │   └── local_difficulty_prediction.php
        │   └── ko/
        │       └── local_difficulty_prediction.php
        └── tests/
            └── difficulty_predictor_test.php
```

### 5.2 Event Observers

Hook into Moodle events to track question usage:

```php
$observers = array(
    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback'  => 'local_difficulty_prediction_observer::attempt_submitted',
    ),
    array(
        'eventname' => '\core\event\question_created',
        'callback'  => 'local_difficulty_prediction_observer::question_created',
    ),
    array(
        'eventname' => '\core\event\question_updated',
        'callback'  => 'local_difficulty_prediction_observer::question_updated',
    ),
);
```

---

## 6. REST API Specification

### 6.1 Endpoints

#### **POST** `/local/difficulty_prediction/predict`
Predict difficulty for a question.

**Request:**
```json
{
    "questionid": 12345,
    "force_recalculate": false
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "questionid": 12345,
        "predicted_difficulty": 0.68,
        "predicted_level": 4,
        "confidence_score": 0.85,
        "features": {
            "complexity_score": 0.72,
            "cognitive_load_score": 0.65,
            "historical_score": 0.70,
            "question_type_score": 0.50
        }
    }
}
```

#### **GET** `/local/difficulty_prediction/analytics`
Get difficulty analytics for a course/quiz.

**Query Parameters:**
- `courseid` (required)
- `quizid` (optional)

**Response:**
```json
{
    "status": "success",
    "data": {
        "total_questions": 150,
        "distribution": {
            "1": 25,
            "2": 40,
            "3": 45,
            "4": 30,
            "5": 10
        },
        "avg_difficulty": 2.8,
        "accuracy_rate": 0.82
    }
}
```

#### **POST** `/local/difficulty_prediction/update_performance`
Update performance data after quiz attempt.

**Request:**
```json
{
    "attemptid": 789,
    "performances": [
        {
            "questionid": 12345,
            "is_correct": true,
            "time_spent": 120
        }
    ]
}
```

---

## 7. Integration Points

### 7.1 Question Bank Integration

Automatically predict difficulty when questions are created:

```php
// In question creation form
$mform->addElement('static', 'predicted_difficulty',
    get_string('predicteddifficulty', 'local_difficulty_prediction'),
    difficulty_predictor::get_display($question->id)
);
```

### 7.2 Quiz Creation Integration

Allow teachers to filter questions by predicted difficulty:

```php
// Add difficulty filter to question bank
$filters[] = new \local_difficulty_prediction\filter\difficulty_level();
```

### 7.3 Adaptive Quiz Integration

Enable adaptive quizzes based on student performance:

```php
// Select next question based on current performance
$next_question = difficulty_predictor::get_adaptive_question(
    $userid,
    $current_level,
    $performance_trend
);
```

---

## 8. Configuration & Settings

### 8.1 Admin Settings

Configure in **Site Administration → Plugins → Local plugins → Difficulty Prediction**:

- ✅ Enable/disable automatic prediction
- ✅ Algorithm weights configuration
- ✅ Minimum attempts before using actual difficulty
- ✅ Confidence threshold for predictions
- ✅ Adaptive quiz settings

### 8.2 Default Configuration

```php
$config = array(
    'enable_auto_prediction' => 1,
    'weight_complexity' => 0.40,
    'weight_cognitive' => 0.30,
    'weight_historical' => 0.20,
    'weight_question_type' => 0.10,
    'min_attempts_threshold' => 10,
    'confidence_threshold' => 0.70,
    'update_frequency' => 3600, // seconds
);
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

- Cache difficulty predictions for 1 hour
- Use Moodle's cache API (MUC)
- Invalidate on question update or after N new attempts

### 9.2 Batch Processing

- Process performance updates asynchronously using Moodle tasks
- Batch recalculations during low-traffic periods

### 9.3 Database Optimization

- Index on `questionid`, `predicted_level`, `userid`
- Partition `mdl_question_performance` by date for large datasets
- Archive old performance data after 2 years

---

## 10. Testing Strategy

### 10.1 Unit Tests

```php
// Test difficulty prediction accuracy
public function test_prediction_accuracy() {
    $question = $this->create_test_question();
    $predictor = new difficulty_predictor();
    $result = $predictor->predict($question);

    $this->assertGreaterThanOrEqual(0, $result->difficulty);
    $this->assertLessThanOrEqual(1, $result->difficulty);
    $this->assertContains($result->level, range(1, 5));
}
```

### 10.2 Integration Tests

- Test question creation → automatic prediction
- Test quiz submission → performance tracking
- Test adaptive question selection

### 10.3 Performance Tests

- Load test with 10,000+ questions
- Measure prediction latency (target: <100ms)
- Test concurrent API requests

---

## 11. Security Considerations

### 11.1 Access Control

- Require `local/difficulty_prediction:view` capability
- Restrict API access to authenticated users
- Validate all input parameters

### 11.2 Data Privacy

- Anonymize student performance data in analytics
- Comply with GDPR/privacy regulations
- Allow students to opt-out of performance tracking

### 11.3 SQL Injection Prevention

- Use Moodle's database API exclusively
- Parameterized queries for all database operations
- No raw SQL execution

---

## 12. Deployment Checklist

- [ ] Install plugin in Moodle's `local/` directory
- [ ] Run database migrations (`admin/index.php`)
- [ ] Configure plugin settings
- [ ] Test with sample questions
- [ ] Import historical performance data (if available)
- [ ] Train initial models on existing question bank
- [ ] Enable event observers
- [ ] Configure caching
- [ ] Set up scheduled tasks
- [ ] Monitor logs and performance

---

## 13. Future Enhancements

### Phase 2
- Machine learning model integration (scikit-learn via external API)
- Natural language processing for question text analysis
- Collaborative filtering based on similar students

### Phase 3
- Multi-dimensional difficulty (cognitive, procedural, conceptual)
- Real-time difficulty adjustment during quiz
- Personalized difficulty recommendations

### Phase 4
- Integration with learning analytics
- Difficulty heatmaps and visualizations
- Predictive student success modeling

---

## 14. References

- **Moodle 3.7 Developer Documentation**: https://docs.moodle.org/dev/
- **Item Response Theory (IRT)**: Educational measurement theory
- **Bloom's Taxonomy**: Cognitive complexity framework
- **Moodle Database Schema**: https://docs.moodle.org/dev/Database_Schema

---

**Document Version History**

| Version | Date       | Author | Changes |
|---------|------------|--------|---------|
| 1.0     | 2025-11-18 | AI System | Initial architecture design |
