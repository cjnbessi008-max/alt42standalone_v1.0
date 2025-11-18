<?php
/**
 * API Endpoint: Submit Answer
 * Process user's answer and trigger Cross Wave effect if correct
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Question.php';

try {
    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        throw new Exception("Invalid JSON data");
    }

    // Validate required fields
    $sessionId = $data['session_id'] ?? null;
    $moodleQuestionId = $data['moodle_question_id'] ?? null;
    $questionText = $data['question_text'] ?? '';
    $userAnswer = $data['user_answer'] ?? '';
    $correctAnswer = $data['correct_answer'] ?? '';
    $timeSpent = $data['time_spent'] ?? 0;
    $position = $data['position'] ?? ['x' => 0, 'y' => 0]; // Click position for wave effect

    if (!$sessionId || !$moodleQuestionId) {
        throw new Exception("session_id and moodle_question_id are required");
    }

    $questionModel = new Question();

    // Record the attempt
    $result = $questionModel->recordAttempt(
        $sessionId,
        $moodleQuestionId,
        $questionText,
        $userAnswer,
        $correctAnswer,
        $timeSpent
    );

    $response = [
        'success' => true,
        'attempt_id' => $result['attempt_id'],
        'is_correct' => $result['is_correct'],
        'user_answer' => $userAnswer,
        'correct_answer' => $correctAnswer,
        'wave_effect' => false
    ];

    // If answer is correct, trigger Cross Wave effect
    if ($result['is_correct']) {
        $waveColor = '#4CAF50'; // Green for correct
        $waveIntensity = 100;

        $waveId = $questionModel->logWaveEffect(
            $result['attempt_id'],
            $position,
            $waveColor,
            $waveIntensity
        );

        $response['wave_effect'] = true;
        $response['wave_id'] = $waveId;
        $response['wave_config'] = [
            'color' => $waveColor,
            'intensity' => $waveIntensity,
            'position' => $position,
            'duration' => 2000, // 2 seconds
            'max_radius' => 500 // pixels
        ];
    } else {
        // Incorrect answer - different visual feedback
        $response['feedback'] = [
            'message' => '다시 시도해보세요!',
            'color' => '#f44336' // Red
        ];
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
