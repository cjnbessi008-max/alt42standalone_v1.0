<?php
/**
 * REST API Entry Point
 *
 * Handles routing for partial sum flow API endpoints
 * Compatible with PHP 7.1.9
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../moodle/MoodleIntegration.php';

// Simple JWT implementation for authentication
class JWTAuth {
    private static $secret = 'your-secret-key-change-in-production';

    public static function generateToken($userId, $username) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'userId' => $userId,
            'username' => $username,
            'exp' => time() + (60 * 60) // 1 hour expiration
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function validateToken($token) {
        if (!$token) {
            return false;
        }

        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $tokenParts;

        $base64UrlHeader = $header;
        $base64UrlPayload = $payload;

        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlExpectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));

        if ($base64UrlExpectedSignature !== $signature) {
            return false;
        }

        $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);

        if (!$payloadData || $payloadData['exp'] < time()) {
            return false;
        }

        return $payloadData;
    }
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path_parts = explode('/', trim($path, '/'));

// Initialize Moodle integration
$moodle = new MoodleIntegration();

// Response helper function
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit();
}

// Get authentication token from header
function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Require authentication for protected routes
function requireAuth() {
    $token = getAuthToken();
    $userData = JWTAuth::validateToken($token);

    if (!$userData) {
        sendError('Unauthorized', 401);
    }

    return $userData;
}

try {
    // Routing
    if ($path_parts[0] === 'auth' && $method === 'POST') {
        // POST /auth/login - Authentication
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['username']) || !isset($data['password'])) {
            sendError('Username and password required', 400);
        }

        $user = $moodle->authenticateUser($data['username'], $data['password']);

        if (!$user) {
            sendError('Invalid credentials', 401);
        }

        $token = JWTAuth::generateToken($user['id'], $user['username']);

        sendResponse([
            'token' => $token,
            'user' => $user
        ]);

    } elseif ($path_parts[0] === 'problems' && $method === 'GET') {
        // GET /problems - Get all problems
        // GET /problems/:id - Get problem by ID

        $userData = requireAuth();

        if (isset($path_parts[1]) && is_numeric($path_parts[1])) {
            // Get specific problem
            $problemId = (int)$path_parts[1];
            $problem = $moodle->getProblemById($problemId);

            if (!$problem) {
                sendError('Problem not found', 404);
            }

            sendResponse($problem);
        } else {
            // Get all problems
            $problems = $moodle->getAllProblems();
            sendResponse($problems);
        }

    } elseif ($path_parts[0] === 'attempts' && $method === 'POST') {
        // POST /attempts - Submit answer

        $userData = requireAuth();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['problemId']) || !isset($data['answer'])) {
            sendError('Problem ID and answer required', 400);
        }

        $studentId = $userData['userId'];
        $problemId = (int)$data['problemId'];
        $answer = (int)$data['answer'];

        $attempt = $moodle->submitAttempt($studentId, $problemId, $answer);

        sendResponse($attempt, 201);

    } elseif ($path_parts[0] === 'attempts' && $method === 'GET') {
        // GET /attempts/:problemId - Get attempt history

        $userData = requireAuth();

        if (!isset($path_parts[1]) || !is_numeric($path_parts[1])) {
            sendError('Problem ID required', 400);
        }

        $studentId = $userData['userId'];
        $problemId = (int)$path_parts[1];

        $attempts = $moodle->getAttemptHistory($studentId, $problemId);

        sendResponse($attempts);

    } elseif ($path_parts[0] === 'progress' && $method === 'GET') {
        // GET /progress - Get student progress statistics

        $userData = requireAuth();
        $studentId = $userData['userId'];

        $progress = $moodle->getStudentProgress($studentId);

        sendResponse($progress);

    } else {
        sendError('Route not found', 404);
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}
