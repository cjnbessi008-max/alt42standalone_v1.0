<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX endpoint to get sounds
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/asmr/classes/sound_manager.php');

require_login();
require_capability('local/asmr:view', context_system::instance());

$category = optional_param('category', null, PARAM_ALPHA);
$subcategory = optional_param('subcategory', null, PARAM_ALPHANUMEXT);
$limit = optional_param('limit', 50, PARAM_INT);
$offset = optional_param('offset', 0, PARAM_INT);
$search = optional_param('search', '', PARAM_TEXT);

try {
    if (!empty($search)) {
        // Search sounds
        $sounds = \local_asmr\sound_manager::search_sounds($search, $limit);
        $total = count($sounds);
    } else {
        // Get sounds by category
        $sounds = \local_asmr\sound_manager::get_sounds($category, $subcategory, $limit, $offset);
        $total = count($sounds); // In production, would need separate count query
    }

    // Convert sound objects to array with URLs
    $result = array();
    foreach ($sounds as $sound) {
        $sounddata = array(
            'id' => $sound->id,
            'name' => $sound->name,
            'category' => $sound->category,
            'subcategory' => $sound->subcategory,
            'duration' => $sound->duration,
            'description' => $sound->description,
            'rating' => $sound->rating,
            'playcount' => $sound->playcount,
            'url' => \local_asmr\sound_manager::get_sound_url($sound)->out(false)
        );

        // Parse tags if JSON
        if (!empty($sound->tags)) {
            $tags = json_decode($sound->tags);
            $sounddata['tags'] = $tags ? $tags : array();
        } else {
            $sounddata['tags'] = array();
        }

        $result[] = $sounddata;
    }

    echo json_encode(array(
        'success' => true,
        'sounds' => $result,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ));

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
