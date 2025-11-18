#!/bin/bash

# Set MiniMap Installation Script
# For Linux/Mac systems

echo "======================================"
echo "  Set MiniMap Installation"
echo "======================================"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP first."
    exit 1
fi

# Get MySQL credentials
echo "Please enter your MySQL credentials:"
read -p "MySQL Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL Root User [root]: " DB_ROOT_USER
DB_ROOT_USER=${DB_ROOT_USER:-root}

read -sp "MySQL Root Password: " DB_ROOT_PASS
echo ""

read -p "Database Name [set_minimap]: " DB_NAME
DB_NAME=${DB_NAME:-set_minimap}

read -p "Database User [set_minimap_user]: " DB_USER
DB_USER=${DB_USER:-set_minimap_user}

read -sp "Database Password: " DB_PASS
echo ""
echo ""

# Create database
echo "Creating database..."
mysql -h "$DB_HOST" -u "$DB_ROOT_USER" -p"$DB_ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Import schema
echo "Importing database schema..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema imported successfully"
else
    echo "❌ Failed to import schema"
    exit 1
fi

# Update config.php
echo "Updating configuration..."
CONFIG_FILE="api/config.php"

# Backup original config
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

# Update database settings
sed -i "s/define('DB_HOST', 'localhost');/define('DB_HOST', '$DB_HOST');/" "$CONFIG_FILE"
sed -i "s/define('DB_NAME', 'set_minimap');/define('DB_NAME', '$DB_NAME');/" "$CONFIG_FILE"
sed -i "s/define('DB_USER', 'root');/define('DB_USER', '$DB_USER');/" "$CONFIG_FILE"
sed -i "s/define('DB_PASS', '');/define('DB_PASS', '$DB_PASS');/" "$CONFIG_FILE"

echo "✅ Configuration updated"

# Get Moodle settings
echo ""
echo "Moodle Integration (optional - press Enter to skip):"
read -p "Moodle URL: " MOODLE_URL
read -p "Moodle Web Service Token: " MOODLE_TOKEN

if [ ! -z "$MOODLE_URL" ]; then
    sed -i "s|define('MOODLE_URL', 'http://localhost/moodle');|define('MOODLE_URL', '$MOODLE_URL');|" "$CONFIG_FILE"
fi

if [ ! -z "$MOODLE_TOKEN" ]; then
    sed -i "s/define('MOODLE_TOKEN', '');/define('MOODLE_TOKEN', '$MOODLE_TOKEN');/" "$CONFIG_FILE"
fi

echo ""
echo "======================================"
echo "  Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start your web server (Apache/Nginx)"
echo "2. Navigate to the public directory"
echo "3. Open index.html in your browser"
echo ""
echo "For development, you can use PHP built-in server:"
echo "  cd public"
echo "  php -S localhost:8000"
echo "  Open http://localhost:8000 in your browser"
echo ""
echo "Configuration backup saved to: $CONFIG_FILE.backup"
echo ""
