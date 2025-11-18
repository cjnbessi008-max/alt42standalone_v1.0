<?php
/**
 * Plugin settings
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    // Claude API settings
    $settings->add(new admin_setting_heading('problemexplain_ai_settings',
        get_string('ai_settings', 'problemexplain'),
        get_string('ai_settings_desc', 'problemexplain')));

    $settings->add(new admin_setting_configtext('problemexplain/claude_api_key',
        get_string('claude_api_key', 'problemexplain'),
        get_string('claude_api_key_desc', 'problemexplain'),
        '',
        PARAM_TEXT));

    $settings->add(new admin_setting_configselect('problemexplain/claude_model',
        get_string('claude_model', 'problemexplain'),
        get_string('claude_model_desc', 'problemexplain'),
        'claude-3-sonnet-20240229',
        array(
            'claude-3-opus-20240229' => 'Claude 3 Opus (Most capable)',
            'claude-3-sonnet-20240229' => 'Claude 3 Sonnet (Balanced)',
            'claude-3-haiku-20240307' => 'Claude 3 Haiku (Fastest)'
        )));

    $settings->add(new admin_setting_configcheckbox('problemexplain/enable_ai_by_default',
        get_string('enable_ai_by_default', 'problemexplain'),
        get_string('enable_ai_by_default_desc', 'problemexplain'),
        1));
}
