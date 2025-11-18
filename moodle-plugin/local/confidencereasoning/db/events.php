<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$observers = array(
    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => 'local_confidencereasoning_observer::quiz_attempt_submitted',
    ),
    array(
        'eventname' => '\core\event\question_answered',
        'callback' => 'local_confidencereasoning_observer::question_answered',
    ),
);
