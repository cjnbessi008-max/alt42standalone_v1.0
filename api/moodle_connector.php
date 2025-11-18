<?php
/**
 * Moodle LMS Connector
 *
 * Moodle 3.7, MySQL 5.7, PHP 7.1.9 환경과 연동
 * 문제 정보를 가져오고 학생 답안을 제출하는 API
 */

// CORS 헤더 설정 (개발 환경용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 데이터베이스 설정 파일 포함
require_once __DIR__ . '/db_config.php';

// 에러 리포팅 (프로덕션에서는 비활성화)
error_reporting(E_ALL);
ini_set('display_errors', 0);

/**
 * JSON 응답 전송
 */
function sendResponse($success, $data = null, $error = null) {
    $response = [
        'success' => $success,
        'timestamp' => date('c')
    ];

    if ($data !== null) {
        $response = array_merge($response, $data);
    }

    if ($error !== null) {
        $response['error'] = $error;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * 데이터베이스 연결
 */
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
            throw new Exception("데이터베이스 연결 실패: " . $conn->connect_error);
        }

        $conn->set_charset("utf8mb4");
        return $conn;

    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 문제 정보 가져오기
 */
function getProblem($problemId) {
    $conn = getDBConnection();

    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.title,
            p.description,
            p.parameters,
            p.correct_answer,
            p.created_at,
            p.updated_at
        FROM
            wavy_problems p
        WHERE
            p.id = ?
    ");

    $stmt->bind_param("s", $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        sendResponse(true, ['problem' => $row]);
    } else {
        sendResponse(false, null, "문제를 찾을 수 없습니다: " . $problemId);
    }

    $stmt->close();
    $conn->close();
}

/**
 * 학생 정보 가져오기
 */
function getStudent($studentId) {
    $conn = getDBConnection();

    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.name,
            s.email,
            s.course_id,
            s.created_at
        FROM
            wavy_students s
        WHERE
            s.id = ?
    ");

    $stmt->bind_param("s", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        sendResponse(true, ['student' => $row]);
    } else {
        sendResponse(false, null, "학생을 찾을 수 없습니다: " . $studentId);
    }

    $stmt->close();
    $conn->close();
}

/**
 * 답안 제출
 */
function submitAnswer($data) {
    $conn = getDBConnection();

    // 입력 데이터 검증
    if (empty($data['problemId']) || empty($data['studentId']) || !isset($data['answer'])) {
        sendResponse(false, null, "필수 데이터가 누락되었습니다.");
    }

    $problemId = $data['problemId'];
    $studentId = $data['studentId'];
    $answer = json_encode($data['answer'], JSON_UNESCAPED_UNICODE);
    $timestamp = $data['timestamp'] ?? date('c');

    // 답안 저장
    $stmt = $conn->prepare("
        INSERT INTO wavy_submissions
        (problem_id, student_id, answer, submitted_at, score)
        VALUES (?, ?, ?, ?, NULL)
    ");

    $stmt->bind_param("ssss", $problemId, $studentId, $answer, $timestamp);

    if ($stmt->execute()) {
        $submissionId = $conn->insert_id;

        // 자동 채점 (선택적)
        $score = autoGrade($conn, $problemId, $data['answer']);

        if ($score !== null) {
            $updateStmt = $conn->prepare("UPDATE wavy_submissions SET score = ? WHERE id = ?");
            $updateStmt->bind_param("di", $score, $submissionId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        sendResponse(true, [
            'submissionId' => $submissionId,
            'score' => $score
        ]);
    } else {
        sendResponse(false, null, "답안 제출 실패: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();
}

/**
 * 자동 채점
 */
function autoGrade($conn, $problemId, $answer) {
    // 문제의 정답 가져오기
    $stmt = $conn->prepare("SELECT correct_answer FROM wavy_problems WHERE id = ?");
    $stmt->bind_param("s", $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $correctAnswer = json_decode($row['correct_answer'], true);

        if (isset($answer['value']) && isset($correctAnswer['value'])) {
            $studentValue = floatval($answer['value']);
            $correctValue = floatval($correctAnswer['value']);

            // 오차 범위 5% 이내면 정답
            $tolerance = 0.05;
            $diff = abs($studentValue - $correctValue);
            $maxDiff = abs($correctValue) * $tolerance;

            if ($diff <= $maxDiff) {
                return 100.0; // 만점
            } else {
                // 부분 점수 계산
                $score = max(0, 100 - ($diff / $maxDiff) * 50);
                return round($score, 2);
            }
        }
    }

    $stmt->close();
    return null;
}

/**
 * Moodle 세션 검증 (선택적)
 */
function validateMoodleSession($sessionKey) {
    // Moodle 세션 검증 로직
    // 실제 Moodle API와 연동 시 구현
    return true;
}

// 메인 라우팅
try {
    $action = $_GET['action'] ?? $_POST['action'] ?? null;

    if (!$action) {
        sendResponse(false, null, "액션이 지정되지 않았습니다.");
    }

    switch ($action) {
        case 'getProblem':
            $problemId = $_GET['id'] ?? null;
            if (!$problemId) {
                sendResponse(false, null, "문제 ID가 필요합니다.");
            }
            getProblem($problemId);
            break;

        case 'getStudent':
            $studentId = $_GET['id'] ?? null;
            if (!$studentId) {
                sendResponse(false, null, "학생 ID가 필요합니다.");
            }
            getStudent($studentId);
            break;

        case 'submitAnswer':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                sendResponse(false, null, "잘못된 요청 데이터입니다.");
            }
            submitAnswer($data);
            break;

        default:
            sendResponse(false, null, "알 수 없는 액션입니다: " . $action);
    }

} catch (Exception $e) {
    sendResponse(false, null, "서버 오류: " . $e->getMessage());
}
?>
