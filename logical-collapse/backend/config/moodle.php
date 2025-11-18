<?php
/**
 * Moodle LMS configuration
 */

function getMoodleConfig() {
    return [
        'url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',
        'token' => getenv('MOODLE_TOKEN') ?: '',
        'version' => '3.7',
        'services' => [
            'quiz' => 'mod_quiz',
            'user' => 'core_user',
            'grades' => 'core_grades'
        ]
    ];
}
