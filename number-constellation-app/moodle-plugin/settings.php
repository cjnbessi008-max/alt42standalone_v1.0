<?php
// This file is part of Moodle - http://moodle.org/
//
// Number Constellation - Moodle Plugin Settings
// Compatible with Moodle 3.7, PHP 7.1.9

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_numconstellation', get_string('pluginname', 'local_numconstellation'));

    // API URL setting
    $settings->add(new admin_setting_configtext(
        'local_numconstellation/api_url',
        get_string('apiurl', 'local_numconstellation'),
        get_string('apiurl_desc', 'local_numconstellation'),
        'http://localhost:8080/api/problem.php',
        PARAM_URL
    ));

    // App URL setting
    $settings->add(new admin_setting_configtext(
        'local_numconstellation/app_url',
        get_string('appurl', 'local_numconstellation'),
        get_string('appurl_desc', 'local_numconstellation'),
        'http://localhost:8080',
        PARAM_URL
    ));

    // API Key setting
    $settings->add(new admin_setting_configtext(
        'local_numconstellation/api_key',
        get_string('apikey', 'local_numconstellation'),
        get_string('apikey_desc', 'local_numconstellation'),
        'your-secret-api-key-here',
        PARAM_TEXT
    ));

    $ADMIN->add('localplugins', $settings);
}
