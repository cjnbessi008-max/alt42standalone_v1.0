# Zone Breeze - Installation Guide
# 설치 가이드

## System Requirements / 시스템 요구사항

### Server Requirements
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Moodle**: 3.7
- **PHP Extensions**:
  - pdo_mysql
  - json
  - mbstring
  - curl

### Client Requirements
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Canvas support
- Minimum screen resolution: 1024x768

## Installation Steps / 설치 단계

### Step 1: Database Setup

#### 1.1 Create Database User
```bash
mysql -u root -p
```

```sql
CREATE USER 'zone_breeze_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON zone_breeze.* TO 'zone_breeze_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 1.2 Import Schema
```bash
mysql -u zone_breeze_user -p < database/schema.sql
```

#### 1.3 Verify Installation
```bash
mysql -u zone_breeze_user -p zone_breeze
```

```sql
SHOW TABLES;
SELECT * FROM app_settings;
```

### Step 2: Configuration

#### 2.1 Database Configuration
Edit `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'zone_breeze');
define('DB_USER', 'zone_breeze_user');
define('DB_PASS', 'your_secure_password');
```

#### 2.2 Moodle Configuration
Edit `config/moodle_config.php`:
```php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

#### 2.3 Get Moodle Web Service Token
1. Log in to Moodle as administrator
2. Navigate to **Site administration > Plugins > Web services > Manage tokens**
3. Create a new token for the Zone Breeze service
4. Copy the token and paste it into `moodle_config.php`

### Step 3: File Permissions

#### 3.1 Set Proper Permissions
```bash
# Make sure web server can read all files
chmod -R 755 zone-breeze/

# Backend files should be executable by PHP
chmod 644 zone-breeze/backend/*.php
chmod 644 zone-breeze/config/*.php

# Database directory should not be web-accessible
chmod 700 zone-breeze/database/
```

#### 3.2 Apache Configuration (if using Apache)
Create/edit `.htaccess` in the root directory:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Prevent direct access to sensitive files
    RewriteRule ^config/ - [F,L]
    RewriteRule ^database/ - [F,L]

    # API routing
    RewriteRule ^api/(.*)$ backend/api.php?action=$1 [QSA,L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

#### 3.3 Nginx Configuration (if using Nginx)
Add to your server block:
```nginx
location /zone-breeze {
    index index.html;
    try_files $uri $uri/ =404;
}

location /zone-breeze/api {
    rewrite ^/zone-breeze/api/(.*)$ /zone-breeze/backend/api.php?action=$1 last;
}

location ~ /zone-breeze/(config|database)/ {
    deny all;
    return 403;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

### Step 4: Deploy Files

#### 4.1 Copy Files to Web Server
```bash
# Copy to web server document root
sudo cp -r zone-breeze /var/www/html/

# Or create a symbolic link
sudo ln -s /path/to/zone-breeze /var/www/html/zone-breeze
```

#### 4.2 Verify Web Access
Open browser and navigate to:
```
http://your-server/zone-breeze/frontend/index.html?activity_id=1
```

### Step 5: Moodle Integration

#### 5.1 Install Zone Breeze Activity Module (Optional)
If you want to create a custom Moodle activity module:

1. Create directory: `moodle/mod/zone_breeze/`
2. Create module files (see Moodle documentation)
3. Install module via Moodle admin interface

#### 5.2 Use as External Tool (LTI)
Alternatively, use Zone Breeze as an external LTI tool:

1. In Moodle, go to **Site administration > Plugins > Activity modules > External tool**
2. Click "Manage tools"
3. Add new tool:
   - Tool Name: Zone Breeze
   - Tool URL: `https://your-server/zone-breeze/frontend/index.html`
   - Launch container: Embed without blocks
4. Save configuration

#### 5.3 Add to Course
1. Turn editing on in your Moodle course
2. Add activity > External tool
3. Select "Zone Breeze"
4. Configure activity settings
5. Save and display

### Step 6: Testing

#### 6.1 Test Database Connection
```bash
php backend/test_db.php
```

#### 6.2 Test API Endpoints
```bash
# Test health endpoint
curl http://your-server/zone-breeze/backend/api.php?action=health

# Test solve endpoint
curl -X POST http://your-server/zone-breeze/backend/api.php?action=solve \
  -H "Content-Type: application/json" \
  -d '{"inequalities": ["x + y <= 5", "x >= 0", "y >= 0"], "bounds": {"xMin": -1, "xMax": 6, "yMin": -1, "yMax": 6}}'
```

#### 6.3 Test Frontend
1. Open browser to: `http://your-server/zone-breeze/frontend/index.html?activity_id=1`
2. Verify that demo problem loads
3. Click "해 영역 표시" (Show Solution Region)
4. Verify visualization appears in smartphone screen
5. Test zoom controls
6. Test hover interactions

### Step 7: Insert Sample Problems

#### 7.1 Add Sample Problems to Database
```sql
USE zone_breeze;

INSERT INTO problems (
    moodle_activity_id,
    moodle_course_id,
    title,
    description,
    inequalities,
    visualization_bounds,
    difficulty_level,
    created_by
) VALUES (
    1,
    1,
    '기본 연립부등식 1',
    '두 개의 일차 부등식으로 이루어진 연립부등식의 해 영역을 구하세요.',
    '["x + y <= 8", "2x + y <= 12", "x >= 0", "y >= 0"]',
    '{"xMin": -2, "xMax": 10, "yMin": -2, "yMax": 10}',
    'easy',
    1
);
```

## Troubleshooting / 문제 해결

### Issue: Database Connection Failed
**Solution:**
- Check database credentials in `config/database.php`
- Verify MySQL service is running: `sudo systemctl status mysql`
- Check firewall settings: `sudo ufw allow 3306`

### Issue: Moodle Integration Not Working
**Solution:**
- Verify Moodle web service is enabled
- Check CORS settings in `config/moodle_config.php`
- Ensure Moodle allows external tools/LTI

### Issue: Blank Smartphone Screen
**Solution:**
- Check browser console for JavaScript errors
- Verify Canvas is supported: test at `https://html5test.com/`
- Check if API endpoints are accessible

### Issue: PHP Errors
**Solution:**
- Check PHP error log: `tail -f /var/log/apache2/error.log`
- Verify PHP extensions: `php -m | grep -E 'pdo|json|curl'`
- Check file permissions

### Issue: Visualization Not Rendering
**Solution:**
- Check browser console for errors
- Verify JavaScript files are loaded correctly
- Test with demo problem first
- Clear browser cache

## Security Checklist / 보안 체크리스트

- [ ] Change default database password
- [ ] Restrict database access to localhost only
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS properly
- [ ] Disable PHP error display in production
- [ ] Set proper file permissions
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Keep PHP and MySQL updated
- [ ] Review and secure Moodle integration

## Performance Optimization / 성능 최적화

### Enable MySQL Query Cache
```sql
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 67108864;  -- 64MB
```

### Enable PHP OpCache
Edit `php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### Enable Gzip Compression (Apache)
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

## Monitoring / 모니터링

### Enable MySQL Slow Query Log
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### Check Application Logs
```bash
tail -f /var/log/apache2/error.log
tail -f /var/log/mysql/error.log
```

## Support / 지원

For issues and support:
- GitHub Issues: https://github.com/your-org/zone-breeze/issues
- Documentation: See `docs/` directory
- Email: support@your-organization.com

## License / 라이선스

MIT License - See LICENSE file for details
