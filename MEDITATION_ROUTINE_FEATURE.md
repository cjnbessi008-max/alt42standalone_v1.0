# Meditation Routine Feature for Moodle Integration

## Overview
5-second meditation routine before complex problems in Moodle LMS

## Technical Stack
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)

## Feature Specification

### Trigger Conditions
- Problem difficulty level ≥ 4/5
- Student is starting a new quiz attempt
- Can be enabled/disabled per quiz by teacher

### Meditation Routine Flow
1. Student clicks "Start Problem"
2. System checks problem complexity
3. If complex (≥4/5), display meditation screen
4. 5-second countdown with breathing animation
5. Automatically proceed to problem

### Components

#### 1. Breathing Animation
- Circular pulse animation (expand/contract)
- Synchronized with 5-second countdown
- Calming blue/green gradient colors
- Text prompts: "Take a deep breath" → "Focus" → "Ready"

#### 2. Database Schema
```sql
CREATE TABLE mdl_quiz_meditation_sessions (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    quizid BIGINT(10) UNSIGNED NOT NULL,
    attemptid BIGINT(10) UNSIGNED NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    duration INT(5) DEFAULT 5,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    INDEX idx_userid (userid),
    INDEX idx_quizid (quizid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mdl_quiz_meditation_settings (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quizid BIGINT(10) UNSIGNED NOT NULL UNIQUE,
    enabled TINYINT(1) DEFAULT 1,
    complexity_threshold INT(1) DEFAULT 4,
    duration INT(5) DEFAULT 5,
    INDEX idx_quizid (quizid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3. Moodle Plugin Structure
- **Type**: mod_quiz local plugin / question behavior
- **Location**: `/local/meditation_routine/` or `/question/behaviour/meditationroutine/`

### Configuration Options
- Enable/disable per quiz
- Complexity threshold (1-5)
- Meditation duration (3-10 seconds)
- Animation style (breathing, pulse, wave)

### Analytics
- Track meditation completion rates
- Correlation between meditation and problem success
- Student engagement metrics

## Implementation Files
1. `version.php` - Plugin version and dependencies
2. `db/install.xml` - Database schema
3. `classes/meditation_manager.php` - Core logic
4. `amd/src/meditation_routine.js` - Frontend JavaScript
5. `styles.css` - Breathing animation styles
6. `lang/en/local_meditation_routine.php` - Language strings

## User Experience
**Before Complex Problem:**
```
┌─────────────────────────────────┐
│   🧘 Prepare Your Mind           │
│                                 │
│        ◉ ← Breathing            │
│       (animated pulse)          │
│                                 │
│      Take a deep breath         │
│                                 │
│          5 seconds...           │
└─────────────────────────────────┘
```

**Countdown Progression:**
- 5s: "Breathe in deeply..."
- 3s: "Exhale slowly..."
- 1s: "Focus..."
- 0s: Auto-proceed to problem

## Integration Points
1. Hook into `mod_quiz_attempt_started` event
2. Check question difficulty metadata
3. Inject meditation screen before question display
4. Track completion in database
5. Resume normal quiz flow

## Success Metrics
- Meditation completion rate > 90%
- Student satisfaction score > 4/5
- No increase in quiz abandonment
- Potential improvement in complex problem success rates
