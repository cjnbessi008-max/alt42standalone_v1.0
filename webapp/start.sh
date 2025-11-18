#!/bin/bash

echo "🚀 개념-문제 매칭 시스템 시작 스크립트"
echo "=========================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 의존성 설치 중..."
  npm run setup
fi

# Check if database exists
if [ ! -f "backend/data/concepts.db" ]; then
  echo "🗄️  데이터베이스 초기화 및 샘플 데이터 삽입 중..."
  cd backend
  npm run init-db
  npm run seed
  cd ..
fi

echo "✅ 준비 완료!"
echo ""
echo "🌐 서버 시작 중..."
echo "   - 백엔드: http://localhost:3001"
echo "   - 프론트엔드: http://localhost:5173"
echo ""
echo "중지하려면 Ctrl+C를 누르세요"
echo ""

# Start the application
npm run dev
