<?php
/**
 * Moodle Configuration
 * Moodle 3.7 Web Services connection settings
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app');

// Moodle Web Services functions
define('MOODLE_WS_GET_QUESTIONS', 'core_question_get_random_question_summaries');
define('MOODLE_WS_GET_USER', 'core_user_get_users_by_field');
define('MOODLE_WS_UPDATE_GRADES', 'core_grades_update_grades');

/**
 * Moodle API Configuration
 */
class MoodleConfig {
    public static function getApiEndpoint() {
        return MOODLE_URL . '/webservice/rest/server.php';
    }

    public static function getToken() {
        return MOODLE_TOKEN;
    }

    public static function getDefaultParams() {
        return [
            'wstoken' => self::getToken(),
            'moodlewsrestformat' => 'json'
        ];
    }
}
