#!/bin/bash

# Magnitude Wave Visualizer - Installation Script
# For Linux/Unix systems with Apache/Nginx + PHP + MySQL

echo "================================================"
echo "Magnitude Wave Visualizer - Installation"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Not running as root. Some operations may fail.${NC}"
    echo "Consider running with sudo."
    echo ""
fi

# Step 1: Check requirements
echo "Step 1: Checking system requirements..."
echo "----------------------------------------"

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    echo -e "${GREEN}✓${NC} PHP found: version $PHP_VERSION"
else
    echo -e "${RED}✗${NC} PHP not found. Please install PHP 7.1 or higher."
    exit 1
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓${NC} MySQL found"
else
    echo -e "${YELLOW}!${NC} MySQL command not found. Make sure MySQL is installed."
fi

# Check web server
if command -v apache2 &> /dev/null; then
    echo -e "${GREEN}✓${NC} Apache web server found"
    WEB_SERVER="apache"
elif command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓${NC} Nginx web server found"
    WEB_SERVER="nginx"
else
    echo -e "${YELLOW}!${NC} No web server detected. Install Apache or Nginx."
fi

echo ""

# Step 2: Create logs directory
echo "Step 2: Creating logs directory..."
echo "----------------------------------------"

mkdir -p logs
chmod 755 logs

if [ -d "logs" ]; then
    echo -e "${GREEN}✓${NC} Logs directory created"
else
    echo -e "${RED}✗${NC} Failed to create logs directory"
fi

echo ""

# Step 3: Database setup
echo "Step 3: Database setup..."
echo "----------------------------------------"
echo "Would you like to set up the database now? (y/n)"
read -r SETUP_DB

if [ "$SETUP_DB" = "y" ] || [ "$SETUP_DB" = "Y" ]; then
    echo ""
    echo "Enter MySQL root password:"
    read -s MYSQL_ROOT_PASSWORD

    echo ""
    echo "Creating database and tables..."

    mysql -u root -p"$MYSQL_ROOT_PASSWORD" < database/schema.sql

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Database schema created successfully"

        echo ""
        echo "Would you like to insert sample data? (y/n)"
        read -r INSERT_SAMPLE

        if [ "$INSERT_SAMPLE" = "y" ] || [ "$INSERT_SAMPLE" = "Y" ]; then
            mysql -u root -p"$MYSQL_ROOT_PASSWORD" < database/sample_data.sql

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Sample data inserted successfully"
            else
                echo -e "${RED}✗${NC} Failed to insert sample data"
            fi
        fi
    else
        echo -e "${RED}✗${NC} Failed to create database schema"
        echo "You can manually run: mysql -u root -p < database/schema.sql"
    fi
else
    echo "Skipping database setup. You can manually run:"
    echo "  mysql -u root -p < database/schema.sql"
    echo "  mysql -u root -p < database/sample_data.sql"
fi

echo ""

# Step 4: Configuration
echo "Step 4: Configuration..."
echo "----------------------------------------"
echo "Would you like to configure the application now? (y/n)"
read -r CONFIGURE

if [ "$CONFIGURE" = "y" ] || [ "$CONFIGURE" = "Y" ]; then
    echo ""
    echo "Enter database host (default: localhost):"
    read -r DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    echo "Enter database name (default: magnitude_wave_db):"
    read -r DB_NAME
    DB_NAME=${DB_NAME:-magnitude_wave_db}

    echo "Enter database user (default: root):"
    read -r DB_USER
    DB_USER=${DB_USER:-root}

    echo "Enter database password:"
    read -s DB_PASSWORD

    # Update config.php
    sed -i "s/define('DB_HOST', 'localhost');/define('DB_HOST', '$DB_HOST');/" config.php
    sed -i "s/define('DB_NAME', 'magnitude_wave_db');/define('DB_NAME', '$DB_NAME');/" config.php
    sed -i "s/define('DB_USER', 'root');/define('DB_USER', '$DB_USER');/" config.php
    sed -i "s/define('DB_PASS', '');/define('DB_PASS', '$DB_PASSWORD');/" config.php

    echo -e "${GREEN}✓${NC} Configuration updated"
else
    echo "Skipping configuration. Please manually edit config.php"
fi

echo ""

# Step 5: Set permissions
echo "Step 5: Setting file permissions..."
echo "----------------------------------------"

if [ "$WEB_SERVER" = "apache" ]; then
    WEB_USER="www-data"
elif [ "$WEB_SERVER" = "nginx" ]; then
    WEB_USER="nginx"
else
    WEB_USER="www-data"
fi

echo "Setting owner to $WEB_USER..."

if [ "$EUID" -eq 0 ]; then
    chown -R $WEB_USER:$WEB_USER .
    chmod -R 755 .
    chmod -R 755 logs
    echo -e "${GREEN}✓${NC} Permissions set"
else
    echo -e "${YELLOW}!${NC} Need root privileges to set ownership"
    echo "Run manually: sudo chown -R $WEB_USER:$WEB_USER ."
fi

echo ""

# Step 6: Test installation
echo "Step 6: Testing installation..."
echo "----------------------------------------"

# Check if files exist
FILES_OK=true

for file in index.html config.php css/style.css js/magnitude-wave.js js/moodle-integration.js; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file not found"
        FILES_OK=false
    fi
done

echo ""

# Final summary
echo "================================================"
echo "Installation Summary"
echo "================================================"

if [ "$FILES_OK" = true ]; then
    echo -e "${GREEN}✓${NC} All files are in place"
    echo ""
    echo "Next steps:"
    echo "1. Make sure your web server is configured to serve this directory"
    echo "2. Access the application at: http://your-domain/magnitude-wave/"
    echo "3. Check logs/app.log for any errors"
    echo ""
    echo "For Moodle integration:"
    echo "- Edit config.php and set MOODLE_PATH to your Moodle installation"
    echo "- Use iframe embed or External Tool (LTI) in Moodle"
    echo ""
    echo -e "${GREEN}Installation completed successfully!${NC}"
else
    echo -e "${RED}Some files are missing. Please check the installation.${NC}"
fi

echo ""
echo "For more information, see README.md"
echo "================================================"
