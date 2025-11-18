<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Settings for self-explanation question behaviour.
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {

    // Enable globally
    $settings->add(new admin_setting_configcheckbox(
        'qbehaviour_selfexplanation/enable_globally',
        get_string('enable_globally', 'qbehaviour_selfexplanation'),
        get_string('enable_globally_desc', 'qbehaviour_selfexplanation'),
        1
    ));

    // Require explanation on correct answers (default)
    $settings->add(new admin_setting_configcheckbox(
        'qbehaviour_selfexplanation/require_on_correct',
        get_string('require_on_correct', 'qbehaviour_selfexplanation'),
        get_string('require_on_correct_help', 'qbehaviour_selfexplanation'),
        1
    ));

    // Require explanation on incorrect answers (default)
    $settings->add(new admin_setting_configcheckbox(
        'qbehaviour_selfexplanation/require_on_incorrect',
        get_string('require_on_incorrect', 'qbehaviour_selfexplanation'),
        get_string('require_on_incorrect_help', 'qbehaviour_selfexplanation'),
        0
    ));

    // Default minimum words
    $settings->add(new admin_setting_configtext(
        'qbehaviour_selfexplanation/default_min_words',
        get_string('default_min_words', 'qbehaviour_selfexplanation'),
        get_string('default_min_words_desc', 'qbehaviour_selfexplanation'),
        20,
        PARAM_INT
    ));

    // Default minimum characters
    $settings->add(new admin_setting_configtext(
        'qbehaviour_selfexplanation/default_min_chars',
        get_string('default_min_chars', 'qbehaviour_selfexplanation'),
        get_string('default_min_chars_desc', 'qbehaviour_selfexplanation'),
        50,
        PARAM_INT
    ));

    // AI Analysis section
    $settings->add(new admin_setting_heading(
        'qbehaviour_selfexplanation/ai_heading',
        get_string('ai_settings', 'qbehaviour_selfexplanation'),
        get_string('ai_settings_desc', 'qbehaviour_selfexplanation')
    ));

    // Enable AI analysis
    $settings->add(new admin_setting_configcheckbox(
        'qbehaviour_selfexplanation/enable_ai_analysis',
        get_string('enable_ai_analysis', 'qbehaviour_selfexplanation'),
        get_string('enable_ai_analysis_desc', 'qbehaviour_selfexplanation'),
        0
    ));

    // Claude API key
    $settings->add(new admin_setting_configtext(
        'qbehaviour_selfexplanation/claude_api_key',
        get_string('claude_api_key', 'qbehaviour_selfexplanation'),
        get_string('claude_api_key_desc', 'qbehaviour_selfexplanation'),
        '',
        PARAM_TEXT,
        60
    ));
}
