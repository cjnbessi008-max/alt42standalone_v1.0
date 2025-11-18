<?php
/**
 * Problems API
 * 문제 관리 REST API
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class ProblemsAPI {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 문제 목록 조회
     */
    public function getProblems($filters = []) {
        try {
            $sql = "SELECT * FROM problems WHERE 1=1";
            $params = [];

            if (isset($filters['difficulty'])) {
                $sql .= " AND difficulty_level = :difficulty";
                $params[':difficulty'] = $filters['difficulty'];
            }

            if (isset($filters['type'])) {
                $sql .= " AND problem_type = :type";
                $params[':type'] = $filters['type'];
            }

            if (isset($filters['moodle_question_id'])) {
                $sql .= " AND moodle_question_id = :moodle_question_id";
                $params[':moodle_question_id'] = $filters['moodle_question_id'];
            }

            $sql .= " ORDER BY difficulty_level ASC, id ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError('getProblems failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * 특정 문제 조회
     */
    public function getProblem($problemId) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM problems WHERE id = :id");
            $stmt->execute([':id' => $problemId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->logError('getProblem failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 문제 생성
     */
    public function createProblem($data) {
        try {
            $sql = "INSERT INTO problems (moodle_question_id, moodle_quiz_id, problem_type, equation, solution_range, difficulty_level, metadata)
                    VALUES (:moodle_question_id, :moodle_quiz_id, :problem_type, :equation, :solution_range, :difficulty_level, :metadata)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':moodle_question_id' => $data['moodle_question_id'],
                ':moodle_quiz_id' => $data['moodle_quiz_id'] ?? null,
                ':problem_type' => $data['problem_type'],
                ':equation' => $data['equation'],
                ':solution_range' => json_encode($data['solution_range']),
                ':difficulty_level' => $data['difficulty_level'] ?? 1,
                ':metadata' => json_encode($data['metadata'] ?? [])
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            $this->logError('createProblem failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * 학생 진행 상황 기록
     */
    public function recordProgress($data) {
        try {
            $sql = "INSERT INTO student_progress (moodle_user_id, problem_id, attempt_count, is_correct, time_spent_seconds, visualization_interactions, student_answer, completed_at)
                    VALUES (:moodle_user_id, :problem_id, :attempt_count, :is_correct, :time_spent_seconds, :visualization_interactions, :student_answer, :completed_at)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':moodle_user_id' => $data['moodle_user_id'],
                ':problem_id' => $data['problem_id'],
                ':attempt_count' => $data['attempt_count'] ?? 1,
                ':is_correct' => $data['is_correct'] ? 1 : 0,
                ':time_spent_seconds' => $data['time_spent_seconds'] ?? 0,
                ':visualization_interactions' => $data['visualization_interactions'] ?? 0,
                ':student_answer' => $data['student_answer'] ?? null,
                ':completed_at' => $data['is_correct'] ? date('Y-m-d H:i:s') : null
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            $this->logError('recordProgress failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * 학생 진행 상황 조회
     */
    public function getStudentProgress($userId, $problemId = null) {
        try {
            if ($problemId) {
                $stmt = $this->db->prepare("SELECT * FROM student_progress WHERE moodle_user_id = :user_id AND problem_id = :problem_id ORDER BY started_at DESC");
                $stmt->execute([':user_id' => $userId, ':problem_id' => $problemId]);
            } else {
                $stmt = $this->db->prepare("SELECT * FROM student_progress WHERE moodle_user_id = :user_id ORDER BY started_at DESC");
                $stmt->execute([':user_id' => $userId]);
            }

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError('getStudentProgress failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * 세션 생성
     */
    public function createSession($userId, $courseId) {
        try {
            $token = bin2hex(random_bytes(32));

            $stmt = $this->db->prepare("INSERT INTO learning_sessions (moodle_user_id, moodle_course_id, session_token) VALUES (:user_id, :course_id, :token)");
            $stmt->execute([
                ':user_id' => $userId,
                ':course_id' => $courseId,
                ':token' => $token
            ]);

            return $token;
        } catch (PDOException $e) {
            $this->logError('createSession failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 세션 검증
     */
    public function validateSession($token) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM learning_sessions WHERE session_token = :token AND is_active = 1");
            $stmt->execute([':token' => $token]);

            $session = $stmt->fetch();

            if ($session) {
                // 세션 유효 시간 확인 (1시간)
                $lastActivity = strtotime($session['last_activity']);
                if (time() - $lastActivity > SESSION_TIMEOUT) {
                    $this->deactivateSession($token);
                    return null;
                }

                // 마지막 활동 시간 업데이트
                $this->updateSessionActivity($token);
            }

            return $session;
        } catch (PDOException $e) {
            $this->logError('validateSession failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 세션 활동 시간 업데이트
     */
    private function updateSessionActivity($token) {
        try {
            $stmt = $this->db->prepare("UPDATE learning_sessions SET last_activity = NOW() WHERE session_token = :token");
            $stmt->execute([':token' => $token]);
        } catch (PDOException $e) {
            $this->logError('updateSessionActivity failed: ' . $e->getMessage());
        }
    }

    /**
     * 세션 비활성화
     */
    public function deactivateSession($token) {
        try {
            $stmt = $this->db->prepare("UPDATE learning_sessions SET is_active = 0 WHERE session_token = :token");
            $stmt->execute([':token' => $token]);
        } catch (PDOException $e) {
            $this->logError('deactivateSession failed: ' . $e->getMessage());
        }
    }

    private function logError($message) {
        error_log(date('[Y-m-d H:i:s] ') . $message . PHP_EOL, 3, __DIR__ . '/../logs/api.log');
    }
}

// API 라우팅
$method = $_SERVER['REQUEST_METHOD'];
$api = new ProblemsAPI();

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $result = $api->getProblem($_GET['id']);
            } else {
                $filters = [];
                if (isset($_GET['difficulty'])) $filters['difficulty'] = $_GET['difficulty'];
                if (isset($_GET['type'])) $filters['type'] = $_GET['type'];
                if (isset($_GET['moodle_question_id'])) $filters['moodle_question_id'] = $_GET['moodle_question_id'];

                $result = $api->getProblems($filters);
            }
            echo json_encode(['success' => true, 'data' => $result]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (isset($data['action'])) {
                switch ($data['action']) {
                    case 'create_problem':
                        $result = $api->createProblem($data);
                        echo json_encode(['success' => true, 'id' => $result]);
                        break;

                    case 'record_progress':
                        $result = $api->recordProgress($data);
                        echo json_encode(['success' => true, 'id' => $result]);
                        break;

                    case 'create_session':
                        $token = $api->createSession($data['user_id'], $data['course_id']);
                        echo json_encode(['success' => true, 'token' => $token]);
                        break;

                    case 'validate_session':
                        $session = $api->validateSession($data['token']);
                        echo json_encode(['success' => true, 'session' => $session]);
                        break;

                    default:
                        throw new Exception('Unknown action');
                }
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
