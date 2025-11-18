# Stress Detection & Reset System

독립형 웹앱으로 Moodle LMS와 연동하여 학습자의 긴장/과몰입을 감지하고 부드러운 광효과로 리셋을 유도하는 시스템입니다.

A standalone web application that integrates with Moodle LMS to detect stress/over-engagement and provides gentle light effect resets.

## 🌟 Features

- **스트레스 감지 / Stress Detection**
  - 학습 시간 추적 (45분 기준)
  - 클릭/타이핑 패턴 분석
  - 실시간 스트레스 점수 계산 (0-100)

- **리셋 광효과 / Reset Light Effect**
  - 부드러운 블루→그린→화이트 그라데이션
  - 10초 지속 애니메이션
  - 선택적 사운드 효과
  - 휴식 메시지 표시

- **Moodle 통합 / Moodle Integration**
  - Moodle 3.7 REST API 연동
  - 사용자 세션 추적
  - 학습 활동 기록

- **대시보드 / Dashboard**
  - 실시간 통계 표시
  - 활동 로그
  - 사용자별 설정

## 📋 Requirements

- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache/Nginx
- **Moodle**: 3.7 (with web services enabled)
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone Repository

```bash
cd /var/www/html
git clone <repository-url> stress-reset-app
cd stress-reset-app
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update the following variables:
```env
DB_HOST=localhost
DB_NAME=stress_reset_db
DB_USER=your_db_user
DB_PASS=your_db_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 3. Create Database

```bash
mysql -u root -p < database/schema.sql
```

Or manually:
```bash
mysql -u root -p
CREATE DATABASE stress_reset_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

mysql -u root -p stress_reset_db < database/schema.sql
```

### 4. Set Permissions

```bash
chmod -R 755 public/
chmod -R 755 config/
chown -R www-data:www-data .
```

### 5. Configure Web Server

#### Apache (.htaccess in public/)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1 [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/stress-reset-app/public;

    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        try_files $uri $uri/ /api/$1;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 6. Enable Moodle Web Services

1. Go to **Site Administration** → **Plugins** → **Web services** → **Overview**
2. Enable web services
3. Create a new service or use existing
4. Add required functions:
   - `core_user_get_users_by_field`
   - `core_enrol_get_users_courses`
   - `core_course_get_courses`
   - `core_course_get_recent_courses`
5. Create a token for your user
6. Copy the token to `.env` file

## 📖 Usage

### Starting the Application

1. Open `http://your-domain.com` in browser
2. Enter your **Moodle User ID**
3. (Optional) Enter **Moodle Course ID**
4. Click **"모니터링 시작 / Start Monitoring"**

### System Behavior

- System tracks user activity (clicks, keypress, scrolling)
- Every 1 minute, stress level is checked
- If stress score exceeds 70/100, reset effect is triggered
- Light effect plays for 10 seconds with calming gradient
- Cooldown period: 15 minutes between resets

### Testing

- **Test Light Effect**: Click to preview the light effect animation
- **Check Stress**: Manually trigger stress level check (requires active session)

## ⚙️ Configuration

### Stress Detection Settings

Edit `config/stress_detection.php`:

```php
return [
    'time_threshold_minutes' => 45,      // Trigger after 45 minutes
    'click_rate_threshold' => 60,        // Clicks per minute
    'typing_speed_threshold' => 120,     // Characters per minute
    'stress_score_threshold' => 70,      // 0-100 scale
    'reset_cooldown_minutes' => 15,      // Cooldown between resets
];
```

### Light Effect Settings

Edit `config/light_effect.php`:

```php
return [
    'duration_seconds' => 10,
    'color_sequence' => [
        ['r' => 100, 'g' => 150, 'b' => 255],  // Blue
        ['r' => 120, 'g' => 220, 'b' => 180],  // Green
        ['r' => 255, 'g' => 255, 'b' => 255],  // White
    ],
    'show_message' => true,
    'message_text' => '잠시 휴식하세요 / Take a brief break',
    'play_sound' => true,
];
```

## 🔌 API Endpoints

### Session Management

```http
POST   /api/session.php          # Start new session
GET    /api/session.php?moodle_user_id={id}
GET    /api/session.php?session_id={id}
PUT    /api/session.php          # Update heartbeat
DELETE /api/session.php?session_id={id}
```

### Activity Tracking

```http
POST   /api/activity.php         # Record activity
```

### Stress Detection

```http
GET    /api/stress.php?session_id={id}    # Check stress & trigger
POST   /api/stress.php                     # Calculate score only
```

### Reset Events

```http
GET    /api/reset.php?session_id={id}     # Get reset history
GET    /api/reset.php?user_id={id}        # Get reset stats
POST   /api/reset.php                      # Get effect config
PUT    /api/reset.php                      # Acknowledge reset
```

## 📊 Database Schema

### Main Tables

- **users**: Synced from Moodle
- **learning_sessions**: Active study sessions
- **activity_tracking**: Click, keypress, scroll events
- **stress_scores**: Calculated stress levels
- **reset_events**: Triggered reset effects
- **user_settings**: Per-user customization
- **system_logs**: System events and errors

## 🛠️ Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u your_user -p stress_reset_db
```

### Moodle Connection Failed

1. Verify web services are enabled in Moodle
2. Check token is valid
3. Ensure required functions are added to service
4. Test connection: `/api/test-moodle.php`

### Light Effect Not Showing

1. Check browser console for JavaScript errors
2. Verify files are loaded: `/js/LightEffect.js`
3. Disable browser ad-blockers
4. Check z-index conflicts with other elements

## 📝 Development

### Directory Structure

```
stress-reset-app/
├── config/                 # Configuration files
├── database/              # SQL schema
├── src/                   # PHP backend classes
│   ├── Database.php
│   ├── MoodleClient.php
│   ├── StressDetector.php
│   ├── SessionManager.php
│   └── ResetManager.php
├── public/                # Frontend files
│   ├── api/              # API endpoints
│   ├── css/
│   ├── js/
│   └── index.html
└── vendor/               # Autoloader
```

### Adding Custom Features

1. Backend: Add new classes in `src/`
2. API: Create endpoints in `public/api/`
3. Frontend: Extend `StressMonitor` or `LightEffect` classes

## 🔒 Security

- All database queries use prepared statements
- CORS headers configured
- Input validation on all endpoints
- Session management with timeout
- SQL injection prevention
- XSS protection

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

## 🙏 Credits

- Built for Moodle 3.7 compatibility
- Designed for educational wellness
- Inspired by stress management research
