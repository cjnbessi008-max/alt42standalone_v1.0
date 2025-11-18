<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Save perspective data
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/classes/perspective.php');

use mod_multiperspective\perspective;

require_sesskey();

$cmid = required_param('id', PARAM_INT);
$problemid = required_param('problemid', PARAM_INT);
$perspectiveid = optional_param('perspectiveid', 0, PARAM_INT);
$perspective_name = required_param('perspective_name', PARAM_TEXT);
$perspective_type = required_param('perspective_type', PARAM_ALPHA);
$content = required_param('content', PARAM_RAW);
$hints = optional_param('hints', '', PARAM_RAW);
$media_url = optional_param('media_url', '', PARAM_URL);

// Get course module and check permissions
$cm = get_coursemodule_from_id('multiperspective', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$multiperspective = $DB->get_record('multiperspective', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, false, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/multiperspective:manage', $context);

// Create or update perspective
if ($perspectiveid > 0) {
    $perspective = new perspective($perspectiveid);
    if ($perspective->get_problemid() != $problemid) {
        print_error('invalidperspective', 'mod_multiperspective');
    }
} else {
    $perspective = new perspective();
    $perspective->set_problemid($problemid);
}

$perspective->set_perspective_name($perspective_name);
$perspective->set_perspective_type($perspective_type);
$perspective->set_content($content);
$perspective->set_hints($hints);
$perspective->set_media_url($media_url);

$perspective->save();

redirect(new moodle_url('/mod/multiperspective/manage_problems.php',
    array('id' => $cmid, 'action' => 'editproblem', 'problemid' => $problemid)),
    get_string('changessaved', 'mod_multiperspective'),
    null,
    \core\output\notification::NOTIFY_SUCCESS);
