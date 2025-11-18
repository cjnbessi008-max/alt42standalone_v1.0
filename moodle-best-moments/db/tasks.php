<?php
/**
 * Definition of Best Moments scheduled tasks
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$tasks = array(
    array(
        'classname' => 'local_bestmoments\task\analyze_moments',
        'blocking' => 0,
        'minute' => '0',        // At minute 0
        'hour' => '23',         // At 11 PM (23:00)
        'day' => '*',           // Every day
        'dayofweek' => '*',     // Every day of week
        'month' => '*',         // Every month
        'disabled' => 0
    )
);
