<?php
/**
 * Problem Model
 * Handles problem data operations
 */

require_once __DIR__ . '/../config/Database.php';

class Problem {
    private $db;
    private $calculator;

    public function __construct(Database $db, LogarithmCalculator $calculator) {
        $this->db = $db;
        $this->calculator = $calculator;
    }

    /**
     * Get problem by ID
     *
     * @param int $id Problem ID
     * @return array|null Problem data or null if not found
     */
    public function getById($id) {
        $sql = 'SELECT * FROM problems WHERE id = :id AND is_active = 1';
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    /**
     * Get problem by Moodle question ID
     *
     * @param int $moodleQuestionId Moodle question ID
     * @return array|null Problem data or null if not found
     */
    public function getByMoodleQuestionId($moodleQuestionId) {
        $sql = 'SELECT * FROM problems WHERE moodle_question_id = :moodle_id AND is_active = 1';
        return $this->db->fetchOne($sql, ['moodle_id' => $moodleQuestionId]);
    }

    /**
     * Get random problem by difficulty
     *
     * @param int $difficulty Difficulty level (1-5)
     * @return array|null Random problem or null if none found
     */
    public function getRandomByDifficulty($difficulty = 1) {
        $sql = 'SELECT * FROM problems
                WHERE difficulty = :difficulty AND is_active = 1
                ORDER BY RAND()
                LIMIT 1';

        return $this->db->fetchOne($sql, ['difficulty' => $difficulty]);
    }

    /**
     * Get all problems for a quiz
     *
     * @param int $quizId Moodle quiz ID
     * @return array Array of problems
     */
    public function getByQuizId($quizId) {
        $sql = 'SELECT * FROM problems
                WHERE moodle_quiz_id = :quiz_id AND is_active = 1
                ORDER BY difficulty ASC, id ASC';

        return $this->db->fetchAll($sql, ['quiz_id' => $quizId]);
    }

    /**
     * Create a new problem
     *
     * @param array $data Problem data
     * @return int New problem ID
     */
    public function create($data) {
        $requiredFields = ['base', 'result', 'correct_answer'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException("Missing required field: $field");
            }
        }

        // Verify the math is correct
        if (!$this->calculator->verify($data['base'], $data['correct_answer'], $data['result'])) {
            throw new InvalidArgumentException('Invalid logarithm equation');
        }

        $insertData = [
            'moodle_question_id' => $data['moodle_question_id'] ?? 0,
            'moodle_quiz_id' => $data['moodle_quiz_id'] ?? null,
            'problem_type' => $data['problem_type'] ?? 'calculate',
            'base' => $data['base'],
            'result' => $data['result'],
            'correct_answer' => $data['correct_answer'],
            'difficulty' => $data['difficulty'] ?? 1,
            'question_text' => $data['question_text'] ?? sprintf(
                'Calculate: log₍%d₎ %d = ?',
                $data['base'],
                $data['result']
            ),
            'hint_text' => $data['hint_text'] ?? $this->calculator->getHint(
                $data['base'],
                $data['result'],
                $data['correct_answer']
            ),
            'explanation' => $data['explanation'] ?? $this->calculator->getFeedback(
                true,
                $data['base'],
                $data['result'],
                $data['correct_answer'],
                $data['correct_answer']
            ),
            'max_attempts' => $data['max_attempts'] ?? 3,
            'time_limit' => $data['time_limit'] ?? null,
        ];

        return $this->db->insert('problems', $insertData);
    }

    /**
     * Update a problem
     *
     * @param int $id Problem ID
     * @param array $data Updated data
     * @return int Number of affected rows
     */
    public function update($id, $data) {
        // Don't allow updating the math values directly
        $allowedFields = [
            'question_text', 'hint_text', 'explanation',
            'difficulty', 'max_attempts', 'time_limit', 'is_active'
        ];

        $updateData = [];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (empty($updateData)) {
            return 0;
        }

        return $this->db->update('problems', $updateData, 'id = :id', ['id' => $id]);
    }

    /**
     * Deactivate a problem (soft delete)
     *
     * @param int $id Problem ID
     * @return int Number of affected rows
     */
    public function deactivate($id) {
        return $this->update($id, ['is_active' => 0]);
    }

    /**
     * Get problem statistics
     *
     * @param int $id Problem ID
     * @return array Statistics data
     */
    public function getStatistics($id) {
        $sql = 'SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(time_spent) as avg_time_spent,
                    MIN(time_spent) as min_time_spent,
                    MAX(time_spent) as max_time_spent
                FROM student_attempts
                WHERE problem_id = :id';

        $stats = $this->db->fetchOne($sql, ['id' => $id]);

        if ($stats && $stats['total_attempts'] > 0) {
            $stats['success_rate'] = round(
                ($stats['correct_attempts'] / $stats['total_attempts']) * 100,
                2
            );
        } else {
            $stats['success_rate'] = 0;
        }

        return $stats;
    }

    /**
     * Get next recommended problem for a student
     *
     * @param int $studentId Student ID
     * @return array|null Next problem or null
     */
    public function getNextForStudent($studentId) {
        // Get student's recent performance
        $sql = 'SELECT
                    AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy,
                    p.difficulty
                FROM student_attempts sa
                JOIN problems p ON sa.problem_id = p.id
                WHERE sa.student_id = :student_id
                AND sa.attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                GROUP BY p.difficulty
                ORDER BY sa.attempted_at DESC
                LIMIT 10';

        $recentPerformance = $this->db->fetchOne($sql, ['student_id' => $studentId]);

        // Determine appropriate difficulty
        $targetDifficulty = 1;
        if ($recentPerformance) {
            $accuracy = $recentPerformance['accuracy'];
            $currentDifficulty = $recentPerformance['difficulty'];

            if ($accuracy > 0.8 && $currentDifficulty < 5) {
                $targetDifficulty = $currentDifficulty + 1; // Increase difficulty
            } elseif ($accuracy < 0.5 && $currentDifficulty > 1) {
                $targetDifficulty = $currentDifficulty - 1; // Decrease difficulty
            } else {
                $targetDifficulty = $currentDifficulty; // Maintain difficulty
            }
        }

        // Get a problem the student hasn't solved correctly yet
        $sql = 'SELECT p.*
                FROM problems p
                WHERE p.difficulty = :difficulty
                AND p.is_active = 1
                AND p.id NOT IN (
                    SELECT problem_id
                    FROM student_attempts
                    WHERE student_id = :student_id
                    AND is_correct = 1
                )
                ORDER BY RAND()
                LIMIT 1';

        $problem = $this->db->fetchOne($sql, [
            'difficulty' => $targetDifficulty,
            'student_id' => $studentId
        ]);

        // If no unsolved problems at this difficulty, get any problem
        if (!$problem) {
            $problem = $this->getRandomByDifficulty($targetDifficulty);
        }

        return $problem;
    }

    /**
     * Search problems
     *
     * @param array $filters Search filters
     * @return array Array of problems
     */
    public function search($filters = []) {
        $where = ['is_active = 1'];
        $params = [];

        if (isset($filters['difficulty'])) {
            $where[] = 'difficulty = :difficulty';
            $params['difficulty'] = $filters['difficulty'];
        }

        if (isset($filters['base'])) {
            $where[] = 'base = :base';
            $params['base'] = $filters['base'];
        }

        if (isset($filters['problem_type'])) {
            $where[] = 'problem_type = :problem_type';
            $params['problem_type'] = $filters['problem_type'];
        }

        if (isset($filters['moodle_quiz_id'])) {
            $where[] = 'moodle_quiz_id = :quiz_id';
            $params['quiz_id'] = $filters['moodle_quiz_id'];
        }

        $sql = 'SELECT * FROM problems WHERE ' . implode(' AND ', $where) . ' ORDER BY difficulty, id';

        return $this->db->fetchAll($sql, $params);
    }
}
