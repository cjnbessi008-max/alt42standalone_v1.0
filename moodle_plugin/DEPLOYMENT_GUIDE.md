# Deployment Guide: Student Priority Selection for Moodle 3.7

## Overview

This guide provides step-by-step instructions for deploying the Student Priority Selection block to your existing Moodle 3.7 LMS (MySQL 5.7, PHP 7.1.9).

## System Requirements Verification

Before deploying, verify your system meets these requirements:

```bash
# Check PHP version
php -v
# Should show: PHP 7.1.9 or higher

# Check MySQL version
mysql --version
# Should show: MySQL 5.7 or higher

# Check Moodle version
# Log in to Moodle as admin, go to:
# Site administration → Notifications
# Should show: Moodle 3.7 or higher
```

## Pre-Deployment Checklist

- [ ] Backup your Moodle database
- [ ] Backup your Moodle files
- [ ] Verify you have admin access to Moodle
- [ ] Verify you have SSH/FTP access to the server
- [ ] Check available disk space (minimum 10MB)
- [ ] Enable Moodle maintenance mode (optional but recommended)

## Deployment Steps

### Step 1: Upload Plugin Files

**Option A: Using SCP (Secure Copy)**

```bash
# From your local machine
scp -r block_student_priority username@your-moodle-server:/var/www/moodle/blocks/

# Verify upload
ssh username@your-moodle-server
cd /var/www/moodle/blocks/
ls -la block_student_priority/
```

**Option B: Using FTP/SFTP**

1. Connect to your Moodle server via FTP client (FileZilla, WinSCP, etc.)
2. Navigate to `/var/www/moodle/blocks/` (path may vary)
3. Upload the entire `block_student_priority` folder
4. Verify all files uploaded successfully

**Option C: Using Git (Recommended)**

```bash
# SSH into your Moodle server
ssh username@your-moodle-server

# Navigate to blocks directory
cd /var/www/moodle/blocks/

# Clone the repository
git clone <repository-url> block_student_priority

# Or copy from local development
cp -r /path/to/alt42standalone_v1.0/moodle_plugin/block_student_priority ./
```

### Step 2: Set Correct Permissions

```bash
# SSH into your server
ssh username@your-moodle-server

# Navigate to Moodle blocks directory
cd /var/www/moodle/blocks/

# Set ownership (replace www-data with your web server user)
sudo chown -R www-data:www-data block_student_priority/

# Set permissions
sudo chmod -R 755 block_student_priority/

# Verify permissions
ls -la block_student_priority/
```

**Common web server users by OS:**
- Ubuntu/Debian: `www-data`
- CentOS/RHEL: `apache` or `httpd`
- macOS: `_www`

### Step 3: Verify File Structure

Ensure the directory structure is correct:

```
/var/www/moodle/blocks/block_student_priority/
├── block_student_priority.php
├── version.php
├── settings.php
├── edit_form.php
├── save_priority.php
├── module.js
├── styles.css
├── report.php
├── README.md
├── INSTALL.txt
├── db/
│   ├── install.xml
│   └── access.php
├── lang/
│   └── en/
│       └── block_student_priority.php
└── classes/
    └── event/
        └── priority_selected.php
```

### Step 4: Run Moodle Upgrade

1. **Access Moodle Admin Panel**
   - Navigate to: `https://your-moodle-site.com`
   - Log in as administrator

2. **Trigger Installation**
   - Go to: Site administration → Notifications
   - Moodle will automatically detect the new plugin
   - You should see: "Student Priority Selection (block_student_priority)"

3. **Install Plugin**
   - Click "Upgrade Moodle database now"
   - Review the changes that will be made
   - Confirm installation
   - Wait for installation to complete

4. **Verify Installation**
   - You should see: "Success" message
   - Click "Continue"

### Step 5: Configure Global Settings (Optional)

1. Navigate to: Site administration → Plugins → Blocks → Student Priority Selection

2. Configure default settings:
   - **Allow Changes**: ✓ (Let students change their selection)
   - **Require Reason**: ☐ (Don't require explanation)
   - **Show Analytics**: ✓ (Show stats to teachers)
   - **Default Learning Steps**: (Customize as needed)

3. Click "Save changes"

### Step 6: Test the Installation

**Test 1: Add Block as Teacher**

1. Navigate to any course as a teacher
2. Turn editing on
3. Click "Add a block"
4. Select "Student Priority Selection"
5. Verify the block appears

**Test 2: Student Selection**

1. Log in as a student (or create a test student account)
2. Navigate to a course with the block
3. Click on a learning step card
4. Verify the selection is saved
5. Verify "Your current priority" message appears

**Test 3: View Analytics as Teacher**

1. Log in as a teacher
2. Navigate to the block
3. Click on block menu → "Priority Selection Report"
4. Verify report displays (or shows "No data" if no selections yet)

**Test 4: Database Verification**

```bash
# SSH into your server
mysql -u moodle_user -p moodle_database

# Check tables exist
SHOW TABLES LIKE 'mdl_block_student_priority%';

# Should show:
# mdl_block_student_priority
# mdl_block_student_priority_log

# Check a selection was saved
SELECT * FROM mdl_block_student_priority LIMIT 5;

# Exit MySQL
exit;
```

### Step 7: Disable Maintenance Mode

If you enabled maintenance mode:

1. Go to: Site administration → Server → Maintenance mode
2. Click "Disable maintenance mode"
3. Click "Save changes"

## Post-Deployment Configuration

### For Course Administrators

**Customize Learning Steps Per Course:**

1. Navigate to your course
2. Find the Student Priority Selection block
3. Click the gear icon → "Configure Student Priority Selection block"
4. In "Custom Learning Steps" field, enter your steps (one per line):
   ```
   Understanding Fractions Basics
   Adding Fractions with Same Denominators
   Adding Fractions with Different Denominators
   Multiplying Fractions
   Dividing Fractions
   ```
5. Save changes

**Restrict Selection Changes:**

To prevent students from changing their selection after initial choice:
1. Edit block settings
2. Uncheck "Allow Changes"
3. Save changes

### For Site Administrators

**Set Default Steps Site-Wide:**

1. Site administration → Plugins → Blocks → Student Priority Selection
2. Edit "Default Learning Steps"
3. These will be used when block is first added to any course

**Configure Permissions:**

To customize who can do what:

1. Site administration → Users → Permissions → Define roles
2. Select a role (e.g., "Student", "Teacher")
3. Filter for "student_priority"
4. Adjust capabilities:
   - `block/student_priority:setpriority` - Select priorities
   - `block/student_priority:viewreports` - View analytics
   - `block/student_priority:addinstance` - Add block to courses

## Monitoring and Maintenance

### Check Plugin Health

```bash
# Check Moodle error logs
tail -f /var/www/moodledata/error.log

# Check web server logs
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx

# Check MySQL slow query log
mysql -u root -p -e "SHOW VARIABLES LIKE 'slow_query_log_file';"
```

### Database Maintenance

**Archive old logs (run monthly):**

```sql
-- Archive logs older than 6 months
CREATE TABLE mdl_block_student_priority_log_archive AS
SELECT * FROM mdl_block_student_priority_log
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH));

-- Delete archived logs
DELETE FROM mdl_block_student_priority_log
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH));

-- Optimize tables
OPTIMIZE TABLE mdl_block_student_priority;
OPTIMIZE TABLE mdl_block_student_priority_log;
```

### Performance Monitoring

Monitor these metrics:

- **Page load time**: Block should add < 100ms
- **Database queries**: Should add 2-3 queries per page load
- **AJAX response time**: save_priority.php should respond < 500ms

## Troubleshooting

### Issue: Plugin Not Detected

**Solution:**
```bash
# Clear Moodle cache
cd /var/www/moodle/admin/cli
sudo -u www-data php purge_caches.php

# Or via web interface:
# Site administration → Development → Purge all caches
```

### Issue: JavaScript Not Working

**Check browser console for errors:**
1. Open browser developer tools (F12)
2. Navigate to Console tab
3. Look for errors related to `module.js`

**Verify JavaScript is enabled:**
1. Site administration → Appearance → AJAX and Javascript
2. Ensure "Enable AJAX" is checked

### Issue: Permission Denied

**Check file ownership:**
```bash
cd /var/www/moodle/blocks/
ls -la block_student_priority/
# All files should be owned by web server user
```

**Fix permissions:**
```bash
sudo chown -R www-data:www-data block_student_priority/
sudo chmod -R 755 block_student_priority/
```

### Issue: Database Tables Not Created

**Manually create tables:**
```bash
# Site administration → Development → XMLDB editor
# Navigate to: blocks/student_priority/db/install.xml
# Click "Load XML File"
# Click "Check syntax"
# Click "Create tables"
```

### Issue: Selections Not Saving

**Check database connectivity:**
```sql
-- Test insert
INSERT INTO mdl_block_student_priority
(userid, courseid, priority_step, step_name, timecreated, timemodified)
VALUES (2, 1, 1, 'Test Step', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- Verify insert
SELECT * FROM mdl_block_student_priority WHERE step_name = 'Test Step';

-- Clean up
DELETE FROM mdl_block_student_priority WHERE step_name = 'Test Step';
```

**Check AJAX endpoint:**
```bash
# Test save_priority.php directly
curl -X POST https://your-moodle-site.com/blocks/student_priority/save_priority.php \
  -d "userid=2&courseid=1&priority_step=1&step_name=Test&sesskey=VALID_SESSKEY"
```

## Rollback Procedure

If you need to uninstall the plugin:

1. **Via Moodle Interface:**
   - Site administration → Plugins → Blocks → Manage blocks
   - Find "Student Priority Selection"
   - Click "Uninstall"
   - Confirm uninstallation

2. **Manual Rollback:**
   ```bash
   # Remove plugin files
   sudo rm -rf /var/www/moodle/blocks/block_student_priority/

   # Drop database tables
   mysql -u moodle_user -p moodle_database <<EOF
   DROP TABLE IF EXISTS mdl_block_student_priority;
   DROP TABLE IF EXISTS mdl_block_student_priority_log;
   EOF

   # Clear cache
   cd /var/www/moodle/admin/cli
   sudo -u www-data php purge_caches.php
   ```

## Security Considerations

- **CSRF Protection**: Plugin uses Moodle's sesskey for CSRF protection
- **SQL Injection**: All queries use parameterized statements
- **XSS Prevention**: All output is sanitized
- **Capability Checks**: All actions require appropriate capabilities
- **Audit Logging**: All selections are logged with timestamps

## Performance Optimization

**Enable Caching:**
```php
// In config.php, add:
$CFG->cachejs = true;
$CFG->cachetemplates = true;
```

**Database Indexes:**
Already included in install.xml, but verify:
```sql
SHOW INDEXES FROM mdl_block_student_priority;
-- Should show indexes on: userid_courseid, priority_step
```

## Support and Maintenance

**Regular Maintenance Tasks:**
- Weekly: Review error logs
- Monthly: Check analytics for usage patterns
- Quarterly: Archive old log entries
- Annually: Review and update learning steps

**Support Contacts:**
- Technical issues: Create issue in repository
- Feature requests: Submit via issue tracker
- Security concerns: Email security team

## Appendix: Integration Examples

### Integration with Moodle Completion

Track priority selections as part of course completion:

```php
// In your course completion settings
// Add custom completion rule based on priority selection
```

### Export Priority Data

```sql
-- Export to CSV
SELECT u.username, u.firstname, u.lastname, c.fullname as course,
       p.step_name, p.priority_step,
       FROM_UNIXTIME(p.timecreated) as selected_date
FROM mdl_block_student_priority p
JOIN mdl_user u ON u.id = p.userid
JOIN mdl_course c ON c.id = p.courseid
ORDER BY c.fullname, u.lastname
INTO OUTFILE '/tmp/priority_selections.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### API Access

Use Moodle Web Services to access priority data programmatically.

## Version History

- **v1.0** (2025-01-18): Initial release
  - Student priority selection interface
  - Teacher analytics and reporting
  - Configurable learning steps
  - Event logging

---

**Last Updated**: 2025-01-18
**Maintainer**: KAIST Touch Math Academy
**License**: GNU GPL v3 or later
