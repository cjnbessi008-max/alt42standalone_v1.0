# 🎵 Number Melody

Interactive educational web application that teaches numbers through music and touch. Students tap numbers to create melodies while learning number sequences, patterns, and mathematical concepts.

## 🌟 Features

- **Virtual Smartphone UI**: Beautiful smartphone interface displayed in the bottom-right corner
- **Musical Feedback**: Each number plays a unique musical tone when tapped
- **Moodle Integration**: Seamlessly connects with Moodle 3.7 LMS
- **Progress Tracking**: Real-time statistics and performance analytics
- **Interactive Learning**: Engaging touch-based learning experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📋 Requirements

- **Web Server**: Apache or Nginx
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Moodle**: 3.7 (optional, for LMS integration)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## 🚀 Installation

### 1. Database Setup

```bash
# Create the database
mysql -u root -p < database/schema.sql
```

Or manually:
```sql
mysql -u root -p
source /path/to/number-melody/database/schema.sql
```

### 2. Configure Database Connection

Edit `api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_melody');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Configure Moodle Integration (Optional)

If integrating with Moodle:

1. Enable Moodle Web Services:
   - Go to: Site Administration → Advanced Features
   - Enable "Enable web services"

2. Create a Web Service Token:
   - Go to: Site Administration → Server → Web Services → Manage Tokens
   - Add a new token for the Number Melody service

3. Update `api/config.php`:
   ```php
   define('MOODLE_URL', 'http://your-moodle-site.com');
   define('MOODLE_TOKEN', 'your_web_service_token_here');
   ```

### 4. Deploy Files

Copy the `number-melody` folder to your web server:

```bash
# For Apache (default web root)
cp -r number-melody /var/www/html/

# For Nginx
cp -r number-melody /usr/share/nginx/html/
```

### 5. Set Permissions

```bash
cd /var/www/html/number-melody
chmod 755 api/
chmod 644 api/*.php
```

### 6. Test Installation

Visit: `http://your-domain/number-melody/app/`

You should see the Number Melody interface with a virtual smartphone on the right.

## 📱 Usage

### For Students

1. Open the Number Melody app in your browser
2. Read the problem description on the left panel
3. Tap numbers on the virtual smartphone screen to create your sequence
4. Listen to the musical tones as you tap
5. Submit your answer when ready
6. View your progress and statistics

### For Teachers (Moodle Integration)

1. Create quiz questions in Moodle
2. Link questions to Number Melody problems in the database:
   ```sql
   UPDATE problems
   SET moodle_question_id = 123
   WHERE id = 1;
   ```
3. Embed Number Melody in your Moodle course using an iframe or external tool
4. Student progress automatically syncs back to Moodle

### Embedding in Moodle

Add an HTML block with iframe:

```html
<iframe
  src="http://your-domain/number-melody/app/?userid={$USER->id}"
  width="100%"
  height="900px"
  frameborder="0">
</iframe>
```

## 🎨 Customization

### Adding New Problems

Insert problems directly into the database:

```sql
INSERT INTO problems
(title, description, number_sequence, correct_answer, difficulty, sound_pattern)
VALUES
('Your Problem Title',
 'Problem description here',
 JSON_ARRAY(1, 2, 3, 4, 5),
 '12345',
 1,
 'melody');
```

### Changing Sound Patterns

Edit `app/sounds.js` to modify:
- Musical scales and frequencies
- Sound patterns (melody, rhythm, harmony)
- Audio effects and envelopes

### Styling

Modify `app/styles.css` to customize:
- Color scheme (CSS variables in `:root`)
- Smartphone appearance
- Layout and spacing
- Animations and transitions

## 📊 API Endpoints

### Get Problem
```
GET /api/api.php?action=get_problem&id={problem_id}
```

### Submit Answer
```
POST /api/api.php?action=submit_answer
Body: {
  "problem_id": 1,
  "user_id": 1,
  "answer": "12345",
  "time_spent": 30
}
```

### Get Progress
```
GET /api/api.php?action=get_progress&user_id={user_id}
```

### Save Interaction
```
POST /api/api.php?action=save_interaction
Body: {
  "user_id": 1,
  "problem_id": 1,
  "type": "tap",
  "data": {"number": 5, "position": 3}
}
```

## 🔧 Troubleshooting

### Database Connection Error
- Check database credentials in `api/config.php`
- Ensure MySQL service is running: `sudo systemctl status mysql`
- Verify database exists: `SHOW DATABASES;`

### No Sound Playing
- Check browser console for errors
- Ensure browser allows autoplay (click anywhere on page first)
- Verify `CONFIG.soundEnabled` is true in browser console

### Moodle Integration Not Working
- Verify web services are enabled in Moodle
- Check token is valid and has correct permissions
- Review API logs for error messages

### Smartphone UI Not Displaying
- Clear browser cache
- Check `styles.css` is loading correctly
- Verify no JavaScript errors in console

## 📁 Project Structure

```
number-melody/
├── api/
│   ├── config.php              # Database & Moodle configuration
│   ├── api.php                 # Main API endpoint
│   └── moodle_integration.php  # Moodle web service integration
├── app/
│   ├── index.html              # Main application page
│   ├── app.js                  # Application logic
│   ├── sounds.js               # Sound system (Web Audio API)
│   └── styles.css              # UI styling
├── assets/
│   ├── sounds/                 # Audio files (optional)
│   └── images/                 # Images and icons
├── database/
│   ├── schema.sql              # Database schema
│   └── README.md               # Database documentation
├── docs/                       # Additional documentation
└── README.md                   # This file
```

## 🎯 Educational Benefits

- **Visual Learning**: Numbers displayed in interactive grid
- **Auditory Learning**: Musical tones for each number
- **Kinesthetic Learning**: Touch-based interaction
- **Pattern Recognition**: Sequence and pattern problems
- **Immediate Feedback**: Real-time correctness checking
- **Gamification**: Progress tracking and statistics

## 🔐 Security Notes

- Input validation on all API endpoints
- SQL injection prevention using prepared statements
- XSS protection with output encoding
- CORS headers configured for controlled access
- Session management for user tracking

## 📝 License

This project is developed for KAIST Touch Math Academy.

## 👥 Support

For questions or issues:
- Check the troubleshooting section
- Review database and API documentation
- Contact your system administrator

## 🎓 Credits

Developed as part of the AI Education System Pipeline project for KAIST Touch Math Academy.

---

**Version**: 1.0.0
**Compatible with**: Moodle 3.7, PHP 7.1.9, MySQL 5.7
**Last Updated**: 2025-11-18
