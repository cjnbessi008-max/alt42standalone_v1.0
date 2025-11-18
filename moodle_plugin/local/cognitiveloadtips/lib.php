<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for Cognitive Load Tips plugin
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Inject cognitive load tips before quiz question if needed
 * This function is called via quiz module hooks
 *
 * @param object $question Question object
 * @param object $quiz Quiz object
 * @return string HTML to inject
 */
function local_cognitiveloadtips_before_question($question, $quiz) {
    global $PAGE, $OUTPUT;

    if (!$question || !$quiz) {
        return '';
    }

    // Check if tips should be shown
    if (!\local_cognitiveloadtips\tip_manager::should_show_tips($quiz->id, $question->id)) {
        return '';
    }

    $settings = \local_cognitiveloadtips\tip_manager::get_quiz_settings($quiz->id);
    $difficulty = \local_cognitiveloadtips\tip_manager::get_question_difficulty($question->id);
    $language = current_language();

    // Get appropriate tips
    $tips = \local_cognitiveloadtips\tip_manager::get_tips_for_difficulty(
        $difficulty,
        $language,
        $settings->random_tip
    );

    if (empty($tips)) {
        return '';
    }

    // Prepare renderer
    $renderer = $PAGE->get_renderer('local_cognitiveloadtips');
    $tipdisplay = new \local_cognitiveloadtips\output\tip_display(
        $tips,
        $settings->allow_skip,
        $question->id,
        $quiz->id,
        $difficulty
    );

    // Include JavaScript
    $PAGE->requires->js_call_amd('local_cognitiveloadtips/tip_display', 'init');

    return $renderer->render($tipdisplay);
}

/**
 * Extend navigation to add admin menu items
 *
 * @param global_navigation $navigation
 */
function local_cognitiveloadtips_extend_navigation(global_navigation $navigation) {
    global $CFG, $PAGE;

    // Add link to admin menu if user has capability
    if (has_capability('local/cognitiveloadtips:manage', context_system::instance())) {
        $node = $navigation->add(
            get_string('pluginname', 'local_cognitiveloadtips'),
            new moodle_url('/local/cognitiveloadtips/index.php'),
            navigation_node::TYPE_CUSTOM,
            null,
            'cognitiveloadtips',
            new pix_icon('i/settings', '')
        );
        $node->showinflatnavigation = true;
    }
}

/**
 * Extend quiz settings form
 * Called via quiz module callback
 *
 * @param object $formwrapper Form wrapper
 * @param object $mform Moodle form
 */
function local_cognitiveloadtips_quiz_form_definition($formwrapper, $mform) {
    global $DB;

    $quiz = $formwrapper->get_current();

    if (!$quiz || !isset($quiz->id)) {
        return; // New quiz, not saved yet
    }

    $context = context_module::instance($quiz->coursemodule);

    if (!has_capability('local/cognitiveloadtips:managequizsettings', $context)) {
        return;
    }

    // Get current settings
    $settings = \local_cognitiveloadtips\tip_manager::get_quiz_settings($quiz->id);

    // Add header
    $mform->addElement('header', 'cognitiveloadtipsheader',
        get_string('cognitive_load_tips', 'local_cognitiveloadtips'));

    // Enabled
    $mform->addElement('advcheckbox', 'clt_enabled',
        get_string('enable_tips', 'local_cognitiveloadtips'),
        get_string('enable_tips_desc', 'local_cognitiveloadtips'));
    $mform->setDefault('clt_enabled', $settings->enabled);

    // Difficulty threshold
    $difficultyoptions = array(
        1 => get_string('difficulty_1', 'local_cognitiveloadtips'),
        2 => get_string('difficulty_2', 'local_cognitiveloadtips'),
        3 => get_string('difficulty_3', 'local_cognitiveloadtips'),
        4 => get_string('difficulty_4', 'local_cognitiveloadtips'),
        5 => get_string('difficulty_5', 'local_cognitiveloadtips'),
    );
    $mform->addElement('select', 'clt_show_before_difficulty',
        get_string('show_before_difficulty', 'local_cognitiveloadtips'),
        $difficultyoptions);
    $mform->setDefault('clt_show_before_difficulty', $settings->show_before_difficulty);
    $mform->addHelpButton('clt_show_before_difficulty', 'show_before_difficulty', 'local_cognitiveloadtips');
    $mform->disabledIf('clt_show_before_difficulty', 'clt_enabled');

    // Random tip
    $mform->addElement('advcheckbox', 'clt_random_tip',
        get_string('random_tip', 'local_cognitiveloadtips'),
        get_string('random_tip_desc', 'local_cognitiveloadtips'));
    $mform->setDefault('clt_random_tip', $settings->random_tip);
    $mform->disabledIf('clt_random_tip', 'clt_enabled');

    // Allow skip
    $mform->addElement('advcheckbox', 'clt_allow_skip',
        get_string('allow_skip', 'local_cognitiveloadtips'),
        get_string('allow_skip_desc', 'local_cognitiveloadtips'));
    $mform->setDefault('clt_allow_skip', $settings->allow_skip);
    $mform->disabledIf('clt_allow_skip', 'clt_enabled');
}

/**
 * Save quiz settings
 * Called after quiz settings are saved
 *
 * @param object $quiz Quiz object
 * @param object $data Form data
 */
function local_cognitiveloadtips_quiz_update($quiz, $data) {
    if (!isset($data->clt_enabled)) {
        return;
    }

    $settings = new stdClass();
    $settings->enabled = isset($data->clt_enabled) ? 1 : 0;
    $settings->show_before_difficulty = isset($data->clt_show_before_difficulty) ?
        (int)$data->clt_show_before_difficulty : 4;
    $settings->random_tip = isset($data->clt_random_tip) ? 1 : 0;
    $settings->allow_skip = isset($data->clt_allow_skip) ? 1 : 0;

    \local_cognitiveloadtips\tip_manager::save_quiz_settings($quiz->id, $settings);
}
