<?php
/**
 * Moodle Integration Class
 * Connects to Moodle 3.7 Web Services
 */

class MoodleAPI {
    private $moodleUrl;
    private $wsToken;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->wsToken = MOODLE_WS_TOKEN;
    }

    /**
     * Get question details from Moodle
     */
    public function getQuestion($questionId) {
        $functionName = 'core_question_get_questions';
        $params = [
            'questionids' => [$questionId]
        ];

        return $this->callMoodleWS($functionName, $params);
    }

    /**
     * Get questions by course ID
     */
    public function getQuestionsByCourse($courseId, $categoryId = null) {
        $functionName = 'core_question_get_questions';
        $params = [
            'courseid' => $courseId
        ];

        if ($categoryId !== null) {
            $params['categoryid'] = $categoryId;
        }

        return $this->callMoodleWS($functionName, $params);
    }

    /**
     * Call Moodle Web Service
     */
    private function callMoodleWS($functionName, $params) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = [
            'wstoken' => $this->wsToken,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => 'json'
        ];

        // Merge with function parameters
        $requestParams = array_merge($requestParams, $params);

        // Build query string
        $query = http_build_query($requestParams);

        // Make HTTP request
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            return ['error' => 'Moodle API Error: ' . $error];
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            return ['error' => 'HTTP Error: ' . $httpCode];
        }

        return json_decode($response, true);
    }

    /**
     * Extract function code from question text
     * Simple parser for demonstration
     */
    public function extractFunctions($questionText) {
        $functions = [];

        // Pattern to match function definitions (Python example)
        // This is a simple regex - in production, use a proper parser
        preg_match_all('/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):.*?(?=\n(?:def|class|\Z))/s', $questionText, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $functions[] = [
                'name' => $match[1],
                'code' => $match[0]
            ];
        }

        return $functions;
    }
}
