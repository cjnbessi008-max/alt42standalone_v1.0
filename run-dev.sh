#!/bin/bash

echo "========================================="
echo "LMS 오답 예측 시스템 - 개발 서버 실행"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "📝 .env.example 파일을 복사하여 .env 파일을 생성합니다..."
    cp .env.example .env
    echo ""
    echo "❗ .env 파일에 ANTHROPIC_API_KEY를 설정해주세요!"
    echo "   API 키는 https://console.anthropic.com/ 에서 발급받을 수 있습니다."
    echo ""
    read -p "API 키를 입력하셨습니까? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ API 키를 먼저 설정해주세요."
        exit 1
    fi
fi

echo "1️⃣  백엔드 서버 시작 중..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate || . venv/Scripts/activate
pip install -q -r requirements.txt
source ../.env
export ANTHROPIC_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)"
echo ""

sleep 3

echo "2️⃣  프론트엔드 서버 시작 중..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)"
echo ""
echo "========================================="
echo "🚀 서버가 실행되었습니다!"
echo "========================================="
echo ""
echo "📱 프론트엔드: http://localhost:5173"
echo "🔧 백엔드 API: http://localhost:8000"
echo "📚 API 문서: http://localhost:8000/docs"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '서버를 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
