# Moodle Core Conditions Activity Module

A Moodle activity module that enables teachers to create educational problems where exactly **3 core conditions** must be selected and evaluated for each problem. This module supports advanced learning analytics by tracking how well students meet specific learning conditions.

## Features

- **Problem Management**: Create and manage educational problems with various types (fractions, algebra, geometry, arithmetic)
- **Core Conditions**: Each problem requires exactly 3 core conditions to be defined
- **Condition Types**:
  - Validation (e.g., input format validation)
  - Calculation (e.g., mathematical correctness)
  - Progression (e.g., prerequisite skills)
  - Feedback (e.g., learning guidance)
- **Partial Credit**: Students receive scores based on which conditions they meet (weighted scoring)
- **Attempt Tracking**: Complete history of student attempts with detailed analytics
- **Gradebook Integration**: Automatic grade synchronization with Moodle gradebook

## Requirements

- **Moodle Version**: 3.7 or higher
- **PHP Version**: 7.1.9 or higher
- **MySQL Version**: 5.7 or higher
- **Capabilities**: Teacher/Manager role for content management

## Installation

### Method 1: Manual Installation

1. **Download the plugin**:
   ```bash
   cd /path/to/moodle
   mkdir -p mod/coreconditions
   ```

2. **Copy plugin files**:
   ```bash
   cp -r moodle-plugin/mod/coreconditions/* /path/to/moodle/mod/coreconditions/
   ```

3. **Set permissions**:
   ```bash
   chown -R www-data:www-data /path/to/moodle/mod/coreconditions
   chmod -R 755 /path/to/moodle/mod/coreconditions
   ```

4. **Navigate to Moodle**:
   - Log in as admin
   - Go to: `Site administration > Notifications`
   - Moodle will detect the new plugin and prompt you to upgrade
   - Click "Upgrade Moodle database now"

5. **Verify Installation**:
   - Go to: `Site administration > Plugins > Activity modules`
   - Confirm "Core Conditions" appears in the list

### Method 2: ZIP Installation

1. **Create ZIP file**:
   ```bash
   cd moodle-plugin
   zip -r coreconditions.zip mod/coreconditions/
   ```

2. **Install via Moodle UI**:
   - Log in as admin
   - Go to: `Site administration > Plugins > Install plugins`
   - Upload `coreconditions.zip`
   - Follow the installation wizard

## Database Schema

The plugin creates 4 database tables:

### 1. `mdl_coreconditions`
Main activity instances table

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| course | INT | Course ID |
| name | VARCHAR(255) | Activity name |
| intro | TEXT | Activity description |
| grade | INT | Maximum grade |
| timecreated | INT | Creation timestamp |
| timemodified | INT | Modification timestamp |

### 2. `mdl_coreconditions_problems`
Problems within each activity

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| coreconditions_id | INT | Activity ID (FK) |
| name | VARCHAR(255) | Problem name |
| problem_type | VARCHAR(50) | Type: fraction, algebra, etc. |
| difficulty_level | INT | Difficulty 1-10 |
| correct_answer | TEXT | Correct answer |
| metadata | TEXT | JSON additional data |

### 3. `mdl_coreconditions_conditions`
Core conditions (exactly 3 per problem)

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| problem_id | INT | Problem ID (FK) |
| condition_order | INT | Order: 1, 2, or 3 |
| condition_type | VARCHAR(50) | validation, calculation, progression, feedback |
| condition_name | VARCHAR(255) | Condition name |
| condition_description | TEXT | Description |
| condition_rule | TEXT | Rule logic/expression |
| condition_weight | DECIMAL(5,2) | Weight for grading (default 33.33%) |

### 4. `mdl_coreconditions_attempts`
Student attempt tracking

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| problem_id | INT | Problem ID (FK) |
| userid | INT | User ID (FK) |
| attempt_number | INT | Attempt sequence |
| answer | TEXT | Student's answer |
| is_correct | INT | Fully correct (0/1) |
| conditions_met | TEXT | JSON array of met condition IDs |
| partial_score | DECIMAL(5,2) | Score based on conditions met |
| time_taken | INT | Seconds to complete |

## Usage Guide

### For Teachers

#### 1. Create Activity

1. Turn editing on in your course
2. Click "Add an activity or resource"
3. Select "Core Conditions"
4. Fill in:
   - Activity name
   - Description
   - Maximum grade (default: 100)
5. Click "Save and display"

#### 2. Add Problems

1. In the activity page, click "Add new problem"
2. Fill in problem details:
   - Problem name
   - Description
   - Problem type (fraction, algebra, geometry, arithmetic, other)
   - Difficulty level (1-10)
   - Correct answer
   - Metadata (optional JSON)
3. Click "Create Problem"
4. You'll be redirected to the condition management page

#### 3. Select Core Conditions

For each problem, you must define exactly 3 core conditions:

**Condition 1 Example** (Validation):
- Type: `Validation`
- Name: `Valid Fraction Format`
- Description: `Answer must be in fraction format (numerator/denominator)`
- Rule: `denominator != 0`
- Weight: `33.33%`

**Condition 2 Example** (Calculation):
- Type: `Calculation`
- Name: `Correct Result`
- Description: `The calculation must be mathematically correct`
- Rule: `answer == correct_answer`
- Weight: `33.33%`

**Condition 3 Example** (Progression):
- Type: `Progression`
- Name: `Problem Solving Process`
- Description: `Student demonstrates understanding of the solving method`
- Rule: `check_methodology(answer)`
- Weight: `33.34%`

#### 4. Manage Problems

From the activity main page, you can:
- **Edit**: Modify problem details
- **Manage Conditions**: Update the 3 core conditions
- **Delete**: Remove problem (also deletes all attempts)
- **View Reports**: See student performance (coming soon)

### For Students

#### 1. View Activity

1. Click on the Core Conditions activity in your course
2. You'll see all available problems
3. Each problem shows:
   - Problem name and description
   - The 3 core conditions you need to meet
   - "Submit" button to attempt

#### 2. Attempt Problem

1. Click "Submit" on a problem
2. Read the problem description carefully
3. Review the 3 core conditions
4. Enter your answer
5. Click "Submit answer"

#### 3. View Results

After submission, you'll see:
- **Score**: Percentage based on conditions met
- **Conditions Met**: Which of the 3 conditions you satisfied
- **Feedback**: Detailed explanation of what conditions were not met
- **Attempt History**: Your previous attempts with scores

#### 4. Retry

- You can attempt the same problem multiple times
- Your grade is typically based on your best or average score (teacher configurable)

## API Reference

### PHP Classes

#### `\mod_coreconditions\condition_manager`

Main class for managing core conditions.

**Methods**:

```php
// Get all conditions for a problem
public static function get_conditions($problemid): array

// Save a condition
public static function save_condition($condition): int

// Save all 3 conditions at once
public static function save_all_conditions($problemid, $conditionsdata): bool

// Delete a condition
public static function delete_condition($conditionid): bool

// Validate condition count (must be 3)
public static function validate_condition_count($problemid): bool

// Evaluate student attempt against conditions
public static function evaluate_attempt($problemid, $answer, $correctanswer): array

// Get available condition types
public static function get_condition_types(): array
```

### Database Functions

```php
// Create/update grade item
coreconditions_grade_item_update($coreconditions, $grades = null): int

// Delete grade item
coreconditions_grade_item_delete($coreconditions): int

// Update grades for user(s)
coreconditions_update_grades($coreconditions, $userid = 0, $nullifnone = true): void

// Get user grades
coreconditions_get_user_grades($coreconditions, $userid = 0): array
```

## Configuration

### Capabilities

The plugin defines these capabilities:

| Capability | Description | Default Roles |
|------------|-------------|---------------|
| `mod/coreconditions:addinstance` | Add new Core Conditions activity | Teacher, Manager |
| `mod/coreconditions:view` | View Core Conditions activity | All roles |
| `mod/coreconditions:submit` | Submit answers to problems | Student |
| `mod/coreconditions:manageconditions` | Manage problems and conditions | Teacher, Manager |
| `mod/coreconditions:viewreports` | View student reports | Teacher, Manager |

### Grading

Grading is based on weighted scoring:
- Each condition has a weight (default: 33.33% each)
- Total weight should sum to 100%
- Students receive partial credit for meeting some conditions

**Example**:
- Condition 1 met: 33.33%
- Condition 2 not met: 0%
- Condition 3 met: 33.33%
- **Total Score**: 66.66%

## Extending the Plugin

### Adding Custom Condition Types

1. Edit `classes/condition_manager.php`
2. Add to `get_condition_types()` method
3. Implement evaluation logic in `evaluate_condition()`
4. Add language strings to `lang/en/coreconditions.php`

### Custom Evaluation Logic

The evaluation logic is in `condition_manager::evaluate_condition()`. You can extend it to:
- Parse complex rule expressions
- Integrate with external systems
- Use AI/ML for evaluation
- Check against ontologies

### Example Custom Evaluator:

```php
private static function evaluate_custom($rule, $answer) {
    // Parse rule expression
    $expression = new RuleParser($rule);

    // Evaluate against answer
    return $expression->evaluate($answer);
}
```

## Troubleshooting

### Plugin not appearing after installation

1. Check file permissions: `chmod -R 755 mod/coreconditions`
2. Clear Moodle caches: `Admin > Development > Purge all caches`
3. Check PHP error logs: `/var/log/php/error.log`

### Database errors during installation

1. Verify MySQL version: `SELECT VERSION();` (should be 5.7+)
2. Check character set: `SHOW VARIABLES LIKE 'character_set%';`
3. Ensure InnoDB engine: `SHOW ENGINES;`

### Conditions not saving

1. Check browser console for JavaScript errors
2. Verify session key is valid
3. Check PHP max_input_vars: `php -i | grep max_input_vars`
4. Increase if needed: `max_input_vars = 3000` in php.ini

### Grade not updating in gradebook

1. Check capability: `mod/coreconditions:submit`
2. Verify grade value in activity settings > 0
3. Manually trigger: `Admin > Courses > Gradebook > Reset`

## Development

### File Structure

```
mod/coreconditions/
├── version.php                  # Plugin metadata
├── lib.php                      # Core library functions
├── mod_form.php                 # Activity settings form
├── view.php                     # Main activity view
├── manage_problem.php           # Add/edit problems
├── manage_conditions.php        # Manage 3 core conditions
├── attempt.php                  # Student attempt page
├── delete_problem.php           # Delete problems
├── styles.css                   # Custom styles
├── db/
│   ├── install.xml             # Database schema
│   └── access.php              # Capability definitions
├── classes/
│   ├── condition_manager.php   # Condition management logic
│   └── event/
│       └── course_module_viewed.php  # Event class
└── lang/
    └── en/
        └── coreconditions.php  # English language strings
```

### Running Tests

```bash
# From Moodle root directory
php admin/tool/phpunit/cli/init.php
vendor/bin/phpunit mod/coreconditions/tests/
```

### Debugging

Enable debugging in Moodle:
1. `Site administration > Development > Debugging`
2. Set to "DEVELOPER: extra Moodle debug messages for developers"
3. Check logs: `Admin > Reports > Logs`

## Support & Contribution

### Reporting Issues

Report bugs or request features:
- Create an issue in the repository
- Include: Moodle version, PHP version, error messages, steps to reproduce

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This plugin is licensed under the GNU GPL v3 or later.

## Credits

**Author**: AI Education System Team
**Copyright**: 2025
**Moodle Version**: 3.7+
**PHP Version**: 7.1.9+
**MySQL Version**: 5.7+

## Version History

### 1.0.0 (2025-01-18)
- Initial release
- Core functionality: 3 conditions per problem
- Teacher UI for condition management
- Student attempt tracking
- Gradebook integration
- Partial credit scoring

## Screenshots

### Teacher View
- Problem management interface
- Condition selection form (3 conditions)
- Student performance overview

### Student View
- Problem list with conditions
- Attempt submission form
- Results with feedback
- Attempt history

## FAQ

**Q: Why exactly 3 conditions?**
A: Educational research shows that 3 key criteria provide optimal learning focus without overwhelming students.

**Q: Can I change the number of conditions?**
A: Yes, but it requires modifying the database schema and code. The default is designed for 3 conditions.

**Q: How are partial scores calculated?**
A: Each condition has a weight (default 33.33%). The score is the sum of weights for met conditions.

**Q: Can conditions check multiple aspects?**
A: Yes! Each condition can have complex logic. For example, a validation condition can check format, range, and constraints.

**Q: Does this work with question banks?**
A: Currently no. This is a standalone activity module. Integration with question banks is planned for future versions.

**Q: Can I import/export problems?**
A: Not in v1.0. This feature is planned for v1.1.

## Roadmap

### v1.1 (Planned)
- Import/Export problems (XML/JSON)
- Question bank integration
- Advanced analytics dashboard
- AI-powered condition suggestions

### v1.2 (Planned)
- Adaptive learning paths
- Peer review functionality
- Mobile app support
- Multi-language support (Korean, Chinese)

### v2.0 (Planned)
- Integration with AI Education Pipeline
- Ontology-based condition reasoning
- Real-time collaboration
- LTI 1.3 support

---

For more information, visit the [Moodle Plugins Directory](https://moodle.org/plugins/)
