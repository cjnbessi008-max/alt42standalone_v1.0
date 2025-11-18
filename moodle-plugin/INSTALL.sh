#!/bin/bash

# Moodle Self-Explanation Plugin Installation Script
# For Moodle 3.7 + PHP 7.1.9 + MySQL 5.7

set -e

echo "================================================"
echo "Moodle Self-Explanation Plugin Installer"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}Warning: Running as root. It's recommended to run as the web server user.${NC}"
   read -p "Continue anyway? (y/n) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Get Moodle path
read -p "Enter your Moodle installation path (e.g., /var/www/html/moodle): " MOODLE_PATH

if [ ! -d "$MOODLE_PATH" ]; then
    echo -e "${RED}Error: Moodle path does not exist: $MOODLE_PATH${NC}"
    exit 1
fi

if [ ! -f "$MOODLE_PATH/version.php" ]; then
    echo -e "${RED}Error: Invalid Moodle installation (version.php not found)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found Moodle installation${NC}"

# Check Moodle version
MOODLE_VERSION=$(grep '$release' "$MOODLE_PATH/version.php" | head -1 | sed "s/.*'\(.*\)'.*/\1/")
echo "Moodle version: $MOODLE_VERSION"

# Destination path
DEST_PATH="$MOODLE_PATH/question/behaviour/qbehaviour_selfexplanation"

# Check if plugin already exists
if [ -d "$DEST_PATH" ]; then
    echo -e "${YELLOW}Warning: Plugin directory already exists${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DEST_PATH"
    else
        echo "Installation cancelled."
        exit 0
    fi
fi

# Copy plugin files
echo "Copying plugin files..."
mkdir -p "$DEST_PATH"
cp -r qbehaviour_selfexplanation/* "$DEST_PATH/"

# Get web server user
read -p "Enter web server user (e.g., www-data, apache, nginx): " WEB_USER

if ! id "$WEB_USER" &>/dev/null; then
    echo -e "${YELLOW}Warning: User $WEB_USER does not exist. Skipping permission change.${NC}"
else
    echo "Setting permissions..."
    chown -R "$WEB_USER:$WEB_USER" "$DEST_PATH"
    chmod -R 755 "$DEST_PATH"
    echo -e "${GREEN}✓ Permissions set${NC}"
fi

echo ""
echo -e "${GREEN}✓ Plugin files copied successfully${NC}"
echo ""
echo "================================================"
echo "Next Steps:"
echo "================================================"
echo ""
echo "1. Open your Moodle site in a web browser"
echo "2. Login as administrator"
echo "3. Go to: Site administration → Notifications"
echo "4. Click 'Upgrade Moodle database now'"
echo "5. Configure plugin at: Site administration → Plugins → Question behaviours → Self-explanation"
echo ""
echo "Optional: Set up Claude AI"
echo "- Get API key from: https://console.anthropic.com/"
echo "- Add key in plugin settings"
echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""

# Offer to purge caches
read -p "Purge Moodle caches now? (requires PHP CLI) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v php &> /dev/null; then
        echo "Purging caches..."
        php "$MOODLE_PATH/admin/cli/purge_caches.php"
        echo -e "${GREEN}✓ Caches purged${NC}"
    else
        echo -e "${YELLOW}PHP CLI not found. Please purge caches manually.${NC}"
    fi
fi

echo ""
echo "Happy teaching with self-explanation! 🎓"
