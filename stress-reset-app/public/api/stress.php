<?php
/**
 * Stress Detection API
 */

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use StressReset\StressDetector;
use StressReset\ResetManager;

try {
    $stressDetector = new StressDetector();
    $resetManager = new ResetManager();

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Check if reset should be triggered
            if (!isset($_GET['session_id'])) {
                throw new Exception('session_id is required');
            }

            $sessionId = $_GET['session_id'];
            $checkResult = $stressDetector->shouldTriggerReset($sessionId);

            if ($checkResult['should_trigger']) {
                // Trigger reset event
                $resetEvent = $resetManager->triggerReset(
                    $sessionId,
                    $checkResult['score_data']['score_id'],
                    $checkResult['reason']
                );

                echo json_encode([
                    'success' => true,
                    'should_reset' => true,
                    'data' => [
                        'event_id' => $resetEvent['event_id'],
                        'effect_config' => $resetEvent['effect_config'],
                        'stress_score' => $checkResult['score_data'],
                    ],
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'should_reset' => false,
                    'data' => [
                        'reason' => $checkResult['reason'],
                        'stress_score' => $checkResult['score_data'] ?? null,
                    ],
                ]);
            }
            break;

        case 'POST':
            // Calculate stress score (without triggering)
            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['session_id'])) {
                throw new Exception('session_id is required');
            }

            $scoreData = $stressDetector->calculateStressScore($input['session_id']);

            echo json_encode([
                'success' => true,
                'data' => $scoreData,
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed',
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
