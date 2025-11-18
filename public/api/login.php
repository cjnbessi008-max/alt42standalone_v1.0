<?php
/**
 * Login and Registration API
 */

header('Content-Type: application/json');
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($method === 'POST') {
        $action = $input['action'] ?? 'login';

        switch ($action) {
            case 'login':
                handleLogin($input);
                break;

            case 'register':
                handleRegister($input);
                break;

            case 'verify':
                handleVerify();
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleLogin($input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        return;
    }

    $result = auth()->login($input['username'], $input['password']);

    if ($result['success']) {
        echo json_encode($result);
    } else {
        http_response_code(401);
        echo json_encode($result);
    }
}

function handleRegister($input) {
    $result = auth()->register($input);

    if ($result['success']) {
        http_response_code(201);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }
}

function handleVerify() {
    $user = auth()->getCurrentUser();

    if ($user) {
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid or expired token'
        ]);
    }
}
