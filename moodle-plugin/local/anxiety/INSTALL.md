# Installation Guide for Anxiety Detection System
# 불안 감지 시스템 설치 가이드

## Prerequisites / 사전 요구사항

- ✅ Moodle 3.7 or higher
- ✅ PHP 7.1.9 or higher
- ✅ MySQL 5.7 or higher
- ✅ Administrator access to Moodle
- ✅ SSH or FTP access to server

---

## Quick Start (5 Minutes) / 빠른 시작 (5분)

### Step 1: Upload Files / 1단계: 파일 업로드

```bash
# SSH into your server
ssh user@yourserver.com

# Navigate to Moodle directory
cd /var/www/html/moodle

# Create plugin directory
mkdir -p local/anxiety

# Upload plugin files to local/anxiety/
# (Use SCP, FTP, or Git)

# If using Git:
cd local
git clone <repository-url> anxiety
```

### Step 2: Set Permissions / 2단계: 권한 설정

```bash
# Set ownership (adjust user/group as needed)
sudo chown -R www-data:www-data local/anxiety

# Set permissions
sudo chmod -R 755 local/anxiety

# Ensure files are readable
sudo chmod 644 local/anxiety/version.php
```

### Step 3: Install via Moodle / 3단계: 무들을 통한 설치

1. **Log in as Administrator** / 관리자로 로그인
   - Go to your Moodle site: `https://yourmoodle.com`
   - Log in with administrator credentials

2. **Trigger Installation** / 설치 트리거
   - Navigate to: **Site administration → Notifications**
   - You will see: "Plugins requiring attention"
   - Click: **"Upgrade Moodle database now"**

3. **Confirm Installation** / 설치 확인
   - Review the plugin details:
     - Name: Anxiety Detection System
     - Version: 1.0.0
     - Type: Local plugin
   - Click: **"Upgrade now"** / **"지금 업그레이드"**
   - Wait for installation to complete (30-60 seconds)

4. **Installation Success** / 설치 성공
   - You should see: "Success" / "성공"
   - Click: **"Continue"** / **"계속"**

### Step 4: Configure Settings / 4단계: 설정 구성

1. **Navigate to Plugin Settings** / 플러그인 설정으로 이동
   ```
   Site administration → Plugins → Local plugins → Anxiety Detection System
   사이트 관리 → 플러그인 → 로컬 플러그인 → 불안 감지 시스템
   ```

2. **Configure Thresholds** / 임계값 구성
   - Mild Threshold: `30` (recommended: 25-35)
   - Moderate Threshold: `50` (recommended: 45-55)
   - Severe Threshold: `70` (recommended: 65-75)

3. **Enable Alerts** / 알림 활성화
   - ✅ Enable Alerts: Checked
   - Alert Frequency: `300` seconds (5 minutes)

4. **Save Changes** / 변경 사항 저장
   - Click: **"Save changes"** / **"변경 사항 저장"**

### Step 5: Assign Capabilities / 5단계: 권한 할당

1. **Edit Student Role** / 학생 역할 편집
   ```
   Site administration → Users → Permissions → Define roles → Student → Edit
   ```
   - Find: `local/anxiety:view`
   - Set to: ✅ **Allow**
   - Save changes

2. **Edit Teacher Role** / 교사 역할 편집
   ```
   Site administration → Users → Permissions → Define roles → Teacher → Edit
   ```
   - Find and Allow:
     - ✅ `local/anxiety:view`
     - ✅ `local/anxiety:viewothers`
     - ✅ `local/anxiety:receivealerts`
   - Save changes

3. **Edit Manager Role** / 관리자 역할 편집 (Optional)
   ```
   Site administration → Users → Permissions → Define roles → Manager → Edit
   ```
   - Allow all anxiety capabilities:
     - ✅ `local/anxiety:view`
     - ✅ `local/anxiety:viewothers`
     - ✅ `local/anxiety:manage`
     - ✅ `local/anxiety:receivealerts`
   - Save changes

### Step 6: Test Installation / 6단계: 설치 테스트

1. **Create Test Course** / 테스트 코스 생성
   - Create a new course or use an existing one
   - Enroll yourself as both student and teacher

2. **Test as Student** / 학생으로 테스트
   - Access the course
   - Navigate to: **"Anxiety Dashboard"** in course navigation
   - Open browser console (F12) - you should see:
     ```
     Anxiety tracker initialized for user X in course Y
     ```
   - Click around, open pages
   - Wait 1-2 minutes for data to accumulate

3. **Test as Teacher** / 교사로 테스트
   - Access the same course
   - Navigate to: **"Anxiety Dashboard"**
   - You should see:
     - Recent alerts (if any)
     - Student overview table
     - Anxiety distribution chart

4. **Verify Database** / 데이터베이스 확인
   ```sql
   -- Check if tables were created
   SHOW TABLES LIKE 'mdl_local_anxiety%';

   -- Should show:
   -- mdl_local_anxiety_metrics
   -- mdl_local_anxiety_sessions
   -- mdl_local_anxiety_alerts
   -- mdl_local_anxiety_config

   -- Check for data
   SELECT COUNT(*) FROM mdl_local_anxiety_metrics;
   ```

---

## Advanced Installation / 고급 설치

### Manual Database Installation / 수동 데이터베이스 설치

If automatic installation fails, you can manually create tables:

```sql
-- Connect to your Moodle database
mysql -u moodle_user -p moodle_db

-- Run the installation script
SOURCE /path/to/moodle/local/anxiety/db/install_manual.sql;

-- Verify tables
SHOW TABLES LIKE 'mdl_local_anxiety%';
```

Create `db/install_manual.sql`:

```sql
-- Anxiety Metrics Table
CREATE TABLE IF NOT EXISTS mdl_local_anxiety_metrics (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,
  cmid BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  response_time INT(11) NOT NULL DEFAULT 0,
  click_count INT(11) NOT NULL DEFAULT 0,
  error_count INT(11) NOT NULL DEFAULT 0,
  time_on_task INT(11) NOT NULL DEFAULT 0,
  navigation_back_count INT(11) NOT NULL DEFAULT 0,
  anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  anxiety_level VARCHAR(20) NOT NULL DEFAULT 'normal',
  timecreated BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_timecreated (timecreated),
  KEY idx_anxiety_level (anxiety_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Real-time anxiety metrics per student';

-- Anxiety Sessions Table
CREATE TABLE IF NOT EXISTS mdl_local_anxiety_sessions (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,
  session_start BIGINT(10) UNSIGNED NOT NULL,
  session_end BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  session_duration INT(11) NOT NULL DEFAULT 0,
  avg_response_time DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_clicks INT(11) NOT NULL DEFAULT 0,
  total_errors INT(11) NOT NULL DEFAULT 0,
  avg_anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  max_anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  anxiety_peaks INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety session aggregates';

-- Anxiety Alerts Table
CREATE TABLE IF NOT EXISTS mdl_local_anxiety_alerts (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,
  alert_type VARCHAR(20) NOT NULL,
  anxiety_score DECIMAL(5,2) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  acknowledged_by BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  acknowledged_at BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  timecreated BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_is_read (is_read),
  KEY idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety alert notifications';

-- Anxiety Config Table
CREATE TABLE IF NOT EXISTS mdl_local_anxiety_config (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  courseid BIGINT(10) UNSIGNED NOT NULL DEFAULT 0,
  mild_threshold DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  moderate_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  severe_threshold DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  enable_alerts TINYINT(1) NOT NULL DEFAULT 1,
  alert_frequency INT(11) NOT NULL DEFAULT 300,
  weight_response_time DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  weight_error_rate DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  weight_click_frequency DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  weight_time_on_task DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  weight_navigation DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  weight_session_duration DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  timemodified BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety detection configuration';

-- Insert default site-wide configuration
INSERT INTO mdl_local_anxiety_config (courseid, mild_threshold, moderate_threshold, severe_threshold, enable_alerts, alert_frequency, timemodified)
VALUES (0, 30.00, 50.00, 70.00, 1, 300, UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE timemodified = UNIX_TIMESTAMP();
```

### JavaScript Module Compilation / JavaScript 모듈 컴파일

If using AMD modules (Moodle 3.7+), compile JavaScript:

```bash
# Navigate to Moodle directory
cd /var/www/html/moodle

# Run Grunt to compile AMD modules (if Grunt is set up)
grunt amd

# Or use Moodle's CLI tool
php admin/cli/purge_caches.php

# Alternatively, enable JavaScript development mode
# Edit config.php:
$CFG->cachejs = false;
```

---

## Troubleshooting Installation / 설치 문제 해결

### Problem: "Plugin not detected"

**Symptoms:**
- Plugin doesn't appear in Notifications page
- No installation prompt

**Solutions:**
1. Check file location:
   ```bash
   ls -la /var/www/html/moodle/local/anxiety/version.php
   # Should exist and be readable
   ```

2. Verify ownership:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/moodle/local/anxiety
   ```

3. Clear Moodle caches:
   ```bash
   php admin/cli/purge_caches.php
   ```

4. Check Moodle logs:
   ```
   Site administration → Reports → Logs
   ```

### Problem: "Database error during installation"

**Symptoms:**
- Installation stops with database error
- Error mentions table creation failure

**Solutions:**
1. Check MySQL version:
   ```sql
   SELECT VERSION();
   -- Should be 5.7 or higher
   ```

2. Check database user permissions:
   ```sql
   SHOW GRANTS FOR 'moodle_user'@'localhost';
   -- Should have CREATE, ALTER, INDEX privileges
   ```

3. Manually create tables (see "Manual Database Installation" above)

4. Check Moodle database prefix:
   ```php
   // In config.php
   echo $CFG->prefix; // Usually 'mdl_'
   ```

### Problem: "JavaScript not loading"

**Symptoms:**
- Tracker doesn't initialize
- Console shows 404 errors for JS files

**Solutions:**
1. Verify AMD files exist:
   ```bash
   ls -la local/anxiety/amd/src/tracker.js
   ls -la local/anxiety/amd/src/dashboard.js
   ```

2. Purge all caches:
   ```
   Site administration → Development → Purge all caches
   ```

3. Check JavaScript debugging:
   ```
   Site administration → Development → Debugging
   Set: Debug messages = DEVELOPER
   ```

4. Check browser console (F12) for specific errors

### Problem: "Capabilities not showing"

**Symptoms:**
- Cannot find anxiety capabilities in role editor
- Permission errors when accessing dashboard

**Solutions:**
1. Verify access.php exists and is correct:
   ```bash
   cat local/anxiety/db/access.php
   ```

2. Upgrade database:
   ```bash
   php admin/cli/upgrade.php
   ```

3. Reset role definitions:
   ```
   Site administration → Users → Permissions → Define roles
   Click "Reset" on affected roles
   ```

---

## Post-Installation Configuration / 설치 후 구성

### Configure Scheduled Tasks / 예약된 작업 구성

1. **Access Scheduled Tasks** / 예약된 작업 접근
   ```
   Site administration → Server → Scheduled tasks
   ```

2. **Find Anxiety Cleanup Task** / 불안 정리 작업 찾기
   - Search for: "cleanup_old_data"
   - Default schedule: Sunday at 2:00 AM
   - Can be adjusted if needed

3. **Enable Cron** / Cron 활성화 (if not already)
   ```bash
   # Add to crontab
   crontab -e

   # Add line (runs every 5 minutes):
   */5 * * * * /usr/bin/php /var/www/html/moodle/admin/cli/cron.php
   ```

### Configure Messaging / 메시징 구성

1. **Enable Message Outputs** / 메시지 출력 활성화
   ```
   Site administration → Plugins → Message outputs
   ```
   - Enable: ✅ Email
   - Enable: ✅ Popup notification

2. **Configure Anxiety Alerts** / 불안 알림 구성
   ```
   Site administration → Plugins → Message outputs → Notification settings
   ```
   - Find: "Anxiety alert" (local_anxiety)
   - Set preferences for:
     - Popup notification: Logged in + Logged off
     - Email: Logged off (optional)

3. **Test Notifications** / 알림 테스트
   - Trigger high anxiety as a student
   - Check teacher receives notification

### Backup and Recovery / 백업 및 복구

1. **Include in Moodle Backup** / 무들 백업에 포함
   - Anxiety data is automatically included in course backups
   - To backup only anxiety data:
     ```bash
     mysqldump -u moodle_user -p moodle_db \
       mdl_local_anxiety_metrics \
       mdl_local_anxiety_sessions \
       mdl_local_anxiety_alerts \
       mdl_local_anxiety_config \
       > anxiety_backup_$(date +%Y%m%d).sql
     ```

2. **Restore from Backup** / 백업에서 복원
   ```bash
   mysql -u moodle_user -p moodle_db < anxiety_backup_20251118.sql
   ```

---

## Uninstallation / 제거

### Via Moodle Interface / 무들 인터페이스를 통해

1. Navigate to: Site administration → Plugins → Plugins overview
2. Find: "Anxiety Detection System"
3. Click: **"Uninstall"**
4. Confirm: This will delete all anxiety data permanently
5. Wait for completion

### Manual Uninstallation / 수동 제거

```bash
# 1. Remove plugin files
sudo rm -rf /var/www/html/moodle/local/anxiety

# 2. Drop database tables
mysql -u moodle_user -p moodle_db <<EOF
DROP TABLE IF EXISTS mdl_local_anxiety_metrics;
DROP TABLE IF EXISTS mdl_local_anxiety_sessions;
DROP TABLE IF EXISTS mdl_local_anxiety_alerts;
DROP TABLE IF EXISTS mdl_local_anxiety_config;
EOF

# 3. Clear Moodle caches
php admin/cli/purge_caches.php

# 4. (Optional) Remove capabilities from roles
# Site administration → Users → Permissions → Define roles
# Manually remove anxiety capabilities from each role
```

---

## Support / 지원

If you encounter issues during installation:

1. **Check logs:**
   - Moodle: Site administration → Reports → Logs
   - Apache/Nginx: `/var/log/apache2/error.log` or `/var/log/nginx/error.log`
   - PHP: `/var/log/php-fpm/error.log`

2. **Enable debugging:**
   ```php
   // Add to config.php temporarily
   $CFG->debug = 32767;
   $CFG->debugdisplay = 1;
   ```

3. **Contact support:**
   - Email: support@example.com
   - GitHub Issues: [Repository URL]

---

## Next Steps / 다음 단계

After successful installation:

1. ✅ Read the main README.md for usage instructions
2. ✅ Review architecture document: `docs/anxiety-detection-architecture.md`
3. ✅ Configure thresholds for your institution
4. ✅ Train teachers on using the dashboard
5. ✅ Inform students about the system (transparency)
6. ✅ Monitor system performance and adjust settings

---

**Estimated Installation Time:** 5-10 minutes for standard installation, 15-30 minutes for advanced setup.

**Difficulty Level:** Intermediate (requires basic Linux/MySQL knowledge)

**Support:** For detailed troubleshooting, see README.md or contact support.
