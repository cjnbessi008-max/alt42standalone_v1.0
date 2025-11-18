# Twin Shape Glow - Installation Guide

## Quick Start (5 minutes)

### Prerequisites Check

```bash
# Check PHP version (need 7.1.9+)
php -v

# Check MySQL version (need 5.7+)
mysql --version

# Check Apache/Nginx is running
sudo systemctl status apache2
# OR
sudo systemctl status nginx
```

### Installation Steps

#### 1. Download and Extract

```bash
cd /var/www/html
sudo git clone https://github.com/kaist/twin-shape-glow.git
cd twin-shape-glow
```

#### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
```

```sql
CREATE DATABASE twin_shape_glow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tsg_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON twin_shape_glow.* TO 'tsg_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u tsg_user -p twin_shape_glow < sql/schema.sql
# Enter password: SecurePassword123!
```

#### 3. Configure Database Connection

```bash
# Edit config file
nano config/database.php
```

**Update these lines:**

```php
// Moodle Database (your existing Moodle DB)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');           // Your Moodle database name
define('MOODLE_DB_USER', 'moodle_user');      // Your Moodle DB user
define('MOODLE_DB_PASS', 'YourMoodlePass');   // Your Moodle DB password
define('MOODLE_DB_PREFIX', 'mdl_');           // Your Moodle table prefix

// Twin Shape Glow Database
define('TSG_DB_HOST', 'localhost');
define('TSG_DB_NAME', 'twin_shape_glow');
define('TSG_DB_USER', 'tsg_user');
define('TSG_DB_PASS', 'SecurePassword123!');  // Password from step 2
```

Save and exit (Ctrl+X, Y, Enter)

#### 4. Set Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/twin-shape-glow

# Set permissions
sudo chmod -R 755 /var/www/html/twin-shape-glow

# Protect config
sudo chmod 640 config/database.php
```

#### 5. Test Installation

Open browser: `http://your-server/twin-shape-glow/`

You should see the Twin Shape Glow interface with a virtual smartphone on the right.

## Moodle Integration

### Step 1: Create Test Question in Moodle

1. Login to Moodle as teacher/admin
2. Go to Question Bank
3. Create a new question (any type)
4. Note the question ID from URL: `question.php?id=123` → ID is **123**

### Step 2: Create Twin Shape Glow Problem

#### Option A: Via URL

```
http://your-server/twin-shape-glow/index.php?user_id=2&question_id=123
```

This will automatically create a problem linked to question #123.

#### Option B: Via API

```bash
curl -X POST http://your-server/twin-shape-glow/api/create_problem.php \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 123,
    "problem_type": "shape_matching",
    "difficulty": 2
  }'
```

### Step 3: Embed in Moodle

Add to Moodle page/quiz using HTML block:

```html
<iframe
  src="http://your-server/twin-shape-glow/index.php?user_id=%%USERID%%&problem_id=1"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

Replace `%%USERID%%` with Moodle user variable.

## Testing

### Test Database Connection

Create `test_db.php`:

```php
<?php
require_once 'includes/moodle_integration.php';

try {
    $moodle = new MoodleIntegration();
    echo "✓ Database connection successful!\n";

    // Test Moodle connection
    $user = $moodle->getUserInfo(2);
    echo "✓ Moodle integration working!\n";
    echo "User: " . $user['firstname'] . " " . $user['lastname'] . "\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?>
```

Run: `php test_db.php`

### Test API Endpoints

```bash
# Test get_problem
curl http://your-server/twin-shape-glow/api/get_problem.php?problem_id=1

# Test save_progress
curl -X POST http://your-server/twin-shape-glow/api/save_progress.php \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"problem_id":1,"score":500,"time_spent":45,"completed":true}'

# Test get_progress
curl http://your-server/twin-shape-glow/api/get_progress.php?user_id=2&problem_id=1
```

## Troubleshooting

### Issue: "Database Connection Failed"

**Solution:**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u tsg_user -p twin_shape_glow
# Enter password

# If connection fails, recreate user:
mysql -u root -p
DROP USER 'tsg_user'@'localhost';
CREATE USER 'tsg_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON twin_shape_glow.* TO 'tsg_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: "Moodle Connection Failed"

**Check Moodle prefix:**

```bash
mysql -u root -p moodle
SHOW TABLES LIKE 'mdl_%';
# Should show mdl_user, mdl_question, etc.

# If prefix is different (e.g., 'm_'), update config/database.php:
define('MOODLE_DB_PREFIX', 'm_');
```

### Issue: Blank Page / White Screen

**Enable error display:**

```bash
nano index.php
```

Add at top:

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

Check Apache/Nginx error log:

```bash
# Apache
sudo tail -f /var/log/apache2/error.log

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Issue: 404 on API Calls

**Check mod_rewrite:**

```bash
# Enable mod_rewrite
sudo a2enmod rewrite

# Restart Apache
sudo systemctl restart apache2
```

**Check .htaccess:**

```bash
# Verify .htaccess exists
ls -la /var/www/html/twin-shape-glow/.htaccess

# If missing, create from template
cp .htaccess.example .htaccess
```

### Issue: Shapes Not Displaying

**Check browser console:**

1. Press F12
2. Go to Console tab
3. Look for JavaScript errors

**Common fixes:**

```bash
# Check file permissions
ls -l js/

# Should be readable:
-rw-r--r-- 1 www-data www-data ... game-engine.js
-rw-r--r-- 1 www-data www-data ... shape-renderer.js
-rw-r--r-- 1 www-data www-data ... app.js

# Fix if needed:
sudo chmod 644 js/*.js
```

## Advanced Configuration

### Custom Shapes

Add to database:

```sql
USE twin_shape_glow;

INSERT INTO tsg_shapes (shape_name, shape_type, svg_path, default_color, similarity_group)
VALUES
('Diamond', 'custom', 'M 50 10 L 90 50 L 50 90 L 10 50 Z', '#FF6B6B', 10);
```

### Adjust Difficulty

Edit `includes/moodle_integration.php`:

```php
private function generateShapeConfig($difficulty) {
    $num_pairs = 3 + $difficulty; // Change from 2 to 3 for more shapes
    // ...
}
```

### Change Time Limits

Edit `includes/moodle_integration.php`:

```php
$time_limit = 90 + ($difficulty * 20); // Change formula
```

### Styling Smartphone Display

Edit `css/smartphone.css`:

```css
.smartphone-frame {
    width: 380px;  /* Change width */
    height: 760px; /* Change height */
}
```

## Performance Tuning

### Enable PHP OpCache

```bash
sudo nano /etc/php/7.1/apache2/php.ini
```

Add:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

Restart:

```bash
sudo systemctl restart apache2
```

### MySQL Query Optimization

```sql
USE twin_shape_glow;

-- Add indexes
ALTER TABLE tsg_user_progress ADD INDEX idx_last_attempt (last_attempt_at);
ALTER TABLE tsg_sessions ADD INDEX idx_started (started_at);

-- Optimize tables
OPTIMIZE TABLE tsg_problems;
OPTIMIZE TABLE tsg_user_progress;
```

## Backup and Restore

### Backup

```bash
# Database backup
mysqldump -u tsg_user -p twin_shape_glow > backup_$(date +%Y%m%d).sql

# Files backup
tar -czf twin-shape-glow-backup.tar.gz /var/www/html/twin-shape-glow
```

### Restore

```bash
# Restore database
mysql -u tsg_user -p twin_shape_glow < backup_20250118.sql

# Restore files
tar -xzf twin-shape-glow-backup.tar.gz -C /var/www/html/
```

## Next Steps

1. ✅ Installation complete
2. 📝 Create test problems from Moodle questions
3. 🎮 Test gameplay with students
4. 📊 Monitor progress via `tsg_user_progress` table
5. 🎨 Customize colors and shapes
6. 🔗 Embed in Moodle courses

## Support

Issues? Check:
- README.md for full documentation
- GitHub Issues: https://github.com/kaist/twin-shape-glow/issues
- Email: support@kaist-touchmath.edu

---

**Installation Time:** ~5-10 minutes
**Difficulty:** ⭐⭐☆☆☆ Intermediate
**Version:** 1.0.0
