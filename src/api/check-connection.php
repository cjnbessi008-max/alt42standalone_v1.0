<?php
/**
 * Moodle 연결 상태 확인 API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

try {
    $database = getDatabase();
    $conn = $database->getConnection();

    if ($conn !== null) {
        // Moodle 버전 확인 (선택적)
        $stmt = $conn->query("SELECT value FROM mdl_config WHERE name = 'version'");
        $version = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'Moodle 연결 성공',
            'moodleVersion' => $version ? $version['value'] : 'unknown',
            'timestamp' => time()
        ]);
    } else {
        throw new Exception('데이터베이스 연결 실패');
    }
} catch(Exception $e) {
    error_log("Connection check error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => '연결 실패: ' . $e->getMessage(),
        'timestamp' => time()
    ]);
}
?>
