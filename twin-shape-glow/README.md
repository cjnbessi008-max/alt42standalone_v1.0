# Twin Shape Glow (닮음 도형 빛내기)

**Educational Web App for KAIST Touch Math Academy**

Twin Shape Glow is an interactive educational game that integrates with Moodle LMS to help students learn about similar shapes and geometric patterns. The app displays on a virtual smartphone interface (positioned at the bottom right) where twin/similar shapes interact and synchronize colors when matched correctly.

## Features

### Core Gameplay
- **Shape Matching**: Find pairs of similar/twin shapes on screen
- **Color Synchronization**: When correctly matched, twin shapes glow and unify their colors
- **Interactive Feedback**: Visual animations including glow effects, particle systems, and connection lines
- **Difficulty Levels**: Adjustable complexity from 1-5 with varying numbers of shape pairs
- **Progress Tracking**: Records user attempts, scores, time, and completion status

### Moodle LMS Integration
- Fetches problem/question data from Moodle 3.7
- Stores user progress linked to Moodle user IDs
- Supports quiz-based learning modules
- RESTful API for seamless data exchange

### Visual Features
- Virtual smartphone display with realistic frame and UI
- Smooth animations and transitions
- Responsive design for various screen sizes
- Real-time score and timer updates
- Particle effects and glow animations

## Technology Stack

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Game engine and shape rendering
- **SVG**: Dynamic shape generation

## Installation

### Prerequisites

1. Web server (Apache/Nginx) with PHP 7.1.9+
2. MySQL 5.7+
3. Moodle 3.7 installation
4. Modern web browser (Chrome, Firefox, Safari, Edge)

### Step 1: Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE twin_shape_glow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tsg_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON twin_shape_glow.* TO 'tsg_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u tsg_user -p twin_shape_glow < sql/schema.sql
```

### Step 2: Configuration

Edit `config/database.php` with your database credentials:

```php
// Moodle Database Configuration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'your_moodle_user');
define('MOODLE_DB_PASS', 'your_moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');

// Twin Shape Glow Database Configuration
define('TSG_DB_HOST', 'localhost');
define('TSG_DB_NAME', 'twin_shape_glow');
define('TSG_DB_USER', 'tsg_user');
define('TSG_DB_PASS', 'your_secure_password');
```

### Step 3: Deploy Files

```bash
# Copy to web server directory
sudo cp -r twin-shape-glow /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/twin-shape-glow
sudo chmod -R 755 /var/www/html/twin-shape-glow
```

### Step 4: Test Installation

Visit `http://your-server/twin-shape-glow/` in your browser.

## Usage

### Basic Usage

```
http://your-server/twin-shape-glow/index.php?user_id=1&question_id=123
```

**Parameters:**
- `user_id`: Moodle user ID (required)
- `question_id`: Moodle question ID to create problem from (optional)
- `problem_id`: Existing Twin Shape Glow problem ID (optional)

### Creating Problems from Moodle Questions

```bash
curl -X POST http://your-server/twin-shape-glow/api/create_problem.php \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 123,
    "problem_type": "shape_matching",
    "difficulty": 2
  }'
```

### Game Controls

#### Mouse/Touch
- **Click shape**: Select first shape (glows)
- **Click twin shape**: Match pair (colors synchronize)
- **Start Button**: Begin game
- **Reset Button**: Clear progress and restart
- **Hint Button**: Highlight one unmatched pair (-20 points)

#### Keyboard Shortcuts
- `S`: Start/Restart game
- `R`: Reset game
- `H`: Show hint
- `ESC`: Deselect current shape

## API Endpoints

### GET `/api/get_problem.php`
Retrieve problem configuration

**Parameters:**
- `problem_id` (int): TSG problem ID

**Response:**
```json
{
  "success": true,
  "problem_id": 1,
  "difficulty": 2,
  "shape_config": "{...}",
  "time_limit": 120
}
```

### POST `/api/save_progress.php`
Save user progress

**Body:**
```json
{
  "user_id": 1,
  "problem_id": 1,
  "score": 850,
  "time_spent": 65,
  "completed": true
}
```

### GET `/api/get_progress.php`
Get user progress

**Parameters:**
- `user_id` (int)
- `problem_id` (int)

### POST `/api/create_problem.php`
Create new problem from Moodle question

**Body:**
```json
{
  "question_id": 123,
  "problem_type": "shape_matching",
  "difficulty": 3
}
```

### GET `/api/get_quiz_problems.php`
Get all problems for a Moodle quiz

**Parameters:**
- `quiz_id` (int): Moodle quiz ID

## Database Schema

### `tsg_problems`
Stores problem configurations
- `moodle_question_id`: Link to Moodle question
- `shape_config`: JSON with shape positions and properties
- `correct_answer`: JSON with correct pairs
- `difficulty`: 1-5 complexity level

### `tsg_user_progress`
Tracks user completion and scores
- `moodle_user_id`: Link to Moodle user
- `attempts`: Number of tries
- `score`: Best score achieved
- `completed`: Boolean completion status

### `tsg_sessions`
Active game sessions
- `session_token`: Unique session identifier
- `game_data`: JSON with session state

### `tsg_shapes`
Shape library with SVG paths
- Pre-loaded with circles, squares, triangles, pentagons, hexagons, stars

## Game Mechanics

### Shape Matching Algorithm

1. **Selection**: User clicks first shape → shape glows with pulsing animation
2. **Proximity Detection**: Twin shapes within 30% distance start subtle glow
3. **Matching**: User clicks second shape
   - **Correct**: Both shapes animate, connect with line, colors synchronize
   - **Wrong**: Shapes shake, user tries again
4. **Completion**: All pairs matched → completion screen with stats

### Scoring System

- **Correct Match**: +100 points × difficulty level
- **Wrong Match**: -10 points
- **Hint Used**: -20 points
- **Bonus**: Time-based multiplier for fast completion

### Color Synchronization

When twin shapes match:
1. Both shapes pulse and grow
2. Connection line draws between centers
3. Colors unify to same hue
4. Particle effects emit from both shapes
5. Shapes settle with synchronized glow effect

## Customization

### Adding Custom Shapes

Edit `sql/schema.sql` and add to `tsg_shapes` table:

```sql
INSERT INTO tsg_shapes (shape_name, shape_type, svg_path, default_color, similarity_group)
VALUES ('My Shape', 'custom', 'M 10 10 L 90 10 L 50 90 Z', '#FF5733', 10);
```

### Adjusting Difficulty

Modify difficulty parameters in `includes/moodle_integration.php`:

```php
private function generateShapeConfig($difficulty) {
    $num_pairs = 2 + $difficulty; // Adjust formula
    // ...
}
```

### Styling

- **Smartphone**: `css/smartphone.css`
- **Game**: `css/game.css`
- **Colors**: Edit `.color-theme-*` classes

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check credentials in `config/database.php`
- Verify MySQL service is running: `sudo systemctl status mysql`

**2. Shapes Not Rendering**
- Check browser console for JavaScript errors
- Ensure all JS files loaded: `js/game-engine.js`, `js/shape-renderer.js`, `js/app.js`

**3. Moodle Integration Not Working**
- Verify Moodle database credentials
- Check `mdl_` prefix matches your Moodle installation
- Test Moodle query: `SELECT * FROM mdl_question LIMIT 1;`

**4. API Returns 404**
- Check `.htaccess` for rewrite rules
- Verify PHP files have execute permissions
- Enable error display: `ini_set('display_errors', 1);`

### Debug Mode

Add to `index.php` for debugging:

```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Browser Compatibility

✅ **Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ **Limited Support:**
- IE 11 (CSS Grid not supported)

## Performance Optimization

- Shapes cached after first load
- SVG paths pre-rendered
- Minimal DOM manipulation
- RequestAnimationFrame for smooth animations
- Event delegation for click handlers

## Security Considerations

- SQL injection prevention via prepared statements
- Input validation on all API endpoints
- CORS headers configured for API access
- Session tokens for game state
- No sensitive data in frontend JavaScript

## License

Copyright © 2025 KAIST Touch Math Academy
All rights reserved.

## Support

For issues or questions:
- Email: support@kaist-touchmath.edu
- GitHub: [Create an issue](https://github.com/kaist/twin-shape-glow/issues)

## Changelog

### Version 1.0.0 (2025-01-18)
- Initial release
- Moodle 3.7 integration
- Shape matching gameplay
- Virtual smartphone display
- Progress tracking
- RESTful API

---

**Made with ❤️ for KAIST Touch Math Academy**
