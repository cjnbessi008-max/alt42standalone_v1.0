<?php
/**
 * LearningSummary Model
 * Manages AI-generated learning summaries and student reflections
 */

require_once __DIR__ . '/../config/database.php';

class LearningSummary {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create a new learning summary
     */
    public function create($sessionId, $summaryData) {
        $data = [
            'session_id' => $sessionId,
            'summary_type' => $summaryData['summary_type'] ?? 'ai_generated',
            'concepts_learned' => $summaryData['concepts_learned'] ?? null,
            'strengths' => $summaryData['strengths'] ?? null,
            'weaknesses' => $summaryData['weaknesses'] ?? null,
            'misconceptions' => $summaryData['misconceptions'] ?? null,
            'recommendations' => $summaryData['recommendations'] ?? null,
            'ai_model' => $summaryData['ai_model'] ?? null,
            'confidence_score' => $summaryData['confidence_score'] ?? null
        ];

        // Handle JSON data
        if (isset($summaryData['detailed_analysis'])) {
            $data['detailed_analysis'] = json_encode($summaryData['detailed_analysis']);
        }

        return $this->db->insert('learning_summaries', $data);
    }

    /**
     * Get summary by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM learning_summaries WHERE id = ?";
        $summary = $this->db->fetchOne($sql, [$id]);

        if ($summary && $summary['detailed_analysis']) {
            $summary['detailed_analysis'] = json_decode($summary['detailed_analysis'], true);
        }

        return $summary;
    }

    /**
     * Get summary by session ID
     */
    public function getBySessionId($sessionId) {
        $sql = "SELECT * FROM learning_summaries WHERE session_id = ? ORDER BY generated_at DESC LIMIT 1";
        $summary = $this->db->fetchOne($sql, [$sessionId]);

        if ($summary && $summary['detailed_analysis']) {
            $summary['detailed_analysis'] = json_decode($summary['detailed_analysis'], true);
        }

        return $summary;
    }

    /**
     * Update summary
     */
    public function update($id, $data) {
        if (isset($data['detailed_analysis']) && is_array($data['detailed_analysis'])) {
            $data['detailed_analysis'] = json_encode($data['detailed_analysis']);
        }

        return $this->db->update('learning_summaries', $data, 'id = ?', [$id]);
    }

    /**
     * Delete summary
     */
    public function delete($id) {
        return $this->db->delete('learning_summaries', 'id = ?', [$id]);
    }

    /**
     * Add or update student reflection
     */
    public function saveReflection($sessionId, $reflectionData) {
        // Check if reflection already exists
        $sql = "SELECT id FROM student_reflections WHERE session_id = ?";
        $existing = $this->db->fetchOne($sql, [$sessionId]);

        $data = [
            'what_i_learned' => $reflectionData['what_i_learned'] ?? null,
            'what_was_difficult' => $reflectionData['what_was_difficult'] ?? null,
            'what_i_want_to_learn' => $reflectionData['what_i_want_to_learn'] ?? null,
            'confidence_rating' => $reflectionData['confidence_rating'] ?? null
        ];

        if ($existing) {
            // Update existing reflection
            return $this->db->update('student_reflections', $data, 'session_id = ?', [$sessionId]);
        } else {
            // Create new reflection
            $data['session_id'] = $sessionId;
            return $this->db->insert('student_reflections', $data);
        }
    }

    /**
     * Get student reflection
     */
    public function getReflection($sessionId) {
        $sql = "SELECT * FROM student_reflections WHERE session_id = ?";
        return $this->db->fetchOne($sql, [$sessionId]);
    }

    /**
     * Get summary with reflection
     */
    public function getSummaryWithReflection($sessionId) {
        $summary = $this->getBySessionId($sessionId);
        $reflection = $this->getReflection($sessionId);

        return [
            'summary' => $summary,
            'reflection' => $reflection
        ];
    }

    /**
     * Add concept tags to summary
     */
    public function addConceptTag($summaryId, $tagName, $proficiency = 'practicing') {
        // Get or create tag
        $sql = "SELECT id FROM concept_tags WHERE tag_name = ?";
        $tag = $this->db->fetchOne($sql, [$tagName]);

        if (!$tag) {
            // Create new tag
            $tagId = $this->db->insert('concept_tags', [
                'tag_name' => $tagName,
                'category' => 'mathematics'
            ]);
        } else {
            $tagId = $tag['id'];
        }

        // Link to summary
        $data = [
            'summary_id' => $summaryId,
            'concept_tag_id' => $tagId,
            'proficiency_level' => $proficiency
        ];

        try {
            return $this->db->insert('summary_concepts', $data);
        } catch (Exception $e) {
            // Ignore duplicate key errors
            return true;
        }
    }

    /**
     * Get concept tags for summary
     */
    public function getConceptTags($summaryId) {
        $sql = "SELECT ct.*, sc.proficiency_level
                FROM concept_tags ct
                JOIN summary_concepts sc ON ct.id = sc.concept_tag_id
                WHERE sc.summary_id = ?";

        return $this->db->fetchAll($sql, [$summaryId]);
    }

    /**
     * Get all summaries for a user (across all sessions)
     */
    public function getUserSummaries($userId, $limit = 20) {
        $sql = "SELECT ls.*, lsum.*
                FROM learning_summaries lsum
                JOIN learning_sessions ls ON lsum.session_id = ls.id
                WHERE ls.moodle_user_id = ?
                ORDER BY lsum.generated_at DESC
                LIMIT ?";

        $summaries = $this->db->fetchAll($sql, [$userId, $limit]);

        // Decode JSON fields
        foreach ($summaries as &$summary) {
            if ($summary['detailed_analysis']) {
                $summary['detailed_analysis'] = json_decode($summary['detailed_analysis'], true);
            }
        }

        return $summaries;
    }

    /**
     * Get learning progress over time
     */
    public function getLearningProgress($userId) {
        $sql = "SELECT
                    DATE(ls.completed_at) as date,
                    COUNT(*) as sessions_count,
                    AVG(ls.score) as avg_score,
                    AVG(lsum.confidence_score) as avg_confidence
                FROM learning_sessions ls
                LEFT JOIN learning_summaries lsum ON ls.id = lsum.session_id
                WHERE ls.moodle_user_id = ? AND ls.status = 'completed'
                GROUP BY DATE(ls.completed_at)
                ORDER BY date DESC
                LIMIT 30";

        return $this->db->fetchAll($sql, [$userId]);
    }

    /**
     * Get concept mastery overview
     */
    public function getConceptMastery($userId) {
        $sql = "SELECT
                    ct.tag_name,
                    ct.category,
                    COUNT(*) as practice_count,
                    AVG(CASE sc.proficiency_level
                        WHEN 'introduced' THEN 1
                        WHEN 'practicing' THEN 2
                        WHEN 'proficient' THEN 3
                        WHEN 'mastered' THEN 4
                        ELSE 0
                    END) as avg_proficiency
                FROM learning_summaries lsum
                JOIN learning_sessions ls ON lsum.session_id = ls.id
                JOIN summary_concepts sc ON lsum.id = sc.summary_id
                JOIN concept_tags ct ON sc.concept_tag_id = ct.id
                WHERE ls.moodle_user_id = ?
                GROUP BY ct.id, ct.tag_name, ct.category
                ORDER BY avg_proficiency DESC, practice_count DESC";

        return $this->db->fetchAll($sql, [$userId]);
    }

    /**
     * Check if summary exists for session
     */
    public function existsForSession($sessionId) {
        $sql = "SELECT COUNT(*) as count FROM learning_summaries WHERE session_id = ?";
        $result = $this->db->fetchOne($sql, [$sessionId]);
        return $result['count'] > 0;
    }

    /**
     * Get latest summaries across all users (for admin)
     */
    public function getLatestSummaries($limit = 50) {
        $sql = "SELECT
                    lsum.*,
                    ls.student_name,
                    ls.quiz_name,
                    ls.score
                FROM learning_summaries lsum
                JOIN learning_sessions ls ON lsum.session_id = ls.id
                ORDER BY lsum.generated_at DESC
                LIMIT ?";

        $summaries = $this->db->fetchAll($sql, [$limit]);

        // Decode JSON fields
        foreach ($summaries as &$summary) {
            if ($summary['detailed_analysis']) {
                $summary['detailed_analysis'] = json_decode($summary['detailed_analysis'], true);
            }
        }

        return $summaries;
    }
}
