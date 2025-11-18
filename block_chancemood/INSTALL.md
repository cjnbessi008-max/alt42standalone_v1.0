# Chance Mood Block - Installation Guide

## Quick Start Guide

This guide will help you install and configure the Chance Mood block in your Moodle 3.7+ installation.

## Prerequisites

Before installing, ensure your system meets these requirements:

- ✅ Moodle 3.7 or higher
- ✅ PHP 7.1.9 or higher
- ✅ MySQL 5.7 or higher (or MariaDB equivalent)
- ✅ Modern web browser with JavaScript enabled
- ✅ Administrator access to your Moodle site

## Installation Steps

### Step 1: Download the Plugin

**Option A: From GitHub (Recommended for latest version)**
```bash
cd /path/to/moodle/blocks/
git clone <repository-url> chancemood
```

**Option B: From ZIP file**
1. Download the latest release ZIP
2. Extract to a temporary location

### Step 2: Copy Files to Moodle

If you downloaded a ZIP file:

```bash
# Extract and copy to Moodle blocks directory
unzip block_chancemood.zip
cp -r block_chancemood /path/to/moodle/blocks/chancemood
```

Verify the directory structure:
```
/path/to/moodle/blocks/chancemood/
├── block_chancemood.php
├── version.php
├── settings.php
├── db/
├── lang/
├── js/
└── styles/
```

### Step 3: Set Proper Permissions

```bash
cd /path/to/moodle/blocks/chancemood
chmod -R 755 .
chown -R www-data:www-data .  # Or your web server user
```

### Step 4: Trigger Moodle Installation

1. Login to Moodle as **Administrator**
2. Moodle will automatically detect the new plugin
3. Navigate to: **Site administration** → **Notifications**
4. You'll see "Chance Mood (block_chancemood)" in the plugin list
5. Click **Upgrade Moodle database now**
6. Review the installation details
7. Click **Continue**

### Step 5: Verify Installation

1. Go to: **Site administration** → **Plugins** → **Blocks** → **Manage blocks**
2. Find "Chance Mood" in the list
3. Verify it shows as "Enabled"
4. Note the version number (should match version.php)

## Configuration

### Global Settings

1. Navigate to: **Site administration** → **Plugins** → **Blocks** → **Chance Mood**
2. Configure:

   ```
   Enable Chance Mood: ✓ Yes
   Display Position: Bottom Right
   Auto-refresh Interval: 5 (minutes)
   Use Sample Data: ✓ Yes (for testing)
   ```

3. Click **Save changes**

### Adding to a Course

**As a Teacher:**

1. Navigate to your course
2. Click **Turn editing on**
3. In the block drawer, find **Add a block**
4. Select **Chance Mood**
5. The virtual smartphone will appear at the configured position

**For Testing:**

With "Use Sample Data" enabled, the block will show demo probability problems even if your course doesn't have real quizzes yet.

## Post-Installation Testing

### Test 1: Basic Display

1. Add the block to a test course
2. Verify the smartphone display appears
3. Check that sample data is shown
4. Verify emotional colors are displayed correctly

### Test 2: Interactivity

1. Click and drag the smartphone - it should move
2. Click the toggle button (📊) - display should hide
3. Click again (✕) - display should reappear
4. Hover over chart bars - they should highlight

### Test 3: Real Data (Optional)

1. Create a quiz in your course
2. Add questions with these keywords:
   - 확률, 경우의 수, 조합, 순열 (Korean)
   - probability, chance, combination, permutation (English)
3. Have students attempt the quiz
4. Disable "Use Sample Data" in settings
5. Refresh the course - real mood data should appear

## Troubleshooting

### Plugin doesn't appear in Notifications

**Problem**: After copying files, Moodle doesn't detect the plugin

**Solutions**:
```bash
# Clear Moodle cache
php admin/cli/purge_caches.php

# Or via web interface:
# Site administration → Development → Purge all caches
```

### Database installation fails

**Problem**: Error during database upgrade

**Solutions**:
1. Check MySQL version: `mysql --version` (should be 5.7+)
2. Verify database user has CREATE TABLE permissions
3. Check Moodle error logs: `moodledata/error_log`
4. Try manual installation:
   ```sql
   -- No tables required for this plugin
   -- Just verify plugin is registered:
   SELECT * FROM mdl_config_plugins WHERE plugin = 'block_chancemood';
   ```

### Block appears but smartphone doesn't show

**Problem**: Block is added but display is invisible

**Solutions**:
1. Check browser console for JavaScript errors (F12)
2. Verify CSS is loading: look for `/blocks/chancemood/styles/chancemood.css`
3. Check browser compatibility (requires modern browser)
4. Try disabling browser extensions
5. Clear browser cache and reload

### "No problems found" message

**Problem**: Block shows but says no problems detected

**Solutions**:
1. Enable "Use Sample Data" in settings (for testing)
2. If using real data:
   - Verify course has quizzes
   - Check question names/content for keywords
   - Run this SQL to check:
     ```sql
     SELECT q.id, q.name, q.questiontext
     FROM mdl_question q
     JOIN mdl_quiz_slots qs ON qs.questionid = q.id
     JOIN mdl_quiz qz ON qz.id = qs.quizid
     WHERE qz.course = ?
     AND (q.questiontext LIKE '%확률%'
          OR q.questiontext LIKE '%probability%');
     ```

### Permission errors

**Problem**: Students/teachers can't see the block

**Solutions**:
1. Check capabilities:
   - Site administration → Users → Permissions → Define roles
   - Verify 'block/chancemood:viewmood' is assigned
2. Reset role capabilities:
   - Site administration → Users → Permissions → Capability overview
   - Search for "chancemood"
3. Assign capability manually if needed

## Uninstallation

If you need to remove the plugin:

### Via Web Interface

1. Site administration → Plugins → Blocks → Manage blocks
2. Find "Chance Mood"
3. Click **Uninstall**
4. Confirm the action
5. Delete the directory: `rm -rf /path/to/moodle/blocks/chancemood`

### Manual Uninstallation

```bash
# Remove files
rm -rf /path/to/moodle/blocks/chancemood

# Clean database
mysql -u moodle_user -p moodle_db << EOF
DELETE FROM mdl_block_instances WHERE blockname = 'chancemood';
DELETE FROM mdl_config_plugins WHERE plugin = 'block_chancemood';
DELETE FROM mdl_capabilities WHERE component = 'block_chancemood';
EOF

# Purge caches
php admin/cli/purge_caches.php
```

## Upgrade Instructions

To upgrade to a newer version:

### Method 1: Git Pull (if installed via Git)

```bash
cd /path/to/moodle/blocks/chancemood
git pull origin main
```

### Method 2: Replace Files

1. Backup current version:
   ```bash
   cp -r /path/to/moodle/blocks/chancemood /path/to/backup/chancemood-backup
   ```

2. Download new version and extract

3. Replace files:
   ```bash
   rm -rf /path/to/moodle/blocks/chancemood
   cp -r new-version/block_chancemood /path/to/moodle/blocks/chancemood
   ```

4. Login as admin → Site administration → Notifications

5. Click "Upgrade Moodle database now"

## System Integration

### For LMS Integration (MySQL 5.7, PHP 7.1.9)

The plugin is designed to work with:
- **MySQL 5.7** - Uses compatible SQL syntax
- **PHP 7.1.9** - No PHP 7.2+ specific features
- **Moodle 3.7** - Compatible with Moodle 3.7+ APIs

No additional configuration needed for these versions.

### For Developers

Enable debugging for development:

```php
// In config.php
$CFG->debug = (E_ALL | E_STRICT);
$CFG->debugdisplay = 1;
$CFG->debugstringids = 1;  // Show string IDs
$CFG->perfdebug = 15;       // Show performance info
```

## Support

Need help? Check these resources:

- 📖 **README.md** - Full documentation
- 🐛 **GitHub Issues** - Bug reports
- 📧 **Email Support** - support@example.com
- 💬 **Moodle Forums** - community support

## Next Steps

After successful installation:

1. ✅ Configure global settings
2. ✅ Add block to test course
3. ✅ Test with sample data
4. ✅ Create real probability quizzes
5. ✅ Monitor student mood analytics
6. ✅ Share feedback with developers!

---

**Installation Date**: _______________
**Installed Version**: _______________
**Moodle Version**: _______________
**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________
