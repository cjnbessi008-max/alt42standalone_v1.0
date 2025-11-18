<?php
/**
 * System Connection Test
 * Tests database and Moodle connectivity
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Cognitive Recovery System - Connection Test</h1>";
echo "<hr>";

// Test 1: PHP Version
echo "<h2>1. PHP Version Check</h2>";
$phpVersion = phpversion();
$requiredVersion = '7.1.9';
echo "Current PHP Version: <strong>$phpVersion</strong><br>";
if (version_compare($phpVersion, $requiredVersion, '>=')) {
    echo "<span style='color: green;'>✓ PHP version is compatible</span><br>";
} else {
    echo "<span style='color: red;'>✗ PHP version $requiredVersion or higher is required</span><br>";
}
echo "<br>";

// Test 2: PHP Extensions
echo "<h2>2. Required PHP Extensions</h2>";
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<span style='color: green;'>✓ $ext</span><br>";
    } else {
        echo "<span style='color: red;'>✗ $ext (NOT INSTALLED)</span><br>";
    }
}
echo "<br>";

// Test 3: Database Connection
echo "<h2>3. Database Connection</h2>";
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();

    // Load config if exists
    $configFile = __DIR__ . '/../config.ini';
    if (file_exists($configFile)) {
        $db->loadConfig($configFile);
        echo "Config file loaded: <strong>$configFile</strong><br>";
    } else {
        echo "<span style='color: orange;'>⚠ Config file not found. Using default settings.</span><br>";
        echo "Copy config.sample.ini to config.ini and configure it.<br>";
    }

    $conn = $db->getConnection();

    if ($conn) {
        echo "<span style='color: green;'>✓ Database connection successful</span><br>";

        // Test query
        $stmt = $conn->query("SELECT COUNT(*) as table_count FROM information_schema.tables
                              WHERE table_schema = DATABASE()");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Tables in database: <strong>{$result['table_count']}</strong><br>";

        // Check required tables
        $requiredTables = [
            'users',
            'activity_sessions',
            'activity_events',
            'cognitive_recovery_periods',
            'activity_metrics',
            'system_config'
        ];

        echo "<br><strong>Required Tables:</strong><br>";
        foreach ($requiredTables as $table) {
            $stmt = $conn->prepare("SHOW TABLES LIKE :table");
            $stmt->execute([':table' => $table]);
            if ($stmt->rowCount() > 0) {
                echo "<span style='color: green;'>✓ $table</span><br>";
            } else {
                echo "<span style='color: red;'>✗ $table (NOT FOUND)</span><br>";
            }
        }
    } else {
        echo "<span style='color: red;'>✗ Database connection failed</span><br>";
        echo "Please check database configuration in config.ini<br>";
    }
} catch (Exception $e) {
    echo "<span style='color: red;'>✗ Database Error: " . htmlspecialchars($e->getMessage()) . "</span><br>";
}
echo "<br>";

// Test 4: Moodle Integration
echo "<h2>4. Moodle Integration</h2>";
require_once __DIR__ . '/lib/MoodleIntegration.php';

try {
    $moodle = new MoodleIntegration();

    // Check if config exists
    if (file_exists($configFile)) {
        $config = parse_ini_file($configFile, true);
        $moodleUrl = $config['moodle']['moodle_url'] ?? '';
        $moodleToken = $config['moodle']['moodle_token'] ?? '';

        if (empty($moodleUrl) || empty($moodleToken)) {
            echo "<span style='color: orange;'>⚠ Moodle not configured</span><br>";
            echo "Set moodle_url and moodle_token in config.ini to enable Moodle integration.<br>";
        } else {
            echo "Moodle URL: <strong>$moodleUrl</strong><br>";
            echo "Token configured: <strong>" . substr($moodleToken, 0, 10) . "...</strong><br>";

            // Test connection
            echo "<br>Testing connection...<br>";
            if ($moodle->testConnection()) {
                echo "<span style='color: green;'>✓ Moodle connection successful</span><br>";

                $siteInfo = $moodle->getSiteInfo();
                if ($siteInfo) {
                    echo "<br><strong>Moodle Site Info:</strong><br>";
                    echo "Site Name: {$siteInfo['sitename']}<br>";
                    echo "Moodle Version: {$siteInfo['release']}<br>";
                    echo "Site URL: {$siteInfo['siteurl']}<br>";
                }
            } else {
                echo "<span style='color: red;'>✗ Moodle connection failed</span><br>";
                echo "Please check:<br>";
                echo "- Moodle URL is correct<br>";
                echo "- Web service token is valid<br>";
                echo "- Web services are enabled in Moodle<br>";
                echo "- REST protocol is enabled<br>";
            }
        }
    } else {
        echo "<span style='color: orange;'>⚠ Config file not found</span><br>";
        echo "Moodle integration requires config.ini file.<br>";
    }
} catch (Exception $e) {
    echo "<span style='color: red;'>✗ Moodle Error: " . htmlspecialchars($e->getMessage()) . "</span><br>";
}
echo "<br>";

// Test 5: File Permissions
echo "<h2>5. File Permissions</h2>";
$baseDir = dirname(__DIR__);
$checkPaths = [
    'backend/api' => true,  // should be writable for logs
    'frontend/js' => false,  // should be readable
    'frontend/css' => false, // should be readable
    'config.ini' => false    // should be readable (but protected by htaccess)
];

foreach ($checkPaths as $path => $shouldBeWritable) {
    $fullPath = $baseDir . '/' . $path;

    if (file_exists($fullPath)) {
        $readable = is_readable($fullPath);
        $writable = is_writable($fullPath);

        echo "$path: ";

        if ($readable) {
            echo "<span style='color: green;'>Readable</span> ";
        } else {
            echo "<span style='color: red;'>Not Readable</span> ";
        }

        if ($shouldBeWritable) {
            if ($writable) {
                echo "<span style='color: green;'>Writable</span>";
            } else {
                echo "<span style='color: orange;'>Not Writable (may need for logs)</span>";
            }
        }

        echo "<br>";
    } else {
        echo "<span style='color: orange;'>⚠ $path not found</span><br>";
    }
}
echo "<br>";

// Test 6: API Endpoints
echo "<h2>6. API Endpoints</h2>";
$apiEndpoints = [
    'backend/api/track.php',
    'backend/api/dashboard.php'
];

foreach ($apiEndpoints as $endpoint) {
    $fullPath = $baseDir . '/' . $endpoint;
    if (file_exists($fullPath)) {
        echo "<span style='color: green;'>✓ $endpoint</span><br>";
    } else {
        echo "<span style='color: red;'>✗ $endpoint (NOT FOUND)</span><br>";
    }
}
echo "<br>";

// Summary
echo "<hr>";
echo "<h2>Summary</h2>";
echo "If all tests passed, your system is ready to use!<br><br>";
echo "Next steps:<br>";
echo "1. Visit <a href='../frontend/index.html'>Dashboard</a> to start using the system<br>";
echo "2. Configure Moodle integration if needed<br>";
echo "3. Review the <a href='../README.md'>README</a> for usage instructions<br>";
echo "<br>";
echo "<p style='color: #666; font-size: 12px;'>Test completed at: " . date('Y-m-d H:i:s') . "</p>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 900px;
    margin: 50px auto;
    padding: 20px;
    background: #f5f5f5;
}
h1 {
    color: #333;
    border-bottom: 3px solid #4A90E2;
    padding-bottom: 10px;
}
h2 {
    color: #555;
    margin-top: 20px;
    border-left: 4px solid #4A90E2;
    padding-left: 10px;
}
hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 30px 0;
}
</style>
