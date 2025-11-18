<?php
/**
 * Recommendation Engine
 *
 * Automatically recommends questions based on student level and performance
 * "추천방식으로 알아서 선택" - Auto-select with recommendation
 */

namespace App\Services;

use App\Database\Connection;

class RecommendationEngine
{
    private $db;
    private $config;

    public function __construct(Connection $db, array $config)
    {
        $this->db = $db;
        $this->config = $config['recommendation'];
    }

    /**
     * Get recommended questions for student
     *
     * @param int $studentId
     * @param int|null $categoryId Optional category filter
     * @param int $count Number of questions to recommend
     * @return array Recommended questions
     */
    public function getRecommendedQuestions($studentId, $categoryId = null, $count = null)
    {
        if ($count === null) {
            $count = $this->config['questions_per_session'];
        }

        // Get student's current level and progress
        $studentLevel = $this->getStudentLevel($studentId, $categoryId);

        // Build query for recommended questions
        $query = "
            SELECT
                q.id,
                q.title,
                q.question_text,
                q.question_type,
                q.difficulty_level,
                q.points,
                q.time_limit,
                q.hints,
                c.name as category_name,
                c.id as category_id,
                (SELECT COUNT(*) FROM attempts WHERE question_id = q.id AND student_id = :student_id) as attempt_count,
                (SELECT MAX(is_correct) FROM attempts WHERE question_id = q.id AND student_id = :student_id) as has_solved
            FROM questions q
            JOIN categories c ON q.category_id = c.id
            WHERE q.is_active = 1
        ";

        $params = ['student_id' => $studentId];

        // Filter by category if specified
        if ($categoryId !== null) {
            $query .= " AND q.category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        // Adaptive difficulty: choose questions around student's level
        if ($this->config['adaptive_difficulty']) {
            $minLevel = max(1, $studentLevel - 1);
            $maxLevel = min(5, $studentLevel + 1);
            $query .= " AND q.difficulty_level BETWEEN :min_level AND :max_level";
            $params['min_level'] = $minLevel;
            $params['max_level'] = $maxLevel;
        }

        // Prioritize questions:
        // 1. Not yet attempted
        // 2. Attempted but not solved
        // 3. Solved but can review
        $query .= "
            ORDER BY
                has_solved ASC,
                attempt_count ASC,
                RAND()
            LIMIT :count
        ";
        $params['count'] = $count;

        return $this->db->fetchAll($query, $params);
    }

    /**
     * Get student's current difficulty level for a category
     *
     * @param int $studentId
     * @param int|null $categoryId
     * @return int Current level (1-5)
     */
    public function getStudentLevel($studentId, $categoryId = null)
    {
        if ($categoryId !== null) {
            // Get level from student_progress table
            $query = "
                SELECT current_level
                FROM student_progress
                WHERE student_id = :student_id AND category_id = :category_id
                LIMIT 1
            ";
            $result = $this->db->fetchOne($query, [
                'student_id' => $studentId,
                'category_id' => $categoryId
            ]);

            if ($result) {
                return (int) $result['current_level'];
            }
        }

        // Calculate level based on overall performance
        $query = "
            SELECT
                AVG(
                    CASE
                        WHEN is_correct = 1 THEN q.difficulty_level
                        ELSE q.difficulty_level - 1
                    END
                ) as avg_level
            FROM attempts a
            JOIN questions q ON a.question_id = q.id
            WHERE a.student_id = :student_id
        ";

        $params = ['student_id' => $studentId];

        if ($categoryId !== null) {
            $query .= " AND q.category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        $result = $this->db->fetchOne($query, $params);

        if ($result && $result['avg_level'] !== null) {
            return max(1, min(5, round($result['avg_level'])));
        }

        // Default starting level
        return 1;
    }

    /**
     * Update student level based on recent performance
     *
     * @param int $studentId
     * @param int $categoryId
     * @param bool $isCorrect Whether last attempt was correct
     */
    public function updateStudentLevel($studentId, $categoryId, $isCorrect)
    {
        // Get current progress
        $query = "
            SELECT id, current_level, total_attempts, correct_attempts
            FROM student_progress
            WHERE student_id = :student_id AND category_id = :category_id
            LIMIT 1
        ";

        $progress = $this->db->fetchOne($query, [
            'student_id' => $studentId,
            'category_id' => $categoryId
        ]);

        $totalAttempts = 1;
        $correctAttempts = $isCorrect ? 1 : 0;
        $currentLevel = 1;

        if ($progress) {
            // Update existing progress
            $totalAttempts = $progress['total_attempts'] + 1;
            $correctAttempts = $progress['correct_attempts'] + ($isCorrect ? 1 : 0);
            $currentLevel = $progress['current_level'];

            // Adjust level based on performance
            $successRate = $correctAttempts / $totalAttempts;

            if ($isCorrect && $successRate > 0.7 && $currentLevel < 5) {
                // Increase difficulty
                $currentLevel = min(5, $currentLevel + 1);
            } elseif (!$isCorrect && $successRate < 0.5 && $currentLevel > 1) {
                // Decrease difficulty
                $currentLevel = max(1, $currentLevel - 1);
            }

            $masteryScore = $successRate * 100;

            $updateQuery = "
                UPDATE student_progress
                SET
                    current_level = :level,
                    total_attempts = :total,
                    correct_attempts = :correct,
                    mastery_score = :mastery,
                    last_activity = NOW()
                WHERE id = :id
            ";

            $this->db->execute($updateQuery, [
                'level' => $currentLevel,
                'total' => $totalAttempts,
                'correct' => $correctAttempts,
                'mastery' => $masteryScore,
                'id' => $progress['id']
            ]);
        } else {
            // Create new progress record
            $insertQuery = "
                INSERT INTO student_progress
                (student_id, category_id, current_level, total_attempts, correct_attempts, mastery_score)
                VALUES (:student_id, :category_id, :level, :total, :correct, :mastery)
            ";

            $this->db->execute($insertQuery, [
                'student_id' => $studentId,
                'category_id' => $categoryId,
                'level' => $currentLevel,
                'total' => $totalAttempts,
                'correct' => $correctAttempts,
                'mastery' => $correctAttempts * 100
            ]);
        }
    }

    /**
     * Get next recommended question (single)
     *
     * @param int $studentId
     * @param int|null $categoryId
     * @return array|null Question data
     */
    public function getNextQuestion($studentId, $categoryId = null)
    {
        $questions = $this->getRecommendedQuestions($studentId, $categoryId, 1);
        return !empty($questions) ? $questions[0] : null;
    }

    /**
     * Check if category is mastered
     *
     * @param int $studentId
     * @param int $categoryId
     * @return bool
     */
    public function isCategoryMastered($studentId, $categoryId)
    {
        $query = "
            SELECT mastery_score
            FROM student_progress
            WHERE student_id = :student_id AND category_id = :category_id
            LIMIT 1
        ";

        $result = $this->db->fetchOne($query, [
            'student_id' => $studentId,
            'category_id' => $categoryId
        ]);

        if ($result) {
            return $result['mastery_score'] >= $this->config['mastery_threshold'];
        }

        return false;
    }
}
