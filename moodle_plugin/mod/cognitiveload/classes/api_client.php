<?php
/**
 * API Client for Cognitive Load Analysis Service
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_cognitiveload;

defined('MOODLE_INTERNAL') || die();

/**
 * Python 인지 부하 분석 API 클라이언트
 */
class api_client {

    /** @var string API base URL */
    private $api_base_url;

    /** @var string API key */
    private $api_key;

    /** @var int Cache duration in seconds */
    private $cache_duration = 86400; // 24 hours

    /**
     * Constructor
     */
    public function __construct() {
        $this->api_base_url = get_config('mod_cognitiveload', 'api_url') ?: 'http://localhost:8000';
        $this->api_key = get_config('mod_cognitiveload', 'api_key');
        $this->cache_duration = get_config('mod_cognitiveload', 'cache_duration') ?: 86400;
    }

    /**
     * 문제의 인지 부하를 분석합니다
     *
     * @param object $question Moodle question 객체
     * @return object|null 인지 부하 분석 결과
     */
    public function analyze_question($question) {
        global $DB;

        // 캐시 확인
        $cached = $DB->get_record('cogload_cache', ['questionid' => $question->id]);
        if ($cached && (time() - $cached->analyzed_at) < $this->cache_duration) {
            return $cached;
        }

        // 문제 유형 판별
        $problem_type = $this->determine_problem_type($question);

        // API 요청 데이터 준비
        $request_data = [
            'problem_id' => $question->id,
            'problem_type' => $problem_type,
            'question_text' => strip_tags($question->questiontext),
            'question_html' => $question->questiontext,
            'answer_type' => $question->qtype,
            'grade_level' => $this->estimate_grade_level($question),
            'subject' => 'mathematics'
        ];

        // API 호출
        $response = $this->call_api('/api/analyze-problem', 'POST', $request_data);

        if ($response && !isset($response->error)) {
            // 결과를 DB에 저장
            $this->cache_result($response);
            return $response;
        }

        debugging('Cognitive Load API returned error or no response', DEBUG_DEVELOPER);
        return null;
    }

    /**
     * 여러 문제를 일괄 분석
     *
     * @param array $questions Array of question objects
     * @return object|null Batch analysis results
     */
    public function batch_analyze($questions) {
        $problems = [];
        foreach ($questions as $question) {
            $problems[] = [
                'problem_id' => $question->id,
                'problem_type' => $this->determine_problem_type($question),
                'question_text' => strip_tags($question->questiontext),
                'question_html' => $question->questiontext,
                'answer_type' => $question->qtype,
                'grade_level' => $this->estimate_grade_level($question),
                'subject' => 'mathematics'
            ];
        }

        $response = $this->call_api('/api/batch-analyze', 'POST', ['problems' => $problems]);

        if ($response && isset($response->results)) {
            foreach ($response->results as $result) {
                $this->cache_result($result);
            }
        }

        return $response;
    }

    /**
     * API 호출 헬퍼
     *
     * @param string $endpoint API endpoint
     * @param string $method HTTP method
     * @param array|null $data Request data
     * @return object|null Response object
     */
    private function call_api($endpoint, $method = 'GET', $data = null) {
        $url = $this->api_base_url . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($this->api_key) {
            $headers[] = 'Authorization: Bearer ' . $this->api_key;
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            debugging('Cognitive Load API cURL error: ' . $error, DEBUG_DEVELOPER);
            return null;
        }

        if ($http_code >= 200 && $http_code < 300) {
            return json_decode($response);
        }

        debugging('Cognitive Load API HTTP error ' . $http_code . ': ' . $response, DEBUG_DEVELOPER);
        return null;
    }

    /**
     * 분석 결과를 DB에 캐시
     *
     * @param object $result Analysis result from API
     */
    private function cache_result($result) {
        global $DB;

        $record = new \stdClass();
        $record->questionid = $result->problem_id;
        $record->intrinsic_load = $result->intrinsic_load;
        $record->extraneous_load = $result->extraneous_load;
        $record->germane_load = $result->germane_load;
        $record->total_score = $result->total_score;
        $record->difficulty_level = $result->difficulty_level;

        // Extract problem type from analysis details
        if (isset($result->analysis_details) && isset($result->analysis_details->ai_analysis)) {
            $concepts = $result->analysis_details->ai_analysis->concepts_identified ?? [];
            $record->problem_type = !empty($concepts) ? $concepts[0] : 'unknown';
        } else {
            $record->problem_type = 'unknown';
        }

        $record->analyzed_at = time();
        $record->timecreated = time();
        $record->timemodified = time();

        // 기존 레코드가 있으면 업데이트, 없으면 삽입
        $existing = $DB->get_record('cogload_cache', ['questionid' => $result->problem_id]);
        if ($existing) {
            $record->id = $existing->id;
            $DB->update_record('cogload_cache', $record);
        } else {
            $DB->insert_record('cogload_cache', $record);
        }
    }

    /**
     * 문제 유형 판별
     *
     * @param object $question Question object
     * @return string Problem type
     */
    private function determine_problem_type($question) {
        $text = mb_strtolower(strip_tags($question->questiontext));

        // 간단한 패턴 매칭으로 문제 유형 판별
        if (preg_match('/증명|prove|proof/ui', $text)) {
            return 'proof';
        } else if (preg_match('/설명|explain|describe|what is/ui', $text)) {
            return 'conceptual';
        } else if (str_word_count($text) > 30) {
            return 'word_problem';
        } else if (preg_match_all('/[+\-×÷*\/]/', $text, $matches) > 1) {
            return 'multistep';
        } else {
            return 'calculation';
        }
    }

    /**
     * 학년 수준 추정
     *
     * @param object $question Question object
     * @return int Grade level
     */
    private function estimate_grade_level($question) {
        global $DB;

        // Try to get from question category or tags
        // For now, return default
        return 5; // 기본값: 5학년
    }
}
