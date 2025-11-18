<?php
/**
 * Learning Data Model
 * Collects and stores learning activity data from Moodle
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../api/moodle_connector.php';

class LearningData {
    private $db;
    private $moodle;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->moodle = new MoodleConnector();
    }

    /**
     * Collect quiz data for a user
     * @param int $moodle_user_id Moodle user ID
     * @param int $days_back Number of days to look back
     * @return int Number of activities collected
     */
    public function collectQuizData($moodle_user_id, $days_back = 30) {
        // Sync user first
        $this->moodle->syncUser($moodle_user_id);
        $local_user_id = $this->moodle->getLocalUserId($moodle_user_id);

        if (!$local_user_id) {
            return 0;
        }

        $collected_count = 0;
        $courses = $this->moodle->getUserCourses($moodle_user_id);

        foreach ($courses as $course) {
            $course_id = $course['id'];
            $course_name = $course['fullname'];

            // Get course contents to find quizzes
            $contents = $this->moodle->getCourseContents($course_id);

            foreach ($contents as $section) {
                if (!isset($section['modules'])) continue;

                foreach ($section['modules'] as $module) {
                    if ($module['modname'] !== 'quiz') continue;

                    $quiz_id = $module['instance'];
                    $quiz_name = $module['name'];

                    // Get quiz attempts
                    $attempts = $this->moodle->getQuizAttempts($quiz_id, $moodle_user_id);

                    foreach ($attempts as $attempt) {
                        $time_started = $attempt['timestart'];
                        $time_completed = $attempt['timefinish'];

                        // Skip if older than days_back
                        if ($time_started < strtotime("-$days_back days")) {
                            continue;
                        }

                        // Save learning activity
                        $activity_id = $this->saveLearningActivity([
                            'user_id' => $local_user_id,
                            'moodle_activity_id' => $quiz_id,
                            'activity_type' => 'quiz',
                            'course_id' => $course_id,
                            'course_name' => $course_name,
                            'module_name' => $quiz_name,
                            'action' => 'submitted',
                            'time_started' => date('Y-m-d H:i:s', $time_started),
                            'time_completed' => date('Y-m-d H:i:s', $time_completed),
                            'duration_seconds' => $time_completed - $time_started,
                            'score' => $attempt['sumgrades'] ?? null,
                            'max_score' => $attempt['sumgrades'] ?? null
                        ]);

                        if ($activity_id) {
                            $collected_count++;

                            // Get detailed attempt review
                            $review = $this->moodle->getAttemptReview($attempt['id']);

                            if (isset($review['questions'])) {
                                $this->saveQuizResponses($activity_id, $local_user_id, $review['questions'], $time_started);
                            }
                        }
                    }
                }
            }
        }

        return $collected_count;
    }

    /**
     * Save learning activity to database
     * @param array $data Activity data
     * @return int|null Activity ID
     */
    private function saveLearningActivity($data) {
        try {
            $query = "INSERT INTO learning_activities
                     (user_id, moodle_activity_id, activity_type, course_id, course_name,
                      module_name, action, time_started, time_completed, duration_seconds,
                      score, max_score)
                     VALUES
                     (:user_id, :moodle_activity_id, :activity_type, :course_id, :course_name,
                      :module_name, :action, :time_started, :time_completed, :duration_seconds,
                      :score, :max_score)
                     ON DUPLICATE KEY UPDATE
                     time_completed = VALUES(time_completed),
                     duration_seconds = VALUES(duration_seconds),
                     score = VALUES(score)";

            $stmt = $this->db->prepare($query);

            foreach ($data as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }

            if ($stmt->execute()) {
                return $this->db->lastInsertId();
            }
            return null;
        } catch (PDOException $e) {
            error_log("Save learning activity error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Save quiz responses (questions and answers)
     * @param int $activity_id Local activity ID
     * @param int $user_id Local user ID
     * @param array $questions Questions data from Moodle
     * @param int $attempt_start Attempt start timestamp
     * @return int Number of responses saved
     */
    private function saveQuizResponses($activity_id, $user_id, $questions, $attempt_start) {
        $saved_count = 0;

        foreach ($questions as $question) {
            try {
                // Calculate response time (estimate based on question order)
                $response_time = isset($question['responsefiletimemodified'])
                    ? $question['responsefiletimemodified'] - $attempt_start
                    : 0;

                $query = "INSERT INTO quiz_responses
                         (activity_id, user_id, question_id, question_type, question_text,
                          response_text, is_correct, time_started, time_submitted,
                          response_time_seconds, attempt_number)
                         VALUES
                         (:activity_id, :user_id, :question_id, :question_type, :question_text,
                          :response_text, :is_correct, :time_started, :time_submitted,
                          :response_time_seconds, :attempt_number)";

                $stmt = $this->db->prepare($query);

                $question_id = $question['slot'] ?? 0;
                $question_type = $question['type'] ?? 'unknown';
                $question_text = strip_tags($question['html'] ?? '');
                $response_text = $question['response'] ?? '';
                $is_correct = ($question['state'] ?? '') === 'gradedright' ? 1 : 0;

                $time_started = date('Y-m-d H:i:s', $attempt_start);
                $time_submitted = date('Y-m-d H:i:s', $attempt_start + $response_time);

                $stmt->bindParam(':activity_id', $activity_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':question_id', $question_id);
                $stmt->bindParam(':question_type', $question_type);
                $stmt->bindParam(':question_text', $question_text);
                $stmt->bindParam(':response_text', $response_text);
                $stmt->bindParam(':is_correct', $is_correct);
                $stmt->bindParam(':time_started', $time_started);
                $stmt->bindParam(':time_submitted', $time_submitted);
                $stmt->bindParam(':response_time_seconds', $response_time);

                $attempt_number = 1;
                $stmt->bindParam(':attempt_number', $attempt_number);

                if ($stmt->execute()) {
                    $saved_count++;
                }
            } catch (PDOException $e) {
                error_log("Save quiz response error: " . $e->getMessage());
            }
        }

        return $saved_count;
    }

    /**
     * Build learning sessions from activities
     * Groups activities into sessions based on time gaps
     * @param int $user_id Local user ID
     * @param int $session_gap_minutes Maximum gap between activities in same session
     * @return int Number of sessions created
     */
    public function buildLearningSessions($user_id, $session_gap_minutes = 30) {
        try {
            // Get all activities for user, ordered by time
            $query = "SELECT * FROM learning_activities
                     WHERE user_id = :user_id
                     ORDER BY time_started ASC";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            $activities = $stmt->fetchAll();

            if (empty($activities)) {
                return 0;
            }

            $sessions = [];
            $current_session = null;

            foreach ($activities as $activity) {
                $activity_time = strtotime($activity['time_started']);

                if ($current_session === null) {
                    // Start new session
                    $current_session = [
                        'start' => $activity_time,
                        'end' => $activity_time,
                        'activities' => [$activity]
                    ];
                } else {
                    $time_since_last = $activity_time - $current_session['end'];

                    if ($time_since_last <= $session_gap_minutes * 60) {
                        // Continue current session
                        $current_session['end'] = $activity_time;
                        $current_session['activities'][] = $activity;
                    } else {
                        // Save current session and start new one
                        $sessions[] = $current_session;
                        $current_session = [
                            'start' => $activity_time,
                            'end' => $activity_time,
                            'activities' => [$activity]
                        ];
                    }
                }
            }

            // Don't forget last session
            if ($current_session !== null) {
                $sessions[] = $current_session;
            }

            // Save sessions to database
            $saved_count = 0;
            foreach ($sessions as $session) {
                if ($this->saveLearningSession($user_id, $session)) {
                    $saved_count++;
                }
            }

            return $saved_count;
        } catch (PDOException $e) {
            error_log("Build learning sessions error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Save learning session to database
     * @param int $user_id Local user ID
     * @param array $session Session data
     * @return bool Success status
     */
    private function saveLearningSession($user_id, $session) {
        try {
            $start_time = $session['start'];
            $end_time = $session['end'];
            $duration_minutes = ceil(($end_time - $start_time) / 60);

            $activity_count = count($session['activities']);
            $quiz_count = 0;
            $total_response_time = 0;
            $correct_count = 0;
            $total_questions = 0;

            foreach ($session['activities'] as $activity) {
                if ($activity['activity_type'] === 'quiz') {
                    $quiz_count++;
                }
            }

            // Get quiz responses for this session
            $query = "SELECT AVG(response_time_seconds) as avg_response_time,
                             SUM(is_correct) as correct_count,
                             COUNT(*) as total_count
                     FROM quiz_responses
                     WHERE user_id = :user_id
                     AND time_started >= :start_time
                     AND time_started <= :end_time";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $start_str = date('Y-m-d H:i:s', $start_time);
            $end_str = date('Y-m-d H:i:s', $end_time);
            $stmt->bindParam(':start_time', $start_str);
            $stmt->bindParam(':end_time', $end_str);
            $stmt->execute();

            $stats = $stmt->fetch();
            $avg_response_time = $stats['avg_response_time'] ?? 0;
            $success_rate = $stats['total_count'] > 0
                ? ($stats['correct_count'] / $stats['total_count']) * 100
                : 0;

            $day_of_week = date('w', $start_time);
            $hour_of_day = date('G', $start_time);

            // Insert session
            $query = "INSERT INTO learning_sessions
                     (user_id, session_start, session_end, duration_minutes,
                      activity_count, quiz_count, avg_response_time, success_rate,
                      day_of_week, hour_of_day)
                     VALUES
                     (:user_id, :session_start, :session_end, :duration_minutes,
                      :activity_count, :quiz_count, :avg_response_time, :success_rate,
                      :day_of_week, :hour_of_day)";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindValue(':session_start', date('Y-m-d H:i:s', $start_time));
            $stmt->bindValue(':session_end', date('Y-m-d H:i:s', $end_time));
            $stmt->bindParam(':duration_minutes', $duration_minutes);
            $stmt->bindParam(':activity_count', $activity_count);
            $stmt->bindParam(':quiz_count', $quiz_count);
            $stmt->bindParam(':avg_response_time', $avg_response_time);
            $stmt->bindParam(':success_rate', $success_rate);
            $stmt->bindParam(':day_of_week', $day_of_week);
            $stmt->bindParam(':hour_of_day', $hour_of_day);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Save learning session error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get learning sessions for a user
     * @param int $user_id Local user ID
     * @param int $days_back Number of days to look back
     * @return array Sessions data
     */
    public function getLearningSessions($user_id, $days_back = 30) {
        try {
            $query = "SELECT * FROM learning_sessions
                     WHERE user_id = :user_id
                     AND session_start >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                     ORDER BY session_start DESC";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':days_back', $days_back, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get learning sessions error: " . $e->getMessage());
            return [];
        }
    }
}
