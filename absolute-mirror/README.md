# Absolute Mirror (절댓값 미러)

**Interactive absolute value equation visualizer with mirror tunnel effect**

## Overview

Absolute Mirror is a web-based educational application that helps students understand absolute value equations through an innovative "mirror tunnel" visualization. The app displays on a virtual smartphone screen (positioned in the bottom right) and integrates with Moodle LMS to fetch and track problem-solving activities.

### Key Features

- 🎨 **Mirror Tunnel Visualization**: Unique 3D tunnel effect showing the symmetry of absolute value equations
- 📱 **Virtual Smartphone Display**: Problems displayed in a realistic smartphone interface
- 🔗 **Moodle Integration**: Seamless connection with Moodle 3.7 LMS
- 📊 **Progress Tracking**: Comprehensive student performance analytics
- 🎮 **Interactive Controls**: Real-time manipulation of equation parameters
- 🌐 **Bilingual Support**: Korean and English interfaces
- ✨ **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## Technology Stack

### Frontend
- **HTML5** with semantic markup
- **CSS3** with modern animations and gradients
- **JavaScript (ES6+)** - Vanilla JS, no frameworks required
- **Canvas API** for mirror tunnel visualization

### Backend
- **PHP 7.1.9** (compatible with your existing stack)
- **MySQL 5.7** database
- **RESTful API** architecture

### Integration
- **Moodle 3.7** LMS compatibility
- **PDO** for secure database operations

---

## Project Structure

```
absolute-mirror/
├── public/                      # Frontend assets
│   ├── index.html              # Main application page
│   ├── css/
│   │   └── style.css           # Comprehensive styling
│   └── js/
│       ├── config.js           # Configuration settings
│       ├── mirrorTunnel.js     # Visualization engine
│       ├── moodleAPI.js        # API client
│       └── app.js              # Main application logic
│
├── api/                        # Backend API endpoints
│   ├── problems.php            # Get problem list
│   ├── problem.php             # Get single/random problem
│   ├── submit.php              # Submit student answers
│   ├── progress.php            # Get student progress
│   └── moodle_integration.php  # Moodle sync utilities
│
├── config/                     # Configuration files
│   └── database.php            # Database connection & helpers
│
├── db/                         # Database files
│   └── schema.sql              # MySQL schema and sample data
│
└── docs/                       # Documentation
    ├── INSTALLATION.md         # Installation guide
    ├── API.md                  # API documentation
    └── MOODLE_INTEGRATION.md   # Moodle setup guide
```

---

## Quick Start

### Prerequisites

- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- Moodle 3.7 (optional, for LMS integration)

### Installation

1. **Clone or extract the project**
   ```bash
   cd /var/www/html
   cp -r absolute-mirror ./
   ```

2. **Create database**
   ```bash
   mysql -u root -p < db/schema.sql
   ```

3. **Configure database connection**

   Edit `config/database.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'absolute_mirror');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

4. **Configure web server**

   For Apache, add to virtual host:
   ```apache
   <Directory /var/www/html/absolute-mirror>
       Options Indexes FollowSymLinks
       AllowOverride All
       Require all granted
   </Directory>
   ```

5. **Set permissions**
   ```bash
   chmod -R 755 absolute-mirror
   chown -R www-data:www-data absolute-mirror
   ```

6. **Access the application**
   ```
   http://localhost/absolute-mirror/public/
   ```

---

## Configuration

### Demo Mode vs. Moodle Integration

The app can run in two modes:

#### 1. **Demo Mode** (Default)
- Uses built-in sample problems
- No Moodle connection required
- Perfect for testing and demonstration

To enable demo mode in `public/js/config.js`:
```javascript
demo: {
    enabled: true,
    problems: [ /* sample problems */ ]
}
```

#### 2. **Moodle Integration Mode**
- Connects to Moodle database
- Syncs users and problems
- Exports progress to gradebook

To enable Moodle mode:

1. Update `config/database.php` with Moodle credentials:
   ```php
   define('MOODLE_DB_HOST', 'localhost');
   define('MOODLE_DB_NAME', 'moodle');
   define('MOODLE_DB_USER', 'moodle_user');
   define('MOODLE_DB_PASS', 'moodle_password');
   define('MOODLE_DB_PREFIX', 'mdl_');
   ```

2. Set demo mode to false in `public/js/config.js`:
   ```javascript
   demo: {
       enabled: false
   }
   ```

3. Sync users from Moodle:
   ```
   http://localhost/absolute-mirror/api/moodle_integration.php?action=sync_users
   ```

---

## Usage

### For Students

1. **Open the application** in a web browser
2. **View the problem** displayed in the equation panel
3. **Adjust the x-value slider** to explore different values
4. **Watch the mirror tunnel** visualization update in real-time
5. **Click "해설 보기"** (Show Solution) to view the explanation
6. **Click "새 문제 불러오기"** (Load New Problem) for the next challenge

### For Teachers

1. **Add problems** via Moodle quiz questions or directly in MySQL
2. **Sync problems** from Moodle:
   ```
   http://localhost/absolute-mirror/api/moodle_integration.php?action=import_problems
   ```
3. **Monitor student progress** via the API:
   ```
   http://localhost/absolute-mirror/api/progress.php?student_id=1
   ```

---

## API Documentation

### Endpoints

#### GET `/api/problems.php`
Get list of problems

**Query Parameters:**
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `grade_level` - Filter by grade level (1-12)
- `limit` - Number of results (default: 10)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "기본 절댓값 방정식",
      "equation": "|x - 3| = 5",
      "difficulty": "easy"
    }
  ],
  "total": 5
}
```

#### GET `/api/problem.php`
Get single or random problem

**Query Parameters:**
- `id` - Problem ID (optional)
- `random=1` - Get random problem

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "기본 절댓값 방정식",
    "equation": "|x - 3| = 5",
    "axis": 3,
    "target": 5,
    "solutions": [-2, 8],
    "explanation": "..."
  }
}
```

#### POST `/api/submit.php`
Submit student answer

**Request Body:**
```json
{
  "problem_id": 1,
  "student_id": 1,
  "answer": [8, -2],
  "time_spent": 120
}
```

**Response:**
```json
{
  "success": true,
  "is_correct": true,
  "is_complete_correct": true,
  "message": "정답입니다! 두 해를 모두 찾았습니다."
}
```

#### GET `/api/progress.php`
Get student progress

**Query Parameters:**
- `student_id` - Student ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_attempted": 10,
      "total_correct": 7,
      "accuracy": 70.00
    },
    "difficulty_breakdown": {
      "easy": {"attempted": 5, "correct": 5, "accuracy": 100},
      "medium": {"attempted": 3, "correct": 2, "accuracy": 66.67},
      "hard": {"attempted": 2, "correct": 0, "accuracy": 0}
    }
  }
}
```

---

## Mirror Tunnel Visualization

The core feature of Absolute Mirror is the innovative "mirror tunnel" effect that helps students visualize absolute value equations.

### How It Works

1. **Graph Display**: Shows the V-shaped graph of |x - a| = b
2. **Axis of Symmetry**: Vertical dashed line at x = a
3. **Target Line**: Horizontal line at y = b
4. **Mirror Tunnel**: 3D-like depth effect at solution points
5. **Interactive Point**: Follows slider movement to show current value

### Customization

Edit visualization settings in `public/js/config.js`:

```javascript
visualization: {
    tunnelDepth: 20,              // Number of mirror reflections
    animationFPS: 60,             // Frames per second
    colors: {
        primary: '#4A90E2',       // Main graph color
        mirror: '#f093fb',        // Mirror tunnel color
        axis: '#ff6b6b',          // Symmetry axis color
        highlight: '#ffd93d'      // Target line color
    },
    effects: {
        enableGlow: true,         // Glow effects
        enableParticles: true,    // Particle animation
        enableTrails: true,       // Motion trails
        perspective: true         // 3D perspective
    }
}
```

---

## Database Schema

### Tables

1. **problems** - Absolute value equation problems
2. **users** - User information (synced with Moodle)
3. **student_attempts** - Individual problem attempts
4. **student_progress** - Aggregated progress metrics
5. **sessions** - User session tracking

### Views

- `v_recent_attempts` - Recent attempts with problem details
- `v_student_performance` - Student performance summary

### Stored Procedures

- `update_student_progress` - Updates progress after each attempt

---

## Moodle Integration

### Syncing Users

```php
// Sync all users from Moodle
http://localhost/absolute-mirror/api/moodle_integration.php?action=sync_users
```

### Importing Problems

```php
// Import problems from all courses
http://localhost/absolute-mirror/api/moodle_integration.php?action=import_problems

// Import from specific course
http://localhost/absolute-mirror/api/moodle_integration.php?action=import_problems&course_id=5
```

### Grade Export

Student progress can be automatically exported to Moodle gradebook (requires additional configuration).

---

## Troubleshooting

### Problem: Database connection failed
**Solution**: Check credentials in `config/database.php`

### Problem: Blank screen in smartphone display
**Solution**: Check browser console for JavaScript errors. Ensure Canvas is supported.

### Problem: Problems not loading
**Solution**:
1. Check if demo mode is enabled
2. Verify API endpoints are accessible
3. Check MySQL database has sample data

### Problem: Moodle sync not working
**Solution**:
1. Verify Moodle database credentials
2. Check table prefix (default: mdl_)
3. Ensure network connectivity between servers

---

## Performance Optimization

### For Production

1. **Enable caching**
   ```php
   // Add to .htaccess
   <IfModule mod_expires.c>
       ExpiresActive On
       ExpiresByType text/css "access plus 1 month"
       ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

2. **Minimize JavaScript**
   ```bash
   # Use a minifier for production
   uglifyjs public/js/*.js -o public/js/bundle.min.js
   ```

3. **Optimize database**
   ```sql
   OPTIMIZE TABLE problems, student_attempts;
   ```

---

## Security Considerations

- ✅ PDO prepared statements prevent SQL injection
- ✅ Input validation on all API endpoints
- ✅ CORS headers properly configured
- ✅ Session management for user authentication
- ✅ Stored procedures for safe data updates

### Recommended Additional Security

1. **HTTPS**: Deploy with SSL certificate
2. **Rate Limiting**: Implement API rate limits
3. **Input Sanitization**: Add HTML purification for user inputs
4. **Session Security**: Use secure, httpOnly cookies

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (limited support, no animations)

---

## Future Enhancements

- [ ] Real-time multiplayer mode
- [ ] Voice input for answers
- [ ] VR/AR visualization mode
- [ ] Advanced analytics dashboard
- [ ] Mobile native apps (iOS/Android)
- [ ] Multi-language support expansion
- [ ] Integration with other LMS platforms

---

## Support

For issues, questions, or contributions:

1. Check the documentation in `/docs`
2. Review the code comments
3. Test in demo mode first
4. Check browser console for errors

---

## License

This project is part of the AI Education System Pipeline for KAIST Touch Math Academy.

---

## Credits

**Developed for**: KAIST Touch Math Academy
**Purpose**: Educational visualization of absolute value equations
**Technology**: HTML5, CSS3, JavaScript, PHP, MySQL
**Compatible with**: Moodle 3.7, PHP 7.1.9, MySQL 5.7

---

## Version History

- **v1.0.0** (2025-11-18) - Initial release
  - Mirror tunnel visualization
  - Moodle integration
  - Progress tracking
  - Demo mode with sample problems
