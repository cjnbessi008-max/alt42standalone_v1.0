<?php
/**
 * AI Verification System using Claude API
 * Analyzes student self-verification quality
 */

class AIVerifier {
    private $apiKey;
    private $apiUrl;
    private $model;

    public function __construct() {
        $this->apiKey = CLAUDE_API_KEY;
        $this->apiUrl = CLAUDE_API_URL;
        $this->model = CLAUDE_MODEL;

        if (empty($this->apiKey)) {
            Logger::warning('Claude API key not configured');
        }
    }

    /**
     * Verify student's self-verification explanation
     */
    public function verifyStudentWork($problem, $studentAnswer, $verificationText) {
        if (!AI_ENABLED || empty($this->apiKey)) {
            Logger::info('AI verification disabled, returning default scores');
            return $this->getDefaultScores();
        }

        $startTime = microtime(true);

        try {
            // Build prompt for Claude
            $prompt = $this->buildVerificationPrompt($problem, $studentAnswer, $verificationText);

            // Call Claude API
            $response = $this->callClaudeAPI($prompt);

            // Parse response
            $analysis = $this->parseVerificationResponse($response);

            $processingTime = round((microtime(true) - $startTime) * 1000);
            $analysis['processing_time_ms'] = $processingTime;

            Logger::info('AI verification completed', [
                'ai_score' => $analysis['ai_score'],
                'processing_time_ms' => $processingTime
            ]);

            return $analysis;

        } catch (Exception $e) {
            Logger::error('AI verification failed: ' . $e->getMessage());
            return $this->getDefaultScores();
        }
    }

    /**
     * Build prompt for Claude API
     */
    private function buildVerificationPrompt($problem, $studentAnswer, $verificationText) {
        $problemStatement = $this->cleanText($problem['problem_statement']);
        $correctAnswer = $this->cleanText($problem['correct_answer']);
        $studentAnswerClean = $this->cleanText($studentAnswer);
        $verificationClean = $this->cleanText($verificationText);

        $prompt = <<<PROMPT
You are an expert mathematics education evaluator. Your task is to assess the quality of a student's self-verification (검산 근거) for their math problem solution.

**Problem:**
{$problemStatement}

**Correct Answer:**
{$correctAnswer}

**Student's Answer:**
{$studentAnswerClean}

**Student's Self-Verification Explanation:**
{$verificationClean}

Please evaluate the student's self-verification based on these criteria:

1. **Logic Score (0-100)**: Does the verification follow logical reasoning? Are the steps correct?
2. **Completeness Score (0-100)**: Does the verification cover all necessary checking steps?
3. **Clarity Score (0-100)**: Is the explanation clear and easy to understand?

Provide your response in the following JSON format:
{
    "logic_score": <number 0-100>,
    "completeness_score": <number 0-100>,
    "clarity_score": <number 0-100>,
    "ai_score": <overall score 0-100>,
    "feedback": "<constructive feedback for the student>",
    "suggestions": "<suggestions for improvement>",
    "is_answer_correct": <true/false>
}

Focus on the quality of the self-verification process, not just whether the answer is correct.
PROMPT;

        return $prompt;
    }

    /**
     * Call Claude API
     */
    private function callClaudeAPI($prompt) {
        $data = [
            'model' => $this->model,
            'max_tokens' => CLAUDE_MAX_TOKENS,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ];

        $ch = curl_init($this->apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->apiKey,
                'anthropic-version: 2023-06-01'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Claude API error: HTTP $httpCode - $error");
        }

        $responseData = json_decode($response, true);

        if (!$responseData || !isset($responseData['content'][0]['text'])) {
            throw new Exception("Invalid Claude API response format");
        }

        return $responseData['content'][0]['text'];
    }

    /**
     * Parse Claude's response
     */
    private function parseVerificationResponse($response) {
        // Try to extract JSON from response
        if (preg_match('/\{[^}]+\}/', $response, $matches)) {
            $jsonStr = $matches[0];
            $data = json_decode($jsonStr, true);

            if ($data) {
                return [
                    'logic_score' => $data['logic_score'] ?? 50,
                    'completeness_score' => $data['completeness_score'] ?? 50,
                    'clarity_score' => $data['clarity_score'] ?? 50,
                    'ai_score' => $data['ai_score'] ?? 50,
                    'feedback' => $data['feedback'] ?? '',
                    'suggestions' => $data['suggestions'] ?? '',
                    'is_answer_correct' => $data['is_answer_correct'] ?? null
                ];
            }
        }

        // Fallback: try full JSON parse
        $data = json_decode($response, true);
        if ($data && isset($data['ai_score'])) {
            return [
                'logic_score' => $data['logic_score'] ?? 50,
                'completeness_score' => $data['completeness_score'] ?? 50,
                'clarity_score' => $data['clarity_score'] ?? 50,
                'ai_score' => $data['ai_score'] ?? 50,
                'feedback' => $data['feedback'] ?? '',
                'suggestions' => $data['suggestions'] ?? '',
                'is_answer_correct' => $data['is_answer_correct'] ?? null
            ];
        }

        // If parsing fails, return default with raw response as feedback
        return array_merge($this->getDefaultScores(), [
            'feedback' => 'AI response could not be parsed. Raw: ' . substr($response, 0, 200)
        ]);
    }

    /**
     * Get default scores (when AI is disabled or fails)
     */
    private function getDefaultScores() {
        return [
            'logic_score' => 50,
            'completeness_score' => 50,
            'clarity_score' => 50,
            'ai_score' => 50,
            'feedback' => 'AI verification unavailable. Manual grading required.',
            'suggestions' => 'Please have a teacher review your work.',
            'is_answer_correct' => null,
            'processing_time_ms' => 0
        ];
    }

    /**
     * Clean text for prompt
     */
    private function cleanText($text) {
        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Calculate final score combining answer correctness and verification quality
     */
    public function calculateFinalScore($isCorrect, $verificationScore, $maxScore = 100) {
        $answerPoints = $isCorrect ? ($maxScore * ANSWER_WEIGHT) : 0;
        $verificationPoints = ($verificationScore / 100) * ($maxScore * VERIFICATION_WEIGHT);

        return round($answerPoints + $verificationPoints, 2);
    }
}
