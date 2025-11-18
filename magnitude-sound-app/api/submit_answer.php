<?php
/**
 * Magnitude Sound - 답안 제출 API
 *
 * 학생의 벡터 답안을 받아 Moodle에 저장하고,
 * 벡터의 크기/방향을 계산하여 반환합니다.
 *
 * @package    magnitude-sound-app
 * @copyright  2025
 * @license    MIT
 */

require_once 'config.php';

// POST 메서드만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Only POST method is allowed', 405);
}

// JSON 입력 파싱
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendErrorResponse('Invalid JSON input');
}

// 필수 파라미터 검증
$requiredFields = ['question_id', 'user_id', 'vector_x', 'vector_y'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        sendErrorResponse("Missing required field: $field");
    }
}

$questionId = intval($input['question_id']);
$userId = intval($input['user_id']);
$vectorX = floatval($input['vector_x']);
$vectorY = floatval($input['vector_y']);
$attemptId = isset($input['attempt_id']) ? intval($input['attempt_id']) : null;

// 벡터 계산
$magnitude = calculateMagnitude($vectorX, $vectorY);
$direction = calculateDirection($vectorX, $vectorY);
$directionDegrees = rad2deg($direction);

// 정규화된 각도 (0-360)
if ($directionDegrees < 0) {
    $directionDegrees += 360;
}

$conn = getDbConnection();
if (!$conn) {
    sendErrorResponse('Database connection failed', 500);
}

// 답안 기록 저장 (커스텀 테이블 사용)
// 참고: 실제 Moodle question_attempts 테이블에 저장하려면 Moodle API 사용 필요
$tableName = MOODLE_DB_PREFIX . 'magnitude_sound_answers';

// 테이블이 없으면 생성 (초기 설정)
$createTableSQL = "
CREATE TABLE IF NOT EXISTS $tableName (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    attempt_id INT NULL,
    vector_x DECIMAL(10, 4) NOT NULL,
    vector_y DECIMAL(10, 4) NOT NULL,
    magnitude DECIMAL(10, 4) NOT NULL,
    direction_rad DECIMAL(10, 6) NOT NULL,
    direction_deg DECIMAL(10, 4) NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    score DECIMAL(5, 2) NULL,
    time_submitted INT NOT NULL,
    INDEX idx_question (question_id),
    INDEX idx_user (user_id),
    INDEX idx_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if (!$conn->query($createTableSQL)) {
    error_log("Table creation failed: " . $conn->error);
}

// 답안 삽입
$stmt = $conn->prepare("
    INSERT INTO $tableName
    (question_id, user_id, attempt_id, vector_x, vector_y, magnitude, direction_rad, direction_deg, time_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$timestamp = time();
$stmt->bind_param(
    'iiidddddi',
    $questionId,
    $userId,
    $attemptId,
    $vectorX,
    $vectorY,
    $magnitude,
    $direction,
    $directionDegrees,
    $timestamp
);

if ($stmt->execute()) {
    $answerId = $stmt->insert_id;

    sendSuccessResponse([
        'answer_id' => $answerId,
        'vector' => [
            'x' => $vectorX,
            'y' => $vectorY
        ],
        'calculated' => [
            'magnitude' => round($magnitude, 4),
            'direction_radians' => round($direction, 6),
            'direction_degrees' => round($directionDegrees, 2)
        ],
        'sound_params' => generateSoundParameters($magnitude, $directionDegrees),
        'timestamp' => $timestamp
    ]);
} else {
    sendErrorResponse('Failed to save answer: ' . $stmt->error, 500);
}

$stmt->close();
$conn->close();

/**
 * 벡터 크기 계산
 *
 * @param float $x X 좌표
 * @param float $y Y 좌표
 * @return float 크기 (magnitude)
 */
function calculateMagnitude($x, $y) {
    return sqrt($x * $x + $y * $y);
}

/**
 * 벡터 방향 계산 (라디안)
 *
 * @param float $x X 좌표
 * @param float $y Y 좌표
 * @return float 각도 (radians)
 */
function calculateDirection($x, $y) {
    return atan2($y, $x);
}

/**
 * 크기/방향을 음악 파라미터로 변환
 *
 * @param float $magnitude 벡터 크기
 * @param float $degrees 각도 (degrees)
 * @return array 사운드 파라미터
 */
function generateSoundParameters($magnitude, $degrees) {
    // 크기 -> 음량 (0~1)
    // 최대 크기를 10으로 가정
    $maxMagnitude = 10;
    $volume = min(1.0, $magnitude / $maxMagnitude);

    // 크기 -> 주파수 (Hz)
    // 220Hz (A3) ~ 880Hz (A5) 범위로 매핑
    $minFreq = 220;
    $maxFreq = 880;
    $frequency = $minFreq + ($maxFreq - $minFreq) * ($magnitude / $maxMagnitude);

    // 방향 -> 패닝 (stereo)
    // 0° = 중앙, -90° = 왼쪽, 90° = 오른쪽
    // -1 (left) ~ 1 (right)
    $normalizedAngle = $degrees;
    if ($normalizedAngle > 180) {
        $normalizedAngle -= 360;
    }
    $pan = max(-1, min(1, $normalizedAngle / 90));

    // 방향 -> 악기 선택 (8방향)
    $octant = floor($degrees / 45) % 8;
    $instruments = [
        'sine',      // 0° - 북
        'triangle',  // 45° - 북동
        'square',    // 90° - 동
        'sawtooth',  // 135° - 남동
        'sine',      // 180° - 남
        'triangle',  // 225° - 남서
        'square',    // 270° - 서
        'sawtooth'   // 315° - 북서
    ];
    $waveform = $instruments[$octant];

    return [
        'volume' => round($volume, 3),
        'frequency' => round($frequency, 2),
        'pan' => round($pan, 3),
        'waveform' => $waveform,
        'octant' => $octant,
        'duration' => 1.0  // 1초 재생
    ];
}
