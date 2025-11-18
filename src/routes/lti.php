<?php

use App\Controllers\LTIController;

$controller = new LTIController();

// LTI launch endpoint (POST from Moodle)
$app->post('/lti/launch', [$controller, 'launch']);

// LTI configuration (for Moodle admin)
$app->get('/lti/config', [$controller, 'config']);

// Grade passback endpoint
$app->post('/lti/grade-passback', [$controller, 'gradePassback']);
