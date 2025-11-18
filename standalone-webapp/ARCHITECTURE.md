# Dual Dance - Standalone Web App Architecture

## 📋 Overview

독립형 웹 애플리케이션으로 지수함수와 로그함수의 "Dual Dance" 시각화 학습 플랫폼

## 🏗️ Architecture Design

### Technology Stack (추천 방식)

#### Backend
- **Language**: PHP 7.1.9
- **Framework**: Slim Framework 3.x (경량 REST API)
- **Database**: MySQL 5.7
- **Authentication**: JWT (JSON Web Tokens)
- **Session**: Redis (optional) or PHP Sessions

#### Frontend
- **Framework**: Vanilla JavaScript (Zero dependencies)
- **UI Components**: Custom Web Components
- **Styling**: CSS3 with CSS Variables
- **Visualization**: HTML5 Canvas API
- **State Management**: Custom lightweight store
- **Build**: No build step required (ES6 modules)

#### Infrastructure
- **Container**: Docker + Docker Compose
- **Web Server**: Nginx + PHP-FPM
- **Cache**: Redis (optional)
- **Process Manager**: Supervisor

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Browser                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         Virtual Smartphone UI                  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │   Dual Dance Canvas Visualization       │  │  │
│  │  │   - Exponential Function (Red)          │  │  │
│  │  │   - Logarithmic Function (Blue)         │  │  │
│  │  │   - Animated Intersection Point         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │        Problem Display & Input                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │ REST API (JSON)
                  │
┌─────────────────▼───────────────────────────────────┐
│              Nginx Web Server                        │
│  ┌────────────────────┐  ┌──────────────────────┐  │
│  │   Static Files     │  │   PHP-FPM 7.1.9      │  │
│  │   (HTML/CSS/JS)    │  │   ┌──────────────┐   │  │
│  └────────────────────┘  │   │ Slim API     │   │  │
│                           │   │ - Auth       │   │  │
│                           │   │ - Problems   │   │  │
│                           │   │ - Attempts   │   │  │
│                           │   │ - Stats      │   │  │
│                           │   └──────────────┘   │  │
│                           └──────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              MySQL 5.7 Database                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Tables:                                     │   │
│  │  - users (학생/교사 계정)                    │   │
│  │  - problems (생성된 문제)                    │   │
│  │  - attempts (학생 시도 기록)                 │   │
│  │  - grades (성적)                             │   │
│  │  - sessions (세션 관리)                      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
dualdance-standalone/
├── docker-compose.yml              # Docker orchestration
├── .env.example                    # Environment variables template
├── README.md                       # User documentation
├── INSTALL.md                      # Installation guide
│
├── backend/                        # PHP Backend
│   ├── public/                     # Web root
│   │   └── index.php              # API entry point
│   ├── src/
│   │   ├── routes.php             # API routes
│   │   ├── middleware.php         # Auth middleware
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── ProblemController.php
│   │   │   ├── AttemptController.php
│   │   │   └── StatsController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Problem.php
│   │   │   ├── Attempt.php
│   │   │   └── Grade.php
│   │   └── Utils/
│   │       ├── Database.php
│   │       ├── JWT.php
│   │       └── ProblemGenerator.php
│   ├── config/
│   │   └── config.php             # App configuration
│   ├── database/
│   │   ├── schema.sql             # Database schema
│   │   └── seeds.sql              # Sample data
│   ├── composer.json              # PHP dependencies
│   └── Dockerfile                 # PHP container
│
├── frontend/                       # Frontend SPA
│   ├── index.html                 # Main HTML
│   ├── login.html                 # Login page
│   ├── css/
│   │   ├── main.css              # Global styles
│   │   ├── smartphone.css        # Virtual phone UI
│   │   └── animations.css        # Animation effects
│   ├── js/
│   │   ├── app.js                # Main application
│   │   ├── api.js                # API client
│   │   ├── auth.js               # Authentication
│   │   ├── visualization.js      # Canvas visualization
│   │   ├── problemSolver.js      # Problem logic
│   │   └── components/
│   │       ├── smartphone.js     # Smartphone UI component
│   │       ├── stats.js          # Statistics component
│   │       └── feedback.js       # Feedback component
│   └── assets/
│       ├── logo.png
│       └── icons/
│
├── nginx/                          # Nginx configuration
│   ├── nginx.conf
│   └── Dockerfile
│
└── scripts/                        # Utility scripts
    ├── install.sh                 # Installation script
    ├── seed.sh                    # Database seeding
    └── backup.sh                  # Backup script
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/me                # Get current user
```

### Problems
```
POST   /api/problems/generate      # Generate new problem
GET    /api/problems/:id           # Get specific problem
GET    /api/problems               # List problems (with filters)
```

### Attempts
```
POST   /api/attempts               # Submit answer attempt
GET    /api/attempts               # Get user's attempts
GET    /api/attempts/:id           # Get specific attempt
```

### Statistics
```
GET    /api/stats/user             # User statistics
GET    /api/stats/leaderboard      # Leaderboard (optional)
```

### Settings
```
GET    /api/settings               # Get user settings
PUT    /api/settings               # Update settings
```

## 🗄️ Database Schema

### users
```sql
- id (INT, PK, AUTO_INCREMENT)
- username (VARCHAR(50), UNIQUE)
- email (VARCHAR(100), UNIQUE)
- password_hash (VARCHAR(255))
- role (ENUM: 'student', 'teacher', 'admin')
- settings (JSON) -- difficulty, animation_speed, etc.
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### problems
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK -> users.id, nullable)
- problem_type (ENUM: 'exponential', 'logarithmic', 'intersection')
- exp_base (DECIMAL(10,2))
- log_base (DECIMAL(10,2))
- exp_coefficient (DECIMAL(10,2))
- log_coefficient (DECIMAL(10,2))
- question_text (TEXT)
- answer (DECIMAL(15,4))
- tolerance (DECIMAL(10,4))
- difficulty (TINYINT 1-5)
- created_at (TIMESTAMP)
```

### attempts
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK -> users.id)
- problem_id (INT, FK -> problems.id)
- answer (DECIMAL(15,4))
- is_correct (BOOLEAN)
- time_spent (INT) -- seconds
- interaction_data (JSON)
- grade (DECIMAL(5,2))
- created_at (TIMESTAMP)
```

### grades
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK -> users.id, UNIQUE)
- total_attempts (INT)
- correct_attempts (INT)
- average_grade (DECIMAL(5,2))
- total_time (INT)
- last_updated (TIMESTAMP)
```

## 🎨 Frontend Architecture

### Component Structure

```javascript
// Web Component approach
class SmartphoneUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
}

customElements.define('smartphone-ui', SmartphoneUI);
```

### State Management

```javascript
// Simple reactive store
const store = {
  state: {
    user: null,
    currentProblem: null,
    stats: {},
    settings: {}
  },

  listeners: [],

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  },

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }
};
```

## 🔐 Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing (bcrypt)
   - HTTPS only in production

2. **API Security**
   - CORS configuration
   - Rate limiting
   - Input validation and sanitization
   - Prepared statements (SQL injection prevention)

3. **Session Management**
   - HTTP-only cookies for tokens
   - CSRF protection
   - Session timeout

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 2: Traditional LAMP Stack
```bash
# Install dependencies
sudo apt-get install nginx php7.1-fpm mysql-server
# Configure and run
```

### Option 3: Cloud Platform
- AWS (EC2 + RDS)
- Google Cloud Platform
- DigitalOcean Droplet

## 📊 Performance Optimization

1. **Backend**
   - Database connection pooling
   - Query optimization with indexes
   - Response caching (Redis)
   - Gzip compression

2. **Frontend**
   - Lazy loading
   - Canvas optimization (requestAnimationFrame)
   - Debounced API calls
   - Service Worker for offline support

## ♿ Accessibility (WCAG 2.1 AA)

- Keyboard navigation support
- ARIA labels on interactive elements
- Screen reader compatibility
- High contrast mode
- Reduced motion support

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📈 Future Enhancements

1. **Phase 2**
   - Progressive Web App (PWA)
   - Offline mode
   - Push notifications
   - Social features (share scores)

2. **Phase 3**
   - Mobile native apps (React Native)
   - Real-time multiplayer
   - AI-powered difficulty adjustment
   - Voice input support

## 🔧 Development Workflow

```bash
# Local development
docker-compose up -d

# Watch frontend changes (no build needed)
# Just refresh browser

# Run tests
composer test
npm test

# Deploy
./scripts/deploy.sh production
```

## 📝 License

GPL v3 or later

---

**Built with ❤️ for mathematics education**
