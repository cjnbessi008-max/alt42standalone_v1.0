<?php
// This file is part of Moodle - http://moodle.org/
//
// Slope Sound - Attempt Manager Class

namespace local_slopesound;

defined('MOODLE_INTERNAL') || die();

class attempt_manager {

    /**
     * Create a new attempt
     *
     * @param int $problemid
     * @param int $userid
     * @param int|null $moodleattemptid
     * @return int Attempt ID
     */
    public static function create_attempt($problemid, $userid, $moodleattemptid = null) {
        global $DB;

        $attempt = new \stdClass();
        $attempt->problem_id = $problemid;
        $attempt->userid = $userid;
        $attempt->moodle_attempt_id = $moodleattemptid;
        $attempt->points_explored = '[]';
        $attempt->time_spent = 0;
        $attempt->completed = 0;
        $attempt->score = null;
        $attempt->timecreated = time();
        $attempt->timemodified = time();

        return $DB->insert_record('slopesound_attempts', $attempt);
    }

    /**
     * Update an attempt
     *
     * @param int $attemptid
     * @param string $pointsexplored JSON array of x values
     * @param int $timespent Time in seconds
     * @param int $completed 0 or 1
     * @param float|null $score
     * @return bool
     */
    public static function update_attempt($attemptid, $pointsexplored = null,
                                          $timespent = null, $completed = null, $score = null) {
        global $DB;

        $attempt = $DB->get_record('slopesound_attempts', ['id' => $attemptid], '*', MUST_EXIST);

        if ($pointsexplored !== null) {
            $attempt->points_explored = $pointsexplored;
        }
        if ($timespent !== null) {
            $attempt->time_spent = $timespent;
        }
        if ($completed !== null) {
            $attempt->completed = $completed;
        }
        if ($score !== null) {
            $attempt->score = $score;
        }

        $attempt->timemodified = time();

        return $DB->update_record('slopesound_attempts', $attempt);
    }

    /**
     * Log an audio event
     *
     * @param int $attemptid
     * @param float $xvalue
     * @param float $slope
     * @param int $frequency
     * @param int $duration
     * @return int Event ID
     */
    public static function log_audio_event($attemptid, $xvalue, $slope, $frequency, $duration = 200) {
        global $DB;

        $event = new \stdClass();
        $event->attempt_id = $attemptid;
        $event->x_value = $xvalue;
        $event->slope_value = $slope;
        $event->frequency_hz = $frequency;
        $event->duration_ms = $duration;
        $event->timecreated = time();

        return $DB->insert_record('slopesound_audio_events', $event);
    }

    /**
     * Get user attempts
     *
     * @param int $userid
     * @param int|null $problemid
     * @return array
     */
    public static function get_user_attempts($userid, $problemid = null) {
        global $DB;

        $conditions = ['userid' => $userid];
        if ($problemid !== null) {
            $conditions['problem_id'] = $problemid;
        }

        return $DB->get_records('slopesound_attempts', $conditions, 'timecreated DESC');
    }

    /**
     * Get attempt with audio events
     *
     * @param int $attemptid
     * @return object
     */
    public static function get_attempt_details($attemptid) {
        global $DB;

        $attempt = $DB->get_record('slopesound_attempts', ['id' => $attemptid], '*', MUST_EXIST);
        $attempt->audio_events = $DB->get_records('slopesound_audio_events',
                                                  ['attempt_id' => $attemptid],
                                                  'timecreated ASC');

        return $attempt;
    }
}
