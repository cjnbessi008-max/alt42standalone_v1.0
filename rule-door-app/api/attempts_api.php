<?php
/**
 * Problem Attempts API Endpoints
 */

function handleAttemptsAPI($method, $path_parts, $data) {
    $attempt = new ProblemAttempt();

    // POST /attempts - Record a new attempt
    if ($method === 'POST' && count($path_parts) === 1) {
        // Validate required fields
        if (!isset($data['rule_id']) || !isset($data['student_id']) ||
            !isset($data['moodle_question_id']) || !isset($data['answer_data'])) {
            ApiResponse::error('Missing required fields', 400);
        }

        $attempt->rule_id = intval($data['rule_id']);
        $attempt->student_id = intval($data['student_id']);
        $attempt->moodle_question_id = intval($data['moodle_question_id']);
        $attempt->answer_data = $data['answer_data'];

        // Check if answer is duplicate
        $attempt->is_duplicate = $attempt->isDuplicateAnswer(
            $attempt->student_id,
            $attempt->moodle_question_id,
            $attempt->answer_data
        ) ? 1 : 0;

        $attempt->is_correct = isset($data['is_correct']) ? intval($data['is_correct']) : null;
        $attempt->time_spent_seconds = isset($data['time_spent_seconds']) ? intval($data['time_spent_seconds']) : null;

        if ($attempt->recordAttempt()) {
            ApiResponse::success([
                'attempt_id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'is_duplicate' => $attempt->is_duplicate
            ], 'Attempt recorded successfully', 201);
        } else {
            ApiResponse::error('Failed to record attempt', 500);
        }
    }

    // GET /attempts/student/{student_id}/question/{question_id} - Get student attempts for a question
    if ($method === 'GET' && count($path_parts) === 5 &&
        $path_parts[1] === 'student' && $path_parts[3] === 'question') {
        $student_id = intval($path_parts[2]);
        $question_id = intval($path_parts[4]);

        $attempts = $attempt->getStudentAttempts($student_id, $question_id);

        // Decode answer_data JSON for each attempt
        foreach ($attempts as &$att) {
            if (isset($att['answer_data'])) {
                $att['answer_data'] = json_decode($att['answer_data'], true);
            }
        }

        ApiResponse::success($attempts, 'Attempts retrieved successfully');
    }

    // GET /attempts/check-duplicate - Check if answer is duplicate
    if ($method === 'GET' && count($path_parts) === 2 && $path_parts[1] === 'check-duplicate') {
        // Expect query parameters: student_id, question_id, answer_data
        $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
        $question_id = isset($_GET['question_id']) ? intval($_GET['question_id']) : null;
        $answer_data_json = isset($_GET['answer_data']) ? $_GET['answer_data'] : null;

        if (!$student_id || !$question_id || !$answer_data_json) {
            ApiResponse::error('Missing query parameters: student_id, question_id, answer_data', 400);
        }

        $answer_data = json_decode($answer_data_json, true);
        if ($answer_data === null) {
            ApiResponse::error('Invalid answer_data JSON', 400);
        }

        $is_duplicate = $attempt->isDuplicateAnswer($student_id, $question_id, $answer_data);

        ApiResponse::success([
            'is_duplicate' => $is_duplicate,
            'student_id' => $student_id,
            'question_id' => $question_id
        ], 'Duplicate check completed');
    }

    // GET /attempts/statistics/{rule_id} - Get attempt statistics for a rule
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'statistics') {
        $rule_id = intval($path_parts[2]);
        $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

        $stats = $attempt->getStatistics($rule_id, $student_id);

        if ($stats) {
            ApiResponse::success($stats, 'Statistics retrieved successfully');
        } else {
            ApiResponse::error('No statistics found', 404);
        }
    }

    // GET /attempts/recent - Get recent attempts
    if ($method === 'GET' && count($path_parts) === 2 && $path_parts[1] === 'recent') {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $attempts = $attempt->getRecentAttempts($limit);

        // Decode answer_data JSON for each attempt
        foreach ($attempts as &$att) {
            if (isset($att['answer_data'])) {
                $att['answer_data'] = json_decode($att['answer_data'], true);
            }
        }

        ApiResponse::success($attempts, 'Recent attempts retrieved successfully');
    }

    ApiResponse::error('Invalid endpoint or method', 400);
}
