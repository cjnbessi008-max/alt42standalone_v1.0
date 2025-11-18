<?php
/**
 * Problem Model
 */

require_once __DIR__ . '/BaseModel.php';

class Problem extends BaseModel {
    protected $table = 'problems';

    /**
     * Get problems by subject
     */
    public function getBySubject($subject, $limit = null) {
        return $this->where(['subject' => $subject, 'is_active' => 1], $limit);
    }

    /**
     * Get problems by difficulty
     */
    public function getByDifficulty($difficulty, $limit = null) {
        return $this->where(['difficulty_level' => $difficulty, 'is_active' => 1], $limit);
    }

    /**
     * Get problems by grade level
     */
    public function getByGradeLevel($gradeLevel, $limit = null) {
        return $this->where(['grade_level' => $gradeLevel, 'is_active' => 1], $limit);
    }

    /**
     * Get problems with solutions
     */
    public function getWithSolutions($problemId) {
        $sql = "
            SELECT
                p.*,
                s.id as solution_id,
                s.solution_type,
                s.title as solution_title,
                s.steps,
                s.final_answer,
                s.mistake_type,
                s.mistake_description,
                s.explanation
            FROM problems p
            LEFT JOIN solutions s ON p.id = s.problem_id
            WHERE p.id = ?
        ";

        $stmt = $this->query($sql, [$problemId]);
        $results = $stmt->fetchAll();

        if (empty($results)) {
            return null;
        }

        $problem = [
            'id' => $results[0]['id'],
            'title' => $results[0]['title'],
            'description' => $results[0]['description'],
            'subject' => $results[0]['subject'],
            'difficulty_level' => $results[0]['difficulty_level'],
            'grade_level' => $results[0]['grade_level'],
            'problem_data' => json_decode($results[0]['problem_data'], true),
            'solutions' => []
        ];

        foreach ($results as $row) {
            if ($row['solution_id']) {
                $problem['solutions'][] = [
                    'id' => $row['solution_id'],
                    'solution_type' => $row['solution_type'],
                    'title' => $row['solution_title'],
                    'steps' => json_decode($row['steps'], true),
                    'final_answer' => $row['final_answer'],
                    'mistake_type' => $row['mistake_type'],
                    'mistake_description' => $row['mistake_description'],
                    'explanation' => $row['explanation']
                ];
            }
        }

        return $problem;
    }

    /**
     * Get random problem for practice
     */
    public function getRandom($subject = null, $difficulty = null) {
        $conditions = ['is_active' => 1];

        if ($subject) {
            $conditions['subject'] = $subject;
        }

        if ($difficulty) {
            $conditions['difficulty_level'] = $difficulty;
        }

        $where = array_map(function($field) {
            return "$field = ?";
        }, array_keys($conditions));

        $sql = sprintf(
            "SELECT * FROM %s WHERE %s ORDER BY RAND() LIMIT 1",
            $this->table,
            implode(' AND ', $where)
        );

        $stmt = $this->query($sql, array_values($conditions));
        return $stmt->fetch();
    }

    /**
     * Get problems from Moodle course
     */
    public function getByMoodleCourse($courseId) {
        return $this->where(['moodle_course_id' => $courseId, 'is_active' => 1]);
    }

    /**
     * Create problem with JSON data validation
     */
    public function createProblem(array $data) {
        // Ensure problem_data is JSON
        if (isset($data['problem_data']) && is_array($data['problem_data'])) {
            $data['problem_data'] = json_encode($data['problem_data']);
        }

        return $this->create($data);
    }

    /**
     * Get problem statistics
     */
    public function getStats($problemId) {
        $sql = "
            SELECT
                p.id,
                p.title,
                COUNT(sa.id) as total_attempts,
                SUM(sa.is_correct) as correct_attempts,
                ROUND(AVG(sa.is_correct) * 100, 2) as success_rate,
                ROUND(AVG(sa.time_spent_seconds), 2) as avg_time_seconds,
                ROUND(AVG(sa.hints_used), 2) as avg_hints_used
            FROM problems p
            LEFT JOIN student_attempts sa ON p.id = sa.problem_id
            WHERE p.id = ?
            GROUP BY p.id
        ";

        $stmt = $this->query($sql, [$problemId]);
        return $stmt->fetch();
    }
}
