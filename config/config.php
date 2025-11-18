<?php
/**
 * ALT42 Choice Gesture - Configuration File
 * Moodle 3.7 Integration for KAIST Touch Math Academy
 *
 * Compatible with:
 * - MySQL 5.7+
 * - PHP 7.1.9+
 * - Moodle 3.7
 */

// Load environment variables
function loadEnv($path) {
    if (!file_exists($path)) {
        throw new Exception("Environment file not found: $path");
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse key=value
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Load .env file
$envPath = __DIR__ . '/.env';
loadEnv($envPath);

// Configuration array
return [
    // Database Configuration
    'database' => [
        'host' => getenv('MOODLE_DB_HOST') ?: 'localhost',
        'port' => getenv('MOODLE_DB_PORT') ?: 3306,
        'name' => getenv('MOODLE_DB_NAME') ?: 'moodle',
        'user' => getenv('MOODLE_DB_USER') ?: 'moodle_user',
        'pass' => getenv('MOODLE_DB_PASS') ?: '',
        'prefix' => getenv('MOODLE_DB_PREFIX') ?: 'mdl_',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],

    // Application Settings
    'app' => [
        'name' => 'ALT42 Choice Gesture',
        'version' => '1.0.0',
        'env' => getenv('APP_ENV') ?: 'production',
        'debug' => filter_var(getenv('APP_DEBUG'), FILTER_VALIDATE_BOOLEAN),
        'timezone' => 'Asia/Seoul',
    ],

    // Cache Settings
    'cache' => [
        'enabled' => filter_var(getenv('CACHE_ENABLED'), FILTER_VALIDATE_BOOLEAN),
        'ttl' => (int)(getenv('CACHE_TTL') ?: 3600),
        'path' => __DIR__ . '/../storage/cache',
    ],

    // API Settings
    'api' => [
        'timeout' => (int)(getenv('API_TIMEOUT') ?: 30),
        'max_questions' => (int)(getenv('MAX_QUESTIONS_PER_PAGE') ?: 20),
    ],

    // Choice Gesture Settings
    'gesture' => [
        'animation_duration' => 800, // milliseconds
        'tap_scale' => 0.95,
        'swipe_threshold' => 50, // pixels
        'hand_animation_delay' => 200, // milliseconds
    ],

    // Security Settings
    'security' => [
        'allowed_origins' => ['*'], // Configure for production
        'rate_limit' => 100, // requests per minute
    ]
];
