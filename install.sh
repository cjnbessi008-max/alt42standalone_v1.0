#!/bin/bash

# Pattern Loop Animation System - Installation Script
# Compatible with PHP 7.1.9, MySQL 5.7, Moodle 3.7

echo "========================================="
echo "Pattern Loop Animation System"
echo "Installation Script"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo "Checking MySQL..."
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL found${NC}"
else
    echo -e "${RED}✗ MySQL not found. Please install MySQL 5.7+${NC}"
    exit 1
fi

# Check if PHP is installed
echo "Checking PHP..."
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -r "echo PHP_VERSION;")
    echo -e "${GREEN}✓ PHP found (version: $PHP_VERSION)${NC}"
else
    echo -e "${RED}✗ PHP not found. Please install PHP 7.1.9+${NC}"
    exit 1
fi

# Database setup
echo ""
echo "========================================="
echo "Database Setup"
echo "========================================="
read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
echo ""
read -p "Enter database name [pattern_loop_db]: " DB_NAME
DB_NAME=${DB_NAME:-pattern_loop_db}

read -p "Enter database user [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -p "Enter database password: " -s DB_PASSWORD
echo ""

# Import database schema
echo ""
echo "Creating database and importing schema..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" < database/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database setup completed${NC}"
else
    echo -e "${RED}✗ Database setup failed${NC}"
    exit 1
fi

# Create config file
echo ""
echo "Creating configuration file..."
CONFIG_FILE="app/config/config.local.php"

cat > "$CONFIG_FILE" << EOF
<?php
/**
 * Local Configuration
 * This file is ignored by Git
 */

define('DB_HOST', 'localhost');
define('DB_NAME', '$DB_NAME');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASSWORD');
define('DB_CHARSET', 'utf8mb4');

// Update other settings in app/config/config.php
EOF

echo -e "${GREEN}✓ Configuration file created: $CONFIG_FILE${NC}"

# Set permissions
echo ""
echo "Setting permissions..."
chmod -R 755 public/
chmod -R 755 app/

echo -e "${GREEN}✓ Permissions set${NC}"

# Summary
echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Configure Moodle connection in app/config/config.php"
echo "2. Set up your web server (Apache or Nginx)"
echo "3. Access the application at http://your-domain/"
echo ""
echo "For more information, see README.md"
echo ""
