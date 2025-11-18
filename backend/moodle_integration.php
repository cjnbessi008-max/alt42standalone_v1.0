<?php
/**
 * Moodle Integration API for Inverse Reflection Module
 * Handles communication between Moodle LMS and the visualization app
 *
 * Compatible with Moodle 3.7, PHP 7.1.9
 */

require_once('../config/database.php');

// Enable CORS for embedded iframe
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class MoodleIntegration {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get problem data from Moodle question ID
     */
    public function getProblemByMoodleId($moodleQuestionId) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, v.*
                FROM inverse_reflection_problems p
                LEFT JOIN visualization_settings v ON p.id = v.problem_id
                WHERE p.moodle_question_id = :question_id
            ");
            $stmt->execute(['question_id' => $moodleQuestionId]);
            $result = $stmt->fetch();

            if ($result) {
                $result['hints'] = json_decode($result['hints'], true);
                return $result;
            }
            return null;
        } catch (PDOException $e) {
            error_log("Error fetching problem: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get all problems for a difficulty level
     */
    public function getProblemsByDifficulty($difficulty = 'medium') {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, v.*
                FROM inverse_reflection_problems p
                LEFT JOIN visualization_settings v ON p.id = v.problem_id
                WHERE p.difficulty_level = :difficulty
                ORDER BY p.created_at DESC
            ");
            $stmt->execute(['difficulty' => $difficulty]);
            $results = $stmt->fetchAll();

            foreach ($results as &$result) {
                $result['hints'] = json_decode($result['hints'], true);
            }

            return $results;
        } catch (PDOException $e) {
            error_log("Error fetching problems: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Submit student attempt
     */
    public function submitAttempt($studentId, $problemId, $attemptedInverse, $isCorrect, $interactionData = []) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO student_attempts
                (student_id, problem_id, attempted_inverse, is_correct, interaction_data, time_spent_seconds)
                VALUES (:student_id, :problem_id, :attempted_inverse, :is_correct, :interaction_data, :time_spent)
            ");

            $result = $stmt->execute([
                'student_id' => $studentId,
                'problem_id' => $problemId,
                'attempted_inverse' => $attemptedInverse,
                'is_correct' => $isCorrect ? 1 : 0,
                'interaction_data' => json_encode($interactionData),
                'time_spent' => $interactionData['time_spent'] ?? 0
            ]);

            if ($result) {
                return [
                    'success' => true,
                    'attempt_id' => $this->db->lastInsertId(),
                    'is_correct' => $isCorrect
                ];
            }
            return ['success' => false];
        } catch (PDOException $e) {
            error_log("Error submitting attempt: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get student progress
     */
    public function getStudentProgress($studentId, $problemId = null) {
        try {
            if ($problemId) {
                $stmt = $this->db->prepare("
                    SELECT * FROM student_attempts
                    WHERE student_id = :student_id AND problem_id = :problem_id
                    ORDER BY attempted_at DESC
                ");
                $stmt->execute(['student_id' => $studentId, 'problem_id' => $problemId]);
            } else {
                $stmt = $this->db->prepare("
                    SELECT a.*, p.function_type, p.difficulty_level
                    FROM student_attempts a
                    JOIN inverse_reflection_problems p ON a.problem_id = p.id
                    WHERE a.student_id = :student_id
                    ORDER BY a.attempted_at DESC
                ");
                $stmt->execute(['student_id' => $studentId]);
            }

            $results = $stmt->fetchAll();
            foreach ($results as &$result) {
                if (isset($result['interaction_data'])) {
                    $result['interaction_data'] = json_decode($result['interaction_data'], true);
                }
            }

            return $results;
        } catch (PDOException $e) {
            error_log("Error fetching progress: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Verify Moodle session (basic implementation)
     * In production, integrate with Moodle's session management
     */
    public function verifyMoodleSession($sessionToken) {
        // TODO: Implement actual Moodle session verification
        // This would typically involve checking against Moodle's mdl_sessions table
        return true;
    }
}

// API Router
$action = $_GET['action'] ?? '';
$integration = new MoodleIntegration();

switch ($action) {
    case 'get_problem':
        $moodleId = $_GET['moodle_id'] ?? null;
        if ($moodleId) {
            $problem = $integration->getProblemByMoodleId($moodleId);
            echo json_encode(['success' => true, 'data' => $problem]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Missing moodle_id']);
        }
        break;

    case 'get_problems_by_difficulty':
        $difficulty = $_GET['difficulty'] ?? 'medium';
        $problems = $integration->getProblemsByDifficulty($difficulty);
        echo json_encode(['success' => true, 'data' => $problems]);
        break;

    case 'submit_attempt':
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $integration->submitAttempt(
            $data['student_id'],
            $data['problem_id'],
            $data['attempted_inverse'],
            $data['is_correct'],
            $data['interaction_data'] ?? []
        );
        echo json_encode($result);
        break;

    case 'get_progress':
        $studentId = $_GET['student_id'] ?? null;
        $problemId = $_GET['problem_id'] ?? null;
        if ($studentId) {
            $progress = $integration->getStudentProgress($studentId, $problemId);
            echo json_encode(['success' => true, 'data' => $progress]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Missing student_id']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        break;
}
?>
