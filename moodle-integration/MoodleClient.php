<?php
/**
 * Moodle Web Services API Client
 * Compatible with Moodle 3.7 and PHP 7.1.9
 */

class MoodleClient {
    private $baseUrl;
    private $token;
    private $service;
    private $logger;

    /**
     * Constructor
     *
     * @param array $config Configuration array
     */
    public function __construct(array $config) {
        $this->baseUrl = rtrim($config['base_url'], '/');
        $this->token = $config['token'];
        $this->service = $config['service'] ?? 'moodle_mobile_app';
        $this->logger = new Logger($config['logging'] ?? []);
    }

    /**
     * Make API request to Moodle
     *
     * @param string $function Moodle web service function name
     * @param array $params Request parameters
     * @return array Response data
     * @throws Exception on error
     */
    private function request($function, array $params = []) {
        $url = $this->baseUrl . '/webservice/rest/server.php';

        $postData = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json',
        ], $params);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false, // For development; enable in production
            CURLOPT_TIMEOUT => 30,
        ]);

        $this->logger->debug("Moodle API Request: $function", $params);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logger->error("Curl error: $error");
            throw new Exception("Moodle API request failed: $error");
        }

        if ($httpCode !== 200) {
            $this->logger->error("HTTP error: $httpCode");
            throw new Exception("Moodle API returned HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->logger->error("JSON decode error: " . json_last_error_msg());
            throw new Exception("Failed to parse Moodle API response");
        }

        if (isset($data['exception'])) {
            $this->logger->error("Moodle error: " . $data['message']);
            throw new Exception("Moodle error: " . $data['message']);
        }

        $this->logger->debug("Moodle API Response", $data);

        return $data;
    }

    /**
     * Get enrolled students in a course
     *
     * @param int $courseId Course ID
     * @return array Array of student objects
     */
    public function getCourseStudents($courseId) {
        $users = $this->request('core_enrol_get_enrolled_users', [
            'courseid' => $courseId,
        ]);

        // Filter only students (role id 5 in standard Moodle)
        return array_filter($users, function($user) {
            if (!isset($user['roles'])) return false;
            foreach ($user['roles'] as $role) {
                if ($role['roleid'] == 5) return true;
            }
            return false;
        });
    }

    /**
     * Get course modules (activities and resources)
     *
     * @param int $courseId Course ID
     * @return array Array of module objects
     */
    public function getCourseModules($courseId) {
        $contents = $this->request('core_course_get_contents', [
            'courseid' => $courseId,
        ]);

        $modules = [];
        foreach ($contents as $section) {
            if (isset($section['modules'])) {
                $modules = array_merge($modules, $section['modules']);
            }
        }

        return $modules;
    }

    /**
     * Get quiz attempts for a user
     *
     * @param int $quizId Quiz ID
     * @param int $userId User ID (optional, all users if not specified)
     * @return array Array of attempt objects
     */
    public function getQuizAttempts($quizId, $userId = null) {
        $params = ['quizid' => $quizId];
        if ($userId !== null) {
            $params['userid'] = $userId;
        }

        try {
            return $this->request('mod_quiz_get_user_attempts', $params);
        } catch (Exception $e) {
            $this->logger->warning("Failed to get quiz attempts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get quiz grade for a user
     *
     * @param int $quizId Quiz ID
     * @param int $userId User ID
     * @return array Grade information
     */
    public function getQuizGrade($quizId, $userId) {
        try {
            $attempts = $this->getQuizAttempts($quizId, $userId);

            if (empty($attempts['attempts'])) {
                return [
                    'grade' => null,
                    'maxgrade' => null,
                    'percentage' => null,
                    'attempts_count' => 0,
                ];
            }

            // Get best attempt
            $bestAttempt = null;
            $bestGrade = -1;

            foreach ($attempts['attempts'] as $attempt) {
                if ($attempt['sumgrades'] > $bestGrade) {
                    $bestGrade = $attempt['sumgrades'];
                    $bestAttempt = $attempt;
                }
            }

            return [
                'grade' => $bestAttempt['sumgrades'],
                'maxgrade' => $bestAttempt['sumgrades'], // This should come from quiz settings
                'percentage' => ($bestAttempt['sumgrades'] / $bestAttempt['sumgrades']) * 100, // Simplified
                'attempts_count' => count($attempts['attempts']),
                'last_attempt' => end($attempts['attempts']),
            ];
        } catch (Exception $e) {
            $this->logger->warning("Failed to get quiz grade: " . $e->getMessage());
            return [
                'grade' => null,
                'maxgrade' => null,
                'percentage' => null,
                'attempts_count' => 0,
            ];
        }
    }

    /**
     * Get assignment submissions for a user
     *
     * @param int $assignmentId Assignment ID
     * @param int $userId User ID (optional)
     * @return array Array of submission objects
     */
    public function getAssignmentSubmissions($assignmentId, $userId = null) {
        $params = ['assignmentids' => [$assignmentId]];

        try {
            $result = $this->request('mod_assign_get_submissions', $params);

            if (isset($result['assignments'][0]['submissions'])) {
                $submissions = $result['assignments'][0]['submissions'];

                if ($userId !== null) {
                    return array_filter($submissions, function($sub) use ($userId) {
                        return $sub['userid'] == $userId;
                    });
                }

                return $submissions;
            }

            return [];
        } catch (Exception $e) {
            $this->logger->warning("Failed to get assignment submissions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get assignment grades for a user
     *
     * @param int $assignmentId Assignment ID
     * @param int $userId User ID
     * @return array Grade information
     */
    public function getAssignmentGrade($assignmentId, $userId) {
        $params = ['assignmentids' => [$assignmentId]];

        try {
            $result = $this->request('mod_assign_get_grades', $params);

            if (isset($result['assignments'][0]['grades'])) {
                foreach ($result['assignments'][0]['grades'] as $grade) {
                    if ($grade['userid'] == $userId) {
                        return [
                            'grade' => $grade['grade'] ?? null,
                            'grader' => $grade['grader'] ?? null,
                            'attemptnumber' => $grade['attemptnumber'] ?? 0,
                            'timemodified' => $grade['timemodified'] ?? null,
                        ];
                    }
                }
            }

            return ['grade' => null];
        } catch (Exception $e) {
            $this->logger->warning("Failed to get assignment grade: " . $e->getMessage());
            return ['grade' => null];
        }
    }

    /**
     * Get activity completion status for a user
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @return array Array of completion statuses
     */
    public function getActivityCompletion($courseId, $userId) {
        try {
            $result = $this->request('core_completion_get_activities_completion_status', [
                'courseid' => $courseId,
                'userid' => $userId,
            ]);

            return $result['statuses'] ?? [];
        } catch (Exception $e) {
            $this->logger->warning("Failed to get activity completion: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user's grade in a course
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @return array Grade information
     */
    public function getUserCourseGrade($courseId, $userId) {
        try {
            $result = $this->request('gradereport_user_get_grade_items', [
                'courseid' => $courseId,
                'userid' => $userId,
            ]);

            if (isset($result['usergrades'][0]['gradeitems'])) {
                $items = [];
                foreach ($result['usergrades'][0]['gradeitems'] as $item) {
                    $items[] = [
                        'id' => $item['id'],
                        'name' => $item['itemname'],
                        'grade' => $item['graderaw'] ?? null,
                        'gradeformatted' => $item['gradeformatted'] ?? null,
                        'percentage' => isset($item['percentageformatted']) ?
                            floatval(str_replace('%', '', $item['percentageformatted'])) : null,
                    ];
                }
                return $items;
            }

            return [];
        } catch (Exception $e) {
            $this->logger->warning("Failed to get user course grade: " . $e->getMessage());
            return [];
        }
    }
}

/**
 * Simple Logger class
 */
class Logger {
    private $enabled;
    private $level;
    private $file;
    private $levels = ['debug' => 0, 'info' => 1, 'warning' => 2, 'error' => 3];

    public function __construct(array $config) {
        $this->enabled = $config['enabled'] ?? false;
        $this->level = $this->levels[$config['level'] ?? 'info'];
        $this->file = $config['file'] ?? __DIR__ . '/../logs/app.log';

        // Create log directory if it doesn't exist
        $logDir = dirname($this->file);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }

    private function log($level, $message, $context = []) {
        if (!$this->enabled) return;
        if ($this->levels[$level] < $this->level) return;

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        $logMessage = "[$timestamp] [$level] $message$contextStr\n";

        file_put_contents($this->file, $logMessage, FILE_APPEND);
    }

    public function debug($message, $context = []) {
        $this->log('debug', $message, $context);
    }

    public function info($message, $context = []) {
        $this->log('info', $message, $context);
    }

    public function warning($message, $context = []) {
        $this->log('warning', $message, $context);
    }

    public function error($message, $context = []) {
        $this->log('error', $message, $context);
    }
}
