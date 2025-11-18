#!/bin/bash

echo "🚀 Starting AI Education System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if services are running
if docker ps | grep -q ai_education_backend; then
    echo "✅ Backend is running at http://localhost:8000"
    echo "📖 API Documentation at http://localhost:8000/docs"
else
    echo "❌ Backend failed to start. Check logs with: docker-compose logs backend"
    exit 1
fi

if docker ps | grep -q ai_education_db; then
    echo "✅ Database is running at localhost:5432"
else
    echo "❌ Database failed to start. Check logs with: docker-compose logs db"
    exit 1
fi

echo ""
echo "🎉 All services are up and running!"
echo ""
echo "Available endpoints:"
echo "  - API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Health Check: http://localhost:8000/health"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
