# Logical Collapse 논리적 붕괴 효과

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-777BB4?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-5.7-4479A1?logo=mysql)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Moodle](https://img.shields.io/badge/Moodle-3.7-F98012?logo=moodle)

**논리적 추론 교육을 위한 interactive 웹앱**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [API](#api)

</div>

---

## 📖 Overview

**Logical Collapse**는 학생들의 논리적 추론 능력을 향상시키기 위한 교육용 웹 애플리케이션입니다. Moodle LMS와 통합되어 문제 정보를 받아오고, 가상 스마트폰 화면에 표시되며, 잘못된 추론이 감지되면 해당 부분이 부드럽게 무너지는 시각적 효과를 제공합니다.

### 🎯 Key Features

- **🔗 Moodle LMS 연동**: Moodle 3.7 Web Services API를 통한 실시간 데이터 동기화
- **📱 가상 스마트폰 UI**: 우측 하단에 표시되는 현실적인 스마트폰 인터페이스
- **💥 Logical Collapse Effect**: 잘못된 추론 시 부드러운 붕괴 애니메이션 (Framer Motion 기반)
- **📊 실시간 진행 상황 추적**: 학생별 문제 풀이 진행도 실시간 업데이트
- **🎨 아름다운 애니메이션**: GPU 가속 애니메이션으로 부드러운 사용자 경험
- **🔐 안전한 데이터 관리**: MySQL 5.7 기반 데이터 저장 및 관리

---

## 🎬 Demo

### Logical Collapse Effect in Action

잘못된 추론 단계를 검증하면 다음과 같은 효과가 발생합니다:

1. **Shake Animation**: 단계가 흔들리기 시작
2. **Crack Formation**: 빨간 금이 생성됨
3. **Particle Explosion**: 파편이 사방으로 흩어짐
4. **Smooth Collapse**: 3D 회전과 함께 부드럽게 무너짐
5. **Fade Out**: 완전히 사라짐

### Virtual Smartphone Display

- 실제 스마트폰과 유사한 디자인 (노치, 스피커, 홈 버튼 포함)
- 반응형 디스플레이
- 우측 하단에 고정 위치
- 드롭 쉐도우로 입체감 표현

---

## 🚀 Features

### 1. 논리적 추론 학습

- **삼단논법 (Syllogism)**: 전제와 결론의 논리적 관계 학습
- **수학적 귀납법**: 단계별 증명 과정 시각화
- **오류 탐지**: 논리적 오류 유형 학습 (후건 긍정의 오류 등)

### 2. Moodle LMS 통합

```
Moodle Quiz/Problem
         ↓
  Web Service API
         ↓
  PHP Backend (7.1.9)
         ↓
   MySQL Database
         ↓
  React Frontend
         ↓
 Virtual Smartphone Display
```

### 3. 실시간 피드백

- 단계별 검증 시스템
- 즉각적인 정답/오답 표시
- 상세한 설명 제공
- 진행 상황 추적

### 4. 데이터 분석

- 학생별 정확도 통계
- 문제별 완료율
- 시간 소요 분석
- 오류 패턴 분석

---

## 📋 Requirements

### System Requirements

- **Node.js**: 16.x or higher
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **Docker**: 20.x or higher (optional)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🛠 Installation

### Method 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/logical-collapse.git
cd logical-collapse

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your Moodle credentials
nano .env

# 4. Start with Docker Compose
docker-compose up -d

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# PHPMyAdmin: http://localhost:8081
```

### Method 2: Manual Installation

#### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

#### Backend Setup

```bash
# Setup web server (Apache/Nginx)
# Point document root to ./backend

# Install PHP dependencies (if any)
cd backend
composer install  # if using Composer

# Configure Apache
# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Database Setup

```bash
# Create database
mysql -u root -p < database/schema.sql

# Load sample data (optional)
mysql -u root -p < database/seed.sql
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# React App
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_MOODLE_TOKEN=your_moodle_token

# Database
DB_HOST=localhost
DB_NAME=logical_collapse
DB_USER=root
DB_PASS=your_password

# Moodle
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### Moodle Web Services Setup

1. Enable Web Services in Moodle:
   - Site Administration → Advanced Features
   - Enable "Enable web services"

2. Create a new service:
   - Site Administration → Plugins → Web Services → External Services
   - Add service: `Logical Collapse API`

3. Add required functions:
   - `mod_quiz_get_quiz_by_courses`
   - `mod_quiz_save_attempt`
   - `core_user_get_users_by_field`

4. Generate token:
   - Site Administration → Plugins → Web Services → Manage tokens
   - Create token for service user

See [moodle-plugin/README.md](./moodle-plugin/README.md) for detailed instructions.

---

## 💻 Usage

### For Students

1. **Access the Application**: Navigate to the web app URL
2. **View Current Problem**: Problem automatically loads from Moodle
3. **Work Through Steps**: Read each reasoning step carefully
4. **Validate Steps**: Click "검증하기" to check your answer
5. **Watch Collapse Effect**: Incorrect steps will smoothly collapse
6. **Track Progress**: View your progress at the bottom

### For Teachers

1. **Create Quizzes in Moodle**: Use standard Moodle quiz interface
2. **Automatic Sync**: Problems automatically appear in Logical Collapse
3. **Monitor Progress**: View student progress in Moodle gradebook
4. **Analyze Results**: Use analytics to identify common errors

---

## 🔌 API Documentation

### Endpoints

#### `POST /api/connect`
Connect to Moodle LMS

**Request:**
```json
{
  "token": "moodle_webservice_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected to Moodle"
}
```

#### `GET /api/problems/current`
Get current active problem

**Response:**
```json
{
  "id": 1,
  "title": "삼단논법: 소크라테스의 죽음",
  "description": "고전적인 삼단논법 예제",
  "reasoning_steps": [
    {
      "type": "전제",
      "text": "모든 사람은 죽는다.",
      "formula": "∀x (Person(x) → Mortal(x))",
      "is_correct": true,
      "requires_validation": false
    }
  ]
}
```

#### `POST /api/problems/validate`
Validate a reasoning step

**Request:**
```json
{
  "problem_id": 1,
  "step_index": 2,
  "is_correct": false,
  "student_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Validation saved",
  "is_correct": false
}
```

#### `GET /api/progress/:student_id`
Get student progress

**Response:**
```json
{
  "student_id": 123,
  "problems": [
    {
      "problem_id": 1,
      "title": "삼단논법",
      "total_attempts": 5,
      "correct_attempts": 4,
      "progress_percentage": 80.00
    }
  ]
}
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Port 3000)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  VirtualSmartphone Component                      │  │
│  │    └── LogicalReasoningDisplay                    │  │
│  │         └── LogicalStep (with Collapse Effect)   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (Axios)
┌─────────────────────▼───────────────────────────────────┐
│              PHP Backend API (Port 8080)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MoodleConnector Service                          │  │
│  │  Problem Model | Student Model                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────┬──────────────────────┬────────────────────────┘
          │                      │
┌─────────▼─────────┐  ┌────────▼─────────────────────────┐
│  MySQL 5.7 DB     │  │   Moodle 3.7 LMS                │
│  (Port 3306)      │  │   Web Service API               │
│  - problems       │  │   - Quizzes                      │
│  - students       │  │   - Users                        │
│  - validations    │  │   - Grades                       │
└───────────────────┘  └──────────────────────────────────┘
```

### Tech Stack

- **Frontend**: React 18, Framer Motion, Axios
- **Backend**: PHP 7.1.9, PDO
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7 Web Services
- **Containerization**: Docker, Docker Compose

---

## 📁 Project Structure

```
logical-collapse/
├── public/                  # Static files
│   └── index.html          # HTML template
├── src/                    # React source code
│   ├── components/         # React components
│   │   ├── VirtualSmartphone.jsx
│   │   ├── LogicalReasoningDisplay.jsx
│   │   └── LogicalStep.jsx
│   ├── services/           # API services
│   │   └── MoodleConnector.js
│   ├── styles/             # CSS files
│   │   ├── global.css
│   │   ├── App.css
│   │   ├── VirtualSmartphone.css
│   │   └── LogicalStep.css
│   ├── App.js              # Main App component
│   └── index.js            # Entry point
├── backend/                # PHP backend
│   ├── api/                # API endpoints
│   │   └── index.php
│   ├── config/             # Configuration
│   │   ├── database.php
│   │   └── moodle.php
│   ├── models/             # Data models
│   │   ├── Problem.php
│   │   └── Student.php
│   └── Dockerfile          # PHP Docker image
├── database/               # Database files
│   ├── schema.sql          # DB schema
│   ├── seed.sql            # Sample data
│   └── README.md           # DB documentation
├── moodle-plugin/          # Moodle integration docs
│   └── README.md
├── .env.example            # Environment template
├── docker-compose.yml      # Docker setup
├── package.json            # NPM dependencies
├── webpack.config.js       # Webpack config
└── README.md               # This file
```

---

## 🎨 Customization

### Modify Collapse Animation

Edit `src/components/LogicalStep.jsx`:

```javascript
const collapseVariants = {
  collapsing: {
    opacity: [1, 0.8, 0.6, 0.3, 0],
    height: ['auto', '80%', '60%', '40%', '20%', 0],
    scale: [1, 0.98, 0.95, 0.9, 0.8, 0.6],
    rotateX: [0, 5, 10, 20, 45, 90],
    transition: {
      duration: 1.5,  // Adjust duration here
      ease: [0.43, 0.13, 0.23, 0.96]  // Adjust easing
    }
  }
};
```

### Change Smartphone Position

Edit `src/styles/VirtualSmartphone.css`:

```css
.smartphone-container {
  /* Change position */
  bottom: 30px;  /* Distance from bottom */
  right: 30px;   /* Distance from right */

  /* Or move to left */
  /* left: 30px; */
}
```

### Add Custom Problem Types

1. Create problem in Moodle
2. Add custom reasoning step types in `backend/api/index.php`
3. Update frontend to handle new types

---

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
npm test

# Backend tests (if implemented)
cd backend
php vendor/bin/phpunit
```

### Manual Testing

1. Start the application: `docker-compose up`
2. Navigate to http://localhost:3000
3. Check console for Moodle connection status
4. Test with sample data from `database/seed.sql`

---

## 🐛 Troubleshooting

### Moodle Connection Issues

**Problem**: "Failed to connect to Moodle"

**Solutions**:
1. Verify `MOODLE_TOKEN` in `.env` is correct
2. Check Moodle web services are enabled
3. Ensure service has required functions
4. Check CORS settings if on different domains

### Database Connection Failed

**Problem**: "Database connection failed"

**Solutions**:
1. Verify MySQL is running: `docker-compose ps`
2. Check credentials in `.env`
3. Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Collapse Animation Not Working

**Problem**: Steps don't collapse when incorrect

**Solutions**:
1. Check browser console for errors
2. Ensure Framer Motion is installed: `npm list framer-motion`
3. Verify `is_correct` is set to `false` in step data
4. Check CSS animations are enabled in browser

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **KAIST Touch Math Academy** - Initial work

---

## 🙏 Acknowledgments

- Inspired by educational psychology research on visual feedback
- Built with support from KAIST Educational Technology Lab
- Special thanks to Moodle community for API documentation
- Framer Motion for beautiful animations

---

## 📞 Support

For issues and questions:

- **GitHub Issues**: [Create an issue](https://github.com/your-org/logical-collapse/issues)
- **Documentation**: See [docs/](./docs/) folder
- **Moodle Integration**: See [moodle-plugin/README.md](./moodle-plugin/README.md)
- **Database**: See [database/README.md](./database/README.md)

---

## 🗺 Roadmap

### Version 1.1 (Planned)
- [ ] Multi-language support (English, Korean)
- [ ] Voice feedback for accessibility
- [ ] Advanced analytics dashboard
- [ ] Export progress reports (PDF)

### Version 2.0 (Future)
- [ ] AI-powered hint system
- [ ] Collaborative problem solving
- [ ] Gamification elements
- [ ] Mobile native app (React Native)

---

<div align="center">

**Made with ❤️ by KAIST Touch Math Academy**

[⬆ Back to top](#logical-collapse-논리적-붕괴-효과)

</div>
