<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Hook into quiz attempt started event
 *
 * @param \core\event\base $event
 */
function local_meditation_routine_before_footer() {
    global $PAGE, $USER;

    // Only inject on quiz attempt pages
    if ($PAGE->pagetype === 'mod-quiz-attempt') {
        $quizid = optional_param('id', 0, PARAM_INT);
        $attemptid = optional_param('attempt', 0, PARAM_INT);

        if ($quizid && $attemptid) {
            // Get meditation settings
            $settings = \local_meditation_routine\meditation_manager::should_show_meditation(
                $quizid,
                $USER->id,
                $attemptid
            );

            if ($settings) {
                // Inject JavaScript module
                $PAGE->requires->js_call_amd(
                    'local_meditation_routine/meditation_routine',
                    'init',
                    [
                        $quizid,
                        $attemptid,
                        $USER->id,
                        $settings
                    ]
                );

                // Include CSS
                $PAGE->requires->css('/local/meditation_routine/styles.css');
            }
        }
    }
}

/**
 * Add meditation routine settings to quiz settings form
 *
 * @param moodleform $formwrapper
 * @param MoodleQuickForm $mform
 */
function local_meditation_routine_coursemodule_standard_elements($formwrapper, $mform) {
    global $DB;

    if ($formwrapper->get_current()->modulename !== 'quiz') {
        return;
    }

    $quizid = $formwrapper->get_current()->instance;

    if (!$quizid) {
        return;
    }

    // Add meditation settings section
    $mform->addElement('header', 'meditation_routine_header', get_string('meditation_routine', 'local_meditation_routine'));

    // Enable meditation
    $mform->addElement(
        'advcheckbox',
        'meditation_enabled',
        get_string('enable_meditation', 'local_meditation_routine'),
        get_string('enable_meditation_desc', 'local_meditation_routine')
    );
    $mform->setType('meditation_enabled', PARAM_INT);

    // Complexity threshold
    $options = [1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5];
    $mform->addElement(
        'select',
        'meditation_complexity_threshold',
        get_string('complexity_threshold', 'local_meditation_routine'),
        $options
    );
    $mform->setDefault('meditation_complexity_threshold', 4);
    $mform->disabledIf('meditation_complexity_threshold', 'meditation_enabled');

    // Duration
    $duration_options = [3 => '3s', 5 => '5s', 7 => '7s', 10 => '10s'];
    $mform->addElement(
        'select',
        'meditation_duration',
        get_string('meditation_duration', 'local_meditation_routine'),
        $duration_options
    );
    $mform->setDefault('meditation_duration', 5);
    $mform->disabledIf('meditation_duration', 'meditation_enabled');

    // Animation style
    $style_options = [
        'breathing' => get_string('style_breathing', 'local_meditation_routine'),
        'pulse' => get_string('style_pulse', 'local_meditation_routine'),
        'ripple' => get_string('style_ripple', 'local_meditation_routine'),
    ];
    $mform->addElement(
        'select',
        'meditation_animation_style',
        get_string('animation_style', 'local_meditation_routine'),
        $style_options
    );
    $mform->setDefault('meditation_animation_style', 'breathing');
    $mform->disabledIf('meditation_animation_style', 'meditation_enabled');

    // Load existing settings
    $settings = $DB->get_record('local_meditation_settings', ['quizid' => $quizid]);
    if ($settings) {
        $mform->setDefault('meditation_enabled', $settings->enabled);
        $mform->setDefault('meditation_complexity_threshold', $settings->complexity_threshold);
        $mform->setDefault('meditation_duration', $settings->duration);
        $mform->setDefault('meditation_animation_style', $settings->animation_style);
    }
}

/**
 * Save meditation routine settings when quiz is saved
 *
 * @param stdClass $data
 * @param stdClass $course
 */
function local_meditation_routine_coursemodule_edit_post_actions($data, $course) {
    if ($data->modulename !== 'quiz') {
        return $data;
    }

    if (!isset($data->instance)) {
        return $data;
    }

    // Save meditation settings
    $settings = [
        'enabled' => isset($data->meditation_enabled) ? $data->meditation_enabled : 0,
        'complexity_threshold' => isset($data->meditation_complexity_threshold) ? $data->meditation_complexity_threshold : 4,
        'duration' => isset($data->meditation_duration) ? $data->meditation_duration : 5,
        'animation_style' => isset($data->meditation_animation_style) ? $data->meditation_animation_style : 'breathing',
    ];

    \local_meditation_routine\meditation_manager::update_quiz_settings($data->instance, $settings);

    return $data;
}

/**
 * Extend navigation to add meditation statistics
 *
 * @param global_navigation $navigation
 */
function local_meditation_routine_extend_navigation(global_navigation $navigation) {
    global $USER, $PAGE;

    if (isloggedin() && !isguestuser()) {
        $stats = \local_meditation_routine\meditation_manager::get_user_statistics($USER->id);

        if ($stats['total_sessions'] > 0) {
            // Add statistics to user profile
            $node = $navigation->find('myprofile', navigation_node::TYPE_ROOTNODE);
            if ($node) {
                $url = new moodle_url('/local/meditation_routine/mystats.php');
                $node->add(
                    get_string('meditation_stats', 'local_meditation_routine'),
                    $url,
                    navigation_node::TYPE_CUSTOM,
                    null,
                    'meditation_stats'
                );
            }
        }
    }
}
