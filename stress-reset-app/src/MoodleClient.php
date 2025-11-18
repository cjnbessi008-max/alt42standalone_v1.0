<?php
/**
 * Moodle REST API Client
 * Compatible with Moodle 3.7
 */

namespace StressReset;

class MoodleClient
{
    private $config;
    private $baseUrl;
    private $token;

    public function __construct()
    {
        $this->config = require __DIR__ . '/../config/moodle.php';
        $this->baseUrl = rtrim($this->config['base_url'], '/');
        $this->token = $this->config['ws_token'];
    }

    /**
     * Call Moodle web service function
     */
    private function call($function, $params = [])
    {
        if (empty($this->token)) {
            throw new \Exception('Moodle web service token not configured');
        }

        $url = $this->baseUrl . $this->config['ws_endpoint'];

        $postData = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->config['format'],
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->config['ssl_verify']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log('Moodle API Error: ' . $error);
            throw new \Exception('Failed to connect to Moodle');
        }

        if ($httpCode !== 200) {
            error_log('Moodle API HTTP Error: ' . $httpCode);
            throw new \Exception('Moodle API returned error: ' . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            error_log('Moodle API Exception: ' . $data['message']);
            throw new \Exception('Moodle API error: ' . $data['message']);
        }

        return $data;
    }

    /**
     * Get user information from Moodle
     */
    public function getUserInfo($userId)
    {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId,
        ]);
    }

    /**
     * Get user's enrolled courses
     */
    public function getUserCourses($userId)
    {
        return $this->call('core_enrol_get_users_courses', [
            'userid' => $userId,
        ]);
    }

    /**
     * Get course information
     */
    public function getCourseInfo($courseId)
    {
        return $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId,
        ]);
    }

    /**
     * Get user's recent activity
     */
    public function getUserRecentActivity($userId, $courseid = null)
    {
        $params = ['userid' => $userId];

        if ($courseid !== null) {
            $params['courseid'] = $courseid;
        }

        return $this->call('core_course_get_recent_courses', $params);
    }

    /**
     * Log custom event to Moodle
     */
    public function logEvent($eventName, $userId, $courseId = null, $contextData = [])
    {
        // Note: This requires a custom Moodle plugin to be installed
        // For now, we'll just log it locally
        error_log(sprintf(
            'Moodle Event: %s - User: %d - Course: %s - Data: %s',
            $eventName,
            $userId,
            $courseId ?? 'N/A',
            json_encode($contextData)
        ));

        return true;
    }

    /**
     * Validate token and test connection
     */
    public function testConnection()
    {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'version' => $result['version'] ?? 'Unknown',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
