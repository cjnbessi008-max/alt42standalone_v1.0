<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Settings for Difficulty Prediction plugin
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_difficulty_prediction', get_string('pluginname', 'local_difficulty_prediction'));

    // Header.
    $settings->add(new admin_setting_heading(
        'local_difficulty_prediction/settingsheader',
        get_string('settingsheader', 'local_difficulty_prediction'),
        ''
    ));

    // Enable automatic prediction.
    $settings->add(new admin_setting_configcheckbox(
        'local_difficulty_prediction/enable_auto_prediction',
        get_string('enable_auto_prediction', 'local_difficulty_prediction'),
        get_string('enable_auto_prediction_desc', 'local_difficulty_prediction'),
        1
    ));

    // Algorithm weights.
    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/weight_complexity',
        get_string('weight_complexity', 'local_difficulty_prediction'),
        get_string('weight_complexity_desc', 'local_difficulty_prediction'),
        0.40,
        PARAM_FLOAT
    ));

    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/weight_cognitive',
        get_string('weight_cognitive', 'local_difficulty_prediction'),
        get_string('weight_cognitive_desc', 'local_difficulty_prediction'),
        0.30,
        PARAM_FLOAT
    ));

    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/weight_historical',
        get_string('weight_historical', 'local_difficulty_prediction'),
        get_string('weight_historical_desc', 'local_difficulty_prediction'),
        0.20,
        PARAM_FLOAT
    ));

    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/weight_question_type',
        get_string('weight_question_type', 'local_difficulty_prediction'),
        get_string('weight_question_type_desc', 'local_difficulty_prediction'),
        0.10,
        PARAM_FLOAT
    ));

    // Performance tracking settings.
    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/min_attempts_threshold',
        get_string('min_attempts_threshold', 'local_difficulty_prediction'),
        get_string('min_attempts_threshold_desc', 'local_difficulty_prediction'),
        10,
        PARAM_INT
    ));

    // Cache settings.
    $settings->add(new admin_setting_configtext(
        'local_difficulty_prediction/cache_ttl',
        get_string('cache_ttl', 'local_difficulty_prediction'),
        get_string('cache_ttl_desc', 'local_difficulty_prediction'),
        3600,
        PARAM_INT
    ));

    $ADMIN->add('localplugins', $settings);
}
