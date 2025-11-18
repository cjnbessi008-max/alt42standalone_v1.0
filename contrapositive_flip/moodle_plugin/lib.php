<?php
/**
 * Library functions for Contrapositive Flip plugin
 *
 * @package    local_contrapositive
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/contrapositive_generator.php');

/**
 * Get a contrapositive question by ID
 *
 * @param int $questionid The question ID
 * @return object|false Question object or false if not found
 */
function local_contrapositive_get_question($questionid) {
    global $DB;

    try {
        $question = $DB->get_record('contrapositive_questions', ['id' => $questionid]);
        return $question;
    } catch (Exception $e) {
        error_log('Error fetching contrapositive question: ' . $e->getMessage());
        return false;
    }
}

/**
 * Get questions by Moodle question ID
 *
 * @param int $moodlequestionid The Moodle question bank ID
 * @return array Array of question objects
 */
function local_contrapositive_get_by_moodle_question($moodlequestionid) {
    global $DB;

    try {
        $questions = $DB->get_records('contrapositive_questions',
            ['moodle_question_id' => $moodlequestionid]);
        return $questions;
    } catch (Exception $e) {
        error_log('Error fetching contrapositive questions: ' . $e->getMessage());
        return [];
    }
}

/**
 * Create a new contrapositive question
 *
 * @param object $data Question data
 * @return int|false New question ID or false on failure
 */
function local_contrapositive_create_question($data) {
    global $DB;

    $record = new stdClass();
    $record->moodle_question_id = $data->moodle_question_id;
    $record->course_id = $data->course_id;
    $record->original_statement = $data->original_statement;
    $record->original_antecedent = $data->original_antecedent;
    $record->original_consequent = $data->original_consequent;

    // Generate contrapositive
    $generator = new contrapositive_generator();
    $contrapositive = $generator->generate(
        $data->original_antecedent,
        $data->original_consequent,
        $data->language ?? 'ko'
    );

    $record->contrapositive_statement = $contrapositive['statement'];
    $record->contrapositive_antecedent = $contrapositive['antecedent'];
    $record->contrapositive_consequent = $contrapositive['consequent'];

    $record->difficulty_level = $data->difficulty_level ?? 1;
    $record->language = $data->language ?? 'ko';
    $record->timecreated = time();
    $record->timemodified = time();

    try {
        $id = $DB->insert_record('contrapositive_questions', $record);
        return $id;
    } catch (Exception $e) {
        error_log('Error creating contrapositive question: ' . $e->getMessage());
        return false;
    }
}

/**
 * Record a student attempt
 *
 * @param object $data Attempt data
 * @return int|false Attempt ID or false on failure
 */
function local_contrapositive_record_attempt($data) {
    global $DB, $USER;

    $record = new stdClass();
    $record->question_id = $data->question_id;
    $record->user_id = $data->user_id ?? $USER->id;
    $record->flip_count = $data->flip_count ?? 0;
    $record->time_spent = $data->time_spent ?? 0;
    $record->understood = $data->understood ?? null;
    $record->user_answer = $data->user_answer ?? '';
    $record->timecreated = time();
    $record->timemodified = time();

    try {
        $id = $DB->insert_record('contrapositive_attempts', $record);
        return $id;
    } catch (Exception $e) {
        error_log('Error recording contrapositive attempt: ' . $e->getMessage());
        return false;
    }
}

/**
 * Update attempt data
 *
 * @param int $attemptid Attempt ID
 * @param object $data Updated data
 * @return bool Success status
 */
function local_contrapositive_update_attempt($attemptid, $data) {
    global $DB;

    try {
        $record = $DB->get_record('contrapositive_attempts', ['id' => $attemptid]);
        if (!$record) {
            return false;
        }

        if (isset($data->flip_count)) {
            $record->flip_count = $data->flip_count;
        }
        if (isset($data->time_spent)) {
            $record->time_spent = $data->time_spent;
        }
        if (isset($data->understood)) {
            $record->understood = $data->understood;
        }
        if (isset($data->user_answer)) {
            $record->user_answer = $data->user_answer;
        }

        $record->timemodified = time();

        return $DB->update_record('contrapositive_attempts', $record);
    } catch (Exception $e) {
        error_log('Error updating contrapositive attempt: ' . $e->getMessage());
        return false;
    }
}

/**
 * Get student's latest attempt for a question
 *
 * @param int $questionid Question ID
 * @param int $userid User ID (optional, defaults to current user)
 * @return object|false Attempt object or false
 */
function local_contrapositive_get_latest_attempt($questionid, $userid = null) {
    global $DB, $USER;

    if ($userid === null) {
        $userid = $USER->id;
    }

    try {
        $attempts = $DB->get_records('contrapositive_attempts',
            ['question_id' => $questionid, 'user_id' => $userid],
            'timecreated DESC',
            '*',
            0,
            1
        );

        return !empty($attempts) ? reset($attempts) : false;
    } catch (Exception $e) {
        error_log('Error fetching latest attempt: ' . $e->getMessage());
        return false;
    }
}

/**
 * Get analytics for a question
 *
 * @param int $questionid Question ID
 * @param int $days Number of days to look back (default 30)
 * @return array Analytics data
 */
function local_contrapositive_get_analytics($questionid, $days = 30) {
    global $DB;

    try {
        $cutoffdate = date('Y-m-d', strtotime("-{$days} days"));

        $analytics = $DB->get_records_sql(
            "SELECT *
             FROM {contrapositive_analytics}
             WHERE question_id = ?
             AND date_recorded >= ?
             ORDER BY date_recorded ASC",
            [$questionid, $cutoffdate]
        );

        return $analytics;
    } catch (Exception $e) {
        error_log('Error fetching analytics: ' . $e->getMessage());
        return [];
    }
}
