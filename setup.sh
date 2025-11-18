#!/bin/bash

echo "=================================="
echo "Correlation Heat - Setup Script"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your Moodle credentials"
fi
npm install
cd ..
echo "✓ Backend setup complete"
echo ""

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi
npm install
cd ..
echo "✓ Frontend setup complete"
echo ""

echo "=================================="
echo "✅ Setup complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Moodle URL and API token"
echo "2. Run ./start.sh to start the application"
echo ""
