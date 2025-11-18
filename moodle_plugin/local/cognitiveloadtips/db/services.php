<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Web service definitions for Cognitive Load Tips plugin
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(

    'local_cognitiveloadtips_record_interaction' => array(
        'classname'   => 'local_cognitiveloadtips\external\record_interaction',
        'methodname'  => 'execute',
        'description' => 'Record user interaction with a cognitive load tip',
        'type'        => 'write',
        'ajax'        => true,
        'loginrequired' => true,
    ),

    'local_cognitiveloadtips_submit_feedback' => array(
        'classname'   => 'local_cognitiveloadtips\external\submit_feedback',
        'methodname'  => 'execute',
        'description' => 'Submit feedback on tip helpfulness',
        'type'        => 'write',
        'ajax'        => true,
        'loginrequired' => true,
    ),

    'local_cognitiveloadtips_get_tips' => array(
        'classname'   => 'local_cognitiveloadtips\external\get_tips',
        'methodname'  => 'execute',
        'description' => 'Get cognitive load tips for a difficulty level',
        'type'        => 'read',
        'ajax'        => true,
        'loginrequired' => true,
    ),

    'local_cognitiveloadtips_get_question_difficulty' => array(
        'classname'   => 'local_cognitiveloadtips\external\get_question_difficulty',
        'methodname'  => 'execute',
        'description' => 'Get difficulty level for a question',
        'type'        => 'read',
        'ajax'        => true,
        'loginrequired' => true,
    ),

    'local_cognitiveloadtips_set_question_difficulty' => array(
        'classname'   => 'local_cognitiveloadtips\external\set_question_difficulty',
        'methodname'  => 'execute',
        'description' => 'Set difficulty level for a question',
        'type'        => 'write',
        'ajax'        => true,
        'loginrequired' => true,
        'capabilities' => 'local/cognitiveloadtips:assigndifficulty',
    ),

    'local_cognitiveloadtips_get_statistics' => array(
        'classname'   => 'local_cognitiveloadtips\external\get_statistics',
        'methodname'  => 'execute',
        'description' => 'Get usage statistics for admin dashboard',
        'type'        => 'read',
        'ajax'        => true,
        'loginrequired' => true,
        'capabilities' => 'local/cognitiveloadtips:manage',
    ),
);
