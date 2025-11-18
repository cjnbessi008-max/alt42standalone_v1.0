<?php
/**
 * Relation Lines - Submit Answer API
 * 학생의 답안을 채점하고 결과를 반환하는 API
 */

require_once 'config.php';

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('POST 요청만 허용됩니다.', 405);
}

// JSON 데이터 가져오기
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendErrorResponse('유효하지 않은 JSON 데이터입니다.');
}

// 필수 파라미터 확인
$questionId = isset($data['questionId']) ? intval($data['questionId']) : 0;
$answers = isset($data['answers']) ? $data['answers'] : [];

if ($questionId <= 0) {
    sendErrorResponse('유효하지 않은 문제 ID입니다.');
}

if (empty($answers) || !is_array($answers)) {
    sendErrorResponse('답안이 제공되지 않았습니다.');
}

try {
    $pdo = getDBConnection();

    // DB 연결 실패시 로컬 채점
    if (!$pdo) {
        gradeAnswersLocally($questionId, $answers);
    }

    // Moodle에서 정답 데이터 가져오기
    $stmt = $pdo->prepare("
        SELECT
            q.id,
            qd.data as question_data
        FROM " . MOODLE_PREFIX . "question q
        LEFT JOIN " . MOODLE_PREFIX . "question_relationlines qd ON q.id = qd.questionid
        WHERE q.id = :questionId
        LIMIT 1
    ");

    $stmt->execute(['questionId' => $questionId]);
    $question = $stmt->fetch();

    if (!$question) {
        // 문제를 찾지 못한 경우 로컬 채점
        gradeAnswersLocally($questionId, $answers);
    }

    // 정답 데이터 파싱
    $questionData = json_decode($question['question_data'], true);

    if (!$questionData || !isset($questionData['correctAnswers'])) {
        gradeAnswersLocally($questionId, $answers);
    }

    $correctAnswers = $questionData['correctAnswers'];

    // 답안 채점
    $result = gradeAnswers($answers, $correctAnswers);

    // 학생 응답 기록 저장 (선택사항)
    saveStudentResponse($pdo, $questionId, $answers, $result);

    // 결과 반환
    sendJsonResponse([
        'success' => $result['score'] === $result['total'],
        'score' => $result['score'],
        'total' => $result['total'],
        'percentage' => $result['percentage'],
        'details' => $result['details']
    ]);

} catch (Exception $e) {
    error_log("Submit Answer Error: " . $e->getMessage());
    sendErrorResponse('답안 제출 중 오류가 발생했습니다: ' . $e->getMessage(), 500);
}

/**
 * 답안 채점 함수
 * @param array $answers 학생 답안
 * @param array $correctAnswers 정답
 * @return array 채점 결과
 */
function gradeAnswers($answers, $correctAnswers) {
    $score = 0;
    $total = count($correctAnswers);
    $details = [];

    foreach ($correctAnswers as $left => $right) {
        $isCorrect = isset($answers[$left]) && $answers[$left] === $right;

        if ($isCorrect) {
            $score++;
        }

        $details[] = [
            'left' => $left,
            'right' => $right,
            'studentAnswer' => $answers[$left] ?? null,
            'correct' => $isCorrect
        ];
    }

    $percentage = $total > 0 ? round(($score / $total) * 100, 2) : 0;

    return [
        'score' => $score,
        'total' => $total,
        'percentage' => $percentage,
        'details' => $details
    ];
}

/**
 * 로컬 채점 (DB 연결 실패시)
 * @param int $questionId
 * @param array $answers
 */
function gradeAnswersLocally($questionId, $answers) {
    // 샘플 정답 데이터
    $sampleCorrectAnswers = [
        1 => [
            '1/2' => '0.5',
            '1/4' => '0.25',
            '3/4' => '0.75',
            '1/5' => '0.2',
            '2/5' => '0.4'
        ],
        2 => [
            '2 × 3' => '6',
            '3 × 4' => '12',
            '4 × 5' => '20',
            '5 × 6' => '30',
            '6 × 7' => '42'
        ],
        3 => [
            'Apple' => '사과',
            'Book' => '책',
            'Cat' => '고양이',
            'Dog' => '개',
            'Eye' => '눈'
        ],
        4 => [
            '삼각형' => '3',
            '사각형' => '4',
            '오각형' => '5',
            '육각형' => '6',
            '원' => '무한'
        ],
        5 => [
            '한국' => '서울',
            '일본' => '도쿄',
            '중국' => '베이징',
            '미국' => '워싱턴',
            '영국' => '런던'
        ]
    ];

    $correctAnswers = isset($sampleCorrectAnswers[$questionId])
        ? $sampleCorrectAnswers[$questionId]
        : $sampleCorrectAnswers[1];

    $result = gradeAnswers($answers, $correctAnswers);

    sendJsonResponse([
        'success' => $result['score'] === $result['total'],
        'score' => $result['score'],
        'total' => $result['total'],
        'percentage' => $result['percentage'],
        'details' => $result['details'],
        'note' => 'Graded locally (sample data)'
    ]);
}

/**
 * 학생 응답 기록 저장
 * @param PDO $pdo
 * @param int $questionId
 * @param array $answers
 * @param array $result
 */
function saveStudentResponse($pdo, $questionId, $answers, $result) {
    try {
        // 학생 ID는 세션이나 URL 파라미터에서 가져와야 함
        // 여기서는 간단히 임시 ID 사용
        $studentId = isset($_SESSION['userid']) ? $_SESSION['userid'] : 0;

        $stmt = $pdo->prepare("
            INSERT INTO " . MOODLE_PREFIX . "question_attempts
            (questionid, userid, timestart, timefinish, responsesummary, rightanswer, fraction)
            VALUES
            (:questionId, :studentId, :timeStart, :timeFinish, :responseSummary, :rightAnswer, :fraction)
        ");

        $timeStart = time() - 60; // 1분 전에 시작했다고 가정
        $timeFinish = time();
        $responseSummary = json_encode($answers, JSON_UNESCAPED_UNICODE);
        $rightAnswer = '';
        $fraction = $result['percentage'] / 100;

        $stmt->execute([
            'questionId' => $questionId,
            'studentId' => $studentId,
            'timeStart' => $timeStart,
            'timeFinish' => $timeFinish,
            'responseSummary' => $responseSummary,
            'rightAnswer' => $rightAnswer,
            'fraction' => $fraction
        ]);

    } catch (Exception $e) {
        // 저장 실패는 무시 (로그만 기록)
        error_log("Failed to save student response: " . $e->getMessage());
    }
}
