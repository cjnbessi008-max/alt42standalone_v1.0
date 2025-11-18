# Number Beat - Quick Start Guide

## 5-Minute Setup (Development)

### Prerequisites

- PHP 7.1.9+
- MySQL 5.7+
- Apache with mod_rewrite

### Installation Steps

```bash
# 1. Clone/Download project
cd /var/www/html
git clone <repository-url> number-beat
cd number-beat

# 2. Create database
mysql -u root -p << EOF
CREATE DATABASE number_beat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nb_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL ON number_beat.* TO 'nb_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. Import schema
mysql -u nb_user -p number_beat < database/schema.sql

# 4. Configure
cp .env.example .env
nano .env
# Update DB_USER=nb_user and DB_PASS=password123

# 5. Set permissions
chmod -R 755 .
chown -R www-data:www-data .

# 6. Enable Apache mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Access Application

Open browser: `http://localhost/number-beat/public/`

### Test

1. Student ID: 1
2. Difficulty: Easy
3. Click "게임 시작"
4. Play!

## Default Login

- Student ID: 1 (김철수)
- Pre-loaded with 5 sample problems

## Next Steps

- [Full Installation Guide](docs/INSTALLATION.md)
- [Moodle Integration](docs/MOODLE_INTEGRATION.md)
- [API Documentation](README.md#api-endpoints)

## Troubleshooting

**Can't connect to database?**
```bash
sudo systemctl status mysql
# Update credentials in config/config.php
```

**404 errors?**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
# Check .htaccess in public/
```

**No audio?**
- Click anywhere on page first (browser autoplay policy)
- Audio files are optional (Web Audio API fallback included)

## Quick Commands

```bash
# View problems
mysql -u nb_user -p number_beat -e "SELECT id, title, difficulty_level FROM problems;"

# View students
mysql -u nb_user -p number_beat -e "SELECT * FROM students;"

# View logs
mysql -u nb_user -p number_beat -e "SELECT * FROM moodle_sync_log ORDER BY synced_at DESC LIMIT 5;"

# Enable debug
# Edit config/config.php: define('DEBUG_MODE', true);

# Restart Apache
sudo systemctl restart apache2
```

## Production Deployment

1. Set `DEBUG_MODE = false` in config.php
2. Use HTTPS (SSL certificate)
3. Change database passwords
4. Set up proper CORS origins
5. Enable PHP OPcache
6. Set up automated backups

See [INSTALLATION.md](docs/INSTALLATION.md) for details.
