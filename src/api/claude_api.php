<?php
/**
 * Anthropic Claude API Integration
 * Generates AI-powered learning summaries
 */

require_once __DIR__ . '/../config/config.php';

class ClaudeAPI {
    private $apiKey;
    private $model;
    private $maxTokens;
    private $temperature;
    private $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct() {
        $config = Config::getClaudeConfig();
        $this->apiKey = $config['api_key'];
        $this->model = $config['model'];
        $this->maxTokens = $config['max_tokens'];
        $this->temperature = $config['temperature'];

        if (empty($this->apiKey)) {
            throw new Exception('Claude API key not configured');
        }
    }

    /**
     * Generate learning summary from quiz attempt data
     */
    public function generateLearningSummary($attemptData, $language = 'ko') {
        $prompt = $this->buildSummaryPrompt($attemptData, $language);

        $response = $this->callAPI($prompt);

        return $this->parseSummaryResponse($response, $attemptData);
    }

    /**
     * Build prompt for learning summary generation
     */
    private function buildSummaryPrompt($attemptData, $language) {
        $lang = $language === 'ko' ? 'Korean' : 'English';

        $questions = $attemptData['questions'] ?? [];
        $summary = $attemptData['summary'] ?? [];

        // Build question analysis
        $questionAnalysis = [];
        foreach ($questions as $idx => $q) {
            $questionAnalysis[] = sprintf(
                "문제 %d:\n- 유형: %s\n- 정답 여부: %s\n- 내용: %s",
                $idx + 1,
                $q['type'],
                $q['is_correct'] ? '정답' : '오답',
                mb_substr($q['text'], 0, 200)
            );
        }

        $questionText = implode("\n\n", $questionAnalysis);

        if ($language === 'ko') {
            $systemPrompt = <<<PROMPT
당신은 학생의 학습 패턴을 분석하고 교육적 인사이트를 제공하는 AI 교육 전문가입니다.
학생이 퀴즈에서 보인 답변 패턴을 분석하여, 다음을 명확하고 건설적으로 제공해주세요:

1. **학습한 핵심 개념**: 학생이 이번 퀴즈를 통해 배운 주요 개념들
2. **강점**: 학생이 잘 이해하고 있는 부분
3. **개선이 필요한 부분**: 더 연습이 필요한 영역
4. **오개념**: 학생이 가지고 있을 수 있는 잘못된 이해
5. **다음 학습 추천**: 구체적이고 실행 가능한 학습 방향

답변은 학생이 직접 읽을 것이므로 친근하고 격려하는 톤으로 작성해주세요.
각 섹션은 2-3문장으로 간결하게 작성하되, 구체적인 예시를 포함해주세요.
PROMPT;

            $userPrompt = <<<PROMPT
퀴즈 이름: {$attemptData['quiz']['name']}
총 문제 수: {$summary['total_questions']}
정답 수: {$summary['correct_answers']}
점수: {$summary['score']} / {$summary['max_score']} ({$summary['percentage']}%)

문제별 분석:
{$questionText}

위 데이터를 바탕으로 학생의 학습 요약을 생성해주세요.
PROMPT;
        } else {
            $systemPrompt = <<<PROMPT
You are an AI educational expert who analyzes student learning patterns and provides educational insights.
Analyze the student's answer patterns in the quiz and provide the following clearly and constructively:

1. **Core Concepts Learned**: Main concepts the student learned through this quiz
2. **Strengths**: Areas the student understands well
3. **Areas for Improvement**: Areas that need more practice
4. **Misconceptions**: Possible misunderstandings the student might have
5. **Next Learning Recommendations**: Specific and actionable learning directions

Write in a friendly and encouraging tone as students will read this directly.
Keep each section concise (2-3 sentences) but include specific examples.
PROMPT;

            $userPrompt = <<<PROMPT
Quiz Name: {$attemptData['quiz']['name']}
Total Questions: {$summary['total_questions']}
Correct Answers: {$summary['correct_answers']}
Score: {$summary['score']} / {$summary['max_score']} ({$summary['percentage']}%)

Question Analysis:
{$questionText}

Based on the above data, please generate a learning summary for the student.
PROMPT;
        }

        return [
            'system' => $systemPrompt,
            'user' => $userPrompt
        ];
    }

    /**
     * Call Claude API
     */
    private function callAPI($prompt) {
        $payload = [
            'model' => $this->model,
            'max_tokens' => $this->maxTokens,
            'temperature' => $this->temperature,
            'system' => $prompt['system'],
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt['user']
                ]
            ]
        ];

        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey,
            'anthropic-version: 2023-06-01'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Claude API request failed: {$error}");
        }

        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            $errorMsg = $errorData['error']['message'] ?? "HTTP {$httpCode}";
            throw new Exception("Claude API error: {$errorMsg}");
        }

        $result = json_decode($response, true);

        if (!isset($result['content'][0]['text'])) {
            throw new Exception("Invalid Claude API response format");
        }

        return $result;
    }

    /**
     * Parse Claude API response into structured summary
     */
    private function parseSummaryResponse($response, $attemptData) {
        $text = $response['content'][0]['text'];

        // Extract structured information using simple parsing
        $summary = [
            'concepts_learned' => $this->extractSection($text, ['학습한 핵심 개념', 'Core Concepts Learned']),
            'strengths' => $this->extractSection($text, ['강점', 'Strengths']),
            'weaknesses' => $this->extractSection($text, ['개선이 필요한 부분', 'Areas for Improvement']),
            'misconceptions' => $this->extractSection($text, ['오개념', 'Misconceptions']),
            'recommendations' => $this->extractSection($text, ['다음 학습 추천', 'Next Learning Recommendations']),
            'full_text' => $text,
            'detailed_analysis' => [
                'total_questions' => $attemptData['summary']['total_questions'] ?? 0,
                'correct_answers' => $attemptData['summary']['correct_answers'] ?? 0,
                'percentage' => $attemptData['summary']['percentage'] ?? 0,
                'question_types' => $this->analyzeQuestionTypes($attemptData['questions'] ?? [])
            ]
        ];

        // Calculate confidence score based on data completeness
        $summary['confidence_score'] = $this->calculateConfidenceScore($attemptData);

        return $summary;
    }

    /**
     * Extract section from text
     */
    private function extractSection($text, $headers) {
        foreach ($headers as $header) {
            // Try to find section by header
            $pattern = '/' . preg_quote($header, '/') . '[:\s]*(.+?)(?=\n\n|\*\*|$)/s';
            if (preg_match($pattern, $text, $matches)) {
                return trim(strip_tags($matches[1]));
            }
        }
        return '';
    }

    /**
     * Analyze question types distribution
     */
    private function analyzeQuestionTypes($questions) {
        $types = [];
        foreach ($questions as $q) {
            $type = $q['type'];
            if (!isset($types[$type])) {
                $types[$type] = ['total' => 0, 'correct' => 0];
            }
            $types[$type]['total']++;
            if ($q['is_correct']) {
                $types[$type]['correct']++;
            }
        }
        return $types;
    }

    /**
     * Calculate AI confidence score
     */
    private function calculateConfidenceScore($attemptData) {
        $score = 0.5; // Base score

        // More questions = higher confidence
        $questionCount = count($attemptData['questions'] ?? []);
        if ($questionCount >= 10) {
            $score += 0.3;
        } elseif ($questionCount >= 5) {
            $score += 0.2;
        } elseif ($questionCount >= 3) {
            $score += 0.1;
        }

        // Clear right/wrong pattern = higher confidence
        $correctCount = $attemptData['summary']['correct_answers'] ?? 0;
        if ($correctCount > 0 && $correctCount < $questionCount) {
            $score += 0.2; // Mixed results give better insight
        }

        return min(1.0, $score);
    }

    /**
     * Test API connection
     */
    public function testConnection() {
        try {
            $testPrompt = [
                'system' => 'You are a helpful assistant.',
                'user' => 'Respond with "OK" if you can read this.'
            ];

            $response = $this->callAPI($testPrompt);

            return [
                'success' => true,
                'model' => $this->model,
                'response' => $response['content'][0]['text']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
