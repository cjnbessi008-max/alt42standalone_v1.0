# Installation Guide

## Quick Start (5 minutes)

### Prerequisites Check

```bash
# PHP version (must be >= 7.1.9)
php -v

# MySQL version (must be >= 5.7)
mysql --version

# Check required PHP extensions
php -m | grep -E "pdo|json|curl"
```

### Step-by-Step Installation

#### 1. Download & Extract

```bash
cd /var/www/html
git clone <repository-url> stress-reset-app
cd stress-reset-app
```

#### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Settings:**
```env
# Database
DB_HOST=localhost
DB_NAME=stress_reset_db
DB_USER=your_username
DB_PASS=your_password

# Moodle
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token
```

#### 3. Database Creation

**Option A: Automatic**
```bash
mysql -u root -p < database/schema.sql
```

**Option B: Manual**
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE stress_reset_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional)
CREATE USER 'stress_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON stress_reset_db.* TO 'stress_user'@'localhost';
FLUSH PRIVILEGES;

# Exit and import schema
exit;
mysql -u root -p stress_reset_db < database/schema.sql
```

#### 4. File Permissions

```bash
# Set ownership (adjust user/group for your server)
sudo chown -R www-data:www-data /var/www/html/stress-reset-app

# Set permissions
sudo chmod -R 755 /var/www/html/stress-reset-app
sudo chmod -R 775 /var/www/html/stress-reset-app/config
```

#### 5. Web Server Configuration

**For Apache:**

Create `/etc/apache2/sites-available/stress-reset.conf`:

```apache
<VirtualHost *:80>
    ServerName stress-reset.local
    DocumentRoot /var/www/html/stress-reset-app/public

    <Directory /var/www/html/stress-reset-app/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/stress-reset-error.log
    CustomLog ${APACHE_LOG_DIR}/stress-reset-access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite stress-reset.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**For Nginx:**

Create `/etc/nginx/sites-available/stress-reset`:

```nginx
server {
    listen 80;
    server_name stress-reset.local;

    root /var/www/html/stress-reset-app/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/stress-reset /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Moodle Configuration

1. **Enable Web Services**
   - Go to: Site Administration → Advanced features
   - Check "Enable web services"
   - Save changes

2. **Create External Service**
   - Go to: Site Administration → Server → Web services → External services
   - Click "Add"
   - Name: "Stress Reset System"
   - Enabled: Yes
   - Authorized users only: No (or add specific users)

3. **Add Functions to Service**
   - Click "Add functions"
   - Add these functions:
     - `core_user_get_users_by_field`
     - `core_enrol_get_users_courses`
     - `core_course_get_courses`
     - `core_course_get_recent_courses`

4. **Create Token**
   - Go to: Site Administration → Server → Web services → Manage tokens
   - Click "Add"
   - User: Select admin or service account
   - Service: "Stress Reset System"
   - Save and copy the token

5. **Update .env File**
   ```bash
   nano .env
   # Paste token into MOODLE_TOKEN=
   ```

#### 7. Verification

```bash
# Test database connection
mysql -u stress_user -p stress_reset_db -e "SHOW TABLES;"

# Expected output:
# +----------------------------+
# | Tables_in_stress_reset_db  |
# +----------------------------+
# | activity_tracking          |
# | analytics_summary          |
# | learning_sessions          |
# | reset_events              |
# | stress_scores             |
# | system_logs               |
# | user_settings             |
# | users                     |
# +----------------------------+
```

Test web server:
```bash
# Apache
curl http://localhost/index.html

# Check if API is accessible
curl http://localhost/api/reset.php
```

#### 8. First Run

1. Open browser: `http://your-domain.com`
2. You should see the main interface
3. Click "광효과 테스트 / Test Light Effect" to verify frontend works
4. Enter a Moodle User ID and click "모니터링 시작"

## Common Issues

### Issue: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test credentials
mysql -u stress_user -p stress_reset_db

# Verify .env settings
cat .env | grep DB_
```

### Issue: "Moodle API error"

**Solutions:**
1. Check web services enabled in Moodle
2. Verify token is correct
3. Check Moodle URL (no trailing slash)
4. Ensure functions are added to service
5. Test with curl:
```bash
curl "http://your-moodle.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

### Issue: "404 Not Found on API calls"

**Solutions:**
1. Check .htaccess exists in public/
2. Verify mod_rewrite enabled (Apache)
3. Check Nginx configuration
4. Verify file permissions

### Issue: "Light effect not showing"

**Solutions:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify files loaded:
   - `/js/LightEffect.js`
   - `/js/StressMonitor.js`
   - `/js/app.js`
4. Disable ad-blockers
5. Try different browser

## Performance Tuning

### MySQL Optimization

```sql
-- Add indexes for better performance
USE stress_reset_db;

-- Already created in schema, but verify:
SHOW INDEX FROM activity_tracking;
SHOW INDEX FROM stress_scores;
```

### PHP Configuration

Edit `php.ini`:
```ini
max_execution_time = 60
memory_limit = 256M
upload_max_filesize = 10M
post_max_size = 10M
```

Restart PHP-FPM:
```bash
sudo systemctl restart php7.1-fpm
```

### Caching (Optional)

Install APCu for PHP opcode caching:
```bash
sudo apt-get install php7.1-apcu
sudo systemctl restart apache2  # or nginx + php-fpm
```

## Security Checklist

- [ ] Changed default database password
- [ ] Set proper file permissions (755/644)
- [ ] Enabled HTTPS (recommended)
- [ ] Configured firewall (allow 80/443)
- [ ] Regular database backups configured
- [ ] Moodle token kept secret
- [ ] PHP display_errors = Off in production
- [ ] Updated .htaccess security headers

## Backup & Maintenance

### Database Backup

```bash
# Daily backup script
mysqldump -u stress_user -p stress_reset_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u stress_user -p stress_reset_db < backup_20250101.sql
```

### Log Rotation

Create `/etc/logrotate.d/stress-reset`:
```
/var/log/apache2/stress-reset-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        systemctl reload apache2 > /dev/null
    endscript
}
```

## Uninstallation

```bash
# Remove database
mysql -u root -p -e "DROP DATABASE stress_reset_db;"

# Remove files
sudo rm -rf /var/www/html/stress-reset-app

# Remove Apache config
sudo a2dissite stress-reset.conf
sudo rm /etc/apache2/sites-available/stress-reset.conf

# Or Nginx config
sudo rm /etc/nginx/sites-enabled/stress-reset
sudo rm /etc/nginx/sites-available/stress-reset

# Restart web server
sudo systemctl restart apache2  # or nginx
```

## Support

If you encounter issues not covered here:
1. Check the main README.md
2. Review error logs: `/var/log/apache2/` or `/var/log/nginx/`
3. Enable debug mode in `.env`: `APP_DEBUG=true`
4. Contact support or create GitHub issue
