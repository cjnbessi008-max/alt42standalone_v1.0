<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Geo Spiral REST API
 *
 * @package    block_geospiral
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_login();

header('Content-Type: application/json');

$action = required_param('action', PARAM_ALPHA);
$courseid = required_param('courseid', PARAM_INT);

$context = context_course::instance($courseid);
require_capability('block/geospiral:view', $context);

try {
    switch ($action) {
        case 'get_sequences':
            $sequences = $DB->get_records('block_geospiral_sequences', null, 'name ASC');
            echo json_encode(array('success' => true, 'data' => array_values($sequences)));
            break;

        case 'get_sequence':
            $sequenceid = required_param('sequenceid', PARAM_INT);
            $sequence = $DB->get_record('block_geospiral_sequences', array('id' => $sequenceid), '*', MUST_EXIST);
            echo json_encode(array('success' => true, 'data' => $sequence));
            break;

        case 'get_progress':
            $sequenceid = required_param('sequenceid', PARAM_INT);
            $progress = $DB->get_record('block_geospiral_progress', array(
                'userid' => $USER->id,
                'sequenceid' => $sequenceid,
                'courseid' => $courseid
            ));
            echo json_encode(array('success' => true, 'data' => $progress ?: null));
            break;

        case 'save_progress':
            $sequenceid = required_param('sequenceid', PARAM_INT);
            $status = optional_param('status', 'in_progress', PARAM_TEXT);
            $timespent = optional_param('timespent', 0, PARAM_INT);
            $score = optional_param('score', null, PARAM_FLOAT);

            $existing = $DB->get_record('block_geospiral_progress', array(
                'userid' => $USER->id,
                'sequenceid' => $sequenceid,
                'courseid' => $courseid
            ));

            $record = new stdClass();
            $record->userid = $USER->id;
            $record->sequenceid = $sequenceid;
            $record->courseid = $courseid;
            $record->completion_status = $status;
            $record->time_spent = $timespent;
            $record->last_interaction = time();
            $record->timemodified = time();
            if ($score !== null) {
                $record->score = $score;
            }

            if ($existing) {
                $record->id = $existing->id;
                $record->interaction_count = $existing->interaction_count + 1;
                $DB->update_record('block_geospiral_progress', $record);
            } else {
                $record->interaction_count = 1;
                $record->timecreated = time();
                $record->id = $DB->insert_record('block_geospiral_progress', $record);
            }

            echo json_encode(array('success' => true, 'data' => $record));
            break;

        case 'log_interaction':
            $sequenceid = required_param('sequenceid', PARAM_INT);
            $type = required_param('type', PARAM_TEXT);
            $data = optional_param('data', '', PARAM_RAW);

            $record = new stdClass();
            $record->userid = $USER->id;
            $record->sequenceid = $sequenceid;
            $record->interaction_type = $type;
            $record->interaction_data = $data;
            $record->timecreated = time();

            $id = $DB->insert_record('block_geospiral_interactions', $record);
            echo json_encode(array('success' => true, 'data' => array('id' => $id)));
            break;

        default:
            throw new moodle_exception('invalidaction', 'block_geospiral');
    }
} catch (Exception $e) {
    echo json_encode(array('success' => false, 'error' => $e->getMessage()));
}
