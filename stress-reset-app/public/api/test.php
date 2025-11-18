<?php
/**
 * System Test API
 * Tests database and Moodle connectivity
 */

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

use StressReset\Database;
use StressReset\MoodleClient;

$results = [
    'success' => true,
    'tests' => [],
    'timestamp' => date('Y-m-d H:i:s'),
];

// Test 1: PHP Version
$phpVersion = phpversion();
$results['tests']['php_version'] = [
    'name' => 'PHP Version',
    'status' => version_compare($phpVersion, '7.1.9', '>=') ? 'pass' : 'fail',
    'value' => $phpVersion,
    'required' => '>= 7.1.9',
];

// Test 2: Required Extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl'];
$extensionStatus = [];

foreach ($requiredExtensions as $ext) {
    $loaded = extension_loaded($ext);
    $extensionStatus[$ext] = $loaded ? 'loaded' : 'missing';
    if (!$loaded) {
        $results['success'] = false;
    }
}

$results['tests']['php_extensions'] = [
    'name' => 'PHP Extensions',
    'status' => $results['success'] ? 'pass' : 'fail',
    'extensions' => $extensionStatus,
];

// Test 3: Database Connection
try {
    $db = Database::getInstance();
    $connection = $db->getConnection();

    $results['tests']['database_connection'] = [
        'name' => 'Database Connection',
        'status' => 'pass',
        'message' => 'Connected successfully',
    ];

    // Test database structure
    $tables = $db->fetchAll("SHOW TABLES");
    $tableNames = array_map(function($table) {
        return array_values($table)[0];
    }, $tables);

    $requiredTables = [
        'users',
        'learning_sessions',
        'activity_tracking',
        'stress_scores',
        'reset_events',
        'user_settings',
    ];

    $missingTables = array_diff($requiredTables, $tableNames);

    $results['tests']['database_tables'] = [
        'name' => 'Database Tables',
        'status' => empty($missingTables) ? 'pass' : 'fail',
        'found' => count($tableNames),
        'required' => count($requiredTables),
        'missing' => $missingTables,
    ];

    if (!empty($missingTables)) {
        $results['success'] = false;
    }
} catch (Exception $e) {
    $results['tests']['database_connection'] = [
        'name' => 'Database Connection',
        'status' => 'fail',
        'error' => $e->getMessage(),
    ];
    $results['success'] = false;
}

// Test 4: Moodle Connection
try {
    $moodleClient = new MoodleClient();
    $moodleTest = $moodleClient->testConnection();

    $results['tests']['moodle_connection'] = [
        'name' => 'Moodle Connection',
        'status' => $moodleTest['success'] ? 'pass' : 'fail',
        'site_name' => $moodleTest['site_name'] ?? null,
        'version' => $moodleTest['version'] ?? null,
        'error' => $moodleTest['error'] ?? null,
    ];

    if (!$moodleTest['success']) {
        $results['tests']['moodle_connection']['warning'] = 'Moodle connection failed but system can still function in limited mode';
    }
} catch (Exception $e) {
    $results['tests']['moodle_connection'] = [
        'name' => 'Moodle Connection',
        'status' => 'fail',
        'error' => $e->getMessage(),
        'warning' => 'System can function without Moodle in standalone mode',
    ];
}

// Test 5: File Permissions
$writablePaths = [
    __DIR__ . '/../../config',
];

$permissionResults = [];
foreach ($writablePaths as $path) {
    $permissionResults[$path] = is_writable($path) ? 'writable' : 'not writable';
}

$results['tests']['file_permissions'] = [
    'name' => 'File Permissions',
    'status' => 'info',
    'paths' => $permissionResults,
];

// Test 6: Environment Configuration
$envVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'MOODLE_URL',
    'MOODLE_TOKEN',
];

$envStatus = [];
foreach ($envVars as $var) {
    $value = getenv($var);
    $envStatus[$var] = !empty($value) ? 'set' : 'not set';
}

$results['tests']['environment'] = [
    'name' => 'Environment Variables',
    'status' => 'info',
    'variables' => $envStatus,
];

// Overall Status
$results['overall_status'] = $results['success'] ? 'All critical tests passed' : 'Some tests failed';

echo json_encode($results, JSON_PRETTY_PRINT);
