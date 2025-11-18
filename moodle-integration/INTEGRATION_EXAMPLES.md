# Integration Examples: Thinking Routine Consistency Score

This document provides practical examples of integrating the Thinking Routine Consistency Score plugin with various Moodle activities and external systems.

## Table of Contents

1. [JavaScript Integration](#javascript-integration)
2. [PHP Activity Plugin Integration](#php-activity-plugin-integration)
3. [External System Integration](#external-system-integration)
4. [Custom Pattern Creation](#custom-pattern-creation)
5. [Reporting and Analytics](#reporting-and-analytics)

---

## JavaScript Integration

### Example 1: Track Quiz Problem-Solving Steps

Add this to your quiz module or theme:

```javascript
require(['jquery', 'core/ajax', 'core/notification'], function($, ajax, notification) {

    // Track when student reads a problem
    $('.qtext').on('click', function() {
        trackActivity('quiz', 'read_problem', {
            question_id: $(this).data('question-id'),
            timestamp: Date.now()
        });
    });

    // Track when student creates a diagram/visual aid
    $('#draw-diagram-btn').on('click', function() {
        trackActivity('quiz', 'create_diagram', {
            question_id: getCurrentQuestionId(),
            diagram_type: 'sketch'
        });
    });

    // Track when student checks their work
    $('#verify-answer-btn').on('click', function() {
        trackActivity('quiz', 'verify_solution', {
            question_id: getCurrentQuestionId(),
            verification_method: 'manual_check'
        });
    });

    // Helper function to track activity
    function trackActivity(activitytype, action, data) {
        ajax.call([{
            methodname: 'block_thinkroutine_consistency_track_activity',
            args: {
                userid: M.cfg.userid,
                courseid: M.cfg.courseid,
                cmid: M.cfg.cmid,
                activitytype: activitytype,
                action: action,
                actiondata: JSON.stringify(data)
            },
            done: function(response) {
                console.log('Activity tracked:', response);
            },
            fail: function(error) {
                notification.exception(error);
            }
        }]);
    }

    function getCurrentQuestionId() {
        return $('.que.current').data('question-id');
    }
});
```

### Example 2: Track Assignment Problem Decomposition

```javascript
require(['core/ajax'], function(ajax) {

    // Track when student breaks problem into steps
    $('#assignment-planner').on('stepAdded', function(e) {
        ajax.call([{
            methodname: 'block_thinkroutine_consistency_track_activity',
            args: {
                userid: M.cfg.userid,
                courseid: M.cfg.courseid,
                cmid: $('.assignment-container').data('cmid'),
                activitytype: 'assignment',
                action: 'break_into_parts',
                actiondata: JSON.stringify({
                    step_number: e.detail.stepNumber,
                    step_description: e.detail.description,
                    total_steps: e.detail.totalSteps
                })
            }
        }]);
    });

    // Track systematic checking
    $('#solution-checker').on('checkComplete', function(e) {
        ajax.call([{
            methodname: 'block_thinkroutine_consistency_track_activity',
            args: {
                userid: M.cfg.userid,
                courseid: M.cfg.courseid,
                cmid: $('.assignment-container').data('cmid'),
                activitytype: 'assignment',
                action: 'check_calculation',
                actiondata: JSON.stringify({
                    check_type: e.detail.checkType,
                    passed: e.detail.passed
                })
            }
        }]);
    });
});
```

---

## PHP Activity Plugin Integration

### Example 3: Track Activity in Custom Quiz Plugin

Add to your quiz module's `attempt.php`:

```php
<?php
// In mod/quiz/attempt.php or your custom activity module

require_once($CFG->dirroot . '/blocks/thinkroutine_consistency/classes/activity_tracker.php');

use block_thinkroutine_consistency\activity_tracker;

// Track when student starts quiz attempt
activity_tracker::track_activity(
    $USER->id,
    $course->id,
    $cm->id,
    'quiz',
    'identify_problem',
    [
        'quiz_id' => $quiz->id,
        'attempt_number' => $attemptobj->get_attempt_number(),
        'timestamp' => time()
    ]
);

// Track when student navigates to next question
if ($action == 'next') {
    activity_tracker::track_activity(
        $USER->id,
        $course->id,
        $cm->id,
        'quiz',
        'solve_subproblems',
        [
            'question_number' => $page + 1,
            'time_on_previous' => $time_spent
        ]
    );
}

// Track when student reviews their answers
if ($action == 'review') {
    activity_tracker::track_activity(
        $USER->id,
        $course->id,
        $cm->id,
        'quiz',
        'verify_logic',
        [
            'review_mode' => true,
            'questions_reviewed' => $reviewed_count
        ]
    );
}
```

### Example 4: Track in Assignment Module

Add to `mod/assignment/view.php`:

```php
<?php
require_once($CFG->dirroot . '/blocks/thinkroutine_consistency/classes/activity_tracker.php');

use block_thinkroutine_consistency\activity_tracker;

// Track when student views assignment
activity_tracker::track_activity(
    $USER->id,
    $course->id,
    $cm->id,
    'assignment',
    'read_problem',
    [
        'assignment_id' => $assignment->id,
        'view_count' => $view_count
    ]
);

// Track when student submits assignment
if ($action == 'submit') {
    // Track final verification
    activity_tracker::track_activity(
        $USER->id,
        $course->id,
        $cm->id,
        'assignment',
        'confirm_answer',
        [
            'submission_id' => $submission->id,
            'draft_count' => $draft_count,
            'time_spent' => $time_spent
        ]
    );
}
```

---

## External System Integration

### Example 5: REST API Integration from External Python Application

```python
import requests
import json
from datetime import datetime, timedelta

class MoodleThinkingRoutineClient:
    def __init__(self, moodle_url, ws_token):
        self.moodle_url = moodle_url
        self.ws_token = ws_token
        self.rest_endpoint = f"{moodle_url}/webservice/rest/server.php"

    def track_activity(self, userid, courseid, cmid, activity_type, action, action_data=None):
        """Track a student activity"""
        params = {
            'wstoken': self.ws_token,
            'wsfunction': 'block_thinkroutine_consistency_track_activity',
            'moodlewsrestformat': 'json',
            'userid': userid,
            'courseid': courseid,
            'cmid': cmid,
            'activitytype': activity_type,
            'action': action,
            'actiondata': json.dumps(action_data or {})
        }

        response = requests.post(self.rest_endpoint, data=params)
        return response.json()

    def get_consistency_score(self, userid, courseid, period_days=30):
        """Get consistency score for a student"""
        period_end = int(datetime.now().timestamp())
        period_start = int((datetime.now() - timedelta(days=period_days)).timestamp())

        params = {
            'wstoken': self.ws_token,
            'wsfunction': 'block_thinkroutine_consistency_get_score',
            'moodlewsrestformat': 'json',
            'userid': userid,
            'courseid': courseid,
            'periodstart': period_start,
            'periodend': period_end
        }

        response = requests.post(self.rest_endpoint, data=params)
        return response.json()

    def batch_track_activities(self, activities):
        """Track multiple activities at once"""
        results = []
        for activity in activities:
            result = self.track_activity(**activity)
            results.append(result)
        return results

# Usage example
if __name__ == '__main__':
    client = MoodleThinkingRoutineClient(
        moodle_url='https://your-moodle-site.com',
        ws_token='your-web-service-token-here'
    )

    # Track a single activity
    response = client.track_activity(
        userid=123,
        courseid=456,
        cmid=789,
        activity_type='quiz',
        action='create_diagram',
        action_data={
            'diagram_type': 'flowchart',
            'elements': 5,
            'timestamp': datetime.now().isoformat()
        }
    )
    print('Activity tracked:', response)

    # Get consistency score
    score = client.get_consistency_score(userid=123, courseid=456)
    print(f"Overall Score: {score['overall_score']}")
    print(f"Patterns:")
    for pattern in score['pattern_scores']:
        print(f"  - {pattern['name']}: {pattern['score']}")
```

### Example 6: Node.js Integration

```javascript
const axios = require('axios');

class MoodleThinkingRoutineClient {
    constructor(moodleUrl, wsToken) {
        this.moodleUrl = moodleUrl;
        this.wsToken = wsToken;
        this.restEndpoint = `${moodleUrl}/webservice/rest/server.php`;
    }

    async trackActivity(userid, courseid, cmid, activityType, action, actionData = {}) {
        const params = new URLSearchParams({
            wstoken: this.wsToken,
            wsfunction: 'block_thinkroutine_consistency_track_activity',
            moodlewsrestformat: 'json',
            userid: userid,
            courseid: courseid,
            cmid: cmid,
            activitytype: activityType,
            action: action,
            actiondata: JSON.stringify(actionData)
        });

        const response = await axios.post(this.restEndpoint, params);
        return response.data;
    }

    async getConsistencyScore(userid, courseid, periodDays = 30) {
        const periodEnd = Math.floor(Date.now() / 1000);
        const periodStart = periodEnd - (periodDays * 24 * 60 * 60);

        const params = new URLSearchParams({
            wstoken: this.wsToken,
            wsfunction: 'block_thinkroutine_consistency_get_score',
            moodlewsrestformat: 'json',
            userid: userid,
            courseid: courseid,
            periodstart: periodStart,
            periodend: periodEnd
        });

        const response = await axios.post(this.restEndpoint, params);
        return response.data;
    }
}

// Usage
(async () => {
    const client = new MoodleThinkingRoutineClient(
        'https://your-moodle-site.com',
        'your-web-service-token-here'
    );

    // Track activity from external learning platform
    await client.trackActivity(
        123, // userid
        456, // courseid
        789, // cmid
        'external_tool',
        'pattern_recognition',
        {
            pattern_found: 'arithmetic_sequence',
            confidence: 0.95
        }
    );

    // Get and display score
    const score = await client.getConsistencyScore(123, 456);
    console.log(`Overall Score: ${score.overall_score}`);
    score.pattern_scores.forEach(pattern => {
        console.log(`${pattern.name}: ${pattern.score} (used ${pattern.frequency} times)`);
    });
})();
```

---

## Custom Pattern Creation

### Example 7: Add Custom Thinking Routine Pattern

```php
<?php
// In a custom admin script or during course setup

global $DB;

$time = time();

// Define a custom pattern for mathematical proof writing
$pattern = new stdClass();
$pattern->name = 'Mathematical Proof Construction';
$pattern->description = 'Structured approach to writing mathematical proofs';
$pattern->category = 'reasoning';
$pattern->expected_steps = json_encode([
    'state_theorem',
    'identify_given_information',
    'outline_strategy',
    'construct_logical_steps',
    'verify_each_step',
    'write_conclusion',
    'review_proof'
]);
$pattern->weight = 1.5; // Higher weight = more important
$pattern->timecreated = $time;
$pattern->timemodified = $time;

$patternid = $DB->insert_record('block_trc_patterns', $pattern);

echo "Created pattern ID: $patternid\n";
```

### Example 8: Bulk Import Patterns from JSON

```php
<?php
// import_patterns.php

require_once('../../config.php');
require_login();
require_capability('block/thinkroutine_consistency:managepatterns', context_system::instance());

$json = file_get_contents('thinking_patterns.json');
$patterns_data = json_decode($json, true);

$time = time();
$imported = 0;

foreach ($patterns_data['patterns'] as $pattern_data) {
    $pattern = new stdClass();
    $pattern->name = $pattern_data['name'];
    $pattern->description = $pattern_data['description'];
    $pattern->category = $pattern_data['category'];
    $pattern->expected_steps = json_encode($pattern_data['steps']);
    $pattern->weight = $pattern_data['weight'] ?? 1.0;
    $pattern->timecreated = $time;
    $pattern->timemodified = $time;

    $DB->insert_record('block_trc_patterns', $pattern);
    $imported++;
}

echo "Imported $imported thinking routine patterns successfully.\n";
```

**thinking_patterns.json**:
```json
{
  "patterns": [
    {
      "name": "Scientific Method Application",
      "description": "Applying scientific method to investigations",
      "category": "problem_solving",
      "steps": [
        "ask_question",
        "research_background",
        "formulate_hypothesis",
        "design_experiment",
        "collect_data",
        "analyze_results",
        "draw_conclusions"
      ],
      "weight": 1.3
    },
    {
      "name": "Error Analysis",
      "description": "Systematic identification and correction of errors",
      "category": "metacognition",
      "steps": [
        "identify_error_location",
        "categorize_error_type",
        "understand_misconception",
        "correct_error",
        "verify_correction"
      ],
      "weight": 1.1
    }
  ]
}
```

---

## Reporting and Analytics

### Example 9: Generate Class Consistency Report

```php
<?php
// class_consistency_report.php

require_once('../../config.php');
require_once($CFG->dirroot . '/blocks/thinkroutine_consistency/classes/consistency_calculator.php');

use block_thinkroutine_consistency\consistency_calculator;

$courseid = required_param('courseid', PARAM_INT);
require_login($courseid);

$context = context_course::instance($courseid);
require_capability('block/thinkroutine_consistency:viewall', $context);

// Get all enrolled students
$students = get_enrolled_users($context, '', 0, 'u.id, u.firstname, u.lastname');

// Report period (last 30 days)
$periodend = time();
$periodstart = $periodend - (30 * 24 * 60 * 60);

echo "<h2>Class Consistency Report</h2>";
echo "<table border='1'>";
echo "<tr><th>Student</th><th>Overall Score</th><th>Top Pattern</th><th>Most Improved</th></tr>";

foreach ($students as $student) {
    $overall_score = consistency_calculator::get_overall_score(
        $student->id,
        $courseid,
        $periodstart,
        $periodend
    );

    // Get pattern scores
    $scores = $DB->get_records_sql(
        "SELECT s.*, p.name
         FROM {block_trc_scores} s
         JOIN {block_trc_patterns} p ON s.patternid = p.id
         WHERE s.userid = :userid AND s.courseid = :courseid
         ORDER BY s.score DESC",
        ['userid' => $student->id, 'courseid' => $courseid]
    );

    $top_pattern = !empty($scores) ? reset($scores)->name : 'N/A';

    echo "<tr>";
    echo "<td>" . fullname($student) . "</td>";
    echo "<td>" . round($overall_score, 1) . "</td>";
    echo "<td>$top_pattern</td>";
    echo "<td>-</td>"; // Calculate improvement logic here
    echo "</tr>";
}

echo "</table>";
```

### Example 10: Export Data for External Analytics

```php
<?php
// export_consistency_data.php

require_once('../../config.php');

$courseid = required_param('courseid', PARAM_INT);
$format = optional_param('format', 'csv', PARAM_ALPHA);

require_login($courseid);
$context = context_course::instance($courseid);
require_capability('block/thinkroutine_consistency:viewall', $context);

// Get all scores with user and pattern information
$sql = "SELECT s.*, u.firstname, u.lastname, u.email, p.name as pattern_name, p.category
        FROM {block_trc_scores} s
        JOIN {user} u ON s.userid = u.id
        JOIN {block_trc_patterns} p ON s.patternid = p.id
        WHERE s.courseid = :courseid
        ORDER BY s.userid, s.patternid";

$records = $DB->get_records_sql($sql, ['courseid' => $courseid]);

if ($format == 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="consistency_scores.csv"');

    $output = fopen('php://output', 'w');

    // Headers
    fputcsv($output, [
        'User ID', 'First Name', 'Last Name', 'Email',
        'Pattern', 'Category', 'Score', 'Frequency',
        'Adherence Rate', 'Consistency Index', 'Period Start', 'Period End'
    ]);

    // Data
    foreach ($records as $record) {
        fputcsv($output, [
            $record->userid,
            $record->firstname,
            $record->lastname,
            $record->email,
            $record->pattern_name,
            $record->category,
            $record->score,
            $record->frequency,
            $record->adherence_rate,
            $record->consistency_index,
            date('Y-m-d', $record->period_start),
            date('Y-m-d', $record->period_end)
        ]);
    }

    fclose($output);
    exit;
}
```

---

## Summary

These examples demonstrate:

1. **JavaScript tracking** for real-time activity monitoring
2. **PHP integration** for server-side activity tracking in Moodle modules
3. **External API integration** using Python and Node.js
4. **Custom pattern management** for tailored thinking routines
5. **Reporting and analytics** for class-level insights

For more examples and documentation, see README.md and INSTALLATION.md.
