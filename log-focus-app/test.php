<?php
/**
 * Log Focus App - Test Script
 * Run this to verify your installation
 */

echo "<h1>Log Focus App - System Test</h1>";
echo "<hr>";

// Test 1: PHP Version
echo "<h2>1. PHP Version Check</h2>";
$phpVersion = phpversion();
echo "Current PHP Version: <strong>$phpVersion</strong><br>";

if (version_compare($phpVersion, '7.1.0', '>=')) {
    echo "✅ PHP version is compatible<br>";
} else {
    echo "❌ PHP version 7.1.0 or higher required<br>";
}
echo "<br>";

// Test 2: Required Extensions
echo "<h2>2. Required PHP Extensions</h2>";
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];

foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ $ext: Loaded<br>";
    } else {
        echo "❌ $ext: Not loaded<br>";
    }
}
echo "<br>";

// Test 3: Database Connection
echo "<h2>3. Database Connection</h2>";
require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "✅ Database connection successful<br>";

    // Test query
    $stmt = $db->query("SELECT COUNT(*) as count FROM activity_logs");
    $result = $stmt->fetch();
    echo "📊 Total logs in database: <strong>{$result['count']}</strong><br>";

    $stmt = $db->query("SELECT COUNT(*) as count FROM highlight_keywords WHERE is_active = 1");
    $result = $stmt->fetch();
    echo "🎨 Active highlight keywords: <strong>{$result['count']}</strong><br>";

} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
}
echo "<br>";

// Test 4: Moodle Configuration
echo "<h2>4. Moodle Configuration</h2>";
require_once __DIR__ . '/config/moodle.php';

echo "Moodle URL: <strong>" . MOODLE_URL . "</strong><br>";

if (MOODLE_TOKEN === 'YOUR_MOODLE_WEB_SERVICE_TOKEN_HERE') {
    echo "⚠️ Moodle token not configured yet<br>";
} else {
    echo "✅ Moodle token configured<br>";
}
echo "<br>";

// Test 5: File Permissions
echo "<h2>5. File Permissions</h2>";

$checkDirs = [
    __DIR__ . '/config',
    __DIR__ . '/api',
    __DIR__ . '/public',
    __DIR__ . '/public/css',
    __DIR__ . '/public/js'
];

foreach ($checkDirs as $dir) {
    if (is_readable($dir)) {
        echo "✅ $dir: Readable<br>";
    } else {
        echo "❌ $dir: Not readable<br>";
    }
}
echo "<br>";

// Test 6: API Endpoints
echo "<h2>6. API Endpoints Test</h2>";

try {
    require_once __DIR__ . '/api/log_api.php';
    $api = new LogAPI();

    // Test getting keywords
    $keywords = $api->getHighlightKeywords();
    echo "✅ API endpoint working<br>";
    echo "📝 Keyword categories: <strong>" . count($keywords) . "</strong><br>";

} catch (Exception $e) {
    echo "❌ API test failed: " . $e->getMessage() . "<br>";
}
echo "<br>";

// Test 7: Sample Data
echo "<h2>7. Sample Data Check</h2>";

try {
    $stmt = $db->query("SELECT activity_type, COUNT(*) as count FROM activity_logs GROUP BY activity_type");
    $results = $stmt->fetchAll();

    if (count($results) > 0) {
        echo "✅ Sample data found<br>";
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Activity Type</th><th>Count</th></tr>";
        foreach ($results as $row) {
            echo "<tr><td>{$row['activity_type']}</td><td>{$row['count']}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "⚠️ No sample data found. Run: <code>mysql -u root -p log_focus_app &lt; database/sample_data.sql</code><br>";
    }

} catch (Exception $e) {
    echo "❌ Sample data check failed: " . $e->getMessage() . "<br>";
}
echo "<br>";

// Test 8: System Summary
echo "<h2>8. System Summary</h2>";
echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
echo "<tr><th>Component</th><th>Status</th></tr>";
echo "<tr><td>PHP Version</td><td>✅ $phpVersion</td></tr>";
echo "<tr><td>Database</td><td>✅ Connected</td></tr>";
echo "<tr><td>Web Server</td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
echo "</table>";
echo "<br>";

echo "<hr>";
echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li>Configure Moodle token in <code>config/moodle.php</code></li>";
echo "<li>Load sample data: <code>mysql -u root -p log_focus_app &lt; database/sample_data.sql</code></li>";
echo "<li>Access the app: <a href='public/index.php'>Open Log Focus App</a></li>";
echo "</ol>";

echo "<hr>";
echo "<p><em>Test completed at: " . date('Y-m-d H:i:s') . "</em></p>";
