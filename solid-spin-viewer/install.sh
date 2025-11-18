#!/bin/bash

###############################################################################
# Solid Spin Viewer - Installation Script
# Compatible with MySQL 5.7, PHP 7.1.9, Moodle 3.7
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "========================================"
    print_message "$BLUE" "  $1"
    print_message "$BLUE" "========================================"
    echo ""
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_message "$YELLOW" "Warning: Running as root. This is not recommended for production."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"

    # Check PHP
    if ! command -v php &> /dev/null; then
        print_message "$RED" "✗ PHP is not installed"
        exit 1
    fi

    PHP_VERSION=$(php -r 'echo PHP_VERSION;')
    print_message "$GREEN" "✓ PHP version: $PHP_VERSION"

    # Check MySQL
    if ! command -v mysql &> /dev/null; then
        print_message "$RED" "✗ MySQL client is not installed"
        exit 1
    fi

    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | sed 's/,//')
    print_message "$GREEN" "✓ MySQL version: $MYSQL_VERSION"

    # Check PHP extensions
    print_message "$BLUE" "Checking PHP extensions..."

    REQUIRED_EXTENSIONS=("pdo" "pdo_mysql" "json" "mbstring")
    for ext in "${REQUIRED_EXTENSIONS[@]}"; do
        if php -m | grep -q "$ext"; then
            print_message "$GREEN" "  ✓ $ext"
        else
            print_message "$RED" "  ✗ $ext (missing)"
            MISSING_EXTENSIONS=1
        fi
    done

    if [ ! -z "$MISSING_EXTENSIONS" ]; then
        print_message "$RED" "Please install missing PHP extensions"
        exit 1
    fi
}

# Load environment variables
load_env() {
    if [ -f .env ]; then
        print_message "$YELLOW" "Loading existing .env file..."
        export $(cat .env | grep -v '^#' | xargs)
    else
        print_message "$YELLOW" ".env file not found. Creating from template..."
        cp .env.example .env
    fi
}

# Configure database
configure_database() {
    print_header "Database Configuration"

    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Database port [3306]: " DB_PORT
    DB_PORT=${DB_PORT:-3306}

    read -p "Database name [solid_spin_viewer]: " DB_NAME
    DB_NAME=${DB_NAME:-solid_spin_viewer}

    read -p "Database user [root]: " DB_USER
    DB_USER=${DB_USER:-root}

    read -sp "Database password: " DB_PASS
    echo ""

    # Update .env file
    sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
    sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
    sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
    sed -i "s/DB_PASS=.*/DB_PASS=$DB_PASS/" .env

    print_message "$GREEN" "✓ Database configuration saved"
}

# Configure Moodle connection
configure_moodle() {
    print_header "Moodle Configuration (Optional)"

    read -p "Configure Moodle integration? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Moodle database host [localhost]: " MOODLE_DB_HOST
        MOODLE_DB_HOST=${MOODLE_DB_HOST:-localhost}

        read -p "Moodle database port [3306]: " MOODLE_DB_PORT
        MOODLE_DB_PORT=${MOODLE_DB_PORT:-3306}

        read -p "Moodle database name [moodle]: " MOODLE_DB_NAME
        MOODLE_DB_NAME=${MOODLE_DB_NAME:-moodle}

        read -p "Moodle database user [root]: " MOODLE_DB_USER
        MOODLE_DB_USER=${MOODLE_DB_USER:-root}

        read -sp "Moodle database password: " MOODLE_DB_PASS
        echo ""

        read -p "Moodle table prefix [mdl_]: " MOODLE_DB_PREFIX
        MOODLE_DB_PREFIX=${MOODLE_DB_PREFIX:-mdl_}

        # Update .env file
        sed -i "s/MOODLE_DB_HOST=.*/MOODLE_DB_HOST=$MOODLE_DB_HOST/" .env
        sed -i "s/MOODLE_DB_PORT=.*/MOODLE_DB_PORT=$MOODLE_DB_PORT/" .env
        sed -i "s/MOODLE_DB_NAME=.*/MOODLE_DB_NAME=$MOODLE_DB_NAME/" .env
        sed -i "s/MOODLE_DB_USER=.*/MOODLE_DB_USER=$MOODLE_DB_USER/" .env
        sed -i "s/MOODLE_DB_PASS=.*/MOODLE_DB_PASS=$MOODLE_DB_PASS/" .env
        sed -i "s/MOODLE_DB_PREFIX=.*/MOODLE_DB_PREFIX=$MOODLE_DB_PREFIX/" .env

        print_message "$GREEN" "✓ Moodle configuration saved"
    fi
}

# Create database
create_database() {
    print_header "Creating Database"

    print_message "$BLUE" "Creating database: $DB_NAME"

    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✓ Database created successfully"
    else
        print_message "$RED" "✗ Failed to create database"
        exit 1
    fi
}

# Import schema
import_schema() {
    print_header "Importing Database Schema"

    if [ ! -f sql/schema.sql ]; then
        print_message "$RED" "✗ Schema file not found: sql/schema.sql"
        exit 1
    fi

    print_message "$BLUE" "Importing schema..."

    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < sql/schema.sql

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✓ Schema imported successfully"
    else
        print_message "$RED" "✗ Failed to import schema"
        exit 1
    fi
}

# Set permissions
set_permissions() {
    print_header "Setting Permissions"

    # Set .env file permissions
    chmod 600 .env
    print_message "$GREEN" "✓ Set .env permissions to 600"

    # Set directory permissions
    chmod 755 public
    chmod 755 public/api
    chmod 755 public/css
    chmod 755 public/js
    print_message "$GREEN" "✓ Set directory permissions"

    # Set file permissions
    find public -type f -exec chmod 644 {} \;
    print_message "$GREEN" "✓ Set file permissions"
}

# Test installation
test_installation() {
    print_header "Testing Installation"

    # Test database connection
    print_message "$BLUE" "Testing database connection..."

    TEST_QUERY="SELECT COUNT(*) as count FROM solid_shapes;"
    RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "$TEST_QUERY" 2>&1)

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✓ Database connection successful"
        print_message "$GREEN" "  Found $RESULT solid shapes in database"
    else
        print_message "$RED" "✗ Database connection failed"
        echo "$RESULT"
        exit 1
    fi
}

# Display completion message
display_completion() {
    print_header "Installation Complete!"

    echo ""
    print_message "$GREEN" "✓ Solid Spin Viewer has been installed successfully!"
    echo ""

    print_message "$BLUE" "Next steps:"
    echo "  1. Configure your web server (Apache/Nginx)"
    echo "  2. Access the application at: http://your-domain.com/solid-spin-viewer/public/"
    echo ""

    print_message "$YELLOW" "Configuration file: .env"
    print_message "$YELLOW" "Database: $DB_NAME"
    print_message "$YELLOW" "Documentation: README.md"
    echo ""

    print_message "$BLUE" "Example URLs:"
    echo "  - Standalone: http://your-domain.com/solid-spin-viewer/public/"
    echo "  - With question: http://your-domain.com/solid-spin-viewer/public/?question_id=123"
    echo "  - API test: http://your-domain.com/solid-spin-viewer/public/api/get_shapes.php"
    echo ""
}

# Main installation flow
main() {
    clear
    print_header "Solid Spin Viewer - Installation"

    print_message "$BLUE" "This script will install and configure Solid Spin Viewer"
    echo ""

    # check_root
    check_requirements

    load_env
    configure_database
    configure_moodle

    create_database
    import_schema

    set_permissions
    test_installation

    display_completion
}

# Run main function
main
