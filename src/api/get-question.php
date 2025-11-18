<?php
/**
 * Moodle에서 Inclusion Gate 문제 가져오기 API
 *
 * Moodle의 quiz 문제 중에서 Inclusion Gate 유형의 문제를 가져옵니다.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

try {
    $database = getDatabase();
    $conn = $database->getConnection();

    if ($conn === null) {
        throw new Exception('데이터베이스 연결 실패');
    }

    // 문제 ID (선택적 파라미터)
    $questionId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($questionId !== null) {
        // 특정 문제 가져오기
        $question = getQuestionById($conn, $questionId);
    } else {
        // 랜덤 문제 가져오기
        $question = getRandomQuestion($conn);
    }

    if ($question !== null) {
        echo json_encode([
            'success' => true,
            'question' => $question,
            'timestamp' => time()
        ]);
    } else {
        throw new Exception('문제를 찾을 수 없습니다');
    }

} catch(Exception $e) {
    error_log("Get question error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => time()
    ]);
}

/**
 * ID로 문제 가져오기
 */
function getQuestionById($conn, $questionId) {
    try {
        // Moodle의 question 테이블에서 가져오기
        // 실제 Moodle 3.7 스키마에 맞게 조정 필요
        $stmt = $conn->prepare("
            SELECT
                q.id,
                q.questiontext as text,
                q.name,
                qa.answer,
                qa.fraction
            FROM mdl_question q
            LEFT JOIN mdl_question_answers qa ON q.id = qa.question
            WHERE q.id = :id
            AND q.qtype = 'truefalse'
            LIMIT 1
        ");

        $stmt->execute(['id' => $questionId]);
        $result = $stmt->fetch();

        if ($result) {
            return formatQuestion($result);
        }

        return null;
    } catch(Exception $e) {
        error_log("Get question by ID error: " . $e->getMessage());
        return null;
    }
}

/**
 * 랜덤 문제 가져오기
 */
function getRandomQuestion($conn) {
    try {
        // Inclusion Gate 카테고리의 문제 중 랜덤으로 가져오기
        $stmt = $conn->prepare("
            SELECT
                q.id,
                q.questiontext as text,
                q.name,
                qa.answer,
                qa.fraction
            FROM mdl_question q
            LEFT JOIN mdl_question_answers qa ON q.id = qa.question
            WHERE q.qtype = 'truefalse'
            AND q.questiontext LIKE '%포함%'
            ORDER BY RAND()
            LIMIT 1
        ");

        $stmt->execute();
        $result = $stmt->fetch();

        if ($result) {
            return formatQuestion($result);
        }

        return null;
    } catch(Exception $e) {
        error_log("Get random question error: " . $e->getMessage());
        return null;
    }
}

/**
 * 문제 데이터 포맷팅
 */
function formatQuestion($data) {
    // HTML 태그 제거
    $text = strip_tags($data['text']);

    // 정답 판단 (fraction = 1.0이면 정답)
    $correctAnswer = ($data['fraction'] >= 1.0);

    return [
        'id' => $data['id'],
        'text' => $text,
        'name' => $data['name'] ?? '',
        'correctAnswer' => $correctAnswer,
        'explanation' => '' // Moodle의 feedback 필드에서 가져올 수 있음
    ];
}
?>
