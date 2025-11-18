<?php
/**
 * Moodle API Connector
 * 접선 경사도 문제 정보를 Moodle에서 가져오기
 */

require_once 'config.php';

// CORS 헤더
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POST 데이터 받기
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendJSONResponse([
        'success' => false,
        'message' => 'Invalid JSON input'
    ], 400);
}

$action = isset($data['action']) ? sanitizeInput($data['action']) : '';

// 액션 라우팅
switch ($action) {
    case 'get_problem':
        handleGetProblem($data);
        break;

    case 'submit_answer':
        handleSubmitAnswer($data);
        break;

    case 'get_problem_list':
        handleGetProblemList($data);
        break;

    default:
        sendJSONResponse([
            'success' => false,
            'message' => 'Unknown action'
        ], 400);
}

/**
 * 문제 정보 가져오기
 */
function handleGetProblem($data) {
    $problemId = isset($data['problem_id']) ? intval($data['problem_id']) : null;

    if (DEV_MODE) {
        // 개발 모드: 샘플 데이터 반환
        $sampleProblems = [
            [
                'id' => 1,
                'title' => '이차함수의 접선',
                'description' => 'y = x² 함수에서 x = 2일 때 접선의 기울기를 구하시오.',
                'function_type' => 'quadratic',
                'x_point' => 2,
                'show_tangent' => true,
                'answer' => 4
            ],
            [
                'id' => 2,
                'title' => '삼차함수의 접선',
                'description' => 'y = x³ - 2x 함수에서 x = 1일 때 접선의 기울기를 구하시오.',
                'function_type' => 'cubic',
                'x_point' => 1,
                'show_tangent' => true,
                'answer' => 1
            ],
            [
                'id' => 3,
                'title' => '사인함수의 접선',
                'description' => 'y = sin(x) 함수에서 x = 0일 때 접선의 기울기를 구하시오.',
                'function_type' => 'sine',
                'x_point' => 0,
                'show_tangent' => true,
                'answer' => 1
            ]
        ];

        $problem = $problemId !== null && isset($sampleProblems[$problemId - 1])
            ? $sampleProblems[$problemId - 1]
            : $sampleProblems[array_rand($sampleProblems)];

        sendJSONResponse([
            'success' => true,
            'problem' => $problem,
            'message' => '문제를 불러왔습니다. (개발 모드)'
        ]);
    } else {
        // 실제 Moodle 연동
        $db = getDBConnection();

        if (!$db) {
            sendJSONResponse([
                'success' => false,
                'message' => 'Database connection failed'
            ], 500);
        }

        try {
            $query = "SELECT
                        q.id,
                        q.name as title,
                        q.questiontext as description,
                        qc.function_type,
                        qc.x_point,
                        qc.show_tangent,
                        qa.answer
                      FROM mdl_question q
                      JOIN mdl_question_tangent_config qc ON q.id = qc.question_id
                      LEFT JOIN mdl_question_answers qa ON q.id = qa.question
                      WHERE q.qtype = 'tangent_slope'";

            if ($problemId !== null) {
                $query .= " AND q.id = :problem_id";
                $stmt = $db->prepare($query);
                $stmt->execute(['problem_id' => $problemId]);
            } else {
                $query .= " ORDER BY RAND() LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->execute();
            }

            $problem = $stmt->fetch();

            if ($problem) {
                sendJSONResponse([
                    'success' => true,
                    'problem' => $problem,
                    'message' => '문제를 불러왔습니다.'
                ]);
            } else {
                sendJSONResponse([
                    'success' => false,
                    'message' => '문제를 찾을 수 없습니다.'
                ], 404);
            }
        } catch (PDOException $e) {
            logError("Database query failed: " . $e->getMessage());
            sendJSONResponse([
                'success' => false,
                'message' => 'Database query failed'
            ], 500);
        }
    }
}

/**
 * 답안 제출
 */
function handleSubmitAnswer($data) {
    $problemId = isset($data['problem_id']) ? intval($data['problem_id']) : null;
    $userAnswer = isset($data['answer']) ? floatval($data['answer']) : null;
    $userId = isset($data['user_id']) ? intval($data['user_id']) : null;

    if ($problemId === null || $userAnswer === null) {
        sendJSONResponse([
            'success' => false,
            'message' => 'Missing problem_id or answer'
        ], 400);
    }

    if (DEV_MODE) {
        // 개발 모드: 간단한 검증
        $correctAnswer = 4.0; // 예시
        $tolerance = 0.1;
        $isCorrect = abs($userAnswer - $correctAnswer) < $tolerance;

        sendJSONResponse([
            'success' => true,
            'correct' => $isCorrect,
            'user_answer' => $userAnswer,
            'correct_answer' => $correctAnswer,
            'message' => $isCorrect ? '정답입니다!' : '틀렸습니다. 다시 시도해보세요.'
        ]);
    } else {
        // 실제 Moodle 연동
        $db = getDBConnection();

        if (!$db) {
            sendJSONResponse([
                'success' => false,
                'message' => 'Database connection failed'
            ], 500);
        }

        try {
            // 정답 가져오기
            $stmt = $db->prepare("
                SELECT qa.answer, qa.fraction
                FROM mdl_question_answers qa
                WHERE qa.question = :problem_id
                ORDER BY qa.fraction DESC
                LIMIT 1
            ");
            $stmt->execute(['problem_id' => $problemId]);
            $correctAnswerData = $stmt->fetch();

            if (!$correctAnswerData) {
                sendJSONResponse([
                    'success' => false,
                    'message' => '정답 정보를 찾을 수 없습니다.'
                ], 404);
            }

            $correctAnswer = floatval($correctAnswerData['answer']);
            $tolerance = 0.1;
            $isCorrect = abs($userAnswer - $correctAnswer) < $tolerance;

            // 답안 기록 저장
            if ($userId !== null) {
                $stmt = $db->prepare("
                    INSERT INTO mdl_question_attempts
                    (questionid, userid, answer, fraction, timecreated)
                    VALUES (:question_id, :user_id, :answer, :fraction, :time)
                ");
                $stmt->execute([
                    'question_id' => $problemId,
                    'user_id' => $userId,
                    'answer' => $userAnswer,
                    'fraction' => $isCorrect ? 1.0 : 0.0,
                    'time' => time()
                ]);
            }

            sendJSONResponse([
                'success' => true,
                'correct' => $isCorrect,
                'user_answer' => $userAnswer,
                'correct_answer' => $correctAnswer,
                'message' => $isCorrect ? '정답입니다!' : '틀렸습니다. 다시 시도해보세요.'
            ]);
        } catch (PDOException $e) {
            logError("Database query failed: " . $e->getMessage());
            sendJSONResponse([
                'success' => false,
                'message' => 'Database operation failed'
            ], 500);
        }
    }
}

/**
 * 문제 목록 가져오기
 */
function handleGetProblemList($data) {
    $limit = isset($data['limit']) ? intval($data['limit']) : 10;
    $offset = isset($data['offset']) ? intval($data['offset']) : 0;

    if (DEV_MODE) {
        // 개발 모드: 샘플 문제 목록
        $problems = [
            [
                'id' => 1,
                'title' => '이차함수의 접선',
                'difficulty' => 'easy',
                'function_type' => 'quadratic'
            ],
            [
                'id' => 2,
                'title' => '삼차함수의 접선',
                'difficulty' => 'medium',
                'function_type' => 'cubic'
            ],
            [
                'id' => 3,
                'title' => '사인함수의 접선',
                'difficulty' => 'medium',
                'function_type' => 'sine'
            ],
            [
                'id' => 4,
                'title' => '지수함수의 접선',
                'difficulty' => 'hard',
                'function_type' => 'exponential'
            ]
        ];

        sendJSONResponse([
            'success' => true,
            'problems' => array_slice($problems, $offset, $limit),
            'total' => count($problems)
        ]);
    } else {
        // 실제 Moodle 연동
        $db = getDBConnection();

        if (!$db) {
            sendJSONResponse([
                'success' => false,
                'message' => 'Database connection failed'
            ], 500);
        }

        try {
            // 전체 개수
            $countStmt = $db->prepare("
                SELECT COUNT(*) as total
                FROM mdl_question
                WHERE qtype = 'tangent_slope'
            ");
            $countStmt->execute();
            $total = $countStmt->fetch()['total'];

            // 문제 목록
            $stmt = $db->prepare("
                SELECT
                    q.id,
                    q.name as title,
                    qc.function_type,
                    qc.difficulty
                FROM mdl_question q
                JOIN mdl_question_tangent_config qc ON q.id = qc.question_id
                WHERE q.qtype = 'tangent_slope'
                ORDER BY q.id DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $problems = $stmt->fetchAll();

            sendJSONResponse([
                'success' => true,
                'problems' => $problems,
                'total' => $total
            ]);
        } catch (PDOException $e) {
            logError("Database query failed: " . $e->getMessage());
            sendJSONResponse([
                'success' => false,
                'message' => 'Database query failed'
            ], 500);
        }
    }
}
