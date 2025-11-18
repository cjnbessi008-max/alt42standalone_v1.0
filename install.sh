#!/bin/bash

# Sequence Puzzle Installation Script
# This script helps set up the Sequence Puzzle application

echo "========================================="
echo "   Sequence Puzzle Installation"
echo "========================================="
echo ""

# Check PHP version
echo "Checking PHP version..."
PHP_VERSION=$(php -r 'echo PHP_VERSION;')
echo "PHP version: $PHP_VERSION"

if php -r 'exit(version_compare(PHP_VERSION, "7.1.9", "<") ? 0 : 1);' ; then
    echo "✗ PHP version must be 7.1.9 or higher"
    exit 1
fi
echo "✓ PHP version OK"
echo ""

# Check MySQL
echo "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "✗ MySQL is not installed"
    exit 1
fi
echo "✓ MySQL found"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠ Please edit .env file with your database credentials"
else
    echo "ℹ .env file already exists"
fi
echo ""

# Database setup
echo "Database Setup"
echo "-------------"
read -p "Do you want to set up the database now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Load .env variables
    export $(cat .env | grep -v '^#' | xargs)

    read -p "MySQL root password: " -s MYSQL_ROOT_PASS
    echo ""

    # Create database
    echo "Creating database '$DB_NAME'..."
    mysql -u root -p"$MYSQL_ROOT_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✓ Database created"

        # Import schema
        echo "Importing database schema..."
        mysql -u root -p"$MYSQL_ROOT_PASS" "$DB_NAME" < database/schema.sql 2>/dev/null

        if [ $? -eq 0 ]; then
            echo "✓ Database schema imported successfully"
        else
            echo "✗ Failed to import database schema"
            exit 1
        fi
    else
        echo "✗ Failed to create database"
        exit 1
    fi
fi
echo ""

# Set permissions
echo "Setting file permissions..."
chmod 755 public
chmod 644 public/*.php
chmod 644 config/*.php
chmod 644 src/*/*.php
echo "✓ Permissions set"
echo ""

# Check Apache modules
echo "Checking Apache modules..."
if command -v apache2ctl &> /dev/null; then
    if apache2ctl -M 2>/dev/null | grep -q "rewrite"; then
        echo "✓ mod_rewrite is enabled"
    else
        echo "⚠ mod_rewrite is not enabled"
        echo "  Run: sudo a2enmod rewrite"
    fi

    if apache2ctl -M 2>/dev/null | grep -q "headers"; then
        echo "✓ mod_headers is enabled"
    else
        echo "⚠ mod_headers is not enabled"
        echo "  Run: sudo a2enmod headers"
    fi
else
    echo "ℹ Apache not found or not using apache2ctl"
fi
echo ""

# Final instructions
echo "========================================="
echo "   Installation Summary"
echo "========================================="
echo ""
echo "✓ Environment file created"
echo "✓ Database set up (if selected)"
echo "✓ Permissions configured"
echo ""
echo "Next Steps:"
echo "----------"
echo "1. Edit .env file with your configuration"
echo "2. Configure your web server to point to the 'public' directory"
echo "3. Set up Moodle LTI integration (see README.md)"
echo "4. Access the application in your browser"
echo ""
echo "For demo mode, access: http://localhost/index.php"
echo "(Make sure DEBUG_MODE=true in .env)"
echo ""
echo "For full documentation, see README.md"
echo ""

exit 0
