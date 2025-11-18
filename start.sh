#!/bin/bash

# 워밍업 문제 추천 시스템 - 빠른 시작 스크립트

echo "================================"
echo "워밍업 문제 추천 시스템"
echo "================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 환경 변수 파일 확인 및 생성
setup_env_files() {
    echo -e "${YELLOW}[1/4] 환경 변수 파일 설정 중...${NC}"

    if [ ! -f backend/.env ]; then
        echo "  → backend/.env 파일 생성 중..."
        cp backend/.env.example backend/.env
        echo -e "  ${GREEN}✓ backend/.env 생성 완료${NC}"
    else
        echo -e "  ${GREEN}✓ backend/.env 이미 존재${NC}"
    fi

    if [ ! -f frontend/.env ]; then
        echo "  → frontend/.env 파일 생성 중..."
        cp frontend/.env.example frontend/.env
        echo -e "  ${GREEN}✓ frontend/.env 생성 완료${NC}"
    else
        echo -e "  ${GREEN}✓ frontend/.env 이미 존재${NC}"
    fi

    echo ""
}

# Python 의존성 설치
setup_backend() {
    echo -e "${YELLOW}[2/4] 백엔드 의존성 설치 중...${NC}"

    cd backend

    # 가상환경이 없으면 생성
    if [ ! -d "venv" ]; then
        echo "  → Python 가상환경 생성 중..."
        python3 -m venv venv
        echo -e "  ${GREEN}✓ 가상환경 생성 완료${NC}"
    fi

    # 가상환경 활성화
    source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

    # 의존성 설치
    echo "  → Python 패키지 설치 중..."
    pip install -q -r requirements.txt
    echo -e "  ${GREEN}✓ 백엔드 의존성 설치 완료${NC}"

    cd ..
    echo ""
}

# Node.js 의존성 설치
setup_frontend() {
    echo -e "${YELLOW}[3/4] 프론트엔드 의존성 설치 중...${NC}"

    cd frontend

    if [ ! -d "node_modules" ]; then
        echo "  → npm 패키지 설치 중..."
        npm install --silent
        echo -e "  ${GREEN}✓ 프론트엔드 의존성 설치 완료${NC}"
    else
        echo -e "  ${GREEN}✓ node_modules 이미 존재${NC}"
    fi

    cd ..
    echo ""
}

# 서버 실행
start_servers() {
    echo -e "${YELLOW}[4/4] 서버 실행 중...${NC}"
    echo ""

    # 백엔드 서버 실행 (백그라운드)
    echo -e "${GREEN}→ 백엔드 서버 실행...${NC}"
    cd backend
    source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
    python -m src.main &
    BACKEND_PID=$!
    cd ..

    # 백엔드가 준비될 때까지 대기
    echo "  백엔드 서버 준비 중..."
    sleep 5

    # 프론트엔드 서버 실행 (백그라운드)
    echo -e "${GREEN}→ 프론트엔드 서버 실행...${NC}"
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..

    echo ""
    echo "================================"
    echo -e "${GREEN}✓ 서버가 성공적으로 실행되었습니다!${NC}"
    echo "================================"
    echo ""
    echo "📡 백엔드 API: http://localhost:8000"
    echo "📄 API 문서: http://localhost:8000/docs"
    echo "🌐 프론트엔드: http://localhost:3000"
    echo ""
    echo "서버를 종료하려면 Ctrl+C를 누르세요."
    echo ""

    # 종료 시그널 처리
    trap "echo ''; echo '서버를 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

    # 서버가 실행되는 동안 대기
    wait
}

# 메인 실행 흐름
main() {
    setup_env_files
    setup_backend
    setup_frontend
    start_servers
}

# 스크립트 실행
main
