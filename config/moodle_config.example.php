<?php
/**
 * Moodle Configuration - EXAMPLE FILE
 * Copy this file to moodle_config.php and update with your settings
 */

define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token_here');
define('MOODLE_SERVICE', 'moodle_mobile_app');

class MoodleConfig {
    public static function getWebServiceUrl() {
        return MOODLE_URL . '/webservice/rest/server.php';
    }

    public static function getRequestParams($function, $params = []) {
        $baseParams = [
            'wstoken' => MOODLE_TOKEN,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        return array_merge($baseParams, $params);
    }
}
