<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX endpoint to update sound rating
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/asmr/classes/sound_manager.php');

require_login();
require_sesskey();

$soundid = required_param('soundid', PARAM_INT);
$rating = required_param('rating', PARAM_FLOAT);

try {
    // Validate rating
    if ($rating < 0 || $rating > 5) {
        throw new moodle_exception('Rating must be between 0 and 5');
    }

    // Update rating
    $success = \local_asmr\sound_manager::update_rating($soundid, $rating);

    if ($success) {
        echo json_encode(array(
            'success' => true,
            'rating' => $rating
        ));
    } else {
        throw new moodle_exception('Failed to update rating');
    }

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
