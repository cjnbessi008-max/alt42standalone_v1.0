# Thinking Routine Consistency Score - Moodle Block Plugin

## Overview

This Moodle block plugin provides **Consistency Score** tracking for students' **thinking routines** during their learning activities. It analyzes student behavior patterns to measure how consistently they apply structured thinking approaches to problem-solving.

## Features

- **Automated Activity Tracking**: Monitors student actions across Moodle activities (quizzes, assignments, forums, etc.)
- **Pattern Recognition**: Identifies and matches student actions to defined thinking routine patterns
- **Consistency Scoring**: Calculates multi-dimensional scores based on:
  - **Frequency**: How often patterns are used
  - **Adherence**: How well pattern steps are followed
  - **Consistency Index**: Regularity of pattern usage over time
- **Visual Dashboard**: Displays scores in an intuitive block with progress bars and color-coded indicators
- **Detailed Analytics**: Provides in-depth view of patterns, activities, and trends
- **Web Services API**: RESTful API for external integrations

## Compatibility

- **Moodle**: 3.7+
- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **PostgreSQL**: 9.6+ (also supported)

## Installation

### Method 1: Via Moodle Plugin Installer

1. Download the plugin ZIP file
2. Go to **Site administration → Plugins → Install plugins**
3. Upload the ZIP file and click "Install plugin from the ZIP file"
4. Follow the installation wizard

### Method 2: Manual Installation

1. Extract the plugin files to `{moodle_root}/blocks/thinkroutine_consistency/`
2. Visit **Site administration → Notifications**
3. Complete the database installation

### Post-Installation

After installation, the plugin will automatically create:
- Database tables for tracking activities and scores
- 5 default thinking routine patterns:
  - Problem Decomposition
  - Visual Representation
  - Systematic Checking
  - Pattern Recognition
  - Self-Reflection

## Usage

### For Students

1. Add the "Thinking Routine Consistency" block to your Dashboard or course page
2. The block will display your overall consistency score and individual pattern scores
3. Click "View Detailed Analytics" to see:
   - Score breakdown by pattern
   - Recent activity history
   - Detailed metrics (frequency, adherence, consistency)

### For Teachers

Teachers can view their students' consistency scores by:
1. Adding the block to a course page
2. Clicking on student names (if they have the `viewall` capability)
3. Analyzing which thinking patterns students use most effectively

### For Administrators

Manage thinking routine patterns at:
**Site administration → Plugins → Blocks → Thinking Routine Consistency**

## API Integration

### Web Services

Enable the following web services for external integration:

#### 1. Get Consistency Score
```php
// Service: block_thinkroutine_consistency_get_score
// Parameters:
{
  "userid": 123,
  "courseid": 456,
  "periodstart": 1635724800,  // Optional timestamp
  "periodend": 1638316800     // Optional timestamp
}

// Returns:
{
  "overall_score": 78.5,
  "period_start": 1635724800,
  "period_end": 1638316800,
  "pattern_scores": [
    {
      "patternid": 1,
      "name": "Problem Decomposition",
      "category": "problem_solving",
      "score": 82.3,
      "frequency": 15,
      "adherence_rate": 88.5,
      "consistency_index": 75.2
    },
    // ... more patterns
  ]
}
```

#### 2. Track Activity
```php
// Service: block_thinkroutine_consistency_track_activity
// Parameters:
{
  "userid": 123,
  "courseid": 456,
  "cmid": 789,  // Course module ID
  "activitytype": "quiz",
  "action": "read_problem",
  "actiondata": "{\"duration\": 30, \"attempts\": 1}"  // JSON string
}

// Returns:
{
  "success": true,
  "activityid": 12345,
  "message": "Activity tracked successfully"
}
```

### JavaScript Integration

Track student activities from custom JavaScript:

```javascript
require(['core/ajax'], function(ajax) {
    ajax.call([{
        methodname: 'block_thinkroutine_consistency_track_activity',
        args: {
            userid: M.cfg.userid,
            courseid: M.cfg.courseid,
            cmid: 123,
            activitytype: 'quiz',
            action: 'create_diagram',
            actiondata: JSON.stringify({
                diagram_type: 'flowchart',
                elements_count: 5
            })
        }
    }]);
});
```

## Thinking Routine Patterns

### Default Patterns

1. **Problem Decomposition** (Problem Solving)
   - Steps: identify_problem → break_into_parts → solve_subproblems → combine_solutions → verify_solution
   - Weight: 1.0

2. **Visual Representation** (Visualization)
   - Steps: read_problem → create_diagram → label_elements → analyze_visual → solve_using_visual
   - Weight: 1.0

3. **Systematic Checking** (Reasoning)
   - Steps: complete_solution → check_calculation → verify_logic → test_edge_cases → confirm_answer
   - Weight: 0.8

4. **Pattern Recognition** (Reasoning)
   - Steps: observe_examples → identify_similarities → formulate_pattern → test_pattern → apply_pattern
   - Weight: 1.2

5. **Self-Reflection** (Metacognition)
   - Steps: review_approach → identify_strengths → identify_challenges → plan_improvements → apply_learnings
   - Weight: 0.9

### Customizing Patterns

Teachers with `managepatterns` capability can add custom patterns via database:

```sql
INSERT INTO mdl_block_trc_patterns (name, description, category, expected_steps, weight, timecreated, timemodified)
VALUES (
  'My Custom Pattern',
  'Description of the thinking routine',
  'problem_solving',
  '["step1", "step2", "step3"]',
  1.0,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP()
);
```

## Consistency Score Algorithm

The consistency score is calculated using a weighted formula:

```
Final Score = (Frequency × 0.3) + (Adherence × 0.5) + (Consistency Index × 0.2)
```

### Components:

1. **Frequency Score** (30% weight)
   - Measures how often the pattern is used
   - 1+ uses per day = 100 points
   - Scales linearly: 0.5 uses/day = 50 points

2. **Adherence Score** (50% weight)
   - Measures how well expected steps are followed
   - Uses Longest Common Subsequence (LCS) algorithm
   - Compares actual action sequence to expected steps

3. **Consistency Index** (20% weight)
   - Measures regularity of usage over time
   - Uses coefficient of variation (lower = more consistent)
   - Bonus points for daily usage patterns

## Database Schema

### Tables

- `mdl_block_trc_patterns`: Thinking routine pattern definitions
- `mdl_block_trc_activities`: Student activity log
- `mdl_block_trc_scores`: Calculated consistency scores
- `mdl_block_trc_sessions`: Learning session analytics

See `db/install.xml` for complete schema definition.

## Capabilities

- `block/thinkroutine_consistency:addinstance`: Add block to course page
- `block/thinkroutine_consistency:myaddinstance`: Add block to Dashboard
- `block/thinkroutine_consistency:viewown`: View own scores
- `block/thinkroutine_consistency:viewall`: View all students' scores
- `block/thinkroutine_consistency:managepatterns`: Manage patterns

## Scheduled Tasks

The plugin includes a scheduled task to periodically update consistency scores:

- **Task**: `\block_thinkroutine_consistency\task\update_scores`
- **Default schedule**: Daily at 2:00 AM
- **Configure at**: Site administration → Server → Scheduled tasks

## Performance Considerations

- Activity tracking is lightweight (single INSERT per action)
- Score calculation is cached per period (default: 30 days)
- Batch score updates run via scheduled task
- Indexes on userid, courseid, and timestamps for fast queries

## Privacy API

The plugin implements Moodle's Privacy API (GDPR compliance):
- Exports user activity data and scores
- Supports data deletion on user deletion
- Categorizes data as "User content"

## Support

For issues, questions, or feature requests:
- **Project**: KAIST Touch Math Academy - AI Education System
- **Documentation**: See `tasks/0001-prd-ai-education-pipeline.md`
- **Version**: 1.0.0

## License

GNU GPL v3 or later

## Credits

**Developed by**: KAIST Touch Math Academy
**Copyright**: 2025
**For**: AI Education System Pipeline Project
