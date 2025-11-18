<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Web service definitions for Difficulty Prediction plugin
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(

    'local_difficulty_prediction_predict' => array(
        'classname'   => 'local_difficulty_prediction\external\predict',
        'methodname'  => 'execute',
        'description' => 'Predict difficulty for a question',
        'type'        => 'read',
        'capabilities'=> 'local/difficulty_prediction:view',
        'ajax'        => true,
    ),

    'local_difficulty_prediction_batch_predict' => array(
        'classname'   => 'local_difficulty_prediction\external\batch_predict',
        'methodname'  => 'execute',
        'description' => 'Batch predict difficulty for multiple questions',
        'type'        => 'read',
        'capabilities'=> 'local/difficulty_prediction:view',
        'ajax'        => true,
    ),

    'local_difficulty_prediction_analytics' => array(
        'classname'   => 'local_difficulty_prediction\external\analytics',
        'methodname'  => 'execute',
        'description' => 'Get difficulty analytics for a course',
        'type'        => 'read',
        'capabilities'=> 'local/difficulty_prediction:viewanalytics',
        'ajax'        => true,
    ),

    'local_difficulty_prediction_student_analytics' => array(
        'classname'   => 'local_difficulty_prediction\external\student_analytics',
        'methodname'  => 'execute',
        'description' => 'Get student performance analytics',
        'type'        => 'read',
        'capabilities'=> 'local/difficulty_prediction:view',
        'ajax'        => true,
    ),

);

$services = array(
    'Difficulty Prediction Service' => array(
        'functions' => array(
            'local_difficulty_prediction_predict',
            'local_difficulty_prediction_batch_predict',
            'local_difficulty_prediction_analytics',
            'local_difficulty_prediction_student_analytics'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
    )
);
