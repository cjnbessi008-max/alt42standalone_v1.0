#!/bin/bash

# 접선 경사도 색감 시각화 - 설치 스크립트

echo "================================================"
echo "  접선 경사도 색감 시각화 (Gradient Color)"
echo "  설치 스크립트"
echo "================================================"
echo ""

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. PHP 버전 확인
echo "1. PHP 버전 확인 중..."
if ! command -v php &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} PHP가 설치되어 있지 않습니다."
    echo "PHP 7.1.9 이상을 설치해주세요."
    exit 1
fi

PHP_VERSION=$(php -r "echo PHP_VERSION;")
echo -e "${GREEN}[OK]${NC} PHP 버전: $PHP_VERSION"
echo ""

# 2. MySQL 확인
echo "2. MySQL 연결 확인 중..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} MySQL 클라이언트를 찾을 수 없습니다."
    echo "MySQL 5.7 이상이 설치되어 있는지 확인해주세요."
else
    MYSQL_VERSION=$(mysql --version)
    echo -e "${GREEN}[OK]${NC} MySQL: $MYSQL_VERSION"
fi
echo ""

# 3. 설정 파일 생성
echo "3. 설정 파일 생성 중..."
if [ ! -f "api/config.php" ]; then
    cp api/config.example.php api/config.php
    echo -e "${GREEN}[OK]${NC} config.php 파일이 생성되었습니다."
    echo -e "${YELLOW}[INFO]${NC} api/config.php 파일을 편집하여 데이터베이스 정보를 입력하세요."
else
    echo -e "${YELLOW}[SKIP]${NC} config.php 파일이 이미 존재합니다."
fi
echo ""

# 4. 디렉토리 권한 설정
echo "4. 디렉토리 권한 설정 중..."
chmod -R 755 public
chmod 644 api/*.php
echo -e "${GREEN}[OK]${NC} 권한 설정 완료"
echo ""

# 5. 로그 디렉토리 생성
echo "5. 로그 디렉토리 설정 중..."
touch api/error.log
chmod 666 api/error.log
echo -e "${GREEN}[OK]${NC} 로그 파일 생성 완료"
echo ""

# 6. 개발 서버 실행 옵션
echo "================================================"
echo "  설치 완료!"
echo "================================================"
echo ""
echo "다음 방법 중 하나로 애플리케이션을 실행하세요:"
echo ""
echo "방법 1: PHP 내장 서버 (개발용)"
echo "  $ cd public"
echo "  $ php -S localhost:8000"
echo "  브라우저에서 http://localhost:8000 접속"
echo ""
echo "방법 2: Apache/Nginx 설정"
echo "  DocumentRoot를 public/ 디렉토리로 설정하세요."
echo "  자세한 내용은 README.md를 참조하세요."
echo ""
echo "================================================"
echo ""
echo -e "${YELLOW}주의사항:${NC}"
echo "1. api/config.php 파일을 편집하여 데이터베이스 정보를 입력하세요."
echo "2. 처음에는 DEV_MODE=true로 설정하여 테스트하세요."
echo "3. Moodle 연동이 필요한 경우, Moodle WebService 토큰을 설정하세요."
echo ""

# 7. 개발 서버 실행 여부 묻기
read -p "지금 PHP 개발 서버를 시작하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "개발 서버를 시작합니다..."
    echo "브라우저에서 http://localhost:8000 으로 접속하세요."
    echo "서버를 중지하려면 Ctrl+C를 누르세요."
    echo ""
    cd public && php -S localhost:8000
fi
