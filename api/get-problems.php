<?php
/**
 * Get Math Problems from Moodle
 * Moodle LMS에서 수학 문제 데이터를 가져오는 API
 */

require_once 'config.php';

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// GET 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('지원하지 않는 메서드입니다.', 405);
}

// 문제 ID 가져오기
$problemId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($problemId <= 0) {
    sendError('유효하지 않은 문제 ID입니다.');
}

// 데이터베이스 연결
$db = getDBConnection();
if (!$db) {
    sendError('데이터베이스 연결 실패', 500);
}

try {
    /**
     * Moodle의 quiz 문제 테이블에서 데이터 가져오기
     *
     * 실제 Moodle 데이터베이스 구조:
     * - mdl_question: 문제 기본 정보
     * - mdl_question_answers: 문제 답변
     * - mdl_qtype_calculated: 계산 문제 타입
     *
     * 여기서는 커스텀 테이블을 사용한다고 가정
     */

    // 커스텀 수학 문제 테이블 (실제 프로젝트에서는 Moodle 테이블 구조에 맞게 수정)
    $stmt = $db->prepare("
        SELECT
            id,
            title,
            description,
            function_expression,
            x_min,
            x_max,
            difficulty,
            created_at
        FROM " . MOODLE_PREFIX . "math_extrema_problems
        WHERE id = :id AND active = 1
    ");

    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        // 문제가 없으면 샘플 데이터 반환 (개발/테스트용)
        $sampleProblems = [
            1 => [
                'id' => 1,
                'title' => '이차함수의 극값',
                'description' => '다음 이차함수의 극값을 찾으세요.',
                'function' => 'x^2 - 4*x + 3',
                'xMin' => -2,
                'xMax' => 6,
                'difficulty' => 'easy'
            ],
            2 => [
                'id' => 2,
                'title' => '삼차함수의 극값',
                'description' => '다음 삼차함수의 극값을 모두 찾으세요.',
                'function' => 'x^3 - 3*x^2 - 9*x + 5',
                'xMin' => -5,
                'xMax' => 5,
                'difficulty' => 'medium'
            ],
            3 => [
                'id' => 3,
                'title' => '삼각함수의 극값',
                'description' => '주어진 범위에서 삼각함수의 극값을 찾으세요.',
                'function' => 'sin(x) + 0.5*cos(2*x)',
                'xMin' => 0,
                'xMax' => 6.28,
                'difficulty' => 'hard'
            ],
            4 => [
                'id' => 4,
                'title' => '사차함수의 극값',
                'description' => '다음 사차함수의 모든 극값을 찾으세요.',
                'function' => 'x^4 - 4*x^3 + 4*x^2',
                'xMin' => -2,
                'xMax' => 4,
                'difficulty' => 'hard'
            ]
        ];

        if (isset($sampleProblems[$problemId])) {
            sendSuccess($sampleProblems[$problemId]);
        } else {
            sendError('문제를 찾을 수 없습니다.', 404);
        }
    } else {
        // 데이터베이스에서 가져온 문제 반환
        $result = [
            'id' => $problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'function' => $problem['function_expression'],
            'xMin' => floatval($problem['x_min']),
            'xMax' => floatval($problem['x_max']),
            'difficulty' => $problem['difficulty']
        ];

        sendSuccess($result);
    }

} catch (PDOException $e) {
    error_log("문제 조회 오류: " . $e->getMessage());
    sendError('문제를 조회할 수 없습니다.', 500);
}
?>
