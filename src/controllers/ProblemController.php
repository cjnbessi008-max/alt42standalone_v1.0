<?php
/**
 * Problem Controller
 * Handles problem-related API endpoints
 */

require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../models/Solution.php';
require_once __DIR__ . '/../services/AIService.php';

class ProblemController {
    private $problemModel;
    private $solutionModel;
    private $aiService;

    public function __construct() {
        $this->problemModel = new Problem();
        $this->solutionModel = new Solution();
        $this->aiService = new AIService();
    }

    /**
     * Get all problems
     */
    public function index($params = []) {
        try {
            $subject = $params['subject'] ?? null;
            $difficulty = $params['difficulty'] ?? null;
            $gradeLevel = $params['grade_level'] ?? null;
            $limit = $params['limit'] ?? 50;
            $offset = $params['offset'] ?? 0;

            if ($subject) {
                $problems = $this->problemModel->getBySubject($subject, $limit);
            } elseif ($difficulty) {
                $problems = $this->problemModel->getByDifficulty($difficulty, $limit);
            } elseif ($gradeLevel) {
                $problems = $this->problemModel->getByGradeLevel($gradeLevel, $limit);
            } else {
                $problems = $this->problemModel->all($limit, $offset);
            }

            return $this->jsonResponse(['success' => true, 'data' => $problems]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get single problem with solutions
     */
    public function show($id) {
        try {
            $problem = $this->problemModel->getWithSolutions($id);

            if (!$problem) {
                return $this->jsonResponse(['success' => false, 'error' => 'Problem not found'], 404);
            }

            return $this->jsonResponse(['success' => true, 'data' => $problem]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get random problem
     */
    public function random($params = []) {
        try {
            $subject = $params['subject'] ?? null;
            $difficulty = $params['difficulty'] ?? null;

            $problem = $this->problemModel->getRandom($subject, $difficulty);

            if (!$problem) {
                return $this->jsonResponse(['success' => false, 'error' => 'No problems found'], 404);
            }

            return $this->jsonResponse(['success' => true, 'data' => $problem]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get comparison pair for a problem
     */
    public function getComparison($id) {
        try {
            $problem = $this->problemModel->find($id);

            if (!$problem) {
                return $this->jsonResponse(['success' => false, 'error' => 'Problem not found'], 404);
            }

            // Decode problem_data JSON
            $problem['problem_data'] = json_decode($problem['problem_data'], true);

            // Get solution comparison pair
            $comparison = $this->solutionModel->getComparisonPair($id);

            if (!$comparison) {
                return $this->jsonResponse([
                    'success' => false,
                    'error' => 'No solutions available for this problem'
                ], 404);
            }

            return $this->jsonResponse([
                'success' => true,
                'data' => [
                    'problem' => $problem,
                    'solutions' => [
                        'solution_a' => $comparison['solution_a'],
                        'solution_b' => $comparison['solution_b']
                    ],
                    'correct_id' => $comparison['correct_id']
                ]
            ]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create new problem
     */
    public function create($data) {
        try {
            // Validate required fields
            $required = ['title', 'description', 'subject'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->jsonResponse([
                        'success' => false,
                        'error' => "Field '{$field}' is required"
                    ], 400);
                }
            }

            // Set defaults
            $data['difficulty_level'] = $data['difficulty_level'] ?? 'medium';
            $data['is_active'] = 1;

            // Create problem
            $problemId = $this->problemModel->createProblem($data);

            // Get the created problem
            $problem = $this->problemModel->find($problemId);

            return $this->jsonResponse([
                'success' => true,
                'data' => $problem,
                'message' => 'Problem created successfully'
            ], 201);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create problem with AI-generated solutions
     */
    public function createWithSolutions($data) {
        try {
            // Create the problem first
            $problemId = $this->problemModel->createProblem($data);
            $problem = $this->problemModel->find($problemId);

            // Decode problem_data for AI
            $problemData = $problem;
            $problemData['problem_data'] = json_decode($problem['problem_data'], true);

            // Generate solutions using AI
            $solutions = $this->aiService->generateSolutions($problemData);

            // Save correct solution
            $correctData = [
                'problem_id' => $problemId,
                'solution_type' => 'correct',
                'title' => $solutions['correct']['title'],
                'steps' => $solutions['correct']['steps'],
                'final_answer' => $solutions['correct']['final_answer'],
                'explanation' => $solutions['correct']['explanation'] ?? null,
                'generated_by' => 'ai'
            ];
            $this->solutionModel->createSolution($correctData);

            // Save incorrect solution
            $incorrectData = [
                'problem_id' => $problemId,
                'solution_type' => 'incorrect',
                'title' => $solutions['incorrect']['title'],
                'steps' => $solutions['incorrect']['steps'],
                'final_answer' => $solutions['incorrect']['final_answer'],
                'mistake_type' => $solutions['incorrect']['mistake_type'],
                'mistake_description' => $solutions['incorrect']['mistake_description'],
                'explanation' => $solutions['incorrect']['explanation'] ?? null,
                'generated_by' => 'ai'
            ];
            $this->solutionModel->createSolution($incorrectData);

            // Get complete problem with solutions
            $completeData = $this->problemModel->getWithSolutions($problemId);

            return $this->jsonResponse([
                'success' => true,
                'data' => $completeData,
                'message' => 'Problem and solutions created successfully'
            ], 201);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get problem statistics
     */
    public function stats($id) {
        try {
            $stats = $this->problemModel->getStats($id);

            if (!$stats) {
                return $this->jsonResponse(['success' => false, 'error' => 'Problem not found'], 404);
            }

            return $this->jsonResponse(['success' => true, 'data' => $stats]);
        } catch (Exception $e) {
            return $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * JSON response helper
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        return json_encode($data);
    }
}
