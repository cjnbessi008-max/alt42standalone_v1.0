<?php
/**
 * Moodle에서 문제 데이터 가져오기
 * GET /php/get_problem.php?problemId=123
 */

require_once 'config.php';

// GET 요청 확인
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Invalid request method', 405);
}

// 파라미터 확인
$problemId = isset($_GET['problemId']) ? intval($_GET['problemId']) : 0;
$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;

if ($problemId <= 0) {
    sendErrorResponse('Invalid problem ID');
}

// 데이터베이스 연결
$db = getDBConnection();
if (!$db) {
    sendErrorResponse('Database connection failed', 500);
}

try {
    // 문제 데이터 조회
    // 주의: 실제 Moodle 데이터베이스 스키마에 맞게 수정 필요
    $stmt = $db->prepare("
        SELECT
            q.id,
            q.name,
            q.questiontext,
            q.category,
            qa.id as attempt_id,
            qa.timestart,
            qa.timefinish
        FROM " . MOODLE_TABLE_PREFIX . "question q
        LEFT JOIN " . MOODLE_TABLE_PREFIX . "question_attempts qa
            ON q.id = qa.questionid AND qa.userid = :userId
        WHERE q.id = :problemId
        LIMIT 1
    ");

    $stmt->execute([
        ':problemId' => $problemId,
        ':userId' => $userId
    ]);

    $problem = $stmt->fetch();

    if (!$problem) {
        sendErrorResponse('Problem not found', 404);
    }

    // 문제 텍스트에서 집합 데이터 추출
    // 예: questiontext에 JSON 형태로 저장된 경우
    $questionData = parseQuestionText($problem['questiontext']);

    // 응답 데이터 구성
    $response = [
        'success' => true,
        'problem' => [
            'id' => $problem['id'],
            'name' => $problem['name'],
            'setA' => $questionData['setA'] ?? [],
            'setB' => $questionData['setB'] ?? [],
            'category' => $problem['category'],
            'attempted' => !empty($problem['attempt_id']),
            'timestart' => $problem['timestart'],
            'timefinish' => $problem['timefinish']
        ],
        'timestamp' => date('c')
    ];

    sendJsonResponse($response);

} catch (PDOException $e) {
    logError('Query error: ' . $e->getMessage());
    sendErrorResponse('Database query failed', 500);
}

/**
 * 문제 텍스트에서 집합 데이터 파싱
 * @param string $questionText
 * @return array
 */
function parseQuestionText($questionText) {
    // JSON 형태로 저장된 경우
    if (preg_match('/\{.*"setA".*"setB".*\}/', $questionText, $matches)) {
        $data = json_decode($matches[0], true);
        if ($data) {
            return $data;
        }
    }

    // 커스텀 포맷으로 저장된 경우
    // 예: "A={1,2,3,4,5} B={3,4,5,6,7}"
    if (preg_match('/A=\{([^}]+)\}.*B=\{([^}]+)\}/', $questionText, $matches)) {
        $setA = array_map('intval', array_map('trim', explode(',', $matches[1])));
        $setB = array_map('intval', array_map('trim', explode(',', $matches[2])));

        return [
            'setA' => $setA,
            'setB' => $setB
        ];
    }

    // 기본값 (샘플 데이터)
    return [
        'setA' => [1, 2, 3, 4, 5, 6, 7],
        'setB' => [4, 5, 6, 7, 8, 9, 10]
    ];
}
?>
