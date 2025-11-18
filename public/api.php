<?php
/**
 * API Router and Handlers
 */

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse(['success' => false, 'error' => $message], $statusCode);
}

try {
    // Parse route
    $resource = $pathParts[1] ?? null;
    $action = $pathParts[2] ?? null;
    $id = $pathParts[3] ?? null;

    // System status
    if ($resource === 'status' && $requestMethod === 'GET') {
        $db = Database::getInstance();
        sendResponse([
            'success' => true,
            'status' => 'operational',
            'database' => 'connected',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Moodle endpoints
    if ($resource === 'moodle') {
        $moodle = new MoodleClient();

        if ($action === 'test' && $requestMethod === 'GET') {
            $connected = $moodle->testConnection();
            sendResponse([
                'success' => $connected,
                'connected' => $connected,
                'moodle_url' => MOODLE_URL
            ]);
        }

        if ($action === 'sync') {
            $db = Database::getInstance()->getConnection();
            $syncType = $id ?? 'users';

            if ($syncType === 'users' && $requestMethod === 'POST') {
                $count = $moodle->syncUsers($db);
                sendResponse([
                    'success' => true,
                    'synced' => $count,
                    'type' => 'users'
                ]);
            }

            if ($syncType === 'courses' && $requestMethod === 'POST') {
                $count = $moodle->syncCourses($db);
                sendResponse([
                    'success' => true,
                    'synced' => $count,
                    'type' => 'courses'
                ]);
            }
        }
    }

    // Assessment endpoints
    if ($resource === 'assessments') {
        $assessment = new CognitiveAssessment();

        if ($action === 'create' && $requestMethod === 'POST') {
            $userId = $data['user_id'] ?? null;
            $typeId = $data['type_id'] ?? 1;
            $timing = $data['timing'] ?? 'baseline';
            $sessionId = $data['session_id'] ?? null;
            $courseId = $data['course_id'] ?? null;

            if (!$userId) {
                sendError('user_id is required');
            }

            $assessmentId = $assessment->createAssessment($userId, $typeId, $timing, $sessionId, $courseId);
            sendResponse([
                'success' => true,
                'assessment_id' => $assessmentId
            ], 201);
        }

        if (is_numeric($action)) {
            $assessmentId = (int)$action;

            if ($id === 'start' && $requestMethod === 'POST') {
                $assessment->startAssessment($assessmentId);
                $questions = $assessment->getQuestions($data['type_id'] ?? 1, $data['question_count'] ?? 20);
                sendResponse([
                    'success' => true,
                    'questions' => $questions
                ]);
            }

            if ($id === 'respond' && $requestMethod === 'POST') {
                $questionId = $data['question_id'] ?? null;
                $answer = $data['answer'] ?? null;
                $reactionTime = $data['reaction_time'] ?? 0;

                if (!$questionId || $answer === null) {
                    sendError('question_id and answer are required');
                }

                $responseId = $assessment->recordResponse($assessmentId, $questionId, $answer, $reactionTime);
                sendResponse([
                    'success' => true,
                    'response_id' => $responseId
                ]);
            }

            if ($id === 'complete' && $requestMethod === 'POST') {
                $results = $assessment->completeAssessment($assessmentId);
                sendResponse([
                    'success' => true,
                    'results' => $results
                ]);
            }

            if ($requestMethod === 'GET' && !$id) {
                $details = $assessment->getAssessment($assessmentId);
                sendResponse([
                    'success' => true,
                    'assessment' => $details
                ]);
            }
        }
    }

    // User assessments
    if ($resource === 'users' && is_numeric($action) && $id === 'assessments') {
        $userId = (int)$action;
        $assessment = new CognitiveAssessment();
        $assessments = $assessment->getUserAssessments($userId);
        sendResponse([
            'success' => true,
            'assessments' => $assessments
        ]);
    }

    // Rest session endpoints
    if ($resource === 'rest-sessions') {
        $session = new RestSession();

        if ($action === 'create' && $requestMethod === 'POST') {
            $userId = $data['user_id'] ?? null;
            $duration = $data['duration'] ?? null;
            $courseId = $data['course_id'] ?? null;

            if (!$userId) {
                sendError('user_id is required');
            }

            $sessionId = $session->createSession($userId, $duration, $courseId);
            sendResponse([
                'success' => true,
                'session_id' => $sessionId
            ], 201);
        }

        if (is_numeric($action)) {
            $sessionId = (int)$action;

            if ($id === 'start' && $requestMethod === 'POST') {
                $session->startSession($sessionId);
                sendResponse(['success' => true]);
            }

            if ($id === 'complete' && $requestMethod === 'POST') {
                $results = $session->completeSession($sessionId);
                sendResponse([
                    'success' => true,
                    'results' => $results
                ]);
            }

            if ($requestMethod === 'GET' && !$id) {
                $details = $session->getSession($sessionId);
                sendResponse([
                    'success' => true,
                    'session' => $details
                ]);
            }
        }
    }

    // Recovery metrics endpoints
    if ($resource === 'recovery-metrics') {
        $metrics = new RecoveryMetrics();

        if ($action === 'calculate' && $requestMethod === 'POST') {
            $sessionId = $data['session_id'] ?? null;
            if (!$sessionId) {
                sendError('session_id is required');
            }

            $results = $metrics->calculateRecovery($sessionId);
            sendResponse([
                'success' => true,
                'metrics' => $results
            ]);
        }

        if (is_numeric($action) && $requestMethod === 'GET') {
            $sessionId = (int)$action;
            $metricsData = $metrics->getMetrics($sessionId);
            sendResponse([
                'success' => true,
                'metrics' => $metricsData
            ]);
        }
    }

    // User recovery history
    if ($resource === 'users' && is_numeric($action) && $id === 'recovery-history') {
        $userId = (int)$action;
        $metrics = new RecoveryMetrics();
        $history = $metrics->getUserRecoveryHistory($userId);
        $average = $metrics->getUserAverageRecovery($userId);
        sendResponse([
            'success' => true,
            'history' => $history,
            'average' => $average
        ]);
    }

    // No route matched
    sendError('Endpoint not found', 404);

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
