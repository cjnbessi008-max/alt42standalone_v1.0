<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Scheduled tasks for Anxiety Detection Plugin
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$tasks = array(
    array(
        'classname' => 'local_anxiety\task\cleanup_old_data',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '2',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '0', // Sunday
    ),
);
