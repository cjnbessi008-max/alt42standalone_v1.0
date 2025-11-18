# Number Melody Database

## Setup Instructions

### 1. Create Database

```bash
mysql -u root -p < schema.sql
```

Or manually in MySQL:
```sql
source /path/to/schema.sql
```

### 2. Configure Connection

Update the database credentials in `/api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_melody');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Test Connection

Visit: `http://your-domain/number-melody/api/api.php?action=get_problem`

Expected response:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "Basic Sequence",
    ...
  }
}
```

## Database Schema

### Tables

1. **problems** - Stores quiz problems/questions
   - Links to Moodle questions via `moodle_question_id`
   - Stores number sequences as JSON
   - Includes difficulty levels and sound patterns

2. **student_attempts** - Records each attempt by students
   - Tracks correctness and time spent
   - Foreign key to problems table

3. **interactions** - Analytics data for user interactions
   - Captures tap patterns and sequences
   - Stores additional data as JSON

4. **student_progress** - Summary of student performance
   - Quick access to overall progress
   - Tracks current level and total time

## Integration with Moodle

Link problems to Moodle questions by setting `moodle_question_id`:

```sql
UPDATE problems
SET moodle_question_id = 123
WHERE id = 1;
```

The system will automatically sync attempts back to Moodle when configured.
