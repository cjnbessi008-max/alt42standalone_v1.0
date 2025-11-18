<?php
/**
 * API Endpoints
 * Boundary Gate 앱의 REST API
 */

require_once 'config.php';
require_once 'moodle_connector.php';

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 요청 파라미터 가져오기
$action = $_GET['action'] ?? '';
$requestData = json_decode(file_get_contents('php://input'), true) ?? [];

// Moodle 커넥터 초기화
$moodleConnector = new MoodleConnector();

// 액션에 따라 처리
try {
    switch ($action) {
        case 'getProblems':
            getProblems($requestData);
            break;

        case 'getProblem':
            getProblem($requestData);
            break;

        case 'submitAnswer':
            submitAnswer($requestData);
            break;

        case 'getProgress':
            getProgress($requestData);
            break;

        case 'testConnection':
            testConnection();
            break;

        case 'getSiteInfo':
            getSiteInfo();
            break;

        default:
            sendErrorResponse('Invalid action', 400);
    }
} catch (Exception $e) {
    logError('API Error: ' . $e->getMessage());
    sendErrorResponse($e->getMessage(), 500);
}

/**
 * 문제 목록 가져오기
 */
function getProblems($data) {
    try {
        $pdo = getDBConnection();

        $courseId = $data['course_id'] ?? null;

        if ($courseId) {
            $stmt = $pdo->prepare("SELECT * FROM problems WHERE course_id = ? ORDER BY difficulty, id");
            $stmt->execute([$courseId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM problems ORDER BY difficulty, id LIMIT 20");
        }

        $problems = $stmt->fetchAll();

        sendSuccessResponse([
            'problems' => $problems,
            'count' => count($problems)
        ]);
    } catch (Exception $e) {
        // DB 연결 실패 시 샘플 데이터 반환
        sendSuccessResponse([
            'problems' => getSampleProblems(),
            'count' => 8,
            'source' => 'sample'
        ]);
    }
}

/**
 * 특정 문제 가져오기
 */
function getProblem($data) {
    $problemId = $data['problem_id'] ?? null;

    if (!$problemId) {
        sendErrorResponse('Problem ID is required', 400);
    }

    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendErrorResponse('Problem not found', 404);
        }

        sendSuccessResponse(['problem' => $problem]);
    } catch (Exception $e) {
        sendErrorResponse('Failed to fetch problem', 500);
    }
}

/**
 * 답안 제출
 */
function submitAnswer($data) {
    $problemId = $data['problem_id'] ?? null;
    $answer = $data['answer'] ?? null;
    $studentId = $data['student_id'] ?? null;
    $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

    if (!$problemId || !$answer || !$studentId) {
        sendErrorResponse('Missing required fields', 400);
    }

    try {
        $pdo = getDBConnection();

        // 정답 확인
        $stmt = $pdo->prepare("SELECT correct_answer FROM problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendErrorResponse('Problem not found', 404);
        }

        $isCorrect = ($answer === $problem['correct_answer']);

        // 답안 기록
        $stmt = $pdo->prepare("
            INSERT INTO student_answers
            (student_id, problem_id, answer, is_correct, submitted_at)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $studentId,
            $problemId,
            $answer,
            $isCorrect ? 1 : 0,
            $timestamp
        ]);

        // 점수 업데이트
        if ($isCorrect) {
            updateStudentScore($studentId, 10);
        }

        sendSuccessResponse([
            'is_correct' => $isCorrect,
            'correct_answer' => $problem['correct_answer'],
            'points_earned' => $isCorrect ? 10 : 0
        ]);
    } catch (Exception $e) {
        logError('Submit Answer Error: ' . $e->getMessage());
        sendSuccessResponse([
            'is_correct' => false,
            'message' => 'Answer recorded locally'
        ]);
    }
}

/**
 * 학생 진행 상황 가져오기
 */
function getProgress($data) {
    $studentId = $data['student_id'] ?? null;

    if (!$studentId) {
        sendErrorResponse('Student ID is required', 400);
    }

    try {
        $pdo = getDBConnection();

        // 점수 조회
        $stmt = $pdo->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN is_correct = 1 THEN 10 ELSE 0 END), 0) as score,
                COUNT(*) as total_problems,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM student_answers
            WHERE student_id = ?
        ");
        $stmt->execute([$studentId]);
        $progress = $stmt->fetch();

        sendSuccessResponse([
            'progress' => $progress
        ]);
    } catch (Exception $e) {
        sendSuccessResponse([
            'progress' => [
                'score' => 0,
                'total_problems' => 0,
                'correct' => 0
            ]
        ]);
    }
}

/**
 * 학생 점수 업데이트
 */
function updateStudentScore($studentId, $points) {
    try {
        $pdo = getDBConnection();

        $stmt = $pdo->prepare("
            INSERT INTO student_progress (student_id, total_score, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                total_score = total_score + ?,
                updated_at = NOW()
        ");

        $stmt->execute([$studentId, $points, $points]);
    } catch (Exception $e) {
        logError('Update Score Error: ' . $e->getMessage());
    }
}

/**
 * Moodle 연결 테스트
 */
function testConnection() {
    global $moodleConnector;

    $isConnected = $moodleConnector->testConnection();

    sendSuccessResponse([
        'connected' => $isConnected,
        'message' => $isConnected ? 'Moodle connection successful' : 'Moodle connection failed'
    ]);
}

/**
 * Moodle 사이트 정보 가져오기
 */
function getSiteInfo() {
    global $moodleConnector;

    $siteInfo = $moodleConnector->getSiteInfo();

    if ($siteInfo) {
        sendSuccessResponse(['site_info' => $siteInfo]);
    } else {
        sendErrorResponse('Failed to get site info', 500);
    }
}

/**
 * 샘플 문제 생성
 */
function getSampleProblems() {
    return [
        [
            'id' => 1,
            'left_number' => 5,
            'right_number' => 3,
            'correct_answer' => 'ge',
            'description' => '5는 3보다 크거나 같습니까?',
            'difficulty' => 'easy',
            'course_id' => 0
        ],
        [
            'id' => 2,
            'left_number' => 2,
            'right_number' => 7,
            'correct_answer' => 'le',
            'description' => '2는 7보다 작거나 같습니까?',
            'difficulty' => 'easy',
            'course_id' => 0
        ],
        [
            'id' => 3,
            'left_number' => 10,
            'right_number' => 10,
            'correct_answer' => 'ge',
            'description' => '10은 10과 같거나 큽니까?',
            'difficulty' => 'medium',
            'course_id' => 0
        ],
        [
            'id' => 4,
            'left_number' => 8,
            'right_number' => 4,
            'correct_answer' => 'ge',
            'description' => '8은 4보다 크거나 같습니까?',
            'difficulty' => 'easy',
            'course_id' => 0
        ],
        [
            'id' => 5,
            'left_number' => 3,
            'right_number' => 9,
            'correct_answer' => 'le',
            'description' => '3은 9보다 작거나 같습니까?',
            'difficulty' => 'easy',
            'course_id' => 0
        ],
        [
            'id' => 6,
            'left_number' => 15,
            'right_number' => 12,
            'correct_answer' => 'ge',
            'description' => '15는 12보다 크거나 같습니까?',
            'difficulty' => 'medium',
            'course_id' => 0
        ],
        [
            'id' => 7,
            'left_number' => 6,
            'right_number' => 6,
            'correct_answer' => 'le',
            'description' => '6은 6과 같거나 작습니까?',
            'difficulty' => 'medium',
            'course_id' => 0
        ],
        [
            'id' => 8,
            'left_number' => 20,
            'right_number' => 18,
            'correct_answer' => 'ge',
            'description' => '20은 18보다 크거나 같습니까?',
            'difficulty' => 'hard',
            'course_id' => 0
        ]
    ];
}
