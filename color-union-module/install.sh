#!/bin/bash

###############################################################################
# Color Union Module - Installation Script
# For Moodle 3.7, PHP 7.1.9, MySQL 5.7
###############################################################################

set -e  # Exit on error

echo "======================================"
echo "Color Union Module - 설치 스크립트"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="color_union_db"
DB_USER="color_union_user"
DB_PASS=""
MOODLE_DIR="/var/www/html/moodle"
INSTALL_DIR=$(pwd)

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "이 스크립트는 root 권한으로 실행해야 합니다."
    echo "sudo ./install.sh 를 사용하세요."
    exit 1
fi

# Step 1: Check prerequisites
print_info "사전 요구사항 확인 중..."

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -c 1-3)
    print_success "PHP 버전: $(php -v | head -n 1)"
else
    print_error "PHP가 설치되지 않았습니다."
    exit 1
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL: $MYSQL_VERSION"
else
    print_error "MySQL이 설치되지 않았습니다."
    exit 1
fi

# Check Moodle directory
if [ -d "$MOODLE_DIR" ]; then
    print_success "Moodle 디렉토리 발견: $MOODLE_DIR"
else
    print_info "Moodle 디렉토리를 찾을 수 없습니다: $MOODLE_DIR"
    read -p "Moodle 디렉토리 경로를 입력하세요 (또는 Enter로 건너뛰기): " custom_moodle_dir
    if [ ! -z "$custom_moodle_dir" ]; then
        MOODLE_DIR=$custom_moodle_dir
    fi
fi

echo ""

# Step 2: Database setup
print_info "데이터베이스 설정 시작..."

read -p "MySQL root 비밀번호를 입력하세요: " -s MYSQL_ROOT_PASS
echo ""

# Test MySQL connection
if mysql -u root -p"$MYSQL_ROOT_PASS" -e "SELECT 1;" &> /dev/null; then
    print_success "MySQL 연결 성공"
else
    print_error "MySQL 연결 실패. 비밀번호를 확인하세요."
    exit 1
fi

# Create database user password
read -p "Color Union 데이터베이스 사용자 비밀번호를 입력하세요: " -s DB_PASS
echo ""

# Create database and user
print_info "데이터베이스 생성 중..."
mysql -u root -p"$MYSQL_ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

print_success "데이터베이스 생성 완료"

# Import schema
print_info "데이터베이스 스키마 적용 중..."
mysql -u root -p"$MYSQL_ROOT_PASS" $DB_NAME < db/schema.sql

print_success "스키마 적용 완료"

echo ""

# Step 3: Configure PHP
print_info "PHP 설정 업데이트 중..."

# Update config.php
sed -i "s/define('DB_PASS', '.*');/define('DB_PASS', '$DB_PASS');/" php/config.php
sed -i "s|define('MOODLE_DIR', '.*');|define('MOODLE_DIR', '$MOODLE_DIR');|" php/config.php

print_success "PHP 설정 업데이트 완료"

# Step 4: Create logs directory
print_info "로그 디렉토리 생성 중..."
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs
print_success "로그 디렉토리 생성 완료"

# Step 5: Set permissions
print_info "파일 권한 설정 중..."
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 755 install.sh
print_success "권한 설정 완료"

# Step 6: Copy to web directory (optional)
echo ""
read -p "웹 서버 디렉토리에 복사하시겠습니까? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "설치 경로를 입력하세요 (기본: /var/www/html/color-union): " WEB_DIR
    WEB_DIR=${WEB_DIR:-/var/www/html/color-union}

    print_info "파일 복사 중: $WEB_DIR"
    mkdir -p $WEB_DIR
    cp -r * $WEB_DIR/
    chown -R www-data:www-data $WEB_DIR
    print_success "파일 복사 완료"

    print_info "브라우저에서 접속: http://your-domain/color-union/"
fi

# Step 7: Test database connection
echo ""
print_info "데이터베이스 연결 테스트 중..."

php -r "
\$dsn = 'mysql:host=localhost;dbname=$DB_NAME;charset=utf8mb4';
try {
    \$pdo = new PDO(\$dsn, '$DB_USER', '$DB_PASS');
    echo 'Database connection: OK\n';
} catch (PDOException \$e) {
    echo 'Database connection: FAILED - ' . \$e->getMessage() . '\n';
    exit(1);
}
"

if [ $? -eq 0 ]; then
    print_success "데이터베이스 연결 테스트 성공"
else
    print_error "데이터베이스 연결 테스트 실패"
fi

# Installation summary
echo ""
echo "======================================"
echo "설치 완료!"
echo "======================================"
echo ""
echo "데이터베이스 정보:"
echo "  - 데이터베이스: $DB_NAME"
echo "  - 사용자: $DB_USER"
echo "  - 호스트: localhost"
echo ""
echo "다음 단계:"
echo "  1. Moodle 관리자 페이지에 로그인"
echo "  2. 플러그인 설치 또는 업데이트"
echo "  3. 코스에 Color Union 활동 추가"
echo ""
echo "문제 발생 시:"
echo "  - 로그 확인: logs/php-errors.log"
echo "  - README.md 문서 참조"
echo ""
print_success "설치 스크립트가 성공적으로 완료되었습니다!"
