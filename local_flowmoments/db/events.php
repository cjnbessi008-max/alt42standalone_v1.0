<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Event observers registration
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\mod_quiz\event\attempt_started',
        'callback' => '\local_flowmoments\observer::quiz_attempt_started',
    ],
    [
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => '\local_flowmoments\observer::quiz_attempt_submitted',
    ],
    [
        'eventname' => '\core\event\question_answered',
        'callback' => '\local_flowmoments\observer::question_answered',
    ],
    [
        'eventname' => '\mod_quiz\event\question_viewed',
        'callback' => '\local_flowmoments\observer::question_viewed',
    ],
    [
        'eventname' => '\core\event\course_module_viewed',
        'callback' => '\local_flowmoments\observer::course_module_viewed',
    ],
];
