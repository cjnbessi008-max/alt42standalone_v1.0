# Installation Guide

## 📋 Requirements

### Minimum Requirements
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache 2.4+ or Nginx 1.10+
- **Disk Space**: 500 MB
- **RAM**: 1 GB minimum, 2 GB recommended

### Recommended for Development
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

## 🚀 Quick Start (Docker)

### 1. Clone Repository
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Wait for Services to Start
```bash
# Check if MySQL is ready
docker-compose logs -f mysql

# Wait for "ready for connections" message
```

### 4. Access Application
- **Student Interface**: http://localhost:8000/
- **Teacher Dashboard**: http://localhost:8000/dashboard.html
- **Login Page**: http://localhost:8000/login.html

### 5. Default Login Credentials
```
Student Account:
  Username: student1
  Password: password123

Teacher Account:
  Username: teacher1
  Password: password123

Admin Account:
  Username: admin
  Password: password123
```

### 6. Stop Services
```bash
docker-compose down
```

### 7. Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

## 🔧 Manual Installation

### Step 1: Install Dependencies

#### On Ubuntu/Debian
```bash
# Install PHP 7.1 and extensions
sudo apt-get update
sudo apt-get install -y php7.1 php7.1-mysql php7.1-cli php7.1-common php7.1-json php7.1-curl

# Install MySQL
sudo apt-get install -y mysql-server-5.7

# Install Apache
sudo apt-get install -y apache2 libapache2-mod-php7.1
```

#### On macOS (using Homebrew)
```bash
# Install PHP 7.1
brew install php@7.1

# Install MySQL 5.7
brew install mysql@5.7

# Install Apache (already included in macOS)
```

#### On Windows (using XAMPP)
1. Download XAMPP with PHP 7.1 from https://www.apachefriends.org/
2. Install XAMPP
3. Start Apache and MySQL from XAMPP Control Panel

### Step 2: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE focus_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON focus_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u lms_user -p focus_lms < database/schema.sql
```

### Step 3: Configure Application

```bash
# Copy example config
cp config/config.example.php public/api/config.php

# Edit configuration
nano public/api/config.php
# Update database credentials:
# 'username' => 'lms_user',
# 'password' => 'your_password',
```

### Step 4: Set Permissions

```bash
# Create logs directory
mkdir -p logs
chmod 755 logs

# Set proper permissions
chmod 755 public
chmod 644 public/api/*.php
```

### Step 5: Configure Web Server

#### Apache Configuration

Create virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName focus-lms.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/focus-lms-error.log
    CustomLog ${APACHE_LOG_DIR}/focus-lms-access.log combined
</VirtualHost>
```

Enable required modules:
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

Add to /etc/hosts:
```
127.0.0.1 focus-lms.local
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name focus-lms.local;
    root /path/to/alt42standalone_v1.0/public;

    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Step 6: Verify Installation

1. Open browser and navigate to http://focus-lms.local (or http://localhost if using default setup)
2. You should see the login page
3. Login with default credentials
4. Create a test session

## 🔐 Security Hardening (Production)

### 1. Change Default Credentials

```sql
# Login to MySQL
mysql -u root -p focus_lms

# Change passwords for default users
UPDATE users SET password_hash = PASSWORD('new_secure_password') WHERE username = 'student1';
UPDATE users SET password_hash = PASSWORD('new_secure_password') WHERE username = 'teacher1';
UPDATE users SET password_hash = PASSWORD('new_secure_password') WHERE username = 'admin';
```

### 2. Update JWT Secret

Edit `public/api/config.php`:
```php
'jwt_secret' => 'CHANGE_THIS_TO_SECURE_RANDOM_STRING_MIN_32_CHARACTERS',
```

Generate random string:
```bash
openssl rand -base64 32
```

### 3. Enable HTTPS

Using Let's Encrypt (Ubuntu):
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

### 4. Set Proper File Permissions

```bash
# Restrict config file access
chmod 600 public/api/config.php
chown www-data:www-data public/api/config.php

# Logs directory
chmod 755 logs
chown www-data:www-data logs
```

### 5. Update `public/api/config.php`

```php
'app' => [
    'environment' => 'production',
    'debug' => false,
],

'rate_limit' => [
    'enabled' => true,
],
```

## 🧪 Testing Installation

### Check PHP Configuration
```bash
php -v
php -m | grep -E 'pdo|mysql'
```

### Check MySQL Connection
```bash
mysql -u lms_user -p focus_lms -e "SHOW TABLES;"
```

### Test Web Server
```bash
curl http://localhost:8000/
```

### Run Sample API Request
```bash
curl -X POST http://localhost:8000/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"student1","password":"password123"}'
```

## 🐛 Troubleshooting

### MySQL Connection Failed

**Error**: `SQLSTATE[HY000] [2002] Connection refused`

**Solution**:
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Check config.php has correct credentials
```

### 404 Not Found for API Endpoints

**Solution**:
```bash
# Enable Apache mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Check .htaccess exists in public directory
ls -la public/.htaccess
```

### Permission Denied Errors

**Solution**:
```bash
# Set correct ownership
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0/public
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0/logs

# Set correct permissions
sudo chmod 755 public
sudo chmod 644 public/api/*.php
```

### PHP Extensions Missing

**Solution**:
```bash
# Install missing extensions
sudo apt-get install php7.1-mysql php7.1-json php7.1-curl

# Restart Apache
sudo systemctl restart apache2
```

## 📊 Database Backup

### Manual Backup
```bash
mysqldump -u lms_user -p focus_lms > backup_$(date +%Y%m%d).sql
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump -u lms_user -pYOUR_PASSWORD focus_lms > /backups/focus_lms_$(date +\%Y\%m\%d).sql
```

## 📈 Performance Optimization

### MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_size = 32M
query_cache_limit = 2M
max_connections = 100
```

### PHP Optimization

Edit `php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

## 📞 Support

- Documentation: [README.md](README.md)
- Issues: Create an issue on GitHub
- Email: support@example.com
