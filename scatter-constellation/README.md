# Scatter Constellation (별자리 학습 시스템)

A web-based educational visualization app that displays problem data from Moodle LMS as an interactive constellation-style scatter plot on a virtual smartphone screen.

## 📱 Features

- **Moodle 3.7 Integration**: Seamlessly connects to Moodle LMS via Web Services API
- **Constellation Visualization**: Problems displayed as stars connected in constellation patterns
- **Virtual Smartphone UI**: Beautiful smartphone screen positioned at bottom-right
- **Interactive Scatter Plot**:
  - X-axis: Problem difficulty (0-10)
  - Y-axis: Student performance/score (0-100)
- **Real-time Data**: Live sync with Moodle course data
- **Beautiful Animations**: Smooth transitions, glowing effects, and shooting stars
- **Responsive Design**: Works on desktop and mobile devices

## 🖥️ Technology Stack

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: HTML5 Canvas API

## 📋 Requirements

- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Moodle 3.7 with Web Services enabled
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone the Repository

```bash
cd /var/www/html
git clone <repository-url> scatter-constellation
cd scatter-constellation
```

### 2. Configure Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE scatter_constellation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p scatter_constellation < database/schema.sql

# Create database user
CREATE USER 'scatter_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON scatter_constellation.* TO 'scatter_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Application

```bash
# Copy config file
cp config.example.php config.php

# Edit configuration
nano config.php
```

Update the following settings in `config.php`:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'scatter_constellation');
define('DB_USER', 'scatter_user');
define('DB_PASS', 'your_password');

// Moodle Integration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

### 4. Configure Moodle Web Services

In your Moodle installation:

1. **Enable Web Services**:
   - Go to: `Site administration > Advanced features`
   - Enable "Enable web services"

2. **Create Web Service User**:
   - Go to: `Site administration > Users > Accounts > Add a new user`
   - Create a dedicated user for the web service

3. **Create a Token**:
   - Go to: `Site administration > Server > Web services > Manage tokens`
   - Create a token for the web service user

4. **Enable Required Functions**:
   - `core_course_get_courses`
   - `core_course_get_contents`
   - `mod_quiz_get_quizzes_by_courses`
   - `gradereport_user_get_grade_items`

### 5. Set Permissions

```bash
# Set correct permissions
chmod 755 scatter-constellation
chmod 644 scatter-constellation/*.php
chmod 600 scatter-constellation/config.php
chmod -R 755 scatter-constellation/assets
```

### 6. Access the Application

Open your browser and navigate to:
```
http://your-domain.com/scatter-constellation/
```

## 📖 Usage

### Basic Usage

1. **Select a Course**: Use the dropdown to select a Moodle course
2. **View Constellation**: Problems appear as stars on the smartphone screen
3. **Interact**:
   - Hover over stars to see problem names
   - Click stars to view detailed information
4. **Refresh**: Click "데이터 새로고침" to reload data from Moodle

### Understanding the Visualization

**X-Axis (Difficulty)**:
- Left: Easy problems
- Right: Difficult problems

**Y-Axis (Score)**:
- Bottom: Low performance
- Top: High performance

**Color Coding**:
- 🔵 Blue: Easy (difficulty 0-2)
- 🟢 Green: Easy-Medium (difficulty 2-4)
- 🟡 Gold: Medium (difficulty 4-6)
- 🟠 Orange: Medium-Hard (difficulty 6-8)
- 🔴 Red: Hard (difficulty 8-10)

**Connections**:
- Stars are automatically connected if they're close together
- Connection strength indicates similarity/relationship

## 🎨 Customization

### Constellation Settings

Edit the settings in `assets/js/constellation.js`:

```javascript
this.settings = {
    autoConnect: true,              // Auto-connect nearby points
    maxConnectionDistance: 3.0,     // Maximum distance for connections
    pointSizeMin: 4,                // Minimum star size
    pointSizeMax: 12,               // Maximum star size
    lineWidth: 2,                   // Connection line width
    lineAlpha: 0.3,                 // Connection line opacity
    glowEnabled: true,              // Enable glow effect
    animationSpeed: 1               // Animation speed multiplier
};
```

### Styling

- Main styles: `assets/css/style.css`
- Smartphone UI: `assets/css/smartphone.css`
- Constellation effects: `assets/css/constellation.css`

## 🔌 API Endpoints

### GET `/api/courses.php`
Get all available courses from Moodle.

**Response**:
```json
[
  {
    "id": 1,
    "fullname": "Mathematics 101",
    "shortname": "MATH101"
  }
]
```

### GET `/api/problems.php?course_id={id}`
Get problems for a specific course.

**Response**:
```json
{
  "success": true,
  "course_id": 1,
  "count": 10,
  "problems": [
    {
      "id": 1,
      "name": "Problem 1",
      "difficulty": 5.0,
      "score": 75.5,
      "x": 5.0,
      "y": 75.5,
      "color": "#FFD700"
    }
  ]
}
```

### POST `/api/student_progress.php`
Update student progress on a problem.

**Request**:
```json
{
  "user_id": 123,
  "problem_id": 456,
  "score": 85.5,
  "time_spent": 300,
  "completed": true
}
```

## 🗄️ Database Schema

### Tables

- **problems**: Stores problem data from Moodle
- **constellation_points**: Visualization coordinates
- **student_progress**: Student performance tracking
- **constellation_connections**: Lines between stars
- **courses**: Cached course information
- **app_sessions**: User session data
- **app_settings**: Application configuration

See `database/schema.sql` for complete schema.

## 🐛 Troubleshooting

### Can't connect to Moodle
- Verify Web Services are enabled in Moodle
- Check that your token is valid
- Ensure required web service functions are enabled

### No problems showing
- Verify the course has quizzes/questions
- Check browser console for JavaScript errors
- Verify API endpoints return data (check Network tab)

### Database errors
- Check database credentials in `config.php`
- Ensure schema.sql was imported correctly
- Verify database user has proper permissions

## 📄 License

Copyright © 2024. All rights reserved.

## 🤝 Support

For issues and questions:
- Check the troubleshooting section above
- Review browser console for errors
- Verify Moodle web service configuration

## 🎯 Future Enhancements

- [ ] Student authentication integration
- [ ] Real-time collaboration features
- [ ] Advanced filtering and search
- [ ] Export visualization as image
- [ ] Custom constellation patterns
- [ ] Mobile app version
- [ ] Integration with other LMS platforms
- [ ] AI-powered difficulty prediction

---

Made with ⭐ for KAIST Touch Math Academy
