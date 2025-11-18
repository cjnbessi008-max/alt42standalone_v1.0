<?php
/**
 * Simple autoloader for the application
 */

spl_autoload_register(function ($class) {
    // Project namespace
    $prefix = 'JumpThinking\\';
    $baseDir = __DIR__ . '/';

    // Check if class uses the namespace prefix
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get relative class name
    $relativeClass = substr($class, $len);

    // Replace namespace separators with directory separators
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // Load file if it exists
    if (file_exists($file)) {
        require $file;
    }
});

// Load configuration
define('APP_ROOT', dirname(__DIR__));
define('CONFIG_PATH', APP_ROOT . '/config');
define('PUBLIC_PATH', APP_ROOT . '/public');
define('SRC_PATH', APP_ROOT . '/src');

// Error reporting (adjust for production)
$appConfig = require CONFIG_PATH . '/app.php';
if ($appConfig['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set($appConfig['timezone']);

// Session configuration
ini_set('session.name', $appConfig['security']['session_name']);
ini_set('session.gc_maxlifetime', $appConfig['security']['session_lifetime']);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 1 : 0);
