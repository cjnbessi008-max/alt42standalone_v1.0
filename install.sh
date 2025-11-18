#!/bin/bash

# Stat Story Mode - Installation Script

echo "=========================================="
echo "  Stat Story Mode 설치 스크립트"
echo "=========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 함수: 에러 메시지
error() {
    echo -e "${RED}✗ $1${NC}"
}

# 함수: 경고 메시지
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. 요구사항 확인
echo "1. 요구사항 확인 중..."

# PHP 버전 확인
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    success "PHP 버전: $PHP_VERSION"

    if [[ $(echo "$PHP_VERSION < 7.1" | bc) -eq 1 ]]; then
        error "PHP 7.1 이상이 필요합니다."
        exit 1
    fi
else
    error "PHP가 설치되어 있지 않습니다."
    exit 1
fi

# MySQL 확인
if command -v mysql &> /dev/null; then
    success "MySQL 설치 확인됨"
else
    warning "MySQL 명령어를 찾을 수 없습니다. MySQL이 설치되어 있는지 확인하세요."
fi

echo ""

# 2. 디렉토리 권한 설정
echo "2. 디렉토리 권한 설정 중..."

# logs 디렉토리 생성
mkdir -p logs
chmod 755 logs
success "logs 디렉토리 생성"

# uploads 디렉토리 생성
mkdir -p public/assets/uploads
chmod 755 public/assets/uploads
success "uploads 디렉토리 생성"

# cache 디렉토리 생성
mkdir -p cache
chmod 755 cache
success "cache 디렉토리 생성"

echo ""

# 3. 환경 변수 파일 생성
echo "3. 환경 변수 설정..."

if [ ! -f .env ]; then
    cp .env.example .env
    success ".env 파일 생성됨"
    warning "⚠ .env 파일을 편집하여 데이터베이스 정보를 입력하세요."
else
    warning ".env 파일이 이미 존재합니다."
fi

echo ""

# 4. 데이터베이스 설정
echo "4. 데이터베이스 설정"
echo "데이터베이스를 자동으로 생성하시겠습니까? (y/n)"
read -r CREATE_DB

if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
    echo "MySQL root 사용자 이름을 입력하세요 (기본값: root):"
    read -r DB_ROOT_USER
    DB_ROOT_USER=${DB_ROOT_USER:-root}

    echo "MySQL root 비밀번호를 입력하세요:"
    read -sr DB_ROOT_PASS
    echo ""

    echo "생성할 데이터베이스 이름을 입력하세요 (기본값: stat_story_mode):"
    read -r DB_NAME
    DB_NAME=${DB_NAME:-stat_story_mode}

    # 데이터베이스 생성
    mysql -u "$DB_ROOT_USER" -p"$DB_ROOT_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

    if [ $? -eq 0 ]; then
        success "데이터베이스 '$DB_NAME' 생성됨"

        # 스키마 적용
        echo "스키마를 적용하시겠습니까? (y/n)"
        read -r APPLY_SCHEMA

        if [ "$APPLY_SCHEMA" = "y" ] || [ "$APPLY_SCHEMA" = "Y" ]; then
            mysql -u "$DB_ROOT_USER" -p"$DB_ROOT_PASS" "$DB_NAME" < database/schema.sql 2>/dev/null
            if [ $? -eq 0 ]; then
                success "스키마 적용 완료"

                # 초기 데이터 입력
                echo "초기 데이터를 입력하시겠습니까? (y/n)"
                read -r SEED_DATA

                if [ "$SEED_DATA" = "y" ] || [ "$SEED_DATA" = "Y" ]; then
                    mysql -u "$DB_ROOT_USER" -p"$DB_ROOT_PASS" "$DB_NAME" < database/seed.sql 2>/dev/null
                    if [ $? -eq 0 ]; then
                        success "초기 데이터 입력 완료"
                    else
                        error "초기 데이터 입력 실패"
                    fi
                fi
            else
                error "스키마 적용 실패"
            fi
        fi
    else
        error "데이터베이스 생성 실패"
    fi
else
    warning "데이터베이스 설정을 건너뜁니다."
    echo "수동으로 다음 명령을 실행하세요:"
    echo "  mysql -u root -p < database/schema.sql"
    echo "  mysql -u root -p < database/seed.sql"
fi

echo ""

# 5. 완료
echo "=========================================="
echo "  설치가 완료되었습니다!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. .env 파일을 편집하여 설정을 확인하세요"
echo "2. 웹 서버를 설정하세요 (Apache 또는 Nginx)"
echo "3. 브라우저에서 애플리케이션에 접속하세요"
echo ""
echo "자세한 내용은 docs/README.md를 참조하세요."
echo ""
