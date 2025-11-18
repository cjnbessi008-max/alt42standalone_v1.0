<?php
/**
 * Settings for Concept Detection Plugin
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_conceptdetection',
        get_string('pluginname', 'local_conceptdetection'));

    // Analysis threshold settings
    $settings->add(new admin_setting_configtext(
        'local_conceptdetection/threshold_time',
        get_string('threshold_time', 'local_conceptdetection'),
        get_string('threshold_time_desc', 'local_conceptdetection'),
        '60',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_conceptdetection/threshold_attempts',
        get_string('threshold_attempts', 'local_conceptdetection'),
        get_string('threshold_attempts_desc', 'local_conceptdetection'),
        '3',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_conceptdetection/threshold_score',
        get_string('threshold_score', 'local_conceptdetection'),
        get_string('threshold_score_desc', 'local_conceptdetection'),
        '60',
        PARAM_INT
    ));

    // Enable/disable tracking
    $settings->add(new admin_setting_configcheckbox(
        'local_conceptdetection/enable_tracking',
        get_string('enable_tracking', 'local_conceptdetection'),
        get_string('enable_tracking_desc', 'local_conceptdetection'),
        '1'
    ));

    $ADMIN->add('localplugins', $settings);
}
