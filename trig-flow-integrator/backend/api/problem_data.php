<?php
/**
 * 문제 데이터 API
 * 삼각함수 문제 정보 관리 및 학생 진행 상황 추적
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class ProblemDataAPI {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 문제 정보 가져오기
     */
    public function getProblem($problem_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM trig_problems
                WHERE id = :id
            ");
            $stmt->execute(['id' => $problem_id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get problem', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Moodle 퀴즈에 해당하는 문제 목록 가져오기
     */
    public function getProblemsByQuiz($quiz_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM trig_problems
                WHERE moodle_quiz_id = :quiz_id
                ORDER BY difficulty_level, id
            ");
            $stmt->execute(['quiz_id' => $quiz_id]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get problems', 'error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * 문제 생성/추가
     */
    public function createProblem($data) {
        validateRequired($data, ['moodle_quiz_id', 'moodle_question_id', 'function_type']);

        try {
            $stmt = $this->db->prepare("
                INSERT INTO trig_problems (
                    moodle_quiz_id, moodle_question_id, problem_type,
                    function_type, difficulty_level, coefficient,
                    frequency, phase_shift, vertical_shift, integration_constant
                ) VALUES (
                    :moodle_quiz_id, :moodle_question_id, :problem_type,
                    :function_type, :difficulty_level, :coefficient,
                    :frequency, :phase_shift, :vertical_shift, :integration_constant
                )
            ");

            $stmt->execute([
                'moodle_quiz_id' => $data['moodle_quiz_id'],
                'moodle_question_id' => $data['moodle_question_id'],
                'problem_type' => $data['problem_type'] ?? 'integral',
                'function_type' => $data['function_type'],
                'difficulty_level' => $data['difficulty_level'] ?? 1,
                'coefficient' => $data['coefficient'] ?? 1.00,
                'frequency' => $data['frequency'] ?? 1.00,
                'phase_shift' => $data['phase_shift'] ?? 0.00,
                'vertical_shift' => $data['vertical_shift'] ?? 0.00,
                'integration_constant' => $data['integration_constant'] ?? 0.00
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to create problem', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 학생 진행 상황 시작
     */
    public function startProgress($user_id, $problem_id, $session_id) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO student_progress (
                    moodle_user_id, problem_id, session_id
                ) VALUES (
                    :user_id, :problem_id, :session_id
                )
            ");

            $stmt->execute([
                'user_id' => $user_id,
                'problem_id' => $problem_id,
                'session_id' => $session_id
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to start progress', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 학생 진행 상황 업데이트
     */
    public function updateProgress($progress_id, $data) {
        try {
            $updates = [];
            $params = ['id' => $progress_id];

            if (isset($data['time_spent_seconds'])) {
                $updates[] = "time_spent_seconds = :time_spent";
                $params['time_spent'] = $data['time_spent_seconds'];
            }

            if (isset($data['attempts'])) {
                $updates[] = "attempts = :attempts";
                $params['attempts'] = $data['attempts'];
            }

            if (isset($data['is_correct'])) {
                $updates[] = "is_correct = :is_correct";
                $params['is_correct'] = $data['is_correct'];
            }

            if (isset($data['student_answer'])) {
                $updates[] = "student_answer = :answer";
                $params['answer'] = json_encode($data['student_answer']);
            }

            if (isset($data['interaction_data'])) {
                $updates[] = "interaction_data = :interaction";
                $params['interaction'] = json_encode($data['interaction_data']);
            }

            if (isset($data['visualization_steps'])) {
                $updates[] = "visualization_steps = :viz_steps";
                $params['viz_steps'] = json_encode($data['visualization_steps']);
            }

            if (isset($data['completed']) && $data['completed']) {
                $updates[] = "completed_at = NOW()";
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE student_progress SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to update progress', 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * 학생 통계 가져오기
     */
    public function getStudentStatistics($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM student_statistics
                WHERE moodle_user_id = :user_id
            ");
            $stmt->execute(['user_id' => $user_id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get statistics', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 세션 로그 기록
     */
    public function logSessionEvent($session_id, $user_id, $event_type, $event_data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO session_logs (
                    session_id, moodle_user_id, event_type, event_data
                ) VALUES (
                    :session_id, :user_id, :event_type, :event_data
                )
            ");

            $stmt->execute([
                'session_id' => $session_id,
                'user_id' => $user_id,
                'event_type' => $event_type,
                'event_data' => json_encode($event_data)
            ]);

            return true;
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to log event', 'error' => $e->getMessage()]);
            return false;
        }
    }
}

// API 엔드포인트 처리
if (php_sapi_name() !== 'cli') {
    $method = $_SERVER['REQUEST_METHOD'];
    $api = new ProblemDataAPI();

    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'problem':
                $problem_id = $_GET['id'] ?? 0;
                $problem = $api->getProblem($problem_id);
                respondSuccess($problem);
                break;

            case 'problems':
                $quiz_id = $_GET['quiz_id'] ?? 0;
                $problems = $api->getProblemsByQuiz($quiz_id);
                respondSuccess($problems);
                break;

            case 'statistics':
                $user_id = $_GET['user_id'] ?? 0;
                $stats = $api->getStudentStatistics($user_id);
                respondSuccess($stats);
                break;

            default:
                respondError('Invalid action', 400);
        }

    } elseif ($method === 'POST') {
        $data = getJsonInput();
        $action = $data['action'] ?? '';

        switch ($action) {
            case 'create_problem':
                $problem_id = $api->createProblem($data);
                respondSuccess(['problem_id' => $problem_id], 'Problem created successfully');
                break;

            case 'start_progress':
                validateRequired($data, ['user_id', 'problem_id', 'session_id']);
                $progress_id = $api->startProgress($data['user_id'], $data['problem_id'], $data['session_id']);
                respondSuccess(['progress_id' => $progress_id], 'Progress started');
                break;

            case 'update_progress':
                validateRequired($data, ['progress_id']);
                $success = $api->updateProgress($data['progress_id'], $data);
                respondSuccess(['updated' => $success], 'Progress updated');
                break;

            case 'log_event':
                validateRequired($data, ['session_id', 'user_id', 'event_type']);
                $logged = $api->logSessionEvent($data['session_id'], $data['user_id'], $data['event_type'], $data['event_data'] ?? []);
                respondSuccess(['logged' => $logged]);
                break;

            default:
                respondError('Invalid action', 400);
        }

    } else {
        respondError('Method not allowed', 405);
    }
}
