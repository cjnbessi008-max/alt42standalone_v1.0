<?php
/**
 * AI 피드백 생성 클래스
 * Claude API를 사용하여 요약문 품질 평가 및 피드백 제공
 */

class AIFeedback {
    private $db;
    private $apiKey;
    private $apiUrl = 'https://api.anthropic.com/v1/messages';
    private $model = 'claude-3-5-sonnet-20241022';

    public function __construct() {
        $this->db = Database::getInstance();

        $setting = $this->db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'claude_api_key'");
        $this->apiKey = $setting ? $setting['setting_value'] : '';
    }

    /**
     * 요약문에 대한 AI 피드백 생성
     *
     * @param int $summaryId 요약 ID
     * @return array 피드백 데이터
     */
    public function generateFeedback($summaryId) {
        // AI 기능 활성화 확인
        if (!$this->isEnabled()) {
            throw new Exception("AI 피드백 기능이 비활성화되어 있습니다.");
        }

        if (empty($this->apiKey)) {
            throw new Exception("Claude API 키가 설정되지 않았습니다.");
        }

        // 요약 정보 조회
        $summaryService = new SummaryService();
        $summary = $summaryService->getSummaryById($summaryId);

        if (!$summary) {
            throw new Exception("요약을 찾을 수 없습니다.");
        }

        // 언어 설정 확인
        $langSetting = $this->db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'feedback_language'");
        $language = $langSetting ? $langSetting['setting_value'] : 'ko';

        // AI 프롬프트 생성
        $prompt = $this->buildPrompt($summary, $language);

        // Claude API 호출
        $response = $this->callClaudeAPI($prompt);

        // 피드백 파싱
        $feedback = $this->parseFeedback($response);

        // 피드백 저장
        $feedbackId = $this->saveFeedback($summaryId, $feedback);

        return [
            'id' => $feedbackId,
            'summary_id' => $summaryId,
            'feedback' => $feedback
        ];
    }

    /**
     * AI 피드백 프롬프트 생성
     *
     * @param array $summary 요약 데이터
     * @param string $language 언어 (ko/en)
     * @return string 프롬프트
     */
    private function buildPrompt($summary, $language = 'ko') {
        $activityName = $summary['activity_name'];
        $summaryText = $summary['summary_text'];

        if ($language === 'ko') {
            return <<<PROMPT
당신은 교육 전문가입니다. 학습자가 작성한 학습 활동 요약문을 평가해주세요.

**학습 활동**: {$activityName}
**학습자 요약**: {$summaryText}

다음 기준으로 평가하고 JSON 형식으로 응답해주세요:

1. **명확성 (clarity)**: 요약문이 얼마나 명확하고 이해하기 쉬운가? (0.0~1.0)
2. **관련성 (relevance)**: 학습 활동의 핵심 내용을 얼마나 잘 포착했는가? (0.0~1.0)
3. **완성도 (completeness)**: 중요한 개념을 얼마나 완전하게 포함했는가? (0.0~1.0)
4. **전체 점수 (overall)**: 종합 평가 점수 (0.0~1.0)
5. **피드백 (feedback)**: 학습자를 격려하는 긍정적인 피드백 (1-2문장)
6. **개선 제안 (suggestions)**: 구체적인 개선 방안 (1-2문장)

JSON 형식:
{
  "clarity_score": 0.85,
  "relevance_score": 0.90,
  "completeness_score": 0.80,
  "overall_score": 0.85,
  "feedback": "핵심 개념을 잘 파악하셨네요!",
  "suggestions": "분자와 분모의 역할을 추가하면 더 완벽해질 것 같아요."
}
PROMPT;
        } else {
            return <<<PROMPT
You are an educational expert. Please evaluate the learner's summary of a learning activity.

**Learning Activity**: {$activityName}
**Learner Summary**: {$summaryText}

Evaluate based on the following criteria and respond in JSON format:

1. **Clarity**: How clear and understandable is the summary? (0.0~1.0)
2. **Relevance**: How well does it capture the core content of the learning activity? (0.0~1.0)
3. **Completeness**: How completely does it include important concepts? (0.0~1.0)
4. **Overall Score**: Comprehensive evaluation score (0.0~1.0)
5. **Feedback**: Positive, encouraging feedback for the learner (1-2 sentences)
6. **Suggestions**: Specific suggestions for improvement (1-2 sentences)

JSON format:
{
  "clarity_score": 0.85,
  "relevance_score": 0.90,
  "completeness_score": 0.80,
  "overall_score": 0.85,
  "feedback": "You've captured the key concept well!",
  "suggestions": "Adding the roles of numerator and denominator would make it perfect."
}
PROMPT;
        }
    }

    /**
     * Claude API 호출
     *
     * @param string $prompt 프롬프트
     * @return string API 응답
     */
    private function callClaudeAPI($prompt) {
        $data = [
            'model' => $this->model,
            'max_tokens' => 1024,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ];

        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey,
            'anthropic-version: 2023-06-01'
        ];

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Claude API 호출 실패: " . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Claude API 응답 오류: HTTP " . $httpCode . " - " . $response);
        }

        $result = json_decode($response, true);

        if (!isset($result['content'][0]['text'])) {
            throw new Exception("Claude API 응답 형식 오류");
        }

        return $result['content'][0]['text'];
    }

    /**
     * AI 응답에서 피드백 파싱
     *
     * @param string $response Claude API 응답
     * @return array 파싱된 피드백
     */
    private function parseFeedback($response) {
        // JSON 추출 (코드 블록 제거)
        $jsonText = preg_replace('/```json\s*|\s*```/', '', $response);
        $jsonText = trim($jsonText);

        $data = json_decode($jsonText, true);

        if (!$data) {
            // JSON 파싱 실패시 기본값 반환
            return [
                'clarity_score' => 0.70,
                'relevance_score' => 0.70,
                'completeness_score' => 0.70,
                'overall_score' => 0.70,
                'feedback' => '요약을 작성해주셔서 감사합니다.',
                'suggestions' => '더 구체적인 내용을 추가해보세요.'
            ];
        }

        return [
            'clarity_score' => $data['clarity_score'] ?? 0.70,
            'relevance_score' => $data['relevance_score'] ?? 0.70,
            'completeness_score' => $data['completeness_score'] ?? 0.70,
            'overall_score' => $data['overall_score'] ?? 0.70,
            'feedback' => $data['feedback'] ?? '',
            'suggestions' => $data['suggestions'] ?? ''
        ];
    }

    /**
     * 피드백 저장
     *
     * @param int $summaryId 요약 ID
     * @param array $feedback 피드백 데이터
     * @return int 피드백 ID
     */
    private function saveFeedback($summaryId, $feedback) {
        $sql = "INSERT INTO ai_feedback
                (summary_id, feedback_text, clarity_score, relevance_score,
                 completeness_score, overall_score, suggestions)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $summaryId,
            $feedback['feedback'],
            $feedback['clarity_score'],
            $feedback['relevance_score'],
            $feedback['completeness_score'],
            $feedback['overall_score'],
            $feedback['suggestions']
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * AI 기능 활성화 여부 확인
     *
     * @return bool
     */
    private function isEnabled() {
        $setting = $this->db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'ai_enabled'");
        return $setting && $setting['setting_value'] == '1';
    }

    /**
     * 요약의 피드백 조회
     *
     * @param int $summaryId 요약 ID
     * @return array|null 피드백 데이터
     */
    public function getFeedback($summaryId) {
        $sql = "SELECT * FROM ai_feedback WHERE summary_id = ? ORDER BY created_at DESC LIMIT 1";
        return $this->db->queryOne($sql, [$summaryId]);
    }
}
