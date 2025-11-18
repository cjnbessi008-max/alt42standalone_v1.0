<?php
// This file is part of Moodle - http://moodle.org/

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/classes/recommendation_engine.php');

use block_chancemood\recommendation_engine;

// Require login
require_login();

// Get parameters
$action = required_param('action', PARAM_ALPHA);
$courseid = required_param('courseid', PARAM_INT);
$userid = optional_param('userid', $USER->id, PARAM_INT);

// Set up the page
$PAGE->set_context(context_course::instance($courseid));

// Check capability
require_capability('block/chancemood:viewmood', context_course::instance($courseid));

// Set JSON header
header('Content-Type: application/json');

try {
    $response = array('success' => true);

    switch ($action) {
        case 'get_recommendations':
            $response['data'] = get_student_recommendations($userid, $courseid);
            break;

        case 'generate_recommendations':
            $response['data'] = generate_new_recommendations($userid, $courseid);
            break;

        case 'get_class_recommendations':
            // Only teachers can view class recommendations
            require_capability('moodle/course:manageactivities', context_course::instance($courseid));
            $response['data'] = recommendation_engine::get_class_recommendations($courseid);
            break;

        case 'mark_resource_viewed':
            $resourceid = required_param('resourceid', PARAM_INT);
            mark_resource_viewed($userid, $courseid, $resourceid);
            $response['message'] = 'Resource marked as viewed';
            break;

        case 'update_progress':
            $problemtype = required_param('problemtype', PARAM_TEXT);
            $completed = required_param('completed', PARAM_INT);
            update_student_progress($userid, $courseid, $problemtype, $completed);
            $response['message'] = 'Progress updated';
            break;

        default:
            throw new moodle_exception('invalidaction', 'block_chancemood');
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

/**
 * Get stored recommendations for a student
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return array Recommendation data
 */
function get_student_recommendations($userid, $courseid) {
    $recommendations = recommendation_engine::get_recommendations($userid, $courseid);

    if (!$recommendations) {
        // Generate new recommendations if none exist
        return generate_new_recommendations($userid, $courseid);
    }

    // Check if recommendations are stale (older than 1 day)
    if (time() - $recommendations->timemodified > 86400) {
        return generate_new_recommendations($userid, $courseid);
    }

    return format_recommendations($recommendations);
}

/**
 * Generate new recommendations for a student
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return array Recommendation data
 */
function generate_new_recommendations($userid, $courseid) {
    // Get mood data first (simplified version)
    $mood_data = array(
        'overall_mood' => 'challenge',
        'avg_success_rate' => 0.55
    );

    // Generate recommendations
    $recommendations = recommendation_engine::generate_recommendations(
        $userid,
        $courseid,
        $mood_data
    );

    return format_recommendations($recommendations);
}

/**
 * Format recommendations for JSON response
 *
 * @param object $recommendations Recommendation object
 * @return array Formatted data
 */
function format_recommendations($recommendations) {
    return array(
        'priority' => $recommendations->priority,
        'message' => $recommendations->message,
        'weak_areas' => is_array($recommendations->weak_areas) ?
            $recommendations->weak_areas : json_decode($recommendations->weak_areas, true),
        'problems' => is_array($recommendations->problems) ?
            $recommendations->problems : json_decode($recommendations->recommended_problems, true),
        'study_path' => is_array($recommendations->study_path) ?
            $recommendations->study_path : json_decode($recommendations->study_path, true),
        'timestamp' => isset($recommendations->timemodified) ?
            $recommendations->timemodified : time()
    );
}

/**
 * Mark a resource as viewed
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @param int $resourceid Resource ID
 */
function mark_resource_viewed($userid, $courseid, $resourceid) {
    global $DB;

    $rec = $DB->get_record('block_chancemood_recommend', array(
        'userid' => $userid,
        'courseid' => $courseid
    ));

    if ($rec) {
        $progress = $DB->get_record('block_chancemood_progress', array(
            'userid' => $userid,
            'courseid' => $courseid,
            'recommendid' => $rec->id
        ));

        if ($progress) {
            $progress->resources_viewed++;
            $progress->timemodified = time();
            $DB->update_record('block_chancemood_progress', $progress);
        } else {
            $progress = new stdClass();
            $progress->userid = $userid;
            $progress->courseid = $courseid;
            $progress->recommendid = $rec->id;
            $progress->problem_type = 'general';
            $progress->resources_viewed = 1;
            $progress->timecreated = time();
            $progress->timemodified = time();
            $DB->insert_record('block_chancemood_progress', $progress);
        }
    }
}

/**
 * Update student progress on recommendations
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @param string $problemtype Problem type
 * @param int $completed Number completed
 */
function update_student_progress($userid, $courseid, $problemtype, $completed) {
    global $DB;

    $rec = $DB->get_record('block_chancemood_recommend', array(
        'userid' => $userid,
        'courseid' => $courseid
    ));

    if ($rec) {
        $progress = $DB->get_record('block_chancemood_progress', array(
            'userid' => $userid,
            'courseid' => $courseid,
            'recommendid' => $rec->id,
            'problem_type' => $problemtype
        ));

        if ($progress) {
            $progress->completed_problems = $completed;
            $progress->last_practice = time();
            $progress->timemodified = time();
            $DB->update_record('block_chancemood_progress', $progress);
        } else {
            $progress = new stdClass();
            $progress->userid = $userid;
            $progress->courseid = $courseid;
            $progress->recommendid = $rec->id;
            $progress->problem_type = $problemtype;
            $progress->completed_problems = $completed;
            $progress->last_practice = time();
            $progress->timecreated = time();
            $progress->timemodified = time();
            $DB->insert_record('block_chancemood_progress', $progress);
        }
    }
}
