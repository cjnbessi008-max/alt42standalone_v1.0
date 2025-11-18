<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/dmnrest/classes/api_client.php');

require_login();
require_sesskey();

$event_id = required_param('event_id', PARAM_TEXT);
$completed = required_param('completed', PARAM_BOOL);
$duration = optional_param('duration', null, PARAM_INT);
$feedback = optional_param('feedback', null, PARAM_INT);

header('Content-Type: application/json');

try {
    $api = new \local_dmnrest\api_client();
    $result = $api->record_completion($event_id, $completed, $duration, $feedback);

    if ($result && isset($result->success) && $result->success) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'API call failed']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
