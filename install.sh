#!/bin/bash

#############################################
# Roll Along App - Installation Script
# Compatible with Ubuntu/Debian Linux
#############################################

set -e

echo "======================================"
echo "Roll Along App - 설치 스크립트"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}이 스크립트는 root 권한으로 실행해야 합니다${NC}"
    echo "sudo ./install.sh 명령을 사용하세요"
    exit 1
fi

echo "설치를 시작합니다..."
echo ""

# Check system requirements
echo -e "${YELLOW}[1/7] 시스템 요구사항 확인...${NC}"
php_version=$(php -v 2>/dev/null | grep -oP 'PHP \K[0-9.]+' | head -1)
if [ -z "$php_version" ]; then
    echo -e "${RED}PHP가 설치되어 있지 않습니다${NC}"
    echo "PHP 7.1.9 이상을 설치해주세요: sudo apt install php php-mysql"
    exit 1
else
    echo -e "${GREEN}✓ PHP $php_version 발견${NC}"
fi

mysql_version=$(mysql --version 2>/dev/null | grep -oP 'Distrib \K[0-9.]+' | head -1)
if [ -z "$mysql_version" ]; then
    echo -e "${YELLOW}⚠ MySQL이 설치되어 있지 않습니다${NC}"
    echo "MySQL 5.7 이상을 설치해주세요: sudo apt install mysql-server"
else
    echo -e "${GREEN}✓ MySQL $mysql_version 발견${NC}"
fi

# Get installation directory
echo ""
echo -e "${YELLOW}[2/7] 설치 경로 설정...${NC}"
read -p "웹 서버 디렉토리 경로를 입력하세요 [/var/www/html]: " webroot
webroot=${webroot:-/var/www/html}

install_dir="$webroot/roll-along"
echo "설치 경로: $install_dir"

# Create directory
echo ""
echo -e "${YELLOW}[3/7] 디렉토리 생성...${NC}"
mkdir -p "$install_dir"

# Copy files
echo ""
echo -e "${YELLOW}[4/7] 파일 복사...${NC}"
cp -r public/* "$install_dir/"
echo -e "${GREEN}✓ 파일 복사 완료${NC}"

# Set permissions
echo ""
echo -e "${YELLOW}[5/7] 권한 설정...${NC}"
chown -R www-data:www-data "$install_dir"
chmod -R 755 "$install_dir"
echo -e "${GREEN}✓ 권한 설정 완료${NC}"

# Database setup
echo ""
echo -e "${YELLOW}[6/7] 데이터베이스 설정...${NC}"
read -p "데이터베이스를 설정하시겠습니까? (y/n) [y]: " setup_db
setup_db=${setup_db:-y}

if [ "$setup_db" = "y" ]; then
    read -p "MySQL 호스트 [localhost]: " db_host
    db_host=${db_host:-localhost}

    read -p "데이터베이스 이름 [moodle]: " db_name
    db_name=${db_name:-moodle}

    read -p "데이터베이스 사용자명: " db_user

    read -sp "데이터베이스 비밀번호: " db_pass
    echo ""

    # Update config file
    sed -i "s/define('DB_HOST', 'localhost');/define('DB_HOST', '$db_host');/" "$install_dir/config/db-config.php"
    sed -i "s/define('DB_NAME', 'moodle');/define('DB_NAME', '$db_name');/" "$install_dir/config/db-config.php"
    sed -i "s/define('DB_USER', 'moodle_user');/define('DB_USER', '$db_user');/" "$install_dir/config/db-config.php"
    sed -i "s/define('DB_PASS', 'your_password_here');/define('DB_PASS', '$db_pass');/" "$install_dir/config/db-config.php"

    echo -e "${GREEN}✓ 데이터베이스 설정 완료${NC}"

    # Import database
    read -p "데이터베이스 테이블을 생성하시겠습니까? (y/n) [y]: " import_db
    import_db=${import_db:-y}

    if [ "$import_db" = "y" ]; then
        mysql -h "$db_host" -u "$db_user" -p"$db_pass" "$db_name" < moodle-integration/setup-database.sql
        echo -e "${GREEN}✓ 데이터베이스 테이블 생성 완료${NC}"
    fi
fi

# Web server configuration
echo ""
echo -e "${YELLOW}[7/7] 웹 서버 설정...${NC}"
read -p "Apache 설정 파일을 생성하시겠습니까? (y/n) [n]: " setup_apache
setup_apache=${setup_apache:-n}

if [ "$setup_apache" = "y" ]; then
    read -p "서버 도메인 이름 (예: rollal.yourdomain.com): " server_name

    cat > /etc/apache2/sites-available/roll-along.conf <<EOF
<VirtualHost *:80>
    ServerName $server_name
    DocumentRoot $install_dir

    <Directory $install_dir>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/roll-along-error.log
    CustomLog \${APACHE_LOG_DIR}/roll-along-access.log combined
</VirtualHost>
EOF

    a2ensite roll-along.conf
    a2enmod rewrite
    systemctl reload apache2

    echo -e "${GREEN}✓ Apache 설정 완료${NC}"
fi

# Installation complete
echo ""
echo "======================================"
echo -e "${GREEN}설치가 완료되었습니다!${NC}"
echo "======================================"
echo ""
echo "설치 정보:"
echo "  - 설치 경로: $install_dir"
echo "  - 데모 페이지: http://your-server/roll-along/demo.html"
echo "  - 앱 URL: http://your-server/roll-along/"
echo ""
echo "다음 단계:"
echo "  1. 브라우저에서 http://your-server/roll-along/demo.html 접속"
echo "  2. 데모를 실행하여 정상 작동 확인"
echo "  3. Moodle과 연동 설정"
echo ""
echo "문서: $install_dir/README.md"
echo ""

exit 0
