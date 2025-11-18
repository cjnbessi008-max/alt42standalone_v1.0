# ⭐ Number Constellation (수의 별자리)

**Interactive number pattern visualization app for mathematics education**

Number Constellation is a web application that displays mathematical number patterns (prime numbers, multiples, natural numbers) as beautiful constellations on a virtual smartphone screen. It integrates seamlessly with Moodle LMS to provide an engaging learning experience.

![Number Constellation](https://img.shields.io/badge/Version-1.0.0-blue)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange)
![Moodle](https://img.shields.io/badge/Moodle-3.7-green)

---

## 🌟 Features

- **🎨 Beautiful Constellation Visualization**: Numbers displayed as stars in spiral constellation patterns
- **📱 Virtual Smartphone UI**: Fixed bottom-right smartphone frame for immersive experience
- **🔗 Moodle LMS Integration**: Seamlessly receive problem data from Moodle courses
- **🎯 Multiple Problem Types**:
  - Prime numbers (소수)
  - Multiples (배수)
  - Natural number patterns (자연수 패턴)
  - Composite numbers (합성수)
  - Custom patterns (Fibonacci, squares, etc.)
- **📊 Real-time Progress Tracking**: Save and track student performance
- **🎮 Interactive Learning**: Click stars to select numbers
- **✅ Instant Feedback**: Visual feedback with correct/incorrect indicators
- **🌐 Bilingual Support**: Korean and English interface

---

## 🏗️ Architecture

```
number-constellation-app/
├── moodle-plugin/          # Moodle 3.7 local plugin
│   ├── version.php         # Plugin metadata
│   ├── lib.php             # Core functions
│   ├── settings.php        # Admin settings
│   └── lang/en/            # Language strings
├── backend/                # PHP 7.1.9 API
│   ├── api/
│   │   ├── problem.php     # Create problem endpoint
│   │   ├── get_problem.php # Retrieve problem data
│   │   └── progress.php    # Save/get student progress
│   └── config/
│       ├── database.php    # DB connection
│       └── config.php      # App configuration
├── frontend/               # Web application
│   ├── public/
│   │   └── index.html      # Main HTML
│   └── src/
│       ├── components/
│       │   ├── constellation.js  # Visualization engine
│       │   └── app.js           # Main app controller
│       ├── utils/
│       │   ├── math.js          # Math utilities
│       │   └── api.js           # API client
│       └── styles/
│           └── main.css         # Styles
├── database/
│   └── schema.sql          # MySQL 5.7 schema
└── docker/
    ├── Dockerfile          # PHP 7.1.9 + Apache
    └── docker-compose.yml  # Full stack deployment
```

---

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**:
   ```bash
   cd number-constellation-app
   ```

2. **Configure environment**:
   ```bash
   cd docker
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - App: http://localhost:8080
   - PHPMyAdmin: http://localhost:8081

### Option 2: Manual Installation

#### Prerequisites
- PHP 7.1.9
- MySQL 5.7
- Apache 2.4
- Moodle 3.7

#### Steps

1. **Setup Database**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. **Configure Backend**:
   ```bash
   cd backend/config
   # Edit database.php and config.php with your settings
   ```

3. **Configure Apache**:
   ```apache
   DocumentRoot /path/to/number-constellation-app/frontend/public
   Alias /api /path/to/number-constellation-app/backend/api
   ```

4. **Install Moodle Plugin**:
   ```bash
   cp -r moodle-plugin /path/to/moodle/local/numconstellation
   # Visit Moodle admin to complete installation
   ```

---

## 📖 Usage

### 1. Configure Moodle Plugin

In Moodle Admin → Plugins → Local plugins → Number Constellation:

- **API URL**: `http://localhost:8080/api/problem.php`
- **App URL**: `http://localhost:8080`
- **API Key**: `your-secret-api-key-here`

### 2. Create a Problem from Moodle

```php
<?php
require_once($CFG->dirroot . '/local/numconstellation/lib.php');

// Example: Prime numbers problem
$response = local_numconstellation_send_problem(
    $courseid,      // Moodle course ID
    $userid,        // Moodle user ID
    'prime',        // Problem type
    1,              // Range start
    50,             // Range end
    'easy',         // Difficulty
    array(          // Additional data
        'instruction' => '별자리에서 소수를 모두 찾으세요',
        'targets' => [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
    )
);

// Get app URL
$app_url = local_numconstellation_get_app_url(
    $response->problem_id,
    $userid
);

// Display in virtual smartphone (bottom-right)
echo '<iframe src="' . $app_url . '" style="position:fixed; bottom:20px; right:20px; width:375px; height:667px;"></iframe>';
```

### 3. Problem Types

#### Prime Numbers (소수)
```php
local_numconstellation_send_problem($cid, $uid, 'prime', 1, 100, 'medium');
```

#### Multiples (배수)
```php
local_numconstellation_send_problem($cid, $uid, 'multiple', 1, 100, 'easy', [
    'multiple_of' => 3
]);
```

#### Custom Patterns (Fibonacci, etc.)
```php
local_numconstellation_send_problem($cid, $uid, 'natural', 1, 50, 'hard', [
    'instruction' => '피보나치 수열을 찾으세요',
    'targets' => [1, 1, 2, 3, 5, 8, 13, 21, 34],
    'pattern_type' => 'fibonacci'
]);
```

---

## 🎯 Problem Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `prime` | Prime numbers | 2, 3, 5, 7, 11, 13... |
| `multiple` | Multiples of a number | Multiples of 3: 3, 6, 9, 12... |
| `natural` | Natural number patterns | Fibonacci, squares, etc. |
| `composite` | Composite numbers | 4, 6, 8, 9, 10, 12... |
| `mixed` | Custom combinations | Teacher-defined targets |

---

## 🔧 Configuration

### Backend Configuration (`backend/config/config.php`)

```php
define('API_KEY', 'your-secret-api-key-here');
define('CORS_ORIGIN', '*');
```

### Frontend Configuration (`frontend/src/utils/api.js`)

```javascript
const API = {
    baseURL: 'http://localhost:8080/api',
    apiKey: 'your-secret-api-key-here'
};
```

---

## 📊 Database Schema

### Tables

1. **problems**: Stores problem data from Moodle
2. **student_progress**: Tracks student interactions
3. **constellation_configs**: Visualization settings
4. **analytics**: Course-level analytics

---

## 🎨 Customization

### Constellation Colors

Edit `constellation_configs` table or modify defaults in `database/schema.sql`:

```sql
UPDATE constellation_configs SET
  prime_color = '#FF4444',
  multiple_color = '#4444FF',
  natural_color = '#44FF44'
WHERE config_name = 'default';
```

### Smartphone Frame Position

Modify CSS in `frontend/src/styles/main.css`:

```css
#smartphone-container {
    position: fixed;
    bottom: 20px;   /* Adjust vertical position */
    right: 20px;    /* Adjust horizontal position */
}
```

---

## 🧪 Testing

### Test Problem Creation

```bash
curl -X POST http://localhost:8080/api/problem.php \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "moodle_problem_id": "TEST_001",
    "moodle_course_id": 1,
    "moodle_user_id": 1,
    "problem_type": "prime",
    "number_range_start": 1,
    "number_range_end": 50,
    "difficulty_level": "easy"
  }'
```

### Access Test App

```
http://localhost:8080?problem_id=TEST_001&user_id=1
```

---

## 📱 Mobile Responsiveness

The virtual smartphone frame is optimized for:
- iPhone 8/SE dimensions (375x667px)
- Fixed bottom-right position
- Responsive canvas that adapts to screen size
- Touch-friendly star selection

---

## 🛠️ Development

### Local Development

```bash
# Backend (PHP built-in server)
cd backend
php -S localhost:8000

# Frontend (any static server)
cd frontend/public
python3 -m http.server 8080
```

### Debugging

Enable error reporting in `backend/config/config.php`:

```php
error_reporting(E_ALL);
ini_set('display_errors', '1');
```

---

## 🔐 Security

- API key authentication for write operations
- Input validation and sanitization
- SQL injection protection via PDO prepared statements
- CORS configuration for cross-origin requests
- Session-based progress tracking

---

## 📈 Analytics & Reporting

Retrieve student performance:

```php
$progress = local_numconstellation_get_progress($problemId, $userId);
echo "Score: " . $progress->score . "%";
```

---

## 🌍 Internationalization

The app supports Korean and English. Add more languages by:

1. Adding language strings in `moodle-plugin/lang/`
2. Updating UI text in `frontend/src/components/app.js`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Authors

- KAIST Touch Math Academy
- Built with ❤️ for mathematics education

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

---

## 🎓 Educational Use

Perfect for:
- Elementary mathematics education
- Number theory concepts
- Pattern recognition
- Interactive problem solving
- Moodle-integrated courses

---

## 🚧 Roadmap

- [ ] Additional pattern types (triangular numbers, perfect squares)
- [ ] Multiplayer mode
- [ ] Leaderboards
- [ ] Sound effects
- [ ] Tablet/desktop optimized views
- [ ] Export results to PDF
- [ ] Integration with other LMS platforms

---

**Enjoy exploring the Number Constellation! ⭐✨**
