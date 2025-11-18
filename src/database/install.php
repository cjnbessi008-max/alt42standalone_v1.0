&lt;?php
/**
 * Database Installation Script
 * Run this to set up the database schema
 */

require_once __DIR__ . '/../backend/Database.php';

echo "===========================================\n";
echo "Unstable Concept Detector - Installation\n";
echo "===========================================\n\n";

try {
    // Read database configuration
    $config = require __DIR__ . '/../config/database.php';

    echo "Connecting to MySQL server...\n";

    // Connect to MySQL server (without selecting database)
    $pdo = new PDO(
        "mysql:host={$config['host']};port={$config['port']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    echo "✓ Connected to MySQL server\n\n";

    // Create database if it doesn't exist
    echo "Creating database '{$config['database']}'...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$config['database']}`
                CHARACTER SET {$config['charset']}
                COLLATE {$config['collation']}");
    echo "✓ Database created or already exists\n\n";

    // Select the database
    $pdo->exec("USE `{$config['database']}`");

    // Read and execute schema file
    echo "Loading schema file...\n";
    $schema = file_get_contents(__DIR__ . '/schema.sql');

    if ($schema === false) {
        throw new Exception("Could not read schema.sql file");
    }

    echo "Executing schema...\n";
    $pdo->exec($schema);

    echo "✓ Schema installed successfully\n\n";

    // Verify installation
    echo "Verifying installation...\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    echo "Created tables:\n";
    foreach ($tables as $table) {
        echo "  • $table\n";
    }

    echo "\n===========================================\n";
    echo "Installation completed successfully!\n";
    echo "===========================================\n";
    echo "\nYou can now access the application.\n";
    echo "Default login:\n";
    echo "  Email: teacher@example.com\n";
    echo "  Password: password\n\n";

} catch (PDOException $e) {
    echo "\n✗ Database Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
