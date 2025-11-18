#!/bin/bash

echo "🚀 Starting Focus Detection App (Development Mode)"
echo ""

# 백엔드 시작
echo "📦 Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 프론트엔드 시작
echo "📦 Starting Frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Application started!"
echo "   - Backend:  http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# 종료 시그널 처리
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID" EXIT

# 대기
wait
