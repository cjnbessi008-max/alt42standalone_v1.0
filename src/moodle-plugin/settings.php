<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Geo Spiral block settings
 *
 * @package    block_geospiral
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    // Phone width setting
    $settings->add(new admin_setting_configtext(
        'block_geospiral/phonewidth',
        get_string('settings:phonewidth', 'block_geospiral'),
        get_string('settings:phonewidth_desc', 'block_geospiral'),
        375,
        PARAM_INT
    ));

    // Phone height setting
    $settings->add(new admin_setting_configtext(
        'block_geospiral/phoneheight',
        get_string('settings:phoneheight', 'block_geospiral'),
        get_string('settings:phoneheight_desc', 'block_geospiral'),
        667,
        PARAM_INT
    ));

    // Phone position setting
    $positions = array(
        'bottom-right' => 'Bottom Right',
        'bottom-left' => 'Bottom Left',
        'top-right' => 'Top Right',
        'top-left' => 'Top Left'
    );

    $settings->add(new admin_setting_configselect(
        'block_geospiral/phoneposition',
        get_string('settings:position', 'block_geospiral'),
        get_string('settings:position_desc', 'block_geospiral'),
        'bottom-right',
        $positions
    ));
}
