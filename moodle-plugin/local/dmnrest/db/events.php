<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\mod_quiz\event\attempt_started',
        'callback' => '\local_dmnrest\observer::quiz_attempt_started',
    ],
    [
        'eventname' => '\mod_quiz\event\question_viewed',
        'callback' => '\local_dmnrest\observer::question_viewed',
    ],
    [
        'eventname' => '\mod_quiz\event\question_answered',
        'callback' => '\local_dmnrest\observer::question_answered',
    ],
];
