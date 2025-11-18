#!/bin/bash

echo "🐳 Starting Focus Detection App with Docker"
echo ""

# Docker Compose로 시작
docker-compose up --build

echo ""
echo "✅ Application started!"
echo "   - Backend:  http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
