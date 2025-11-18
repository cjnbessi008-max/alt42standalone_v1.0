<?php
/**
 * Reset Event Management API
 */

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use StressReset\ResetManager;

try {
    $resetManager = new ResetManager();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get reset history
            if (isset($_GET['session_id'])) {
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                $resets = $resetManager->getRecentResets($_GET['session_id'], $limit);

                echo json_encode([
                    'success' => true,
                    'data' => $resets,
                ]);
            } elseif (isset($_GET['user_id'])) {
                $stats = $resetManager->getResetStats(
                    $_GET['user_id'],
                    $_GET['date_from'] ?? null,
                    $_GET['date_to'] ?? null
                );

                echo json_encode([
                    'success' => true,
                    'data' => $stats,
                ]);
            } else {
                throw new Exception('session_id or user_id required');
            }
            break;

        case 'POST':
            // Get effect configuration
            $config = $resetManager->getEffectConfig();

            echo json_encode([
                'success' => true,
                'data' => $config,
            ]);
            break;

        case 'PUT':
            // Acknowledge reset event
            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['event_id'])) {
                throw new Exception('event_id is required');
            }

            $resetManager->acknowledgeReset($input['event_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Reset acknowledged',
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
