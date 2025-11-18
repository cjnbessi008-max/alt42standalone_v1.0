<?php
/**
 * Problem Controller
 * 문제 관리 API
 */

class ProblemController {
    private $problemModel;

    public function __construct() {
        $this->problemModel = new Problem();
    }

    /**
     * GET /api/v1/problems
     * Get all problems with optional filters
     */
    public function index() {
        $filters = [
            'problem_type_id' => $_GET['type_id'] ?? null,
            'difficulty_level' => $_GET['difficulty'] ?? null,
            'category' => $_GET['category'] ?? null
        ];

        $problems = $this->problemModel->getAll($filters);
        sendSuccess($problems);
    }

    /**
     * GET /api/v1/problems/{id}
     * Get problem by ID with steps
     */
    public function show($id) {
        $problem = $this->problemModel->getById($id);

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        sendSuccess($problem);
    }

    /**
     * GET /api/v1/problem-types
     * Get all problem types
     */
    public function types() {
        $types = $this->problemModel->getTypes();
        sendSuccess($types);
    }
}
