# Math Concept Game System (수학 개념 게임 시스템)

## 🎮 Overview

A revolutionary gamified learning system that transforms elementary students' relationship with math from anxiety to affection through emotional engagement and sensory-first learning.

**Core Innovation**: Math concepts are personified as collectible "concept spirits" (개념 정령) that grow alongside the student.

## ✨ Key Features

- **12 Concept Spirit Games**: Each math concept is a unique character
- **5-Stage Growth Loop**: Sensation → Pattern → Application → Mastery
- **Card Collection System**: Unlock and level up spirit companions
- **0-10% Math Notation**: Focus on feeling and understanding first
- **Virtual Smartphone Widget**: Bottom-right PC display integration
- **Moodle LMS Integration**: Seamless problem synchronization

## 🎴 The 12 Concept Spirits

1. 🍕 **Frani** - Fractions (분수)
2. 💰 **Coni** - Decimals (소수)
3. 🎨 **Rio** - Ratios (비율)
4. 🏠 **Dimo** - Geometry (도형)
5. 🎵 **Roop** - Sequences (수열)
6. 🍦 **Scoop** - Division (나눗셈)
7. ⏰ **Timmy** - Time (시간)
8. 🎒 **Packer** - Units (단위)
9. 🎲 **Fork** - Probability (확률)
10. 🌡️ **Weathering** - Graphs (그래프)
11. 📖 **Chatlin** - Word Problems (문제 읽기)
12. 📝 **Order** - Logic (논리)

## 🏗️ Tech Stack

### Backend
- **PHP 7.1.9**: Legacy compatibility
- **MySQL 5.7**: Data persistence
- **RESTful API**: JSON-based communication

### Frontend
- **HTML5 Canvas**: Interactive game rendering
- **Vanilla JavaScript**: Lightweight and fast
- **CSS3**: Responsive smartphone widget design

### Integration
- **Moodle LMS**: Problem triggering and grade sync
- **Web Services API**: Bi-directional communication

## 📁 Project Structure

```
alt42standalone_v1.0/
├── api/                      # Backend API
│   ├── controllers/          # Request handlers
│   │   ├── AuthController.php
│   │   ├── GameController.php
│   │   ├── CardController.php
│   │   ├── ProgressController.php
│   │   ├── PointsController.php
│   │   └── MoodleController.php
│   ├── helpers/              # Utility classes
│   │   ├── Response.php
│   │   └── Auth.php
│   └── index.php             # API entry point
├── config/                   # Configuration files
│   ├── config.php            # App settings
│   └── database.php          # DB connection
├── database/                 # Database files
│   └── schema.sql            # Complete schema + seed data
├── public/                   # Frontend assets
│   ├── css/
│   │   ├── widget.css        # Virtual smartphone styles
│   │   └── common.css
│   ├── js/
│   │   ├── api.js            # API client
│   │   ├── widget.js         # Widget controller
│   │   └── app.js            # Main app logic
│   ├── games/                # Individual games
│   │   ├── fractions/        # Frani's game
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── game.js
│   │   ├── decimals/
│   │   ├── ratios/
│   │   └── ... (10 more)
│   └── index.html            # Widget entry point
├── tasks/                    # Documentation
│   ├── 0001-prd-ai-education-pipeline.md
│   └── 0002-prd-math-concept-game-system.md
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Moodle 3.x+ (for integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alt42standalone_v1.0
   ```

2. **Set up the database**
   ```bash
   mysql -u root -p
   CREATE DATABASE math_game_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit;

   mysql -u root -p math_game_dev < database/schema.sql
   ```

3. **Configure database connection**

   Edit `config/database.php`:
   ```php
   'development' => [
       'host' => 'localhost',
       'database' => 'math_game_dev',
       'username' => 'your_username',
       'password' => 'your_password',
   ]
   ```

4. **Configure web server**

   **Apache**: Point document root to `public/` directory

   **Nginx**: Configure PHP-FPM and set root to `public/`

5. **Set permissions**
   ```bash
   chmod -R 755 public/
   chmod -R 755 api/
   ```

6. **Access the application**

   Navigate to: `http://localhost/math-game/`

### Testing

1. **Create a test student** (already seeded):
   - Username: `test_student_1`
   - Name: 김민준
   - Grade: 3

2. **Login**:
   - Enter username in the widget
   - Click "시작하기" (Start)

3. **Play a game**:
   - Click "🎮 게임하기" (Play Games)
   - Select "조각요정 프라니" (Frani - Fractions)
   - Draw lines to slice the pizza!

## 📡 API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "username": "test_student_1"
}
```

**POST** `/api/auth/register`
```json
{
  "username": "new_student",
  "full_name": "홍길동",
  "grade_level": 4,
  "email": "student@example.com"
}
```

### Games

**GET** `/api/games` - List all games with progress

**POST** `/api/games/launch` - Start a game session
```json
{
  "concept_name": "fractions",
  "stage": 1
}
```

**POST** `/api/games/complete` - Complete a stage
```json
{
  "session_id": "...",
  "stage": 1,
  "score": 85.5,
  "time_spent": 120
}
```

### Cards

**GET** `/api/cards/collection` - Get student's card collection

**GET** `/api/cards/detail/{card_id}` - Get card details

**POST** `/api/cards/favorite` - Toggle favorite status

### Progress

**GET** `/api/progress/summary` - Overall progress summary

**GET** `/api/progress/game/{card_id}` - Game-specific progress

### Moodle Integration

**POST** `/api/moodle/trigger` - Trigger game from Moodle
```json
{
  "moodle_user_id": 1001,
  "problem_type": "fractions",
  "problem_id": 12345
}
```

**POST** `/api/moodle/complete` - Sync completion to Moodle
```json
{
  "sync_id": 123,
  "session_id": "...",
  "score": 85.5
}
```

## 🎯 Game Implementation Guide

Each game follows the **5-Stage Structure**:

### Stage 1: Sensation (감각 단계)
- **Goal**: Feel the concept through manipulation
- **Notation**: 0% math symbols
- **Example**: Drag pizza slices with fingers

### Stage 2: Pattern Discovery (패턴 발견)
- **Goal**: "Oh, this is the rule!"
- **Notation**: 0-5% symbols
- **Example**: Notice equal slices make fairy happy

### Stage 3: Situational Response (상황 대응)
- **Goal**: Use concept in real scenarios
- **Notation**: 5% symbols
- **Example**: "Share pizza with 3 friends"

### Stage 4: Simple Application (간단 적용)
- **Goal**: Light conceptual understanding
- **Notation**: 10% symbols
- **Example**: "Counting pieces makes it easier!"

### Stage 5: Concept Card Acquired (개념 카드 획득)
- **Goal**: Emotional ownership of concept
- **Notation**: 10% symbols
- **Example**: Unlock "Frani Lv.1 - Equal Division Master"

## 🎨 Creating a New Game

1. **Create game directory**
   ```bash
   mkdir -p public/games/your_game
   ```

2. **Add HTML structure** (`index.html`)
   ```html
   <!DOCTYPE html>
   <html lang="ko">
   <head>
       <link rel="stylesheet" href="style.css">
   </head>
   <body>
       <canvas id="game-canvas"></canvas>
       <script src="game.js"></script>
   </body>
   </html>
   ```

3. **Implement game logic** (`game.js`)
   ```javascript
   class YourGame {
       constructor() {
           this.sessionId = this.getSessionId();
           this.currentStage = 1;
           this.score = 0;
           this.init();
       }

       async completeStage() {
           window.parent.postMessage({
               type: 'GAME_COMPLETE',
               session_id: this.sessionId,
               stage: this.currentStage,
               score: this.score,
               time_spent: this.timeSpent
           }, '*');
       }
   }
   ```

4. **Add to database**
   ```sql
   INSERT INTO concept_cards (concept_name, spirit_name, game_folder)
   VALUES ('your_concept', 'Your Spirit Name', 'your_game');
   ```

## 🔧 Configuration

### Environment Variables

Create `.env` file (optional):
```
APP_ENV=development
DB_HOST=localhost
DB_NAME=math_game_dev
DB_USER=root
DB_PASS=password
MOODLE_URL=http://localhost/moodle
MOODLE_WS_TOKEN=your_token_here
```

### Points Configuration

Edit `config/config.php`:
```php
define('POINTS_PER_STAGE_1', 20);
define('POINTS_PER_STAGE_2', 25);
define('POINTS_PER_STAGE_3', 30);
define('POINTS_PER_STAGE_4', 40);
define('POINTS_PER_STAGE_5', 50);
define('BONUS_PERFECT_SCORE', 10);
```

## 📊 Database Views

The system includes helpful views:

- `v_student_card_summary` - Student collection overview
- `v_game_completion_stats` - Game completion rates
- `v_recent_activity` - Recent student activity

Usage:
```sql
SELECT * FROM v_student_card_summary WHERE student_id = 1;
```

## 🔒 Security

- **Session-based authentication**: Secure cookie handling
- **Prepared statements**: SQL injection prevention
- **Input validation**: All API endpoints validated
- **CORS restrictions**: Allowed origins only
- **XSS protection**: Output encoding

## 📈 Success Metrics

### Primary KPIs
- **Emotional Shift**: 60% of students improve attitude by 2+ points
- **Engagement Rate**: >40% voluntary replay rate
- **Completion Rate**: >70% complete all stages
- **Retention**: 80% retention vs. 50% traditional methods
- **Anxiety Reduction**: 30% reduction in math anxiety

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-game`)
3. Commit changes (`git commit -m 'Add amazing game'`)
4. Push to branch (`git push origin feature/amazing-game`)
5. Open Pull Request

## 📝 License

Copyright © 2025 KAIST Touch Math Academy

## 📧 Contact

For questions or support:
- Documentation: See `/tasks/*.md`
- Issues: GitHub Issues
- Email: [your-email]

## 🙏 Acknowledgments

- **Claude AI**: System architecture and implementation
- **KAIST Touch Math Academy**: Educational methodology
- **Elementary Students**: The real math heroes! 🌟

---

**Remember**: Math concepts are not abstract enemies—they are living friends that grow with the child. 🧚‍♀️✨
