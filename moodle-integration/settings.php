<?php
/**
 * Settings for Breathing Curve plugin
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_breathing_curve', get_string('pluginname', 'local_breathing_curve'));

    // Animation speed setting
    $settings->add(new admin_setting_configtext(
        'local_breathing_curve/animationspeed',
        get_string('animationspeed', 'local_breathing_curve'),
        get_string('animationspeed_desc', 'local_breathing_curve'),
        '1.0',
        PARAM_FLOAT
    ));

    // Show hints setting
    $settings->add(new admin_setting_configcheckbox(
        'local_breathing_curve/showhints',
        get_string('showhints', 'local_breathing_curve'),
        get_string('showhints_desc', 'local_breathing_curve'),
        1
    ));

    // Show critical points setting
    $settings->add(new admin_setting_configcheckbox(
        'local_breathing_curve/showcriticalpoints',
        get_string('showcriticalpoints', 'local_breathing_curve'),
        get_string('showcriticalpoints_desc', 'local_breathing_curve'),
        1
    ));

    // Default function type
    $settings->add(new admin_setting_configselect(
        'local_breathing_curve/defaultfunction',
        get_string('defaultfunction', 'local_breathing_curve'),
        get_string('defaultfunction_desc', 'local_breathing_curve'),
        'quadratic',
        [
            'quadratic' => get_string('quadratic', 'local_breathing_curve'),
            'sine' => get_string('sine', 'local_breathing_curve'),
            'cubic' => get_string('cubic', 'local_breathing_curve')
        ]
    ));

    $ADMIN->add('localplugins', $settings);
}
