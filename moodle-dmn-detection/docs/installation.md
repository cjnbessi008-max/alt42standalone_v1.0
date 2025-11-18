# Installation Guide

DMN Dropout Detection System - Moodle LMS Integration

## Prerequisites

- **Moodle**: 3.7 or higher
- **MySQL**: 5.7
- **PHP**: 7.1.9 or higher (for Moodle)
- **Python**: 3.8 or higher
- **Web Server**: Apache or Nginx

## Step 1: Database Setup

### 1.1 Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE dmn_detection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dmn_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON dmn_detection.* TO 'dmn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.2 Import Schema

```bash
cd moodle-dmn-detection
mysql -u dmn_user -p dmn_detection < database/schema.sql
```

## Step 2: Backend Setup

### 2.1 Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

### 2.2 Configure Application

```bash
cd ../config
cp config.example.yml config.yml
nano config.yml  # Edit with your settings
```

Update the following:
- Database credentials
- Moodle URL and token
- API port (default: 5000)
- Detection thresholds (optional)

### 2.3 Test Database Connection

```bash
cd ../backend
python -c "from utils.db import DatabaseManager; from utils.config import Config; db = DatabaseManager(Config()); print('Database connected!')"
```

## Step 3: Moodle Configuration

### 3.1 Enable Web Services

1. Login to Moodle as administrator
2. Navigate to: **Site Administration** > **Advanced features**
3. Enable **Enable web services**
4. Save changes

### 3.2 Enable REST Protocol

1. Navigate to: **Site Administration** > **Plugins** > **Web services** > **Manage protocols**
2. Enable **REST protocol**

### 3.3 Create Web Service

1. Navigate to: **Site Administration** > **Plugins** > **Web services** > **External services**
2. Click **Add**
3. Enter:
   - Name: `DMN Dropout Detection`
   - Short name: `dmn_detection`
   - Enabled: Yes
4. Click **Add service**

### 3.4 Add Service Functions

Click on **Functions** and add the following:
- `core_enrol_get_enrolled_users`
- `core_enrol_get_users_courses`
- `core_course_get_contents`
- `core_user_get_users_by_field`
- `core_webservice_get_site_info`
- `core_message_send_instant_messages`

### 3.5 Create Web Service User

1. Create a new user for the web service (or use existing)
2. Navigate to: **Site Administration** > **Plugins** > **Web services** > **Manage tokens**
3. Click **Add**
4. Select:
   - User: (web service user)
   - Service: DMN Dropout Detection
5. Click **Save changes**
6. Copy the generated **token** - you'll need this for config.yml

### 3.6 Authorize User

1. Navigate to: **Site Administration** > **Plugins** > **Web services** > **External services**
2. Click on **Authorised users** for your service
3. Add the web service user

## Step 4: Frontend Integration

### 4.1 Add Tracking Script to Moodle Theme

There are two options:

#### Option A: Add to Theme Header

Edit your Moodle theme's header template (typically `theme/yourtheme/layout/header.php`):

```php
<!-- DMN Tracker -->
<script src="http://your-api-server:5000/static/tracker.js"></script>
<script>
<?php if (isloggedin() && !isguestuser()): ?>
  DMNTracker.init({
    apiEndpoint: 'http://your-api-server:5000/api',
    studentId: <?php echo $USER->id; ?>,
    courseId: <?php echo isset($COURSE->id) ? $COURSE->id : 0; ?>,
    activityId: <?php echo isset($cm->id) ? $cm->id : 0; ?>,
    debug: false
  });
<?php endif; ?>
</script>
```

#### Option B: Copy Script to Moodle

```bash
# Copy tracker.js to Moodle
cp frontend/tracker.js /path/to/moodle/local/dmn/tracker.js

# Add to theme footer
```

### 4.2 Configure CORS

Update `config.yml`:

```yaml
cors_origins:
  - https://your-moodle-site.com
```

## Step 5: Start Backend Server

### 5.1 Development Mode

```bash
cd backend
source venv/bin/activate
python api/app.py
```

The API will start on http://localhost:5000

### 5.2 Production Mode (using Gunicorn)

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

### 5.3 Production Mode (using systemd)

Create `/etc/systemd/system/dmn-detection.service`:

```ini
[Unit]
Description=DMN Dropout Detection API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/moodle-dmn-detection/backend
Environment="PATH=/path/to/moodle-dmn-detection/backend/venv/bin"
ExecStart=/path/to/moodle-dmn-detection/backend/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable dmn-detection
sudo systemctl start dmn-detection
sudo systemctl status dmn-detection
```

## Step 6: Verify Installation

### 6.1 Check API Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00",
  "version": "1.0.0"
}
```

### 6.2 Test Moodle Connection

```bash
cd backend
source venv/bin/activate
python -c "from moodle.client import MoodleClient; from utils.config import Config; client = MoodleClient(Config()); print(client.test_connection())"
```

### 6.3 Sync Data from Moodle

```bash
# Sync courses
curl -X POST "http://localhost:5000/api/moodle/sync/courses?teacherId=2"

# Sync students for a course
curl -X POST "http://localhost:5000/api/moodle/sync/students?courseId=3"
```

## Step 7: Configure Monitoring (Optional)

### 7.1 Setup Log Rotation

Create `/etc/logrotate.d/dmn-detection`:

```
/path/to/moodle-dmn-detection/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Troubleshooting

### Database Connection Failed

Check:
1. MySQL service is running: `sudo systemctl status mysql`
2. Database credentials in config.yml
3. Firewall allows MySQL port 3306

### Moodle API Connection Failed

Check:
1. Web services are enabled in Moodle
2. Token is valid and not expired
3. Service functions are added
4. User is authorized

### CORS Errors

Update Flask CORS configuration in `backend/api/app.py` or add Moodle domain to CORS whitelist.

### Tracker Not Loading

Check:
1. JavaScript console for errors
2. API endpoint is accessible from browser
3. User is logged in to Moodle

## Next Steps

- Configure alert notifications
- Customize detection thresholds
- Setup teacher dashboard
- Review detection accuracy

## Support

For issues and questions, please refer to:
- Documentation: `/docs`
- GitHub Issues: [project repository]
