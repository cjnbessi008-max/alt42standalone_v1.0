<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AI-powered explanation analyzer using Claude API.
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * AI analyzer for student explanations using Anthropic Claude API.
 *
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qbehaviour_selfexplanation_ai_analyzer {

    /** Claude API endpoint */
    const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

    /** Claude model to use */
    const MODEL = 'claude-3-5-sonnet-20241022';

    /** Maximum tokens for response */
    const MAX_TOKENS = 500;

    /**
     * Analyze explanation using Claude API.
     *
     * @param string $explanation Student's explanation
     * @param question_definition $question The question object
     * @param string $student_answer Student's answer
     * @param bool $is_correct Whether the answer was correct
     * @return stdClass|null Analysis result or null on failure
     */
    public function analyze_explanation($explanation, $question, $student_answer, $is_correct) {
        $api_key = get_config('qbehaviour_selfexplanation', 'claude_api_key');

        if (empty($api_key)) {
            debugging('Claude API key not configured', DEBUG_DEVELOPER);
            return null;
        }

        // Build the prompt
        $prompt = $this->build_analysis_prompt($explanation, $question, $student_answer, $is_correct);

        // Call Claude API
        $response = $this->call_claude_api($api_key, $prompt);

        if ($response === null) {
            return null;
        }

        // Parse the response
        return $this->parse_analysis_response($response);
    }

    /**
     * Build the analysis prompt for Claude.
     *
     * @param string $explanation Student's explanation
     * @param question_definition $question The question object
     * @param string $student_answer Student's answer
     * @param bool $is_correct Whether the answer was correct
     * @return string The prompt
     */
    protected function build_analysis_prompt($explanation, $question, $student_answer, $is_correct) {
        $question_text = strip_tags($question->questiontext);
        $correctness = $is_correct ? '정답' : '오답';

        $prompt = <<<EOT
다음은 수학 문제와 학생의 답변, 그리고 학생이 작성한 설명입니다.

**문제**: {$question_text}

**학생 답변**: {$student_answer} ({$correctness})

**학생 설명**: {$explanation}

다음 기준으로 설명을 평가해주세요:

1. **논리적 일관성** (0-10점): 설명이 논리적으로 일관되고 순서가 명확한가?
2. **개념 이해도** (0-10점): 수학적 개념을 정확히 이해하고 있는가?
3. **설명 명확성** (0-10점): 다른 사람이 이해할 수 있을 만큼 명확한가?
4. **피드백**: 학생의 설명을 개선하기 위한 구체적이고 건설적인 피드백 (1-2문장)

반드시 다음 JSON 형식으로만 응답해주세요:
{
    "logic_score": 8,
    "concept_score": 9,
    "clarity_score": 7,
    "feedback": "개선 제안 내용..."
}
EOT;

        return $prompt;
    }

    /**
     * Call Claude API.
     *
     * @param string $api_key API key
     * @param string $prompt The prompt
     * @return string|null Response text or null on failure
     */
    protected function call_claude_api($api_key, $prompt) {
        // Prepare the request
        $data = array(
            'model' => self::MODEL,
            'max_tokens' => self::MAX_TOKENS,
            'messages' => array(
                array(
                    'role' => 'user',
                    'content' => $prompt
                )
            )
        );

        $json_data = json_encode($data);

        // Set up cURL
        $ch = curl_init(self::API_ENDPOINT);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'x-api-key: ' . $api_key,
            'anthropic-version: 2023-06-01'
        ));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        // Execute request
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            debugging('Claude API cURL error: ' . $error, DEBUG_DEVELOPER);
            return null;
        }

        if ($http_code !== 200) {
            debugging('Claude API HTTP error: ' . $http_code . ' - ' . $response, DEBUG_DEVELOPER);
            return null;
        }

        // Parse response
        $response_data = json_decode($response, true);

        if (!isset($response_data['content'][0]['text'])) {
            debugging('Invalid Claude API response structure', DEBUG_DEVELOPER);
            return null;
        }

        return $response_data['content'][0]['text'];
    }

    /**
     * Parse the analysis response from Claude.
     *
     * @param string $response Response text
     * @return stdClass|null Parsed analysis or null on failure
     */
    protected function parse_analysis_response($response) {
        // Try to extract JSON from response
        // Claude sometimes wraps JSON in markdown code blocks
        $json_pattern = '/\{[^}]+\}/s';
        if (preg_match($json_pattern, $response, $matches)) {
            $json_str = $matches[0];
        } else {
            $json_str = $response;
        }

        $data = json_decode($json_str, true);

        if (!$data) {
            debugging('Failed to parse Claude API response as JSON: ' . $response, DEBUG_DEVELOPER);
            return null;
        }

        // Validate required fields
        $required_fields = array('logic_score', 'concept_score', 'clarity_score', 'feedback');
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                debugging('Missing required field in Claude API response: ' . $field, DEBUG_DEVELOPER);
                return null;
            }
        }

        // Create result object
        $result = new stdClass();
        $result->logic_score = intval($data['logic_score']);
        $result->concept_score = intval($data['concept_score']);
        $result->clarity_score = intval($data['clarity_score']);
        $result->feedback = $data['feedback'];

        // Calculate overall score (0.00 - 1.00)
        $total = $result->logic_score + $result->concept_score + $result->clarity_score;
        $result->overall_score = round($total / 30, 2);

        return $result;
    }

    /**
     * Process explanation analysis asynchronously.
     *
     * This should be called from an adhoc task to avoid blocking the user.
     *
     * @param int $explanation_id ID of explanation record
     */
    public function process_async($explanation_id) {
        global $DB;

        // Get the explanation record
        $explanation = $DB->get_record('qbehaviour_selfexplanation',
            array('id' => $explanation_id), '*', MUST_EXIST);

        // Get question and attempt details
        $qa = question_engine::load_question_attempt($explanation->questionattemptid);
        $question = $qa->get_question();
        $student_answer = $qa->get_response_summary();
        $is_correct = ($qa->get_fraction() >= 0.99);

        // Analyze
        $analysis = $this->analyze_explanation(
            $explanation->explanation,
            $question,
            $student_answer,
            $is_correct
        );

        if ($analysis !== null) {
            // Update the explanation record
            $explanation->quality_score = $analysis->overall_score;
            $explanation->ai_feedback = $analysis->feedback;
            $explanation->timemodified = time();

            $DB->update_record('qbehaviour_selfexplanation', $explanation);
        }
    }
}
