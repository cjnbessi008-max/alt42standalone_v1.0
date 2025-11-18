#!/bin/bash

# Hidden Length Installation Script
# This script helps set up the Hidden Length application

echo "🔦 Hidden Length - Installation Script"
echo "======================================"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL 5.7+ first."
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP 7.1+ first."
    exit 1
fi

echo "✅ MySQL found: $(mysql --version)"
echo "✅ PHP found: $(php -v | head -n 1)"
echo ""

# Prompt for database credentials
read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
echo ""
read -p "Enter database name [hidden_length]: " DB_NAME
DB_NAME=${DB_NAME:-hidden_length}

read -p "Enter database user [hidden_length_user]: " DB_USER
DB_USER=${DB_USER:-hidden_length_user}

read -p "Enter database password: " -s DB_PASSWORD
echo ""
echo ""

# Create database
echo "📦 Creating database..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
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
echo "📋 Importing database schema..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema imported successfully"
else
    echo "❌ Failed to import schema"
    exit 1
fi

# Create .env file
echo "⚙️ Creating .env file..."
cat > .env <<EOF
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD

APP_DEBUG=true
ALLOW_ORIGIN=*

MOODLE_ENABLED=false
MOODLE_URL=
MOODLE_TOKEN=
EOF

echo "✅ .env file created"
echo ""

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 public/
chmod 755 api/
chmod 644 public/*.html
chmod 644 public/css/*.css
chmod 644 public/js/*.js
chmod 644 api/*.php

echo "✅ Permissions set"
echo ""

# Summary
echo "======================================"
echo "✅ Installation completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure your web server (Apache/Nginx) to point to the 'public' directory"
echo "2. Restart your web server"
echo "3. Access the application in your browser"
echo ""
echo "For Moodle integration:"
echo "1. Enable Web Services in Moodle"
echo "2. Generate a Web Service token"
echo "3. Update MOODLE_* settings in .env file"
echo ""
echo "Database Info:"
echo "  Host: localhost"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "📚 See README.md for detailed documentation"
echo ""
