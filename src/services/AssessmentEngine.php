<?php
/**
 * Assessment Engine
 * Analyzes Moodle grade data to assess student knowledge levels
 */

require_once __DIR__ . '/MoodleService.php';
require_once __DIR__ . '/PrerequisiteService.php';
require_once __DIR__ . '/../../config/Database.php';

class AssessmentEngine {
    private $moodle;
    private $prereqService;
    private $db;
    private $config;

    public function __construct() {
        $this->moodle = new MoodleService();
        $this->prereqService = new PrerequisiteService();
        $this->db = Database::getInstance();
        $config = require __DIR__ . '/../../config/config.php';
        $this->config = $config['assessment'];
    }

    /**
     * Assess student knowledge for all concepts based on Moodle data
     * @param int $moodleUserId
     * @param int $courseId
     * @return array Assessment results
     */
    public function assessStudent($moodleUserId, $courseId) {
        // Get user info
        $user = $this->moodle->getUser($moodleUserId);
        if (!$user) {
            throw new Exception("User not found: $moodleUserId");
        }

        // Get user grades
        $grades = $this->moodle->getUserGrades($courseId, $moodleUserId);

        // Get course modules
        $modules = $this->getLocalModulesForCourse($courseId);

        $assessments = [];

        foreach ($modules as $module) {
            // Get concepts for this module
            $concepts = $this->prereqService->getModuleConcepts($module['id']);

            if (empty($concepts)) {
                continue; // Skip modules without concept mapping
            }

            // Find grade for this module
            $moduleGrade = $this->findModuleGrade($grades, $module);

            if ($moduleGrade === null) {
                continue; // No grade data
            }

            // Calculate mastery for each concept
            foreach ($concepts as $concept) {
                $mastery = $this->calculateMastery($moduleGrade, $concept);

                $assessments[] = [
                    'concept_id' => $concept['concept_id'],
                    'concept_name' => $concept['concept_name'],
                    'concept_name_ko' => $concept['concept_name_ko'],
                    'module_id' => $module['id'],
                    'module_name' => $module['module_name'],
                    'mastery_level' => $mastery['level'],
                    'confidence' => $mastery['confidence'],
                    'evidence_count' => $mastery['evidence_count']
                ];

                // Update database
                $this->prereqService->updateStudentMastery(
                    $moodleUserId,
                    $user['fullname'],
                    $concept['concept_id'],
                    $mastery['level'],
                    $mastery['confidence'],
                    $mastery['evidence_count']
                );
            }
        }

        return $assessments;
    }

    /**
     * Calculate mastery level from grade data
     * @param array $gradeData
     * @param array $concept
     * @return array
     */
    private function calculateMastery($gradeData, $concept) {
        $grade = $gradeData['grade'] ?? 0;
        $maxGrade = $gradeData['max_grade'] ?? 100;

        // Normalize to 0.0 - 1.0
        $normalizedGrade = min(1.0, max(0.0, $grade / $maxGrade));

        // Apply concept weight
        $weight = $concept['weight'] ?? 1.0;
        $masteryLevel = $normalizedGrade * $weight;

        // Calculate confidence based on evidence
        $evidenceCount = 1; // Single grade point
        $confidence = $this->calculateConfidence($evidenceCount);

        return [
            'level' => round($masteryLevel, 2),
            'confidence' => round($confidence, 2),
            'evidence_count' => $evidenceCount
        ];
    }

    /**
     * Calculate confidence score based on evidence count
     * @param int $evidenceCount
     * @return float
     */
    private function calculateConfidence($evidenceCount) {
        $minEvidence = $this->config['confidence_min_evidence'];

        if ($evidenceCount >= $minEvidence) {
            return 1.0;
        }

        // Linear increase from 0.3 to 1.0
        return 0.3 + (0.7 * ($evidenceCount / $minEvidence));
    }

    /**
     * Find grade data for a specific module
     * @param array $grades
     * @param array $module
     * @return array|null
     */
    private function findModuleGrade($grades, $module) {
        // This is simplified - in reality, you'd need to match by module type and ID
        // Moodle's grade structure can be complex

        if (empty($grades['items'])) {
            return null;
        }

        foreach ($grades['items'] as $item) {
            // Match by name or item number
            if (isset($item['itemname']) && stripos($item['itemname'], $module['module_name']) !== false) {
                return [
                    'grade' => $item['graderaw'] ?? 0,
                    'max_grade' => $item['grademax'] ?? 100,
                    'feedback' => $item['feedback'] ?? ''
                ];
            }
        }

        return null;
    }

    /**
     * Get local modules for a course
     * @param int $courseId
     * @return array
     */
    private function getLocalModulesForCourse($courseId) {
        $sql = "SELECT * FROM moodle_modules
                WHERE course_id = (SELECT id FROM moodle_courses WHERE moodle_course_id = ?)
                AND visible = 1";
        return $this->db->fetchAll($sql, [$courseId]);
    }

    /**
     * Batch assess all students in a course
     * @param int $courseId
     * @return array Summary of assessments
     */
    public function assessCourse($courseId) {
        $users = $this->moodle->getEnrolledUsers($courseId);
        $results = [
            'total_students' => count($users),
            'assessed' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($users as $user) {
            try {
                $this->assessStudent($user['id'], $courseId);
                $results['assessed']++;
            } catch (Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'user_id' => $user['id'],
                    'user_name' => $user['fullname'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Generate recommendations for a student
     * @param int $moodleUserId
     * @param int $targetModuleId
     * @return array
     */
    public function generateRecommendations($moodleUserId, $targetModuleId) {
        // Get concepts for target module
        $targetConcepts = $this->prereqService->getModuleConcepts($targetModuleId);

        if (empty($targetConcepts)) {
            return [
                'ready' => true,
                'recommendations' => [],
                'message' => 'No prerequisite requirements defined for this module'
            ];
        }

        $recommendations = [];

        foreach ($targetConcepts as $concept) {
            $check = $this->prereqService->checkPrerequisites($moodleUserId, $concept['concept_id']);

            if (!$check['ready']) {
                foreach ($check['missing'] as $missing) {
                    // Find modules that teach this missing concept
                    $learningModules = $this->findModulesForConcept($missing['concept_id']);

                    $priority = $this->calculatePriority($missing);

                    $recommendations[] = [
                        'target_concept' => $concept['concept_name_ko'],
                        'missing_concept' => $missing['concept_name_ko'],
                        'current_mastery' => $missing['current_mastery'],
                        'required_mastery' => $missing['required_mastery'],
                        'gap' => $missing['gap'],
                        'priority' => $priority,
                        'importance' => $missing['importance'],
                        'recommended_modules' => $learningModules
                    ];
                }
            }
        }

        // Sort by priority
        usort($recommendations, function($a, $b) {
            $priorityOrder = ['high' => 0, 'medium' => 1, 'low' => 2];
            return $priorityOrder[$a['priority']] - $priorityOrder[$b['priority']];
        });

        // Limit recommendations
        $maxItems = require __DIR__ . '/../../config/config.php';
        $maxItems = $maxItems['recommendation']['max_items'];
        $recommendations = array_slice($recommendations, 0, $maxItems);

        return [
            'ready' => empty($recommendations),
            'recommendations' => $recommendations,
            'message' => empty($recommendations)
                ? 'Student is ready for this module'
                : 'Student should complete these prerequisites first'
        ];
    }

    /**
     * Calculate recommendation priority
     * @param array $missing
     * @return string
     */
    private function calculatePriority($missing) {
        $config = require __DIR__ . '/../../config/config.php';
        $config = $config['recommendation'];

        if ($missing['importance'] === 'required') {
            if ($missing['current_mastery'] < $config['high_priority_threshold']) {
                return 'high';
            }
            if ($missing['current_mastery'] < $config['medium_priority_threshold']) {
                return 'medium';
            }
        }

        return 'low';
    }

    /**
     * Find modules that teach a specific concept
     * @param int $conceptId
     * @return array
     */
    private function findModulesForConcept($conceptId) {
        $sql = "SELECT mm.*, mc.is_primary, mc.weight
                FROM moodle_modules mm
                JOIN module_concepts mc ON mm.id = mc.module_id
                WHERE mc.concept_id = ?
                AND mm.visible = 1
                ORDER BY mc.is_primary DESC, mc.weight DESC
                LIMIT 3";

        return $this->db->fetchAll($sql, [$conceptId]);
    }

    /**
     * Save recommendation to database
     * @param int $moodleUserId
     * @param int $targetModuleId
     * @param array $recommendation
     * @return bool
     */
    public function saveRecommendation($moodleUserId, $targetModuleId, $recommendation) {
        $sql = "INSERT INTO recommendations
                (moodle_user_id, target_module_id, missing_concept_id, current_mastery,
                 required_mastery, priority, recommended_modules)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $recommendedModules = json_encode($recommendation['recommended_modules']);

        return $this->db->execute($sql, [
            $moodleUserId,
            $targetModuleId,
            $recommendation['missing_concept']['concept_id'] ?? null,
            $recommendation['current_mastery'],
            $recommendation['required_mastery'],
            $recommendation['priority'],
            $recommendedModules
        ]) > 0;
    }
}
