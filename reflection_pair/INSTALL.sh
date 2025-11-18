#!/bin/bash
# Reflection Pair Installation Script
# For Moodle 3.7 + PHP 7.1.9 + MySQL 5.7

set -e

echo "========================================="
echo "Reflection Pair Installation Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for database operations
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: Some operations may require sudo privileges${NC}"
fi

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Check PHP version
echo "Step 1: Checking PHP version..."
PHP_VERSION=$(php -r "echo PHP_VERSION;" 2>/dev/null || echo "not found")

if [ "$PHP_VERSION" = "not found" ]; then
    print_error "PHP not found. Please install PHP 7.1.9 or higher"
    exit 1
fi

PHP_MAJOR=$(echo $PHP_VERSION | cut -d. -f1)
PHP_MINOR=$(echo $PHP_VERSION | cut -d. -f2)

if [ "$PHP_MAJOR" -ge 7 ] && [ "$PHP_MINOR" -ge 1 ]; then
    print_success "PHP version $PHP_VERSION is compatible"
else
    print_error "PHP version $PHP_VERSION is not compatible. Need PHP 7.1.9+"
    exit 1
fi

# Step 2: Check required PHP extensions
echo ""
echo "Step 2: Checking required PHP extensions..."
REQUIRED_EXTS=("pdo_mysql" "json" "mbstring")

for ext in "${REQUIRED_EXTS[@]}"; do
    if php -m | grep -q "$ext"; then
        print_success "$ext extension installed"
    else
        print_error "$ext extension not found"
        echo "Install with: sudo apt-get install php-$ext"
        exit 1
    fi
done

# Step 3: Check MySQL
echo ""
echo "Step 3: Checking MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | cut -d, -f1)
    print_success "MySQL version $MYSQL_VERSION found"
else
    print_error "MySQL not found. Please install MySQL 5.7 or higher"
    exit 1
fi

# Step 4: Database setup
echo ""
echo "Step 4: Database configuration..."
print_info "Please provide database connection details"
echo ""

read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database name [moodle_reflection_pair]: " DB_NAME
DB_NAME=${DB_NAME:-moodle_reflection_pair}

read -p "Database user [moodle_user]: " DB_USER
DB_USER=${DB_USER:-moodle_user}

read -sp "Database password: " DB_PASS
echo ""

read -p "MySQL root password (for creating database): " -s MYSQL_ROOT_PASS
echo ""

# Create database
echo ""
echo "Creating database..."
mysql -u root -p"$MYSQL_ROOT_PASS" <<EOF 2>/dev/null
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    print_success "Database created successfully"
else
    print_error "Failed to create database"
    exit 1
fi

# Import schema
echo "Importing database schema..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/schema.sql

if [ $? -eq 0 ]; then
    print_success "Schema imported successfully"
else
    print_error "Failed to import schema"
    exit 1
fi

# Step 5: Create config file
echo ""
echo "Step 5: Creating configuration file..."

cat > config/db_config.ini <<EOF
[database]
host = $DB_HOST
db_name = $DB_NAME
username = $DB_USER
password = $DB_PASS
charset = utf8mb4
collation = utf8mb4_unicode_ci

[moodle]
version = 3.7
EOF

chmod 600 config/db_config.ini
print_success "Configuration file created"

# Step 6: Set permissions
echo ""
echo "Step 6: Setting file permissions..."
chmod 755 api/*.php
chmod 644 assets/css/*.css
chmod 644 assets/js/*.js
chmod 644 views/*.html
print_success "Permissions set"

# Step 7: Test installation
echo ""
echo "Step 7: Testing installation..."
php -r "
require_once 'config/database.php';
\$db = new Database();
\$db->loadConfig();
\$conn = \$db->getConnection();
if (\$conn) {
    echo 'Database connection: OK\n';
    exit(0);
} else {
    echo 'Database connection: FAILED\n';
    exit(1);
}
"

if [ $? -eq 0 ]; then
    print_success "Installation test passed"
else
    print_error "Installation test failed"
    exit 1
fi

# Summary
echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
print_info "Next steps:"
echo "  1. Configure your web server to serve the application"
echo "  2. Open views/index.html in your browser"
echo "  3. Integrate with Moodle (see README.md for details)"
echo ""
print_info "Configuration file: config/db_config.ini"
print_info "Documentation: README.md"
echo ""
echo "Access the application at:"
echo "  http://your-server/reflection_pair/views/index.html"
echo ""
print_success "Installation successful!"
