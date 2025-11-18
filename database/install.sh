#!/bin/bash
#
# Database Installation Script
# Creates database and imports schema
#

echo "Math Learning App - Database Installation"
echo "=========================================="
echo

# Load environment variables if .env exists
if [ -f ../config/.env ]; then
    export $(cat ../config/.env | xargs)
else
    echo "Warning: config/.env not found. Using default values."
fi

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-math_learning_app}"
DB_USER="${DB_USER:-root}"

echo "Database Configuration:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo

read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Prompt for password
read -sp "MySQL Password for $DB_USER: " DB_PASS
echo
echo

# Create database and import schema
echo "Creating database and importing schema..."

mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" < schema.sql

if [ $? -eq 0 ]; then
    echo
    echo "✅ Database installed successfully!"
    echo
    echo "Default accounts created:"
    echo "  Teacher: teacher / teacher123"
    echo "  Student: student / student123"
    echo
    echo "Next steps:"
    echo "  1. Configure config/.env with your database credentials"
    echo "  2. Point your web server to the 'public' directory"
    echo "  3. Access the application at http://localhost/login.php"
else
    echo
    echo "❌ Database installation failed!"
    echo "Please check your MySQL credentials and try again."
    exit 1
fi
