<?php
/**
 * Activity collector - Collects learning activity data from Moodle
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_bestmoments\collector;

defined('MOODLE_INTERNAL') || die();

/**
 * Activity Collector - Gathers data from various Moodle activity types
 */
class activity_collector {

    /**
     * Collect all activities for a course within time range
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time (Unix timestamp)
     * @param int $timeend End time (Unix timestamp)
     * @return array Array of activities
     */
    public function collect_course_activities($courseid, $timestart, $timeend) {
        $activities = array();

        // Collect from different activity types
        if (BESTMOMENTS_ANALYZE_QUIZ) {
            $activities = array_merge($activities, $this->collect_quiz_attempts($courseid, $timestart, $timeend));
        }

        if (BESTMOMENTS_ANALYZE_ASSIGNMENT) {
            $activities = array_merge($activities, $this->collect_assignment_submissions($courseid, $timestart, $timeend));
        }

        if (BESTMOMENTS_ANALYZE_FORUM) {
            $activities = array_merge($activities, $this->collect_forum_posts($courseid, $timestart, $timeend));
        }

        if (BESTMOMENTS_ANALYZE_LESSON) {
            $activities = array_merge($activities, $this->collect_lesson_attempts($courseid, $timestart, $timeend));
        }

        return $activities;
    }

    /**
     * Collect quiz attempts
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time
     * @param int $timeend End time
     * @return array Quiz attempts
     */
    private function collect_quiz_attempts($courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT
                    qa.id,
                    qa.quiz,
                    qa.userid,
                    qa.attempt,
                    qa.sumgrades,
                    qa.timestart,
                    qa.timefinish,
                    q.name as quiz_name,
                    q.grade as max_grade,
                    q.course as courseid
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON q.id = qa.quiz
                WHERE q.course = :courseid
                  AND qa.state = 'finished'
                  AND qa.timefinish >= :timestart
                  AND qa.timefinish < :timeend
                ORDER BY qa.userid, qa.attempt";

        $params = array(
            'courseid' => $courseid,
            'timestart' => $timestart,
            'timeend' => $timeend
        );

        $attempts = $DB->get_records_sql($sql, $params);

        $activities = array();

        foreach ($attempts as $attempt) {
            // Calculate metrics
            $time_spent = $attempt->timefinish - $attempt->timestart;
            $success_rate = ($attempt->max_grade > 0) ? ($attempt->sumgrades / $attempt->max_grade) : 0;

            // Get previous attempts for this user and quiz
            $previous_attempts = $this->get_previous_quiz_attempts($attempt->userid, $attempt->quiz, $attempt->id);

            $activity = array(
                'type' => 'quiz',
                'userid' => $attempt->userid,
                'courseid' => $attempt->courseid,
                'activityid' => $attempt->quiz,
                'attemptid' => $attempt->id,
                'attempt_number' => $attempt->attempt,
                'timestamp' => $attempt->timefinish,
                'grade' => $attempt->sumgrades,
                'max_grade' => $attempt->max_grade,
                'success_rate' => $success_rate,
                'time_spent' => $time_spent,
                'expected_time' => $this->estimate_quiz_time($attempt->quiz),
                'attempts' => $attempt->attempt,
                'previous_attempts' => $previous_attempts,
                'name' => $attempt->quiz_name,
                'difficulty' => $this->calculate_quiz_difficulty($attempt->quiz),
                'success' => $success_rate >= 0.6,
                // Creativity indicators
                'unique_approach' => $this->analyze_quiz_uniqueness($attempt->id),
                'partial_credit_pattern' => $this->analyze_partial_credit($attempt->id)
            );

            $activities[] = $activity;
        }

        return $activities;
    }

    /**
     * Collect assignment submissions
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time
     * @param int $timeend End time
     * @return array Assignment submissions
     */
    private function collect_assignment_submissions($courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT
                    asub.id,
                    asub.assignment,
                    asub.userid,
                    asub.status,
                    asub.attemptnumber,
                    asub.timemodified,
                    asub.timecreated,
                    a.name as assignment_name,
                    a.duedate,
                    a.course as courseid,
                    ag.grade
                FROM {assign_submission} asub
                JOIN {assign} a ON a.id = asub.assignment
                LEFT JOIN {assign_grades} ag ON ag.assignment = asub.assignment AND ag.userid = asub.userid
                WHERE a.course = :courseid
                  AND asub.status = 'submitted'
                  AND asub.timemodified >= :timestart
                  AND asub.timemodified < :timeend
                ORDER BY asub.userid, asub.timemodified";

        $params = array(
            'courseid' => $courseid,
            'timestart' => $timestart,
            'timeend' => $timeend
        );

        $submissions = $DB->get_records_sql($sql, $params);

        $activities = array();

        foreach ($submissions as $sub) {
            $time_before_due = $sub->duedate - $sub->timemodified;
            $time_spent = $sub->timemodified - $sub->timecreated;

            // Get previous submissions
            $previous_submissions = $this->get_previous_submissions($sub->userid, $sub->assignment, $sub->id);

            $activity = array(
                'type' => 'assignment',
                'userid' => $sub->userid,
                'courseid' => $sub->courseid,
                'activityid' => $sub->assignment,
                'attemptid' => $sub->id,
                'attempt_number' => $sub->attemptnumber + 1,
                'timestamp' => $sub->timemodified,
                'grade' => $sub->grade ? $sub->grade : 0,
                'time_spent' => max(60, $time_spent), // Minimum 1 minute
                'attempts' => $sub->attemptnumber + 1,
                'name' => $sub->assignment_name,
                'success_rate' => $sub->grade ? ($sub->grade / 100) : 0.5,
                'submitted_before_due' => $time_before_due,
                'previous_submissions' => $previous_submissions,
                'difficulty' => 0.5, // Default medium difficulty
                'success' => $sub->grade >= 60,
                // Creativity indicators
                'unique_approach' => $this->analyze_submission_uniqueness($sub->id),
                'alternative_solution' => count($previous_submissions) > 1 ? 0.5 : 0
            );

            $activities[] = $activity;
        }

        return $activities;
    }

    /**
     * Collect forum posts
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time
     * @param int $timeend End time
     * @return array Forum posts
     */
    private function collect_forum_posts($courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT
                    fp.id,
                    fp.discussion,
                    fp.parent,
                    fp.userid,
                    fp.created,
                    fp.modified,
                    fp.subject,
                    fp.message,
                    fd.name as discussion_name,
                    f.id as forumid,
                    f.name as forum_name,
                    f.course as courseid
                FROM {forum_posts} fp
                JOIN {forum_discussions} fd ON fd.id = fp.discussion
                JOIN {forum} f ON f.id = fd.forum
                WHERE f.course = :courseid
                  AND fp.created >= :timestart
                  AND fp.created < :timeend
                ORDER BY fp.userid, fp.created";

        $params = array(
            'courseid' => $courseid,
            'timestart' => $timestart,
            'timeend' => $timeend
        );

        $posts = $DB->get_records_sql($sql, $params);

        $activities = array();

        foreach ($posts as $post) {
            $message_length = strlen(strip_tags($post->message));
            $is_reply = ($post->parent != 0);
            $is_discussion_start = ($post->parent == 0);

            // Get engagement metrics
            $peer_responses = $this->count_post_responses($post->id);

            $activity = array(
                'type' => 'forum',
                'userid' => $post->userid,
                'courseid' => $post->courseid,
                'activityid' => $post->forumid,
                'attemptid' => $post->id,
                'timestamp' => $post->created,
                'name' => $post->forum_name,
                'message_length' => $message_length,
                'is_reply' => $is_reply,
                'is_discussion_start' => $is_discussion_start,
                'peer_responses' => $peer_responses,
                // Collaboration scores
                'helpful_replies' => $is_reply ? 1 : 0,
                'discussions_started' => $is_discussion_start ? 1 : 0,
                // Quality indicators
                'success_rate' => min(1, $message_length / 200), // 200 chars = good length
                'time_spent' => max(60, $message_length / 10), // Estimate: 10 chars per second
                'difficulty' => 0.4,
                'success' => $message_length >= 100 && $peer_responses > 0,
                // Creativity
                'unique_approach' => $this->analyze_post_novelty($post->id, $post->message),
                'collaboration_count' => $peer_responses
            );

            $activities[] = $activity;
        }

        return $activities;
    }

    /**
     * Collect lesson attempts
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time
     * @param int $timeend End time
     * @return array Lesson attempts
     */
    private function collect_lesson_attempts($courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT
                    la.id,
                    la.lessonid,
                    la.userid,
                    la.pageid,
                    la.correct,
                    la.timeseen,
                    la.retry,
                    l.name as lesson_name,
                    l.course as courseid,
                    lp.title as page_title
                FROM {lesson_attempts} la
                JOIN {lesson} l ON l.id = la.lessonid
                JOIN {lesson_pages} lp ON lp.id = la.pageid
                WHERE l.course = :courseid
                  AND la.timeseen >= :timestart
                  AND la.timeseen < :timeend
                ORDER BY la.userid, la.timeseen";

        $params = array(
            'courseid' => $courseid,
            'timestart' => $timestart,
            'timeend' => $timeend
        );

        $attempts = $DB->get_records_sql($sql, $params);

        // Group by user and lesson
        $grouped = array();
        foreach ($attempts as $attempt) {
            $key = $attempt->userid . '_' . $attempt->lessonid;
            if (!isset($grouped[$key])) {
                $grouped[$key] = array();
            }
            $grouped[$key][] = $attempt;
        }

        $activities = array();

        foreach ($grouped as $group) {
            $first = $group[0];
            $last = end($group);

            $total_attempts = count($group);
            $correct_count = 0;
            $retry_count = 0;

            foreach ($group as $att) {
                if ($att->correct) $correct_count++;
                $retry_count += $att->retry;
            }

            $success_rate = $total_attempts > 0 ? ($correct_count / $total_attempts) : 0;

            $activity = array(
                'type' => 'lesson',
                'userid' => $first->userid,
                'courseid' => $first->courseid,
                'activityid' => $first->lessonid,
                'timestamp' => $last->timeseen,
                'name' => $first->lesson_name,
                'attempts' => $total_attempts,
                'success_rate' => $success_rate,
                'time_spent' => ($last->timeseen - $first->timeseen),
                'difficulty' => 0.5,
                'success' => $success_rate >= 0.7,
                // Persistence indicators
                'retry_count' => $retry_count,
                'pages_attempted' => $total_attempts
            );

            $activities[] = $activity;
        }

        return $activities;
    }

    /**
     * Get previous quiz attempts for a user
     *
     * @param int $userid User ID
     * @param int $quizid Quiz ID
     * @param int $current_attempt_id Current attempt ID to exclude
     * @return array Previous attempts
     */
    private function get_previous_quiz_attempts($userid, $quizid, $current_attempt_id) {
        global $DB;

        $sql = "SELECT sumgrades, timefinish - timestart as time_spent
                FROM {quiz_attempts}
                WHERE userid = :userid
                  AND quiz = :quizid
                  AND id < :current_id
                  AND state = 'finished'
                ORDER BY attempt DESC
                LIMIT 5";

        return $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'quizid' => $quizid,
            'current_id' => $current_attempt_id
        ));
    }

    /**
     * Get previous assignment submissions
     *
     * @param int $userid User ID
     * @param int $assignid Assignment ID
     * @param int $current_sub_id Current submission ID to exclude
     * @return array Previous submissions
     */
    private function get_previous_submissions($userid, $assignid, $current_sub_id) {
        global $DB;

        $sql = "SELECT id, timemodified, timecreated
                FROM {assign_submission}
                WHERE userid = :userid
                  AND assignment = :assignid
                  AND id < :current_id
                  AND status = 'submitted'
                ORDER BY timemodified DESC
                LIMIT 5";

        return $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'assignid' => $assignid,
            'current_id' => $current_sub_id
        ));
    }

    /**
     * Estimate expected time for a quiz
     *
     * @param int $quizid Quiz ID
     * @return int Estimated time in seconds
     */
    private function estimate_quiz_time($quizid) {
        global $DB;

        // Count questions in quiz
        $question_count = $DB->count_records('quiz_slots', array('quizid' => $quizid));

        // Estimate 2 minutes per question
        return $question_count * 120;
    }

    /**
     * Calculate quiz difficulty based on average scores
     *
     * @param int $quizid Quiz ID
     * @return float Difficulty (0-1, higher = more difficult)
     */
    private function calculate_quiz_difficulty($quizid) {
        global $DB;

        $sql = "SELECT AVG(sumgrades / q.grade) as avg_score
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON q.id = qa.quiz
                WHERE qa.quiz = :quizid
                  AND qa.state = 'finished'
                  AND q.grade > 0";

        $result = $DB->get_record_sql($sql, array('quizid' => $quizid));

        if ($result && $result->avg_score > 0) {
            // Lower average score = higher difficulty
            return 1 - $result->avg_score;
        }

        return 0.5; // Default medium difficulty
    }

    /**
     * Analyze quiz answer uniqueness
     *
     * @param int $attempt_id Quiz attempt ID
     * @return float Uniqueness score (0-1)
     */
    private function analyze_quiz_uniqueness($attempt_id) {
        // Simplified: In real implementation, would compare answer patterns
        // with other students' answers
        return 0.5; // Default medium uniqueness
    }

    /**
     * Analyze partial credit patterns
     *
     * @param int $attempt_id Quiz attempt ID
     * @return float Partial credit score (0-1)
     */
    private function analyze_partial_credit($attempt_id) {
        global $DB;

        $sql = "SELECT COUNT(*) as partial_count
                FROM {question_attempt_steps} qas
                JOIN {question_attempts} qa ON qa.id = qas.questionattemptid
                WHERE qa.questionusageid = (
                    SELECT uniqueid FROM {quiz_attempts} WHERE id = :attempt_id
                )
                AND qas.fraction > 0 AND qas.fraction < 1";

        $result = $DB->get_record_sql($sql, array('attempt_id' => $attempt_id));

        if ($result && $result->partial_count > 0) {
            return min(1, $result->partial_count / 5);
        }

        return 0;
    }

    /**
     * Analyze submission uniqueness
     *
     * @param int $submission_id Submission ID
     * @return float Uniqueness score (0-1)
     */
    private function analyze_submission_uniqueness($submission_id) {
        // Simplified: Would use text similarity analysis in real implementation
        return 0.6; // Default above-average uniqueness
    }

    /**
     * Count responses to a forum post
     *
     * @param int $post_id Post ID
     * @return int Number of responses
     */
    private function count_post_responses($post_id) {
        global $DB;

        return $DB->count_records('forum_posts', array('parent' => $post_id));
    }

    /**
     * Analyze forum post novelty
     *
     * @param int $post_id Post ID
     * @param string $message Post message
     * @return float Novelty score (0-1)
     */
    private function analyze_post_novelty($post_id, $message) {
        // Simplified: Would use NLP analysis in real implementation
        // Check for questions, unique vocabulary, etc.
        $has_question = (strpos($message, '?') !== false) ? 0.3 : 0;
        $length_bonus = min(0.4, strlen($message) / 1000);

        return min(1, 0.3 + $has_question + $length_bonus);
    }
}
