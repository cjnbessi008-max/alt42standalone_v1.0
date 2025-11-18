# Installation Guide
## Moodle Difficulty Prediction Plugin

This guide provides step-by-step instructions for installing and configuring the Difficulty Prediction plugin for Moodle 3.7.

---

## Prerequisites

Before installing, ensure your system meets these requirements:

### System Requirements

- **Moodle Version**: 3.7 or higher
- **PHP Version**: 7.1.9 or higher
- **MySQL Version**: 5.7 or higher
- **Web Server**: Apache 2.4+ or Nginx 1.14+
- **PHP Extensions**:
  - mysqli
  - json
  - mbstring
  - curl

### Permissions

- Administrative access to Moodle
- Database write permissions
- File system write permissions in Moodle's `local/` directory

---

## Installation Steps

### Step 1: Download the Plugin

#### Option A: Git Clone (Recommended)

```bash
cd /var/www/html/moodle
git clone <repository-url> local/difficulty_prediction
```

#### Option B: Manual Download

1. Download the plugin ZIP file
2. Extract to `/path/to/moodle/local/difficulty_prediction`

### Step 2: Set File Permissions

```bash
cd /var/www/html/moodle
chown -R www-data:www-data local/difficulty_prediction
chmod -R 755 local/difficulty_prediction
```

### Step 3: Install via Moodle Admin Interface

1. **Login to Moodle** as administrator

2. **Navigate to Site Administration**
   - Go to **Site Administration → Notifications**

3. **Install Plugin**
   - Moodle will detect the new plugin
   - Review the plugin details
   - Click **"Upgrade Moodle database now"**

4. **Verify Installation**
   - Check for success message
   - Ensure no errors in the log

### Step 4: Verify Database Tables

Check that the following tables were created:

```sql
SHOW TABLES LIKE '%question_difficulty%';
```

Expected tables:
- `mdl_question_difficulty`
- `mdl_question_performance`
- `mdl_difficulty_config`

### Step 5: Configure Plugin Settings

1. **Navigate to Plugin Settings**
   - **Site Administration → Plugins → Local plugins → Difficulty Prediction**

2. **Configure Algorithm Weights** (or use defaults)
   - Complexity weight: `0.40`
   - Cognitive load weight: `0.30`
   - Historical data weight: `0.20`
   - Question type weight: `0.10`

3. **Configure Thresholds**
   - Minimum attempts threshold: `10`
   - Cache TTL: `3600` seconds (1 hour)

4. **Enable Auto-Prediction**
   - Check ✅ "Enable automatic prediction"

5. **Save Changes**

---

## Post-Installation Configuration

### Step 6: Set Up Scheduled Tasks

1. **Navigate to Scheduled Tasks**
   - **Site Administration → Server → Scheduled tasks**

2. **Verify Tasks Are Enabled**
   - Find "Update difficulty predictions" - should run daily at 2 AM
   - Find "Clean up old performance data" - should run weekly on Sunday at 3 AM

3. **Adjust Schedule** (optional)
   - Click on task name to edit schedule
   - Modify cron expression as needed

### Step 7: Configure Capabilities

1. **Navigate to Define Roles**
   - **Site Administration → Users → Define roles**

2. **Assign Capabilities**
   - **Teacher**: `local/difficulty_prediction:view`, `local/difficulty_prediction:viewanalytics`
   - **Manager**: All capabilities including `local/difficulty_prediction:manage`

### Step 8: Enable Event Observers

Verify event observers are active:

```bash
php admin/cli/scheduled_task.php --list | grep difficulty
```

You should see output like:
```
Update difficulty predictions (local_difficulty_prediction\task\update_difficulties)
Clean up old performance data (local_difficulty_prediction\task\cleanup_old_performance)
```

---

## Testing the Installation

### Test 1: Manual Prediction

Create a test question and verify prediction:

```php
// Run in Moodle CLI or admin tool
require_once('config.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');

use local_difficulty_prediction\difficulty_predictor;

$questionid = 1; // Replace with actual question ID
$prediction = difficulty_predictor::predict($questionid);

echo "Predicted Level: " . $prediction->predicted_level . "\n";
echo "Confidence: " . ($prediction->confidence_score * 100) . "%\n";
```

### Test 2: Event Triggering

1. **Create a new question** in the question bank
2. **Check the database**:
   ```sql
   SELECT * FROM mdl_question_difficulty ORDER BY timecreated DESC LIMIT 1;
   ```
3. Verify a record was created for your new question

### Test 3: Performance Tracking

1. **Create a quiz** with the test question
2. **Take the quiz** as a student
3. **Submit the quiz**
4. **Check performance data**:
   ```sql
   SELECT * FROM mdl_question_performance ORDER BY timecreated DESC LIMIT 1;
   ```

### Test 4: API Access

Test the REST API:

```bash
curl -X POST "https://your-moodle-site/local/difficulty_prediction/api.php" \
  -H "Content-Type: application/json" \
  -d '{"action": "predict", "questionid": 1, "wstoken": "YOUR_WS_TOKEN"}'
```

---

## Troubleshooting Installation

### Issue: Database Tables Not Created

**Symptoms:**
- Error during installation
- Missing tables in database

**Solution:**
```sql
-- Manually run installation script
source /path/to/moodle/local/difficulty_prediction/db/install.sql
```

Or use Moodle CLI:
```bash
php admin/cli/uninstall_plugins.php --plugins=local_difficulty_prediction --run
php admin/cli/upgrade.php
```

### Issue: Permission Denied Errors

**Symptoms:**
- "Permission denied" when accessing plugin files
- Cannot write to database

**Solution:**
```bash
# Fix file permissions
chown -R www-data:www-data /var/www/html/moodle/local/difficulty_prediction
chmod -R 755 /var/www/html/moodle/local/difficulty_prediction

# Check database user permissions
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: Plugin Not Detected

**Symptoms:**
- Plugin doesn't appear in notifications
- Not listed in plugin overview

**Solution:**
1. Verify plugin is in correct directory: `/local/difficulty_prediction`
2. Check `version.php` exists and is readable
3. Clear Moodle cache:
   ```bash
   php admin/cli/purge_caches.php
   ```

### Issue: Event Observers Not Working

**Symptoms:**
- New questions don't get automatic predictions
- Quiz submissions don't update performance

**Solution:**
1. Check event observers are registered:
   ```sql
   SELECT * FROM mdl_events_handlers WHERE component = 'local_difficulty_prediction';
   ```

2. Re-register observers:
   ```bash
   php admin/cli/upgrade.php --non-interactive
   ```

3. Enable debugging to see event errors:
   ```php
   // In config.php
   $CFG->debug = DEBUG_DEVELOPER;
   $CFG->debugdisplay = 1;
   ```

---

## Upgrading

### From Source Control

```bash
cd /var/www/html/moodle/local/difficulty_prediction
git pull origin main
```

### Via Moodle Admin

1. Replace plugin files with new version
2. Navigate to **Site Administration → Notifications**
3. Click **"Upgrade Moodle database now"**

---

## Uninstallation

### Step 1: Disable Plugin

1. **Site Administration → Plugins → Local plugins**
2. Find "Difficulty Prediction"
3. Click **"Disable"**

### Step 2: Uninstall via Admin

1. **Site Administration → Plugins → Local plugins**
2. Click **"Uninstall"** next to Difficulty Prediction
3. Confirm uninstallation

### Step 3: Remove Files

```bash
rm -rf /var/www/html/moodle/local/difficulty_prediction
```

### Step 4: Clean Database (Optional)

If Moodle doesn't automatically remove tables:

```sql
DROP TABLE IF EXISTS mdl_question_difficulty;
DROP TABLE IF EXISTS mdl_question_performance;
DROP TABLE IF EXISTS mdl_difficulty_config;
```

---

## Initial Data Population

### Bulk Predict Existing Questions

After installation, you may want to generate predictions for all existing questions:

```php
// Run via admin CLI tool or scheduled task
require_once('config.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');

use local_difficulty_prediction\difficulty_predictor;

// Get all question IDs
$questions = $DB->get_records('question', null, '', 'id');

foreach ($questions as $question) {
    try {
        difficulty_predictor::predict($question->id);
        echo "Predicted difficulty for question {$question->id}\n";
    } catch (Exception $e) {
        echo "Error: {$e->getMessage()}\n";
    }
}
```

Or use the provided CLI script:

```bash
php local/difficulty_prediction/cli/bulk_predict.php --all
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Backup database
- [ ] Test on staging environment
- [ ] Verify scheduled tasks are configured
- [ ] Configure proper caching (Redis/Memcached recommended)
- [ ] Set up monitoring/alerts for prediction accuracy
- [ ] Document custom configuration
- [ ] Train staff on using difficulty analytics
- [ ] Disable debug mode in production
- [ ] Set appropriate cache TTL for load
- [ ] Configure database indexes for performance

---

## Support

If you encounter issues during installation:

1. Check the [Troubleshooting](#troubleshooting-installation) section above
2. Review Moodle logs at **Site Administration → Reports → Logs**
3. Enable debugging for detailed error messages
4. Contact support at support@kaist.ac.kr

---

**Installation complete! 🎉**

Next steps:
- Read the [User Guide](docs/user-guide.md)
- Review [API Documentation](docs/api-reference.md)
- Explore [Configuration Options](docs/configuration.md)
