<?php
/**
 * Moodle LMS 연동 API
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

// CORS 헤더 설정
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
require_once(__DIR__ . '/../../../moodle/config.php');
require_once($CFG->libdir . '/questionlib.php');

// 데이터베이스 연결
$dbHost = 'localhost';
$dbName = 'moodle';
$dbUser = 'moodle_user';
$dbPass = 'moodle_password';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    sendError('데이터베이스 연결 실패: ' . $e->getMessage());
}

// 요청 처리
$action = getParameter('action');

switch ($action) {
    case 'getProblems':
        getProblems($pdo);
        break;

    case 'getProblemDetail':
        $problemId = getParameter('problemId');
        getProblemDetail($pdo, $problemId);
        break;

    case 'submitAttempt':
        submitAttempt($pdo);
        break;

    case 'logEvent':
        logEvent($pdo);
        break;

    default:
        sendError('잘못된 액션입니다');
}

/**
 * 수학 문제 목록 가져오기
 */
function getProblems($pdo) {
    try {
        // Moodle의 question 테이블에서 수학 문제 가져오기
        // 카테고리가 'graph' 또는 'function'인 문제만 필터링
        $sql = "
            SELECT
                q.id,
                q.name as title,
                q.questiontext as description,
                qd.value as equation,
                qd2.value as domain_min,
                qd3.value as domain_max
            FROM
                mdl_question q
            LEFT JOIN
                mdl_question_categories qc ON q.category = qc.id
            LEFT JOIN
                mdl_question_dataset_items qd ON q.id = qd.question
                AND qd.name = 'equation'
            LEFT JOIN
                mdl_question_dataset_items qd2 ON q.id = qd2.question
                AND qd2.name = 'domain_min'
            LEFT JOIN
                mdl_question_dataset_items qd3 ON q.id = qd3.question
                AND qd3.name = 'domain_max'
            WHERE
                qc.name IN ('graph', 'function')
                AND q.qtype = 'calculated'
            ORDER BY
                q.id DESC
            LIMIT 20
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $problems = [];
        foreach ($results as $row) {
            $problems[] = [
                'id' => (int)$row['id'],
                'title' => strip_tags($row['title']),
                'description' => strip_tags($row['description']),
                'equation' => $row['equation'] ?: 'x^2',
                'domain' => [
                    'min' => $row['domain_min'] ? (float)$row['domain_min'] : -5,
                    'max' => $row['domain_max'] ? (float)$row['domain_max'] : 5
                ]
            ];
        }

        sendSuccess([
            'problems' => $problems,
            'count' => count($problems)
        ]);

    } catch (Exception $e) {
        sendError('문제 목록을 가져올 수 없습니다: ' . $e->getMessage());
    }
}

/**
 * 문제 상세 정보 가져오기
 */
function getProblemDetail($pdo, $problemId) {
    try {
        $sql = "
            SELECT
                q.id,
                q.name as title,
                q.questiontext as description,
                qd.value as equation,
                qd2.value as domain_min,
                qd3.value as domain_max,
                q.generalfeedback as feedback
            FROM
                mdl_question q
            LEFT JOIN
                mdl_question_dataset_items qd ON q.id = qd.question
                AND qd.name = 'equation'
            LEFT JOIN
                mdl_question_dataset_items qd2 ON q.id = qd2.question
                AND qd2.name = 'domain_min'
            LEFT JOIN
                mdl_question_dataset_items qd3 ON q.id = qd3.question
                AND qd3.name = 'domain_max'
            WHERE
                q.id = :problemId
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':problemId', $problemId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            sendError('문제를 찾을 수 없습니다');
        }

        $problem = [
            'id' => (int)$row['id'],
            'title' => strip_tags($row['title']),
            'description' => strip_tags($row['description']),
            'equation' => $row['equation'] ?: 'x^2',
            'domain' => [
                'min' => $row['domain_min'] ? (float)$row['domain_min'] : -5,
                'max' => $row['domain_max'] ? (float)$row['domain_max'] : 5
            ],
            'feedback' => strip_tags($row['feedback'])
        ];

        sendSuccess([
            'problem' => $problem
        ]);

    } catch (Exception $e) {
        sendError('문제 상세 정보를 가져올 수 없습니다: ' . $e->getMessage());
    }
}

/**
 * 학생 풀이 시도 저장
 */
function submitAttempt($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $problemId = $data['problemId'] ?? null;
        $studentId = $data['studentId'] ?? null;
        $attemptData = json_encode($data['attemptData'] ?? []);
        $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

        if (!$problemId || !$studentId) {
            sendError('필수 파라미터가 누락되었습니다');
        }

        $sql = "
            INSERT INTO mdl_question_attempts
            (questionid, userid, attempt_data, timemodified)
            VALUES
            (:problemId, :studentId, :attemptData, :timestamp)
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':problemId', $problemId, PDO::PARAM_INT);
        $stmt->bindParam(':studentId', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':attemptData', $attemptData, PDO::PARAM_STR);
        $stmt->bindParam(':timestamp', $timestamp, PDO::PARAM_STR);
        $stmt->execute();

        sendSuccess([
            'attemptId' => $pdo->lastInsertId(),
            'message' => '풀이 시도가 저장되었습니다'
        ]);

    } catch (Exception $e) {
        sendError('풀이 시도 저장 실패: ' . $e->getMessage());
    }
}

/**
 * Property Shake 이벤트 로깅
 */
function logEvent($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $problemId = $data['problemId'] ?? null;
        $studentId = $data['studentId'] ?? null;
        $eventType = $data['eventType'] ?? 'unknown';
        $eventData = json_encode($data['eventData'] ?? []);
        $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

        // 이벤트 로그 테이블에 저장
        $sql = "
            INSERT INTO mdl_property_shake_logs
            (questionid, userid, event_type, event_data, timecreated)
            VALUES
            (:problemId, :studentId, :eventType, :eventData, :timestamp)
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':problemId', $problemId, PDO::PARAM_INT);
        $stmt->bindParam(':studentId', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':eventType', $eventType, PDO::PARAM_STR);
        $stmt->bindParam(':eventData', $eventData, PDO::PARAM_STR);
        $stmt->bindParam(':timestamp', $timestamp, PDO::PARAM_STR);
        $stmt->execute();

        sendSuccess([
            'logId' => $pdo->lastInsertId(),
            'message' => '이벤트가 로깅되었습니다'
        ]);

    } catch (Exception $e) {
        // 로깅 실패는 치명적이지 않으므로 경고만 표시
        sendSuccess([
            'warning' => '이벤트 로깅 실패: ' . $e->getMessage()
        ]);
    }
}

/**
 * 파라미터 가져오기
 */
function getParameter($name, $default = null) {
    if (isset($_GET[$name])) {
        return $_GET[$name];
    } elseif (isset($_POST[$name])) {
        return $_POST[$name];
    } else {
        return $default;
    }
}

/**
 * 성공 응답 전송
 */
function sendSuccess($data) {
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * 에러 응답 전송
 */
function sendError($message) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
?>
