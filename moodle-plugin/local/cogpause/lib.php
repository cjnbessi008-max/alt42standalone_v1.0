<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for Cognitive Pause Tracking
 *
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Add cognitive pause tracking JavaScript to quiz pages
 *
 * @return void
 */
function local_cogpause_before_footer() {
    global $PAGE, $CFG, $USER;

    // Only load on quiz attempt pages
    if (strpos($PAGE->url->get_path(), '/mod/quiz/') === false) {
        return;
    }

    // Check if tracking is enabled
    if (!get_config('local_cogpause', 'enable_tracking')) {
        return;
    }

    // Get configuration
    $config = array(
        'pauseThreshold' => get_config('local_cogpause', 'pause_threshold') ?: 3000,
        'thinkingThreshold' => get_config('local_cogpause', 'thinking_threshold') ?: 5000,
        'confusionThreshold' => get_config('local_cogpause', 'confusion_threshold') ?: 15000,
        'distractionThreshold' => get_config('local_cogpause', 'distraction_threshold') ?: 30000,
        'userId' => $USER->id,
        'courseId' => $PAGE->course->id,
        'ajaxUrl' => $CFG->wwwroot . '/local/cogpause/ajax.php'
    );

    // Inject tracking script
    $PAGE->requires->js_call_amd('local_cogpause/pause_tracker', 'init', array($config));
}

/**
 * Save pause event to database
 *
 * @param object $data Pause event data
 * @return int|false The ID of the inserted record or false on failure
 */
function local_cogpause_save_event($data) {
    global $DB;

    $record = new stdClass();
    $record->user_id = $data->userId;
    $record->course_id = $data->courseId;
    $record->quiz_id = $data->quizId;
    $record->question_id = $data->questionId;
    $record->attempt_id = $data->attemptId;
    $record->pause_start_time = date('Y-m-d H:i:s.u', $data->pauseStartTime / 1000);
    $record->pause_end_time = date('Y-m-d H:i:s.u', $data->pauseEndTime / 1000);
    $record->pause_duration_ms = $data->pauseDuration;
    $record->pause_type = $data->pauseType;
    $record->confidence_score = $data->confidenceScore ?? null;
    $record->question_progress = $data->questionProgress ?? null;
    $record->input_field_id = $data->inputFieldId ?? null;
    $record->cursor_position = $data->cursorPosition ?? null;
    $record->previous_input_length = $data->previousInputLength ?? 0;
    $record->mouse_movements = json_encode($data->mouseMovements ?? []);
    $record->scroll_events = json_encode($data->scrollEvents ?? []);
    $record->tab_switches = $data->tabSwitches ?? 0;
    $record->session_id = $data->sessionId;
    $record->device_type = $data->deviceType ?? null;
    $record->browser = $data->browser ?? null;
    $record->created_at = date('Y-m-d H:i:s');
    $record->updated_at = date('Y-m-d H:i:s');

    return $DB->insert_record('cognitive_pause_events', $record);
}

/**
 * Update pause analytics for a question attempt
 *
 * @param int $userid User ID
 * @param int $questionid Question ID
 * @param int $attemptid Attempt ID
 * @return bool Success
 */
function local_cogpause_update_analytics($userid, $questionid, $attemptid) {
    global $DB;

    // Get all pause events for this attempt
    $events = $DB->get_records('cognitive_pause_events', array(
        'user_id' => $userid,
        'question_id' => $questionid,
        'attempt_id' => $attemptid
    ));

    if (empty($events)) {
        return false;
    }

    // Calculate statistics
    $stats = new stdClass();
    $stats->user_id = $userid;
    $stats->question_id = $questionid;
    $stats->attempt_id = $attemptid;
    $stats->total_pauses = count($events);
    $stats->total_pause_time_ms = 0;
    $stats->thinking_pauses = 0;
    $stats->confusion_pauses = 0;
    $stats->distraction_pauses = 0;
    $stats->rereading_pauses = 0;

    $durations = array();
    $first_pause = null;
    $last_pause = null;

    foreach ($events as $event) {
        $stats->total_pause_time_ms += $event->pause_duration_ms;
        $durations[] = $event->pause_duration_ms;

        // Count by type
        switch ($event->pause_type) {
            case 'thinking':
                $stats->thinking_pauses++;
                break;
            case 'confusion':
                $stats->confusion_pauses++;
                break;
            case 'distraction':
                $stats->distraction_pauses++;
                break;
            case 're_reading':
                $stats->rereading_pauses++;
                break;
        }

        // Track first and last pause
        if ($first_pause === null || strtotime($event->pause_start_time) < strtotime($first_pause)) {
            $first_pause = $event->pause_start_time;
        }
        if ($last_pause === null || strtotime($event->pause_start_time) > strtotime($last_pause)) {
            $last_pause = $event->pause_start_time;
        }
    }

    $stats->avg_pause_duration_ms = $stats->total_pause_time_ms / $stats->total_pauses;
    $stats->max_pause_duration_ms = max($durations);
    $stats->min_pause_duration_ms = min($durations);
    $stats->first_pause_at = $first_pause;
    $stats->last_pause_at = $last_pause;

    // Calculate cognitive load score (0-100)
    // Higher number of confusion/distraction pauses = higher cognitive load
    $confusion_weight = 2.0;
    $distraction_weight = 1.5;
    $cognitive_load = min(100, (
        ($stats->thinking_pauses * 1.0) +
        ($stats->confusion_pauses * $confusion_weight) +
        ($stats->distraction_pauses * $distraction_weight) +
        ($stats->rereading_pauses * 1.2)
    ) / $stats->total_pauses * 50);

    $stats->cognitive_load_score = round($cognitive_load, 2);

    // Struggle indicator: high cognitive load or many confusion pauses
    $stats->struggle_indicator = (
        $stats->cognitive_load_score > 70 ||
        $stats->confusion_pauses > ($stats->total_pauses * 0.4)
    );

    $stats->updated_at = date('Y-m-d H:i:s');

    // Check if record exists
    $existing = $DB->get_record('cognitive_pause_analytics', array(
        'user_id' => $userid,
        'question_id' => $questionid,
        'attempt_id' => $attemptid
    ));

    if ($existing) {
        $stats->id = $existing->id;
        return $DB->update_record('cognitive_pause_analytics', $stats);
    } else {
        $stats->created_at = date('Y-m-d H:i:s');
        return $DB->insert_record('cognitive_pause_analytics', $stats);
    }
}

/**
 * Get cognitive pause analytics for a student
 *
 * @param int $userid User ID
 * @param int $courseid Course ID (optional)
 * @return array Analytics data
 */
function local_cogpause_get_student_analytics($userid, $courseid = null) {
    global $DB;

    $params = array('user_id' => $userid);
    $sql = "SELECT cpa.*, cpe.course_id, cpe.quiz_id
            FROM {cognitive_pause_analytics} cpa
            JOIN {cognitive_pause_events} cpe ON cpa.attempt_id = cpe.attempt_id";

    if ($courseid) {
        $sql .= " WHERE cpa.user_id = :user_id AND cpe.course_id = :course_id";
        $params['course_id'] = $courseid;
    } else {
        $sql .= " WHERE cpa.user_id = :user_id";
    }

    $sql .= " GROUP BY cpa.id ORDER BY cpa.updated_at DESC";

    return $DB->get_records_sql($sql, $params);
}

/**
 * Get question pause patterns
 *
 * @param int $questionid Question ID
 * @return object|false Question pause pattern data
 */
function local_cogpause_get_question_patterns($questionid) {
    global $DB;

    $pattern = $DB->get_record('question_pause_patterns', array('question_id' => $questionid));

    if (!$pattern) {
        // Create initial pattern record
        $pattern = local_cogpause_calculate_question_patterns($questionid);
    }

    return $pattern;
}

/**
 * Calculate and update question pause patterns
 *
 * @param int $questionid Question ID
 * @return object Question pause pattern data
 */
function local_cogpause_calculate_question_patterns($questionid) {
    global $DB;

    // Get all analytics for this question
    $analytics = $DB->get_records('cognitive_pause_analytics', array('question_id' => $questionid));

    if (empty($analytics)) {
        return false;
    }

    $pattern = new stdClass();
    $pattern->question_id = $questionid;

    // Get question context
    $first_event = $DB->get_record_sql(
        "SELECT quiz_id, course_id FROM {cognitive_pause_events}
         WHERE question_id = ? LIMIT 1",
        array($questionid)
    );

    $pattern->quiz_id = $first_event->quiz_id;
    $pattern->course_id = $first_event->course_id;

    // Calculate aggregates
    $pattern->total_attempts = count($analytics);
    $unique_students = array();
    $total_pauses = 0;
    $total_pause_time = 0;

    foreach ($analytics as $analytic) {
        $unique_students[$analytic->user_id] = true;
        $total_pauses += $analytic->total_pauses;
        $total_pause_time += $analytic->total_pause_time_ms;
    }

    $pattern->total_students = count($unique_students);
    $pattern->avg_pauses_per_attempt = round($total_pauses / $pattern->total_attempts, 2);
    $pattern->avg_total_pause_time_ms = round($total_pause_time / $pattern->total_attempts);

    // Calculate difficulty score (normalized 0-100)
    $pattern->pause_difficulty_score = min(100, $pattern->avg_pauses_per_attempt * 10);

    // Flag for revision if very difficult
    $pattern->needs_revision = ($pattern->pause_difficulty_score > 75);

    $pattern->last_analyzed_at = date('Y-m-d H:i:s');
    $pattern->updated_at = date('Y-m-d H:i:s');

    // Insert or update
    $existing = $DB->get_record('question_pause_patterns', array('question_id' => $questionid));
    if ($existing) {
        $pattern->id = $existing->id;
        $DB->update_record('question_pause_patterns', $pattern);
    } else {
        $pattern->created_at = date('Y-m-d H:i:s');
        $pattern->id = $DB->insert_record('question_pause_patterns', $pattern);
    }

    return $pattern;
}

/**
 * Get or update student cognitive profile
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return object Student cognitive profile
 */
function local_cogpause_get_student_profile($userid, $courseid) {
    global $DB;

    $profile = $DB->get_record('student_cognitive_profiles', array(
        'user_id' => $userid,
        'course_id' => $courseid
    ));

    if (!$profile) {
        $profile = local_cogpause_create_student_profile($userid, $courseid);
    }

    return $profile;
}

/**
 * Create and calculate student cognitive profile
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return object Student cognitive profile
 */
function local_cogpause_create_student_profile($userid, $courseid) {
    global $DB;

    $profile = new stdClass();
    $profile->user_id = $userid;
    $profile->course_id = $courseid;

    // Get all analytics for this student in this course
    $analytics = $DB->get_records_sql(
        "SELECT cpa.*
         FROM {cognitive_pause_analytics} cpa
         JOIN {cognitive_pause_events} cpe ON cpa.attempt_id = cpe.attempt_id
         WHERE cpa.user_id = ? AND cpe.course_id = ?",
        array($userid, $courseid)
    );

    if (empty($analytics)) {
        return false;
    }

    $profile->total_questions_attempted = count($analytics);
    $total_pauses = 0;
    $total_duration = 0;
    $total_cognitive_load = 0;
    $questions_with_struggle = 0;

    foreach ($analytics as $analytic) {
        $total_pauses += $analytic->total_pauses;
        $total_duration += $analytic->avg_pause_duration_ms;
        $total_cognitive_load += $analytic->cognitive_load_score;
        if ($analytic->struggle_indicator) {
            $questions_with_struggle++;
        }
    }

    $profile->avg_pauses_per_question = round($total_pauses / $profile->total_questions_attempted, 2);
    $profile->avg_pause_duration_ms = round($total_duration / $profile->total_questions_attempted);
    $profile->avg_cognitive_load = round($total_cognitive_load / $profile->total_questions_attempted, 2);
    $profile->questions_with_struggle = $questions_with_struggle;

    // Classify learning style
    $profile->quick_thinker = ($profile->avg_pauses_per_question < 3 && $profile->avg_pause_duration_ms < 5000);
    $profile->deep_thinker = ($profile->avg_pauses_per_question < 5 && $profile->avg_pause_duration_ms > 8000);
    $profile->struggling_learner = ($profile->questions_with_struggle > $profile->total_questions_attempted * 0.5);
    $profile->distracted_learner = false; // Would need more data to determine

    // At-risk flag
    $profile->at_risk_flag = (
        $profile->avg_cognitive_load > 70 ||
        $profile->struggling_learner
    );

    $profile->improvement_trend = 'insufficient_data'; // Would need time-series analysis
    $profile->profile_last_updated = date('Y-m-d H:i:s');
    $profile->updated_at = date('Y-m-d H:i:s');

    // Insert or update
    $existing = $DB->get_record('student_cognitive_profiles', array(
        'user_id' => $userid,
        'course_id' => $courseid
    ));

    if ($existing) {
        $profile->id = $existing->id;
        $DB->update_record('student_cognitive_profiles', $profile);
    } else {
        $profile->created_at = date('Y-m-d H:i:s');
        $profile->id = $DB->insert_record('student_cognitive_profiles', $profile);
    }

    return $profile;
}
