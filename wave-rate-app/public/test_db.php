<?php
/**
 * Database Connection Test
 * Run this file to verify database setup
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== Wave Rate Database Connection Test ===\n\n";

try {
    // Test database connection
    echo "[1] Testing database connection...\n";
    $db = Database::getInstance();
    echo "✓ Database connection successful!\n\n";

    // Test problems table
    echo "[2] Checking problems table...\n";
    $result = $db->query("SELECT COUNT(*) as count FROM problems");
    $row = $result->fetch();
    echo "✓ Found {$row['count']} problems in database\n\n";

    // List all problems
    echo "[3] Listing all problems:\n";
    $result = $db->query("SELECT id, moodle_question_id, question_text, function_expression, difficulty_level FROM problems");
    $problems = $result->fetchAll();

    foreach ($problems as $problem) {
        echo "   ID: {$problem['id']}\n";
        echo "   Moodle ID: {$problem['moodle_question_id']}\n";
        echo "   Question: {$problem['question_text']}\n";
        echo "   Function: {$problem['function_expression']}\n";
        echo "   Difficulty: {$problem['difficulty_level']}\n";
        echo "   ---\n";
    }

    // Test student_responses table
    echo "\n[4] Checking student_responses table...\n";
    $result = $db->query("SELECT COUNT(*) as count FROM student_responses");
    $row = $result->fetch();
    echo "✓ Found {$row['count']} student responses\n\n";

    // Test rate_data table
    echo "[5] Checking rate_data table...\n";
    $result = $db->query("SELECT COUNT(*) as count FROM rate_data");
    $row = $result->fetch();
    echo "✓ Found {$row['count']} rate data entries\n\n";

    echo "=== All tests passed! ===\n";
    echo "\nYou can now access the application at:\n";
    echo "http://localhost:8000/index.php\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "\nPlease check:\n";
    echo "1. MySQL is running: sudo systemctl status mysql\n";
    echo "2. Database exists: mysql -u root -p -e 'SHOW DATABASES;'\n";
    echo "3. Schema is loaded: mysql -u root -p wave_rate_db < database/schema.sql\n";
    echo "4. .env file has correct credentials\n";
}
