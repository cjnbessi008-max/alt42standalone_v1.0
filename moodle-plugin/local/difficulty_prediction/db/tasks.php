<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Scheduled task definitions
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$tasks = array(

    array(
        'classname' => 'local_difficulty_prediction\task\update_difficulties',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '2',
        'day' => '*',
        'dayofweek' => '*',
        'month' => '*'
    ),

    array(
        'classname' => 'local_difficulty_prediction\task\cleanup_old_performance',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '3',
        'day' => '*',
        'dayofweek' => '0',  // Sunday
        'month' => '*'
    ),

);
