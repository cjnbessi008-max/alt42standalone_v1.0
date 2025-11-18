#!/usr/bin/env php
<?php
/**
 * Scheduled Sync Script
 * Run this script via cron to periodically sync Moodle data
 *
 * Example crontab entry (run every hour):
 * 0 * * * * /usr/bin/php /path/to/sync_scheduler.php
 */

require_once __DIR__ . '/../moodle-integration/MoodleClient.php';
require_once __DIR__ . '/../moodle-integration/GapDetector.php';
require_once __DIR__ . '/../moodle-integration/DatabaseManager.php';

// Load configuration
$configFile = __DIR__ . '/../moodle-integration/config.php';
if (!file_exists($configFile)) {
    fwrite(STDERR, "Configuration file not found\n");
    exit(1);
}

$config = require $configFile;

// Check if sync is enabled
if (!$config['sync']['enabled']) {
    echo "Sync is disabled in configuration\n";
    exit(0);
}

// Initialize services
try {
    $dbManager = new DatabaseManager($config['database']);
    $db = $dbManager->getConnection();
    $moodleClient = new MoodleClient($config['moodle']);
    $gapDetector = new GapDetector($config, $moodleClient, $db);
    $logger = new Logger($config['logging'] ?? []);
} catch (Exception $e) {
    fwrite(STDERR, "Service initialization failed: {$e->getMessage()}\n");
    exit(1);
}

echo "=== Moodle Gap Detection Sync Scheduler ===\n";
echo "Started at: " . date('Y-m-d H:i:s') . "\n\n";

// Get list of courses to sync
// Option 1: Sync all courses (you can modify this logic)
// Option 2: Get courses from database or config
// For this example, we'll check for courses that need syncing based on last sync time

try {
    // Get courses that haven't been synced recently
    $intervalMinutes = $config['sync']['interval_minutes'];

    $stmt = $db->query("
        SELECT DISTINCT course_id
        FROM concept_map
        WHERE course_id NOT IN (
            SELECT course_id
            FROM sync_log
            WHERE status = 'completed'
            AND start_time > DATE_SUB(NOW(), INTERVAL $intervalMinutes MINUTE)
        )
    ");

    $courses = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($courses)) {
        echo "No courses need syncing at this time\n";
        exit(0);
    }

    echo "Found " . count($courses) . " courses to sync\n\n";

    $totalResults = [
        'courses_synced' => 0,
        'total_students' => 0,
        'total_gaps' => 0,
        'total_errors' => 0,
    ];

    foreach ($courses as $courseId) {
        echo "Syncing course $courseId...\n";

        // Create sync log entry
        $stmt = $db->prepare('
            INSERT INTO sync_log (course_id, sync_type, status, start_time)
            VALUES (?, "scheduled", "running", NOW())
        ');
        $stmt->execute([$courseId]);
        $syncId = $db->lastInsertId();

        try {
            // Get enrolled students
            $students = $moodleClient->getCourseStudents($courseId);
            $studentIds = array_column($students, 'id');

            echo "  Found " . count($studentIds) . " students\n";

            // Load concept map
            $conceptMap = [];
            $stmt = $db->prepare('SELECT concept_name, keywords FROM concept_map WHERE course_id = ?');
            $stmt->execute([$courseId]);
            $rows = $stmt->fetchAll();

            foreach ($rows as $row) {
                $conceptMap[$row['concept_name']] = json_decode($row['keywords'], true);
            }

            if (empty($conceptMap)) {
                echo "  Warning: No concept map found, using default\n";

                // Use default concept map
                $conceptMap = array_map(function($concept) {
                    return [$concept];
                }, array_keys($config['gap_detection']['prerequisites']));
            }

            // Batch analyze
            $batchSize = $config['sync']['batch_size'];
            $results = $gapDetector->batchAnalyze($courseId, $studentIds, $conceptMap);

            // Update sync log
            $stmt = $db->prepare('
                UPDATE sync_log
                SET status = "completed",
                    end_time = NOW(),
                    students_analyzed = ?,
                    gaps_detected = ?,
                    errors = ?
                WHERE id = ?
            ');
            $stmt->execute([
                $results['analyzed'],
                $results['gaps_detected'],
                $results['errors'],
                $syncId
            ]);

            echo "  Analyzed: {$results['analyzed']}, Gaps: {$results['gaps_detected']}, Errors: {$results['errors']}\n";

            $totalResults['courses_synced']++;
            $totalResults['total_students'] += $results['analyzed'];
            $totalResults['total_gaps'] += $results['gaps_detected'];
            $totalResults['total_errors'] += $results['errors'];

        } catch (Exception $e) {
            // Mark sync as failed
            $stmt = $db->prepare('
                UPDATE sync_log
                SET status = "failed", end_time = NOW(), error_message = ?
                WHERE id = ?
            ');
            $stmt->execute([$e->getMessage(), $syncId]);

            echo "  Error: {$e->getMessage()}\n";
            $totalResults['total_errors']++;
        }

        echo "\n";
    }

    echo "=== Sync Complete ===\n";
    echo "Courses synced: {$totalResults['courses_synced']}\n";
    echo "Students analyzed: {$totalResults['total_students']}\n";
    echo "Gaps detected: {$totalResults['total_gaps']}\n";
    echo "Errors: {$totalResults['total_errors']}\n";
    echo "Completed at: " . date('Y-m-d H:i:s') . "\n";

} catch (Exception $e) {
    fwrite(STDERR, "Scheduler error: {$e->getMessage()}\n");
    exit(1);
}
