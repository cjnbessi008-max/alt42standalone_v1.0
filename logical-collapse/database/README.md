# Database Setup Guide

## Requirements

- MySQL 5.7 or higher
- PHP 7.1.9 with PDO extension

## Installation

### 1. Create Database

```bash
mysql -u root -p < schema.sql
```

### 2. Load Sample Data (Optional)

```bash
mysql -u root -p < seed.sql
```

### 3. Configure Environment

Create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_NAME=logical_collapse
DB_USER=root
DB_PASS=your_password
```

## Database Schema

### Tables

#### `problems`
Stores logical reasoning problems with their steps.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| title | VARCHAR(255) | Problem title |
| description | TEXT | Problem description |
| reasoning_steps | JSON | Array of reasoning steps |
| moodle_id | INT | Reference to Moodle quiz ID |
| status | ENUM | active, inactive, archived |

#### `students`
Stores student information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| moodle_user_id | INT | Reference to Moodle user |
| name | VARCHAR(100) | Student name |
| email | VARCHAR(255) | Student email |
| grade_level | VARCHAR(50) | Grade level |

#### `step_validations`
Tracks student attempts at validating reasoning steps.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| problem_id | INT | Foreign key to problems |
| step_index | INT | Index of the step (0-based) |
| is_correct | TINYINT(1) | 1 = correct, 0 = incorrect |
| student_id | INT | Foreign key to students |
| time_spent | INT | Time in seconds |

#### `student_progress`
Tracks overall student progress on problems.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| student_id | INT | Foreign key to students |
| problem_id | INT | Foreign key to problems |
| total_steps | INT | Total number of steps |
| completed_steps | INT | Number of completed steps |
| correct_steps | INT | Number of correct steps |
| progress_percentage | DECIMAL(5,2) | Progress percentage |

#### `collapse_events`
Logs when collapse animations are triggered.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| problem_id | INT | Foreign key to problems |
| step_index | INT | Index of collapsed step |
| student_id | INT | Foreign key to students |
| collapse_triggered | TINYINT(1) | Whether collapse was triggered |
| error_type | VARCHAR(100) | Type of logical error |

#### `moodle_sync_log`
Tracks synchronization with Moodle LMS.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| entity_type | ENUM | problem, student, validation |
| entity_id | INT | ID of synchronized entity |
| action | VARCHAR(50) | fetch, push, update |
| status | ENUM | success, failed, pending |

## Usage

### Query Examples

#### Get active problems
```sql
SELECT * FROM problems WHERE status = 'active';
```

#### Get student progress
```sql
SELECT s.name, p.title, sp.progress_percentage
FROM student_progress sp
JOIN students s ON sp.student_id = s.id
JOIN problems p ON sp.problem_id = p.id
WHERE sp.progress_percentage < 100;
```

#### Get collapse events
```sql
SELECT p.title, ce.step_index, s.name, ce.error_type, ce.created_at
FROM collapse_events ce
JOIN problems p ON ce.problem_id = p.id
JOIN students s ON ce.student_id = s.id
WHERE ce.collapse_triggered = 1
ORDER BY ce.created_at DESC;
```

## Maintenance

### Backup

```bash
mysqldump -u root -p logical_collapse > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
mysql -u root -p logical_collapse < backup_20251118.sql
```

## Troubleshooting

### Connection Issues

1. Check MySQL service is running:
```bash
sudo systemctl status mysql
```

2. Verify credentials in `.env` file

3. Check MySQL user permissions:
```sql
SHOW GRANTS FOR 'your_user'@'localhost';
```

### JSON Column Issues (MySQL < 5.7.8)

If using MySQL version < 5.7.8, replace JSON columns with TEXT and handle JSON encoding/decoding in PHP.
