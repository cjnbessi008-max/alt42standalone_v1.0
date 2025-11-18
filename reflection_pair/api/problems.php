<?php
/**
 * Reflection Pair API - Problems Endpoint
 * Handles fetching and managing mathematical problems from Moodle LMS
 * Compatible with PHP 7.1.9, MySQL 5.7, Moodle 3.7
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

class ProblemAPI {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->db->loadConfig();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get problem by ID
     */
    public function getProblem($problem_id) {
        if (!$this->conn) {
            return $this->errorResponse('Database connection failed', 500);
        }

        try {
            $query = "SELECT * FROM rp_problems WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $problem_id, PDO::PARAM_INT);
            $stmt->execute();

            $problem = $stmt->fetch();

            if (!$problem) {
                return $this->errorResponse('Problem not found', 404);
            }

            return $this->successResponse($problem);

        } catch (PDOException $e) {
            error_log("Get Problem Error: " . $e->getMessage());
            return $this->errorResponse('Failed to fetch problem', 500);
        }
    }

    /**
     * Get problems for a course and user
     */
    public function getProblemsForUser($course_id, $user_id) {
        if (!$this->conn) {
            return $this->errorResponse('Database connection failed', 500);
        }

        try {
            $query = "SELECT * FROM rp_problems
                      WHERE moodle_course_id = :course_id
                      AND moodle_user_id = :user_id
                      ORDER BY created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();

            $problems = $stmt->fetchAll();

            return $this->successResponse($problems);

        } catch (PDOException $e) {
            error_log("Get Problems Error: " . $e->getMessage());
            return $this->errorResponse('Failed to fetch problems', 500);
        }
    }

    /**
     * Create a new problem
     */
    public function createProblem($data) {
        if (!$this->conn) {
            return $this->errorResponse('Database connection failed', 500);
        }

        // Validate required fields
        $required = ['moodle_course_id', 'moodle_user_id'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return $this->errorResponse("Missing required field: {$field}", 400);
            }
        }

        try {
            $query = "INSERT INTO rp_problems
                      (moodle_course_id, moodle_user_id, problem_type, difficulty_level,
                       base_number, x_range_min, x_range_max, show_reflection_line)
                      VALUES
                      (:course_id, :user_id, :problem_type, :difficulty,
                       :base_number, :x_min, :x_max, :show_reflection)";

            $stmt = $this->conn->prepare($query);

            // Bind parameters with defaults
            $stmt->bindParam(':course_id', $data['moodle_course_id'], PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $data['moodle_user_id'], PDO::PARAM_INT);

            $problem_type = $data['problem_type'] ?? 'both';
            $stmt->bindParam(':problem_type', $problem_type);

            $difficulty = $data['difficulty_level'] ?? 1;
            $stmt->bindParam(':difficulty', $difficulty, PDO::PARAM_INT);

            $base_number = $data['base_number'] ?? 2.71828;
            $stmt->bindParam(':base_number', $base_number);

            $x_min = $data['x_range_min'] ?? -5.0;
            $stmt->bindParam(':x_min', $x_min);

            $x_max = $data['x_range_max'] ?? 5.0;
            $stmt->bindParam(':x_max', $x_max);

            $show_reflection = $data['show_reflection_line'] ?? true;
            $stmt->bindParam(':show_reflection', $show_reflection, PDO::PARAM_BOOL);

            $stmt->execute();

            $problem_id = $this->conn->lastInsertId();

            return $this->successResponse([
                'id' => $problem_id,
                'message' => 'Problem created successfully'
            ], 201);

        } catch (PDOException $e) {
            error_log("Create Problem Error: " . $e->getMessage());
            return $this->errorResponse('Failed to create problem', 500);
        }
    }

    /**
     * Record user interaction
     */
    public function recordInteraction($data) {
        if (!$this->conn) {
            return $this->errorResponse('Database connection failed', 500);
        }

        $required = ['problem_id', 'moodle_user_id', 'interaction_type'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return $this->errorResponse("Missing required field: {$field}", 400);
            }
        }

        try {
            $query = "INSERT INTO rp_interactions
                      (problem_id, moodle_user_id, interaction_type, interaction_data)
                      VALUES (:problem_id, :user_id, :type, :data)";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':problem_id', $data['problem_id'], PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $data['moodle_user_id'], PDO::PARAM_INT);
            $stmt->bindParam(':type', $data['interaction_type']);

            $interaction_json = json_encode($data['interaction_data'] ?? []);
            $stmt->bindParam(':data', $interaction_json);

            $stmt->execute();

            return $this->successResponse(['message' => 'Interaction recorded'], 201);

        } catch (PDOException $e) {
            error_log("Record Interaction Error: " . $e->getMessage());
            return $this->errorResponse('Failed to record interaction', 500);
        }
    }

    /**
     * Success response helper
     */
    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return [
            'success' => true,
            'data' => $data
        ];
    }

    /**
     * Error response helper
     */
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return [
            'success' => false,
            'error' => $message
        ];
    }
}

// Route handling
$api = new ProblemAPI();
$method = $_SERVER['REQUEST_METHOD'];
$response = null;

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $response = $api->getProblem($_GET['id']);
        } elseif (isset($_GET['course_id']) && isset($_GET['user_id'])) {
            $response = $api->getProblemsForUser($_GET['course_id'], $_GET['user_id']);
        } else {
            $response = $api->errorResponse('Missing parameters', 400);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action']) && $input['action'] === 'record_interaction') {
            $response = $api->recordInteraction($input);
        } else {
            $response = $api->createProblem($input);
        }
        break;

    default:
        $response = $api->errorResponse('Method not allowed', 405);
        break;
}

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
