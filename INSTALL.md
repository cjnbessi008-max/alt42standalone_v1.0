# Power Candle - Installation Guide

## Quick Start (Development)

### Prerequisites

- PHP 7.1.9+
- MySQL 5.7+
- Node.js 16+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/your-org/power-candle.git
cd power-candle
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p

CREATE DATABASE power_candle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schema
mysql -u root -p power_candle < database/schema.sql
```

### 3. Backend Setup

```bash
cd backend

# Configure
cp config/config.example.php config/config.php

# Edit config.php with your database credentials
# For development, you can use:
# - host: localhost
# - database: power_candle
# - username: root
# - password: your_mysql_password
```

**Minimal `config.php` for development:**

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'power_candle',
        'username' => 'root',
        'password' => 'your_password',
        'charset' => 'utf8mb4',
    ],
    'moodle' => [
        'url' => 'http://your-moodle-dev.local',
        'token' => 'dev-token', // Get from Moodle
        'quiz_id' => 1,
    ],
    'app' => [
        'debug' => true,
        'timezone' => 'Asia/Seoul',
    ],
    'cors' => [
        'allowed_origins' => ['http://localhost:3000'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization'],
    ],
];
```

### 4. Start Backend Server

```bash
# Using PHP built-in server (for development only)
cd backend
php -S localhost:8000

# Backend API will be available at:
# http://localhost:8000/api/problem
# http://localhost:8000/api/submit
# http://localhost:8000/api/progress
```

### 5. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env.local

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Testing the Application

### 1. Test Database Connection

```bash
cd backend

cat > test_db.php << 'EOF'
<?php
require_once 'config/Database.php';
$config = require 'config/config.php';

try {
    $db = Database::getInstance($config);
    echo "✓ Database connection successful!\n";

    $problems = $db->fetchAll('SELECT COUNT(*) as count FROM problems');
    echo "Problems in database: " . $problems[0]['count'] . "\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
}
EOF

php test_db.php
```

### 2. Test API Endpoints

```bash
# Get a random problem (difficulty 1)
curl http://localhost:8000/api/problem?difficulty=1

# Expected response:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "base": 2,
#     "result": 8,
#     "question_text": "Calculate: log₂ 8 = ?",
#     ...
#   }
# }
```

### 3. Test Frontend

1. Open browser: `http://localhost:3000`
2. You should see:
   - Virtual smartphone frame
   - A logarithm problem
   - Answer input field
   - Submit button

3. Try solving a problem:
   - For `log₂ 8 = ?`, answer is `3`
   - Submit and see the candle animation!

## Sample Data

The database schema includes sample problems. To add more:

```sql
INSERT INTO problems (
    moodle_question_id,
    problem_type,
    base,
    result,
    correct_answer,
    difficulty,
    question_text,
    hint_text,
    explanation
) VALUES (
    101,
    'calculate',
    2,
    64,
    6,
    3,
    'Calculate: log₂ 64 = ?',
    'Think: 2 × 2 × 2 × 2 × 2 × 2 = 64',
    '2⁶ = 64, so log₂ 64 = 6. You need 6 candles!'
);
```

## Development Tips

### Hot Reload

- **Frontend**: React dev server auto-reloads on file changes
- **Backend**: Restart PHP server after changing PHP files

### Debugging

**Backend (PHP):**

```php
// Add to any PHP file for debugging
error_log('Debug: ' . print_r($variable, true));

// Check logs
tail -f backend/logs/application.log
```

**Frontend (React):**

```javascript
// Use browser console
console.log('Debug:', variable);

// React DevTools extension recommended
```

### Database Queries

```bash
# Access database directly
mysql -u root -p power_candle

# Useful queries:
SELECT * FROM problems LIMIT 5;
SELECT * FROM student_attempts ORDER BY attempted_at DESC LIMIT 10;
SELECT * FROM student_performance;
```

## Troubleshooting

### "Database connection failed"

**Check:**
1. MySQL is running: `sudo systemctl status mysql`
2. Database exists: `mysql -u root -p -e "SHOW DATABASES;"`
3. Credentials in `config.php` are correct

### "CORS error" in browser

**Solution:**
- Ensure `config.php` has `http://localhost:3000` in allowed origins
- Restart PHP server

### "Cannot GET /api/problem"

**Check:**
1. PHP server is running on port 8000
2. `.htaccess` file exists in `backend/` directory
3. Try accessing: `http://localhost:8000/api/problem.php` directly

### Frontend shows "Failed to load problem"

**Check:**
1. Backend server is running
2. `.env.local` has correct API URL
3. Browser console for error messages
4. Network tab shows API request/response

## Next Steps

After installation:

1. **Configure Moodle** (see DEPLOYMENT.md for details)
   - Enable Web Services
   - Create service user
   - Generate token
   - Update `config.php` with token

2. **Customize Problems**
   - Add more problems to database
   - Adjust difficulty levels
   - Create quiz in Moodle

3. **Test with Students**
   - Create test student accounts
   - Try different difficulty levels
   - Check progress tracking

4. **Production Deployment**
   - See DEPLOYMENT.md for production setup
   - Configure Apache/Nginx
   - Enable SSL
   - Set up backups

## Additional Resources

- **README.md**: Project overview and features
- **ARCHITECTURE.md**: Technical architecture details
- **DEPLOYMENT.md**: Production deployment guide
- **API Documentation**: (Generated from code)

## Support

For issues during installation:
1. Check the troubleshooting section above
2. Review error logs (backend and frontend)
3. Verify all prerequisites are installed
4. Check GitHub issues for similar problems

Happy coding! 🕯️
