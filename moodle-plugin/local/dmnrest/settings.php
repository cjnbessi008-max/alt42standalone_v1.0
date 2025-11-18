<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_dmnrest', get_string('pluginname', 'local_dmnrest'));

    // Enable/Disable DMN rest routines
    $settings->add(new admin_setting_configcheckbox(
        'local_dmnrest/enabled',
        get_string('setting_enabled', 'local_dmnrest'),
        get_string('setting_enabled_desc', 'local_dmnrest'),
        1
    ));

    // API Endpoint
    $settings->add(new admin_setting_configtext(
        'local_dmnrest/api_endpoint',
        get_string('setting_api_endpoint', 'local_dmnrest'),
        get_string('setting_api_endpoint_desc', 'local_dmnrest'),
        'http://localhost:3000/api/dmn',
        PARAM_URL
    ));

    // API Key
    $settings->add(new admin_setting_configpasswordunmask(
        'local_dmnrest/api_key',
        get_string('setting_api_key', 'local_dmnrest'),
        get_string('setting_api_key_desc', 'local_dmnrest'),
        ''
    ));

    // Trigger Strategy
    $strategies = [
        'every_problem' => get_string('strategy_every_problem', 'local_dmnrest'),
        'complex_only' => get_string('strategy_complex_only', 'local_dmnrest'),
        'every_n_problems' => get_string('strategy_every_n_problems', 'local_dmnrest'),
        'fatigue_based' => get_string('strategy_fatigue_based', 'local_dmnrest'),
    ];
    $settings->add(new admin_setting_configselect(
        'local_dmnrest/trigger_strategy',
        get_string('setting_trigger_strategy', 'local_dmnrest'),
        get_string('setting_trigger_strategy_desc', 'local_dmnrest'),
        'fatigue_based',
        $strategies
    ));

    // Complexity Threshold
    $settings->add(new admin_setting_configselect(
        'local_dmnrest/complexity_threshold',
        get_string('setting_complexity_threshold', 'local_dmnrest'),
        get_string('setting_complexity_threshold_desc', 'local_dmnrest'),
        3,
        [1 => '1', 2 => '2', 3 => '3', 4 => '4', 5 => '5']
    ));

    // Allow Student Skip
    $settings->add(new admin_setting_configcheckbox(
        'local_dmnrest/allow_skip',
        get_string('setting_allow_skip', 'local_dmnrest'),
        get_string('setting_allow_skip_desc', 'local_dmnrest'),
        1
    ));

    // Minimum Rest Interval (minutes)
    $settings->add(new admin_setting_configtext(
        'local_dmnrest/min_rest_interval',
        get_string('setting_min_rest_interval', 'local_dmnrest'),
        get_string('setting_min_rest_interval_desc', 'local_dmnrest'),
        10,
        PARAM_INT
    ));

    // Problems per interval (for every_n_problems strategy)
    $settings->add(new admin_setting_configtext(
        'local_dmnrest/problems_per_interval',
        get_string('setting_problems_per_interval', 'local_dmnrest'),
        get_string('setting_problems_per_interval_desc', 'local_dmnrest'),
        5,
        PARAM_INT
    ));

    $ADMIN->add('localplugins', $settings);
}
