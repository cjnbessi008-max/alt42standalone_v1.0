<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observers configuration
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = array(

    array(
        'eventname' => '\core\event\question_created',
        'callback'  => 'local_difficulty_prediction\observer::question_created',
    ),

    array(
        'eventname' => '\core\event\question_updated',
        'callback'  => 'local_difficulty_prediction\observer::question_updated',
    ),

    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback'  => 'local_difficulty_prediction\observer::attempt_submitted',
    ),

);
