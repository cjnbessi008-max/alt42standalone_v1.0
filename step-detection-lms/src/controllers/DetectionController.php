<?php
/**
 * Detection Controller
 * 건너뛰기 탐지 API
 */

class DetectionController {
    private $solutionModel;
    private $detectionService;

    public function __construct() {
        $this->solutionModel = new Solution();
        $this->detectionService = new SkipDetectionService();
    }

    /**
     * GET /api/v1/detections/solution/{id}
     * Get detections for a solution
     */
    public function getBySolution($solutionId) {
        $solution = $this->solutionModel->getById($solutionId);

        if (!$solution) {
            sendError('Solution not found', 404);
        }

        $trustScore = $this->detectionService->calculateTrustScore($solutionId);

        sendSuccess([
            'solution_id' => $solutionId,
            'detections' => $solution['detections'],
            'trust_score' => $trustScore
        ]);
    }

    /**
     * GET /api/v1/detections/student/{id}
     * Get all detections for a student
     */
    public function getByStudent($studentId) {
        $db = Database::getInstance()->getConnection();

        $sql = "SELECT sd.*, ss.problem_id, p.title as problem_title, ss.submitted_at
                FROM skip_detections sd
                JOIN student_solutions ss ON sd.solution_id = ss.id
                JOIN problems p ON ss.problem_id = p.id
                WHERE ss.student_id = :student_id
                ORDER BY sd.detected_at DESC
                LIMIT 100";

        $stmt = $db->prepare($sql);
        $stmt->execute([':student_id' => $studentId]);

        $detections = $stmt->fetchAll();

        // Decode JSON fields
        foreach ($detections as &$detection) {
            if ($detection['affected_steps']) {
                $detection['affected_steps'] = json_decode($detection['affected_steps'], true);
            }
            if ($detection['evidence_data']) {
                $detection['evidence_data'] = json_decode($detection['evidence_data'], true);
            }
        }

        sendSuccess($detections);
    }

    /**
     * POST /api/v1/detections/analyze/{id}
     * Re-analyze a solution for skip detection
     */
    public function analyze($solutionId) {
        $solution = $this->solutionModel->getById($solutionId);

        if (!$solution) {
            sendError('Solution not found', 404);
        }

        // Clear existing detections
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM skip_detections WHERE solution_id = :id");
        $stmt->execute([':id' => $solutionId]);

        // Run detection
        $detections = $this->detectionService->analyzeDetection($solutionId);
        $trustScore = $this->detectionService->calculateTrustScore($solutionId);

        sendSuccess([
            'detections' => $detections,
            'trust_score' => $trustScore
        ], 'Re-analysis completed');
    }
}
