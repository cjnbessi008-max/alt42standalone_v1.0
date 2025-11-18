<?php
/**
 * API Endpoints for Retry Speed Check Feature
 * PHP 7.1.9 Compatible
 *
 * RESTful API endpoints for Moodle integration and retry speed analysis
 */

require_once __DIR__ . '/MoodleLTIIntegration.php';
require_once __DIR__ . '/RetrySpeedAnalyzer.php';

use AltEducation\Moodle\MoodleLTIIntegration;
use AltEducation\Analytics\RetrySpeedAnalyzer;

// Database configuration
$dbConfig = [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => getenv('DB_PORT') ?: '3306',
    'database' => getenv('DB_NAME') ?: 'alt42_education',
    'username' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4'
];

// Database connection
try {
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}";
    $db = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Initialize services
$ltiConfig = [
    'lti_consumer_key' => getenv('LTI_CONSUMER_KEY') ?: 'kaist_lti_key_2025',
    'lti_shared_secret' => getenv('LTI_SHARED_SECRET') ?: 'your_shared_secret',
    'session_timeout' => 3600,
    'grade_sync_enabled' => true,
];

$moodleIntegration = new MoodleLTIIntegration($db, $ltiConfig);
$retryAnalyzer = new RetrySpeedAnalyzer($db);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Route handling
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// ========================================
// API Routes
// ========================================

// POST /api/lti/launch - LTI Launch 처리
if ($requestMethod === 'POST' && $pathParts[1] === 'lti' && $pathParts[2] === 'launch') {
    session_start();

    $ltiParams = $_POST;

    // LTI 요청 검증
    $userData = $moodleIntegration->validateLTIRequest($ltiParams);

    if (!$userData) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid LTI request']);
        exit;
    }

    // 사용자 매핑
    try {
        $localStudentId = $moodleIntegration->mapMoodleUser($userData);
        $sessionToken = $moodleIntegration->createSession($userData, $localStudentId);

        echo json_encode([
            'success' => true,
            'session_token' => $sessionToken,
            'student_id' => $localStudentId,
            'user_data' => $userData
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// POST /api/attempts - 새로운 시도 기록
if ($requestMethod === 'POST' && $pathParts[1] === 'attempts') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    try {
        // 시도 기록
        $attemptId = $retryAnalyzer->recordAttempt($input);

        // 재시도 분석 (2회 이상인 경우)
        $analysis = $retryAnalyzer->analyzeRetrySpeed($input['student_id'], $input['problem_id']);

        // Moodle 성적 동기화 (설정된 경우)
        if (isset($input['moodle_activity_id']) && $input['is_correct']) {
            // 정답률 기반 성적 계산
            $stmt = $db->prepare(
                "SELECT COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
                 FROM student_attempts
                 WHERE student_id = ? AND problem_id = ?"
            );
            $stmt->execute([$input['student_id'], $input['problem_id']]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            $gradeValue = ($stats['correct'] / $stats['total']) * 100;

            $moodleIntegration->syncGradeToMoodle(
                $input['student_id'],
                $input['module_id'] ?? '',
                $gradeValue,
                $input['moodle_activity_id']
            );
        }

        // 응답 생성
        $response = [
            'success' => true,
            'attempt_id' => $attemptId,
            'analysis' => $analysis
        ];

        // 피드백 메시지 추가
        if ($analysis) {
            $response['feedback'] = $retryAnalyzer->generateKoreanFeedback($analysis);
            $response['retry_recommendation'] = $retryAnalyzer->shouldRetry(
                $input['student_id'],
                $input['problem_id']
            );
        }

        echo json_encode($response);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// GET /api/students/{student_id}/retry-improvements - 학생의 재시도 개선 현황 조회
if ($requestMethod === 'GET' && $pathParts[1] === 'students' && $pathParts[3] === 'retry-improvements') {
    $studentId = $pathParts[2];
    $moduleId = $_GET['module_id'] ?? null;

    try {
        $improvements = $retryAnalyzer->getStudentRetryImprovements($studentId, $moduleId);

        echo json_encode([
            'success' => true,
            'student_id' => $studentId,
            'total_improvements' => count($improvements),
            'improvements' => $improvements
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// GET /api/students/{student_id}/problems/{problem_id}/analysis - 특정 문제의 재시도 분석
if ($requestMethod === 'GET' && $pathParts[1] === 'students' && $pathParts[3] === 'problems') {
    $studentId = $pathParts[2];
    $problemId = $pathParts[4];

    try {
        $analysis = $retryAnalyzer->analyzeRetrySpeed($studentId, $problemId);

        if ($analysis) {
            $feedback = $retryAnalyzer->generateKoreanFeedback($analysis);
            $recommendation = $retryAnalyzer->shouldRetry($studentId, $problemId);

            echo json_encode([
                'success' => true,
                'analysis' => $analysis,
                'feedback' => $feedback,
                'retry_recommendation' => $recommendation
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => '분석하기에 시도 횟수가 부족합니다.',
                'analysis' => null
            ]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// GET /api/students/{student_id}/problems/{problem_id}/should-retry - 재시도 권장 여부
if ($requestMethod === 'GET' && $pathParts[1] === 'students' && $pathParts[5] === 'should-retry') {
    $studentId = $pathParts[2];
    $problemId = $pathParts[4];

    try {
        $recommendation = $retryAnalyzer->shouldRetry($studentId, $problemId);

        echo json_encode([
            'success' => true,
            'recommendation' => $recommendation
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// GET /api/students/{student_id}/problems/{problem_id}/attempts - 모든 시도 기록 조회
if ($requestMethod === 'GET' && $pathParts[1] === 'students' && $pathParts[5] === 'attempts') {
    $studentId = $pathParts[2];
    $problemId = $pathParts[4];

    try {
        $stmt = $db->prepare(
            "SELECT id, attempt_number, student_answer, is_correct,
                    time_spent_seconds, started_at, completed_at
             FROM student_attempts
             WHERE student_id = ? AND problem_id = ?
             ORDER BY attempt_number ASC"
        );
        $stmt->execute([$studentId, $problemId]);
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // JSON 필드 디코딩
        foreach ($attempts as &$attempt) {
            $attempt['student_answer'] = json_decode($attempt['student_answer'], true);
        }

        echo json_encode([
            'success' => true,
            'total_attempts' => count($attempts),
            'attempts' => $attempts
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch attempts']);
    }

    exit;
}

// GET /api/students/{student_id}/progress - 학생 진행상황 조회
if ($requestMethod === 'GET' && $pathParts[1] === 'students' && $pathParts[3] === 'progress') {
    $studentId = $pathParts[2];
    $moduleId = $_GET['module_id'] ?? null;

    try {
        if ($moduleId) {
            $stmt = $db->prepare(
                "SELECT * FROM student_progress WHERE student_id = ? AND module_id = ?"
            );
            $stmt->execute([$studentId, $moduleId]);
        } else {
            $stmt = $db->prepare(
                "SELECT * FROM student_progress WHERE student_id = ?"
            );
            $stmt->execute([$studentId]);
        }

        $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'progress' => $progress
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch progress']);
    }

    exit;
}

// GET /api/modules/{module_id}/statistics - 모듈 통계 조회
if ($requestMethod === 'GET' && $pathParts[1] === 'modules' && $pathParts[3] === 'statistics') {
    $moduleId = $pathParts[2];

    try {
        $stmt = $db->prepare(
            "SELECT * FROM v_module_statistics WHERE module_id = ?"
        );
        $stmt->execute([$moduleId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($stats) {
            echo json_encode([
                'success' => true,
                'statistics' => $stats
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Module not found']);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch statistics']);
    }

    exit;
}

// POST /api/moodle/sync-grade - Moodle 성적 수동 동기화
if ($requestMethod === 'POST' && $pathParts[1] === 'moodle' && $pathParts[2] === 'sync-grade') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['student_id'], $input['module_id'], $input['grade_value'], $input['activity_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        exit;
    }

    try {
        $result = $moodleIntegration->syncGradeToMoodle(
            $input['student_id'],
            $input['module_id'],
            $input['grade_value'],
            $input['activity_id']
        );

        echo json_encode([
            'success' => $result,
            'message' => $result ? 'Grade synced successfully' : 'Failed to sync grade'
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    exit;
}

// GET /api/health - 헬스 체크
if ($requestMethod === 'GET' && $pathParts[1] === 'health') {
    try {
        $db->query('SELECT 1');

        echo json_encode([
            'success' => true,
            'status' => 'healthy',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ]);

    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'status' => 'unhealthy',
            'error' => 'Database connection failed'
        ]);
    }

    exit;
}

// 404 - Route not found
http_response_code(404);
echo json_encode([
    'error' => 'Route not found',
    'path' => $path,
    'method' => $requestMethod
]);
