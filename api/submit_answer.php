<?php
/**
 * Solution Paint - Submit Answer API
 * 학생 답안 제출 및 채점
 */

require_once 'db_config.php';

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(array(
        'success' => false,
        'error' => 'POST method required'
    ), 405);
}

try {
    $db = Database::getInstance()->getConnection();
    $postData = getPostData();

    // 필수 파라미터 검증
    $required = ['problem_id', 'student_id', 'painted_data'];
    foreach ($required as $field) {
        if (!isset($postData[$field])) {
            jsonResponse(array(
                'success' => false,
                'error' => "Missing required field: $field"
            ), 400);
        }
    }

    $problemId = intval($postData['problem_id']);
    $studentId = sanitizeInput($postData['student_id']);
    $studentName = isset($postData['student_name']) ? sanitizeInput($postData['student_name']) : null;
    $paintedData = json_encode($postData['painted_data']);
    $answerStart = isset($postData['answer_start']) ? floatval($postData['answer_start']) : null;
    $answerEnd = isset($postData['answer_end']) ? floatval($postData['answer_end']) : null;
    $timeSpent = isset($postData['time_spent']) ? intval($postData['time_spent']) : null;

    // 문제 정보 가져오기
    $stmt = $db->prepare("SELECT * FROM inequality_problems WHERE id = :id");
    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        jsonResponse(array(
            'success' => false,
            'error' => 'Problem not found'
        ), 404);
    }

    // 시도 횟수 계산
    $stmt = $db->prepare("
        SELECT COUNT(*) as attempt_count
        FROM student_answers
        WHERE problem_id = :problem_id AND student_id = :student_id
    ");
    $stmt->execute([
        'problem_id' => $problemId,
        'student_id' => $studentId
    ]);
    $attemptData = $stmt->fetch();
    $attemptNumber = intval($attemptData['attempt_count']) + 1;

    // 답안 채점
    $gradingResult = gradeAnswer($problem, $answerStart, $answerEnd, $postData['painted_data']);

    // 답안 저장
    $stmt = $db->prepare("
        INSERT INTO student_answers
        (problem_id, student_id, student_name, painted_data,
         answer_start, answer_end, is_correct, score, attempt_number, time_spent)
        VALUES
        (:problem_id, :student_id, :student_name, :painted_data,
         :answer_start, :answer_end, :is_correct, :score, :attempt_number, :time_spent)
    ");

    $stmt->execute([
        'problem_id' => $problemId,
        'student_id' => $studentId,
        'student_name' => $studentName,
        'painted_data' => $paintedData,
        'answer_start' => $answerStart,
        'answer_end' => $answerEnd,
        'is_correct' => $gradingResult['is_correct'],
        'score' => $gradingResult['score'],
        'attempt_number' => $attemptNumber,
        'time_spent' => $timeSpent
    ]);

    $answerId = $db->lastInsertId();

    // Moodle에 점수 전송 (활성화 시)
    if (MOODLE_ENABLED && $problem['moodle_question_id']) {
        submitToMoodle($problem['moodle_question_id'], $studentId, $gradingResult['score']);
    }

    // 응답 반환
    jsonResponse(array(
        'success' => true,
        'answer_id' => intval($answerId),
        'grading' => $gradingResult,
        'attempt_number' => $attemptNumber,
        'correct_solution' => array(
            'start' => $problem['solution_start'] ? floatval($problem['solution_start']) : null,
            'end' => $problem['solution_end'] ? floatval($problem['solution_end']) : null,
            'includeStart' => (bool)$problem['include_start'],
            'includeEnd' => (bool)$problem['include_end']
        )
    ));

} catch (Exception $e) {
    jsonResponse(array(
        'success' => false,
        'error' => $e->getMessage()
    ), 500);
}

/**
 * 답안 채점 함수
 */
function gradeAnswer($problem, $answerStart, $answerEnd, $paintedData) {
    $correctStart = $problem['solution_start'];
    $correctEnd = $problem['solution_end'];
    $tolerance = 0.1; // 오차 허용 범위

    $isCorrect = false;
    $score = 0;
    $feedback = '';

    // 무한대 해의 경우
    if ($correctEnd === null && $correctStart !== null) {
        // x > a 형태
        if ($answerEnd === null && abs($answerStart - $correctStart) <= $tolerance) {
            $isCorrect = true;
            $score = 100;
            $feedback = '정답입니다!';
        } else {
            $score = calculatePartialScore($answerStart, $correctStart, $tolerance);
            $feedback = '시작점을 확인해보세요.';
        }
    } else if ($correctStart === null && $correctEnd !== null) {
        // x < b 형태
        if ($answerStart === null && abs($answerEnd - $correctEnd) <= $tolerance) {
            $isCorrect = true;
            $score = 100;
            $feedback = '정답입니다!';
        } else {
            $score = calculatePartialScore($answerEnd, $correctEnd, $tolerance);
            $feedback = '끝점을 확인해보세요.';
        }
    } else if ($correctStart !== null && $correctEnd !== null) {
        // a < x < b 형태 (구간)
        $startCorrect = abs($answerStart - $correctStart) <= $tolerance;
        $endCorrect = abs($answerEnd - $correctEnd) <= $tolerance;

        if ($startCorrect && $endCorrect) {
            $isCorrect = true;
            $score = 100;
            $feedback = '정답입니다!';
        } else if ($startCorrect) {
            $score = 50;
            $feedback = '시작점은 맞지만 끝점을 확인해보세요.';
        } else if ($endCorrect) {
            $score = 50;
            $feedback = '끝점은 맞지만 시작점을 확인해보세요.';
        } else {
            $score = 0;
            $feedback = '시작점과 끝점 모두 확인해보세요.';
        }
    }

    // 포함 여부 체크 (페인트 데이터에서)
    $inclusionCorrect = checkInclusion($paintedData, $problem);
    if (!$inclusionCorrect && $isCorrect) {
        $score = 80; // 범위는 맞지만 포함 여부가 틀림
        $feedback .= ' (경계값 포함 여부를 확인하세요)';
        $isCorrect = false;
    }

    return array(
        'is_correct' => $isCorrect,
        'score' => $score,
        'feedback' => $feedback,
        'details' => array(
            'start_correct' => isset($startCorrect) ? $startCorrect : null,
            'end_correct' => isset($endCorrect) ? $endCorrect : null,
            'inclusion_correct' => $inclusionCorrect
        )
    );
}

/**
 * 부분 점수 계산
 */
function calculatePartialScore($answer, $correct, $tolerance) {
    if ($answer === null || $correct === null) {
        return 0;
    }

    $diff = abs($answer - $correct);
    if ($diff <= $tolerance) {
        return 100;
    } else if ($diff <= $tolerance * 2) {
        return 70;
    } else if ($diff <= $tolerance * 5) {
        return 40;
    } else if ($diff <= $tolerance * 10) {
        return 20;
    }

    return 0;
}

/**
 * 경계값 포함 여부 체크
 */
function checkInclusion($paintedData, $problem) {
    // paintedData에서 경계 스타일 확인
    // 실제 구현은 프론트엔드 데이터 구조에 따라 조정
    if (isset($paintedData['includeStart']) && isset($paintedData['includeEnd'])) {
        return ($paintedData['includeStart'] == $problem['include_start']) &&
               ($paintedData['includeEnd'] == $problem['include_end']);
    }

    return true; // 데이터 없으면 통과
}

/**
 * Moodle에 점수 전송
 */
function submitToMoodle($questionId, $studentId, $score) {
    if (!MOODLE_TOKEN) {
        return false;
    }

    $url = MOODLE_URL . '/webservice/rest/server.php';
    $params = array(
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => 'mod_quiz_save_attempt',
        'moodlewsrestformat' => 'json',
        'questionid' => $questionId,
        'userid' => $studentId,
        'grade' => $score / 100 // 0-1 범위로 변환
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($httpCode === 200);
}
