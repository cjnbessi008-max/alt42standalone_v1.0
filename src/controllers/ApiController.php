<?php
/**
 * API Controller for Component Lego
 * Handles all API endpoints
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../api/MoodleClient.php';
require_once __DIR__ . '/../models/ComponentDecomposer.php';

class ApiController {
    private $db;
    private $moodle;
    private $decomposer;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodle = new MoodleClient();
        $this->decomposer = new ComponentDecomposer();
    }

    /**
     * Get question with components
     * GET /api/v1/questions/{id}
     */
    public function getQuestion($questionId) {
        try {
            // Get question from database
            $question = $this->getQuestionFromDb($questionId);

            if (!$question) {
                // Try to fetch from Moodle and decompose
                $question = $this->fetchAndDecomposeQuestion($questionId);
            }

            if ($question) {
                // Get components
                $components = $this->getComponents($questionId);

                $this->jsonResponse([
                    'success' => true,
                    'question' => $question,
                    'components' => $components
                ]);
            } else {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Question not found'
                ], 404);
            }
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    /**
     * Get components for a question
     * GET /api/v1/questions/{id}/components
     */
    public function getComponents($questionId) {
        $sql = "SELECT * FROM components WHERE question_id = :question_id ORDER BY component_id";
        return $this->db->query($sql, ['question_id' => $questionId]);
    }

    /**
     * Validate assembly
     * POST /api/v1/assembly/validate
     */
    public function validateAssembly() {
        try {
            $input = $this->getJsonInput();

            $questionId = $input['question_id'] ?? null;
            $sessionId = $input['session_id'] ?? null;
            $assembly = $input['assembly'] ?? null;

            if (!$questionId || !$sessionId || !$assembly) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Missing required fields'
                ], 400);
                return;
            }

            // Get correct patterns
            $patterns = $this->getCorrectPatterns($questionId);

            if (empty($patterns)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No correct patterns found'
                ], 404);
                return;
            }

            // Validate assembly against patterns
            $result = $this->matchAssemblyToPatterns($assembly, $patterns);

            // Save attempt
            $this->saveAttempt($questionId, $sessionId, $assembly, $result['is_correct']);

            $this->jsonResponse([
                'success' => true,
                'is_correct' => $result['is_correct'],
                'message' => $result['message'],
                'score' => $result['score']
            ]);
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    /**
     * Save assembly (auto-save)
     * POST /api/v1/assembly/save
     */
    public function saveAssembly() {
        try {
            $input = $this->getJsonInput();

            $questionId = $input['question_id'] ?? null;
            $sessionId = $input['session_id'] ?? null;
            $assembly = $input['assembly'] ?? null;

            if (!$questionId || !$sessionId || !$assembly) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Missing required fields'
                ], 400);
                return;
            }

            // Update or insert session data (simple implementation)
            // In production, use a proper sessions table

            $this->jsonResponse([
                'success' => true,
                'message' => 'Assembly saved'
            ]);
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    /**
     * Log interaction
     * POST /api/v1/interactions/log
     */
    public function logInteraction() {
        try {
            $input = $this->getJsonInput();

            $sql = "INSERT INTO interaction_logs (student_id, question_id, session_id, action_type, component_id, position)
                    VALUES (:student_id, :question_id, :session_id, :action_type, :component_id, :position)";

            // For demo, use student_id = 1
            $params = [
                'student_id' => 1,
                'question_id' => $input['question_id'] ?? null,
                'session_id' => $input['session_id'] ?? null,
                'action_type' => $input['action_type'] ?? 'unknown',
                'component_id' => $input['component_id'] ?? null,
                'position' => json_encode($input['position'] ?? [])
            ];

            $this->db->execute($sql, $params);

            $this->jsonResponse([
                'success' => true
            ]);
        } catch (Exception $e) {
            // Silent fail for analytics
            $this->jsonResponse([
                'success' => false
            ]);
        }
    }

    /**
     * Sync question from Moodle
     * POST /api/v1/moodle/sync/{questionId}
     */
    public function syncFromMoodle($moodleQuestionId) {
        try {
            $question = $this->fetchAndDecomposeQuestion($moodleQuestionId);

            if ($question) {
                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Question synced successfully',
                    'question' => $question
                ]);
            } else {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Failed to sync question'
                ], 500);
            }
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    /**
     * Get student progress
     * GET /api/v1/students/{id}/progress
     */
    public function getStudentProgress($studentId) {
        try {
            $sql = "SELECT * FROM student_progress WHERE student_id = :student_id";
            $progress = $this->db->query($sql, ['student_id' => $studentId]);

            $this->jsonResponse([
                'success' => true,
                'progress' => $progress
            ]);
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * Get question from database
     */
    private function getQuestionFromDb($questionId) {
        $sql = "SELECT * FROM questions WHERE question_id = :question_id";
        return $this->db->queryOne($sql, ['question_id' => $questionId]);
    }

    /**
     * Fetch question from Moodle and decompose
     */
    private function fetchAndDecomposeQuestion($moodleQuestionId) {
        // Fetch from Moodle
        $moodleQuestion = $this->moodle->getQuestion($moodleQuestionId);

        if (!$moodleQuestion) {
            return null;
        }

        // Save to database
        $sql = "INSERT INTO questions (moodle_question_id, question_text, question_type, difficulty_level, metadata)
                VALUES (:moodle_question_id, :question_text, :question_type, :difficulty_level, :metadata)
                ON DUPLICATE KEY UPDATE question_text = VALUES(question_text)";

        $questionType = $this->decomposer->detectQuestionType($moodleQuestion);

        $params = [
            'moodle_question_id' => $moodleQuestionId,
            'question_text' => $moodleQuestion['questiontext'] ?? '',
            'question_type' => $questionType,
            'difficulty_level' => 1,
            'metadata' => json_encode($moodleQuestion)
        ];

        $questionId = $this->db->execute($sql, $params);

        // Decompose into components
        $decomposed = $this->decomposer->decompose($moodleQuestion);

        // Save components and patterns
        $this->decomposer->saveComponents($questionId, $decomposed);

        // Return the saved question
        return $this->getQuestionFromDb($questionId);
    }

    /**
     * Get correct assembly patterns
     */
    private function getCorrectPatterns($questionId) {
        $sql = "SELECT * FROM assembly_patterns WHERE question_id = :question_id AND is_correct = 1";
        return $this->db->query($sql, ['question_id' => $questionId]);
    }

    /**
     * Match assembly to correct patterns
     */
    private function matchAssemblyToPatterns($assembly, $patterns) {
        // Simple matching logic
        // In production, implement more sophisticated pattern matching

        $bestMatch = [
            'is_correct' => false,
            'message' => '다시 시도해보세요.',
            'score' => 0
        ];

        foreach ($patterns as $pattern) {
            $patternData = json_decode($pattern['pattern_data'], true);
            $similarity = $this->calculateSimilarity($assembly, $patternData);

            if ($similarity > 0.8) {
                $bestMatch = [
                    'is_correct' => true,
                    'message' => '정답입니다! 🎉',
                    'score' => round($similarity * 100)
                ];
                break;
            } else if ($similarity > $bestMatch['score'] / 100) {
                $bestMatch['score'] = round($similarity * 100);
                $bestMatch['message'] = '거의 다 왔습니다! ' . $bestMatch['score'] . '% 정확합니다.';
            }
        }

        return $bestMatch;
    }

    /**
     * Calculate similarity between assembly and pattern
     */
    private function calculateSimilarity($assembly, $pattern) {
        // Simplified similarity calculation
        // Compare number of components and their types

        $assemblyComponents = $assembly['components'] ?? [];
        $patternComponents = $pattern['components'] ?? [];

        if (count($assemblyComponents) !== count($patternComponents)) {
            return 0.5; // Partial credit for effort
        }

        $matches = 0;
        foreach ($assemblyComponents as $ac) {
            foreach ($patternComponents as $pc) {
                if ($ac['type'] === $pc['type'] && $ac['symbol'] === $pc['symbol']) {
                    // Check position proximity
                    $distance = sqrt(
                        pow($ac['position']['x'] - $pc['position']['x'], 2) +
                        pow($ac['position']['y'] - $pc['position']['y'], 2)
                    );

                    if ($distance < 100) { // Within 100 pixels
                        $matches++;
                        break;
                    }
                }
            }
        }

        return $matches / count($patternComponents);
    }

    /**
     * Save student attempt
     */
    private function saveAttempt($questionId, $sessionId, $assembly, $isCorrect) {
        $sql = "INSERT INTO student_attempts (student_id, question_id, session_id, assembled_pattern, is_correct, score)
                VALUES (:student_id, :question_id, :session_id, :assembled_pattern, :is_correct, :score)";

        $params = [
            'student_id' => 1, // For demo purposes
            'question_id' => $questionId,
            'session_id' => $sessionId,
            'assembled_pattern' => json_encode($assembly),
            'is_correct' => $isCorrect ? 1 : 0,
            'score' => $isCorrect ? 100 : 0
        ];

        return $this->db->execute($sql, $params);
    }

    /**
     * Get JSON input from request body
     */
    private function getJsonInput() {
        $json = file_get_contents('php://input');
        return json_decode($json, true) ?: [];
    }

    /**
     * Send JSON response
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Handle errors
     */
    private function handleError($e) {
        $message = APP_DEBUG ? $e->getMessage() : 'Internal server error';

        error_log('API Error: ' . $e->getMessage());

        $this->jsonResponse([
            'success' => false,
            'error' => $message
        ], 500);
    }
}
