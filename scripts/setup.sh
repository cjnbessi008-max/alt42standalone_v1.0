#!/bin/bash
# Setup script for Moodle Integration - Prerequisite Gap Detection System

set -e

echo "=========================================="
echo "Moodle Integration - Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider running as regular user.${NC}"
fi

# Check PHP version
echo "Checking PHP version..."
PHP_VERSION=$(php -r "echo PHP_VERSION;" 2>/dev/null || echo "not found")
if [ "$PHP_VERSION" == "not found" ]; then
    echo -e "${RED}Error: PHP is not installed${NC}"
    exit 1
fi

PHP_MAJOR=$(echo $PHP_VERSION | cut -d. -f1)
PHP_MINOR=$(echo $PHP_VERSION | cut -d. -f2)

if [ "$PHP_MAJOR" -lt 7 ] || ([ "$PHP_MAJOR" -eq 7 ] && [ "$PHP_MINOR" -lt 1 ]); then
    echo -e "${RED}Error: PHP 7.1.9 or higher is required (found $PHP_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ PHP $PHP_VERSION found${NC}"

# Check required PHP extensions
echo ""
echo "Checking PHP extensions..."
REQUIRED_EXTENSIONS=("pdo" "pdo_mysql" "curl" "json")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if ! php -m | grep -q "^$ext$"; then
        MISSING_EXTENSIONS+=("$ext")
        echo -e "${RED}✗ Missing extension: $ext${NC}"
    else
        echo -e "${GREEN}✓ Extension $ext found${NC}"
    fi
done

if [ ${#MISSING_EXTENSIONS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required PHP extensions: ${MISSING_EXTENSIONS[*]}${NC}"
    echo "Install them with: sudo apt-get install php-pdo php-mysql php-curl php-json"
    exit 1
fi

# Check MySQL
echo ""
echo "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}Warning: MySQL client not found. Make sure MySQL 5.7+ is installed.${NC}"
else
    MYSQL_VERSION=$(mysql --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    echo -e "${GREEN}✓ MySQL client found (version $MYSQL_VERSION)${NC}"
fi

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p logs
mkdir -p moodle-integration
mkdir -p database
mkdir -p api
mkdir -p scripts
mkdir -p examples
mkdir -p docs

echo -e "${GREEN}✓ Directories created${NC}"

# Set permissions
echo ""
echo "Setting permissions..."
chmod 755 logs
chmod 755 scripts
chmod 755 examples
chmod +x scripts/*.php 2>/dev/null || true
chmod +x examples/*.sh 2>/dev/null || true

echo -e "${GREEN}✓ Permissions set${NC}"

# Create config file if it doesn't exist
echo ""
if [ ! -f "moodle-integration/config.php" ]; then
    echo "Creating configuration file..."

    if [ -f "moodle-integration/config.sample.php" ]; then
        cp moodle-integration/config.sample.php moodle-integration/config.php
        echo -e "${GREEN}✓ Created config.php from sample${NC}"
        echo -e "${YELLOW}⚠ Please edit moodle-integration/config.php with your settings${NC}"
    else
        echo -e "${YELLOW}⚠ config.sample.php not found, skipping${NC}"
    fi
else
    echo -e "${GREEN}✓ config.php already exists${NC}"
fi

# Database setup prompt
echo ""
echo "=========================================="
echo "Database Setup"
echo "=========================================="
echo ""
echo "Would you like to set up the database now? (y/n)"
read -r SETUP_DB

if [ "$SETUP_DB" == "y" ] || [ "$SETUP_DB" == "Y" ]; then
    echo ""
    echo "Enter MySQL root password:"
    read -s MYSQL_ROOT_PASSWORD

    echo ""
    echo "Creating database..."

    if mysql -u root -p"$MYSQL_ROOT_PASSWORD" < database/schema.sql 2>/dev/null; then
        echo -e "${GREEN}✓ Database created successfully${NC}"
    else
        echo -e "${RED}✗ Database creation failed${NC}"
        echo "You can run this manually: mysql -u root -p < database/schema.sql"
    fi
else
    echo "Skipping database setup. Run manually with:"
    echo "  mysql -u root -p < database/schema.sql"
fi

# Test PHP syntax
echo ""
echo "Testing PHP files..."
PHP_ERRORS=0

for file in moodle-integration/*.php api/*.php scripts/*.php; do
    if [ -f "$file" ]; then
        if php -l "$file" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $file${NC}"
        else
            echo -e "${RED}✗ $file has syntax errors${NC}"
            PHP_ERRORS=$((PHP_ERRORS + 1))
        fi
    fi
done

if [ $PHP_ERRORS -gt 0 ]; then
    echo -e "${RED}Found $PHP_ERRORS files with PHP syntax errors${NC}"
    exit 1
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit configuration:"
echo "   nano moodle-integration/config.php"
echo ""
echo "2. Set up Moodle Web Services:"
echo "   - Enable Web Services in Moodle"
echo "   - Create service token"
echo "   - Add token to config.php"
echo ""
echo "3. Test the connection:"
echo "   php examples/example_usage.php"
echo ""
echo "4. Set up API endpoint in web server (Apache/Nginx)"
echo ""
echo "5. (Optional) Set up cron for automatic sync:"
echo "   crontab -e"
echo "   0 * * * * /usr/bin/php $(pwd)/scripts/sync_scheduler.php"
echo ""
echo "For detailed instructions, see:"
echo "  docs/MOODLE_INTEGRATION.md"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
