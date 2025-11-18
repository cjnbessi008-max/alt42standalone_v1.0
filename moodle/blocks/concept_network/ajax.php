<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/blocks/concept_network/classes/network_generator.php');
require_once($CFG->dirroot . '/blocks/concept_network/classes/concept_extractor.php');

// Get parameters
$action = required_param('action', PARAM_ALPHA);
$courseid = required_param('courseid', PARAM_INT);
$studentid = optional_param('studentid', $USER->id, PARAM_INT);

// Verify session
require_sesskey();
require_login($courseid);

$context = context_course::instance($courseid);

// Check capabilities
$canview = has_capability('block/concept_network:view', $context);
$canviewall = has_capability('block/concept_network:viewall', $context);
$canmanage = has_capability('block/concept_network:manage', $context);

// Students can only view their own network
if (!$canviewall && $studentid != $USER->id) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array('error' => get_string('error_nocapability', 'block_concept_network')));
    exit;
}

/**
 * Handle AJAX requests
 */
switch ($action) {
    case 'get_network':
        handle_get_network($courseid, $studentid);
        break;

    case 'regenerate_network':
        handle_regenerate_network($courseid, $studentid, $canviewall || $canmanage);
        break;

    case 'get_concept_progress':
        $conceptname = required_param('conceptname', PARAM_TEXT);
        handle_get_concept_progress($courseid, $studentid, $conceptname);
        break;

    case 'update_mapping':
        $activityid = required_param('activityid', PARAM_INT);
        $activitytype = required_param('activitytype', PARAM_ALPHA);
        $conceptname = required_param('conceptname', PARAM_TEXT);
        $weight = optional_param('weight', 1.0, PARAM_FLOAT);
        handle_update_mapping($courseid, $activityid, $activitytype, $conceptname, $weight, $canmanage);
        break;

    case 'delete_mapping':
        $mappingid = required_param('mappingid', PARAM_INT);
        handle_delete_mapping($mappingid, $canmanage);
        break;

    default:
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(array('error' => 'Invalid action'));
        exit;
}

/**
 * Get concept network for student
 */
function handle_get_network($courseid, $studentid) {
    $generator = new \block_concept_network\network_generator($courseid, $studentid);
    $network = $generator->get_or_generate_network();

    header('Content-Type: application/json');
    echo json_encode($network);
}

/**
 * Regenerate concept network
 */
function handle_regenerate_network($courseid, $studentid, $hasPermission) {
    if (!$hasPermission) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(array('error' => get_string('error_nocapability', 'block_concept_network')));
        return;
    }

    try {
        // Clear cache
        $cache = \cache::make('block_concept_network', 'networks');
        $cachekey = $courseid . '_' . $studentid;
        $cache->delete($cachekey);

        // Generate new network
        $generator = new \block_concept_network\network_generator($courseid, $studentid);
        $network = $generator->generate_network();

        header('Content-Type: application/json');
        echo json_encode(array(
            'success' => true,
            'network' => $network,
            'message' => get_string('regenerate_success', 'block_concept_network')
        ));
    } catch (Exception $e) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(array(
            'success' => false,
            'error' => get_string('error_generationfailed', 'block_concept_network'),
            'details' => $e->getMessage()
        ));
    }
}

/**
 * Get progress for specific concept
 */
function handle_get_concept_progress($courseid, $studentid, $conceptname) {
    global $DB;

    // Get concept node
    $sql = "SELECT cn.*
            FROM {block_concept_nodes} cn
            JOIN {block_concept_network} cnet ON cnet.id = cn.network_id
            WHERE cnet.course_id = :courseid
              AND cnet.student_id = :studentid
              AND cn.concept_name = :conceptname";

    $params = array(
        'courseid' => $courseid,
        'studentid' => $studentid,
        'conceptname' => $conceptname
    );

    $node = $DB->get_record_sql($sql, $params);

    if (!$node) {
        header('HTTP/1.1 404 Not Found');
        echo json_encode(array('error' => 'Concept not found'));
        return;
    }

    // Get detailed progress
    $progress = $DB->get_records('block_student_concept_progress', array(
        'student_id' => $studentid,
        'course_id' => $courseid,
        'concept_node_id' => $node->id
    ), 'timestamp ASC');

    header('Content-Type: application/json');
    echo json_encode(array(
        'concept' => $node,
        'progress' => array_values($progress)
    ));
}

/**
 * Update concept mapping
 */
function handle_update_mapping($courseid, $activityid, $activitytype, $conceptname, $weight, $hasPermission) {
    global $DB;

    if (!$hasPermission) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(array('error' => get_string('error_nocapability', 'block_concept_network')));
        return;
    }

    try {
        $extractor = new \block_concept_network\concept_extractor($courseid);
        $extractor->map_activity_to_concepts($activityid, $activitytype, array($conceptname), $weight, false);

        header('Content-Type: application/json');
        echo json_encode(array(
            'success' => true,
            'message' => get_string('mapping_updated', 'block_concept_network')
        ));
    } catch (Exception $e) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(array(
            'success' => false,
            'error' => $e->getMessage()
        ));
    }
}

/**
 * Delete concept mapping
 */
function handle_delete_mapping($mappingid, $hasPermission) {
    global $DB;

    if (!$hasPermission) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(array('error' => get_string('error_nocapability', 'block_concept_network')));
        return;
    }

    try {
        $DB->delete_records('block_concept_mappings', array('id' => $mappingid));

        header('Content-Type: application/json');
        echo json_encode(array(
            'success' => true,
            'message' => get_string('mapping_deleted', 'block_concept_network')
        ));
    } catch (Exception $e) {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(array(
            'success' => false,
            'error' => $e->getMessage()
        ));
    }
}
