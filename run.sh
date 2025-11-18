#!/bin/bash

# 문제 해결 전략 시각화 웹앱 실행 스크립트

echo "🚀 문제 해결 전략 시각화 웹앱 시작..."
echo ""

# .env 파일 체크
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "✅ .env 파일이 생성되었습니다."
    echo "📝 .env 파일을 열어 ANTHROPIC_API_KEY를 설정해주세요."
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Docker 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    echo "Docker를 설치하거나 manual-run.sh를 사용하세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    echo "Docker Compose를 설치하거나 manual-run.sh를 사용하세요."
    exit 1
fi

echo "🐳 Docker Compose로 실행합니다..."
echo ""

# Docker Compose 실행
docker-compose up --build

echo ""
echo "👋 애플리케이션이 종료되었습니다."
