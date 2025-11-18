<?php
/**
 * Cron Job - Moodle Sync and Detection
 * Moodle 동기화 및 과신 오류 탐지 크론 작업
 *
 * 사용법:
 * */10 * * * * php /path/to/cron/sync.php
 */

require_once __DIR__ . '/../src/autoload.php';

use OverconfidenceDetector\Services\MoodleSync;
use OverconfidenceDetector\Services\DetectionEngine;
use OverconfidenceDetector\Utils\Logger;

// CLI에서만 실행 허용
if (php_sapi_name() !== 'cli') {
    die('This script can only be run from the command line.');
}

echo "=================================================\n";
echo "Overconfidence Detection - Sync & Analysis\n";
echo "Started at: " . date('Y-m-d H:i:s') . "\n";
echo "=================================================\n\n";

try {
    // 1. Moodle 데이터 동기화
    echo "[1/2] Syncing data from Moodle...\n";
    $syncService = new MoodleSync();
    $syncResults = $syncService->syncAll();

    echo "  ✓ Quizzes synced: " . $syncResults['quizzes'] . "\n";
    echo "  ✓ Students synced: " . $syncResults['students'] . "\n";
    echo "  ✓ Questions synced: " . $syncResults['questions'] . "\n";
    echo "  ✓ Attempts synced: " . $syncResults['attempts'] . "\n";
    echo "\n";

    // 2. 과신 오류 탐지 실행
    echo "[2/2] Running overconfidence detection...\n";
    $detectionEngine = new DetectionEngine();
    $flagCount = $detectionEngine->analyzeAll();

    echo "  ✓ New flags created: " . $flagCount . "\n";
    echo "\n";

    // 완료
    echo "=================================================\n";
    echo "Completed successfully at: " . date('Y-m-d H:i:s') . "\n";
    echo "=================================================\n";

    Logger::info("Cron job completed successfully", [
        'sync_results' => $syncResults,
        'flags_created' => $flagCount
    ]);

    exit(0);

} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";

    Logger::error("Cron job failed: " . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
    ]);

    exit(1);
}
