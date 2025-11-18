<?php
/**
 * Moodle LMS 연동 API
 * Moodle 3.7 + PHP 7.1.9 + MySQL 5.7
 *
 * 3D 도형 학습 앱과 Moodle 간 데이터 교환 담당
 */

// CORS 헤더 설정 (개발 환경에서 필요)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Moodle 설정 파일 로드
// 실제 환경에서는 Moodle 설치 경로에 맞게 수정 필요
// require_once('../../config.php');

// 데이터베이스 연결 설정 (독립 실행 모드)
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
define('DB_CHARSET', 'utf8mb4');

/**
 * 데이터베이스 연결
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * JSON 응답 전송
 */
function sendResponse($success, $data = null, $message = '') {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c')
    ];

    if ($data !== null) {
        if ($success) {
            $response = array_merge($response, $data);
        } else {
            $response['error'] = $data;
        }
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * 연결 확인
 */
function checkConnection() {
    $db = getDBConnection();

    if ($db === null) {
        sendResponse(false, null, 'Moodle 데이터베이스 연결 실패');
    }

    try {
        // Moodle 버전 확인
        $stmt = $db->query("SELECT value FROM mdl_config WHERE name = 'version'");
        $version = $stmt->fetchColumn();

        sendResponse(true, [
            'moodle_version' => $version,
            'php_version' => phpversion(),
            'mysql_version' => $db->getAttribute(PDO::ATTR_SERVER_VERSION)
        ], 'Moodle 연결 성공');

    } catch (PDOException $e) {
        sendResponse(false, ['error' => $e->getMessage()], 'Moodle 연결 확인 실패');
    }
}

/**
 * 문제 정보 가져오기
 */
function getProblem($problemId) {
    $db = getDBConnection();

    if ($db === null) {
        sendResponse(false, null, '데이터베이스 연결 실패');
    }

    try {
        // 3D 도형 문제 정보 조회
        // 실제 테이블 구조는 Moodle 커스텀 플러그인에 따라 다를 수 있음
        $stmt = $db->prepare("
            SELECT
                q.id,
                q.name as title,
                q.questiontext as description,
                q.qtype,
                qm.shape_type,
                qm.shape_dimensions,
                qm.shape_color,
                qm.answer_type
            FROM mdl_question q
            LEFT JOIN mdl_question_3dshape_metadata qm ON q.id = qm.questionid
            WHERE q.id = :id AND q.qtype = '3dshape'
        ");

        $stmt->execute(['id' => $problemId]);
        $row = $stmt->fetch();

        if (!$row) {
            sendResponse(false, null, '문제를 찾을 수 없습니다');
        }

        // 도형 정보 파싱
        $dimensions = json_decode($row['shape_dimensions'], true);

        $problem = [
            'problem' => [
                'id' => $row['id'],
                'title' => strip_tags($row['title']),
                'description' => strip_tags($row['description']),
                'shape' => [
                    'type' => $row['shape_type'],
                    'dimensions' => $dimensions,
                    'color' => hexdec($row['shape_color'])
                ],
                'answer_type' => $row['answer_type']
            ]
        ];

        sendResponse(true, $problem, '문제 로드 성공');

    } catch (PDOException $e) {
        error_log("getProblem error: " . $e->getMessage());
        sendResponse(false, ['error' => $e->getMessage()], '문제 로드 실패');
    }
}

/**
 * 학생 응답 제출
 */
function submitAnswer() {
    $db = getDBConnection();

    if ($db === null) {
        sendResponse(false, null, '데이터베이스 연결 실패');
    }

    // POST 데이터 가져오기
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['problem_id']) || !isset($input['answer'])) {
        sendResponse(false, null, '필수 파라미터 누락');
    }

    $problemId = $input['problem_id'];
    $answer = $input['answer'];
    $timestamp = $input['timestamp'] ?? date('c');

    try {
        // 정답 확인
        $stmt = $db->prepare("
            SELECT correct_answer, answer_type
            FROM mdl_question_3dshape_metadata
            WHERE questionid = :id
        ");

        $stmt->execute(['id' => $problemId]);
        $questionData = $stmt->fetch();

        if (!$questionData) {
            sendResponse(false, null, '문제 정보를 찾을 수 없습니다');
        }

        // 정답 체크 로직 (타입에 따라 다름)
        $isCorrect = false;
        $feedback = '';

        switch ($questionData['answer_type']) {
            case 'numeric':
                $correctAnswer = floatval($questionData['correct_answer']);
                $studentAnswer = floatval($answer);
                $isCorrect = abs($correctAnswer - $studentAnswer) < 0.01;
                $feedback = $isCorrect ? '정답입니다!' : "오답입니다. 정답은 {$correctAnswer}입니다.";
                break;

            case 'multiple_choice':
                $isCorrect = ($answer === $questionData['correct_answer']);
                $feedback = $isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해보세요.';
                break;

            case 'observation':
                // 관찰형 문제는 제출만 기록
                $isCorrect = true;
                $feedback = '관찰 내용이 기록되었습니다.';
                break;

            default:
                $isCorrect = false;
                $feedback = '알 수 없는 문제 타입입니다.';
        }

        // 응답 기록 저장
        $stmt = $db->prepare("
            INSERT INTO mdl_question_attempts
            (questionid, userid, answer, is_correct, submitted_at)
            VALUES (:question_id, :user_id, :answer, :is_correct, NOW())
        ");

        // 실제 환경에서는 세션에서 사용자 ID 가져오기
        // $userId = $USER->id;
        $userId = 1; // 테스트용 기본값

        $stmt->execute([
            'question_id' => $problemId,
            'user_id' => $userId,
            'answer' => json_encode($answer),
            'is_correct' => $isCorrect ? 1 : 0
        ]);

        sendResponse(true, [
            'result' => [
                'is_correct' => $isCorrect,
                'feedback' => $feedback,
                'submitted_at' => $timestamp
            ]
        ], '응답 제출 완료');

    } catch (PDOException $e) {
        error_log("submitAnswer error: " . $e->getMessage());
        sendResponse(false, ['error' => $e->getMessage()], '응답 제출 실패');
    }
}

/**
 * 문제 목록 가져오기
 */
function getProblemList($category = null) {
    $db = getDBConnection();

    if ($db === null) {
        sendResponse(false, null, '데이터베이스 연결 실패');
    }

    try {
        $sql = "
            SELECT
                q.id,
                q.name as title,
                q.qtype,
                qm.shape_type,
                qc.name as category
            FROM mdl_question q
            LEFT JOIN mdl_question_3dshape_metadata qm ON q.id = qm.questionid
            LEFT JOIN mdl_question_categories qc ON q.category = qc.id
            WHERE q.qtype = '3dshape'
        ";

        if ($category !== null) {
            $sql .= " AND qc.id = :category";
        }

        $sql .= " ORDER BY q.id DESC LIMIT 50";

        $stmt = $db->prepare($sql);

        if ($category !== null) {
            $stmt->execute(['category' => $category]);
        } else {
            $stmt->execute();
        }

        $problems = $stmt->fetchAll();

        sendResponse(true, [
            'problems' => $problems,
            'count' => count($problems)
        ], '문제 목록 로드 성공');

    } catch (PDOException $e) {
        error_log("getProblemList error: " . $e->getMessage());
        sendResponse(false, ['error' => $e->getMessage()], '문제 목록 로드 실패');
    }
}

// 라우팅 처리
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'check_connection':
        checkConnection();
        break;

    case 'get_problem':
        $problemId = $_GET['id'] ?? null;
        if ($problemId === null) {
            sendResponse(false, null, '문제 ID가 필요합니다');
        }
        getProblem($problemId);
        break;

    case 'submit_answer':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendResponse(false, null, 'POST 메서드만 허용됩니다');
        }
        submitAnswer();
        break;

    case 'get_problem_list':
        $category = $_GET['category'] ?? null;
        getProblemList($category);
        break;

    default:
        sendResponse(false, null, '유효하지 않은 액션입니다');
}
