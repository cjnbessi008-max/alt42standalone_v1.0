<?php
/**
 * Moodle LTI Integration API
 * Handle LTI launches and grade passback
 */

require_once '../config/database.php';
require_once '../services/MoodleLtiIntegration.php';

class LtiAPI {
    private $conn;
    private $lti;

    public function __construct() {
        $database = new Database();
        $database->loadConfig();
        $this->conn = $database->getConnection();

        // Load LTI credentials from config
        $consumerKey = getenv('MOODLE_LTI_KEY') ?: 'default_key';
        $sharedSecret = getenv('MOODLE_LTI_SECRET') ?: 'default_secret';

        $this->lti = new MoodleLtiIntegration($this->conn, $consumerKey, $sharedSecret);
    }

    /**
     * Handle LTI launch from Moodle
     */
    public function handleLaunch() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError(405, 'Method not allowed');
            return;
        }

        try {
            // Get LTI parameters
            $ltiParams = $_POST;

            // Validate required parameters
            $required = ['lti_message_type', 'lti_version', 'resource_link_id'];
            foreach ($required as $param) {
                if (!isset($ltiParams[$param])) {
                    $this->sendError(400, "Missing required parameter: $param");
                    return;
                }
            }

            // Handle launch
            $result = $this->lti->handleLtiLaunch($ltiParams);

            // Create learning session
            $sessionQuery = "
                INSERT INTO learning_sessions (
                    student_id, module_name, status
                ) VALUES (
                    :student_id, :module_name, 'active'
                )
            ";

            $stmt = $this->conn->prepare($sessionQuery);
            $stmt->execute([
                'student_id' => $result['student']['id'],
                'module_name' => $ltiParams['resource_link_title'] ?? 'Moodle Activity'
            ]);

            $sessionId = $this->conn->lastInsertId();

            // Link LTI session to learning session
            $linkQuery = "
                UPDATE moodle_lti_sessions
                SET session_id = :session_id
                WHERE id = :lti_session_id
            ";

            $linkStmt = $this->conn->prepare($linkQuery);
            $linkStmt->execute([
                'session_id' => $sessionId,
                'lti_session_id' => $result['lti_session_id']
            ]);

            // Redirect to application with session token
            $token = $this->generateSessionToken($result['student']['id'], $sessionId);

            $appUrl = getenv('APP_URL') ?: 'http://localhost:3000';
            $redirectUrl = "$appUrl?session=$sessionId&token=$token&student={$result['student']['id']}";

            header("Location: $redirectUrl");
            exit();

        } catch (Exception $e) {
            error_log("LTI Launch Error: " . $e->getMessage());
            $this->sendError(500, 'LTI launch failed: ' . $e->getMessage());
        }
    }

    /**
     * Send grade back to Moodle
     * POST /api/lti/grade
     */
    public function sendGrade() {
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJsonError(405, 'Method not allowed');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['session_id'])) {
            $this->sendJsonError(400, 'Missing session_id');
            return;
        }

        try {
            $sessionId = $data['session_id'];

            // Get LTI session
            $query = "
                SELECT id FROM moodle_lti_sessions
                WHERE session_id = :session_id
                AND grade_sync_enabled = 1
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->execute(['session_id' => $sessionId]);
            $ltiSession = $stmt->fetch();

            if (!$ltiSession) {
                $this->sendJsonError(404, 'LTI session not found or grade sync disabled');
                return;
            }

            // Calculate grade
            $grade = isset($data['score'])
                ? floatval($data['score'])
                : $this->lti->calculateGradeFromSession($sessionId);

            // Send to Moodle
            $success = $this->lti->sendGradeToMoodle($ltiSession['id'], $grade);

            if ($success) {
                $this->sendJsonSuccess([
                    'message' => 'Grade sent successfully',
                    'score' => $grade
                ]);
            } else {
                $this->sendJsonError(500, 'Failed to send grade to Moodle');
            }

        } catch (Exception $e) {
            error_log("Grade passback error: " . $e->getMessage());
            $this->sendJsonError(500, $e->getMessage());
        }
    }

    /**
     * Generate session token (simplified - use JWT in production)
     */
    private function generateSessionToken($studentId, $sessionId) {
        $data = json_encode([
            'student_id' => $studentId,
            'session_id' => $sessionId,
            'timestamp' => time()
        ]);

        return base64_encode($data);
    }

    private function sendError($code, $message) {
        http_response_code($code);
        echo "<h1>Error $code</h1><p>$message</p>";
    }

    private function sendJsonSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    private function sendJsonError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

// Route requests
$api = new LtiAPI();

$path = $_SERVER['PATH_INFO'] ?? '/';

if ($path === '/launch' || $path === '/') {
    $api->handleLaunch();
} elseif ($path === '/grade') {
    $api->sendGrade();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
