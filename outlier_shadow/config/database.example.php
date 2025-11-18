<?php
/**
 * Database Configuration Example for Outlier Shadow
 * Copy this file to database.php and update with your settings
 */

// MySQL Database Connection Settings
define('DB_HOST', 'localhost');              // Database host (usually 'localhost')
define('DB_NAME', 'moodle');                 // Your Moodle database name
define('DB_USER', 'moodle_user');            // Database username
define('DB_PASS', 'moodle_password');        // Database password
define('DB_CHARSET', 'utf8mb4');             // Character set

// Moodle Configuration
define('MOODLE_PREFIX', 'mdl_');             // Moodle table prefix (default: 'mdl_')

// Application Settings
define('UPDATE_INTERVAL', 30);               // Auto-refresh interval in seconds
define('OUTLIER_METHOD', 'iqr');             // Default outlier detection method ('iqr' or 'zscore')
define('IQR_THRESHOLD', 1.5);                // IQR multiplier for outlier detection
define('ZSCORE_THRESHOLD', 2.5);             // Z-score threshold for outlier detection

// Display Settings
define('MAX_STUDENTS_DISPLAY', 100);         // Maximum number of students to display
define('SHOW_STUDENT_IDS', true);            // Show student IDs in the interface
