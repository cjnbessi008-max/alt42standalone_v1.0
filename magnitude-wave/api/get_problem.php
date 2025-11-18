<?php
/**
 * Get Problem API
 * Moodle에서 문제 정보를 가져오는 API
 */

require_once(__DIR__ . '/../config.php');

// CORS 헤더는 config.php에서 처리됨

try {
    // 문제 ID 가져오기
    $problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

    if (!$problemId) {
        throw new Exception('문제 ID가 제공되지 않았습니다.');
    }

    logDebug("Fetching problem with ID: {$problemId}");

    // 데이터베이스 연결
    $db = getDbConnection();

    if (!$db) {
        throw new Exception('데이터베이스 연결에 실패했습니다.');
    }

    if (defined('STANDALONE_MODE') && STANDALONE_MODE) {
        // 독립 모드: 로컬 데이터베이스에서 가져오기
        $problem = getProblemFromLocalDb($db, $problemId);
    } else {
        // Moodle 모드: Moodle 데이터베이스에서 가져오기
        $problem = getProblemFromMoodle($db, $problemId);
    }

    if (!$problem) {
        throw new Exception('문제를 찾을 수 없습니다.');
    }

    // 성공 응답
    sendJsonResponse([
        'success' => true,
        'problem' => $problem,
        'timestamp' => date('c')
    ]);

} catch (Exception $e) {
    logError($e->getMessage());

    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 400);
}

/**
 * 로컬 데이터베이스에서 문제 가져오기
 */
function getProblemFromLocalDb($db, $problemId) {
    try {
        $stmt = $db->prepare("
            SELECT
                id,
                title,
                description,
                question_text,
                vector_data,
                hints,
                difficulty,
                created_at,
                updated_at
            FROM problems
            WHERE id = :id AND is_active = 1
        ");

        $stmt->execute(['id' => $problemId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        // 벡터 데이터 파싱 (JSON 형식으로 저장되어 있다고 가정)
        $vectors = [];
        if (!empty($row['vector_data'])) {
            $vectors = json_decode($row['vector_data'], true);
        }

        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'question_text' => $row['question_text'],
            'vectors' => $vectors,
            'hints' => $row['hints'],
            'difficulty' => $row['difficulty'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];

    } catch (PDOException $e) {
        logError("Database query error: " . $e->getMessage());
        return null;
    }
}

/**
 * Moodle 데이터베이스에서 문제 가져오기
 */
function getProblemFromMoodle($db, $problemId) {
    global $DB;

    try {
        // Moodle의 question 테이블에서 가져오기
        $question = $DB->get_record('question', ['id' => $problemId]);

        if (!$question) {
            return null;
        }

        // 벡터 데이터는 question의 custom field나 question_answers에서 가져올 수 있음
        // 여기서는 예시로 questiontext에서 파싱
        $vectors = parseVectorsFromQuestionText($question->questiontext);

        return [
            'id' => $question->id,
            'title' => $question->name,
            'description' => strip_tags($question->questiontext),
            'question_text' => $question->questiontext,
            'vectors' => $vectors,
            'hints' => $question->generalfeedback ?? '',
            'difficulty' => 'medium', // 기본값
            'created_at' => date('c', $question->timecreated),
            'updated_at' => date('c', $question->timemodified)
        ];

    } catch (Exception $e) {
        logError("Moodle query error: " . $e->getMessage());
        return null;
    }
}

/**
 * 문제 텍스트에서 벡터 데이터 파싱
 * 예: "벡터 v = (3, 4, 0)" 형식을 찾아서 파싱
 */
function parseVectorsFromQuestionText($text) {
    $vectors = [];

    // 정규표현식으로 벡터 찾기: (숫자, 숫자, 숫자) 형식
    preg_match_all('/\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?))?\)/', $text, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        $vectors[] = [
            'x' => floatval($match[1]),
            'y' => floatval($match[2]),
            'z' => isset($match[3]) ? floatval($match[3]) : 0
        ];
    }

    return $vectors;
}
