# 🎨 Dual Dance - Standalone Web App

**Interactive Math Learning Platform** featuring exponential and logarithmic functions that "dance" together in a virtual smartphone interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- 🎯 **Interactive Visualization**: Real-time animated exponential and logarithmic functions
- 📱 **Virtual Smartphone UI**: Realistic mobile interface on desktop
- 🔐 **User Authentication**: JWT-based secure authentication
- 📊 **Progress Tracking**: Detailed statistics and performance analytics
- 🎮 **Gamification**: Levels, streaks, and experience points
- 🌍 **Multi-difficulty**: 5 difficulty levels from very easy to very hard
- 🏆 **Leaderboard**: Compete with other learners
- 💨 **Fast & Lightweight**: Zero-dependency frontend, optimized backend

## 🏗️ Technology Stack

### Backend
- **PHP** 7.1.9 with Slim Framework 3.x
- **MySQL** 5.7 database
- **JWT** authentication
- **REST API** architecture

### Frontend
- **Vanilla JavaScript** (ES6 modules, no frameworks)
- **HTML5 Canvas** for visualization
- **CSS3** with modern features
- **Responsive** design

### Infrastructure
- **Docker** & Docker Compose
- **Nginx** web server
- **PHP-FPM** 7.1
- **Redis** (optional caching)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/dualdance-standalone.git
   cd dualdance-standalone/standalone-webapp
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and update JWT_SECRET and passwords
   nano .env
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **App**: http://localhost
   - **API**: http://localhost/api
   - **phpMyAdmin** (dev): http://localhost:8080

5. **Create your account**
   - Navigate to http://localhost/login.html
   - Click "Register" tab
   - Create your account

## 📖 User Guide

### For Students

1. **Login** to your account
2. **Click "Start"** to generate a new problem
3. **Watch** the exponential (red) and logarithmic (blue) functions dance
4. **Solve** the problem and enter your answer
5. **Submit** to get instant feedback
6. **Track** your progress in the stats panel

### For Teachers

- View leaderboard: http://localhost/api/stats/leaderboard
- Monitor student activity: http://localhost/api/stats/activity
- Adjust difficulty for different student levels

## 🎯 Problem Types

1. **Exponential Evaluation**
   - Example: Calculate 1.5 × 2^3
   - Tests understanding of exponential growth

2. **Logarithmic Evaluation**
   - Example: Calculate 2.0 × log₂(16)
   - Tests logarithm calculation skills

3. **Function Intersection**
   - Example: Find where f(x) = 2^x intersects g(x) = log₂(x)
   - Tests understanding of inverse relationships

## 🔧 Configuration

### Environment Variables

Edit `.env` file:

```env
# Application
APP_ENV=production
APP_DEBUG=false

# Database
DB_NAME=dualdance
DB_USER=dualdance_user
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_random_secret_key_here

# Features
DEFAULT_DIFFICULTY=3
PROBLEMS_PER_SESSION=10
```

### Difficulty Levels

| Level | Description | Base Range | Target Audience |
|-------|-------------|------------|-----------------|
| 1 | Very Easy | 1.5 - 2.0 | Middle School |
| 2 | Easy | 1.7 - 2.5 | High School (Intro) |
| 3 | Medium | 2.0 - 3.5 | High School |
| 4 | Hard | 2.5 - 4.5 | Advanced HS / College |
| 5 | Very Hard | 3.0 - 5.0 | College+ |

## 📊 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

# Login
POST /api/auth/login
{
  "username": "john",
  "password": "password123"
}

# Response
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJh...",
  "user": {...}
}
```

### Problems

```bash
# Generate problem
POST /api/problems/generate
Authorization: Bearer {token}
{
  "difficulty": 3
}

# Get problem
GET /api/problems/{id}
Authorization: Bearer {token}
```

### Submit Answer

```bash
POST /api/attempts
Authorization: Bearer {token}
{
  "problem_id": 123,
  "answer": 8.0,
  "time_spent": 45
}
```

### Statistics

```bash
# User stats
GET /api/stats/user
Authorization: Bearer {token}

# Leaderboard
GET /api/stats/leaderboard?limit=10

# Recent activity
GET /api/stats/activity?limit=20
```

## 🔒 Security

- **JWT** tokens with expiration
- **Password hashing** with bcrypt
- **SQL injection** prevention (prepared statements)
- **CORS** configuration
- **XSS** protection headers
- **HTTPS** ready (configure Nginx for production)

## 🛠️ Development

### Local Development

```bash
# Start services
docker-compose up

# Watch logs
docker-compose logs -f php

# Access MySQL
docker-compose exec mysql mysql -u root -p

# Access PHP container
docker-compose exec php sh
```

### Database Management

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p dualdance > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p dualdance < backup.sql

# Run migrations
docker-compose exec php php /var/www/html/database/migrate.php
```

### Testing

```bash
# Install dev dependencies
docker-compose exec php composer install

# Run tests
docker-compose exec php composer test

# Code style check
docker-compose exec php composer cs-check
```

## 📁 Project Structure

```
standalone-webapp/
├── backend/
│   ├── public/index.php          # API entry point
│   ├── src/
│   │   ├── Controllers/          # API controllers
│   │   ├── Models/               # Data models
│   │   ├── Utils/                # Helper classes
│   │   ├── routes.php            # API routes
│   │   └── middleware.php        # Middleware
│   ├── config/                   # Configuration
│   ├── database/
│   │   └── schema.sql            # Database schema
│   └── composer.json             # PHP dependencies
├── frontend/
│   ├── index.html                # Main app
│   ├── login.html                # Login page
│   ├── css/                      # Stylesheets
│   └── js/                       # JavaScript modules
├── nginx/
│   └── nginx.conf                # Web server config
├── docker-compose.yml            # Docker orchestration
└── .env                          # Environment variables
```

## 🚢 Deployment

### Production Deployment

1. **Update `.env` for production**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   JWT_SECRET=use-strong-random-key
   ```

2. **Configure HTTPS** in `nginx/nginx.conf`

3. **Use production Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Set up backups** (cron job)
   ```bash
   0 2 * * * /path/to/scripts/backup.sh
   ```

### Cloud Platforms

- **AWS**: EC2 + RDS MySQL
- **Google Cloud**: Compute Engine + Cloud SQL
- **DigitalOcean**: Droplet + Managed Database
- **Azure**: App Service + Azure Database

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check MySQL is running
docker-compose ps mysql

# Check credentials in .env
cat .env | grep DB_
```

**API returns 401 Unauthorized**
```bash
# Check JWT_SECRET is set
cat .env | grep JWT_SECRET

# Check token is included in Authorization header
```

**Canvas not displaying**
```bash
# Check browser console for errors
# Ensure JavaScript modules are supported
# Try clearing browser cache
```

## 📈 Performance

- **API Response Time**: < 100ms
- **Problem Generation**: < 50ms
- **Canvas FPS**: 60fps
- **Concurrent Users**: 100+ (with default config)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

GPL v3 or later

## 🙏 Credits

- **Developed by**: AI Education System Team
- **Inspired by**: Interactive math learning platforms
- **Built with**: ❤️ for mathematics education

## 📞 Support

- **Issues**: [GitHub Issues](#)
- **Documentation**: [Wiki](#)
- **Email**: support@dualdance.local

---

**Happy Learning! 🎓**
