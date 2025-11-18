<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX endpoint to save user preferences
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/asmr/classes/user_preference.php');

require_login();
require_sesskey();

$key = required_param('key', PARAM_ALPHANUMEXT);
$value = required_param('value', PARAM_RAW);

try {
    // Validate preference key
    $allowed_keys = array(
        \local_asmr\user_preference::PREF_VOLUME,
        \local_asmr\user_preference::PREF_AUTO_PLAY,
        \local_asmr\user_preference::PREF_LOOP,
        \local_asmr\user_preference::PREF_SHUFFLE,
        \local_asmr\user_preference::PREF_FAVORITES,
        \local_asmr\user_preference::PREF_LAST_PLAYED
    );

    if (!in_array($key, $allowed_keys)) {
        throw new moodle_exception('Invalid preference key');
    }

    // Decode JSON value if applicable
    $decoded_value = json_decode($value, true);
    $final_value = $decoded_value !== null ? $decoded_value : $value;

    // Validate value based on key
    switch ($key) {
        case \local_asmr\user_preference::PREF_VOLUME:
            if ($final_value < 0 || $final_value > 100) {
                throw new moodle_exception('Volume must be between 0 and 100');
            }
            break;

        case \local_asmr\user_preference::PREF_AUTO_PLAY:
        case \local_asmr\user_preference::PREF_LOOP:
        case \local_asmr\user_preference::PREF_SHUFFLE:
            $final_value = (bool)$final_value;
            break;
    }

    // Save preference
    $success = \local_asmr\user_preference::set($USER->id, $key, $final_value);

    if ($success) {
        echo json_encode(array(
            'success' => true,
            'message' => get_string('preference_saved', 'local_asmr')
        ));
    } else {
        throw new moodle_exception('Failed to save preference');
    }

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
