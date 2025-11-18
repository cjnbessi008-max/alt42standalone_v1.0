<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once('lib.php');

require_login();

$action = required_param('action', PARAM_ALPHA);
$courseid = required_param('courseid', PARAM_INT);

$context = context_course::instance($courseid);
require_capability('block/3dinsight:view', $context);

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'get_problems':
            $problems = block_3dinsight_get_problems($courseid);
            echo json_encode(['success' => true, 'data' => $problems]);
            break;

        case 'get_problem':
            $problemid = required_param('problemid', PARAM_INT);
            $problem = block_3dinsight_get_problem($problemid);
            echo json_encode(['success' => true, 'data' => $problem]);
            break;

        case 'save_attempt':
            $problemid = required_param('problemid', PARAM_INT);
            $data = required_param('data', PARAM_RAW);
            $rotation_count = optional_param('rotation_count', 0, PARAM_INT);
            $time_spent = optional_param('time_spent', 0, PARAM_INT);

            $attempt = new stdClass();
            $attempt->problemid = $problemid;
            $attempt->userid = $USER->id;
            $attempt->courseid = $courseid;
            $attempt->answer_data = $data;
            $attempt->rotation_count = $rotation_count;
            $attempt->time_spent = $time_spent;
            $attempt->timecreated = time();
            $attempt->timemodified = time();

            $id = $DB->insert_record('block_3dinsight_attempts', $attempt);
            echo json_encode(['success' => true, 'attempt_id' => $id]);
            break;

        case 'update_attempt':
            $attemptid = required_param('attemptid', PARAM_INT);
            $data = required_param('data', PARAM_RAW);
            $rotation_count = optional_param('rotation_count', 0, PARAM_INT);
            $time_spent = optional_param('time_spent', 0, PARAM_INT);
            $completed = optional_param('completed', 0, PARAM_INT);
            $score = optional_param('score', null, PARAM_FLOAT);

            $attempt = $DB->get_record('block_3dinsight_attempts', ['id' => $attemptid], '*', MUST_EXIST);

            // Verify user owns this attempt
            if ($attempt->userid != $USER->id) {
                throw new moodle_exception('nopermissions');
            }

            $attempt->answer_data = $data;
            $attempt->rotation_count = $rotation_count;
            $attempt->time_spent = $time_spent;
            $attempt->completed = $completed;
            if ($score !== null) {
                $attempt->score = $score;
            }
            $attempt->timemodified = time();

            $DB->update_record('block_3dinsight_attempts', $attempt);
            echo json_encode(['success' => true]);
            break;

        case 'get_config':
            $config = block_3dinsight_get_config($courseid);
            echo json_encode(['success' => true, 'data' => $config]);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
