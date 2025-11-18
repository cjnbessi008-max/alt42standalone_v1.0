#!/bin/bash

###############################################################################
# Boundary Gate Learning System - 자동 설치 스크립트
# 이 스크립트는 Linux/Mac 환경에서 Boundary Gate를 자동으로 설치합니다.
###############################################################################

echo "================================================"
echo "  Boundary Gate Learning System 설치 시작"
echo "================================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 현재 디렉토리 저장
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 1. 로그 디렉토리 생성
echo -e "${YELLOW}[1/5] 로그 디렉토리 생성 중...${NC}"
if [ ! -d "logs" ]; then
    mkdir -p logs
    chmod 755 logs
    echo -e "${GREEN}✓ 로그 디렉토리 생성 완료${NC}"
else
    echo -e "${GREEN}✓ 로그 디렉토리가 이미 존재합니다${NC}"
fi
echo ""

# 2. MySQL 연결 정보 입력
echo -e "${YELLOW}[2/5] 데이터베이스 설정${NC}"
echo "MySQL 데이터베이스를 설정하시겠습니까? (y/n)"
echo "아니오를 선택하면 샘플 데이터로 실행됩니다."
read -p "선택: " setup_db

if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
    read -p "MySQL 호스트 [localhost]: " db_host
    db_host=${db_host:-localhost}

    read -p "MySQL 사용자명 [root]: " db_user
    db_user=${db_user:-root}

    read -sp "MySQL 비밀번호: " db_pass
    echo ""

    read -p "데이터베이스 이름 [boundary_gate]: " db_name
    db_name=${db_name:-boundary_gate}

    # MySQL 연결 테스트
    echo -e "${YELLOW}데이터베이스 연결 테스트 중...${NC}"
    mysql -h"$db_host" -u"$db_user" -p"$db_pass" -e "SELECT 1;" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MySQL 연결 성공${NC}"

        # 데이터베이스 생성 및 스키마 로드
        echo -e "${YELLOW}데이터베이스 생성 및 스키마 로드 중...${NC}"
        mysql -h"$db_host" -u"$db_user" -p"$db_pass" <<EOF
CREATE DATABASE IF NOT EXISTS $db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE $db_name;
SOURCE $SCRIPT_DIR/sql/schema.sql;
EOF

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 데이터베이스 설정 완료${NC}"

            # config.php 업데이트
            echo -e "${YELLOW}설정 파일 업데이트 중...${NC}"
            sed -i "s/define('DB_HOST', 'localhost');/define('DB_HOST', '$db_host');/" php/config.php
            sed -i "s/define('DB_NAME', 'boundary_gate');/define('DB_NAME', '$db_name');/" php/config.php
            sed -i "s/define('DB_USER', 'root');/define('DB_USER', '$db_user');/" php/config.php
            sed -i "s/define('DB_PASS', '');/define('DB_PASS', '$db_pass');/" php/config.php
            echo -e "${GREEN}✓ 설정 파일 업데이트 완료${NC}"
        else
            echo -e "${RED}✗ 데이터베이스 생성 실패${NC}"
            echo "수동으로 설정하거나 샘플 데이터로 실행하세요."
        fi
    else
        echo -e "${RED}✗ MySQL 연결 실패${NC}"
        echo "수동으로 설정하거나 샘플 데이터로 실행하세요."
    fi
else
    echo -e "${GREEN}✓ 샘플 데이터 모드로 실행됩니다${NC}"
fi
echo ""

# 3. Moodle 연동 설정
echo -e "${YELLOW}[3/5] Moodle 연동 설정${NC}"
echo "Moodle LMS와 연동하시겠습니까? (y/n)"
read -p "선택: " setup_moodle

if [ "$setup_moodle" = "y" ] || [ "$setup_moodle" = "Y" ]; then
    read -p "Moodle URL (예: http://moodle.example.com): " moodle_url
    read -p "Moodle 웹서비스 토큰: " moodle_token

    # config.php 업데이트
    sed -i "s|define('MOODLE_URL', 'http://localhost/moodle');|define('MOODLE_URL', '$moodle_url');|" php/config.php
    sed -i "s/define('MOODLE_TOKEN', 'YOUR_MOODLE_TOKEN');/define('MOODLE_TOKEN', '$moodle_token');/" php/config.php

    echo -e "${GREEN}✓ Moodle 연동 설정 완료${NC}"
else
    echo -e "${GREEN}✓ Moodle 없이 독립 실행됩니다${NC}"
fi
echo ""

# 4. 권한 설정
echo -e "${YELLOW}[4/5] 파일 권한 설정 중...${NC}"
chmod 644 php/*.php
chmod 755 php
chmod 755 logs
chmod 644 .htaccess 2>/dev/null

# 웹 서버 사용자 확인
if [ -d "/var/www" ]; then
    WEB_USER="www-data"
elif [ -d "/usr/local/apache2" ]; then
    WEB_USER="apache"
else
    WEB_USER=$(whoami)
fi

# 소유자 변경 (root 권한 필요)
if [ "$EUID" -eq 0 ]; then
    chown -R $WEB_USER:$WEB_USER logs
    echo -e "${GREEN}✓ 권한 설정 완료 (사용자: $WEB_USER)${NC}"
else
    echo -e "${YELLOW}! root 권한이 없어 소유자 변경을 건너뜁니다${NC}"
    echo "  필요시 다음 명령을 실행하세요: sudo chown -R $WEB_USER:$WEB_USER logs"
fi
echo ""

# 5. 웹 서버 재시작
echo -e "${YELLOW}[5/5] 웹 서버 확인${NC}"
if command -v apachectl &> /dev/null; then
    echo "Apache 웹 서버가 감지되었습니다."
    echo "Apache를 재시작하시겠습니까? (y/n)"
    read -p "선택: " restart_apache

    if [ "$restart_apache" = "y" ] || [ "$restart_apache" = "Y" ]; then
        if [ "$EUID" -eq 0 ]; then
            apachectl restart
            echo -e "${GREEN}✓ Apache 재시작 완료${NC}"
        else
            echo -e "${YELLOW}! root 권한이 필요합니다${NC}"
            echo "  다음 명령을 실행하세요: sudo apachectl restart"
        fi
    fi
elif command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ Nginx 웹 서버가 감지되었습니다${NC}"
    echo "  설정 변경 시 다음 명령으로 재시작하세요: sudo service nginx restart"
else
    echo -e "${YELLOW}! 웹 서버를 감지할 수 없습니다${NC}"
    echo "  XAMPP 또는 다른 웹 서버를 사용 중이라면 수동으로 재시작하세요"
fi
echo ""

# 설치 완료
echo "================================================"
echo -e "${GREEN}  ✓ Boundary Gate 설치 완료!${NC}"
echo "================================================"
echo ""
echo "다음 단계:"
echo "1. 웹 브라우저를 열고 다음 주소로 접속하세요:"
echo "   http://localhost/boundary-gate-app/"
echo ""
echo "2. 문제가 발생하면 다음을 확인하세요:"
echo "   - 로그 파일: $SCRIPT_DIR/logs/error.log"
echo "   - 설정 파일: $SCRIPT_DIR/php/config.php"
echo "   - 설치 가이드: $SCRIPT_DIR/INSTALL.md"
echo ""
echo -e "${GREEN}즐거운 학습 되세요! 📚✨${NC}"
echo ""
