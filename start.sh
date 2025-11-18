#!/bin/bash

# ============================================================================
# Standalone Moodle LMS Integration - Startup Script
# ============================================================================

set -e

echo "🚀 Starting Moodle LMS Integration Standalone Web App..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Check Prerequisites
# ============================================================================

echo "${BLUE}📋 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "${GREEN}✓ Docker found${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi
echo "${GREEN}✓ Docker Compose found${NC}"

echo ""

# ============================================================================
# Environment Configuration
# ============================================================================

if [ ! -f .env ]; then
    echo "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "${GREEN}✓ Created .env file${NC}"
        echo "${YELLOW}⚠️  Please edit .env file with your Moodle configuration before proceeding.${NC}"
        echo ""
        echo "Required configuration:"
        echo "  - MOODLE_BASE_URL: Your Moodle site URL"
        echo "  - MOODLE_WS_TOKEN: Your web service token"
        echo ""
        read -p "Press Enter when ready to continue..."
    else
        echo "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
else
    echo "${GREEN}✓ .env file found${NC}"
fi

echo ""

# ============================================================================
# Load Environment Variables
# ============================================================================

export $(cat .env | grep -v '^#' | xargs)

# ============================================================================
# Build and Start Services
# ============================================================================

echo "${BLUE}🔨 Building Docker images...${NC}"
docker-compose build

echo ""
echo "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

echo ""
echo "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check backend health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "${RED}❌ Backend failed to start. Check logs with: docker-compose logs backend${NC}"
    exit 1
fi

# Check frontend health
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for frontend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "${RED}❌ Frontend failed to start. Check logs with: docker-compose logs frontend${NC}"
    exit 1
fi

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✅ All services are running!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📱 Frontend:     http://localhost:3000"
echo "🔧 Backend API:  http://localhost:8000"
echo "📚 API Docs:     http://localhost:8000/docs"
echo "🗄️  MySQL:        localhost:3306 (if enabled)"
echo ""
echo "Useful commands:"
echo "  - View logs:       docker-compose logs -f"
echo "  - Stop services:   docker-compose down"
echo "  - Restart:         docker-compose restart"
echo ""
echo "${BLUE}🎉 Happy problem reconstructing!${NC}"
