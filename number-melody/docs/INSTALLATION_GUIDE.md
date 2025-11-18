# Number Melody - Detailed Installation Guide

## Prerequisites Checklist

Before installing Number Melody, ensure you have:

- [ ] Web server (Apache 2.4+ or Nginx 1.18+)
- [ ] PHP 7.1.9 or higher with extensions:
  - [ ] PDO
  - [ ] PDO_MySQL
  - [ ] JSON
  - [ ] cURL (for Moodle integration)
- [ ] MySQL 5.7 or higher
- [ ] Moodle 3.7 (optional, for LMS integration)
- [ ] Root or sudo access to server
- [ ] Basic knowledge of command line

## Step-by-Step Installation

### Step 1: Download and Extract

```bash
# Navigate to your web root
cd /var/www/html

# If you have the files in a zip
unzip number-melody.zip

# Or clone from repository
git clone <repository-url> number-melody

# Set ownership
sudo chown -R www-data:www-data number-melody
```

### Step 2: Database Setup

#### Option A: Automated Setup

```bash
cd number-melody/database
mysql -u root -p < schema.sql
```

Enter your MySQL root password when prompted.

#### Option B: Manual Setup

```bash
mysql -u root -p
```

Then in MySQL:

```sql
-- Create database
CREATE DATABASE number_melody CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional but recommended)
CREATE USER 'number_melody_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON number_melody.* TO 'number_melody_user'@'localhost';
FLUSH PRIVILEGES;

-- Import schema
USE number_melody;
SOURCE /var/www/html/number-melody/database/schema.sql;

-- Verify tables were created
SHOW TABLES;
```

Expected output:
```
+---------------------------+
| Tables_in_number_melody   |
+---------------------------+
| interactions              |
| problems                  |
| student_attempts          |
| student_progress          |
+---------------------------+
```

### Step 3: Configure Application

#### Edit Database Configuration

```bash
cd /var/www/html/number-melody/api
nano config.php
```

Update these lines:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_melody');
define('DB_USER', 'number_melody_user');  // Your database user
define('DB_PASS', 'secure_password_here'); // Your database password
```

#### Configure Moodle Integration (Optional)

If using Moodle, also update:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token');
```

To get a Moodle token:

1. Log in to Moodle as administrator
2. Go to: **Site Administration → Server → Web Services**
3. Enable web services if not already enabled
4. Go to: **Manage Tokens**
5. Click **Add** and create a token for Number Melody
6. Copy the token string

### Step 4: Set File Permissions

```bash
cd /var/www/html/number-melody

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make sure PHP files are readable
chmod 644 api/*.php

# Set ownership (Ubuntu/Debian)
sudo chown -R www-data:www-data .

# Set ownership (CentOS/RHEL)
sudo chown -R apache:apache .
```

### Step 5: Configure Web Server

#### For Apache

Create a virtual host configuration:

```bash
sudo nano /etc/apache2/sites-available/number-melody.conf
```

Add:

```apache
<VirtualHost *:80>
    ServerName number-melody.yourdomain.com
    DocumentRoot /var/www/html/number-melody

    <Directory /var/www/html/number-melody>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/html/number-melody/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/number-melody-error.log
    CustomLog ${APACHE_LOG_DIR}/number-melody-access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite number-melody
sudo systemctl reload apache2
```

#### For Nginx

Create a server block:

```bash
sudo nano /etc/nginx/sites-available/number-melody
```

Add:

```nginx
server {
    listen 80;
    server_name number-melody.yourdomain.com;
    root /var/www/html/number-melody;
    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/number-melody /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Test Installation

#### Test Database Connection

```bash
php -r "
\$pdo = new PDO('mysql:host=localhost;dbname=number_melody', 'number_melody_user', 'your_password');
echo 'Database connection successful!';
"
```

#### Test API Endpoint

```bash
curl http://localhost/number-melody/api/api.php?action=get_problem
```

Expected response:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "Basic Sequence",
    ...
  }
}
```

#### Test Web Interface

Open your browser and visit:
```
http://localhost/number-melody/app/
```

You should see:
- Control panel on the left with problem description
- Virtual smartphone on the right with number grid
- No JavaScript errors in browser console (F12)

### Step 7: Verify Functionality

1. **Click a number** on the smartphone screen
   - Should hear a musical tone
   - Number should appear in "Your Sequence" section
   - Visual feedback (button animation)

2. **Submit an answer**
   - Click several numbers
   - Click "Submit Answer"
   - Should see result modal

3. **Check database**
   ```sql
   USE number_melody;
   SELECT * FROM student_attempts ORDER BY attempted_at DESC LIMIT 5;
   ```

## Moodle Integration Setup

### Step 1: Enable Web Services in Moodle

1. Log in as admin
2. **Site Administration → Advanced Features**
3. Check "Enable web services"
4. Click "Save changes"

### Step 2: Create Web Service

1. **Site Administration → Server → Web Services → External Services**
2. Click "Add"
3. Name: "Number Melody"
4. Enabled: Yes
5. Authorized users only: Yes (recommended)

### Step 3: Add Functions

Add these functions to the service:
- `mod_quiz_get_quiz_by_courses`
- `mod_quiz_process_attempt`
- `core_user_get_users_by_field`

### Step 4: Create Token

1. **Site Administration → Server → Web Services → Manage Tokens**
2. Click "Add"
3. User: Select service user
4. Service: Number Melody
5. Click "Save changes"
6. Copy the token

### Step 5: Test Integration

```bash
# Test from command line
curl -X POST "http://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_user_get_users_by_field" \
  -d "field=id" \
  -d "values[0]=2" \
  -d "moodlewsrestformat=json"
```

### Step 6: Embed in Moodle Course

1. Turn editing on in your course
2. Add an activity: **External Tool** or **Page**
3. For Page, add HTML:

```html
<div style="width: 100%; height: 900px;">
  <iframe
    src="http://your-domain/number-melody/app/?userid={$USER->id}"
    width="100%"
    height="100%"
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>
```

## Troubleshooting

### Issue: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials
mysql -u number_melody_user -p number_melody

# Check PHP PDO extension
php -m | grep pdo
```

### Issue: "No sound playing"

**Solution:**
- Click anywhere on page first (browser autoplay policy)
- Check browser console for errors
- Verify browser supports Web Audio API
- Try different browser (Chrome/Firefox recommended)

### Issue: "API returns 404"

**Solution:**
```bash
# Check file exists
ls -la /var/www/html/number-melody/api/api.php

# Check web server error logs
# Apache:
sudo tail -f /var/log/apache2/error.log

# Nginx:
sudo tail -f /var/log/nginx/error.log
```

### Issue: "Moodle integration not working"

**Solution:**
- Verify web services are enabled
- Check token is valid: Site Admin → Web Services → Manage Tokens
- Review Moodle logs: Site Admin → Reports → Logs
- Enable debugging: Site Admin → Development → Debugging

## Security Hardening

### 1. Disable Debug Mode

In `api/config.php`:
```php
define('DEBUG_MODE', false);
```

### 2. Restrict Database User

```sql
-- Only grant necessary privileges
REVOKE ALL PRIVILEGES ON number_melody.* FROM 'number_melody_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON number_melody.* TO 'number_melody_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Add HTTPS

```bash
# Install certbot
sudo apt install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d number-melody.yourdomain.com
```

### 4. Configure CORS

In `api/api.php`, change:
```php
header('Access-Control-Allow-Origin: *');
```

To:
```php
header('Access-Control-Allow-Origin: http://your-moodle-site.com');
```

## Performance Optimization

### Enable PHP OPcache

In `php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### Enable MySQL Query Cache

In `my.cnf`:
```ini
query_cache_type=1
query_cache_size=32M
```

### Enable Gzip Compression

Apache:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

Nginx:
```nginx
gzip on;
gzip_types text/css application/javascript application/json;
```

## Backup and Maintenance

### Backup Database

```bash
# Daily backup script
#!/bin/bash
mysqldump -u number_melody_user -p number_melody > \
  /backup/number_melody_$(date +%Y%m%d).sql
```

### Update Application

```bash
cd /var/www/html/number-melody
git pull origin main
sudo systemctl reload apache2
```

## Next Steps

After successful installation:

1. [ ] Create teacher accounts
2. [ ] Add custom problems to database
3. [ ] Configure Moodle integration
4. [ ] Test with students
5. [ ] Monitor logs and performance
6. [ ] Set up automated backups

## Support

For additional help:
- Check main README.md
- Review API documentation
- Contact system administrator
