<?php
/**
 * Dot Product Heat Visualization - Configuration
 * MySQL 5.7 + PHP 7.1.9 + Moodle 3.7 Integration
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'dot_product_heat');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle web service token
define('MOODLE_WS_FUNCTION', 'core_course_get_contents');

// App Configuration
define('APP_NAME', 'Dot Product Heat');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

// Heat Map Configuration
define('MIN_DOT_PRODUCT', -1.0);
define('MAX_DOT_PRODUCT', 1.0);

// Color Temperature Settings
define('COLD_COLOR', '#0000FF');  // Blue (negative dot product)
define('NEUTRAL_COLOR', '#FFFFFF'); // White (zero dot product)
define('WARM_COLOR', '#FF0000');  // Red (positive dot product)

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');
