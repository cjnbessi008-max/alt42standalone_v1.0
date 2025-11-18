<?php
/**
 * Summary Controller
 * Handles learning summary generation and display
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../api/moodle_connector.php';
require_once __DIR__ . '/../api/claude_api.php';
require_once __DIR__ . '/../models/LearningSession.php';
require_once __DIR__ . '/../models/LearningSummary.php';

class SummaryController {
    private $moodle;
    private $claude;
    private $sessionModel;
    private $summaryModel;

    public function __construct() {
        $this->moodle = new MoodleConnector();
        $this->claude = new ClaudeAPI();
        $this->sessionModel = new LearningSession();
        $this->summaryModel = new LearningSummary();
    }

    /**
     * Process quiz attempt and generate learning summary
     */
    public function processAttempt($attemptId) {
        try {
            // Check if already processed
            if ($this->sessionModel->existsForAttempt($attemptId)) {
                $session = $this->sessionModel->getByAttemptId($attemptId);
                return [
                    'success' => true,
                    'message' => 'Attempt already processed',
                    'session_id' => $session['id']
                ];
            }

            // Get attempt data from Moodle
            $attemptData = $this->moodle->getAttemptDataForSummary($attemptId);

            // Create learning session
            $sessionId = $this->createSession($attemptData);

            // Save question responses
            $this->saveQuestionResponses($sessionId, $attemptData['questions']);

            // Generate AI summary if enabled
            if (Config::get('ENABLE_AI_SUMMARIES', 'true') === 'true') {
                $this->generateSummary($sessionId, $attemptData);
            }

            return [
                'success' => true,
                'message' => 'Learning summary generated successfully',
                'session_id' => $sessionId
            ];

        } catch (Exception $e) {
            error_log("Error processing attempt {$attemptId}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create learning session from attempt data
     */
    private function createSession($attemptData) {
        $sessionData = [
            'moodle_user_id' => $attemptData['user']['id'],
            'moodle_quiz_id' => $attemptData['quiz']['id'],
            'moodle_attempt_id' => $attemptData['attempt']['id'],
            'student_name' => $attemptData['user']['fullname'],
            'quiz_name' => $attemptData['quiz']['name'],
            'total_questions' => $attemptData['summary']['total_questions'],
            'correct_answers' => $attemptData['summary']['correct_answers'],
            'score' => $attemptData['summary']['percentage'],
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s', $attemptData['attempt']['timefinish'])
        ];

        return $this->sessionModel->create($sessionData);
    }

    /**
     * Save question responses
     */
    private function saveQuestionResponses($sessionId, $questions) {
        foreach ($questions as $question) {
            $questionData = [
                'moodle_question_id' => $question['moodle_question_id'],
                'question_text' => $question['text'],
                'question_type' => $question['type'],
                'student_answer' => $question['student_answer'] ?? '',
                'correct_answer' => $question['correct_answer'] ?? '',
                'is_correct' => $question['is_correct'],
                'points_earned' => $question['mark'] ?? 0,
                'max_points' => $question['max_mark'] ?? 0
            ];

            $this->sessionModel->addQuestionResponse($sessionId, $questionData);
        }
    }

    /**
     * Generate AI learning summary
     */
    private function generateSummary($sessionId, $attemptData) {
        $language = Config::get('SUMMARY_LANGUAGE', 'ko');

        // Generate summary using Claude API
        $aiSummary = $this->claude->generateLearningSummary($attemptData, $language);

        // Save summary
        $summaryData = [
            'summary_type' => 'ai_generated',
            'concepts_learned' => $aiSummary['concepts_learned'],
            'strengths' => $aiSummary['strengths'],
            'weaknesses' => $aiSummary['weaknesses'],
            'misconceptions' => $aiSummary['misconceptions'],
            'recommendations' => $aiSummary['recommendations'],
            'detailed_analysis' => $aiSummary['detailed_analysis'],
            'ai_model' => Config::get('CLAUDE_MODEL'),
            'confidence_score' => $aiSummary['confidence_score']
        ];

        $summaryId = $this->summaryModel->create($sessionId, $summaryData);

        // Extract and tag concepts (simplified - could be enhanced)
        $this->tagConcepts($summaryId, $aiSummary['concepts_learned']);

        return $summaryId;
    }

    /**
     * Tag concepts from summary text
     */
    private function tagConcepts($summaryId, $conceptsText) {
        // Simple keyword matching (could be enhanced with NLP)
        $keywords = ['분수', '소수', '덧셈', '뺄셈', '곱셈', '나눗셈', '도형', '방정식', '비율', '측정'];

        foreach ($keywords as $keyword) {
            if (mb_strpos($conceptsText, $keyword) !== false) {
                $this->summaryModel->addConceptTag($summaryId, $keyword);
            }
        }
    }

    /**
     * Get summary for display
     */
    public function getSummary($sessionId) {
        $session = $this->sessionModel->getFullSession($sessionId);

        if (!$session) {
            return [
                'success' => false,
                'error' => 'Session not found'
            ];
        }

        return [
            'success' => true,
            'data' => $session
        ];
    }

    /**
     * Save student reflection
     */
    public function saveReflection($sessionId, $reflectionData) {
        try {
            $this->summaryModel->saveReflection($sessionId, $reflectionData);

            return [
                'success' => true,
                'message' => 'Reflection saved successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get user's learning progress
     */
    public function getUserProgress($userId) {
        try {
            $sessions = $this->sessionModel->getSessionsWithSummaries($userId);
            $statistics = $this->sessionModel->getUserStatistics($userId);
            $progress = $this->summaryModel->getLearningProgress($userId);
            $concepts = $this->summaryModel->getConceptMastery($userId);

            return [
                'success' => true,
                'data' => [
                    'sessions' => $sessions,
                    'statistics' => $statistics,
                    'progress' => $progress,
                    'concepts' => $concepts
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Test connections
     */
    public function testConnections() {
        $moodleTest = $this->moodle->testConnection();
        $claudeTest = $this->claude->testConnection();

        return [
            'moodle' => $moodleTest,
            'claude' => $claudeTest
        ];
    }
}
