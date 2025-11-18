<?php
/**
 * Problems API Endpoint
 * Handles CRUD operations for math problems
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

/**
 * GET /api/problems.php
 * Query params: id, difficulty, random
 */
function handleGet($pdo) {
    try {
        // Get specific problem by ID
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('SELECT * FROM problems WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $problem = $stmt->fetch();

            if (!$problem) {
                jsonResponse(['error' => 'Problem not found'], 404);
            }

            jsonResponse(['success' => true, 'data' => $problem]);
        }

        // Get random problem
        if (isset($_GET['random'])) {
            $difficulty = $_GET['difficulty'] ?? null;

            if ($difficulty) {
                $stmt = $pdo->prepare('SELECT * FROM problems WHERE difficulty = ? ORDER BY RAND() LIMIT 1');
                $stmt->execute([$difficulty]);
            } else {
                $stmt = $pdo->query('SELECT * FROM problems ORDER BY RAND() LIMIT 1');
            }

            $problem = $stmt->fetch();

            if (!$problem) {
                jsonResponse(['error' => 'No problems found'], 404);
            }

            jsonResponse(['success' => true, 'data' => $problem]);
        }

        // Get all problems with optional difficulty filter
        $difficulty = $_GET['difficulty'] ?? null;

        if ($difficulty) {
            $stmt = $pdo->prepare('SELECT * FROM problems WHERE difficulty = ? ORDER BY id');
            $stmt->execute([$difficulty]);
        } else {
            $stmt = $pdo->query('SELECT * FROM problems ORDER BY id');
        }

        $problems = $stmt->fetchAll();
        jsonResponse(['success' => true, 'data' => $problems, 'count' => count($problems)]);

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

/**
 * POST /api/problems.php
 * Create new problem or sync from Moodle
 */
function handlePost($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            jsonResponse(['error' => 'Invalid JSON input'], 400);
        }

        // Validate required fields
        $required = ['problem_text', 'operand1', 'operand2', 'operation', 'answer'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                jsonResponse(['error' => "Missing required field: $field"], 400);
            }
        }

        // Insert problem
        $stmt = $pdo->prepare('
            INSERT INTO problems (problem_text, operand1, operand2, operation, answer, difficulty, moodle_question_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $input['problem_text'],
            $input['operand1'],
            $input['operand2'],
            $input['operation'],
            $input['answer'],
            $input['difficulty'] ?? 'medium',
            $input['moodle_question_id'] ?? null
        ]);

        $problemId = $pdo->lastInsertId();

        jsonResponse([
            'success' => true,
            'message' => 'Problem created successfully',
            'data' => ['id' => $problemId]
        ], 201);

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
