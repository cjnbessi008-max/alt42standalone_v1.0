<?php
// This file is part of Rule Patternizer

// Redirect to Moodle course page
require_once(__DIR__ . '/../../config.php');

$id = optional_param('id', 0, PARAM_INT);

if ($id) {
    $url = new moodle_url('/course/view.php', array('id' => $id));
} else {
    $url = new moodle_url('/');
}

redirect($url);
