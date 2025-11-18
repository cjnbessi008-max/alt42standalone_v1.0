<?php
/**
 * Prerequisite Knowledge Management Service
 * Manages prerequisite relationships and knowledge graph traversal
 */

require_once __DIR__ . '/../../config/Database.php';

class PrerequisiteService {
    private $db;
    private $config;

    public function __construct() {
        $this->db = Database::getInstance();
        $config = require __DIR__ . '/../../config/config.php';
        $this->config = $config['assessment'];
    }

    /**
     * Get all knowledge concepts
     * @param string|null $subject Filter by subject
     * @param string|null $gradeLevel Filter by grade level
     * @return array
     */
    public function getAllConcepts($subject = null, $gradeLevel = null) {
        $sql = "SELECT * FROM knowledge_concepts WHERE 1=1";
        $params = [];

        if ($subject) {
            $sql .= " AND subject = ?";
            $params[] = $subject;
        }

        if ($gradeLevel) {
            $sql .= " AND grade_level = ?";
            $params[] = $gradeLevel;
        }

        $sql .= " ORDER BY difficulty_level ASC, concept_name ASC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get concept by ID
     * @param int $conceptId
     * @return array|false
     */
    public function getConcept($conceptId) {
        $sql = "SELECT * FROM knowledge_concepts WHERE id = ?";
        return $this->db->fetchOne($sql, [$conceptId]);
    }

    /**
     * Get concept by code
     * @param string $conceptCode
     * @return array|false
     */
    public function getConceptByCode($conceptCode) {
        $sql = "SELECT * FROM knowledge_concepts WHERE concept_code = ?";
        return $this->db->fetchOne($sql, [$conceptCode]);
    }

    /**
     * Get prerequisites for a concept
     * @param int $conceptId
     * @param string|null $importance Filter by importance (required, recommended, optional)
     * @return array
     */
    public function getPrerequisites($conceptId, $importance = null) {
        $sql = "SELECT cp.*, kc.*
                FROM concept_prerequisites cp
                JOIN knowledge_concepts kc ON cp.prerequisite_id = kc.id
                WHERE cp.concept_id = ?";
        $params = [$conceptId];

        if ($importance) {
            $sql .= " AND cp.importance = ?";
            $params[] = $importance;
        }

        $sql .= " ORDER BY
                  FIELD(cp.importance, 'required', 'recommended', 'optional'),
                  cp.minimum_mastery_level DESC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get all prerequisites recursively (entire prerequisite tree)
     * @param int $conceptId
     * @param array $visited Track visited concepts to avoid cycles
     * @return array
     */
    public function getPrerequisiteTree($conceptId, &$visited = []) {
        if (in_array($conceptId, $visited)) {
            return []; // Avoid infinite loops
        }

        $visited[] = $conceptId;
        $directPrereqs = $this->getPrerequisites($conceptId);
        $tree = [];

        foreach ($directPrereqs as $prereq) {
            $prereq['children'] = $this->getPrerequisiteTree($prereq['prerequisite_id'], $visited);
            $tree[] = $prereq;
        }

        return $tree;
    }

    /**
     * Get concepts that require this concept as a prerequisite
     * @param int $conceptId
     * @return array
     */
    public function getDependentConcepts($conceptId) {
        $sql = "SELECT cp.*, kc.*
                FROM concept_prerequisites cp
                JOIN knowledge_concepts kc ON cp.concept_id = kc.id
                WHERE cp.prerequisite_id = ?
                ORDER BY kc.difficulty_level ASC";

        return $this->db->fetchAll($sql, [$conceptId]);
    }

    /**
     * Check if a student meets prerequisites for a concept
     * @param int $moodleUserId
     * @param int $conceptId
     * @return array Status information
     */
    public function checkPrerequisites($moodleUserId, $conceptId) {
        $prerequisites = $this->getPrerequisites($conceptId);
        $results = [
            'ready' => true,
            'missing' => [],
            'weak' => [],
            'satisfied' => []
        ];

        foreach ($prerequisites as $prereq) {
            $mastery = $this->getStudentMastery($moodleUserId, $prereq['prerequisite_id']);
            $required = $prereq['minimum_mastery_level'];

            $status = [
                'concept_id' => $prereq['prerequisite_id'],
                'concept_name' => $prereq['concept_name'],
                'concept_name_ko' => $prereq['concept_name_ko'],
                'importance' => $prereq['importance'],
                'current_mastery' => $mastery['mastery_level'],
                'required_mastery' => $required,
                'confidence' => $mastery['confidence_score'],
                'gap' => max(0, $required - $mastery['mastery_level'])
            ];

            if ($mastery['mastery_level'] < $required) {
                if ($prereq['importance'] === 'required') {
                    $results['ready'] = false;
                    $results['missing'][] = $status;
                } else {
                    $results['weak'][] = $status;
                }
            } else {
                $results['satisfied'][] = $status;
            }
        }

        return $results;
    }

    /**
     * Get student's mastery level for a concept
     * @param int $moodleUserId
     * @param int $conceptId
     * @return array
     */
    public function getStudentMastery($moodleUserId, $conceptId) {
        $sql = "SELECT * FROM student_knowledge
                WHERE moodle_user_id = ? AND concept_id = ?";
        $result = $this->db->fetchOne($sql, [$moodleUserId, $conceptId]);

        if (!$result) {
            // No data yet, return default
            return [
                'mastery_level' => 0.0,
                'confidence_score' => 0.0,
                'evidence_count' => 0,
                'last_assessed_at' => null
            ];
        }

        return $result;
    }

    /**
     * Update student's mastery level for a concept
     * @param int $moodleUserId
     * @param string $studentName
     * @param int $conceptId
     * @param float $masteryLevel
     * @param float $confidenceScore
     * @param int $evidenceCount
     * @return bool
     */
    public function updateStudentMastery($moodleUserId, $studentName, $conceptId, $masteryLevel, $confidenceScore, $evidenceCount) {
        $existing = $this->getStudentMastery($moodleUserId, $conceptId);

        if ($existing['evidence_count'] > 0) {
            // Update existing record
            $sql = "UPDATE student_knowledge
                    SET mastery_level = ?,
                        confidence_score = ?,
                        evidence_count = ?,
                        last_assessed_at = NOW()
                    WHERE moodle_user_id = ? AND concept_id = ?";
            $params = [$masteryLevel, $confidenceScore, $evidenceCount, $moodleUserId, $conceptId];
        } else {
            // Insert new record
            $sql = "INSERT INTO student_knowledge
                    (moodle_user_id, student_name, concept_id, mastery_level, confidence_score, evidence_count)
                    VALUES (?, ?, ?, ?, ?, ?)";
            $params = [$moodleUserId, $studentName, $conceptId, $masteryLevel, $confidenceScore, $evidenceCount];
        }

        return $this->db->execute($sql, $params) > 0;
    }

    /**
     * Get all knowledge for a student
     * @param int $moodleUserId
     * @param float|null $minMastery Minimum mastery level filter
     * @return array
     */
    public function getStudentKnowledge($moodleUserId, $minMastery = null) {
        $sql = "SELECT sk.*, kc.*
                FROM student_knowledge sk
                JOIN knowledge_concepts kc ON sk.concept_id = kc.id
                WHERE sk.moodle_user_id = ?";
        $params = [$moodleUserId];

        if ($minMastery !== null) {
            $sql .= " AND sk.mastery_level >= ?";
            $params[] = $minMastery;
        }

        $sql .= " ORDER BY sk.mastery_level DESC, kc.difficulty_level ASC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get concepts mapped to a Moodle module
     * @param int $moduleId
     * @return array
     */
    public function getModuleConcepts($moduleId) {
        $sql = "SELECT mc.*, kc.*
                FROM module_concepts mc
                JOIN knowledge_concepts kc ON mc.concept_id = kc.id
                WHERE mc.module_id = ?
                ORDER BY mc.is_primary DESC, mc.weight DESC";

        return $this->db->fetchAll($sql, [$moduleId]);
    }

    /**
     * Map a concept to a module
     * @param int $moduleId
     * @param int $conceptId
     * @param bool $isPrimary
     * @param float $weight
     * @return bool
     */
    public function mapConceptToModule($moduleId, $conceptId, $isPrimary = false, $weight = 1.0) {
        $sql = "INSERT INTO module_concepts (module_id, concept_id, is_primary, weight)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE is_primary = ?, weight = ?";

        return $this->db->execute($sql, [
            $moduleId, $conceptId, $isPrimary, $weight, $isPrimary, $weight
        ]) > 0;
    }

    /**
     * Get learning path for a student to reach a target concept
     * @param int $moodleUserId
     * @param int $targetConceptId
     * @return array
     */
    public function getLearningPath($moodleUserId, $targetConceptId) {
        $check = $this->checkPrerequisites($moodleUserId, $targetConceptId);

        if ($check['ready']) {
            return [
                'ready' => true,
                'path' => [],
                'message' => 'Student is ready for this concept'
            ];
        }

        // Build learning path from missing prerequisites
        $path = [];
        foreach ($check['missing'] as $missing) {
            $subCheck = $this->checkPrerequisites($moodleUserId, $missing['concept_id']);
            $path[] = [
                'concept' => $missing,
                'sub_prerequisites' => $subCheck['missing']
            ];
        }

        // Sort by dependency depth (concepts with no missing prereqs first)
        usort($path, function($a, $b) {
            return count($a['sub_prerequisites']) - count($b['sub_prerequisites']);
        });

        return [
            'ready' => false,
            'path' => $path,
            'message' => 'Student needs to learn ' . count($check['missing']) . ' prerequisite(s)'
        ];
    }
}
