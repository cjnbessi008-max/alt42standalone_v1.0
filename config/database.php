<?php
/**
 * Database Configuration
 * Math Concept Game System
 */

// Environment detection (you can set this via server environment variable)
$env = getenv('APP_ENV') ?: 'development';

// Database configurations for different environments
$db_configs = [
    'development' => [
        'host' => 'localhost',
        'database' => 'math_game_dev',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'port' => 3306,
    ],
    'production' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'database' => getenv('DB_NAME') ?: 'math_game_prod',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') ?: '',
        'charset' => 'utf8mb4',
        'port' => getenv('DB_PORT') ?: 3306,
    ],
];

// Get current environment config
$config = $db_configs[$env];

// PDO options for better error handling and security
$pdo_options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$config['charset']} COLLATE utf8mb4_unicode_ci"
];

try {
    // Create PDO instance
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};port={$config['port']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], $pdo_options);
} catch (PDOException $e) {
    // Log error securely (don't expose DB credentials in error messages)
    error_log("Database Connection Failed: " . $e->getMessage());

    // Return user-friendly error
    if ($env === 'development') {
        die("Database connection failed: " . $e->getMessage());
    } else {
        die("Database connection failed. Please contact system administrator.");
    }
}

// Return the PDO instance for use in other files
return $pdo;
