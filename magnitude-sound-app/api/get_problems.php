<?php
/**
 * Magnitude Sound - 문제 정보 조회 API
 *
 * Moodle quiz 또는 question 데이터에서 벡터 문제 정보를 가져옵니다.
 *
 * @package    magnitude-sound-app
 * @copyright  2025
 * @license    MIT
 */

require_once 'config.php';

// GET 메서드만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Only GET method is allowed', 405);
}

// 파라미터 처리
$courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
$questionId = isset($_GET['question_id']) ? intval($_GET['question_id']) : null;

$conn = getDbConnection();
if (!$conn) {
    sendErrorResponse('Database connection failed', 500);
}

/**
 * 특정 문제 조회
 */
if ($questionId) {
    $stmt = $conn->prepare("
        SELECT
            q.id,
            q.name,
            q.questiontext,
            q.qtype,
            q.defaultmark,
            qc.name as category,
            q.createdby,
            q.timecreated,
            q.timemodified
        FROM " . MOODLE_DB_PREFIX . "question q
        LEFT JOIN " . MOODLE_DB_PREFIX . "question_categories qc ON q.category = qc.id
        WHERE q.id = ?
    ");

    $stmt->bind_param('i', $questionId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // 벡터 관련 문제인지 확인하고 추가 정보 파싱
        $problemData = parseProblemData($row);
        sendSuccessResponse($problemData);
    } else {
        sendErrorResponse('Question not found', 404);
    }
}

/**
 * Quiz의 모든 문제 조회
 */
if ($quizId) {
    $stmt = $conn->prepare("
        SELECT
            q.id,
            q.name,
            q.questiontext,
            q.qtype,
            q.defaultmark,
            qc.name as category,
            qs.slot,
            qs.page
        FROM " . MOODLE_DB_PREFIX . "quiz_slots qs
        JOIN " . MOODLE_DB_PREFIX . "question q ON qs.questionid = q.id
        LEFT JOIN " . MOODLE_DB_PREFIX . "question_categories qc ON q.category = qc.id
        WHERE qs.quizid = ?
        ORDER BY qs.slot
    ");

    $stmt->bind_param('i', $quizId);
    $stmt->execute();
    $result = $stmt->get_result();

    $problems = [];
    while ($row = $result->fetch_assoc()) {
        $problems[] = parseProblemData($row);
    }

    sendSuccessResponse([
        'quiz_id' => $quizId,
        'total_questions' => count($problems),
        'questions' => $problems
    ]);
}

/**
 * 코스의 모든 벡터 관련 문제 조회
 */
if ($courseId) {
    $stmt = $conn->prepare("
        SELECT
            q.id,
            q.name,
            q.questiontext,
            q.qtype,
            q.defaultmark,
            qc.name as category,
            qc.contextid
        FROM " . MOODLE_DB_PREFIX . "question q
        JOIN " . MOODLE_DB_PREFIX . "question_categories qc ON q.category = qc.id
        JOIN " . MOODLE_DB_PREFIX . "context ctx ON qc.contextid = ctx.id
        WHERE ctx.instanceid = ?
        AND ctx.contextlevel = 50
        AND (
            LOWER(q.name) LIKE '%vector%'
            OR LOWER(q.questiontext) LIKE '%벡터%'
            OR LOWER(q.questiontext) LIKE '%magnitude%'
        )
        ORDER BY q.timecreated DESC
        LIMIT 50
    ");

    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $result = $stmt->get_result();

    $problems = [];
    while ($row = $result->fetch_assoc()) {
        $problems[] = parseProblemData($row);
    }

    sendSuccessResponse([
        'course_id' => $courseId,
        'total_questions' => count($problems),
        'questions' => $problems
    ]);
}

// 파라미터 없으면 에러
sendErrorResponse('Missing required parameters: course_id, quiz_id, or question_id');

/**
 * 문제 데이터 파싱 및 벡터 정보 추출
 *
 * @param array $row DB 결과 행
 * @return array 파싱된 문제 데이터
 */
function parseProblemData($row) {
    // HTML 태그 제거
    $cleanText = strip_tags($row['questiontext']);

    // 벡터 정보 추출 시도 (정규표현식)
    $vectorInfo = extractVectorInfo($cleanText);

    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'question_text' => $row['questiontext'],
        'clean_text' => $cleanText,
        'type' => $row['qtype'],
        'category' => $row['category'] ?? 'Unknown',
        'max_mark' => floatval($row['defaultmark']),
        'vector_info' => $vectorInfo,
        'slot' => $row['slot'] ?? null,
        'created_at' => $row['timecreated'] ?? null
    ];
}

/**
 * 텍스트에서 벡터 정보 추출
 *
 * @param string $text 문제 텍스트
 * @return array 추출된 벡터 정보
 */
function extractVectorInfo($text) {
    $info = [
        'has_vector' => false,
        'coordinates' => null,
        'magnitude_range' => null,
        'angle_range' => null
    ];

    // 좌표 패턴: (x, y) 또는 [x, y]
    if (preg_match('/[\(\[]([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)[\)\]]/u', $text, $matches)) {
        $info['has_vector'] = true;
        $info['coordinates'] = [
            'x' => floatval($matches[1]),
            'y' => floatval($matches[2])
        ];
    }

    // 크기 범위 추출: "0~10", "0에서 10", "최대 10"
    if (preg_match('/(?:크기|magnitude).*?(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)/ui', $text, $matches)) {
        $info['magnitude_range'] = [
            'min' => floatval($matches[1]),
            'max' => floatval($matches[2])
        ];
    } elseif (preg_match('/(?:최대|maximum).*?(\d+(?:\.\d+)?)/ui', $text, $matches)) {
        $info['magnitude_range'] = [
            'min' => 0,
            'max' => floatval($matches[1])
        ];
    }

    // 각도 범위 추출: "0° ~ 360°"
    if (preg_match('/(?:각도|angle).*?(\d+(?:\.\d+)?)\s*[°도]?\s*~\s*(\d+(?:\.\d+)?)\s*[°도]?/ui', $text, $matches)) {
        $info['angle_range'] = [
            'min' => floatval($matches[1]),
            'max' => floatval($matches[2])
        ];
    }

    return $info;
}

$conn->close();
