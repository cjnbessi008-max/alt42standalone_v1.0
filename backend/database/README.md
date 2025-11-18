# Database Setup Instructions

## MySQL 5.7 Configuration

This project uses MySQL 5.7 for data storage and integrates with Moodle 3.7 LMS.

### Prerequisites

- MySQL 5.7 or compatible
- Access to MySQL server
- Moodle 3.7 with Web Services enabled
- PHP 7.1.9

### Setup Steps

1. **Create Database**

```bash
mysql -u root -p < schema.sql
```

Or manually:

```bash
mysql -u root -p
```

```sql
source /path/to/schema.sql
```

2. **Configure Environment Variables**

Copy `.env.example` to `.env` and update the values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=impossible_shadow
```

3. **Create Application User** (Optional but recommended)

```sql
CREATE USER 'impossible_shadow'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON impossible_shadow.* TO 'impossible_shadow'@'localhost';
FLUSH PRIVILEGES;
```

4. **Verify Installation**

```bash
mysql -u root -p impossible_shadow -e "SHOW TABLES;"
```

You should see:
- students
- problems
- answers
- courses
- sessions
- activity_log
- moodle_sync

### Database Schema

#### Core Tables

- **students**: Student information synced from Moodle
- **problems**: Generated division problems
- **answers**: Student answers and validation results
- **courses**: Course information from Moodle
- **sessions**: Learning session tracking
- **activity_log**: Detailed activity logging
- **moodle_sync**: Moodle integration sync status

#### Views

- **student_performance**: Aggregated student statistics
- **problem_difficulty_stats**: Problem difficulty analysis

#### Stored Procedures

- **GetStudentStats(student_id)**: Get comprehensive student statistics
- **StartSession(student_id, course_id)**: Create new learning session

### Moodle Integration

The database is designed to integrate with Moodle 3.7:

1. Student data syncs via Moodle Web Services API
2. Course information pulls from Moodle courses
3. Grades can be pushed back to Moodle gradebook
4. Activity logs track student interactions

### Backup and Maintenance

```bash
# Backup database
mysqldump -u root -p impossible_shadow > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p impossible_shadow < backup_20231115.sql
```

### Troubleshooting

**Connection Error:**
- Check MySQL service is running: `sudo service mysql status`
- Verify credentials in `.env` file
- Check firewall settings

**Permission Denied:**
- Ensure user has proper grants: `SHOW GRANTS FOR 'impossible_shadow'@'localhost';`

**Sync Issues:**
- Check `moodle_sync` table for error messages
- Verify Moodle Web Services token is valid
- Check Moodle logs: `/path/to/moodle/admin/tool/log`
