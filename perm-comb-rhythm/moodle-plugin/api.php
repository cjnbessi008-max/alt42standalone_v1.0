<?php
/**
 * API endpoint for Perm-Comb Rhythm app
 *
 * @package    mod_permcombrhythm
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once('../../config.php');
require_once('lib.php');

// Get parameters
$action = required_param('action', PARAM_ALPHA);
$id = required_param('id', PARAM_INT);

// Require login
require_login();

// Get activity instance
$permcombrhythm = $DB->get_record('permcombrhythm', array('id' => $id), '*', MUST_EXIST);

// Set JSON header
header('Content-Type: application/json');

try {
    switch ($action) {
        case 'getproblem':
            // Generate new problem
            $problem = permcombrhythm_generate_problem($id);
            echo json_encode(array(
                'success' => true,
                'problem' => $problem
            ));
            break;

        case 'submit':
            // Get submission data
            $answer = required_param('answer', PARAM_INT);
            $problemdata = required_param('problemdata', PARAM_RAW);
            $timespent = optional_param('timespent', 0, PARAM_INT);

            // Decode problem data
            $problemdata = json_decode($problemdata, true);

            // Save attempt
            $attemptid = permcombrhythm_save_attempt(
                $id,
                $USER->id,
                $problemdata,
                $answer,
                $timespent
            );

            // Check if correct
            $iscorrect = ($answer == $problemdata['answer']);

            echo json_encode(array(
                'success' => true,
                'correct' => $iscorrect,
                'correctanswer' => $problemdata['answer'],
                'attemptid' => $attemptid
            ));
            break;

        case 'getstats':
            // Get user statistics
            $attempts = $DB->get_records('permcombrhythm_attempts',
                array('permcombrhythmid' => $id, 'userid' => $USER->id),
                'timecreated DESC',
                '*',
                0,
                10
            );

            $stats = array(
                'total' => $DB->count_records('permcombrhythm_attempts',
                    array('permcombrhythmid' => $id, 'userid' => $USER->id)),
                'correct' => $DB->count_records('permcombrhythm_attempts',
                    array('permcombrhythmid' => $id, 'userid' => $USER->id, 'iscorrect' => 1)),
                'recent' => array_values($attempts)
            );

            if ($stats['total'] > 0) {
                $stats['accuracy'] = round(($stats['correct'] / $stats['total']) * 100, 1);
            } else {
                $stats['accuracy'] = 0;
            }

            echo json_encode(array(
                'success' => true,
                'stats' => $stats
            ));
            break;

        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
