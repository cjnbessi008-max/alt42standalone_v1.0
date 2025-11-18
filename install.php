<?php
/**
 * Installation Script for Cognitive Recovery System
 * Run this script to initialize the database
 */

require_once __DIR__ . '/config/config.php';

echo "========================================\n";
echo "Cognitive Recovery System Installation\n";
echo "========================================\n\n";

try {
    // Connect to MySQL without database selection
    $dsn = sprintf('mysql:host=%s;charset=%s', DB_HOST, DB_CHARSET);
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database if not exists
    echo "Creating database...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database created/verified\n\n";

    // Connect to the database
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Read and execute schema
    echo "Installing database schema...\n";
    $schema = file_get_contents(__DIR__ . '/database/schema.sql');

    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $schema)),
        function($stmt) { return !empty($stmt) && substr($stmt, 0, 2) !== '--'; }
    );

    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $pdo->exec($statement);
        }
    }

    echo "✓ Schema installed successfully\n\n";

    // Create logs directory
    echo "Creating directories...\n";
    $dirs = [
        __DIR__ . '/logs',
        __DIR__ . '/storage',
        __DIR__ . '/storage/uploads',
        __DIR__ . '/storage/cache'
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
            echo "✓ Created: $dir\n";
        }
    }

    echo "\n========================================\n";
    echo "Installation completed successfully!\n";
    echo "========================================\n\n";

    echo "Next steps:\n";
    echo "1. Copy config/.env.example to config/.env\n";
    echo "2. Configure your Moodle URL and token in .env\n";
    echo "3. Set up your web server to point to /public directory\n";
    echo "4. Access the dashboard at http://yourserver/dashboard.html\n";
    echo "5. Test Moodle connection at /api/moodle/test\n\n";

} catch (PDOException $e) {
    echo "\n✗ Installation failed: " . $e->getMessage() . "\n\n";
    exit(1);
}
