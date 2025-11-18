<?php
/**
 * Attempt Controller
 * Handles student attempt submissions and tracking
 */

require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../models/Solution.php';
require_once __DIR__ . '/../services/MoodleService.php';

class AttemptController {
    private $attemptModel;
    private $problemModel;
    private $solutionModel;
    private $moodleService;

    public function __construct() {
        $this->attemptModel = new StudentAttempt();
        $this->problemModel = new Problem();
        $this->solutionModel = new Solution();
        $this->moodleService = new MoodleService();
    }

    /**
     * Submit student attempt
     */
    public function submit($data) {
        try {
            // Validate required fields
            $required = ['student_id', 'problem_id', 'selected_solution_id', 'correct_solution_id', 'incorrect_solution_id'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    return $this->jsonResponse([
                        'success' => false,
                        'error' => "Field '{$field}' is required"
                    ], 400);
                }
            }

            // Record the attempt
            $attemptId = $this->attemptModel->recordAttempt($data);

            // Get the attempt with full details
            $attempt = $this->attemptModel->find($attemptId);

            // Prepare response
            $isCorrect = $attempt['is_correct'] == 1;
            $selectedSolution = $this->solutionModel->find($data['selected_solution_id']);

            $response = [
                'success' => true,
                'data' => [
                    'attempt_id' => $attemptId,
                    'is_correct' => $isCorrect,
                    'selected_solution' => $selectedSolution,
                    'feedback' => $this->generateFeedback($attempt, $selectedSolution)
                ]
            ];

            // Sync grade to Moodle if configured
            if (isset($data['moodle_activity_id'])) {
                $grade = $isCorrect ? 100 : 0;
                $syncResult = $this->moodleService->sendGrade(
                    $data['student_id'],
                    $data['moodle_activity_id'],
                    $grade,
                    $attempt
                );

                $response['data']['moodle_sync'] = $syncResult;

                // Log sync result
                $this->logMoodleSync($data['student_id'], $data['problem_id'], $attemptId, $grade, $syncResult);
            }

            return $this->jsonResponse($response, 201);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate feedback based on attempt
     */
    private function generateFeedback($attempt, $selectedSolution) {
        $isCorrect = $attempt['is_correct'] == 1;

        if ($isCorrect) {
            return [
                'type' => 'success',
                'title' => 'Correct!',
                'message' => 'Great job! You correctly identified the right solution.',
                'explanation' => null
            ];
        } else {
            // Decode steps if JSON
            $steps = is_string($selectedSolution['steps'])
                ? json_decode($selectedSolution['steps'], true)
                : $selectedSolution['steps'];

            return [
                'type' => 'error',
                'title' => 'Not quite right',
                'message' => "The solution you selected contains a mistake. Let's see why it's incorrect.",
                'mistake_type' => $selectedSolution['mistake_type'],
                'mistake_description' => $selectedSolution['mistake_description'],
                'explanation' => $selectedSolution['explanation']
            ];
        }
    }

    /**
     * Get student's attempt history
     */
    public function getHistory($studentId, $params = []) {
        try {
            $limit = $params['limit'] ?? 20;
            $problemId = $params['problem_id'] ?? null;

            if ($problemId) {
                $attempts = $this->attemptModel->getStudentProblemAttempts($studentId, $problemId);
            } else {
                $attempts = $this->attemptModel->getRecentWithDetails($studentId, $limit);
            }

            return $this->jsonResponse(['success' => true, 'data' => $attempts]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get student statistics
     */
    public function getStats($studentId) {
        try {
            $overallStats = $this->attemptModel->getStudentStats($studentId);
            $mistakeTypeStats = $this->attemptModel->getPerformanceByMistakeType($studentId);

            return $this->jsonResponse([
                'success' => true,
                'data' => [
                    'overall' => $overallStats,
                    'by_mistake_type' => $mistakeTypeStats
                ]
            ]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get leaderboard
     */
    public function getLeaderboard($params = []) {
        try {
            $limit = $params['limit'] ?? 10;

            $sql = "
                SELECT
                    sp.student_id,
                    sp.accuracy_rate,
                    sp.total_attempts,
                    sp.correct_identifications,
                    RANK() OVER (ORDER BY sp.accuracy_rate DESC, sp.total_attempts DESC) as rank
                FROM student_progress sp
                WHERE sp.total_attempts >= 5
                ORDER BY sp.accuracy_rate DESC, sp.total_attempts DESC
                LIMIT ?
            ";

            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare($sql);
            $stmt->execute([$limit]);
            $leaderboard = $stmt->fetchAll();

            return $this->jsonResponse(['success' => true, 'data' => $leaderboard]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Log Moodle sync attempt
     */
    private function logMoodleSync($studentId, $problemId, $attemptId, $grade, $syncResult) {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO moodle_sync_log
                (student_id, problem_id, attempt_id, grade_sent, moodle_response, sync_status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $status = $syncResult['status'] === 'success' ? 'success' : 'failed';
            $response = json_encode($syncResult);

            $stmt->execute([$studentId, $problemId, $attemptId, $grade, $response, $status]);
        } catch (Exception $e) {
            error_log("Failed to log Moodle sync: " . $e->getMessage());
        }
    }

    /**
     * JSON response helper
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        return json_encode($data);
    }
}
