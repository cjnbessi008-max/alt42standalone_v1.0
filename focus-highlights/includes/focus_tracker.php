<?php
/**
 * Focus Tracking System
 * Detects and calculates focus moments based on user activity
 */

require_once __DIR__ . '/db.php';

class FocusTracker {
    private $db;
    private $minFocusDuration;
    private $minFocusScore;
    private $minAccuracyRate;
    private $maxResponseTime;

    public function __construct() {
        $this->db = Database::getInstance();

        // Load configuration
        $this->minFocusDuration = (int)$this->db->getConfig('min_focus_duration', 300);
        $this->minFocusScore = (float)$this->db->getConfig('min_focus_score', 70);
        $this->minAccuracyRate = (float)$this->db->getConfig('min_accuracy_rate', 80);
        $this->maxResponseTime = (float)$this->db->getConfig('max_response_time', 60);
    }

    /**
     * Create a new focus session
     */
    public function createSession($userId, $courseId, $activityId = null) {
        return $this->db->insert('fh_focus_sessions', [
            'user_id' => $userId,
            'moodle_course_id' => $courseId,
            'moodle_activity_id' => $activityId,
            'session_start' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Log activity during a session
     */
    public function logActivity($sessionId, $userId, $activityType, $activityData = []) {
        return $this->db->insert('fh_activity_logs', [
            'session_id' => $sessionId,
            'user_id' => $userId,
            'activity_type' => $activityType,
            'activity_data' => json_encode($activityData),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * End a session and calculate focus metrics
     */
    public function endSession($sessionId) {
        $session = $this->db->fetchOne(
            "SELECT * FROM fh_focus_sessions WHERE id = :id",
            ['id' => $sessionId]
        );

        if (!$session) {
            throw new Exception("Session not found");
        }

        $sessionEnd = date('Y-m-d H:i:s');
        $sessionStart = new DateTime($session['session_start']);
        $sessionEndTime = new DateTime($sessionEnd);
        $durationSeconds = $sessionEndTime->getTimestamp() - $sessionStart->getTimestamp();

        // Get activity logs for this session
        $activities = $this->db->fetchAll(
            "SELECT * FROM fh_activity_logs WHERE session_id = :session_id ORDER BY timestamp ASC",
            ['session_id' => $sessionId]
        );

        $interactionCount = count($activities);

        // Calculate response times for answer submissions
        $responseTimes = [];
        $correctAnswers = 0;
        $totalAnswers = 0;

        $lastActivityTime = null;
        foreach ($activities as $activity) {
            $activityTime = new DateTime($activity['timestamp']);

            if ($activity['activity_type'] === 'submit_answer') {
                $totalAnswers++;
                $data = json_decode($activity['activity_data'], true);

                if (isset($data['is_correct']) && $data['is_correct']) {
                    $correctAnswers++;
                }

                if ($lastActivityTime !== null && isset($data['response_time'])) {
                    $responseTimes[] = $data['response_time'];
                }
            }

            $lastActivityTime = $activityTime;
        }

        $avgResponseTime = !empty($responseTimes) ? array_sum($responseTimes) / count($responseTimes) : 0;
        $accuracyRate = $totalAnswers > 0 ? ($correctAnswers / $totalAnswers) * 100 : 0;

        // Calculate focus score (0-100)
        $focusScore = $this->calculateFocusScore(
            $durationSeconds,
            $interactionCount,
            $accuracyRate,
            $avgResponseTime
        );

        // Determine if this is a highlight
        $isHighlight = $this->isHighlightSession(
            $durationSeconds,
            $focusScore,
            $accuracyRate,
            $avgResponseTime
        );

        $highlightReason = $isHighlight ? $this->getHighlightReason(
            $durationSeconds,
            $focusScore,
            $accuracyRate,
            $avgResponseTime
        ) : null;

        // Update session
        $this->db->update(
            'fh_focus_sessions',
            [
                'session_end' => $sessionEnd,
                'duration_seconds' => $durationSeconds,
                'focus_score' => $focusScore,
                'interaction_count' => $interactionCount,
                'correct_answers' => $correctAnswers,
                'total_answers' => $totalAnswers,
                'accuracy_rate' => $accuracyRate,
                'avg_response_time' => $avgResponseTime,
                'is_highlight' => $isHighlight ? 1 : 0,
                'highlight_reason' => $highlightReason
            ],
            'id = :id',
            ['id' => $sessionId]
        );

        return [
            'session_id' => $sessionId,
            'duration_seconds' => $durationSeconds,
            'focus_score' => $focusScore,
            'is_highlight' => $isHighlight,
            'highlight_reason' => $highlightReason
        ];
    }

    /**
     * Calculate focus score based on multiple factors
     */
    private function calculateFocusScore($duration, $interactions, $accuracy, $avgResponseTime) {
        $score = 0;

        // Duration score (max 30 points)
        // Full points at 30+ minutes
        $durationScore = min(30, ($duration / 1800) * 30);
        $score += $durationScore;

        // Interaction frequency score (max 25 points)
        // Optimal: 1 interaction every 15 seconds
        $optimalInteractionRate = $duration / 15;
        if ($optimalInteractionRate > 0) {
            $interactionScore = min(25, ($interactions / $optimalInteractionRate) * 25);
            $score += $interactionScore;
        }

        // Accuracy score (max 30 points)
        $accuracyScore = ($accuracy / 100) * 30;
        $score += $accuracyScore;

        // Response time score (max 15 points)
        // Faster is better, but not too fast (might indicate guessing)
        if ($avgResponseTime > 0) {
            if ($avgResponseTime <= 5) {
                // Too fast, might be guessing
                $responseScore = 5;
            } elseif ($avgResponseTime <= 30) {
                // Optimal range
                $responseScore = 15;
            } else {
                // Slower responses
                $responseScore = max(0, 15 - (($avgResponseTime - 30) / 10));
            }
            $score += $responseScore;
        }

        return round(min(100, $score), 2);
    }

    /**
     * Determine if session qualifies as a highlight
     */
    private function isHighlightSession($duration, $focusScore, $accuracy, $avgResponseTime) {
        // Must meet minimum duration
        if ($duration < $this->minFocusDuration) {
            return false;
        }

        // Must meet minimum focus score
        if ($focusScore < $this->minFocusScore) {
            return false;
        }

        // Must meet minimum accuracy (if there were answers)
        if ($accuracy > 0 && $accuracy < $this->minAccuracyRate) {
            return false;
        }

        // Response time should be reasonable (if there were answers)
        if ($avgResponseTime > 0 && $avgResponseTime > $this->maxResponseTime) {
            return false;
        }

        return true;
    }

    /**
     * Generate reason why session is a highlight
     */
    private function getHighlightReason($duration, $focusScore, $accuracy, $avgResponseTime) {
        $reasons = [];

        if ($duration >= 1800) {
            $reasons[] = "Extended focus period (" . round($duration / 60, 1) . " minutes)";
        }

        if ($focusScore >= 90) {
            $reasons[] = "Exceptional focus score (" . $focusScore . "/100)";
        } elseif ($focusScore >= 80) {
            $reasons[] = "High focus score (" . $focusScore . "/100)";
        }

        if ($accuracy >= 95) {
            $reasons[] = "Outstanding accuracy (" . round($accuracy, 1) . "%)";
        } elseif ($accuracy >= 85) {
            $reasons[] = "High accuracy (" . round($accuracy, 1) . "%)";
        }

        if ($avgResponseTime > 0 && $avgResponseTime >= 10 && $avgResponseTime <= 30) {
            $reasons[] = "Thoughtful response time";
        }

        return implode(", ", $reasons);
    }

    /**
     * Get highlights for a user
     */
    public function getUserHighlights($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT s.*, c.course_name, c.course_shortname
                FROM fh_focus_sessions s
                LEFT JOIN fh_courses c ON s.moodle_course_id = c.moodle_course_id
                WHERE s.user_id = :user_id AND s.is_highlight = 1
                ORDER BY s.session_start DESC
                LIMIT :limit OFFSET :offset";

        return $this->db->fetchAll($sql, [
            'user_id' => $userId,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * Get all highlights for a course (teacher view)
     */
    public function getCourseHighlights($courseId, $limit = 50, $offset = 0) {
        $sql = "SELECT s.*, u.username, u.firstname, u.lastname
                FROM fh_focus_sessions s
                JOIN fh_users u ON s.user_id = u.id
                WHERE s.moodle_course_id = :course_id AND s.is_highlight = 1
                ORDER BY s.session_start DESC
                LIMIT :limit OFFSET :offset";

        return $this->db->fetchAll($sql, [
            'course_id' => $courseId,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * Get focus statistics for a user
     */
    public function getUserStats($userId, $daysBack = 30) {
        $startDate = date('Y-m-d H:i:s', strtotime("-$daysBack days"));

        $sql = "SELECT
                    COUNT(*) as total_sessions,
                    SUM(CASE WHEN is_highlight = 1 THEN 1 ELSE 0 END) as highlight_count,
                    AVG(focus_score) as avg_focus_score,
                    AVG(duration_seconds) as avg_duration,
                    AVG(accuracy_rate) as avg_accuracy,
                    SUM(duration_seconds) as total_study_time
                FROM fh_focus_sessions
                WHERE user_id = :user_id AND session_start >= :start_date";

        return $this->db->fetchOne($sql, [
            'user_id' => $userId,
            'start_date' => $startDate
        ]);
    }
}
