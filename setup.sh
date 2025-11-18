#!/bin/bash

##############################################
# DMN Drift Tracker - Quick Setup Script
# Automates installation and configuration
##############################################

set -e  # Exit on error

echo "================================"
echo "DMN Drift Tracker Setup"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP 7.1.9 or higher."
    exit 1
fi
PHP_VERSION=$(php -r 'echo PHP_VERSION;')
echo "✓ PHP $PHP_VERSION found"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL 5.7 or higher."
    exit 1
fi
echo "✓ MySQL found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION found"

echo ""
echo "All prerequisites met!"
echo ""

# Database setup
echo "================================"
echo "Database Setup"
echo "================================"
read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASS
echo ""

read -p "Enter database name [dmn_drift_tracker]: " DB_NAME
DB_NAME=${DB_NAME:-dmn_drift_tracker}

read -p "Enter database user [dmn_user]: " DB_USER
DB_USER=${DB_USER:-dmn_user}

read -p "Enter database password: " -s DB_PASS
echo ""

echo "Creating database..."
mysql -u root -p"$MYSQL_ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✓ Database created"

echo "Applying schema..."
mysql -u root -p"$MYSQL_ROOT_PASS" "$DB_NAME" < database/schema.sql
echo "✓ Schema applied"

# Backend configuration
echo ""
echo "================================"
echo "Backend Configuration"
echo "================================"

if [ ! -f backend/config/.env ]; then
    cp backend/config/.env.example backend/config/.env
    echo "✓ Created .env file"

    # Update .env with database credentials
    sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" backend/config/.env
    sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" backend/config/.env
    sed -i "s/DB_PASS=.*/DB_PASS=$DB_PASS/" backend/config/.env

    echo "✓ Updated database configuration"
else
    echo "⚠ .env file already exists, skipping..."
fi

# Frontend setup
echo ""
echo "================================"
echo "Frontend Setup"
echo "================================"

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "⚠ node_modules already exists, skipping npm install..."
fi

# Create frontend .env
if [ ! -f .env ]; then
    echo "VITE_API_URL=http://localhost:8000/api" > .env
    echo "✓ Created frontend .env"
fi

cd ..

# Create log directory
echo ""
echo "Creating log directory..."
mkdir -p logs
chmod 777 logs
echo "✓ Log directory created"

# Completion
echo ""
echo "================================"
echo "✓ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the PHP backend:"
echo "   cd backend"
echo "   php -S localhost:8000 -t api"
echo ""
echo "2. In a new terminal, start the React frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "For Moodle integration, see docs/INSTALLATION.md"
echo ""
echo "================================"
