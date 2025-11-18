<?php
/**
 * Application Configuration
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

// Error Reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// Application Settings
define('APP_NAME', 'Alternative Solutions');
define('APP_VERSION', '1.0.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development'); // development, production

// Paths
define('ROOT_PATH', dirname(dirname(__DIR__)));
define('SRC_PATH', ROOT_PATH . '/src');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('VIEW_PATH', SRC_PATH . '/views');

// URL Configuration
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('BASE_URL', $protocol . $host);

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', $protocol === 'https://' ? 1 : 0);
define('SESSION_LIFETIME', 7200); // 2 hours

// Security
define('CSRF_TOKEN_NAME', '_csrf_token');
define('PASSWORD_MIN_LENGTH', 6);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_ATTEMPT_TIMEOUT', 900); // 15 minutes

// Upload Settings
define('MAX_UPLOAD_SIZE', 5242880); // 5MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf']);

// Pagination
define('ITEMS_PER_PAGE', 20);

// Default Language
define('DEFAULT_LANG', 'ko');

// Minimum Requirements
define('MIN_ALTERNATIVES', 2);
define('MIN_STEPS', 3);

// Time Tracking
define('TIME_TRACKING_ENABLED', true);

// Email Settings (for future use)
define('MAIL_FROM_ADDRESS', 'noreply@altsolutions.com');
define('MAIL_FROM_NAME', APP_NAME);

// Debug Mode
define('DEBUG_MODE', APP_ENV === 'development');

// Load environment-specific config
if (APP_ENV === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Register autoloader
spl_autoload_register(function ($class) {
    // Remove namespace prefix
    $prefix = 'App\\';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get relative class name
    $relative_class = substr($class, $len);

    // Replace namespace separators with directory separators
    $file = SRC_PATH . '/' . str_replace('\\', '/', $relative_class) . '.php';

    // Load the file if it exists
    if (file_exists($file)) {
        require $file;
    }
});
