<?php
/**
 * Grading Service
 * Handles answer validation and feedback generation
 */

require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../models/Attempt.php';
require_once __DIR__ . '/../models/Progress.php';
require_once __DIR__ . '/../utils/Logger.php';

class GradingService {
    private $logger;
    private $problemModel;
    private $attemptModel;
    private $progressModel;

    public function __construct() {
        $this->logger = new Logger();
        $this->problemModel = new Problem();
        $this->attemptModel = new Attempt();
        $this->progressModel = new Progress();
    }

    /**
     * Grade student answer
     */
    public function gradeAnswer($userId, $problemId, $selectedU, $selectedDv, $attemptTime = null, $hintUsed = 0) {
        try {
            // Get problem
            $problem = $this->problemModel->getById($problemId);
            if (!$problem) {
                throw new Exception("Problem not found");
            }

            // Validate answer
            $isCorrect = $problem->validateAnswer($selectedU, $selectedDv);

            // Generate feedback
            $feedback = $this->generateFeedback($problem, $selectedU, $selectedDv, $isCorrect, $hintUsed);

            // Calculate next steps if correct
            $nextSteps = null;
            if ($isCorrect) {
                $nextSteps = $problem->calculateNextSteps($selectedU, $selectedDv);
            }

            // Save attempt
            $attempt = $this->attemptModel->create([
                'moodle_user_id' => $userId,
                'problem_id' => $problemId,
                'selected_u' => $selectedU,
                'selected_dv' => $selectedDv,
                'is_correct' => $isCorrect,
                'attempt_time' => $attemptTime,
                'hint_used' => $hintUsed,
                'feedback' => $feedback
            ]);

            // Update progress
            $this->progressModel->updateAfterAttempt($userId, $isCorrect, $attemptTime ?? 0);

            // Get updated progress
            $progress = $this->progressModel->getByUserId($userId);

            $this->logger->info("Graded answer for user $userId, problem $problemId: " . ($isCorrect ? 'CORRECT' : 'INCORRECT'));

            return [
                'success' => true,
                'is_correct' => $isCorrect,
                'feedback' => $feedback,
                'next_steps' => $nextSteps,
                'attempt_id' => $attempt->id,
                'progress' => $progress ? $progress->toArray() : null
            ];

        } catch (Exception $e) {
            $this->logger->error("Grading error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Generate feedback based on answer
     */
    private function generateFeedback($problem, $selectedU, $selectedDv, $isCorrect, $hintUsed) {
        if ($isCorrect) {
            return $this->generateCorrectFeedback($problem, $selectedU, $hintUsed);
        } else {
            return $this->generateIncorrectFeedback($problem, $selectedU, $selectedDv);
        }
    }

    /**
     * Generate feedback for correct answer
     */
    private function generateCorrectFeedback($problem, $selectedU, $hintUsed) {
        $messages = [
            "정답입니다! {$selectedU}를 u로 선택하면 미분 시 더 간단해집니다.",
            "훌륭합니다! 올바른 선택을 했습니다.",
            "정확합니다! {$selectedU}는 u로 적합한 선택입니다.",
            "잘했습니다! 부분적분의 핵심을 이해했습니다."
        ];

        $feedback = $messages[array_rand($messages)];

        if ($hintUsed > 0) {
            $feedback .= " (힌트 {$hintUsed}개 사용)";
        } else {
            $feedback .= " 힌트 없이 해결했습니다!";
        }

        // Add difficulty-specific encouragement
        switch ($problem->difficulty) {
            case 'easy':
                $feedback .= " 기초를 잘 다지고 있습니다.";
                break;
            case 'medium':
                $feedback .= " 중급 문제를 정복하고 있습니다!";
                break;
            case 'hard':
                $feedback .= " 고난도 문제를 해결했습니다. 대단합니다!";
                break;
        }

        return $feedback;
    }

    /**
     * Generate feedback for incorrect answer
     */
    private function generateIncorrectFeedback($problem, $selectedU, $selectedDv) {
        $correctU = $problem->correctU;
        $correctDv = $problem->correctDv;

        // Check what went wrong
        $normalizedSelectedU = $this->normalizeLatex($selectedU);
        $normalizedCorrectU = $this->normalizeLatex($correctU);
        $normalizedSelectedDv = $this->normalizeLatex($selectedDv);
        $normalizedCorrectDv = $this->normalizeLatex($correctDv);

        if ($normalizedSelectedU === $normalizedCorrectDv && $normalizedSelectedDv === $normalizedCorrectU) {
            return "u와 dv가 반대로 선택되었습니다. u는 미분하기 쉬운 항, dv는 적분 가능한 항을 선택하세요.";
        }

        if ($normalizedSelectedU === $normalizedCorrectU) {
            return "u 선택은 맞았지만 dv가 틀렸습니다. dv는 적분 가능한 항을 선택하세요.";
        }

        if ($normalizedSelectedDv === $normalizedCorrectDv) {
            return "dv 선택은 맞았지만 u가 틀렸습니다. u는 미분하기 쉬운 항을 선택하세요.";
        }

        // General hints based on problem type
        $hints = $this->getTypeSpecificHint($problem->problemLatex);
        return "다시 생각해보세요. " . $hints;
    }

    /**
     * Get type-specific hint
     */
    private function getTypeSpecificHint($problemLatex) {
        // Logarithm
        if (preg_match('/\\\\ln/i', $problemLatex)) {
            return "로그함수는 적분이 어렵지만 미분은 쉽습니다. ln(x)를 u로 선택해보세요.";
        }

        // Inverse trig
        if (preg_match('/\\\\arc(sin|cos|tan)/i', $problemLatex)) {
            return "역삼각함수는 미분은 가능하지만 적분은 복잡합니다. 역삼각함수를 u로 선택하세요.";
        }

        // Polynomial with trig
        if (preg_match('/x\^?\d*.*\\\\(sin|cos)/i', $problemLatex)) {
            return "다항식과 삼각함수의 곱: 다항식을 u로 선택하면 미분할 때마다 차수가 줄어듭니다.";
        }

        // Polynomial with exponential
        if (preg_match('/x\^?\d*.*e\^/i', $problemLatex)) {
            return "다항식과 지수함수의 곱: 다항식을 u로 선택하세요. e^x는 미분해도 적분해도 같습니다.";
        }

        // Exponential with trig
        if (preg_match('/e\^.*\\\\(sin|cos)/i', $problemLatex)) {
            return "지수함수와 삼각함수: 둘 중 하나를 u로 선택하고 부분적분을 두 번 사용하세요.";
        }

        return "LIATE 순서를 생각해보세요: Logarithm, Inverse trig, Algebraic, Trigonometric, Exponential";
    }

    /**
     * Get hint for problem
     */
    public function getHint($problemId, $hintIndex = 0) {
        try {
            $problem = $this->problemModel->getById($problemId);
            if (!$problem) {
                throw new Exception("Problem not found");
            }

            $hint = $problem->getHint($hintIndex);

            if ($hint) {
                return [
                    'success' => true,
                    'hint' => $hint,
                    'hint_index' => $hintIndex
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'No more hints available'
                ];
            }

        } catch (Exception $e) {
            $this->logger->error("Hint retrieval error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Calculate partial score
     */
    public function calculatePartialScore($userId, $problemId) {
        $attempts = $this->attemptModel->getUserProblemAttempts($userId, $problemId);

        if (empty($attempts)) {
            return 0;
        }

        // Check if any attempt was correct
        foreach ($attempts as $attempt) {
            if ($attempt['is_correct']) {
                // Full score, but reduce based on attempts and hints
                $attemptPenalty = min(0.2, (count($attempts) - 1) * 0.05);
                $hintPenalty = $attempt['hint_used'] * 0.1;
                $score = max(0.5, 1.0 - $attemptPenalty - $hintPenalty);
                return round($score * 100, 2);
            }
        }

        // No correct answer yet - give partial credit for attempts
        return min(20, count($attempts) * 5);
    }

    /**
     * Normalize LaTeX for comparison
     */
    private function normalizeLatex($latex) {
        $latex = trim($latex);
        $latex = preg_replace('/\s+/', '', $latex);
        $latex = str_replace([' dx', 'dx'], '', $latex);
        $latex = strtolower($latex);
        return $latex;
    }

    /**
     * Get performance analytics
     */
    public function getPerformanceAnalytics($userId) {
        try {
            $stats = $this->attemptModel->getUserStats($userId);
            $progress = $this->progressModel->getByUserId($userId);
            $rank = $this->progressModel->getUserRank($userId);

            $analytics = [
                'total_attempts' => $stats['total_attempts'] ?? 0,
                'correct_attempts' => $stats['correct_attempts'] ?? 0,
                'success_rate' => $stats['total_attempts'] > 0
                    ? round(($stats['correct_attempts'] / $stats['total_attempts']) * 100, 2)
                    : 0,
                'average_time' => round($stats['avg_time'] ?? 0, 2),
                'average_hints' => round($stats['avg_hints'] ?? 0, 2),
                'unique_problems' => $stats['unique_problems'] ?? 0,
                'mastery_level' => $progress ? $progress->masteryLevel : 'beginner',
                'rank' => $rank
            ];

            return [
                'success' => true,
                'analytics' => $analytics
            ];

        } catch (Exception $e) {
            $this->logger->error("Analytics error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
