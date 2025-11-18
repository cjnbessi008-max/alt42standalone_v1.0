# Power Candle - Deployment Guide

## Prerequisites

Before deploying Power Candle, ensure you have:

- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP**: 7.1.9 (to match Moodle 3.7 compatibility)
- **MySQL**: 5.7+
- **Node.js**: 16+ (for building frontend)
- **Moodle**: 3.7+ instance with Web Services enabled

## Step-by-Step Deployment

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE power_candle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional)
CREATE USER 'power_candle'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON power_candle.* TO 'power_candle'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u power_candle -p power_candle < database/schema.sql
```

### 2. Backend Configuration

```bash
# Navigate to backend directory
cd backend

# Copy and configure
cp config/config.example.php config/config.php

# Edit config.php with your credentials
nano config/config.php
```

**Important configuration values:**

```php
'database' => [
    'host' => 'localhost',
    'database' => 'power_candle',
    'username' => 'power_candle',
    'password' => 'your_secure_password',
],

'moodle' => [
    'url' => 'https://your-moodle-instance.com',
    'token' => 'your_webservice_token',
    'quiz_id' => 1, // Your Power Candle quiz ID
],
```

### 3. Apache Configuration

Create a virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName powercandle.yourdomain.com
    DocumentRoot /var/www/power-candle

    <Directory /var/www/power-candle/backend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 7.1 specific (if using multiple PHP versions)
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    <Directory /var/www/power-candle/frontend/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/powercandle-error.log
    CustomLog ${APACHE_LOG_DIR}/powercandle-access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite powercandle
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### 4. Frontend Build

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.production.local

# Edit .env.production.local
echo "REACT_APP_API_URL=https://powercandle.yourdomain.com/api" > .env.production.local

# Build for production
npm run build

# Build output will be in ./build directory
```

### 5. Deploy Files

```bash
# Copy to web server
sudo mkdir -p /var/www/power-candle
sudo cp -r backend /var/www/power-candle/
sudo cp -r frontend/build /var/www/power-candle/frontend/
sudo cp database /var/www/power-candle/ -r

# Set permissions
sudo chown -R www-data:www-data /var/www/power-candle
sudo chmod -R 755 /var/www/power-candle

# Secure sensitive directories
sudo chmod 600 /var/www/power-candle/backend/config/config.php
sudo mkdir -p /var/www/power-candle/backend/logs
sudo chmod 777 /var/www/power-candle/backend/logs
```

### 6. Moodle Web Services Setup

**Enable Web Services in Moodle:**

1. Go to: `Site administration > Advanced features`
2. Enable "Enable web services"
3. Save changes

**Create a Web Service User:**

1. Go to: `Site administration > Users > Accounts > Add a new user`
2. Create user: `powercandle_service`
3. Assign role: `Web services`

**Create Web Service Token:**

1. Go to: `Site administration > Server > Web services > Manage tokens`
2. Click "Add"
3. Select user: `powercandle_service`
4. Select service: `Moodle mobile web service` (or create custom service)
5. Copy the generated token to `backend/config/config.php`

**Enable Required Functions:**

Ensure these functions are enabled:
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`
- `mod_quiz_get_attempt_data`
- `mod_quiz_process_attempt`
- `core_user_get_users_by_field`

### 7. SSL/HTTPS Setup (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d powercandle.yourdomain.com

# Auto-renewal is configured automatically
```

Update Apache config to redirect HTTP to HTTPS:

```apache
<VirtualHost *:80>
    ServerName powercandle.yourdomain.com
    Redirect permanent / https://powercandle.yourdomain.com/
</VirtualHost>
```

### 8. Testing

**Test Backend API:**

```bash
# Test database connection
curl http://powercandle.yourdomain.com/api/problem?difficulty=1

# Expected response:
# {"success":true,"data":{...},"timestamp":...}
```

**Test Frontend:**

1. Open browser: `https://powercandle.yourdomain.com`
2. Verify smartphone frame loads
3. Test problem loading
4. Test answer submission

**Test Moodle Integration:**

```bash
cd /var/www/power-candle/backend

# Create a test script
cat > test_moodle.php << 'EOF'
<?php
require_once 'config/config.php';
require_once 'utils/MoodleClient.php';

$config = require 'config/config.php';
$moodle = new MoodleClient($config);

if ($moodle->testConnection()) {
    echo "✓ Moodle connection successful\n";
    $info = $moodle->getSiteInfo();
    echo "Site: " . $info['sitename'] . "\n";
} else {
    echo "✗ Moodle connection failed\n";
}
EOF

php test_moodle.php
```

## Troubleshooting

### Issue: "Database connection failed"

**Solution:**
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `config/config.php`
- Check MySQL user permissions

### Issue: "CORS errors in browser console"

**Solution:**
- Update `backend/config/config.php` CORS settings:
  ```php
  'cors' => [
      'allowed_origins' => [
          'https://powercandle.yourdomain.com'
      ],
  ],
  ```

### Issue: "404 on API endpoints"

**Solution:**
- Verify `.htaccess` is enabled: `sudo a2enmod rewrite`
- Check Apache config allows `.htaccess` overrides
- Restart Apache: `sudo systemctl restart apache2`

### Issue: "Moodle API returns 'Invalid token'"

**Solution:**
- Regenerate token in Moodle
- Update `backend/config/config.php`
- Clear PHP opcache: `sudo systemctl reload php7.1-fpm`

## Performance Optimization

### 1. Enable PHP OPcache

Edit `/etc/php/7.1/fpm/php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

### 2. Database Indexing

Indexes are already created in `schema.sql`, verify:

```sql
SHOW INDEXES FROM student_attempts;
SHOW INDEXES FROM problems;
```

### 3. Enable Gzip Compression

Add to Apache config:

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### 4. Browser Caching

Frontend build includes cache headers automatically.

For backend, add to `.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType application/json "access plus 1 hour"
</IfModule>
```

## Monitoring

### 1. Application Logs

```bash
# Backend logs
tail -f /var/www/power-candle/backend/logs/*.log

# Apache error logs
tail -f /var/log/apache2/powercandle-error.log
```

### 2. Database Monitoring

```sql
-- Check recent activity
SELECT * FROM recent_activity LIMIT 10;

-- Check student performance
SELECT * FROM student_performance;

-- Check problem difficulty
SELECT * FROM problem_difficulty_analysis;
```

## Backup

### Database Backup

```bash
# Daily backup script
cat > /usr/local/bin/backup_powercandle.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/power-candle"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u power_candle -p'your_password' power_candle \
  | gzip > $BACKUP_DIR/power_candle_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup_powercandle.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_powercandle.sh") | crontab -
```

### File Backup

```bash
# Backup configuration and logs
tar -czf /var/backups/power-candle/config_$(date +%Y%m%d).tar.gz \
  /var/www/power-candle/backend/config/config.php \
  /var/www/power-candle/backend/logs/
```

## Updating

### Backend Updates

```bash
# Backup first
cd /var/www/power-candle/backend
sudo tar -czf ../backup_$(date +%Y%m%d).tar.gz .

# Pull updates
git pull origin main

# Clear cache if needed
sudo systemctl reload php7.1-fpm
```

### Frontend Updates

```bash
cd /path/to/development/frontend

# Build new version
npm run build

# Deploy
sudo cp -r build/* /var/www/power-candle/frontend/
```

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] `config.php` has restricted permissions (600)
- [ ] Database user has minimal required privileges
- [ ] Moodle web service token is secure
- [ ] Directory listing disabled
- [ ] PHP error display disabled in production
- [ ] Regular backups configured
- [ ] Firewall rules configured (ports 80, 443 only)
- [ ] Keep PHP and MySQL updated

## Support

For issues or questions:
- Check logs: `/var/www/power-candle/backend/logs/`
- Review Apache logs: `/var/log/apache2/powercandle-error.log`
- Test Moodle connection: `php test_moodle.php`
- Verify database: `mysql -u power_candle -p power_candle`

## Appendix: Docker Deployment (Alternative)

For Docker-based deployment, see `docker-compose.yml` (to be created separately).
