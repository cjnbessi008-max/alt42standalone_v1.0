<?php
/**
 * Moodle LMS API Integration
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7
 *
 * This API provides endpoints for the Similarity Cards application
 * to fetch problem data from Moodle LMS.
 */

// CORS headers for React frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_password');
define('DB_CHARSET', 'utf8mb4');

// Connect to MySQL
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Router
switch ($method) {
    case 'GET':
        if (strpos($path, '/problems') !== false) {
            if (isset($pathParts[count($pathParts) - 1]) && is_numeric($pathParts[count($pathParts) - 1])) {
                // GET /problems/{id}
                getProblemById($pdo, intval($pathParts[count($pathParts) - 1]));
            } else {
                // GET /problems
                getProblems($pdo);
            }
        } elseif (strpos($path, '/progress') !== false) {
            // GET /progress/{studentId}
            $studentId = isset($pathParts[count($pathParts) - 1]) ? intval($pathParts[count($pathParts) - 1]) : null;
            getProgress($pdo, $studentId);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;

    case 'POST':
        if (strpos($path, '/auth') !== false) {
            // POST /auth
            authenticate($pdo);
        } elseif (strpos($path, '/progress') !== false) {
            // POST /progress
            saveProgress($pdo);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Get all problems
 */
function getProblems($pdo) {
    try {
        $courseId = isset($_GET['courseId']) ? intval($_GET['courseId']) : null;

        $sql = "
            SELECT
                q.id,
                q.id as questionId,
                q.name as title,
                q.questiontext as content,
                qm.similarity_type as similarityType,
                qm.difficulty,
                qm.triangle_data as triangleData
            FROM mdl_question q
            LEFT JOIN mdl_question_similarity_meta qm ON q.id = qm.question_id
            WHERE q.qtype = 'similarity'
        ";

        if ($courseId) {
            $sql .= " AND q.category IN (
                SELECT id FROM mdl_question_categories WHERE course = :courseId
            )";
        }

        $sql .= " ORDER BY q.id DESC LIMIT 100";

        $stmt = $pdo->prepare($sql);
        if ($courseId) {
            $stmt->bindParam(':courseId', $courseId, PDO::PARAM_INT);
        }
        $stmt->execute();

        $problems = $stmt->fetchAll();

        // Parse triangle data JSON
        foreach ($problems as &$problem) {
            if ($problem['triangleData']) {
                $problem['triangleData'] = json_decode($problem['triangleData'], true);
            }
        }

        echo json_encode($problems);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch problems', 'message' => $e->getMessage()]);
    }
}

/**
 * Get problem by ID
 */
function getProblemById($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT
                q.id,
                q.id as questionId,
                q.name as title,
                q.questiontext as content,
                qm.similarity_type as similarityType,
                qm.difficulty,
                qm.triangle_data as triangleData
            FROM mdl_question q
            LEFT JOIN mdl_question_similarity_meta qm ON q.id = qm.question_id
            WHERE q.id = :id
        ");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $problem = $stmt->fetch();

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
            return;
        }

        // Parse triangle data JSON
        if ($problem['triangleData']) {
            $problem['triangleData'] = json_decode($problem['triangleData'], true);
        }

        echo json_encode($problem);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch problem', 'message' => $e->getMessage()]);
    }
}

/**
 * Save student progress
 */
function saveProgress($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $problemId = $input['problemId'] ?? null;
        $attempts = $input['attempts'] ?? 0;
        $isCorrect = $input['isCorrect'] ?? false;
        $timeSpent = $input['timeSpent'] ?? 0;

        if (!$problemId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing problemId']);
            return;
        }

        // Get student ID from session or token
        $studentId = $_SESSION['user_id'] ?? 1; // Default for development

        $stmt = $pdo->prepare("
            INSERT INTO mdl_question_attempts
            (question_id, student_id, attempts, is_correct, time_spent, created_at)
            VALUES (:problemId, :studentId, :attempts, :isCorrect, :timeSpent, NOW())
            ON DUPLICATE KEY UPDATE
                attempts = :attempts,
                is_correct = :isCorrect,
                time_spent = :timeSpent,
                updated_at = NOW()
        ");

        $stmt->bindParam(':problemId', $problemId, PDO::PARAM_INT);
        $stmt->bindParam(':studentId', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':attempts', $attempts, PDO::PARAM_INT);
        $stmt->bindParam(':isCorrect', $isCorrect, PDO::PARAM_BOOL);
        $stmt->bindParam(':timeSpent', $timeSpent, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Progress saved']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save progress', 'message' => $e->getMessage()]);
    }
}

/**
 * Get student progress
 */
function getProgress($pdo, $studentId) {
    try {
        if (!$studentId) {
            $studentId = $_SESSION['user_id'] ?? 1; // Default for development
        }

        $stmt = $pdo->prepare("
            SELECT
                question_id as problemId,
                attempts,
                is_correct as isCorrect,
                time_spent as timeSpent,
                updated_at as lastAttempt
            FROM mdl_question_attempts
            WHERE student_id = :studentId
            ORDER BY updated_at DESC
        ");
        $stmt->bindParam(':studentId', $studentId, PDO::PARAM_INT);
        $stmt->execute();

        $progress = $stmt->fetchAll();

        echo json_encode($progress);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch progress', 'message' => $e->getMessage()]);
    }
}

/**
 * Authenticate user
 */
function authenticate($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing credentials']);
            return;
        }

        // Verify credentials with Moodle user table
        $stmt = $pdo->prepare("
            SELECT id, username, firstname, lastname
            FROM mdl_user
            WHERE username = :username AND deleted = 0
        ");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();

        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        // In production, verify password hash
        // For now, generate a simple JWT-like token
        $token = base64_encode(json_encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'exp' => time() + 3600 * 24 // 24 hours
        ]));

        echo json_encode([
            'token' => $token,
            'user' => $user
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Authentication failed', 'message' => $e->getMessage()]);
    }
}
?>
