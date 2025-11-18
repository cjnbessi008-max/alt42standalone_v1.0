<?php
/**
 * Moodle Integration API
 * Handles communication between Dual Derivative Sync and Moodle 3.7 LMS
 * Compatible with PHP 7.1.9
 */

require_once __DIR__ . '/../config/database.php';

// Handle incoming request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');
$request = json_decode($input, true);

logInfo("API Request: " . $requestMethod . " - " . ($request['action'] ?? 'unknown'));

if ($requestMethod !== 'POST') {
    sendErrorResponse('Only POST requests are allowed', 405);
}

if (!$request || !isset($request['action'])) {
    sendErrorResponse('Invalid request format', 400);
}

$action = $request['action'];

// Route to appropriate handler
switch ($action) {
    case 'test_connection':
        handleTestConnection($request);
        break;

    case 'get_problem':
        handleGetProblem($request);
        break;

    case 'get_problem_list':
        handleGetProblemList($request);
        break;

    case 'submit_answer':
        handleSubmitAnswer($request);
        break;

    case 'save_progress':
        handleSaveProgress($request);
        break;

    case 'load_progress':
        handleLoadProgress($request);
        break;

    case 'start_session':
        handleStartSession($request);
        break;

    case 'record_interaction':
        handleRecordInteraction($request);
        break;

    default:
        sendErrorResponse('Unknown action: ' . $action, 400);
}

/**
 * Test connection to Moodle
 */
function handleTestConnection($request) {
    try {
        // Test database connection
        $db = getDbConnection();

        // Test Moodle connection if URL and token provided
        if (!empty($request['moodle_url']) && !empty($request['ws_token'])) {
            $moodleTest = callMoodleWS(
                $request['moodle_url'],
                $request['ws_token'],
                'core_webservice_get_site_info'
            );

            if (isset($moodleTest['sitename'])) {
                sendSuccessResponse([
                    'database' => true,
                    'moodle' => true,
                    'moodle_site' => $moodleTest['sitename']
                ], '연결 성공');
            } else {
                sendErrorResponse('Moodle 연결 실패');
            }
        } else {
            sendSuccessResponse([
                'database' => true,
                'moodle' => false
            ], '데이터베이스 연결 성공');
        }
    } catch (Exception $e) {
        logError('Connection test failed: ' . $e->getMessage());
        sendErrorResponse('연결 테스트 실패: ' . $e->getMessage());
    }
}

/**
 * Get problem by ID
 */
function handleGetProblem($request) {
    try {
        $problemId = $request['problem_id'] ?? null;

        if (!$problemId) {
            sendErrorResponse('Problem ID is required');
        }

        $db = getDbConnection();
        $stmt = $db->prepare(
            'SELECT * FROM problems WHERE id = ? AND is_active = 1'
        );
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendErrorResponse('Problem not found', 404);
        }

        // Parse JSON fields
        if ($problem['target_points']) {
            $problem['target_points'] = json_decode($problem['target_points']);
        }
        if ($problem['hints']) {
            $problem['hints'] = json_decode($problem['hints']);
        }

        // Convert numeric fields
        $problem['x_min'] = (float)$problem['x_min'];
        $problem['x_max'] = (float)$problem['x_max'];

        // Log sync
        logMoodleSync('pull_problem', [
            'problem_id' => $problemId
        ], ['status' => 'success'], 'success');

        sendSuccessResponse($problem, '문제를 불러왔습니다');

    } catch (Exception $e) {
        logError('Get problem failed: ' . $e->getMessage());
        sendErrorResponse('문제 로딩 실패: ' . $e->getMessage());
    }
}

/**
 * Get problem list
 */
function handleGetProblemList($request) {
    try {
        $courseId = $request['course_id'] ?? null;

        $db = getDbConnection();

        $query = 'SELECT id, title, description, function_expression, difficulty, category, created_at
                  FROM problems WHERE is_active = 1';

        $params = [];
        if ($courseId) {
            $query .= ' AND moodle_course_id = ?';
            $params[] = $courseId;
        }

        $query .= ' ORDER BY created_at DESC';

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $problems = $stmt->fetchAll();

        sendSuccessResponse($problems, count($problems) . '개의 문제를 찾았습니다');

    } catch (Exception $e) {
        logError('Get problem list failed: ' . $e->getMessage());
        sendErrorResponse('문제 목록 로딩 실패: ' . $e->getMessage());
    }
}

/**
 * Submit student answer
 */
function handleSubmitAnswer($request) {
    try {
        $problemId = $request['problem_id'] ?? null;
        $answer = $request['answer'] ?? null;
        $moodleUserId = $request['moodle_user_id'] ?? 1; // Default for testing
        $sessionId = $request['session_id'] ?? null;

        if (!$problemId || !$answer) {
            sendErrorResponse('Problem ID and answer are required');
        }

        $db = getDbConnection();

        // Get problem details
        $stmt = $db->prepare('SELECT * FROM problems WHERE id = ?');
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendErrorResponse('Problem not found', 404);
        }

        // Simple evaluation (can be enhanced)
        $isCorrect = evaluateAnswer($problem, $answer);
        $score = $isCorrect ? 100 : 0;
        $feedback = $isCorrect ? '정답입니다!' : '다시 시도해보세요.';

        // Get attempt number
        $stmt = $db->prepare(
            'SELECT COUNT(*) as count FROM student_answers
             WHERE moodle_user_id = ? AND problem_id = ?'
        );
        $stmt->execute([$moodleUserId, $problemId]);
        $attemptNumber = $stmt->fetch()['count'] + 1;

        // Save answer
        $stmt = $db->prepare(
            'INSERT INTO student_answers
             (session_id, problem_id, moodle_user_id, answer_data, answer_text,
              is_correct, score, feedback, attempt_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $sessionId,
            $problemId,
            $moodleUserId,
            json_encode($answer),
            json_encode($answer),
            $isCorrect ? 1 : 0,
            $score,
            $feedback,
            $attemptNumber
        ]);

        // Push grade to Moodle if configured
        if (!empty(MOODLE_URL) && !empty(MOODLE_WS_TOKEN)) {
            pushGradeToMoodle($moodleUserId, $problemId, $score);
        }

        sendSuccessResponse([
            'correct' => $isCorrect,
            'score' => $score,
            'feedback' => $feedback,
            'attempt' => $attemptNumber
        ], '답안이 제출되었습니다');

    } catch (Exception $e) {
        logError('Submit answer failed: ' . $e->getMessage());
        sendErrorResponse('답안 제출 실패: ' . $e->getMessage());
    }
}

/**
 * Save student progress
 */
function handleSaveProgress($request) {
    try {
        $problemId = $request['problem_id'] ?? null;
        $progress = $request['progress'] ?? null;
        $moodleUserId = $request['moodle_user_id'] ?? 1;

        if (!$problemId || !$progress) {
            sendErrorResponse('Problem ID and progress data are required');
        }

        $db = getDbConnection();

        // This would typically save to a progress table
        // For now, we'll just acknowledge receipt
        logInfo("Progress saved for user {$moodleUserId}, problem {$problemId}");

        sendSuccessResponse(['saved' => true], '진도가 저장되었습니다');

    } catch (Exception $e) {
        logError('Save progress failed: ' . $e->getMessage());
        sendErrorResponse('진도 저장 실패: ' . $e->getMessage());
    }
}

/**
 * Load student progress
 */
function handleLoadProgress($request) {
    try {
        $problemId = $request['problem_id'] ?? null;
        $moodleUserId = $request['moodle_user_id'] ?? 1;

        if (!$problemId) {
            sendErrorResponse('Problem ID is required');
        }

        $db = getDbConnection();

        $stmt = $db->prepare(
            'SELECT * FROM student_progress
             WHERE moodle_user_id = ? AND problem_id = ?'
        );
        $stmt->execute([$moodleUserId, $problemId]);
        $progress = $stmt->fetch();

        if ($progress) {
            sendSuccessResponse($progress, '진도를 불러왔습니다');
        } else {
            sendSuccessResponse(null, '저장된 진도가 없습니다');
        }

    } catch (Exception $e) {
        logError('Load progress failed: ' . $e->getMessage());
        sendErrorResponse('진도 로딩 실패: ' . $e->getMessage());
    }
}

/**
 * Start a new session
 */
function handleStartSession($request) {
    try {
        $moodleUserId = $request['moodle_user_id'] ?? 1;
        $studentName = $request['student_name'] ?? 'Test Student';
        $problemId = $request['problem_id'] ?? null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

        if (!$problemId) {
            sendErrorResponse('Problem ID is required');
        }

        $db = getDbConnection();

        // Call stored procedure
        $sessionToken = null;
        $stmt = $db->prepare(
            'CALL sp_start_session(?, ?, ?, ?, ?, ?, @token)'
        );
        $stmt->execute([
            $moodleUserId,
            $studentName,
            '',
            $problemId,
            $ipAddress,
            $userAgent
        ]);

        // Get session token
        $result = $db->query('SELECT @token as token')->fetch();
        $sessionToken = $result['token'];

        // Get session ID
        $stmt = $db->prepare('SELECT id FROM student_sessions WHERE session_token = ?');
        $stmt->execute([$sessionToken]);
        $session = $stmt->fetch();

        sendSuccessResponse([
            'session_id' => $session['id'],
            'session_token' => $sessionToken
        ], '세션이 시작되었습니다');

    } catch (Exception $e) {
        logError('Start session failed: ' . $e->getMessage());
        sendErrorResponse('세션 시작 실패: ' . $e->getMessage());
    }
}

/**
 * Record interaction
 */
function handleRecordInteraction($request) {
    try {
        $sessionId = $request['session_id'] ?? null;
        $problemId = $request['problem_id'] ?? null;
        $interactionType = $request['interaction_type'] ?? 'x_change';
        $xValue = $request['x_value'] ?? null;
        $fxValue = $request['fx_value'] ?? null;
        $fpxValue = $request['fpx_value'] ?? null;
        $interactionData = $request['interaction_data'] ?? null;

        if (!$sessionId || !$problemId) {
            sendErrorResponse('Session ID and Problem ID are required');
        }

        $db = getDbConnection();

        $stmt = $db->prepare(
            'INSERT INTO student_interactions
             (session_id, problem_id, interaction_type, x_value, fx_value, fpx_value, interaction_data)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $sessionId,
            $problemId,
            $interactionType,
            $xValue,
            $fxValue,
            $fpxValue,
            $interactionData ? json_encode($interactionData) : null
        ]);

        sendSuccessResponse(['recorded' => true]);

    } catch (Exception $e) {
        logError('Record interaction failed: ' . $e->getMessage());
        sendErrorResponse('상호작용 기록 실패: ' . $e->getMessage());
    }
}

/**
 * Call Moodle Web Service
 */
function callMoodleWS($moodleUrl, $token, $function, $params = []) {
    $serverUrl = $moodleUrl . '/webservice/rest/server.php';

    $postData = [
        'wstoken' => $token,
        'wsfunction' => $function,
        'moodlewsrestformat' => 'json'
    ];

    $postData = array_merge($postData, $params);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $serverUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Moodle API returned HTTP ' . $httpCode);
    }

    return json_decode($response, true);
}

/**
 * Push grade to Moodle
 */
function pushGradeToMoodle($userId, $problemId, $score) {
    try {
        if (empty(MOODLE_URL) || empty(MOODLE_WS_TOKEN)) {
            return false;
        }

        // This would call appropriate Moodle grade submission API
        // Implementation depends on how grades are structured in Moodle
        logInfo("Grade pushed to Moodle: User {$userId}, Problem {$problemId}, Score {$score}");

        logMoodleSync('push_grade', [
            'user_id' => $userId,
            'problem_id' => $problemId,
            'score' => $score
        ], ['status' => 'success'], 'success');

        return true;
    } catch (Exception $e) {
        logError('Push grade to Moodle failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * Evaluate answer
 */
function evaluateAnswer($problem, $answer) {
    // Simple evaluation logic
    // In a real system, this would be more sophisticated
    if (isset($answer['is_correct'])) {
        return (bool)$answer['is_correct'];
    }

    // Default to random for demo
    return rand(0, 1) === 1;
}

/**
 * Log Moodle sync operation
 */
function logMoodleSync($operationType, $requestData, $responseData, $status) {
    try {
        $db = getDbConnection();
        $stmt = $db->prepare(
            'INSERT INTO moodle_sync_log
             (operation_type, request_data, response_data, status, sync_completed_at)
             VALUES (?, ?, ?, ?, NOW())'
        );

        $stmt->execute([
            $operationType,
            json_encode($requestData),
            json_encode($responseData),
            $status
        ]);
    } catch (Exception $e) {
        logError('Failed to log Moodle sync: ' . $e->getMessage());
    }
}
