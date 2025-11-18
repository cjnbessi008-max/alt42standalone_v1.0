<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX API endpoint for Slope Heatmap
 *
 * @package    mod_slopeheatmap
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/classes/api.php');

// Check login
require_login();

// Get parameters
$action = required_param('action', PARAM_ALPHA);

// Set JSON header
header('Content-Type: application/json');

try {
    switch ($action) {
        case 'start_session':
            $cmid = required_param('cmid', PARAM_INT);
            $problemid = required_param('problemid', PARAM_ALPHANUMEXT);
            require_sesskey();

            $result = \mod_slopeheatmap\api::start_session($cmid, $USER->id, $problemid);
            break;

        case 'save_sensor_data':
            $sessionid = required_param('sessionid', PARAM_INT);
            $data = required_param('data', PARAM_RAW);
            require_sesskey();

            $sensordata = json_decode($data, true);
            if (!$sensordata) {
                throw new moodle_exception('Invalid sensor data');
            }

            $result = \mod_slopeheatmap\api::save_sensor_data($sessionid, $sensordata);
            break;

        case 'complete_session':
            $sessionid = required_param('sessionid', PARAM_INT);
            $score = required_param('score', PARAM_FLOAT);
            require_sesskey();

            $result = \mod_slopeheatmap\api::complete_session($sessionid, $score);
            break;

        case 'get_heatmap':
            $sessionid = required_param('sessionid', PARAM_INT);

            $result = \mod_slopeheatmap\api::get_heatmap_data($sessionid);
            break;

        case 'get_problems':
            $cmid = required_param('cmid', PARAM_INT);

            $result = \mod_slopeheatmap\api::get_problems($cmid);
            break;

        default:
            throw new moodle_exception('Invalid action');
    }

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
