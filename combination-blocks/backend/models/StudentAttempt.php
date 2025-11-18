<?php
/**
 * StudentAttempt Model
 * Handles student attempt submissions and tracking
 */

class StudentAttempt {
    private $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    /**
     * Get attempt by ID
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $stmt = $this->pdo->prepare("
            SELECT id, combination_block_id, moodle_user_id, moodle_attempt_id,
                   combination_data, result_value, is_correct, time_spent,
                   score, feedback, created_at
            FROM student_attempts
            WHERE id = :id
        ");
        $stmt->execute(['id' => $id]);
        $attempt = $stmt->fetch();

        if ($attempt && isset($attempt['combination_data'])) {
            $attempt['combination_data'] = json_decode($attempt['combination_data'], true);
        }

        return $attempt;
    }

    /**
     * Get all attempts for a user and block
     * @param int $userId
     * @param int $blockId
     * @return array
     */
    public function getUserAttempts($userId, $blockId) {
        $stmt = $this->pdo->prepare("
            SELECT id, combination_data, result_value, is_correct,
                   time_spent, score, feedback, created_at
            FROM student_attempts
            WHERE moodle_user_id = :userId
            AND combination_block_id = :blockId
            ORDER BY created_at DESC
        ");
        $stmt->execute([
            'userId' => $userId,
            'blockId' => $blockId
        ]);
        $attempts = $stmt->fetchAll();

        foreach ($attempts as &$attempt) {
            if (isset($attempt['combination_data'])) {
                $attempt['combination_data'] = json_decode($attempt['combination_data'], true);
            }
        }

        return $attempts;
    }

    /**
     * Submit a new attempt
     * @param array $data
     * @return array Result with attempt ID and feedback
     */
    public function submitAttempt($data) {
        $blockModel = new CombinationBlock();

        // Validate block exists
        $block = $blockModel->getById($data['combination_block_id']);
        if (!$block) {
            throw new Exception('Block not found');
        }

        // Validate combination
        $combinationData = $data['combination_data'] ?? [];
        $isCorrect = $blockModel->validateSolution(
            $data['combination_block_id'],
            $combinationData
        );

        // Calculate score (simple: 100 if correct, 0 if wrong)
        $score = $isCorrect ? 100.0 : 0.0;

        // Generate feedback
        $feedback = $this->generateFeedback($block, $combinationData, $isCorrect);

        // Insert attempt
        $stmt = $this->pdo->prepare("
            INSERT INTO student_attempts
            (combination_block_id, moodle_user_id, moodle_attempt_id,
             combination_data, result_value, is_correct, time_spent, score, feedback)
            VALUES (:blockId, :userId, :attemptId, :combinationData,
                    :resultValue, :isCorrect, :timeSpent, :score, :feedback)
        ");

        $stmt->execute([
            'blockId' => $data['combination_block_id'],
            'userId' => $data['moodle_user_id'],
            'attemptId' => $data['moodle_attempt_id'] ?? null,
            'combinationData' => json_encode($combinationData),
            'resultValue' => $data['result_value'] ?? null,
            'isCorrect' => $isCorrect ? 1 : 0,
            'timeSpent' => $data['time_spent'] ?? null,
            'score' => $score,
            'feedback' => $feedback
        ]);

        $attemptId = $this->pdo->lastInsertId();

        // Update student progress
        $this->updateProgress(
            $data['moodle_user_id'],
            $data['combination_block_id'],
            $isCorrect,
            $score,
            $data['time_spent'] ?? null
        );

        // Send grade to Moodle if applicable
        if ($data['moodle_attempt_id'] ?? null) {
            sendGradeToMoodle(
                $data['moodle_user_id'],
                $block['moodle_question_id'],
                $score
            );
        }

        return [
            'attempt_id' => $attemptId,
            'is_correct' => $isCorrect,
            'score' => $score,
            'feedback' => $feedback
        ];
    }

    /**
     * Generate feedback for attempt
     * @param array $block
     * @param array $combinationData
     * @param bool $isCorrect
     * @return string
     */
    private function generateFeedback($block, $combinationData, $isCorrect) {
        if ($isCorrect) {
            return "정답입니다! 목표 '{$block['target_combination']}'를 성공적으로 만들었습니다.";
        }

        if (empty($combinationData)) {
            return "블록을 선택해서 조합을 만들어보세요.";
        }

        return "아쉽네요. 목표 '{$block['target_combination']}'을(를) 만들어야 합니다. 다시 시도해보세요!";
    }

    /**
     * Update student progress
     * @param int $userId
     * @param int $blockId
     * @param bool $isCorrect
     * @param float $score
     * @param int|null $timeSpent
     */
    private function updateProgress($userId, $blockId, $isCorrect, $score, $timeSpent) {
        // Check if progress record exists
        $stmt = $this->pdo->prepare("
            SELECT id, attempts_count, correct_attempts, best_score, best_time, is_completed
            FROM student_progress
            WHERE moodle_user_id = :userId AND combination_block_id = :blockId
        ");
        $stmt->execute(['userId' => $userId, 'blockId' => $blockId]);
        $progress = $stmt->fetch();

        if ($progress) {
            // Update existing progress
            $newAttemptsCount = $progress['attempts_count'] + 1;
            $newCorrectAttempts = $progress['correct_attempts'] + ($isCorrect ? 1 : 0);
            $newBestScore = max($progress['best_score'] ?? 0, $score);
            $newBestTime = null;

            if ($timeSpent !== null) {
                if ($progress['best_time'] === null) {
                    $newBestTime = $timeSpent;
                } else {
                    $newBestTime = min($progress['best_time'], $timeSpent);
                }
            }

            $isCompleted = $isCorrect || $progress['is_completed'];
            $completedAt = $isCompleted && !$progress['is_completed'] ? date('Y-m-d H:i:s') : null;

            $stmt = $this->pdo->prepare("
                UPDATE student_progress
                SET attempts_count = :attemptsCount,
                    correct_attempts = :correctAttempts,
                    best_score = :bestScore,
                    best_time = COALESCE(:bestTime, best_time),
                    is_completed = :isCompleted,
                    last_attempt_at = NOW(),
                    completed_at = COALESCE(:completedAt, completed_at)
                WHERE id = :id
            ");

            $stmt->execute([
                'attemptsCount' => $newAttemptsCount,
                'correctAttempts' => $newCorrectAttempts,
                'bestScore' => $newBestScore,
                'bestTime' => $newBestTime,
                'isCompleted' => $isCompleted ? 1 : 0,
                'completedAt' => $completedAt,
                'id' => $progress['id']
            ]);
        } else {
            // Create new progress record
            $stmt = $this->pdo->prepare("
                INSERT INTO student_progress
                (combination_block_id, moodle_user_id, attempts_count, correct_attempts,
                 best_score, best_time, is_completed, first_attempt_at, last_attempt_at, completed_at)
                VALUES (:blockId, :userId, 1, :correctAttempts, :score, :timeSpent,
                        :isCompleted, NOW(), NOW(), :completedAt)
            ");

            $stmt->execute([
                'blockId' => $blockId,
                'userId' => $userId,
                'correctAttempts' => $isCorrect ? 1 : 0,
                'score' => $score,
                'timeSpent' => $timeSpent,
                'isCompleted' => $isCorrect ? 1 : 0,
                'completedAt' => $isCorrect ? date('Y-m-d H:i:s') : null
            ]);
        }
    }
}
