<?php
/**
 * Moodle Sync API
 * Synchronizes student data from Moodle and runs gap detection
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../moodle-integration/MoodleClient.php';
require_once __DIR__ . '/../moodle-integration/GapDetector.php';
require_once __DIR__ . '/../moodle-integration/DatabaseManager.php';

// Load configuration
$configFile = __DIR__ . '/../moodle-integration/config.php';
if (!file_exists($configFile)) {
    respondError('Configuration file not found', 500);
}

$config = require $configFile;

// Check if sync is enabled
if (!$config['sync']['enabled']) {
    respondError('Sync is disabled', 503);
}

// Authenticate request
if ($config['api']['auth_required']) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $apiKey = str_replace('Bearer ', '', $authHeader);

    if ($apiKey !== $config['api']['api_key']) {
        respondError('Unauthorized', 401);
    }
}

// Initialize services
try {
    $dbManager = new DatabaseManager($config['database']);
    $db = $dbManager->getConnection();
    $moodleClient = new MoodleClient($config['moodle']);
    $gapDetector = new GapDetector($config, $moodleClient, $db);
    $logger = new Logger($config['logging'] ?? []);
} catch (Exception $e) {
    respondError('Service initialization failed: ' . $e->getMessage(), 500);
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    respondError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['course_id'])) {
    respondError('course_id is required', 400);
}

$courseId = $input['course_id'];
$syncType = $input['sync_type'] ?? 'manual';
$batchSize = $input['batch_size'] ?? $config['sync']['batch_size'];

// Create sync log entry
try {
    $stmt = $db->prepare('
        INSERT INTO sync_log (course_id, sync_type, status, start_time)
        VALUES (?, ?, "running", NOW())
    ');
    $stmt->execute([$courseId, $syncType]);
    $syncId = $db->lastInsertId();

    $logger->info("Started sync job $syncId for course $courseId");
} catch (PDOException $e) {
    respondError('Failed to create sync log: ' . $e->getMessage(), 500);
}

// Execute sync
try {
    // Get enrolled students
    $students = $moodleClient->getCourseStudents($courseId);
    $studentIds = array_column($students, 'id');

    $logger->info("Found " . count($studentIds) . " students in course $courseId");

    // Load concept map
    $conceptMap = [];
    $stmt = $db->prepare('SELECT concept_name, keywords FROM concept_map WHERE course_id = ?');
    $stmt->execute([$courseId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as $row) {
        $conceptMap[$row['concept_name']] = json_decode($row['keywords'], true);
    }

    if (empty($conceptMap)) {
        $logger->warning("No concept map found for course $courseId, using default");

        // Use default concept map from config
        $conceptMap = array_map(function($concept) {
            return [$concept];
        }, array_keys($config['gap_detection']['prerequisites']));
    }

    // Batch analyze students
    $batches = array_chunk($studentIds, $batchSize);
    $totalAnalyzed = 0;
    $totalGaps = 0;
    $totalErrors = 0;

    foreach ($batches as $batchIndex => $batch) {
        $logger->info("Processing batch " . ($batchIndex + 1) . "/" . count($batches));

        $results = $gapDetector->batchAnalyze($courseId, $batch, $conceptMap);

        $totalAnalyzed += $results['analyzed'];
        $totalGaps += $results['gaps_detected'];
        $totalErrors += $results['errors'];

        // Update sync log
        $stmt = $db->prepare('
            UPDATE sync_log
            SET students_analyzed = ?, gaps_detected = ?, errors = ?
            WHERE id = ?
        ');
        $stmt->execute([$totalAnalyzed, $totalGaps, $totalErrors, $syncId]);
    }

    // Mark sync as completed
    $stmt = $db->prepare('
        UPDATE sync_log
        SET status = "completed", end_time = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$syncId]);

    $logger->info("Completed sync job $syncId");

    respond([
        'success' => true,
        'sync_id' => $syncId,
        'course_id' => $courseId,
        'students_analyzed' => $totalAnalyzed,
        'gaps_detected' => $totalGaps,
        'errors' => $totalErrors,
        'sync_type' => $syncType,
    ]);

} catch (Exception $e) {
    // Mark sync as failed
    try {
        $stmt = $db->prepare('
            UPDATE sync_log
            SET status = "failed", end_time = NOW(), error_message = ?
            WHERE id = ?
        ');
        $stmt->execute([$e->getMessage(), $syncId]);
    } catch (PDOException $dbError) {
        $logger->error("Failed to update sync log: " . $dbError->getMessage());
    }

    $logger->error("Sync job $syncId failed: " . $e->getMessage());

    respondError('Sync failed: ' . $e->getMessage(), 500);
}

/**
 * Send JSON response
 */
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function respondError($message, $code = 400) {
    respond(['error' => $message], $code);
}
