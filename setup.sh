#!/bin/bash

# 3D Line Seq Setup Script
# This script automates the setup process for the 3D Line Seq plugin

set -e  # Exit on error

echo "========================================"
echo "3D Line Seq Setup Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Step 1: Check system requirements
print_info "Checking system requirements..."

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    print_success "PHP found: version $PHP_VERSION"
else
    print_error "PHP not found. Please install PHP 7.1.9 or higher."
    exit 1
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | cut -d " " -f 6 | cut -d "," -f 1)
    print_success "MySQL found: version $MYSQL_VERSION"
else
    print_error "MySQL not found. Please install MySQL 5.7 or higher."
    exit 1
fi

# Check wget or curl
if command -v wget &> /dev/null; then
    DOWNLOAD_CMD="wget -O"
    print_success "wget found"
elif command -v curl &> /dev/null; then
    DOWNLOAD_CMD="curl -o"
    print_success "curl found"
else
    print_error "Neither wget nor curl found. Please install one of them."
    exit 1
fi

echo ""

# Step 2: Download Three.js
print_info "Downloading Three.js library..."

THREEJS_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
THREEJS_PATH="webapp/lib/three.min.js"

# Create directory if it doesn't exist
mkdir -p webapp/lib

# Download Three.js
if [ "$DOWNLOAD_CMD" = "wget -O" ]; then
    wget -O "$THREEJS_PATH" "$THREEJS_URL" 2>&1 | grep -o "[0-9]*%" | tail -1
else
    curl -o "$THREEJS_PATH" "$THREEJS_URL"
fi

if [ -f "$THREEJS_PATH" ]; then
    FILE_SIZE=$(du -h "$THREEJS_PATH" | cut -f1)
    print_success "Three.js downloaded successfully ($FILE_SIZE)"
else
    print_error "Failed to download Three.js"
    exit 1
fi

echo ""

# Step 3: Ask for Moodle directory
print_info "Moodle Installation"
echo ""
echo "Do you want to install the plugin to Moodle now? (y/n)"
read -r INSTALL_TO_MOODLE

if [ "$INSTALL_TO_MOODLE" = "y" ] || [ "$INSTALL_TO_MOODLE" = "Y" ]; then
    echo "Enter the path to your Moodle installation directory:"
    echo "(e.g., /var/www/html/moodle)"
    read -r MOODLE_DIR

    if [ ! -d "$MOODLE_DIR" ]; then
        print_error "Moodle directory not found: $MOODLE_DIR"
        exit 1
    fi

    print_info "Installing plugin to Moodle..."

    # Copy plugin files
    sudo cp -r moodle-plugin/3dlineseq "$MOODLE_DIR/mod/"
    sudo cp -r webapp "$MOODLE_DIR/mod/3dlineseq/"

    # Set permissions
    sudo chown -R www-data:www-data "$MOODLE_DIR/mod/3dlineseq"
    sudo chmod -R 755 "$MOODLE_DIR/mod/3dlineseq"

    print_success "Plugin files copied to Moodle"

    echo ""
    print_info "Next steps:"
    echo "1. Open your Moodle site in a browser"
    echo "2. Log in as administrator"
    echo "3. Follow the database upgrade prompts"
    echo ""
    echo "Or run the CLI upgrade:"
    echo "  cd $MOODLE_DIR"
    echo "  sudo -u www-data php admin/cli/upgrade.php"
else
    print_info "Plugin files are ready in the 'moodle-plugin' directory"
    echo ""
    echo "To install manually:"
    echo "1. Copy moodle-plugin/3dlineseq to your_moodle/mod/"
    echo "2. Copy webapp to your_moodle/mod/3dlineseq/"
    echo "3. Run Moodle upgrade"
fi

echo ""

# Step 4: Create standalone webapp
print_info "Standalone Webapp Setup"
echo ""
echo "Do you want to set up the standalone webapp? (y/n)"
read -r SETUP_STANDALONE

if [ "$SETUP_STANDALONE" = "y" ] || [ "$SETUP_STANDALONE" = "Y" ]; then
    echo "Enter the path where you want to install the webapp:"
    echo "(e.g., /var/www/html/3dlineseq)"
    read -r WEBAPP_DIR

    print_info "Installing standalone webapp..."

    # Create directory
    sudo mkdir -p "$WEBAPP_DIR"

    # Copy webapp files
    sudo cp -r webapp/* "$WEBAPP_DIR/"

    # Set permissions
    sudo chown -R www-data:www-data "$WEBAPP_DIR"
    sudo chmod -R 755 "$WEBAPP_DIR"

    print_success "Webapp installed to $WEBAPP_DIR"

    echo ""
    print_info "Access the webapp at:"
    echo "  http://your-server/$(basename $WEBAPP_DIR)"
else
    print_info "Skipping standalone webapp setup"
fi

echo ""
echo "========================================"
echo "Setup Complete! 🎉"
echo "========================================"
echo ""
print_info "What's next?"
echo ""
echo "1. Review the README.md for usage instructions"
echo "2. Read INSTALL.md for detailed installation guide"
echo "3. Test the plugin by creating a 3D Line Seq activity"
echo ""
print_success "Happy visualizing!"
echo ""
