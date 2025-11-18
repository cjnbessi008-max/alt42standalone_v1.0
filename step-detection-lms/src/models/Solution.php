<?php
/**
 * Solution Model
 * 학생 풀이 관리 모델
 */

class Solution {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create new solution session
     */
    public function createSession($studentId, $problemId) {
        $sessionToken = bin2hex(random_bytes(32));

        $sql = "INSERT INTO student_solutions (student_id, problem_id, session_token, ip_address, user_agent)
                VALUES (:student_id, :problem_id, :session_token, :ip_address, :user_agent)";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':student_id' => $studentId,
            ':problem_id' => $problemId,
            ':session_token' => $sessionToken,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];

        $stmt->execute($params);
        $solutionId = $this->db->lastInsertId();

        return [
            'solution_id' => $solutionId,
            'session_token' => $sessionToken
        ];
    }

    /**
     * Get solution by ID
     */
    public function getById($id) {
        $sql = "SELECT ss.*, s.username, s.full_name as student_name,
                       p.title as problem_title
                FROM student_solutions ss
                LEFT JOIN students s ON ss.student_id = s.id
                LEFT JOIN problems p ON ss.problem_id = p.id
                WHERE ss.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $solution = $stmt->fetch();

        if (!$solution) {
            return null;
        }

        // Get step submissions
        $solution['step_submissions'] = $this->getStepSubmissions($id);

        // Get detections
        $solution['detections'] = $this->getDetections($id);

        return $solution;
    }

    /**
     * Get solution by session token
     */
    public function getBySessionToken($token) {
        $sql = "SELECT * FROM student_solutions WHERE session_token = :token";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':token' => $token]);

        return $stmt->fetch();
    }

    /**
     * Submit step
     */
    public function submitStep($solutionId, $stepId, $studentInput, $isCorrect, $timeSpent, $hintUsed = false) {
        // Get current attempt number
        $sql = "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
                FROM step_submissions
                WHERE solution_id = :solution_id AND step_id = :step_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':solution_id' => $solutionId, ':step_id' => $stepId]);
        $attemptNumber = $stmt->fetchColumn();

        // Insert step submission
        $sql = "INSERT INTO step_submissions (solution_id, step_id, attempt_number, student_input,
                                              is_correct, time_spent_seconds, hint_used)
                VALUES (:solution_id, :step_id, :attempt_number, :student_input,
                        :is_correct, :time_spent_seconds, :hint_used)";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':solution_id' => $solutionId,
            ':step_id' => $stepId,
            ':attempt_number' => $attemptNumber,
            ':student_input' => is_array($studentInput) ? json_encode($studentInput) : $studentInput,
            ':is_correct' => $isCorrect ? 1 : 0,
            ':time_spent_seconds' => $timeSpent,
            ':hint_used' => $hintUsed ? 1 : 0
        ];

        $stmt->execute($params);
        return $this->db->lastInsertId();
    }

    /**
     * Mark hint as viewed
     */
    public function markHintViewed($solutionId, $stepId) {
        $sql = "UPDATE step_submissions
                SET hint_viewed_at = NOW()
                WHERE solution_id = :solution_id AND step_id = :step_id
                ORDER BY submitted_at DESC LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':solution_id' => $solutionId, ':step_id' => $stepId]);
    }

    /**
     * Submit final solution
     */
    public function submitFinal($solutionId, $finalAnswer, $isCorrect, $score) {
        $sql = "UPDATE student_solutions
                SET submitted_at = NOW(),
                    total_time_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                    final_answer = :final_answer,
                    is_correct = :is_correct,
                    score = :score,
                    status = 'submitted'
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':id' => $solutionId,
            ':final_answer' => is_array($finalAnswer) ? json_encode($finalAnswer) : $finalAnswer,
            ':is_correct' => $isCorrect ? 1 : 0,
            ':score' => $score
        ];

        $stmt->execute($params);
    }

    /**
     * Get step submissions for a solution
     */
    public function getStepSubmissions($solutionId) {
        $sql = "SELECT ss.*, ps.display_name, ps.step_order
                FROM step_submissions ss
                LEFT JOIN problem_steps ps ON ss.step_id = ps.id
                WHERE ss.solution_id = :solution_id
                ORDER BY ps.step_order, ss.submitted_at";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':solution_id' => $solutionId]);

        $submissions = $stmt->fetchAll();

        // Decode JSON inputs
        foreach ($submissions as &$submission) {
            $decoded = json_decode($submission['student_input'], true);
            if ($decoded !== null) {
                $submission['student_input'] = $decoded;
            }
        }

        return $submissions;
    }

    /**
     * Get detections for a solution
     */
    public function getDetections($solutionId) {
        $sql = "SELECT * FROM skip_detections WHERE solution_id = :solution_id ORDER BY detected_at";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':solution_id' => $solutionId]);

        $detections = $stmt->fetchAll();

        // Decode JSON fields
        foreach ($detections as &$detection) {
            if ($detection['affected_steps']) {
                $detection['affected_steps'] = json_decode($detection['affected_steps'], true);
            }
            if ($detection['evidence_data']) {
                $detection['evidence_data'] = json_decode($detection['evidence_data'], true);
            }
        }

        return $detections;
    }

    /**
     * Get solutions by student
     */
    public function getByStudent($studentId, $limit = 50) {
        $sql = "SELECT ss.*, p.title as problem_title, p.difficulty_level
                FROM student_solutions ss
                LEFT JOIN problems p ON ss.problem_id = p.id
                WHERE ss.student_id = :student_id
                ORDER BY ss.started_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get solutions by problem
     */
    public function getByProblem($problemId, $limit = 100) {
        $sql = "SELECT ss.*, s.username, s.full_name as student_name
                FROM student_solutions ss
                LEFT JOIN students s ON ss.student_id = s.id
                WHERE ss.problem_id = :problem_id
                ORDER BY ss.started_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':problem_id', $problemId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
