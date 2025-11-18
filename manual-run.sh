#!/bin/bash

# 수동 실행 스크립트 (Docker 없이 실행)

echo "🚀 문제 해결 전략 시각화 웹앱 수동 실행..."
echo ""

# .env 파일 체크
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env 파일이 없습니다. 복사합니다..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env 파일이 생성되었습니다."
    echo "📝 backend/.env 파일을 열어 ANTHROPIC_API_KEY를 설정해주세요."
    echo ""
fi

# Python 확인
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3가 설치되어 있지 않습니다."
    exit 1
fi

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    exit 1
fi

# 백엔드 실행
echo "🐍 백엔드 서버를 시작합니다..."
cd backend

if [ ! -d "venv" ]; then
    echo "가상환경을 생성합니다..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Python 의존성을 설치합니다..."
pip install -q -r requirements.txt

echo "백엔드 서버를 실행합니다 (포트 8000)..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# 프론트엔드 실행
echo ""
echo "⚛️  프론트엔드 서버를 시작합니다..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "npm 의존성을 설치합니다..."
    npm install
fi

echo "프론트엔드 서버를 실행합니다 (포트 5173)..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ 애플리케이션이 실행되었습니다!"
echo ""
echo "📱 접속 URL:"
echo "   - 프론트엔드: http://localhost:5173"
echo "   - 백엔드 API: http://localhost:8000"
echo "   - API 문서: http://localhost:8000/docs"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# Ctrl+C 처리
trap "echo ''; echo '종료 중...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT

# 백그라운드 프로세스 대기
wait
