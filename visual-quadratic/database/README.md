# Visual Quadratic Database

PostgreSQL database schema and setup for Visual Quadratic learning app.

## Setup

### 1. Install PostgreSQL

Make sure PostgreSQL 12+ is installed on your system.

### 2. Create Database

```bash
# Create database
createdb visual_quadratic

# Or using psql
psql -U postgres -c "CREATE DATABASE visual_quadratic;"
```

### 3. Run Schema Migration

```bash
# Apply schema
psql -U postgres -d visual_quadratic -f database/schema.sql

# Load sample data (optional, for development)
psql -U postgres -d visual_quadratic -f database/seed.sql
```

## Database Structure

### Tables

#### `students`
Stores student information.
- `id` (UUID, PK)
- `name` (VARCHAR)
- `email` (VARCHAR, unique, optional)
- `grade_level` (VARCHAR, optional)
- `moodle_user_id` (VARCHAR, unique, optional) - For Moodle integration
- `created_at`, `updated_at` (TIMESTAMP)

#### `problems`
Quadratic equation problems.
- `id` (UUID, PK)
- `title` (VARCHAR) - Problem title
- `description` (TEXT) - Problem description
- `target_a`, `target_b`, `target_c` (DECIMAL) - Target coefficients
- `difficulty` (INTEGER 1-5) - Problem difficulty
- `hints` (JSONB) - Array of hint strings
- `created_at`, `updated_at` (TIMESTAMP)

#### `student_progress`
Tracks each student's progress on each problem.
- `id` (UUID, PK)
- `student_id` (UUID, FK → students)
- `problem_id` (UUID, FK → problems)
- `attempts` (INTEGER) - Number of attempts
- `completed` (BOOLEAN) - Whether completed
- `time_spent_seconds` (INTEGER) - Total time spent
- `best_score` (DECIMAL 0-100) - Best accuracy score achieved
- `last_attempt_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)
- **Unique constraint**: (student_id, problem_id)

#### `attempts`
Detailed history of each attempt.
- `id` (UUID, PK)
- `progress_id` (UUID, FK → student_progress)
- `submitted_a`, `submitted_b`, `submitted_c` (DECIMAL) - Submitted coefficients
- `accuracy_score` (DECIMAL 0-100) - Accuracy of this attempt
- `time_taken_seconds` (INTEGER) - Time for this attempt
- `created_at` (TIMESTAMP)

## Sample Data

The `seed.sql` file includes:
- 4 sample students
- 15 problems across 5 difficulty levels:
  - **Level 1**: Basic parabolas (y = x², y = x² + 2, etc.)
  - **Level 2**: Simple roots (y = x² - 4, etc.)
  - **Level 3**: Negative a coefficients (upside-down parabolas)
  - **Level 4**: Complex coefficients
  - **Level 5**: Advanced challenges (complex roots, etc.)

## Maintenance

### Backup

```bash
pg_dump -U postgres visual_quadratic > backup.sql
```

### Restore

```bash
psql -U postgres -d visual_quadratic < backup.sql
```

### Reset Database

```bash
dropdb visual_quadratic
createdb visual_quadratic
psql -U postgres -d visual_quadratic -f database/schema.sql
psql -U postgres -d visual_quadratic -f database/seed.sql
```

## Indexes

Performance indexes are created on:
- Student Moodle ID and email
- Problem difficulty
- Progress lookups (student_id, problem_id, completed)
- Attempt history (progress_id, created_at)
