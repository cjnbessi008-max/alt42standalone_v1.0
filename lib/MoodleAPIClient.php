<?php
/**
 * Moodle Web Services API Client
 * Compatible with Moodle 3.7 and PHP 7.1.9
 *
 * @package    AI_Education_Pipeline
 * @subpackage Moodle_Integration
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

namespace AIPipeline\Moodle;

class MoodleAPIClient
{
    private $moodle_url;
    private $token;
    private $format = 'json';

    /**
     * Constructor
     * @param string $moodle_url Base URL of Moodle instance (e.g., https://lms.kaist.ac.kr)
     * @param string $token Web services token
     */
    public function __construct(string $moodle_url, string $token)
    {
        $this->moodle_url = rtrim($moodle_url, '/');
        $this->token = $token;
    }

    /**
     * Create a course module (activity)
     * @param int $course_id Moodle course ID
     * @param array $module_data Module configuration
     * @return array API response
     */
    public function createCourseModule(int $course_id, array $module_data): array
    {
        $params = [
            'courseid' => $course_id,
            'modules' => [[
                'modulename' => $module_data['modulename'] ?? 'url',
                'name' => $module_data['name'],
                'section' => $module_data['section'] ?? 1,
                'visible' => $module_data['visible'] ?? 1,
                'externalurl' => $module_data['url'] ?? '',
                'intro' => $module_data['intro'] ?? '',
                'introformat' => 1
            ]]
        ];

        return $this->call('core_course_create_modules', $params);
    }

    /**
     * Update course module
     * @param int $cm_id Course module ID
     * @param array $updates Fields to update
     * @return array API response
     */
    public function updateCourseModule(int $cm_id, array $updates): array
    {
        $params = [
            'cmid' => $cm_id,
            'updates' => $updates
        ];

        return $this->call('core_course_update_course_module', $params);
    }

    /**
     * Get course modules
     * @param int $course_id Course ID
     * @return array Course modules
     */
    public function getCourseModules(int $course_id): array
    {
        $params = ['courseid' => $course_id];
        $result = $this->call('core_course_get_contents', $params);

        $modules = [];
        if (is_array($result)) {
            foreach ($result as $section) {
                if (isset($section['modules'])) {
                    $modules = array_merge($modules, $section['modules']);
                }
            }
        }

        return $modules;
    }

    /**
     * Update activity completion status
     * @param int $cm_id Course module ID
     * @param int $user_id User ID
     * @param bool $completed Completion status
     * @return array API response
     */
    public function updateCompletion(int $cm_id, int $user_id, bool $completed): array
    {
        $params = [
            'cmid' => $cm_id,
            'userid' => $user_id,
            'completed' => $completed ? 1 : 0
        ];

        return $this->call('core_completion_update_activity_completion_status_manually', $params);
    }

    /**
     * Update user grade
     * @param int $course_id Course ID
     * @param int $item_id Grade item ID
     * @param int $user_id User ID
     * @param float $grade Grade value
     * @return array API response
     */
    public function updateGrade(int $course_id, int $item_id, int $user_id, float $grade): array
    {
        $params = [
            'source' => 'mod/aipipeline',
            'courseid' => $course_id,
            'component' => 'mod_aipipeline',
            'activityid' => $item_id,
            'itemnumber' => 0,
            'grades' => [[
                'studentid' => $user_id,
                'grade' => $grade
            ]]
        ];

        return $this->call('core_grades_update_grades', $params);
    }

    /**
     * Get user grades
     * @param int $course_id Course ID
     * @param int $user_id User ID
     * @return array Grade data
     */
    public function getUserGrades(int $course_id, int $user_id): array
    {
        $params = [
            'courseid' => $course_id,
            'userid' => $user_id
        ];

        return $this->call('core_grades_get_grades', $params);
    }

    /**
     * Get course information
     * @param int $course_id Course ID
     * @return array Course data
     */
    public function getCourse(int $course_id): array
    {
        $params = [
            'options' => [
                'ids' => [$course_id]
            ]
        ];

        $result = $this->call('core_course_get_courses', $params);
        return is_array($result) && !empty($result) ? $result[0] : [];
    }

    /**
     * Get enrolled users in a course
     * @param int $course_id Course ID
     * @return array Users
     */
    public function getEnrolledUsers(int $course_id): array
    {
        $params = [
            'courseid' => $course_id
        ];

        return $this->call('core_enrol_get_enrolled_users', $params);
    }

    /**
     * Get user information
     * @param array $criteria Search criteria (e.g., ['key' => 'id', 'value' => 123])
     * @return array User data
     */
    public function getUsers(array $criteria): array
    {
        $params = [
            'criteria' => [$criteria]
        ];

        $result = $this->call('core_user_get_users', $params);
        return $result['users'] ?? [];
    }

    /**
     * Get user by ID
     * @param int $user_id User ID
     * @return array|null User data
     */
    public function getUserById(int $user_id): ?array
    {
        $users = $this->getUsers(['key' => 'id', 'value' => $user_id]);
        return !empty($users) ? $users[0] : null;
    }

    /**
     * Get user by email
     * @param string $email Email address
     * @return array|null User data
     */
    public function getUserByEmail(string $email): ?array
    {
        $users = $this->getUsers(['key' => 'email', 'value' => $email]);
        return !empty($users) ? $users[0] : null;
    }

    /**
     * Create grade item
     * @param int $course_id Course ID
     * @param array $item_data Grade item configuration
     * @return array API response
     */
    public function createGradeItem(int $course_id, array $item_data): array
    {
        $params = [
            'courseid' => $course_id,
            'itemname' => $item_data['itemname'],
            'itemtype' => $item_data['itemtype'] ?? 'manual',
            'itemmodule' => $item_data['itemmodule'] ?? 'aipipeline',
            'iteminstance' => $item_data['iteminstance'] ?? 0,
            'gradetype' => $item_data['gradetype'] ?? 1, // GRADE_TYPE_VALUE
            'grademax' => $item_data['grademax'] ?? 100,
            'grademin' => $item_data['grademin'] ?? 0
        ];

        return $this->call('core_grades_create_gradecategory', $params);
    }

    /**
     * Send message to user
     * @param int $to_user_id Recipient user ID
     * @param string $subject Message subject
     * @param string $message Message body
     * @return array API response
     */
    public function sendMessage(int $to_user_id, string $subject, string $message): array
    {
        $params = [
            'messages' => [[
                'touserid' => $to_user_id,
                'text' => $message,
                'textformat' => 1
            ]]
        ];

        return $this->call('core_message_send_instant_messages', $params);
    }

    /**
     * Log event
     * @param string $event_name Event name
     * @param int $course_id Course ID
     * @param array $context Additional context data
     * @return bool Success
     */
    public function logEvent(string $event_name, int $course_id, array $context = []): bool
    {
        // Moodle doesn't have a direct API for custom event logging
        // This is a placeholder - implement custom endpoint or use database
        error_log("Moodle Event: {$event_name} for course {$course_id} - " . json_encode($context));
        return true;
    }

    /**
     * Test connection to Moodle
     * @return array Test result
     */
    public function testConnection(): array
    {
        try {
            $result = $this->call('core_webservice_get_site_info', []);

            if (isset($result['sitename'])) {
                return [
                    'success' => true,
                    'site_name' => $result['sitename'],
                    'moodle_version' => $result['release'] ?? 'unknown',
                    'user' => $result['username'] ?? 'unknown'
                ];
            }

            return [
                'success' => false,
                'error' => 'Invalid response from Moodle'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Call Moodle web service function
     * @param string $function Function name
     * @param array $params Function parameters
     * @return array Response data
     * @throws \Exception on error
     */
    private function call(string $function, array $params = []): array
    {
        $url = $this->moodle_url . '/webservice/rest/server.php';

        $post_data = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->format
        ];

        // Merge function parameters
        $post_data = array_merge($post_data, $this->flattenParams($params));

        // Initialize cURL
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($post_data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: AI-Pipeline-Client/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("cURL Error: {$error}");
        }

        if ($http_code !== 200) {
            throw new \Exception("HTTP Error {$http_code}: {$response}");
        }

        $result = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("JSON Decode Error: " . json_last_error_msg());
        }

        // Check for Moodle error
        if (isset($result['exception'])) {
            throw new \Exception("Moodle Error: {$result['message']} ({$result['errorcode']})");
        }

        return $result ?? [];
    }

    /**
     * Flatten nested parameters for Moodle API
     * Converts ['modules' => [['name' => 'test']]] to ['modules[0][name]' => 'test']
     *
     * @param array $params Parameters to flatten
     * @param string $prefix Current prefix
     * @return array Flattened parameters
     */
    private function flattenParams(array $params, string $prefix = ''): array
    {
        $result = [];

        foreach ($params as $key => $value) {
            $new_key = $prefix === '' ? $key : "{$prefix}[{$key}]";

            if (is_array($value)) {
                $result = array_merge($result, $this->flattenParams($value, $new_key));
            } else {
                $result[$new_key] = $value;
            }
        }

        return $result;
    }

    /**
     * Upload file to Moodle
     * @param string $file_path Local file path
     * @param int $context_id Context ID (user, course, etc.)
     * @param string $component Component name
     * @param string $file_area File area
     * @return array Upload result
     */
    public function uploadFile(string $file_path, int $context_id, string $component = 'user', string $file_area = 'draft'): array
    {
        if (!file_exists($file_path)) {
            return ['success' => false, 'error' => 'File not found'];
        }

        $url = $this->moodle_url . '/webservice/upload.php';

        $post_data = [
            'token' => $this->token,
            'filepath' => '/',
            'itemid' => 0,
            'file_1' => new \CURLFile($file_path)
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $post_data,
            CURLOPT_RETURNTRANSFER => true
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true) ?? [];
    }
}
