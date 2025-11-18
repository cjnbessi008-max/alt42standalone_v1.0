#!/bin/bash

# Dual Dance Standalone App - Installation Script
# Automates the installation process

set -e

echo "🎨 Dual Dance - Installation Script"
echo "==================================="
echo

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo "✓ Docker Compose found: $(docker-compose --version)"
echo

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 32)
    sed -i "s/your-secret-key-change-this-to-random-string/$JWT_SECRET/" .env

    # Generate random database password
    DB_PASS=$(openssl rand -base64 16 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 16)
    sed -i "s/dualdance_pass/$DB_PASS/" .env

    echo "✓ .env file created with random secrets"
else
    echo "✓ .env file already exists"
fi

echo

# Pull Docker images
echo "📦 Pulling Docker images..."
docker-compose pull

echo

# Build custom images
echo "🔨 Building custom Docker images..."
docker-compose build

echo

# Start services
echo "🚀 Starting services..."
docker-compose up -d

echo

# Wait for MySQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✓ Services are running"
else
    echo "❌ Some services failed to start"
    docker-compose logs
    exit 1
fi

echo

# Create demo user
echo "👤 Creating demo user..."
docker-compose exec -T mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) dualdance <<EOF
INSERT IGNORE INTO users (username, email, password_hash, role)
VALUES ('demo', 'demo@dualdance.local', '\$2y\$10\$vZRNfpkiqHNLiDGPY5Y9M.MWcF8FkqhWVYv.9TgT9gvVQN4mI6xXq', 'student');
EOF

echo

# Show status
echo "✅ Installation Complete!"
echo
echo "📍 Access Points:"
echo "   - Application: http://localhost"
echo "   - Login Page:  http://localhost/login.html"
echo "   - API:         http://localhost/api"
echo "   - phpMyAdmin:  http://localhost:8080 (dev only)"
echo
echo "🔐 Demo Credentials:"
echo "   - Username: demo"
echo "   - Password: demo123"
echo
echo "📚 Next Steps:"
echo "   1. Visit http://localhost/login.html"
echo "   2. Register a new account or use demo credentials"
echo "   3. Start learning!"
echo
echo "🛠️ Useful Commands:"
echo "   - View logs:    docker-compose logs -f"
echo "   - Stop:         docker-compose stop"
echo "   - Restart:      docker-compose restart"
echo "   - Uninstall:    docker-compose down -v"
echo
echo "Happy learning! 🎓"
