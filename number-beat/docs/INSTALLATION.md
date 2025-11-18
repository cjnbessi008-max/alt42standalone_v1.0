# Number Beat - Installation Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Database Setup](#database-setup)
4. [Web Server Configuration](#web-server-configuration)
5. [Application Configuration](#application-configuration)
6. [Testing Installation](#testing-installation)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache 2.4+ (with mod_rewrite) or Nginx
- **RAM**: 512 MB minimum
- **Disk Space**: 100 MB minimum
- **Browser**: Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Recommended Requirements

- **PHP**: 7.4 or higher
- **MySQL**: 8.0 or higher
- **RAM**: 2 GB
- **Disk Space**: 500 MB
- **SSL Certificate**: For HTTPS (recommended for production)

### PHP Extensions Required

```bash
# Check installed extensions
php -m

# Required extensions:
- pdo
- pdo_mysql
- json
- mbstring
- curl
- openssl
```

## Installation Methods

### Method 1: Manual Installation

#### Step 1: Download/Clone Project

```bash
# Clone from repository (or download ZIP)
git clone https://github.com/yourusername/number-beat.git
cd number-beat
```

#### Step 2: Set Permissions

```bash
# For Linux/Unix
chmod -R 755 .
chown -R www-data:www-data .

# Make sure web server can read files
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

#### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Update the following values in `.env`:

```bash
DB_HOST=localhost
DB_NAME=number_beat
DB_USER=your_db_user
DB_PASS=your_db_password

MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### Method 2: Docker Installation (Coming Soon)

Docker support will be added in future versions.

## Database Setup

### Step 1: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE number_beat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, recommended for security)
CREATE USER 'numberbeat_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON number_beat.* TO 'numberbeat_user'@'localhost';

# Flush privileges
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### Step 2: Import Schema

```bash
# Import database schema
mysql -u numberbeat_user -p number_beat < database/schema.sql

# Verify tables were created
mysql -u numberbeat_user -p number_beat -e "SHOW TABLES;"
```

Expected output:
```
+------------------------+
| Tables_in_number_beat  |
+------------------------+
| game_sessions          |
| moodle_sync_log       |
| problems               |
| student_attempts       |
| student_progress       |
| students               |
+------------------------+
```

### Step 3: Verify Sample Data

```bash
# Check if sample problems were inserted
mysql -u numberbeat_user -p number_beat -e "SELECT COUNT(*) FROM problems;"
```

Should show at least 5 sample problems.

## Web Server Configuration

### Apache Configuration

#### Option 1: Using .htaccess (Already Included)

The `.htaccess` file is already included in `public/` directory.

Just enable mod_rewrite:

```bash
# Enable mod_rewrite
sudo a2enmod rewrite

# Restart Apache
sudo systemctl restart apache2
```

Update Apache virtual host to allow .htaccess:

```apache
<VirtualHost *:80>
    ServerName numberbeat.local
    DocumentRoot /var/www/html/number-beat/public

    <Directory /var/www/html/number-beat/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API Directory
    Alias /api /var/www/html/number-beat/api
    <Directory /var/www/html/number-beat/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        <IfModule mod_php7.c>
            php_flag display_errors Off
            php_value error_log /var/log/apache2/numberbeat_error.log
        </IfModule>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/numberbeat_error.log
    CustomLog ${APACHE_LOG_DIR}/numberbeat_access.log combined
</VirtualHost>
```

Enable site and restart:

```bash
sudo a2ensite numberbeat
sudo systemctl restart apache2
```

#### Option 2: Direct Apache Config (Recommended for Production)

Create `/etc/apache2/sites-available/numberbeat.conf`:

```apache
<VirtualHost *:443>
    ServerName numberbeat.yourdomain.com
    DocumentRoot /var/www/number-beat/public

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/numberbeat.crt
    SSLCertificateKeyFile /etc/ssl/private/numberbeat.key

    <Directory /var/www/number-beat/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Security headers
        Header always set X-Frame-Options "SAMEORIGIN"
        Header always set X-Content-Type-Options "nosniff"
        Header always set X-XSS-Protection "1; mode=block"
    </Directory>

    # API
    Alias /api /var/www/number-beat/api
    <Directory /var/www/number-beat/api>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/numberbeat_error.log
    CustomLog ${APACHE_LOG_DIR}/numberbeat_access.log combined
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName numberbeat.yourdomain.com
    Redirect permanent / https://numberbeat.yourdomain.com/
</VirtualHost>
```

### Nginx Configuration

Create `/etc/nginx/sites-available/numberbeat`:

```nginx
server {
    listen 80;
    server_name numberbeat.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name numberbeat.yourdomain.com;

    root /var/www/number-beat/public;
    index index.html;

    # SSL
    ssl_certificate /etc/ssl/certs/numberbeat.crt;
    ssl_certificate_key /etc/ssl/private/numberbeat.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        alias /var/www/number-beat/api/;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.sql$ {
        deny all;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/numberbeat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Application Configuration

### Step 1: Update config.php

Edit `config/config.php`:

```php
// Database (should match .env or direct values)
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_beat');
define('DB_USER', 'numberbeat_user');
define('DB_PASS', 'your_password');

// Moodle
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');

// Disable debug in production
define('DEBUG_MODE', false);
```

### Step 2: Verify PHP Configuration

Check PHP settings:

```bash
php -i | grep -E "(upload_max_filesize|post_max_size|max_execution_time)"
```

Update if needed in `php.ini` or `.htaccess`:

```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
```

### Step 3: Set Up Audio Files

Add audio files to `public/audio/`:

- beat.mp3
- success.mp3
- fail.mp3
- tap.mp3

Or use the Web Audio API fallback (already implemented).

## Testing Installation

### Step 1: Test Database Connection

Create `test_db.php` in root:

```php
<?php
require_once 'config/config.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "✓ Database connection successful!\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM problems");
    $result = $stmt->fetch();
    echo "✓ Found " . $result['count'] . " problems in database\n";

} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
}
```

Run:

```bash
php test_db.php
```

### Step 2: Test Web Access

Open browser and navigate to:

```
http://localhost/number-beat/public/
```

or

```
https://numberbeat.yourdomain.com/
```

You should see the Number Beat interface.

### Step 3: Test API Endpoints

```bash
# Test get problem
curl "http://localhost/number-beat/public/api/get-problem?difficulty=easy&student_id=1"

# Should return JSON with problem data
```

### Step 4: Test Game Flow

1. Enter student ID (e.g., 1)
2. Select difficulty
3. Click "게임 시작"
4. Verify problem loads
5. Complete a problem
6. Verify results display

## Troubleshooting

### Issue: "Database connection failed"

**Cause**: Incorrect database credentials or MySQL not running

**Solution**:
```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL if needed
sudo systemctl start mysql

# Verify credentials in config.php
```

### Issue: "404 Not Found" for API calls

**Cause**: mod_rewrite not enabled or .htaccess not working

**Solution**:
```bash
# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Check AllowOverride in Apache config
# Should be: AllowOverride All
```

### Issue: "Permission denied" errors

**Cause**: Incorrect file permissions

**Solution**:
```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/number-beat

# Set correct permissions
sudo find /var/www/number-beat -type d -exec chmod 755 {} \;
sudo find /var/www/number-beat -type f -exec chmod 644 {} \;
```

### Issue: "Class 'PDO' not found"

**Cause**: PDO extension not installed

**Solution**:
```bash
# Install PDO
sudo apt-get install php7.4-mysql php7.4-pdo

# Restart web server
sudo systemctl restart apache2
```

### Issue: Audio files not playing

**Cause**: Browser autoplay policy or missing files

**Solution**:
1. Click anywhere on page to enable audio (browser requirement)
2. Verify audio files exist in `public/audio/`
3. Check browser console for errors

### Issue: CORS errors

**Cause**: Incorrect CORS configuration

**Solution**:

Update `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "https://yourdomain.com"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

## Post-Installation

### Security Checklist

- [ ] Change default database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set DEBUG_MODE to false
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Enable fail2ban for brute force protection
- [ ] Regular database backups
- [ ] Update PHP and MySQL regularly

### Performance Optimization

```bash
# Enable OPcache
sudo apt-get install php7.4-opcache

# Enable in php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### Monitoring

Set up monitoring:

```bash
# Install monitoring tools
sudo apt-get install htop iotop

# Monitor Apache
sudo tail -f /var/log/apache2/numberbeat_access.log
sudo tail -f /var/log/apache2/numberbeat_error.log
```

### Backup

Create backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/numberbeat"

# Backup database
mysqldump -u numberbeat_user -p number_beat > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/number-beat

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Next Steps

1. [Configure Moodle Integration](MOODLE_INTEGRATION.md)
2. Add custom audio files
3. Customize styling (colors, fonts)
4. Create additional problems in Moodle
5. Train teachers on system usage

## Support

For installation issues:
- Check logs: `/var/log/apache2/` or `/var/log/nginx/`
- Enable debug mode temporarily
- Contact support: support@example.com
