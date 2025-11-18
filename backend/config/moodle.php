<?php
/**
 * Moodle 3.7 연동 설정
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app');

/**
 * Moodle Web Service API 엔드포인트
 */
define('MOODLE_WS_URL', MOODLE_URL . '/webservice/rest/server.php');

/**
 * Moodle API 호출
 *
 * @param string $function Moodle 함수명
 * @param array $params 파라미터
 * @return mixed API 응답
 */
function callMoodleAPI($function, $params = []) {
    $params['wstoken'] = MOODLE_TOKEN;
    $params['wsfunction'] = $function;
    $params['moodlewsrestformat'] = 'json';

    $ch = curl_init(MOODLE_WS_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("Moodle API 호출 실패: " . $error);
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("Moodle API HTTP 오류: " . $httpCode);
    }

    $data = json_decode($response, true);

    if (isset($data['exception'])) {
        throw new Exception("Moodle API 오류: " . $data['message']);
    }

    return $data;
}

/**
 * Moodle 연결 상태 확인
 */
function checkMoodleHealth() {
    try {
        $result = callMoodleAPI('core_webservice_get_site_info');
        return [
            'status' => 'ok',
            'sitename' => $result['sitename'] ?? 'Unknown',
            'version' => $result['version'] ?? 'Unknown'
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}
