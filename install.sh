#!/bin/bash

###############################################################################
# Dot Product Heat Visualization - Installation Script
# Compatible with Ubuntu/Debian systems
###############################################################################

set -e

echo "=========================================="
echo "  Dot Product Heat - Installation Script"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run this script as root${NC}"
    exit 1
fi

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check PHP version
echo "Checking PHP version..."
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -r 'echo PHP_VERSION;')
    print_status "PHP $PHP_VERSION installed"

    if php -r 'exit(version_compare(PHP_VERSION, "7.1.9", ">=") ? 0 : 1);'; then
        print_status "PHP version is compatible"
    else
        print_error "PHP 7.1.9 or higher is required"
        exit 1
    fi
else
    print_error "PHP is not installed"
    echo "Please install PHP 7.1.9 or higher"
    exit 1
fi

# Check MySQL
echo ""
echo "Checking MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | sed 's/,//')
    print_status "MySQL $MYSQL_VERSION installed"
else
    print_warning "MySQL client not found. Please ensure MySQL 5.7+ is installed"
fi

# Check required PHP extensions
echo ""
echo "Checking PHP extensions..."
REQUIRED_EXTENSIONS=("pdo" "pdo_mysql" "curl" "json" "mbstring")

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if php -m | grep -q "^$ext$"; then
        print_status "$ext extension installed"
    else
        print_error "$ext extension missing"
        echo "Install with: sudo apt-get install php-$ext"
        exit 1
    fi
done

# Database setup
echo ""
echo "=========================================="
echo "  Database Setup"
echo "=========================================="
echo ""
read -p "Do you want to set up the database now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "MySQL username [root]: " DB_USER
    DB_USER=${DB_USER:-root}

    read -sp "MySQL password: " DB_PASS
    echo

    read -p "Database name [dot_product_heat]: " DB_NAME
    DB_NAME=${DB_NAME:-dot_product_heat}

    echo ""
    echo "Creating database and importing schema..."

    if mysql -u "$DB_USER" -p"$DB_PASS" < database/schema.sql 2>/dev/null; then
        print_status "Database created successfully"
    else
        print_error "Failed to create database"
        print_warning "You can manually run: mysql -u $DB_USER -p < database/schema.sql"
    fi

    # Update config.php
    echo ""
    read -p "Update config.php with these credentials? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i "s/define('DB_USER', '.*');/define('DB_USER', '$DB_USER');/" config.php
        sed -i "s/define('DB_PASS', '.*');/define('DB_PASS', '$DB_PASS');/" config.php
        sed -i "s/define('DB_NAME', '.*');/define('DB_NAME', '$DB_NAME');/" config.php
        print_status "config.php updated"
    fi
fi

# Moodle configuration
echo ""
echo "=========================================="
echo "  Moodle Configuration (Optional)"
echo "=========================================="
echo ""
read -p "Do you want to configure Moodle integration? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Moodle URL (e.g., http://moodle.example.com): " MOODLE_URL
    read -p "Moodle Web Service Token: " MOODLE_TOKEN

    sed -i "s|define('MOODLE_URL', '.*');|define('MOODLE_URL', '$MOODLE_URL');|" config.php
    sed -i "s/define('MOODLE_TOKEN', '.*');/define('MOODLE_TOKEN', '$MOODLE_TOKEN');/" config.php
    print_status "Moodle configuration updated"
fi

# File permissions
echo ""
echo "=========================================="
echo "  Setting Permissions"
echo "=========================================="
echo ""

chmod 644 config.php
chmod 755 api/*.php
chmod 755 includes/*.php
chmod 644 css/*.css
chmod 644 js/*.js

print_status "File permissions set"

# Apache/Nginx detection
echo ""
echo "=========================================="
echo "  Web Server Configuration"
echo "=========================================="
echo ""

if systemctl is-active --quiet apache2; then
    print_status "Apache detected"
    echo ""
    echo "Add this VirtualHost configuration to Apache:"
    echo ""
    echo "<VirtualHost *:80>"
    echo "    ServerName dotproduct.local"
    echo "    DocumentRoot $(pwd)"
    echo "    <Directory $(pwd)>"
    echo "        AllowOverride All"
    echo "        Require all granted"
    echo "    </Directory>"
    echo "</VirtualHost>"
    echo ""
    echo "Then run:"
    echo "  sudo a2enmod rewrite headers expires deflate"
    echo "  sudo systemctl restart apache2"

elif systemctl is-active --quiet nginx; then
    print_status "Nginx detected"
    echo ""
    echo "Add this server block to Nginx:"
    echo ""
    echo "server {"
    echo "    listen 80;"
    echo "    server_name dotproduct.local;"
    echo "    root $(pwd);"
    echo "    index index.php;"
    echo ""
    echo "    location / {"
    echo "        try_files \$uri \$uri/ /index.php?\$query_string;"
    echo "    }"
    echo ""
    echo "    location ~ \.php$ {"
    echo "        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;"
    echo "        fastcgi_index index.php;"
    echo "        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;"
    echo "        include fastcgi_params;"
    echo "    }"
    echo "}"
    echo ""
    echo "Then run:"
    echo "  sudo systemctl restart nginx"
else
    print_warning "No web server detected (Apache or Nginx)"
    echo "Please install and configure Apache or Nginx"
fi

# Final instructions
echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
print_status "Installation completed successfully"
echo ""
echo "Next steps:"
echo "  1. Configure your web server (see instructions above)"
echo "  2. Add 'dotproduct.local' to /etc/hosts if testing locally"
echo "  3. Access the app at: http://dotproduct.local/index.php?user_id=1&problem_id=1"
echo ""
echo "For more information, see README.md"
echo ""
