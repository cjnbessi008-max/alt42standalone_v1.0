#!/bin/bash

# Student Performance Analysis System - Setup Script
# This script automates the initial setup process

echo "================================================"
echo "🎓 Student Performance Analysis System Setup"
echo "================================================"
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version detected"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Create necessary directories
echo "Creating directory structure..."
mkdir -p output
mkdir -p logs
echo "✓ Directories created"
echo ""

# Copy config file if it doesn't exist
echo "Setting up configuration..."
if [ ! -f "config/database.config.json" ]; then
    cp config/database.config.example.json config/database.config.json
    echo "✓ Configuration file created"
    echo "⚠️  IMPORTANT: Edit config/database.config.json with your database credentials"
else
    echo "✓ Configuration file already exists"
fi
echo ""

# Make scripts executable
echo "Setting up permissions..."
chmod +x backend/analysis_pipeline.py
chmod +x webapp/app.py
echo "✓ Permissions set"
echo ""

echo "================================================"
echo "✅ Setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Edit config/database.config.json with your database settings"
echo "2. Run the web application:"
echo "   cd webapp && python app.py"
echo "3. Or run command-line analysis:"
echo "   cd backend && python analysis_pipeline.py --course-id 1"
echo ""
echo "For more information, see:"
echo "- README.md (detailed documentation)"
echo "- QUICKSTART.md (quick start guide)"
echo ""
echo "Happy analyzing! 🎓"
