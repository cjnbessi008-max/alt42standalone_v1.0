<?php
/**
 * Sequence Puzzle Game Engine
 * Handles puzzle logic, validation, and scoring
 */

class PuzzleEngine {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get puzzle by ID
     */
    public function getPuzzle($puzzleId) {
        $puzzle = $this->db->fetchOne(
            "SELECT * FROM sequence_puzzles WHERE id = ? AND is_active = 1",
            [$puzzleId]
        );

        if (!$puzzle) {
            return null;
        }

        // Parse JSON fields
        $puzzle['sequence_data'] = json_decode($puzzle['sequence_data'], true);
        $puzzle['puzzle_pieces'] = json_decode($puzzle['puzzle_pieces'], true);
        $puzzle['correct_answer'] = json_decode($puzzle['correct_answer'], true);

        return $puzzle;
    }

    /**
     * Get random puzzle by difficulty
     */
    public function getRandomPuzzle($difficulty = null) {
        $sql = "SELECT * FROM sequence_puzzles WHERE is_active = 1";
        $params = [];

        if ($difficulty) {
            $sql .= " AND difficulty = ?";
            $params[] = $difficulty;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $puzzle = $this->db->fetchOne($sql, $params);

        if (!$puzzle) {
            return null;
        }

        return $this->getPuzzle($puzzle['id']);
    }

    /**
     * Get puzzles by category
     */
    public function getPuzzlesByCategory($categoryId, $limit = 10) {
        $puzzles = $this->db->fetchAll(
            "SELECT * FROM sequence_puzzles
             WHERE category_id = ? AND is_active = 1
             ORDER BY difficulty, id
             LIMIT ?",
            [$categoryId, $limit]
        );

        return array_map(function($puzzle) {
            return $this->getPuzzle($puzzle['id']);
        }, $puzzles);
    }

    /**
     * Get all categories
     */
    public function getCategories() {
        return $this->db->fetchAll("SELECT * FROM puzzle_categories ORDER BY id");
    }

    /**
     * Start puzzle attempt
     */
    public function startAttempt($sessionId, $puzzleId) {
        // Check if there's an ongoing attempt
        $existing = $this->db->fetchOne(
            "SELECT * FROM student_attempts
             WHERE session_id = ? AND puzzle_id = ? AND submitted_at IS NULL",
            [$sessionId, $puzzleId]
        );

        if ($existing) {
            return $existing;
        }

        // Create new attempt
        $this->db->execute(
            "INSERT INTO student_attempts (session_id, puzzle_id, started_at)
             VALUES (?, ?, NOW())",
            [$sessionId, $puzzleId]
        );

        $attemptId = $this->db->lastInsertId();

        return $this->db->fetchOne(
            "SELECT * FROM student_attempts WHERE id = ?",
            [$attemptId]
        );
    }

    /**
     * Submit answer and calculate score
     */
    public function submitAnswer($attemptId, $studentAnswer) {
        $attempt = $this->db->fetchOne(
            "SELECT * FROM student_attempts WHERE id = ?",
            [$attemptId]
        );

        if (!$attempt || $attempt['submitted_at']) {
            return ['error' => 'Invalid or already submitted attempt'];
        }

        $puzzle = $this->getPuzzle($attempt['puzzle_id']);
        if (!$puzzle) {
            return ['error' => 'Puzzle not found'];
        }

        // Validate answer
        $result = $this->validateAnswer($puzzle, $studentAnswer);

        // Calculate time spent
        $timeSpent = time() - strtotime($attempt['started_at']);

        // Calculate score
        $score = 0;
        if ($result['is_correct']) {
            $score = $puzzle['points'];

            // Bonus for speed (max 50% bonus)
            $timeBonus = max(0, ($puzzle['time_limit'] - $timeSpent) / $puzzle['time_limit']) * 0.5;
            $score = round($score * (1 + $timeBonus));

            // Penalty for using hint
            if ($attempt['hint_used']) {
                $score = round($score * 0.8);
            }
        }

        // Update attempt
        $this->db->execute(
            "UPDATE student_attempts
             SET student_answer = ?, is_correct = ?, score = ?, time_spent = ?, submitted_at = NOW()
             WHERE id = ?",
            [json_encode($studentAnswer), $result['is_correct'], $score, $timeSpent, $attemptId]
        );

        // Update learning progress
        $this->updateProgress($attempt['session_id'], $result['is_correct'], $score);

        return [
            'is_correct' => $result['is_correct'],
            'score' => $score,
            'time_spent' => $timeSpent,
            'feedback' => $result['feedback'],
            'correct_answer' => $puzzle['correct_answer']
        ];
    }

    /**
     * Validate student answer
     */
    private function validateAnswer($puzzle, $studentAnswer) {
        $correctAnswer = $puzzle['correct_answer'];

        // Check if answer matches correct sequence
        $isCorrect = $this->compareAnswers($correctAnswer, $studentAnswer);

        $feedback = [];
        if ($isCorrect) {
            $feedback[] = "정답입니다! 잘하셨어요!";
        } else {
            $feedback[] = "아쉽게도 틀렸습니다. 다시 한번 생각해보세요.";

            // Provide specific feedback
            $specificFeedback = $this->generateFeedback($puzzle, $studentAnswer);
            $feedback = array_merge($feedback, $specificFeedback);
        }

        return [
            'is_correct' => $isCorrect,
            'feedback' => $feedback
        ];
    }

    /**
     * Compare student answer with correct answer
     */
    private function compareAnswers($correct, $student) {
        if (!is_array($student)) {
            return false;
        }

        if (count($correct) !== count($student)) {
            return false;
        }

        for ($i = 0; $i < count($correct); $i++) {
            if ($correct[$i] != $student[$i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate specific feedback
     */
    private function generateFeedback($puzzle, $studentAnswer) {
        $feedback = [];

        // Check sequence type and provide hints
        switch ($puzzle['sequence_type']) {
            case 'arithmetic':
                $feedback[] = "힌트: 각 숫자 사이의 차이를 확인해보세요.";
                break;
            case 'geometric':
                $feedback[] = "힌트: 각 숫자가 이전 숫자의 몇 배인지 확인해보세요.";
                break;
            case 'fibonacci':
                $feedback[] = "힌트: 앞의 두 숫자를 더해보세요.";
                break;
            case 'custom':
                if ($puzzle['hint']) {
                    $feedback[] = "힌트: " . $puzzle['hint'];
                }
                break;
        }

        return $feedback;
    }

    /**
     * Update learning progress
     */
    private function updateProgress($sessionId, $isCorrect, $score) {
        $progress = $this->db->fetchOne(
            "SELECT * FROM learning_progress WHERE session_id = ?",
            [$sessionId]
        );

        $totalAttempted = $progress['total_puzzles_attempted'] + 1;
        $totalSolved = $progress['total_puzzles_solved'] + ($isCorrect ? 1 : 0);
        $totalScore = $progress['total_score'] + $score;

        // Calculate average time
        $attempts = $this->db->fetchAll(
            "SELECT time_spent FROM student_attempts
             WHERE session_id = ? AND submitted_at IS NOT NULL",
            [$sessionId]
        );

        $avgTime = 0;
        if (count($attempts) > 0) {
            $totalTime = array_sum(array_column($attempts, 'time_spent'));
            $avgTime = $totalTime / count($attempts);
        }

        $this->db->execute(
            "UPDATE learning_progress
             SET total_puzzles_attempted = ?, total_puzzles_solved = ?,
                 total_score = ?, average_time = ?
             WHERE session_id = ?",
            [$totalAttempted, $totalSolved, $totalScore, $avgTime, $sessionId]
        );
    }

    /**
     * Get student progress
     */
    public function getProgress($sessionId) {
        $progress = $this->db->fetchOne(
            "SELECT * FROM learning_progress WHERE session_id = ?",
            [$sessionId]
        );

        if (!$progress) {
            return null;
        }

        // Calculate success rate
        $successRate = 0;
        if ($progress['total_puzzles_attempted'] > 0) {
            $successRate = ($progress['total_puzzles_solved'] / $progress['total_puzzles_attempted']) * 100;
        }

        $progress['success_rate'] = round($successRate, 1);

        return $progress;
    }

    /**
     * Mark hint as used
     */
    public function useHint($attemptId) {
        $this->db->execute(
            "UPDATE student_attempts SET hint_used = 1 WHERE id = ?",
            [$attemptId]
        );
    }

    /**
     * Get student attempt history
     */
    public function getAttemptHistory($sessionId, $limit = 20) {
        return $this->db->fetchAll(
            "SELECT sa.*, sp.title, sp.difficulty, sp.points
             FROM student_attempts sa
             JOIN sequence_puzzles sp ON sa.puzzle_id = sp.id
             WHERE sa.session_id = ?
             ORDER BY sa.started_at DESC
             LIMIT ?",
            [$sessionId, $limit]
        );
    }
}
