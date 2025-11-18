#!/bin/bash

# ============================================================================
# Standalone Moodle LMS Integration - Stop Script
# ============================================================================

echo "🛑 Stopping Moodle LMS Integration services..."

docker-compose down

echo "✅ All services stopped."
echo ""
echo "To start again, run: ./start.sh"
