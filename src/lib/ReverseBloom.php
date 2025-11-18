<?php
/**
 * Reverse Bloom Taxonomy Engine
 *
 * 전통적인 Bloom's Taxonomy는 저차원(기억)에서 고차원(창조)으로 올라갑니다.
 * Reverse Bloom은 "부정적분"처럼 복잡한 문제에서 시작하여 기초 개념으로 분해합니다.
 *
 * Bloom Levels (역순 적용):
 * Level 6: Create (창조) - 복잡한 종합 문제
 * Level 5: Evaluate (평가) - 판단 및 분석
 * Level 4: Analyze (분석) - 구성요소 파악
 * Level 3: Apply (적용) - 개념 적용
 * Level 2: Understand (이해) - 개념 이해
 * Level 1: Remember (기억) - 기본 사실
 */

class ReverseBloom {

    // Bloom Taxonomy Levels
    const LEVEL_REMEMBER = 1;
    const LEVEL_UNDERSTAND = 2;
    const LEVEL_APPLY = 3;
    const LEVEL_ANALYZE = 4;
    const LEVEL_EVALUATE = 5;
    const LEVEL_CREATE = 6;

    private $currentLevel;
    private $maxLevel;
    private $questionData;
    private $decomposedSteps;

    /**
     * Initialize with question data
     */
    public function __construct($questionData, $startLevel = self::LEVEL_CREATE) {
        $this->questionData = $questionData;
        $this->currentLevel = $startLevel;
        $this->maxLevel = $startLevel;
        $this->decomposedSteps = [];
        $this->decomposeQuestion();
    }

    /**
     * Decompose complex question into simpler steps (Reverse Bloom)
     * 복잡한 문제를 단순한 단계로 분해 (역 블룸)
     */
    private function decomposeQuestion() {
        $questionText = $this->questionData['questiontext'] ?? '';
        $questionType = $this->questionData['qtype'] ?? 'multichoice';

        // Level 6 (Create): Original complex question
        $this->decomposedSteps[self::LEVEL_CREATE] = [
            'level' => self::LEVEL_CREATE,
            'label' => '창조 (Create)',
            'description' => '복잡한 문제 해결',
            'question' => $questionText,
            'hint' => '이 문제를 해결하려면 여러 개념을 종합해야 합니다.',
            'color' => '#8B0000'
        ];

        // Level 5 (Evaluate): Break down into evaluation criteria
        $this->decomposedSteps[self::LEVEL_EVALUATE] = [
            'level' => self::LEVEL_EVALUATE,
            'label' => '평가 (Evaluate)',
            'description' => '문제의 핵심 판단 기준',
            'question' => $this->generateEvaluateStep($questionText),
            'hint' => '어떤 기준으로 답을 선택해야 할까요?',
            'color' => '#B22222'
        ];

        // Level 4 (Analyze): Identify components
        $this->decomposedSteps[self::LEVEL_ANALYZE] = [
            'level' => self::LEVEL_ANALYZE,
            'label' => '분석 (Analyze)',
            'description' => '문제의 구성요소 파악',
            'question' => $this->generateAnalyzeStep($questionText),
            'hint' => '이 문제는 어떤 부분들로 나누어 볼 수 있나요?',
            'color' => '#DC143C'
        ];

        // Level 3 (Apply): Apply basic concepts
        $this->decomposedSteps[self::LEVEL_APPLY] = [
            'level' => self::LEVEL_APPLY,
            'label' => '적용 (Apply)',
            'description' => '기본 개념 적용하기',
            'question' => $this->generateApplyStep($questionText),
            'hint' => '배운 개념을 어떻게 적용할 수 있나요?',
            'color' => '#FF6347'
        ];

        // Level 2 (Understand): Explain concepts
        $this->decomposedSteps[self::LEVEL_UNDERSTAND] = [
            'level' => self::LEVEL_UNDERSTAND,
            'label' => '이해 (Understand)',
            'description' => '핵심 개념 이해하기',
            'question' => $this->generateUnderstandStep($questionText),
            'hint' => '이 개념이 무엇을 의미하나요?',
            'color' => '#FFA07A'
        ];

        // Level 1 (Remember): Basic facts
        $this->decomposedSteps[self::LEVEL_REMEMBER] = [
            'level' => self::LEVEL_REMEMBER,
            'label' => '기억 (Remember)',
            'description' => '기본 정의와 사실',
            'question' => $this->generateRememberStep($questionText),
            'hint' => '가장 기본적인 정의는 무엇인가요?',
            'color' => '#FFB6C1'
        ];
    }

    /**
     * Generate step for each Bloom level
     */
    private function generateEvaluateStep($originalQuestion) {
        return "다음 중 올바른 접근 방법을 평가하세요: " . substr($originalQuestion, 0, 50) . "...";
    }

    private function generateAnalyzeStep($originalQuestion) {
        return "이 문제를 해결하기 위해 필요한 구성요소들을 찾아보세요.";
    }

    private function generateApplyStep($originalQuestion) {
        return "배운 공식이나 개념을 적용해보세요.";
    }

    private function generateUnderstandStep($originalQuestion) {
        return "이 문제와 관련된 핵심 개념을 설명해보세요.";
    }

    private function generateRememberStep($originalQuestion) {
        return "이 문제와 관련된 기본 정의를 기억해보세요.";
    }

    /**
     * Get current step
     */
    public function getCurrentStep() {
        return $this->decomposedSteps[$this->currentLevel] ?? null;
    }

    /**
     * Move to lower level (simpler)
     * 더 낮은 레벨로 이동 (더 간단하게)
     */
    public function moveDown() {
        if ($this->currentLevel > self::LEVEL_REMEMBER) {
            $this->currentLevel--;
            return true;
        }
        return false;
    }

    /**
     * Move to higher level (more complex)
     * 더 높은 레벨로 이동 (더 복잡하게)
     */
    public function moveUp() {
        if ($this->currentLevel < $this->maxLevel) {
            $this->currentLevel++;
            return true;
        }
        return false;
    }

    /**
     * Get all steps
     */
    public function getAllSteps() {
        return $this->decomposedSteps;
    }

    /**
     * Get progress percentage
     */
    public function getProgress() {
        // 낮은 레벨에서 시작하여 높은 레벨로 갈수록 진행도 증가
        return (($this->maxLevel - $this->currentLevel + 1) / $this->maxLevel) * 100;
    }

    /**
     * Check if at highest level (original question)
     */
    public function isAtTop() {
        return $this->currentLevel === $this->maxLevel;
    }

    /**
     * Check if at lowest level (most basic)
     */
    public function isAtBottom() {
        return $this->currentLevel === self::LEVEL_REMEMBER;
    }

    /**
     * Get level name in Korean
     */
    public static function getLevelName($level) {
        $names = [
            self::LEVEL_REMEMBER => '기억 (Remember)',
            self::LEVEL_UNDERSTAND => '이해 (Understand)',
            self::LEVEL_APPLY => '적용 (Apply)',
            self::LEVEL_ANALYZE => '분석 (Analyze)',
            self::LEVEL_EVALUATE => '평가 (Evaluate)',
            self::LEVEL_CREATE => '창조 (Create)'
        ];
        return $names[$level] ?? 'Unknown';
    }
}
