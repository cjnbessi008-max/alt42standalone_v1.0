# Touch Math Academy - Interactive Graph Calculator

A standalone web application for visualizing mathematical functions and their derivatives. Integrates with Moodle LMS to provide interactive math education with a virtual smartphone interface.

## Features

- **Interactive Graph Visualization**: Plot mathematical functions using Plotly.js
- **Derivative Calculation**: Show derivative functions with smooth transitions (no "Derivative Pulse" bug)
- **Virtual Smartphone UI**: Displays app in a smartphone frame positioned at bottom-right
- **Moodle Integration**: Fetches problems from Moodle LMS and logs student activities
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Feedback**: Immediate visual feedback on function plotting and derivatives

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Graphing**: Plotly.js 2.26.0
- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7+
- **LMS**: Moodle 3.7+

## Installation

### Prerequisites

- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- Moodle 3.7 (for LMS integration)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### Step 2: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and tables
source db/schema.sql

# Create database user (update password)
CREATE USER 'touchmath_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE ON touchmath_graphs.* TO 'touchmath_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Configure Application

Edit `api/config.php` and update:

```php
// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'touchmath_graphs');
define('DB_USER', 'touchmath_user');
define('DB_PASS', 'your_secure_password');

// Moodle configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token_here');
```

### Step 4: Web Server Configuration

#### Apache

Create a virtual host:

```apache
<VirtualHost *:80>
    ServerName touchmath.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/touchmath-error.log
    CustomLog ${APACHE_LOG_DIR}/touchmath-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name touchmath.local;
    root /path/to/alt42standalone_v1.0;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### Step 5: Moodle Web Services Setup

1. **Enable Web Services** in Moodle:
   - Site administration → Advanced features → Enable web services

2. **Create External Service**:
   - Site administration → Server → Web services → External services
   - Add a new service: "Touch Math Graph Calculator"

3. **Add Custom Functions** (create these in a Moodle plugin):
   - `local_touchmath_get_problem`
   - `local_touchmath_log_activity`

4. **Generate Token**:
   - Site administration → Server → Web services → Manage tokens
   - Create token for the service

## Usage

### Accessing the Application

#### Standalone Mode (Demo)
```
http://touchmath.local/
```

#### Moodle Integration Mode
```
http://touchmath.local/?problemid=1&userid=student123
```

### URL Parameters

- `problemid`: ID of the problem to load from Moodle
- `userid`: Student/user identifier

### Supported Function Syntax

| Function | Syntax | Example |
|----------|--------|---------|
| Power | `x^n` | `x^2`, `x^3` |
| Sine | `sin(x)` | `sin(x)` |
| Cosine | `cos(x)` | `cos(x)` |
| Tangent | `tan(x)` | `tan(x)` |
| Exponential | `exp(x)` | `exp(x)` |
| Square Root | `sqrt(x)` | `sqrt(x)` |
| Absolute Value | `abs(x)` | `abs(x)` |
| Natural Log | `ln(x)` | `ln(x)` |
| Common Log | `log(x)` | `log(x)` |
| Arithmetic | `+`, `-`, `*`, `/` | `2*x + 3` |

## Key Features

### Derivative Pulse Fix

The original "Derivative Pulse" bug caused graphs to shrink momentarily when calculating derivatives. This has been **completely fixed** through:

1. **Fixed Axis Ranges**: Y-axis range is calculated once and maintained during derivative addition
2. **Smooth Transitions**: Using `Plotly.react()` instead of `Plotly.update()` for seamless updates
3. **Numerical Stability**: Central difference method for accurate derivative calculation
4. **No Re-rendering**: Graph updates without full DOM re-render

**Code Location**: `js/graphing.js` - `GraphCalculator.showDerivative()` method

### Virtual Smartphone Display

The application features a smartphone frame positioned at the bottom-right corner:
- Fixed position on desktop
- Responsive on mobile
- 380x720px virtual screen
- Realistic phone bezel design

**Code Location**: `css/style.css` - `.smartphone-frame` class

## API Endpoints

### Get Problem Data
```
GET /api/problem_api.php?problemid=1&userid=student123
```

**Response:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "Quadratic Function",
    "description": "Plot f(x) = x² and observe its derivative",
    "function": "x^2",
    "difficulty": "easy"
  }
}
```

### Log Student Activity
```
POST /api/moodle_api.php
Content-Type: application/json

{
  "userid": "student123",
  "problemid": 1,
  "action": "show_derivative",
  "details": "x^2",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

## Database Schema

### Tables

- **problems**: Math problems and exercises
- **problem_access**: Tracks problem access
- **student_activities**: Logs all student actions
- **student_progress**: Overall progress tracking
- **moodle_sync_log**: Moodle synchronization logs

## Development

### File Structure

```
alt42standalone_v1.0/
├── index.html              # Main application page
├── css/
│   └── style.css          # Stylesheet with smartphone UI
├── js/
│   ├── app.js             # Application logic and Moodle integration
│   └── graphing.js        # Graph rendering and derivative calculation
├── api/
│   ├── config.php         # Database and Moodle configuration
│   ├── problem_api.php    # Problem data API
│   └── moodle_api.php     # Activity logging API
├── db/
│   └── schema.sql         # MySQL database schema
└── README.md              # This file
```

### Testing Derivative Function

1. Open the application
2. Enter a function (e.g., `x^2`)
3. Click "Plot Graph"
4. Click "Show Derivative"
5. **Verify**: Graph should smoothly add the derivative line without any "pulse" or shrinking

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Problem: Graph not displaying

**Solution**: Check browser console for errors. Ensure Plotly.js CDN is accessible.

### Problem: Derivative shows wrong values

**Solution**: Verify function syntax. Use proper mathematical notation (e.g., `x^2` not `x²`).

### Problem: Moodle integration not working

**Solution**:
1. Verify `MOODLE_TOKEN` in `api/config.php`
2. Check Moodle web services are enabled
3. Review `moodle_sync_log` table for error messages

### Problem: Database connection failed

**Solution**:
1. Verify MySQL is running
2. Check credentials in `api/config.php`
3. Ensure database user has proper permissions

## Security Notes

- Change default database password in production
- Use HTTPS in production environments
- Validate all user inputs
- Keep Moodle token secure
- Enable CORS only for trusted domains in production

## License

Copyright © 2025 KAIST Touch Math Academy

## Support

For issues and questions, contact the development team.

## Version History

- **v1.0.0** (2025-11-18): Initial release with derivative pulse fix
