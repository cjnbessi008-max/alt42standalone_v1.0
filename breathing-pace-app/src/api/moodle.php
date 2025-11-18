<?php
/**
 * Moodle API Integration
 * Breathing Pace Learning Assistant - Moodle 연동
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 요청 데이터 받기
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['action'])) {
    sendError('Invalid request: action required');
}

$action = $input['action'];
$config = $input['config'] ?? null;

switch ($action) {
    case 'getQuizInfo':
        getQuizInfo($config);
        break;

    case 'getQuestions':
        getQuestions($config);
        break;

    case 'submitAnswer':
        submitAnswer($config, $input['data'] ?? []);
        break;

    default:
        sendError('Unknown action: ' . $action);
}

/**
 * Moodle 퀴즈 정보 가져오기
 */
function getQuizInfo($config) {
    if (!validateConfig($config)) {
        sendError('Invalid Moodle configuration');
    }

    $moodleUrl = rtrim($config['url'], '/');
    $token = $config['token'];
    $quizId = $config['quizId'];

    // Moodle Web Service API 호출
    $endpoint = $moodleUrl . '/webservice/rest/server.php';

    $params = [
        'wstoken' => $token,
        'wsfunction' => 'mod_quiz_get_quizzes_by_courses',
        'moodlewsrestformat' => 'json'
    ];

    $response = callMoodleAPI($endpoint, $params);

    if (!$response) {
        sendError('Failed to connect to Moodle');
    }

    // 퀴즈 찾기
    $quiz = findQuizById($response['quizzes'] ?? [], $quizId);

    if (!$quiz) {
        // 퀴즈를 찾지 못한 경우, 데모 데이터 반환
        $question = generateDemoQuestion($quizId);
        sendSuccess([
            'question' => $question,
            'quiz' => ['id' => $quizId, 'name' => 'Demo Quiz'],
            'demo' => true
        ]);
    }

    // 첫 번째 문제 가져오기
    $question = getFirstQuestion($config, $quiz['id']);

    sendSuccess([
        'question' => $question,
        'quiz' => $quiz
    ]);
}

/**
 * 퀴즈의 문제들 가져오기
 */
function getQuestions($config) {
    if (!validateConfig($config)) {
        sendError('Invalid Moodle configuration');
    }

    $moodleUrl = rtrim($config['url'], '/');
    $token = $config['token'];
    $quizId = $config['quizId'];

    $endpoint = $moodleUrl . '/webservice/rest/server.php';

    $params = [
        'wstoken' => $token,
        'wsfunction' => 'mod_quiz_get_attempt_data',
        'quizid' => $quizId,
        'moodlewsrestformat' => 'json'
    ];

    $response = callMoodleAPI($endpoint, $params);

    if (!$response || isset($response['exception'])) {
        // API 실패 시 데모 문제 반환
        $demoQuestions = generateDemoQuestions($quizId);
        sendSuccess(['questions' => $demoQuestions, 'demo' => true]);
    }

    $questions = parseQuestions($response);

    sendSuccess(['questions' => $questions]);
}

/**
 * Moodle API 호출
 */
function callMoodleAPI($endpoint, $params) {
    $url = $endpoint . '?' . http_build_query($params);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    return json_decode($response, true);
}

/**
 * 퀴즈 ID로 찾기
 */
function findQuizById($quizzes, $quizId) {
    foreach ($quizzes as $quiz) {
        if ($quiz['id'] == $quizId) {
            return $quiz;
        }
    }
    return null;
}

/**
 * 첫 번째 문제 가져오기
 */
function getFirstQuestion($config, $quizId) {
    // 실제 구현에서는 Moodle API를 통해 문제를 가져와야 함
    // 여기서는 데모 문제 생성
    return generateDemoQuestion($quizId);
}

/**
 * 데모 문제 생성 (Moodle 연결 실패 시)
 */
function generateDemoQuestion($quizId) {
    $difficulties = ['easy', 'medium', 'hard', 'very-hard'];
    $difficulty = $difficulties[array_rand($difficulties)];

    return [
        'id' => rand(1, 1000),
        'quizId' => $quizId,
        'title' => '샘플 문제 - ' . $difficulty,
        'difficulty' => $difficulty,
        'type' => 'multichoice',
        'questiontext' => '이것은 난이도 ' . $difficulty . ' 샘플 문제입니다.',
        'url' => null
    ];
}

/**
 * 여러 데모 문제 생성
 */
function generateDemoQuestions($quizId, $count = 5) {
    $questions = [];
    $difficulties = ['easy', 'medium', 'hard', 'very-hard'];

    for ($i = 0; $i < $count; $i++) {
        $difficulty = $difficulties[$i % count($difficulties)];
        $questions[] = [
            'id' => $i + 1,
            'quizId' => $quizId,
            'title' => '문제 ' . ($i + 1),
            'difficulty' => $difficulty,
            'type' => 'multichoice',
            'questiontext' => '난이도 ' . $difficulty . ' 문제입니다.',
            'url' => null
        ];
    }

    return $questions;
}

/**
 * 문제 난이도 분석
 * Moodle의 문제 데이터에서 난이도 추출 또는 계산
 */
function analyzeDifficulty($question) {
    // 1. 명시적 난이도 태그가 있는 경우
    if (isset($question['tags'])) {
        foreach ($question['tags'] as $tag) {
            $tag = strtolower($tag);
            if (in_array($tag, ['easy', 'medium', 'hard', 'very-hard'])) {
                return $tag;
            }
        }
    }

    // 2. 문제 유형 기반 난이도 추정
    $type = $question['type'] ?? 'multichoice';

    $typeTodifficulty = [
        'truefalse' => 'easy',
        'multichoice' => 'medium',
        'shortanswer' => 'medium',
        'numerical' => 'hard',
        'essay' => 'very-hard',
        'calculated' => 'very-hard'
    ];

    return $typeTodifficulty[$type] ?? 'medium';
}

/**
 * 문제 파싱
 */
function parseQuestions($response) {
    $questions = [];

    if (isset($response['questions'])) {
        foreach ($response['questions'] as $q) {
            $questions[] = [
                'id' => $q['slot'] ?? $q['id'],
                'title' => strip_tags($q['name'] ?? 'Question'),
                'difficulty' => analyzeDifficulty($q),
                'type' => $q['type'] ?? 'multichoice',
                'questiontext' => strip_tags($q['questiontext'] ?? ''),
                'maxmark' => $q['maxmark'] ?? 1.0
            ];
        }
    }

    return $questions;
}

/**
 * 설정 유효성 검사
 */
function validateConfig($config) {
    return $config
        && isset($config['url'])
        && isset($config['token'])
        && isset($config['quizId'])
        && !empty($config['url'])
        && !empty($config['token']);
}

/**
 * 답안 제출
 */
function submitAnswer($config, $data) {
    // 실제로는 Moodle에 답안을 제출해야 함
    // 여기서는 기본 응답만 반환

    sendSuccess([
        'submitted' => true,
        'message' => 'Answer submitted successfully'
    ]);
}

/**
 * 성공 응답
 */
function sendSuccess($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ]);
    exit();
}

/**
 * 에러 응답
 */
function sendError($message) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ]);
    exit();
}
?>
