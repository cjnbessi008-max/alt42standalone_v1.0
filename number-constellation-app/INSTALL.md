# Installation Guide - Number Constellation

Complete installation instructions for Number Constellation app with Moodle 3.7 integration.

---

## Prerequisites

- **PHP**: 7.1.9 or compatible
- **MySQL**: 5.7 or compatible
- **Apache**: 2.4 or Nginx
- **Moodle**: 3.7 (if using LMS integration)
- **Docker**: (Optional, for containerized deployment)

---

## Method 1: Docker Installation (Recommended)

### Step 1: Prepare Environment

```bash
cd number-constellation-app/docker
cp .env.example .env
```

### Step 2: Edit Environment Variables

Edit `.env` file:

```env
DB_HOST=mysql
DB_NAME=number_constellation
DB_USER=numconst
DB_PASS=numconst123
MYSQL_ROOT_PASSWORD=rootpassword
API_KEY=change-this-to-secure-key
CORS_ORIGIN=*
```

### Step 3: Build and Start Containers

```bash
docker-compose up -d
```

### Step 4: Verify Installation

Check running containers:
```bash
docker-compose ps
```

You should see:
- `numconst_mysql` (MySQL 5.7)
- `numconst_web` (PHP 7.1.9 + Apache)
- `numconst_phpmyadmin` (Database admin)

### Step 5: Access Application

- **Web App**: http://localhost:8080
- **PHPMyAdmin**: http://localhost:8081
- **API Endpoint**: http://localhost:8080/api/problem.php

### Step 6: Test Database

1. Open PHPMyAdmin: http://localhost:8081
2. Login with:
   - Username: `root`
   - Password: `rootpassword`
3. Verify `number_constellation` database exists with tables:
   - problems
   - student_progress
   - constellation_configs
   - analytics

---

## Method 2: Manual Installation

### Step 1: Install Dependencies

#### On Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y apache2 php7.1 php7.1-mysql php7.1-curl mysql-server-5.7
```

#### On CentOS/RHEL:
```bash
sudo yum install -y httpd php71w php71w-mysql php71w-curl mysql-server
```

### Step 2: Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
mysql -u root -p < /path/to/number-constellation-app/database/schema.sql

# Or manually:
mysql -u root -p
> source /path/to/number-constellation-app/database/schema.sql;
```

### Step 3: Configure Backend

Edit `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_constellation');
define('DB_USER', 'your_mysql_user');
define('DB_PASS', 'your_mysql_password');
```

Edit `backend/config/config.php`:

```php
define('API_KEY', 'your-secure-api-key-here');
define('CORS_ORIGIN', '*'); // Or specific domain
```

### Step 4: Configure Apache

Create Apache virtual host:

```bash
sudo nano /etc/apache2/sites-available/numconst.conf
```

Add configuration:

```apache
<VirtualHost *:8080>
    ServerName localhost
    DocumentRoot /path/to/number-constellation-app/frontend/public

    <Directory /path/to/number-constellation-app/frontend/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /path/to/number-constellation-app/backend/api

    <Directory /path/to/number-constellation-app/backend/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, X-API-Key"

    ErrorLog ${APACHE_LOG_DIR}/numconst_error.log
    CustomLog ${APACHE_LOG_DIR}/numconst_access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite numconst.conf
sudo a2enmod headers
sudo systemctl restart apache2
```

### Step 5: Set Permissions

```bash
sudo chown -R www-data:www-data /path/to/number-constellation-app
sudo chmod -R 755 /path/to/number-constellation-app
```

### Step 6: Verify Installation

Visit http://localhost:8080 and check if the app loads.

---

## Moodle Plugin Installation

### Step 1: Copy Plugin Files

```bash
cp -r /path/to/number-constellation-app/moodle-plugin \
      /path/to/moodle/local/numconstellation
```

### Step 2: Set Permissions

```bash
sudo chown -R www-data:www-data /path/to/moodle/local/numconstellation
sudo chmod -R 755 /path/to/moodle/local/numconstellation
```

### Step 3: Install via Moodle Admin

1. Login to Moodle as admin
2. Visit: **Site administration → Notifications**
3. Click "Upgrade Moodle database now"
4. Plugin "Number Constellation" will be installed

### Step 4: Configure Plugin Settings

1. Go to: **Site administration → Plugins → Local plugins → Number Constellation**
2. Set:
   - **API URL**: `http://localhost:8080/api/problem.php`
   - **App URL**: `http://localhost:8080`
   - **API Key**: Same key as in `backend/config/config.php`
3. Save changes

---

## Testing Installation

### Test 1: API Endpoint

Create a test problem:

```bash
curl -X POST http://localhost:8080/api/problem.php \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{
    "moodle_problem_id": "TEST_001",
    "moodle_course_id": 1,
    "moodle_user_id": 1,
    "problem_type": "prime",
    "number_range_start": 1,
    "number_range_end": 50,
    "difficulty_level": "easy",
    "problem_data": "{\"instruction\":\"Find all prime numbers\"}"
  }'
```

Expected response:
```json
{
  "success": true,
  "problem_id": 1,
  "moodle_problem_id": "TEST_001",
  "message": "Problem created successfully"
}
```

### Test 2: Retrieve Problem

```bash
curl http://localhost:8080/api/get_problem.php?problem_id=TEST_001
```

### Test 3: Access Frontend

Open browser:
```
http://localhost:8080?problem_id=TEST_001&user_id=1
```

You should see the constellation app with prime numbers.

### Test 4: Moodle Integration

In Moodle, create a test page with:

```php
<?php
require_once($CFG->dirroot . '/local/numconstellation/lib.php');

$response = local_numconstellation_send_problem(
    1,      // Course ID
    $USER->id,
    'prime',
    1,
    50,
    'easy'
);

$app_url = local_numconstellation_get_app_url($response->problem_id, $USER->id);

echo '<div style="position:fixed; bottom:20px; right:20px; width:375px; height:667px; border:10px solid #000; border-radius:30px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.5);">';
echo '<iframe src="' . $app_url . '" style="width:100%; height:100%; border:none;"></iframe>';
echo '</div>';
?>
```

---

## Troubleshooting

### Issue: "Database connection failed"

**Solution**: Check database credentials in `backend/config/database.php`

```bash
# Test MySQL connection
mysql -h localhost -u numconst -p number_constellation
```

### Issue: "API key invalid"

**Solution**: Ensure API keys match in:
- `backend/config/config.php`
- Moodle plugin settings
- `frontend/src/utils/api.js`

### Issue: "CORS error"

**Solution**: Enable CORS headers in Apache:

```bash
sudo a2enmod headers
sudo systemctl restart apache2
```

### Issue: "Cannot find problem"

**Solution**: Check database:

```sql
USE number_constellation;
SELECT * FROM problems WHERE moodle_problem_id = 'TEST_001';
```

### Issue: Docker containers not starting

**Solution**: Check logs:

```bash
docker-compose logs mysql
docker-compose logs web
```

---

## Security Recommendations

1. **Change default API key**:
   ```php
   define('API_KEY', 'use-strong-random-key-here');
   ```

2. **Use HTTPS in production**:
   - Configure SSL certificate
   - Update API URLs to use `https://`

3. **Restrict CORS**:
   ```php
   define('CORS_ORIGIN', 'https://your-moodle-domain.com');
   ```

4. **Secure database**:
   - Use strong MySQL passwords
   - Restrict database user permissions
   - Enable firewall rules

5. **Update Moodle regularly**:
   - Keep Moodle and plugins updated
   - Monitor security advisories

---

## Performance Optimization

1. **Enable PHP opcache**:
   ```ini
   opcache.enable=1
   opcache.memory_consumption=128
   ```

2. **MySQL tuning**:
   ```ini
   innodb_buffer_pool_size=256M
   max_connections=100
   ```

3. **Enable Apache compression**:
   ```bash
   sudo a2enmod deflate
   sudo systemctl restart apache2
   ```

---

## Backup

### Backup Database

```bash
mysqldump -u root -p number_constellation > backup_$(date +%Y%m%d).sql
```

### Backup Application Files

```bash
tar -czf numconst_backup_$(date +%Y%m%d).tar.gz number-constellation-app/
```

---

## Uninstallation

### Remove Docker Installation

```bash
cd number-constellation-app/docker
docker-compose down -v  # -v removes volumes (database data)
```

### Remove Manual Installation

```bash
# Remove Apache config
sudo a2dissite numconst.conf
sudo systemctl restart apache2

# Remove database
mysql -u root -p -e "DROP DATABASE number_constellation;"

# Remove files
sudo rm -rf /path/to/number-constellation-app

# Remove Moodle plugin
sudo rm -rf /path/to/moodle/local/numconstellation
```

---

## Support

For installation issues:
- Check logs: `docker-compose logs` or `/var/log/apache2/`
- Review configuration files
- Verify PHP version: `php -v`
- Verify MySQL version: `mysql --version`

---

**Installation complete! Ready to explore Number Constellation! ⭐**
