<?php
/**
 * Moodle Integration API for Transform Scene
 * Moodle 3.7 호환, PHP 7.1.9, MySQL 5.7
 *
 * 이 API는 Moodle LMS에서 문제 데이터를 가져와서
 * Transform Scene 컴포넌트에 제공합니다.
 */

// CORS 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Moodle 설정 파일 로드
require_once(__DIR__ . '/../../config/moodle_config.php');

// 데이터베이스 연결
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// 연결 확인
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => '데이터베이스 연결에 실패했습니다.'
    ]);
    exit;
}

// 문자 인코딩 설정
$mysqli->set_charset('utf8mb4');

/**
 * 문제 데이터를 가져오는 함수
 */
function getProblemData($mysqli, $problemId) {
    $stmt = $mysqli->prepare("
        SELECT
            p.id,
            p.problem_type,
            p.original_function,
            p.target_function,
            p.transform_type,
            p.transform_params,
            p.difficulty,
            p.description,
            p.hints,
            p.created_at,
            p.updated_at
        FROM transform_problems p
        WHERE p.id = ? AND p.status = 'active'
    ");

    if (!$stmt) {
        return [
            'success' => false,
            'error' => 'Query preparation failed',
            'message' => '쿼리 준비에 실패했습니다.'
        ];
    }

    $stmt->bind_param('i', $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return [
            'success' => false,
            'error' => 'Problem not found',
            'message' => '문제를 찾을 수 없습니다.'
        ];
    }

    $problem = $result->fetch_assoc();
    $stmt->close();

    // JSON 필드 파싱
    if ($problem['transform_params']) {
        $problem['transform_params'] = json_decode($problem['transform_params'], true);
    }
    if ($problem['hints']) {
        $problem['hints'] = json_decode($problem['hints'], true);
    }

    return [
        'success' => true,
        'data' => [
            'id' => intval($problem['id']),
            'problemType' => $problem['problem_type'],
            'originalFunction' => $problem['original_function'],
            'targetFunction' => $problem['target_function'],
            'transformType' => $problem['transform_type'],
            'transformParams' => $problem['transform_params'],
            'difficulty' => $problem['difficulty'],
            'description' => $problem['description'],
            'hints' => $problem['hints'],
            'createdAt' => $problem['created_at'],
            'updatedAt' => $problem['updated_at']
        ]
    ];
}

/**
 * 학생 답안을 저장하는 함수
 */
function saveStudentAnswer($mysqli, $studentId, $problemId, $answer, $isCorrect) {
    $stmt = $mysqli->prepare("
        INSERT INTO transform_answers
        (student_id, problem_id, answer_data, is_correct, submitted_at)
        VALUES (?, ?, ?, ?, NOW())
    ");

    if (!$stmt) {
        return [
            'success' => false,
            'error' => 'Query preparation failed',
            'message' => '쿼리 준비에 실패했습니다.'
        ];
    }

    $answerJson = json_encode($answer);
    $correctInt = $isCorrect ? 1 : 0;

    $stmt->bind_param('iisi', $studentId, $problemId, $answerJson, $correctInt);

    if ($stmt->execute()) {
        $answerId = $stmt->insert_id;
        $stmt->close();

        return [
            'success' => true,
            'data' => [
                'answerId' => $answerId,
                'message' => '답안이 저장되었습니다.'
            ]
        ];
    } else {
        $stmt->close();
        return [
            'success' => false,
            'error' => 'Insert failed',
            'message' => '답안 저장에 실패했습니다.'
        ];
    }
}

/**
 * 학생의 진행 상황을 가져오는 함수
 */
function getStudentProgress($mysqli, $studentId, $courseId = null) {
    $query = "
        SELECT
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
            AVG(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy_rate
        FROM transform_answers
        WHERE student_id = ?
    ";

    if ($courseId !== null) {
        $query .= " AND problem_id IN (SELECT id FROM transform_problems WHERE course_id = ?)";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('ii', $studentId, $courseId);
    } else {
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('i', $studentId);
    }

    if (!$stmt) {
        return [
            'success' => false,
            'error' => 'Query preparation failed'
        ];
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $progress = $result->fetch_assoc();
    $stmt->close();

    return [
        'success' => true,
        'data' => [
            'studentId' => intval($studentId),
            'totalAttempts' => intval($progress['total_attempts']),
            'correctAnswers' => intval($progress['correct_answers']),
            'accuracyRate' => round(floatval($progress['accuracy_rate']), 2)
        ]
    ];
}

// 요청 처리
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_problem':
        $problemId = isset($_GET['id']) ? intval($_GET['id']) : 0;

        if ($problemId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid problem ID',
                'message' => '유효하지 않은 문제 ID입니다.'
            ]);
            break;
        }

        $response = getProblemData($mysqli, $problemId);

        if ($response['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }

        echo json_encode($response);
        break;

    case 'save_answer':
        // POST 요청 처리
        $postData = json_decode(file_get_contents('php://input'), true);

        $studentId = isset($postData['studentId']) ? intval($postData['studentId']) : 0;
        $problemId = isset($postData['problemId']) ? intval($postData['problemId']) : 0;
        $answer = isset($postData['answer']) ? $postData['answer'] : null;
        $isCorrect = isset($postData['isCorrect']) ? boolval($postData['isCorrect']) : false;

        if ($studentId <= 0 || $problemId <= 0 || $answer === null) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid parameters',
                'message' => '유효하지 않은 매개변수입니다.'
            ]);
            break;
        }

        $response = saveStudentAnswer($mysqli, $studentId, $problemId, $answer, $isCorrect);

        if ($response['success']) {
            http_response_code(201);
        } else {
            http_response_code(500);
        }

        echo json_encode($response);
        break;

    case 'get_progress':
        $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
        $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;

        if ($studentId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid student ID',
                'message' => '유효하지 않은 학생 ID입니다.'
            ]);
            break;
        }

        $response = getStudentProgress($mysqli, $studentId, $courseId);

        if ($response['success']) {
            http_response_code(200);
        } else {
            http_response_code(500);
        }

        echo json_encode($response);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action',
            'message' => '유효하지 않은 작업입니다.'
        ]);
        break;
}

// 연결 종료
$mysqli->close();
?>
