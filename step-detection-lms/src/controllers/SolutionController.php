<?php
/**
 * Solution Controller
 * 학생 풀이 관리 API
 */

class SolutionController {
    private $solutionModel;
    private $problemModel;

    public function __construct() {
        $this->solutionModel = new Solution();
        $this->problemModel = new Problem();
    }

    /**
     * POST /api/v1/solutions/start
     * Start a new solution session
     */
    public function start() {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['student_id']) || !isset($input['problem_id'])) {
            sendError('Missing required fields: student_id, problem_id');
        }

        // Validate problem exists
        $problem = $this->problemModel->getById($input['problem_id']);
        if (!$problem) {
            sendError('Problem not found', 404);
        }

        $session = $this->solutionModel->createSession($input['student_id'], $input['problem_id']);

        sendSuccess([
            'solution_id' => $session['solution_id'],
            'session_token' => $session['session_token'],
            'problem' => $problem
        ], 'Solution session started');
    }

    /**
     * POST /api/v1/solutions/submit-step
     * Submit a step answer
     */
    public function submitStep() {
        $input = json_decode(file_get_contents('php://input'), true);

        $required = ['solution_id', 'step_id', 'student_input', 'is_correct', 'time_spent'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                sendError("Missing required field: $field");
            }
        }

        $submissionId = $this->solutionModel->submitStep(
            $input['solution_id'],
            $input['step_id'],
            $input['student_input'],
            $input['is_correct'],
            $input['time_spent'],
            $input['hint_used'] ?? false
        );

        sendSuccess([
            'submission_id' => $submissionId
        ], 'Step submitted successfully');
    }

    /**
     * POST /api/v1/solutions/submit-final
     * Submit final solution
     */
    public function submitFinal() {
        $input = json_decode(file_get_contents('php://input'), true);

        $required = ['solution_id', 'final_answer', 'is_correct', 'score'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                sendError("Missing required field: $field");
            }
        }

        $this->solutionModel->submitFinal(
            $input['solution_id'],
            $input['final_answer'],
            $input['is_correct'],
            $input['score']
        );

        // Run skip detection analysis
        $detectionService = new SkipDetectionService();
        $detections = $detectionService->analyzeSkipDetection($input['solution_id']);
        $trustScore = $detectionService->calculateTrustScore($input['solution_id']);

        // Update problem statistics
        $solution = $this->solutionModel->getById($input['solution_id']);
        $this->problemModel->updateStatistics($solution['problem_id']);

        sendSuccess([
            'detections' => $detections,
            'trust_score' => $trustScore
        ], 'Solution submitted successfully');
    }

    /**
     * POST /api/v1/solutions/hint
     * Mark hint as viewed
     */
    public function viewHint() {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['solution_id']) || !isset($input['step_id'])) {
            sendError('Missing required fields: solution_id, step_id');
        }

        $this->solutionModel->markHintViewed($input['solution_id'], $input['step_id']);

        sendSuccess(null, 'Hint marked as viewed');
    }

    /**
     * GET /api/v1/solutions/{id}
     * Get solution details
     */
    public function show($id) {
        $solution = $this->solutionModel->getById($id);

        if (!$solution) {
            sendError('Solution not found', 404);
        }

        // Calculate trust score
        $detectionService = new SkipDetectionService();
        $solution['trust_score'] = $detectionService->calculateTrustScore($id);

        sendSuccess($solution);
    }
}
