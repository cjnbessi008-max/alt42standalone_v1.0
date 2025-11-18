<?php
/**
 * Event observers configuration
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = array(
    array(
        'eventname' => '\core\event\question_created',
        'callback' => '\mod_cognitiveload\observer::question_created',
    ),
    array(
        'eventname' => '\core\event\question_updated',
        'callback' => '\mod_cognitiveload\observer::question_updated',
    ),
    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => '\mod_cognitiveload\observer::quiz_attempt_submitted',
    ),
);
