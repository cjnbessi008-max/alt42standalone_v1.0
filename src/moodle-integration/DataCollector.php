<?php
/**
 * Data Collector for Thinking Pattern Analysis
 * Collects and stores learning data from Moodle
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

require_once __DIR__ . '/MoodleClient.php';
require_once __DIR__ . '/../database/DatabaseConnection.php';

class DataCollector {
    private $moodleClient;
    private $db;

    /**
     * Constructor
     *
     * @param MoodleClient $moodleClient Moodle API client
     * @param PDO $db Database connection
     */
    public function __construct(MoodleClient $moodleClient, PDO $db) {
        $this->moodleClient = $moodleClient;
        $this->db = $db;
    }

    /**
     * Determine time of day from datetime
     *
     * @param string $datetime DateTime string
     * @return string Time of day ('morning', 'afternoon', 'evening', 'night')
     */
    private function getTimeOfDay($datetime) {
        $hour = (int) date('H', strtotime($datetime));

        if ($hour >= 6 && $hour < 12) {
            return 'morning';
        } elseif ($hour >= 12 && $hour < 18) {
            return 'afternoon';
        } elseif ($hour >= 18 && $hour < 24) {
            return 'evening';
        } else {
            return 'night';
        }
    }

    /**
     * Create or update learning session
     *
     * @param int $userId Moodle user ID
     * @param int $courseId Moodle course ID
     * @param string $startTime Session start time
     * @param string|null $endTime Session end time
     * @return int Session ID
     */
    public function recordSession($userId, $courseId, $startTime, $endTime = null) {
        $timeOfDay = $this->getTimeOfDay($startTime);
        $duration = null;

        if ($endTime !== null) {
            $start = strtotime($startTime);
            $end = strtotime($endTime);
            $duration = $end - $start;
        }

        $stmt = $this->db->prepare("
            INSERT INTO learning_sessions
            (moodle_user_id, moodle_course_id, session_start, session_end,
             time_of_day, session_duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $userId,
            $courseId,
            $startTime,
            $endTime,
            $timeOfDay,
            $duration
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Record learning activity
     *
     * @param array $activityData Activity data
     * @return int Activity ID
     */
    public function recordActivity(array $activityData) {
        $requiredFields = ['session_id', 'user_id', 'course_id', 'activity_type',
                          'activity_id', 'started_at'];

        foreach ($requiredFields as $field) {
            if (!isset($activityData[$field])) {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }
        }

        $timeSpent = null;
        if (isset($activityData['completed_at']) && $activityData['completed_at']) {
            $start = strtotime($activityData['started_at']);
            $end = strtotime($activityData['completed_at']);
            $timeSpent = $end - $start;
        }

        $stmt = $this->db->prepare("
            INSERT INTO learning_activities
            (session_id, moodle_user_id, moodle_course_id, activity_type,
             activity_id, activity_name, started_at, completed_at,
             time_spent_seconds, score, max_score, attempts_count, is_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $activityData['session_id'],
            $activityData['user_id'],
            $activityData['course_id'],
            $activityData['activity_type'],
            $activityData['activity_id'],
            $activityData['activity_name'] ?? null,
            $activityData['started_at'],
            $activityData['completed_at'] ?? null,
            $timeSpent,
            $activityData['score'] ?? null,
            $activityData['max_score'] ?? null,
            $activityData['attempts_count'] ?? 1,
            isset($activityData['is_completed']) ? (int) $activityData['is_completed'] : 0
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Record thinking metrics for an activity
     *
     * @param array $metricsData Metrics data
     * @return int Metrics ID
     */
    public function recordThinkingMetrics(array $metricsData) {
        $requiredFields = ['activity_id', 'user_id', 'measured_at'];

        foreach ($requiredFields as $field) {
            if (!isset($metricsData[$field])) {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }
        }

        $timeOfDay = $this->getTimeOfDay($metricsData['measured_at']);

        $stmt = $this->db->prepare("
            INSERT INTO thinking_metrics
            (activity_id, moodle_user_id, time_of_day, problem_solving_speed,
             accuracy_rate, complexity_score, concentration_score, error_count,
             error_types, hint_usage_count, retry_count, thinking_depth_score, measured_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $errorTypes = isset($metricsData['error_types'])
            ? json_encode($metricsData['error_types'])
            : null;

        $stmt->execute([
            $metricsData['activity_id'],
            $metricsData['user_id'],
            $timeOfDay,
            $metricsData['problem_solving_speed'] ?? null,
            $metricsData['accuracy_rate'] ?? null,
            $metricsData['complexity_score'] ?? null,
            $metricsData['concentration_score'] ?? null,
            $metricsData['error_count'] ?? 0,
            $errorTypes,
            $metricsData['hint_usage_count'] ?? 0,
            $metricsData['retry_count'] ?? 0,
            $metricsData['thinking_depth_score'] ?? null,
            $metricsData['measured_at']
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Record interaction event
     *
     * @param int $activityId Activity ID
     * @param int $userId User ID
     * @param string $eventType Event type
     * @param array $eventData Event data
     * @param string $timestamp Timestamp
     * @return int Event ID
     */
    public function recordInteractionEvent($activityId, $userId, $eventType,
                                          array $eventData, $timestamp) {
        $stmt = $this->db->prepare("
            INSERT INTO interaction_events
            (activity_id, moodle_user_id, event_type, event_data, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $activityId,
            $userId,
            $eventType,
            json_encode($eventData),
            $timestamp
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Sync quiz attempts from Moodle
     *
     * @param int $quizId Quiz ID
     * @param int|null $userId User ID (optional)
     * @return int Number of synced attempts
     */
    public function syncQuizAttempts($quizId, $userId = null) {
        $attempts = $this->moodleClient->getQuizAttempts($quizId, $userId);
        $syncedCount = 0;

        if (!isset($attempts['attempts']) || !is_array($attempts['attempts'])) {
            return 0;
        }

        foreach ($attempts['attempts'] as $attempt) {
            // Create session if not exists
            $sessionId = $this->recordSession(
                $attempt['userid'],
                $attempt['courseid'] ?? 0,
                date('Y-m-d H:i:s', $attempt['timestart']),
                isset($attempt['timefinish']) && $attempt['timefinish'] > 0
                    ? date('Y-m-d H:i:s', $attempt['timefinish'])
                    : null
            );

            // Record activity
            $activityData = [
                'session_id' => $sessionId,
                'user_id' => $attempt['userid'],
                'course_id' => $attempt['courseid'] ?? 0,
                'activity_type' => 'quiz',
                'activity_id' => $quizId,
                'activity_name' => 'Quiz Attempt #' . $attempt['attempt'],
                'started_at' => date('Y-m-d H:i:s', $attempt['timestart']),
                'completed_at' => isset($attempt['timefinish']) && $attempt['timefinish'] > 0
                    ? date('Y-m-d H:i:s', $attempt['timefinish'])
                    : null,
                'score' => $attempt['sumgrades'] ?? null,
                'max_score' => $attempt['maxmarks'] ?? null,
                'attempts_count' => $attempt['attempt'],
                'is_completed' => ($attempt['state'] === 'finished')
            ];

            $activityId = $this->recordActivity($activityData);

            // Calculate and record thinking metrics
            if ($attempt['state'] === 'finished') {
                $metricsData = $this->calculateQuizMetrics($attempt);
                $metricsData['activity_id'] = $activityId;
                $metricsData['user_id'] = $attempt['userid'];
                $metricsData['measured_at'] = date('Y-m-d H:i:s', $attempt['timefinish']);

                $this->recordThinkingMetrics($metricsData);
            }

            $syncedCount++;
        }

        return $syncedCount;
    }

    /**
     * Calculate thinking metrics from quiz attempt data
     *
     * @param array $attempt Quiz attempt data
     * @return array Calculated metrics
     */
    private function calculateQuizMetrics(array $attempt) {
        $metrics = [];

        // Problem solving speed (seconds per question)
        if (isset($attempt['timestart']) && isset($attempt['timefinish'])) {
            $totalTime = $attempt['timefinish'] - $attempt['timestart'];
            $questionCount = 1; // Default; should be fetched from quiz data
            $metrics['problem_solving_speed'] = (int) ($totalTime / $questionCount);
        }

        // Accuracy rate
        if (isset($attempt['sumgrades']) && isset($attempt['maxmarks']) && $attempt['maxmarks'] > 0) {
            $metrics['accuracy_rate'] = round(($attempt['sumgrades'] / $attempt['maxmarks']) * 100, 2);
        }

        // Complexity score (can be set based on quiz configuration)
        $metrics['complexity_score'] = 5; // Default medium complexity

        // Concentration score (based on time consistency - simplified)
        $metrics['concentration_score'] = 75.0; // Placeholder

        // Error count (based on incorrect answers)
        if (isset($attempt['accuracy_rate'])) {
            $metrics['error_count'] = (int) ((100 - $attempt['accuracy_rate']) / 10);
        }

        // Thinking depth score (combination of time and accuracy)
        if (isset($metrics['accuracy_rate']) && isset($metrics['problem_solving_speed'])) {
            $depthScore = ($metrics['accuracy_rate'] * 0.7) +
                         (min(300, $metrics['problem_solving_speed']) / 300 * 30);
            $metrics['thinking_depth_score'] = round($depthScore, 2);
        }

        return $metrics;
    }

    /**
     * Get user's learning pattern summary
     *
     * @param int $userId User ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Summary data
     */
    public function getUserLearningSummary($userId, $startDate, $endDate) {
        $stmt = $this->db->prepare("
            SELECT
                time_of_day,
                COUNT(*) as activity_count,
                AVG(accuracy_rate) as avg_accuracy,
                AVG(problem_solving_speed) as avg_speed,
                AVG(concentration_score) as avg_concentration,
                AVG(thinking_depth_score) as avg_thinking_depth
            FROM thinking_metrics tm
            JOIN learning_activities la ON tm.activity_id = la.id
            WHERE tm.moodle_user_id = ?
            AND la.started_at BETWEEN ? AND ?
            GROUP BY time_of_day
            ORDER BY FIELD(time_of_day, 'morning', 'afternoon', 'evening', 'night')
        ");

        $stmt->execute([$userId, $startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
