# Absolute Mirror - Deployment Guide

Complete guide for deploying Absolute Mirror to production.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Configuration](#application-configuration)
5. [Web Server Configuration](#web-server-configuration)
6. [Moodle Integration](#moodle-integration)
7. [SSL/HTTPS Setup](#ssl-https-setup)
8. [Performance Tuning](#performance-tuning)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Backup & Recovery](#backup--recovery)

---

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache 2.4+ or Nginx 1.14+
- **RAM**: 1GB minimum
- **Storage**: 2GB minimum

### Recommended for Production
- **OS**: Ubuntu 20.04 LTS
- **PHP**: 7.4 with OPcache
- **MySQL**: 5.7 with InnoDB
- **Web Server**: Nginx 1.18+ with PHP-FPM
- **RAM**: 4GB+
- **Storage**: 10GB+ SSD

---

## Server Setup

### 1. Update System

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install PHP 7.1.9+

```bash
# Ubuntu/Debian
sudo apt install -y php7.1 php7.1-fpm php7.1-mysql php7.1-mbstring \
    php7.1-xml php7.1-json php7.1-curl php7.1-zip php7.1-gd

# CentOS/RHEL
sudo yum install -y php71w php71w-fpm php71w-mysql php71w-mbstring \
    php71w-xml php71w-json php71w-curl
```

### 3. Install MySQL 5.7

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server-5.7

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

### 4. Install Web Server

#### Option A: Nginx (Recommended)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Option B: Apache

```bash
sudo apt install -y apache2
sudo systemctl start apache2
sudo systemctl enable apache2

# Enable required modules
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

---

## Database Setup

### 1. Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# In MySQL prompt:
```

```sql
-- Create database
CREATE DATABASE absolute_mirror CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'abs_mirror'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON absolute_mirror.* TO 'abs_mirror'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 2. Import Schema

```bash
# Navigate to project directory
cd /var/www/html/absolute-mirror

# Import database schema
mysql -u abs_mirror -p absolute_mirror < db/schema.sql
```

### 3. Verify Database

```bash
mysql -u abs_mirror -p absolute_mirror -e "SHOW TABLES;"
```

Expected output:
```
+---------------------------+
| Tables_in_absolute_mirror |
+---------------------------+
| problems                  |
| sessions                  |
| student_attempts          |
| student_progress          |
| users                     |
+---------------------------+
```

---

## Application Configuration

### 1. Clone/Upload Project Files

```bash
# Create web directory
sudo mkdir -p /var/www/html/absolute-mirror

# Upload files (example using scp)
scp -r absolute-mirror/* user@server:/var/www/html/absolute-mirror/

# Or clone from git
cd /var/www/html
git clone https://your-repo.com/absolute-mirror.git
```

### 2. Configure Database Connection

Edit `config/database.php`:

```php
<?php
// Main database
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'absolute_mirror');
define('DB_USER', 'abs_mirror');
define('DB_PASS', 'your_secure_password_here');

// Moodle database (if using integration)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_PORT', '3306');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
?>
```

### 3. Configure Application Settings

Edit `public/js/config.js`:

```javascript
const CONFIG = {
    moodle: {
        baseUrl: '/api',  // Update to full URL in production
        // baseUrl: 'https://your-domain.com/absolute-mirror/api',
    },

    demo: {
        enabled: false,  // Disable demo mode in production
    },

    ui: {
        showDebugInfo: false,  // Disable debug info
        autoLoadProblem: true,
        language: 'ko'
    }
};
```

### 4. Set File Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/absolute-mirror

# Set directory permissions
sudo find /var/www/html/absolute-mirror -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/html/absolute-mirror -type f -exec chmod 644 {} \;

# Make API files executable
sudo chmod 755 /var/www/html/absolute-mirror/api/*.php
```

---

## Web Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/absolute-mirror`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/html/absolute-mirror/public;
    index index.html;

    # Logging
    access_log /var/log/nginx/absolute-mirror-access.log;
    error_log /var/log/nginx/absolute-mirror-error.log;

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # API endpoints
    location /api {
        alias /var/www/html/absolute-mirror/api;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Caching for static assets
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /config/ {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/absolute-mirror /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration

Create `/etc/apache2/sites-available/absolute-mirror.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    DocumentRoot /var/www/html/absolute-mirror/public

    <Directory /var/www/html/absolute-mirror/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API directory
    Alias /api /var/www/html/absolute-mirror/api

    <Directory /var/www/html/absolute-mirror/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    # Security
    <Directory /var/www/html/absolute-mirror/config>
        Require all denied
    </Directory>

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/absolute-mirror-error.log
    CustomLog ${APACHE_LOG_DIR}/absolute-mirror-access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite absolute-mirror
sudo a2enmod proxy_fcgi setenvif
sudo systemctl reload apache2
```

---

## Moodle Integration

### 1. Configure Moodle Database Access

In `config/database.php`, set Moodle credentials (shown above).

### 2. Sync Users from Moodle

```bash
# Via web browser:
https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=sync_users

# Or via curl:
curl "https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=sync_users"
```

### 3. Import Problems from Moodle

```bash
# All courses:
curl "https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=import_problems"

# Specific course:
curl "https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=import_problems&course_id=5"
```

### 4. Set Up Automated Sync (Optional)

Create cron job for daily sync:

```bash
# Edit crontab
sudo crontab -e

# Add these lines:
# Sync users daily at 2 AM
0 2 * * * curl "https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=sync_users" > /dev/null 2>&1

# Import problems daily at 3 AM
0 3 * * * curl "https://your-domain.com/absolute-mirror/api/moodle_integration.php?action=import_problems" > /dev/null 2>&1
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (Nginx)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Obtain certificate (Apache)
sudo certbot --apache -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Update Application Config

In `public/js/config.js`:

```javascript
moodle: {
    baseUrl: 'https://your-domain.com/absolute-mirror/api',  // Use HTTPS
}
```

---

## Performance Tuning

### 1. PHP Optimization

Edit `/etc/php/7.1/fpm/php.ini`:

```ini
; Memory
memory_limit = 256M

; Upload
upload_max_filesize = 20M
post_max_size = 20M

; Performance
opcache.enable = 1
opcache.memory_consumption = 128
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 2

; Sessions
session.save_handler = files
session.gc_maxlifetime = 3600
```

Restart PHP-FPM:

```bash
sudo systemctl restart php7.1-fpm
```

### 2. MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_type = 1
query_cache_size = 64M
max_connections = 200
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

### 3. Enable Gzip Compression (Nginx)

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

---

## Monitoring & Maintenance

### 1. Log Monitoring

```bash
# Nginx access log
sudo tail -f /var/log/nginx/absolute-mirror-access.log

# Nginx error log
sudo tail -f /var/log/nginx/absolute-mirror-error.log

# PHP error log
sudo tail -f /var/log/php7.1-fpm.log

# MySQL slow query log
sudo tail -f /var/log/mysql/mysql-slow.log
```

### 2. System Monitoring

Install monitoring tools:

```bash
sudo apt install -y htop iotop nethogs
```

Monitor resources:

```bash
# CPU and memory
htop

# Disk I/O
sudo iotop

# Network
sudo nethogs
```

### 3. Database Maintenance

Run weekly:

```sql
-- Optimize tables
OPTIMIZE TABLE problems, student_attempts, student_progress, sessions;

-- Analyze tables
ANALYZE TABLE problems, student_attempts, student_progress, sessions;

-- Check tables
CHECK TABLE problems, student_attempts, student_progress, sessions;
```

### 4. Clean Old Data

Create cleanup script `/usr/local/bin/cleanup-abs-mirror.sh`:

```bash
#!/bin/bash

# Delete sessions older than 30 days
mysql -u abs_mirror -p'password' absolute_mirror -e "DELETE FROM sessions WHERE started_at < DATE_SUB(NOW(), INTERVAL 30 DAY);"

# Delete attempts older than 1 year
mysql -u abs_mirror -p'password' absolute_mirror -e "DELETE FROM student_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);"

echo "Cleanup completed: $(date)"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/cleanup-abs-mirror.sh

# Add to crontab
sudo crontab -e

# Run weekly on Sunday at 4 AM
0 4 * * 0 /usr/local/bin/cleanup-abs-mirror.sh >> /var/log/abs-mirror-cleanup.log 2>&1
```

---

## Backup & Recovery

### 1. Database Backup

Create backup script `/usr/local/bin/backup-abs-mirror.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/absolute-mirror"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="absolute_mirror"
DB_USER="abs_mirror"
DB_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-abs-mirror.sh

# Daily backup at 1 AM
sudo crontab -e
0 1 * * * /usr/local/bin/backup-abs-mirror.sh >> /var/log/abs-mirror-backup.log 2>&1
```

### 2. File Backup

```bash
# Backup application files
tar -czf /var/backups/absolute-mirror-files-$(date +%Y%m%d).tar.gz \
    /var/www/html/absolute-mirror
```

### 3. Recovery

```bash
# Restore database
gunzip < /var/backups/absolute-mirror/db_backup_20250101_010000.sql.gz | \
    mysql -u abs_mirror -p absolute_mirror

# Restore files
tar -xzf /var/backups/absolute-mirror-files-20250101.tar.gz -C /
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: PHP-FPM not running

**Solution**:
```bash
sudo systemctl status php7.1-fpm
sudo systemctl start php7.1-fpm
```

### Issue: Database connection failed

**Cause**: Wrong credentials or MySQL not running

**Solution**:
```bash
sudo systemctl status mysql
# Check credentials in config/database.php
```

### Issue: Canvas not rendering

**Cause**: Browser compatibility or JavaScript errors

**Solution**:
- Check browser console (F12)
- Test in different browser
- Clear browser cache

### Issue: Slow performance

**Cause**: No caching or poor MySQL configuration

**Solution**:
- Enable OPcache
- Optimize MySQL
- Add indexes to database

---

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Strong database passwords
- [ ] File permissions set correctly (755 for dirs, 644 for files)
- [ ] Config directory not web-accessible
- [ ] PHP display_errors = Off in production
- [ ] Regular security updates applied
- [ ] Firewall configured (ufw/iptables)
- [ ] Fail2ban installed for brute-force protection
- [ ] Database backups automated
- [ ] Logs monitored regularly

---

## Production Checklist

Before going live:

- [ ] Database schema imported
- [ ] Sample data loaded
- [ ] SSL certificate installed
- [ ] Demo mode disabled
- [ ] Debug mode disabled
- [ ] Performance optimizations applied
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Logs rotated
- [ ] Tested in staging environment
- [ ] Load tested
- [ ] Security audit completed
- [ ] Documentation updated

---

## Support & Updates

For ongoing support:

1. Monitor error logs daily
2. Apply security patches monthly
3. Review performance metrics weekly
4. Update documentation when changes are made
5. Test new features in staging first

---

## Version

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2025-11-18
**Compatible with**: Absolute Mirror v1.0.0
