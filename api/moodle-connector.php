<?php
/**
 * Moodle Web Services API 연동 모듈
 * Moodle 3.7 호환
 */

require_once 'config.php';
require_once 'database.php';

/**
 * Moodle API 요청 처리
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $request = json_decode($input, true);

    debug_log('Moodle Connector Request', $request);

    if ($request === null) {
        error_response('잘못된 JSON 형식입니다.');
    }

    $action = isset($request['action']) ? $request['action'] : '';

    switch ($action) {
        case 'check_connection':
            checkMoodleConnection($request);
            break;

        case 'get_problem':
            getProblem($request);
            break;

        case 'submit_answer':
            submitAnswer($request);
            break;

        default:
            error_response('알 수 없는 액션입니다: ' . $action);
    }
} else {
    error_response('POST 요청만 지원합니다.', 405);
}

/**
 * Moodle 연결 확인
 */
function checkMoodleConnection($request) {
    debug_log('Checking Moodle connection');

    $wsToken = isset($request['wstoken']) ? $request['wstoken'] : MOODLE_WS_TOKEN;

    if (empty($wsToken)) {
        debug_log('No Moodle token provided - using offline mode');
        json_response(true, array(
            'connected' => false,
            'mode' => 'offline',
            'message' => 'Moodle 토큰이 없습니다. 오프라인 모드로 동작합니다.'
        ));
    }

    // Moodle Web Service 호출
    $result = callMoodleWebService('core_webservice_get_site_info', array(), $wsToken);

    if ($result !== false && isset($result['sitename'])) {
        debug_log('Moodle connection successful', $result);
        json_response(true, array(
            'connected' => true,
            'sitename' => $result['sitename'],
            'moodleversion' => isset($result['release']) ? $result['release'] : 'Unknown'
        ));
    } else {
        debug_log('Moodle connection failed');
        json_response(false, null, 'Moodle 연결에 실패했습니다.');
    }
}

/**
 * 문제 데이터 가져오기
 */
function getProblem($request) {
    debug_log('Getting problem');

    $problemId = isset($request['problemId']) ? intval($request['problemId']) : null;
    $wsToken = isset($request['wstoken']) ? $request['wstoken'] : MOODLE_WS_TOKEN;

    // Moodle이 연결되어 있으면 Moodle에서 가져오기
    if (!empty($wsToken)) {
        $problem = getProblemFromMoodle($problemId, $wsToken);
        if ($problem !== false) {
            json_response(true, array('problem' => $problem));
        }
    }

    // Moodle 연결 실패 또는 토큰 없음 - 데이터베이스에서 가져오기
    $problem = getProblemFromDatabase($problemId);

    if ($problem !== false) {
        json_response(true, array('problem' => $problem));
    } else {
        error_response('문제를 찾을 수 없습니다.');
    }
}

/**
 * Moodle에서 문제 가져오기
 */
function getProblemFromMoodle($problemId, $wsToken) {
    debug_log('Fetching problem from Moodle', $problemId);

    // Moodle Web Service 함수 호출
    // 실제로는 mod_quiz_get_attempt_data 또는 다른 적절한 함수를 사용
    $params = array(
        'attemptid' => $problemId
    );

    $result = callMoodleWebService('mod_quiz_get_attempt_data', $params, $wsToken);

    if ($result !== false && isset($result['questions'])) {
        // Moodle 데이터를 우리 형식으로 변환
        return convertMoodleQuestionToOperationTrail($result['questions'][0]);
    }

    return false;
}

/**
 * 데이터베이스에서 문제 가져오기
 */
function getProblemFromDatabase($problemId) {
    debug_log('Fetching problem from database', $problemId);

    $db = getDatabase();

    try {
        if ($problemId === null) {
            // 랜덤 문제 가져오기
            $sql = "SELECT * FROM operation_trail_problems ORDER BY RAND() LIMIT 1";
            $problem = $db->fetchOne($sql);
        } else {
            // 특정 문제 가져오기
            $sql = "SELECT * FROM operation_trail_problems WHERE id = :id";
            $problem = $db->fetchOne($sql, array('id' => $problemId));
        }

        if ($problem) {
            // steps JSON 디코딩
            $problem['steps'] = json_decode($problem['steps'], true);
            return $problem;
        }

        return false;
    } catch (Exception $e) {
        debug_log('Database error', $e->getMessage());
        return false;
    }
}

/**
 * 답안 제출
 */
function submitAnswer($request) {
    debug_log('Submitting answer');

    $problemId = isset($request['problemId']) ? intval($request['problemId']) : null;
    $answer = isset($request['answer']) ? $request['answer'] : null;
    $wsToken = isset($request['wstoken']) ? $request['wstoken'] : MOODLE_WS_TOKEN;

    if ($problemId === null || $answer === null) {
        error_response('문제 ID와 답안이 필요합니다.');
    }

    // 데이터베이스에서 정답 확인
    $db = getDatabase();

    try {
        $sql = "SELECT answer FROM operation_trail_problems WHERE id = :id";
        $problem = $db->fetchOne($sql, array('id' => $problemId));

        if ($problem) {
            $isCorrect = ($answer == $problem['answer']);

            // 답안 기록 저장
            $db->insert('operation_trail_submissions', array(
                'problem_id' => $problemId,
                'user_answer' => $answer,
                'correct_answer' => $problem['answer'],
                'is_correct' => $isCorrect ? 1 : 0,
                'submitted_at' => date('Y-m-d H:i:s')
            ));

            json_response(true, array(
                'correct' => $isCorrect,
                'answer' => $answer,
                'correctAnswer' => $problem['answer'],
                'message' => $isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해보세요.'
            ));
        } else {
            error_response('문제를 찾을 수 없습니다.');
        }
    } catch (Exception $e) {
        debug_log('Error submitting answer', $e->getMessage());
        error_response('답안 제출 중 오류가 발생했습니다.');
    }
}

/**
 * Moodle Web Service 호출
 */
function callMoodleWebService($function, $params, $wsToken) {
    if (empty($wsToken)) {
        return false;
    }

    $serverUrl = MOODLE_URL . '/webservice/rest/server.php';

    $postData = array(
        'wstoken' => $wsToken,
        'wsfunction' => $function,
        'moodlewsrestformat' => MOODLE_REST_FORMAT
    );

    $postData = array_merge($postData, $params);

    $ch = curl_init($serverUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            debug_log('Moodle API error', $result);
            return false;
        }

        return $result;
    }

    debug_log('Moodle API HTTP error', $httpCode);
    return false;
}

/**
 * Moodle 문제를 Operation Trail 형식으로 변환
 */
function convertMoodleQuestionToOperationTrail($moodleQuestion) {
    // Moodle 질문 형식을 우리 형식으로 변환
    // 실제 구현은 Moodle 질문 타입에 따라 다름

    return array(
        'id' => $moodleQuestion['slot'],
        'type' => 'arithmetic',
        'question' => strip_tags($moodleQuestion['html']),
        'expression' => extractExpression($moodleQuestion['html']),
        'steps' => generateStepsFromExpression(extractExpression($moodleQuestion['html'])),
        'answer' => 0 // 실제로는 문제에서 추출
    );
}

/**
 * HTML에서 수식 추출
 */
function extractExpression($html) {
    // 간단한 구현 - 실제로는 더 복잡한 파싱 필요
    $text = strip_tags($html);
    preg_match('/[\d\s\+\-\×\÷\(\)]+/', $text, $matches);
    return isset($matches[0]) ? trim($matches[0]) : '';
}

/**
 * 수식에서 계산 단계 생성
 */
function generateStepsFromExpression($expression) {
    // 간단한 구현 - 실제로는 수식 파서 필요
    // 여기서는 빈 배열 반환
    return array();
}

?>
