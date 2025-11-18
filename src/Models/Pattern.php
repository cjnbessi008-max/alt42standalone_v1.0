<?php
/**
 * Pattern Model
 * Represents a color pattern classification problem
 */

namespace ColorPattern\Models;

use ColorPattern\Utils\Database;
use ColorPattern\Utils\Validator;

class Pattern {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get problem by ID
     */
    public function getById($id) {
        Validator::positiveInteger($id, 'Problem ID');

        $sql = "SELECT * FROM problems WHERE id = ? LIMIT 1";
        $result = $this->db->selectOne($sql, [$id]);

        if ($result) {
            $result['sequence_data'] = json_decode($result['sequence_data'], true);
            $result['color_mapping'] = json_decode($result['color_mapping'], true);
            $result['correct_answer'] = json_decode($result['correct_answer'], true);
        }

        return $result;
    }

    /**
     * Get problem by Moodle question ID
     */
    public function getByMoodleQuestionId($moodleQuestionId) {
        Validator::positiveInteger($moodleQuestionId, 'Moodle Question ID');

        $sql = "SELECT * FROM problems WHERE moodle_question_id = ? LIMIT 1";
        $result = $this->db->selectOne($sql, [$moodleQuestionId]);

        if ($result) {
            $result['sequence_data'] = json_decode($result['sequence_data'], true);
            $result['color_mapping'] = json_decode($result['color_mapping'], true);
            $result['correct_answer'] = json_decode($result['correct_answer'], true);
        }

        return $result;
    }

    /**
     * Get problems by pattern type
     */
    public function getByPatternType($patternType, $limit = 10, $offset = 0) {
        Validator::patternType($patternType);

        $sql = "SELECT * FROM problems WHERE pattern_type = ?
                ORDER BY difficulty_level ASC, created_at DESC
                LIMIT ? OFFSET ?";

        $results = $this->db->select($sql, [$patternType, (int)$limit, (int)$offset]);

        foreach ($results as &$result) {
            $result['sequence_data'] = json_decode($result['sequence_data'], true);
            $result['color_mapping'] = json_decode($result['color_mapping'], true);
            $result['correct_answer'] = json_decode($result['correct_answer'], true);
        }

        return $results;
    }

    /**
     * Get problems by difficulty level
     */
    public function getByDifficulty($difficultyLevel, $limit = 10) {
        Validator::difficultyLevel($difficultyLevel);

        $sql = "SELECT * FROM problems WHERE difficulty_level = ?
                ORDER BY created_at DESC LIMIT ?";

        $results = $this->db->select($sql, [$difficultyLevel, (int)$limit]);

        foreach ($results as &$result) {
            $result['sequence_data'] = json_decode($result['sequence_data'], true);
            $result['color_mapping'] = json_decode($result['color_mapping'], true);
            $result['correct_answer'] = json_decode($result['correct_answer'], true);
        }

        return $results;
    }

    /**
     * Create new problem
     */
    public function create($data) {
        // Validate input
        Validator::required($data['moodle_question_id'], 'Moodle Question ID');
        Validator::required($data['pattern_type'], 'Pattern Type');
        Validator::patternType($data['pattern_type']);
        Validator::sequenceData($data['sequence_data']);
        Validator::isArray($data['color_mapping'], 'Color Mapping');
        Validator::isArray($data['correct_answer'], 'Correct Answer');

        $sql = "INSERT INTO problems
                (moodle_question_id, pattern_type, sequence_data, color_mapping,
                 correct_answer, difficulty_level)
                VALUES (?, ?, ?, ?, ?, ?)";

        $params = [
            $data['moodle_question_id'],
            $data['pattern_type'],
            json_encode($data['sequence_data']),
            json_encode($data['color_mapping']),
            json_encode($data['correct_answer']),
            $data['difficulty_level'] ?? 1
        ];

        return $this->db->insert($sql, $params);
    }

    /**
     * Update problem
     */
    public function update($id, $data) {
        Validator::positiveInteger($id, 'Problem ID');

        $updateFields = [];
        $params = [];

        $allowedFields = [
            'pattern_type', 'sequence_data', 'color_mapping',
            'correct_answer', 'difficulty_level'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if (in_array($field, ['sequence_data', 'color_mapping', 'correct_answer'])) {
                    $updateFields[] = "{$field} = ?";
                    $params[] = json_encode($data[$field]);
                } else {
                    $updateFields[] = "{$field} = ?";
                    $params[] = $data[$field];
                }
            }
        }

        if (empty($updateFields)) {
            throw new \InvalidArgumentException("No valid fields to update");
        }

        $params[] = $id;
        $sql = "UPDATE problems SET " . implode(', ', $updateFields) . " WHERE id = ?";

        return $this->db->update($sql, $params);
    }

    /**
     * Delete problem
     */
    public function delete($id) {
        Validator::positiveInteger($id, 'Problem ID');

        $sql = "DELETE FROM problems WHERE id = ?";
        return $this->db->delete($sql, [$id]);
    }

    /**
     * Get all pattern templates
     */
    public function getPatternTemplates() {
        $sql = "SELECT * FROM pattern_templates
                WHERE is_active = 1
                ORDER BY display_order ASC";

        return $this->db->select($sql);
    }

    /**
     * Get random problem
     */
    public function getRandom($patternType = null, $difficultyLevel = null) {
        $sql = "SELECT * FROM problems WHERE 1=1";
        $params = [];

        if ($patternType !== null) {
            Validator::patternType($patternType);
            $sql .= " AND pattern_type = ?";
            $params[] = $patternType;
        }

        if ($difficultyLevel !== null) {
            Validator::difficultyLevel($difficultyLevel);
            $sql .= " AND difficulty_level = ?";
            $params[] = $difficultyLevel;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $result = $this->db->selectOne($sql, $params);

        if ($result) {
            $result['sequence_data'] = json_decode($result['sequence_data'], true);
            $result['color_mapping'] = json_decode($result['color_mapping'], true);
            $result['correct_answer'] = json_decode($result['correct_answer'], true);
        }

        return $result;
    }

    /**
     * Get problem statistics
     */
    public function getStatistics($problemId) {
        Validator::positiveInteger($problemId, 'Problem ID');

        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(score) as average_score,
                    AVG(time_spent_seconds) as average_time
                FROM student_progress
                WHERE problem_id = ? AND submitted_at IS NOT NULL";

        return $this->db->selectOne($sql, [$problemId]);
    }
}
