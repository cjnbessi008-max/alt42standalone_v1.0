# ALT42 Choice Gesture

Interactive multiple choice question system with animated hand gestures, integrated with Moodle LMS.

## 🎯 Features

- **Moodle 3.7 Integration**: Direct MySQL connection to Moodle database
- **Virtual Smartphone Display**: iPhone-style responsive device frame (375px × 667px)
- **Animated Hand Gestures**: Visual tap animations on choice selection
- **Real-time Feedback**: Instant validation with animated feedback messages
- **Ripple Effects**: Material Design-inspired touch feedback
- **Keyboard Navigation**: Full accessibility support (1-4 keys, Enter, Space)
- **Responsive Design**: Adapts to different screen sizes
- **Korean Language Support**: UI optimized for Korean education

## 🛠 Technology Stack

- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7+
- **Frontend**: Vanilla JavaScript (ES6+)
- **LMS**: Moodle 3.7
- **Animation**: CSS3 keyframe animations

## 📋 Requirements

- PHP >= 7.1.9
- MySQL >= 5.7
- Moodle 3.7 database access
- Modern web browser (Chrome 60+, Safari 12+, Firefox 60+)
- Web server (Apache/Nginx with PHP support)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Configure database connection

Copy the example environment file:

```bash
cp config/.env.example config/.env
```

Edit `config/.env` with your Moodle database credentials:

```ini
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password
MOODLE_DB_PREFIX=mdl_
```

### 3. Set up web server

#### Apache

Add to your virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName choicegesture.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/choicegesture_error.log
    CustomLog ${APACHE_LOG_DIR}/choicegesture_access.log combined
</VirtualHost>
```

#### Nginx

Add to your server configuration:

```nginx
server {
    listen 80;
    server_name choicegesture.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 4. Set permissions

```bash
chmod 755 public
chmod 644 public/index.html
chmod 644 public/api.php
```

### 5. Test the installation

Open your browser and navigate to:

```
http://choicegesture.local
```

Or if using PHP built-in server:

```bash
cd public
php -S localhost:8000
```

Then visit: `http://localhost:8000`

## 📖 Usage

### Basic Operation

1. **Load Question**: Click "다음 문제" to load a random multiple choice question
2. **Select Answer**: Click on a choice (A, B, C, or D) to select it
3. **View Gesture**: Watch the animated hand gesture appear on tap
4. **Submit**: Click "정답 확인" to check your answer
5. **See Feedback**: View instant feedback with correct/incorrect indication
6. **Next Question**: Click "다음 문제" to continue

### Keyboard Shortcuts

- **1-4**: Select choice A, B, C, or D
- **Enter**: Submit answer (or load next question after answering)
- **Space**: Select focused choice

### API Endpoints

The application provides REST API endpoints:

#### Get Random Question
```
GET /api.php?action=random
GET /api.php?action=random&category=5
```

#### Get Specific Question
```
GET /api.php?action=question&id=123
```

#### Get Questions List
```
GET /api.php?action=questions&limit=10&offset=0
GET /api.php?action=questions&category=5
```

#### Get Categories
```
GET /api.php?action=categories
```

## 🎨 Customization

### Gesture Animation Settings

Edit `config/config.php`:

```php
'gesture' => [
    'animation_duration' => 800,    // Animation duration in milliseconds
    'tap_scale' => 0.95,            // Scale factor for tap effect
    'swipe_threshold' => 50,        // Swipe detection threshold
    'hand_animation_delay' => 200,  // Delay before hand appears
]
```

### Styling

Modify `public/css/style.css` to customize:
- Colors and gradients
- Animation timings
- Smartphone frame appearance
- Typography and spacing

## 🏗 Project Structure

```
alt42standalone_v1.0/
├── config/
│   ├── .env                    # Environment configuration
│   ├── .env.example            # Example configuration
│   └── config.php              # Main configuration file
├── src/
│   ├── Database/
│   │   └── Connection.php      # Database connection (Singleton)
│   └── Services/
│       └── QuestionService.php # Question retrieval service
├── public/
│   ├── css/
│   │   └── style.css           # Stylesheet with animations
│   ├── js/
│   │   └── app.js              # Main JavaScript application
│   ├── api.php                 # REST API endpoint
│   └── index.html              # Main HTML page
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
├── .gitignore
└── README.md
```

## 🔒 Security

- **Prepared Statements**: All database queries use PDO prepared statements
- **Input Validation**: API parameters are validated and sanitized
- **CORS Headers**: Configurable allowed origins
- **Error Handling**: Production mode hides sensitive error details
- **Environment Variables**: Credentials stored in .env file (git-ignored)

## 🧪 Testing

### Test Database Connection

```bash
php -r "require 'src/Database/Connection.php'; \
        use ALT42\Database\Connection; \
        \$conn = Connection::getInstance(); \
        echo 'Connection successful!';"
```

### Test API

```bash
# Test random question
curl http://localhost:8000/api.php?action=random

# Test categories
curl http://localhost:8000/api.php?action=categories
```

## 📊 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 60+ | ✅ Full support |
| Safari  | 12+ | ✅ Full support |
| Firefox | 60+ | ✅ Full support |
| Edge    | 79+ | ✅ Full support |
| IE      | ❌ Not supported | Use modern browser |

## 🐛 Troubleshooting

### Database Connection Errors

- Verify MySQL credentials in `config/.env`
- Check MySQL server is running: `sudo service mysql status`
- Ensure Moodle database exists and is accessible
- Verify table prefix matches Moodle installation

### No Questions Displayed

- Check if Moodle database has multiple choice questions
- Verify questions are not hidden (check `hidden` field in `mdl_question`)
- Review browser console for API errors

### Animation Not Working

- Clear browser cache
- Check browser developer console for CSS/JavaScript errors
- Verify CSS and JS files are loading correctly
- Disable browser extensions that may interfere

## 📝 License

Proprietary - KAIST Touch Math Academy

## 👥 Credits

Developed for KAIST Touch Math Academy
- Project: ALT42 Standalone v1.0
- Feature: Choice Gesture with Moodle Integration
- Compatible with Moodle 3.7, MySQL 5.7, PHP 7.1.9

## 🤝 Support

For issues or questions, please contact KAIST Touch Math Academy support team.
