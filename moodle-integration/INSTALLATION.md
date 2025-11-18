# Installation Guide: Thinking Routine Consistency Score for Moodle LMS

## Prerequisites

Before installing this plugin, ensure your system meets the following requirements:

- **Moodle**: Version 3.7 or higher
- **PHP**: Version 7.1.9 or higher (PHP 7.2+ recommended)
- **MySQL**: Version 5.7 or higher (or PostgreSQL 9.6+)
- **Web Server**: Apache 2.4+ or Nginx 1.14+
- **Disk Space**: Minimum 10 MB for plugin files
- **Database Space**: ~1 MB initial, grows with usage

## Installation Steps

### Option 1: Web-Based Installation (Recommended)

1. **Download the Plugin**
   ```bash
   # Create a ZIP file of the plugin directory
   cd moodle-integration
   zip -r thinkroutine_consistency.zip .
   ```

2. **Upload via Moodle Interface**
   - Log in to Moodle as an administrator
   - Navigate to: **Site administration → Plugins → Install plugins**
   - Drag and drop `thinkroutine_consistency.zip` or click "Choose a file"
   - Click **"Install plugin from the ZIP file"**

3. **Confirm Installation**
   - Review the plugin validation report
   - Click **"Continue"** if validation passes
   - Review the installation notes
   - Click **"Upgrade Moodle database now"**

4. **Complete Setup**
   - The installation will create database tables
   - Default thinking routine patterns will be added
   - Click **"Continue"** to finish

### Option 2: Manual Installation via Command Line

1. **Copy Plugin Files**
   ```bash
   # From your Moodle root directory
   cd /path/to/moodle

   # Create blocks directory if it doesn't exist
   mkdir -p blocks/thinkroutine_consistency

   # Copy plugin files
   cp -r /path/to/moodle-integration/* blocks/thinkroutine_consistency/

   # Set proper permissions
   chown -R www-data:www-data blocks/thinkroutine_consistency
   chmod -R 755 blocks/thinkroutine_consistency
   ```

2. **Trigger Database Installation**
   ```bash
   # Via command line
   php admin/cli/upgrade.php

   # Or visit in browser:
   # https://your-moodle-site.com/admin/index.php
   ```

3. **Verify Installation**
   ```bash
   # Check database tables were created
   mysql -u moodle_user -p moodle_db -e "SHOW TABLES LIKE 'mdl_block_trc%';"

   # Should show:
   # mdl_block_trc_activities
   # mdl_block_trc_patterns
   # mdl_block_trc_scores
   # mdl_block_trc_sessions
   ```

## Post-Installation Configuration

### 1. Enable Web Services (Required for API Integration)

```bash
# Via Moodle admin interface:
# Site administration → Advanced features → Enable web services: Yes
# Site administration → Plugins → Web services → Manage protocols → Enable REST protocol
```

Add the plugin services:
- Go to: **Site administration → Plugins → Web services → External services**
- Click **"Add"** and create a new service named "Thinking Routine Consistency API"
- Add functions:
  - `block_thinkroutine_consistency_get_score`
  - `block_thinkroutine_consistency_track_activity`

### 2. Configure Scheduled Task

The plugin includes a scheduled task to update consistency scores daily.

```bash
# Check task schedule:
# Site administration → Server → Scheduled tasks
# Find: "Update consistency scores"
# Default: Daily at 2:00 AM
```

To modify schedule:
```bash
# Via CLI
php admin/cli/scheduled_task.php --list | grep consistency
php admin/cli/scheduled_task.php --execute='\block_thinkroutine_consistency\task\update_scores'
```

### 3. Set Permissions

Assign capabilities to roles:

```bash
# Via admin interface:
# Site administration → Users → Permissions → Define roles
```

**Student Role**:
- ✅ `block/thinkroutine_consistency:myaddinstance`
- ✅ `block/thinkroutine_consistency:viewown`

**Teacher Role**:
- ✅ `block/thinkroutine_consistency:addinstance`
- ✅ `block/thinkroutine_consistency:viewown`
- ✅ `block/thinkroutine_consistency:viewall`

**Editing Teacher/Manager Role**:
- ✅ `block/thinkroutine_consistency:addinstance`
- ✅ `block/thinkroutine_consistency:viewall`
- ✅ `block/thinkroutine_consistency:managepatterns`

## Verification

### Test Database Installation

```sql
-- Connect to MySQL
mysql -u moodle_user -p moodle_db

-- Verify tables exist
SELECT COUNT(*) FROM mdl_block_trc_patterns;
-- Expected: 5 (default patterns)

SELECT name, category FROM mdl_block_trc_patterns;
-- Should show 5 default thinking routine patterns

-- Verify structure
DESCRIBE mdl_block_trc_activities;
DESCRIBE mdl_block_trc_scores;
```

### Test Block Display

1. Log in as a student
2. Go to Dashboard (**My courses → Dashboard**)
3. Click **"Customize this page"** (or edit mode)
4. Click **"Add a block"**
5. Select **"Thinking Routine Consistency"**
6. Block should appear showing "No scores yet" message

### Test API Endpoints

```bash
# Get web service token first (Site administration → Plugins → Web services → Manage tokens)

# Test get_score endpoint
curl -X POST "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=block_thinkroutine_consistency_get_score" \
  -d "moodlewsrestformat=json" \
  -d "userid=2" \
  -d "courseid=2"

# Expected response:
# {"overall_score":0,"period_start":...,"period_end":...,"pattern_scores":[]}
```

## Troubleshooting

### Database Installation Fails

**Problem**: Tables not created during installation

**Solution**:
```bash
# Check Moodle error log
tail -f /var/log/moodle/error.log

# Manually run install script
mysql -u moodle_user -p moodle_db < blocks/thinkroutine_consistency/db/install.xml

# Or use Moodle XMLDB tool:
# Site administration → Development → XMLDB editor
```

### Block Not Appearing

**Problem**: Block doesn't show in "Add a block" list

**Solution**:
```bash
# Purge all caches
php admin/cli/purge_caches.php

# Or via interface:
# Site administration → Development → Purge all caches

# Check block is installed:
php admin/cli/upgrade.php --list
# Should show: block_thinkroutine_consistency
```

### Permission Denied Errors

**Problem**: Users can't view scores or add block

**Solution**:
```bash
# Reset capabilities
# Site administration → Users → Permissions → Capability overview
# Search for: block/thinkroutine_consistency

# Or reset via SQL:
mysql -u moodle_user -p moodle_db -e "
UPDATE mdl_role_capabilities
SET permission = 1
WHERE capability LIKE 'block/thinkroutine_consistency%';
"
```

### Web Services Not Working

**Problem**: API calls return authentication errors

**Solution**:
1. Enable web services: **Site administration → Advanced features**
2. Enable REST protocol: **Site administration → Plugins → Web services → Manage protocols**
3. Create token: **Site administration → Plugins → Web services → Manage tokens**
4. Authorize user: **Site administration → Plugins → Web services → Manage users**

## Integration with Existing Moodle Activities

### Automatic Tracking (Future Enhancement)

To automatically track activities, add observers in `db/events.php`:

```php
$observers = [
    [
        'eventname' => '\mod_quiz\event\attempt_started',
        'callback' => '\block_thinkroutine_consistency\observer::quiz_started',
    ],
    // Add more activity events...
];
```

### Manual Tracking via JavaScript

Add to your theme or course:

```html
<script>
require(['core/ajax'], function(ajax) {
    // Track when student views a problem
    document.addEventListener('problemViewed', function(e) {
        ajax.call([{
            methodname: 'block_thinkroutine_consistency_track_activity',
            args: {
                userid: M.cfg.userid,
                courseid: M.cfg.courseid,
                cmid: e.detail.cmid,
                activitytype: 'quiz',
                action: 'read_problem',
                actiondata: JSON.stringify(e.detail)
            }
        }]);
    });
});
</script>
```

## Uninstallation

To completely remove the plugin:

1. **Via Moodle Interface**:
   - Site administration → Plugins → Plugins overview
   - Find "Thinking Routine Consistency"
   - Click **"Uninstall"**
   - Confirm deletion (all data will be removed)

2. **Manual Cleanup**:
   ```bash
   # Remove plugin files
   rm -rf /path/to/moodle/blocks/thinkroutine_consistency

   # Drop database tables (optional, done automatically)
   mysql -u moodle_user -p moodle_db -e "
   DROP TABLE IF EXISTS mdl_block_trc_patterns;
   DROP TABLE IF EXISTS mdl_block_trc_activities;
   DROP TABLE IF EXISTS mdl_block_trc_scores;
   DROP TABLE IF EXISTS mdl_block_trc_sessions;
   "

   # Clear caches
   php admin/cli/purge_caches.php
   ```

## Support and Maintenance

### Regular Maintenance Tasks

```bash
# Weekly: Check score calculation performance
mysql -u moodle_user -p moodle_db -e "
SELECT COUNT(*) as total_activities,
       AVG(timecreated) as avg_time
FROM mdl_block_trc_activities
WHERE timecreated > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
"

# Monthly: Archive old scores
mysql -u moodle_user -p moodle_db -e "
DELETE FROM mdl_block_trc_scores
WHERE period_end < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH));
"

# Optimize tables
mysql -u moodle_user -p moodle_db -e "
OPTIMIZE TABLE mdl_block_trc_activities;
OPTIMIZE TABLE mdl_block_trc_scores;
"
```

### Backup Recommendations

Include these tables in your Moodle backup:
- `mdl_block_trc_patterns` (pattern definitions)
- `mdl_block_trc_activities` (activity log)
- `mdl_block_trc_scores` (calculated scores)
- `mdl_block_trc_sessions` (session data)

## Next Steps

After successful installation:

1. ✅ Add the block to course pages or Dashboard
2. ✅ Customize thinking routine patterns (optional)
3. ✅ Integrate activity tracking in your courses
4. ✅ Train teachers on interpreting consistency scores
5. ✅ Monitor performance and adjust scheduled tasks as needed

For questions or issues, refer to the main README.md file.
