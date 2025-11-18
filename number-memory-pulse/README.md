# Number Memory Pulse 💡

숫자 패턴 기억을 강화하는 Moodle LMS 통합 교육용 웹 앱

## 📱 Overview

Number Memory Pulse는 우측 하단에 가상 스마트폰 화면으로 표시되는 인터랙티브 숫자 기억력 훈련 앱입니다. Moodle 3.7과 통합되어 학생들의 학습 진행 상황을 추적하고 문제를 동적으로 제공합니다.

### ✨ Features

- 🎯 **난이도별 문제**: 5단계 난이도 (쉬움 ~ 마스터)
- 📊 **진행 상황 추적**: 점수, 레벨, 연속 정답 기록
- 🏆 **리더보드**: 코스별 상위 랭킹
- 📱 **반응형 UI**: 가상 스마트폰 인터페이스
- 🔄 **실시간 동기화**: Moodle LMS와 자동 연동
- 📈 **상세 통계**: 난이도별 정확도, 평균 시간 등

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Architecture**: MVC pattern with event-driven design

## 📋 Requirements

- Moodle 3.7+
- PHP 7.1.9+
- MySQL 5.7+
- Modern web browser (Chrome, Firefox, Safari, Edge - last 2 versions)

## 📦 Installation

### Step 1: Database Setup

1. Connect to your MySQL database:
```bash
mysql -u root -p
```

2. Create the database tables:
```bash
mysql -u [username] -p [database_name] < sql/schema.sql
```

Or execute the SQL file through phpMyAdmin.

### Step 2: Moodle Integration

1. Copy the entire `number-memory-pulse` directory to your Moodle installation:
```bash
cp -r number-memory-pulse /path/to/moodle/mod/numbermemorypulse
```

2. Create a Moodle module structure (if integrating as a full module):
```
/path/to/moodle/mod/numbermemorypulse/
├── index.php
├── view.php
├── version.php
├── lib.php
├── css/
├── js/
├── php/
└── sql/
```

3. Create `version.php` for Moodle:
```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_numbermemorypulse';
$plugin->version = 2025111800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0.0';
```

### Step 3: Register with Moodle

1. Log in to Moodle as admin
2. Navigate to: **Site administration → Notifications**
3. Moodle will detect the new plugin and install it
4. Follow the on-screen instructions

### Step 4: Standalone Integration (Alternative)

If you want to integrate the app into any Moodle page without creating a full module:

1. Add the following code to your Moodle theme or page:

```html
<!-- Add to page footer or custom area -->
<link rel="stylesheet" href="/path/to/numbermemorypulse/css/smartphone.css">
<link rel="stylesheet" href="/path/to/numbermemorypulse/css/game.css">

<!-- Include the app HTML -->
<?php include('/path/to/numbermemorypulse/index.html'); ?>

<!-- Include scripts -->
<script src="/path/to/numbermemorypulse/js/config.js"></script>
<script src="/path/to/numbermemorypulse/js/moodle-api.js"></script>
<script src="/path/to/numbermemorypulse/js/game-engine.js"></script>
<script src="/path/to/numbermemorypulse/js/ui-controller.js"></script>
<script src="/path/to/numbermemorypulse/js/main.js"></script>
```

2. Update the API base URL in `js/config.js`:
```javascript
API_BASE_URL: '/mod/numbermemorypulse/php/api.php'
```

## 🎮 Usage

### For Students

1. The virtual smartphone appears in the bottom-right corner of the page
2. Click **시작하기** (Start) to begin
3. Watch the number pattern displayed on screen
4. Enter the numbers you remember using the number pad
5. Click ✓ to submit your answer
6. Progress through levels by earning points

### For Teachers

Teachers can create custom problems through the Moodle interface or directly in the database:

```php
// Example: Creating a problem programmatically
require_once('php/game-functions.php');

nmp_create_problem([
    'course_id' => 1,
    'name' => 'Level 3 Challenge',
    'description' => '5자리 숫자 기억하기',
    'pattern' => '24680',
    'difficulty_level' => 3
]);
```

### For Administrators

Monitor game statistics and settings:

```php
// Get course statistics
$stats = nmp_get_user_stats($userid, $courseid);

// Update game settings
nmp_set_setting($courseid, 'default_difficulty', 2, 'int');
nmp_set_setting($courseid, 'enable_leaderboard', true, 'boolean');
```

## 🗂️ File Structure

```
number-memory-pulse/
├── index.html              # Main HTML structure
├── css/
│   ├── smartphone.css      # Virtual smartphone styling
│   └── game.css           # Game-specific styles
├── js/
│   ├── config.js          # Configuration and constants
│   ├── moodle-api.js      # API client
│   ├── game-engine.js     # Core game logic
│   ├── ui-controller.js   # UI management
│   └── main.js            # Application initialization
├── php/
│   ├── config.php         # PHP configuration
│   ├── api.php            # API endpoints
│   └── game-functions.php # Helper functions
├── sql/
│   └── schema.sql         # Database schema
└── README.md              # This file
```

## 🔌 API Reference

### Get Problem
```
GET /php/api.php?action=get_problem&difficulty=1
```

### Submit Answer
```
POST /php/api.php?action=submit_answer
Body: {
    "problem_id": 123,
    "user_answer": "12345",
    "time_spent": 15
}
```

### Get Progress
```
GET /php/api.php?action=get_progress
```

### Get Leaderboard
```
GET /php/api.php?action=get_leaderboard&limit=10
```

## 🎨 Customization

### Changing Colors

Edit `css/game.css`:
```css
.app-container {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Adjusting Difficulty

Edit `js/config.js`:
```javascript
DISPLAY_DURATIONS: {
    1: 2000, // Easier: 2s per number
    2: 1500,
    // ...
}
```

### Custom Problem Generation

You can create problems dynamically:
```php
// Generate random patterns
for ($i = 0; $i < 10; $i++) {
    $pattern = nmp_generate_pattern(5);
    nmp_create_problem([
        'course_id' => 1,
        'name' => "Auto Problem $i",
        'pattern' => $pattern,
        'difficulty_level' => rand(1, 3)
    ]);
}
```

## 📊 Database Schema

### Tables

- **mdl_nmp_problems**: Stores number patterns and metadata
- **mdl_nmp_user_attempts**: Tracks each attempt
- **mdl_nmp_user_progress**: Aggregate user statistics
- **mdl_nmp_leaderboard**: Ranking cache
- **mdl_nmp_settings**: Module configuration

See `sql/schema.sql` for detailed structure.

## 🐛 Troubleshooting

### App Not Loading
- Check browser console for JavaScript errors
- Verify all files are accessible
- Confirm user is logged into Moodle

### Database Errors
- Ensure MySQL 5.7+ is installed
- Verify table names have 'mdl_' prefix (or your custom prefix)
- Check database user permissions

### API Errors
- Verify PHP 7.1.9+ is installed
- Check PHP error logs
- Ensure Moodle config.php is accessible

### Pattern Not Displaying
- Clear browser cache
- Check network tab for API responses
- Verify problems exist in database

## 🔒 Security

- All user inputs are sanitized
- SQL injection protection via prepared statements
- CSRF protection through Moodle's built-in mechanisms
- XSS prevention via output escaping
- Authentication required for all API endpoints

## 📈 Performance

- Efficient database indexing for fast queries
- Caching of frequently accessed data
- Optimized animations for smooth 60fps
- Lazy loading of resources
- Materialized leaderboard view for performance

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 (not supported)

## 📝 License

This project is created for KAIST Touch Math Academy.

## 👥 Credits

Developed as part of the AI Education System Pipeline project.

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Moodle logs: `Site administration → Reports → Logs`
- Enable debugging: `Site administration → Development → Debugging`

## 🚀 Future Enhancements

- [ ] Sound effects and vibration feedback
- [ ] Achievement badges
- [ ] Multi-player challenges
- [ ] Custom pattern types (sequences, calculations)
- [ ] Advanced analytics dashboard
- [ ] Mobile native app version
- [ ] Internationalization (more languages)

## 📊 Changelog

### v1.0.0 (2025-11-18)
- Initial release
- Virtual smartphone UI
- Moodle 3.7 integration
- 5 difficulty levels
- Progress tracking and leaderboard
- Statistics and analytics

---

**Made with ❤️ for better learning experiences**
