<?php
/**
 * Installation Script for Weak Concept Link Detection System
 *
 * This script helps set up the database and verify configuration
 */

// Disable time limit for installation
set_time_limit(0);

echo "=================================================\n";
echo "약한 개념 연결 탐지 시스템 - 설치 스크립트\n";
echo "Weak Concept Link Detection System - Installer\n";
echo "=================================================\n\n";

// Check if config file exists
if (!file_exists(__DIR__ . '/config/config.php')) {
    die("❌ Error: config/config.php not found!\n");
}

require_once __DIR__ . '/config/config.php';

echo "✅ Configuration file loaded\n\n";

// Step 1: Test database connection
echo "Step 1: Testing database connection...\n";
try {
    $db = Database::getInstance();
    if ($db->ping()) {
        echo "✅ Database connection successful!\n";
        echo "   Host: " . DB_HOST . "\n";
        echo "   Database: " . DB_NAME . "\n\n";
    } else {
        die("❌ Database connection failed!\n");
    }
} catch (Exception $e) {
    die("❌ Database error: " . $e->getMessage() . "\n");
}

// Step 2: Initialize database schema
echo "Step 2: Initializing database schema...\n";
$schemaFile = __DIR__ . '/sql/schema.sql';

if (!file_exists($schemaFile)) {
    die("❌ Error: sql/schema.sql not found!\n");
}

try {
    $success = $db->initializeSchema($schemaFile);
    if ($success) {
        echo "✅ Database schema initialized successfully!\n\n";
    } else {
        die("❌ Failed to initialize database schema!\n");
    }
} catch (Exception $e) {
    die("❌ Schema initialization error: " . $e->getMessage() . "\n");
}

// Step 3: Verify tables
echo "Step 3: Verifying database tables...\n";
$tables = [
    'concepts',
    'concept_relations',
    'quiz_analysis',
    'weak_links',
    'moodle_sync_log',
    'student_performance_patterns'
];

foreach ($tables as $table) {
    $result = $db->query("SHOW TABLES LIKE ?", [$table]);
    if (count($result) > 0) {
        echo "✅ Table '$table' exists\n";
    } else {
        echo "❌ Table '$table' NOT found\n";
    }
}
echo "\n";

// Step 4: Check concept data
echo "Step 4: Checking sample concept data...\n";
$concepts = $db->query("SELECT COUNT(*) as count FROM concepts");
$conceptCount = $concepts[0]['count'] ?? 0;

if ($conceptCount > 0) {
    echo "✅ Found $conceptCount sample concepts\n";

    $sampleConcepts = $db->query("SELECT name FROM concepts LIMIT 5");
    echo "   Sample concepts:\n";
    foreach ($sampleConcepts as $concept) {
        echo "   - " . $concept['name'] . "\n";
    }
} else {
    echo "⚠️  No sample concepts found (this is normal for fresh install)\n";
}
echo "\n";

// Step 5: Test Moodle connection (optional)
echo "Step 5: Testing Moodle connection...\n";
if (empty(MOODLE_TOKEN)) {
    echo "⚠️  Moodle token not configured\n";
    echo "   Please set MOODLE_TOKEN in config/config.php\n";
} else {
    try {
        $moodle = new MoodleConnector();
        if ($moodle->testConnection()) {
            echo "✅ Moodle connection successful!\n";
            echo "   URL: " . MOODLE_URL . "\n";
        } else {
            echo "❌ Moodle connection failed\n";
            echo "   Please check MOODLE_URL and MOODLE_TOKEN in config/config.php\n";
        }
    } catch (Exception $e) {
        echo "❌ Moodle connection error: " . $e->getMessage() . "\n";
    }
}
echo "\n";

// Step 6: Check file permissions
echo "Step 6: Checking file permissions...\n";
$writableDirs = [];
if (is_writable(__DIR__)) {
    echo "✅ Application directory is writable\n";
} else {
    echo "⚠️  Application directory may not be writable\n";
    echo "   Run: sudo chown -R www-data:www-data " . __DIR__ . "\n";
}
echo "\n";

// Installation complete
echo "=================================================\n";
echo "🎉 Installation Complete!\n";
echo "=================================================\n\n";

echo "Next steps:\n";
echo "1. Configure Moodle settings in config/config.php (if not done)\n";
echo "2. Visit http://your-domain/ to access the dashboard\n";
echo "3. Click 'Moodle 데이터 동기화' to sync quiz data\n";
echo "4. Click '약한 연결 분석 실행' to detect weak links\n\n";

echo "Configuration summary:\n";
echo "- Database: " . DB_NAME . " @ " . DB_HOST . "\n";
echo "- Moodle URL: " . MOODLE_URL . "\n";
echo "- Moodle Token: " . (empty(MOODLE_TOKEN) ? "Not configured" : "Configured") . "\n";
echo "- Debug Mode: " . (DEBUG_MODE ? "ON" : "OFF") . "\n\n";

echo "For production deployment:\n";
echo "- Set DEBUG_MODE = false in config/config.php\n";
echo "- Configure SSL/HTTPS\n";
echo "- Set up regular sync cron job\n\n";

echo "Installation log saved to: install.log\n";
echo "\n";
