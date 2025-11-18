# Outlier Shadow - Student Performance Monitor

A mobile-responsive web application that integrates with Moodle 3.7 LMS to visualize student performance outliers using dark shadow effects.

## Features

- **Real-time Monitoring**: Automatically updates student performance data every 30 seconds
- **Outlier Detection**: Uses statistical methods (IQR and Z-score) to identify performance outliers
- **Visual Shadow Effects**: Displays outliers with distinctive dark shadows
  - Red shadows for low-performing students (at risk)
  - Blue shadows for high-performing students (excelling)
- **Mobile-Responsive**: Optimized smartphone UI displayed in bottom-right corner
- **Moodle Integration**: Direct connection to Moodle 3.7 MySQL database
- **Filtering**: Filter view by all students, outliers only, at-risk, or excelling

## Technology Stack

- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)

## Installation

### 1. Prerequisites

- PHP 7.1.9 or higher
- MySQL 5.7
- Moodle 3.7 installation
- Web server (Apache/Nginx)

### 2. Setup

1. Clone or copy the `outlier_shadow` directory to your web server:
   ```bash
   cp -r outlier_shadow /var/www/html/
   ```

2. Configure database connection:
   ```bash
   cd /var/www/html/outlier_shadow/config
   cp database.example.php database.php
   nano database.php
   ```

3. Update database credentials in `config/database.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_moodle_db');
   define('DB_USER', 'your_db_user');
   define('DB_PASS', 'your_db_password');
   define('MOODLE_PREFIX', 'mdl_');  // Your Moodle table prefix
   ```

4. Set appropriate permissions:
   ```bash
   chmod 755 /var/www/html/outlier_shadow
   chmod 644 /var/www/html/outlier_shadow/config/database.php
   ```

### 3. Access the Application

Open your browser and navigate to:
```
http://your-server/outlier_shadow/
```

## Usage

### Basic Usage

Access the app without parameters to see all students:
```
http://your-server/outlier_shadow/
```

### Filter by Course

Display students from a specific course:
```
http://your-server/outlier_shadow/?course_id=123
```

### Filter by Quiz

Display results for a specific quiz:
```
http://your-server/outlier_shadow/?quiz_id=456
```

### Change Detection Method

Use Z-score instead of IQR:
```
http://your-server/outlier_shadow/?method=zscore
```

### Combined Parameters

```
http://your-server/outlier_shadow/?course_id=123&method=zscore
```

## Outlier Detection Methods

### IQR Method (Default)
- Uses Interquartile Range (IQR) to identify outliers
- Outliers: Values beyond Q1 - 1.5×IQR or Q3 + 1.5×IQR
- More robust to extreme values
- Better for small datasets

### Z-Score Method
- Uses standard deviation to identify outliers
- Outliers: Values with |z-score| > 2.5
- Assumes normal distribution
- Better for large datasets

## Shadow Visualization

The application uses **dark shadows** to highlight outliers:

### Low Performers (At Risk)
- **Color**: Dark red shadow
- **Intensity**: Increases with severity
- **Purpose**: Identifies students who need attention

### High Performers (Excelling)
- **Color**: Dark blue shadow
- **Intensity**: Increases with severity
- **Purpose**: Identifies exceptional students

### Shadow Intensity Scale
- **0.3-0.5**: Mild outlier
- **0.5-0.7**: Moderate outlier
- **0.7-0.9**: Severe outlier

## UI Features

### Student Cards
Each card displays:
- Student name and ID
- Current score (average or latest)
- Performance statistics (attempts, min, max)
- Visual progress bar
- Outlier badge (if applicable)
- Dynamic shadow effect

### Filter Tabs
- **All**: Show all students
- **Outliers**: Show only outliers (both high and low)
- **At Risk**: Show only low-performing outliers
- **Excelling**: Show only high-performing outliers

### Statistics Summary
Displays:
- Mean score
- Standard deviation
- Median score
- Number of outliers
- Outlier percentage
- Total students

## API Endpoints

### GET /api/get_students.php

Retrieve student data with outlier analysis.

**Parameters:**
- `course_id` (optional): Filter by course ID
- `quiz_id` (optional): Filter by quiz ID
- `method` (optional): Detection method ('iqr' or 'zscore')

**Response:**
```json
{
  "success": true,
  "students": [...],
  "statistics": {
    "mean": 75.5,
    "stddev": 12.3,
    "median": 78.0,
    "outlier_count": 5
  },
  "outlier_count": 5,
  "method": "iqr",
  "timestamp": "2025-11-18 10:30:00"
}
```

## Database Schema

The application reads from Moodle's standard tables:

- `mdl_quiz`: Quiz information
- `mdl_quiz_attempts`: Student quiz attempts
- `mdl_user`: User information
- `mdl_course`: Course information
- `mdl_question`: Question details
- `mdl_question_attempts`: Question-level attempts

## Configuration Options

Edit `config/database.php` to customize:

```php
// Auto-refresh interval (seconds)
define('UPDATE_INTERVAL', 30);

// Default detection method
define('OUTLIER_METHOD', 'iqr');

// IQR threshold multiplier
define('IQR_THRESHOLD', 1.5);

// Z-score threshold
define('ZSCORE_THRESHOLD', 2.5);

// Maximum students to display
define('MAX_STUDENTS_DISPLAY', 100);
```

## Troubleshooting

### No data appears
1. Check database credentials in `config/database.php`
2. Verify Moodle table prefix matches your installation
3. Ensure students have completed quiz attempts
4. Check browser console for JavaScript errors

### Database connection errors
1. Verify MySQL is running: `systemctl status mysql`
2. Test database connection: `mysql -u username -p`
3. Check PHP PDO extension: `php -m | grep pdo`

### Outliers not detected
1. Ensure minimum 3 attempts per student
2. Check if data has sufficient variance
3. Try different detection method (IQR vs Z-score)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

1. **Production Use**: Disable error display in `index.php`:
   ```php
   error_reporting(0);
   ini_set('display_errors', 0);
   ```

2. **Database Access**: Use read-only database user
3. **HTTPS**: Always use HTTPS in production
4. **Authentication**: Add authentication layer for production use

## Performance Tips

1. **Database Indexing**: Ensure Moodle tables are properly indexed
2. **Caching**: Consider implementing Redis/Memcached for large datasets
3. **Limit Results**: Use `MAX_STUDENTS_DISPLAY` to limit query size
4. **Optimize Queries**: Monitor slow queries in MySQL

## Future Enhancements

- [ ] User authentication integration
- [ ] Export data to CSV/PDF
- [ ] Historical trend analysis
- [ ] Email notifications for new outliers
- [ ] Customizable shadow colors
- [ ] Support for custom Moodle activities
- [ ] Mobile app version (iOS/Android)

## License

Copyright 2025. All rights reserved.

## Support

For issues and questions, please contact your system administrator.

## Credits

Developed for integration with Moodle 3.7 LMS using PHP 7.1.9 and MySQL 5.7.
