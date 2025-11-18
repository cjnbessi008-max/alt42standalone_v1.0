#!/bin/bash

################################################################################
# Truth Light App - 자동 설치 스크립트
#
# 사용법: sudo ./install.sh
################################################################################

set -e  # 오류 발생시 스크립트 중단

echo "======================================"
echo "Truth Light App 설치를 시작합니다..."
echo "======================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 필수 소프트웨어 확인
echo -e "\n${YELLOW}[1/7] 필수 소프트웨어 확인 중...${NC}"

if ! command -v php &> /dev/null; then
    echo -e "${RED}PHP가 설치되어 있지 않습니다.${NC}"
    echo "PHP 7.1.9 이상을 설치해주세요."
    exit 1
fi

PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1-2)
echo -e "${GREEN}✓ PHP 버전: $PHP_VERSION${NC}"

if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

MYSQL_VERSION=$(mysql --version | awk '{print $5}' | cut -d "." -f 1-2)
echo -e "${GREEN}✓ MySQL 버전: $MYSQL_VERSION${NC}"

# 2. 디렉토리 확인
echo -e "\n${YELLOW}[2/7] 프로젝트 디렉토리 확인 중...${NC}"
PROJECT_DIR=$(pwd)
echo -e "${GREEN}✓ 프로젝트 위치: $PROJECT_DIR${NC}"

# 3. 로그 디렉토리 생성
echo -e "\n${YELLOW}[3/7] 로그 디렉토리 생성 중...${NC}"
mkdir -p logs
chmod 755 logs
echo -e "${GREEN}✓ 로그 디렉토리 생성 완료${NC}"

# 4. 데이터베이스 설정
echo -e "\n${YELLOW}[4/7] 데이터베이스 설정${NC}"
read -p "MySQL root 비밀번호를 입력하세요: " -s MYSQL_ROOT_PASSWORD
echo

read -p "Truth Light용 데이터베이스 이름 (기본: truth_light_db): " DB_NAME
DB_NAME=${DB_NAME:-truth_light_db}

read -p "Truth Light용 데이터베이스 사용자 이름 (기본: truth_light_user): " DB_USER
DB_USER=${DB_USER:-truth_light_user}

read -p "Truth Light용 데이터베이스 비밀번호: " -s DB_PASS
echo

# 데이터베이스 생성 및 스키마 적용
echo -e "${YELLOW}데이터베이스 생성 중...${NC}"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${YELLOW}스키마 적용 중...${NC}"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < database/schema.sql

echo -e "${GREEN}✓ 데이터베이스 설정 완료${NC}"

# 5. 설정 파일 생성
echo -e "\n${YELLOW}[5/7] 설정 파일 생성 중...${NC}"

if [ -f "config/config.local.php" ]; then
    echo -e "${YELLOW}! config.local.php가 이미 존재합니다. 백업 생성...${NC}"
    cp config/config.local.php config/config.local.php.backup
fi

cat > config/config.local.php <<CONFIG_PHP
<?php
/**
 * Truth Light App - Local Configuration
 * 자동 생성됨: $(date)
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', '$DB_NAME');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASS');

// Moodle Configuration (필요시 수정)
// define('MOODLE_URL', 'http://your-moodle-site.com');
// define('MOODLE_TOKEN', 'your_webservice_token_here');

// Application Settings
define('LOG_ENABLED', true);
define('LOG_LEVEL', 'DEBUG');
CONFIG_PHP

echo -e "${GREEN}✓ 설정 파일 생성 완료${NC}"

# 6. 권한 설정
echo -e "\n${YELLOW}[6/7] 파일 권한 설정 중...${NC}"

# 웹 서버 사용자 확인
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
elif id "apache" &>/dev/null; then
    WEB_USER="apache"
else
    WEB_USER=$(whoami)
    echo -e "${YELLOW}! 웹 서버 사용자를 찾을 수 없어 현재 사용자($WEB_USER)로 설정합니다.${NC}"
fi

chown -R $WEB_USER:$WEB_USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod 644 config/config.local.php

echo -e "${GREEN}✓ 권한 설정 완료 (소유자: $WEB_USER)${NC}"

# 7. 설치 완료
echo -e "\n${GREEN}======================================"
echo "✓ Truth Light App 설치 완료!"
echo "======================================${NC}"

echo -e "\n${YELLOW}다음 단계:${NC}"
echo "1. 웹 서버(Apache/Nginx)가 실행 중인지 확인"
echo "2. 브라우저에서 접속: http://localhost/truth-light-app/public/"
echo "3. Moodle 연동이 필요한 경우 config/config.local.php에서 MOODLE_URL과 MOODLE_TOKEN 설정"

echo -e "\n${YELLOW}데이터베이스 정보:${NC}"
echo "데이터베이스: $DB_NAME"
echo "사용자: $DB_USER"
echo "호스트: localhost"

echo -e "\n${YELLOW}문제 해결:${NC}"
echo "로그 확인: tail -f $PROJECT_DIR/logs/app.log"
echo "README 참조: $PROJECT_DIR/README.md"

echo -e "\n설치 로그가 install.log에 저장되었습니다.\n"
