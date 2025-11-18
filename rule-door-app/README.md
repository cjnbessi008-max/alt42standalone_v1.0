# Rule Door - Moodle LMS Integration

중복 허용/비허용 여부가 문 열림/닫힘으로 표현되는 'Rule Door' 웹앱

A web application that integrates with Moodle LMS to enforce duplicate answer rules, visualized as an open/closed door on a virtual smartphone display.

## 📋 Overview

Rule Door is a web application that:
- Integrates with Moodle 3.7 LMS to receive quiz/problem information
- Detects duplicate student answers in real-time
- Visualizes duplicate allowed/not allowed status as a door (open/closed)
- Displays in a virtual smartphone interface (bottom right of screen)
- Provides comprehensive statistics and tracking

## 🛠 Technology Stack

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Architecture**: RESTful API

## 📁 Project Structure

```
rule-door-app/
├── api/                          # REST API endpoints
│   ├── index.php                 # Main API router
│   ├── rules_api.php             # Rule management endpoints
│   ├── door_state_api.php        # Door state endpoints
│   ├── attempts_api.php          # Problem attempt endpoints
│   ├── moodle_api.php            # Moodle integration endpoints
│   └── statistics_api.php        # Statistics endpoints
├── config/                       # Configuration files
│   ├── database.php              # Database connection
│   └── moodle_config.php         # Moodle integration config
├── models/                       # Data models
│   ├── Rule.php                  # Rule model
│   ├── DoorState.php             # Door state model
│   └── ProblemAttempt.php        # Problem attempt model
├── moodle-integration/           # Moodle connector
│   └── MoodleConnector.php       # Moodle DB integration
├── views/                        # Frontend views
│   └── index.html                # Main application page
├── assets/                       # Static assets
│   ├── css/
│   │   └── style.css             # Application styles
│   ├── js/
│   │   ├── config.js             # Configuration
│   │   ├── api.js                # API client
│   │   ├── door.js               # Door controller
│   │   └── app.js                # Main application
│   └── images/                   # Images (if any)
├── database/                     # Database files
│   └── schema.sql                # Database schema
└── README.md                     # This file
```

## 🚀 Installation

### Prerequisites

- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Moodle 3.7 installation
- Composer (optional, for future dependencies)

### Step 1: Database Setup

1. Create the database:
```bash
mysql -u root -p
```

2. Run the schema:
```bash
mysql -u root -p < database/schema.sql
```

The schema creates:
- `rules` table: Rule definitions
- `door_states` table: Current door status
- `problem_attempts` table: Student attempt tracking
- `activity_log` table: Audit trail
- `sessions` table: Session management

### Step 2: Configuration

1. Update database credentials in `config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'rule_door_db';
private $username = 'your_username';
private $password = 'your_password';
```

2. Update Moodle configuration in `config/moodle_config.php`:
```php
const MOODLE_PATH = '/path/to/moodle';
const MOODLE_URL = 'http://your-moodle-url';
const MOODLE_DB_HOST = 'localhost';
const MOODLE_DB_NAME = 'moodle';
const MOODLE_DB_USER = 'moodle_user';
const MOODLE_DB_PASS = 'moodle_pass';
```

3. Update API configuration in `assets/js/config.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost/rule-door-app/api',
    MOODLE_URL: 'http://localhost/moodle',
    // ... other settings
};
```

### Step 3: Web Server Setup

#### Apache

1. Copy the project to your web root:
```bash
cp -r rule-door-app /var/www/html/
```

2. Enable mod_rewrite (if not already enabled):
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

3. Ensure proper permissions:
```bash
sudo chown -R www-data:www-data /var/www/html/rule-door-app
sudo chmod -R 755 /var/www/html/rule-door-app
```

#### Nginx

Add to your Nginx configuration:
```nginx
location /rule-door-app {
    try_files $uri $uri/ /rule-door-app/api/index.php?$query_string;
}
```

### Step 4: Access the Application

1. Open your browser and navigate to:
```
http://localhost/rule-door-app/views/index.html?quiz_id=1&student_id=1&course_id=101
```

2. Parameters:
   - `quiz_id`: Moodle quiz ID
   - `student_id`: Moodle user ID
   - `course_id`: Moodle course ID

## 📖 Usage

### Creating Rules

1. **Via API**:
```bash
curl -X POST http://localhost/rule-door-app/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_quiz_id": 1,
    "moodle_course_id": 101,
    "rule_name": "Math Quiz - No Duplicates",
    "rule_type": "duplicate_not_allowed",
    "description": "Students cannot submit duplicate answers"
  }'
```

2. **Rule Types**:
   - `duplicate_allowed`: Door opens for all answers (green)
   - `duplicate_not_allowed`: Door closes for duplicate answers (red)

### Student Workflow

1. Student opens the web app (from Moodle or standalone)
2. Question is displayed from Moodle quiz
3. Student enters their answer
4. Click "Check Answer" to evaluate door state
   - Door opens ✅: Answer is unique, submission allowed
   - Door closes ❌: Answer is duplicate, submission blocked
5. If door is open, "Submit Answer" button enables
6. Student submits answer
7. Statistics update in real-time

### API Endpoints

#### Rules
- `GET /api/rules` - Get all rules
- `GET /api/rules/{id}` - Get rule by ID
- `GET /api/rules/quiz/{quiz_id}` - Get rule by quiz ID
- `POST /api/rules` - Create new rule
- `PUT /api/rules/{id}` - Update rule
- `DELETE /api/rules/{id}` - Delete rule

#### Door States
- `GET /api/door-state/{rule_id}/{student_id}` - Get current door state
- `POST /api/door-state/evaluate` - Evaluate door state for answer
- `POST /api/door-state/update` - Manually update door state

#### Attempts
- `POST /api/attempts` - Record new attempt
- `GET /api/attempts/student/{student_id}/question/{question_id}` - Get student attempts

#### Moodle Integration
- `GET /api/moodle/quiz/{quiz_id}` - Get quiz info
- `GET /api/moodle/quiz/{quiz_id}/questions` - Get quiz questions
- `GET /api/moodle/student/{student_id}` - Get student info

#### Statistics
- `GET /api/statistics/overview` - System overview
- `GET /api/statistics/rule/{rule_id}` - Rule statistics
- `GET /api/statistics/student/{student_id}` - Student statistics

## 🎨 Features

### Virtual Smartphone Display
- Responsive 3D door visualization
- Real-time door open/close animations
- Status indicators (open/closed)
- Live statistics display
- Mobile-friendly design

### Duplicate Detection
- Compares current answer with previous attempts
- JSON-based answer comparison
- Instant feedback
- Detailed reasoning display

### Statistics & Analytics
- Total attempts tracking
- Duplicate detection count
- Correct answer count
- Time spent analysis
- Trend visualization

### Security Features
- SQL injection prevention (PDO prepared statements)
- XSS protection (input sanitization)
- Session validation
- Activity logging
- Error handling

## 🔧 Configuration Options

### Door Animation
```javascript
// In assets/js/config.js
CONFIG.DOOR_ANIMATION_DURATION = 800; // milliseconds
```

### Refresh Intervals
```javascript
CONFIG.DOOR_STATE_REFRESH_INTERVAL = 5000;  // 5 seconds
CONFIG.STATISTICS_REFRESH_INTERVAL = 10000; // 10 seconds
```

### Debug Mode
```javascript
CONFIG.DEBUG = true; // Enable console logging
```

## 🧪 Testing

### Test with cURL

1. **Create a rule**:
```bash
curl -X POST http://localhost/rule-door-app/api/rules \
  -H "Content-Type: application/json" \
  -d '{"moodle_quiz_id":1,"moodle_course_id":101,"rule_name":"Test","rule_type":"duplicate_not_allowed"}'
```

2. **Evaluate door state**:
```bash
curl -X POST http://localhost/rule-door-app/api/door-state/evaluate \
  -H "Content-Type: application/json" \
  -d '{"rule_id":1,"student_id":1,"answer_data":{"answer":"42"}}'
```

3. **Record attempt**:
```bash
curl -X POST http://localhost/rule-door-app/api/attempts \
  -H "Content-Type: application/json" \
  -d '{"rule_id":1,"student_id":1,"moodle_question_id":1,"answer_data":{"answer":"42"}}'
```

## 📊 Database Schema

### Rules Table
- `id`: Primary key
- `moodle_quiz_id`: Link to Moodle quiz
- `rule_type`: duplicate_allowed | duplicate_not_allowed
- `is_active`: Active status

### Door States Table
- `rule_id`: Foreign key to rules
- `student_id`: Student identifier
- `door_status`: open | closed
- `reason`: Explanation text

### Problem Attempts Table
- `rule_id`: Foreign key to rules
- `student_id`: Student identifier
- `answer_data`: JSON answer data
- `is_duplicate`: Boolean flag
- `is_correct`: Boolean flag

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u your_username -p rule_door_db
```

### API Returns 404
- Check Apache mod_rewrite is enabled
- Verify .htaccess file exists (if needed)
- Check file permissions

### Moodle Integration Fails
- Verify Moodle database credentials in `config/moodle_config.php`
- Check Moodle table prefix (default: `mdl_`)
- Ensure read access to Moodle database

### Door Not Animating
- Check browser console for JavaScript errors
- Verify all JS files are loaded
- Clear browser cache

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Development Team - Initial implementation
- Claude AI Assistant - Code generation and documentation

## 🔗 Integration with Moodle

### Option 1: iFrame Embed
Add to Moodle quiz page:
```html
<iframe src="http://localhost/rule-door-app/views/index.html?quiz_id={quizid}&student_id={userid}&course_id={courseid}"
        width="100%" height="800px"></iframe>
```

### Option 2: Moodle Block Plugin
Create a custom Moodle block that embeds the Rule Door interface.

### Option 3: External Tool (LTI)
Configure as an LTI external tool for seamless integration.

## 🔄 Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Multiple question support per page
- [ ] Advanced analytics dashboard
- [ ] Mobile native app version
- [ ] Multi-language support
- [ ] Gamification features
- [ ] Teacher admin panel
- [ ] Export reports (PDF, Excel)

## 📞 Support

For issues, questions, or contributions, please contact the development team.

---

**Rule Door** - Making duplicate detection visual and engaging! 🚪✨
