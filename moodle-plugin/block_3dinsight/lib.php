<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Get all active problems for a course
 * @param int $courseid
 * @return array
 */
function block_3dinsight_get_problems($courseid) {
    global $DB;

    $problems = $DB->get_records('block_3dinsight_problems',
        ['courseid' => $courseid, 'active' => 1],
        'timecreated DESC'
    );

    $result = [];
    foreach ($problems as $problem) {
        $result[] = [
            'id' => $problem->id,
            'title' => $problem->title,
            'description' => $problem->description,
            'geometry_type' => $problem->geometry_type,
            'geometry_data' => json_decode($problem->geometry_data, true),
            'difficulty' => $problem->difficulty,
            'created_at' => $problem->timecreated
        ];
    }

    return $result;
}

/**
 * Get a specific problem by ID
 * @param int $problemid
 * @return object
 */
function block_3dinsight_get_problem($problemid) {
    global $DB;

    $problem = $DB->get_record('block_3dinsight_problems', ['id' => $problemid], '*', MUST_EXIST);

    return [
        'id' => $problem->id,
        'title' => $problem->title,
        'description' => $problem->description,
        'geometry_type' => $problem->geometry_type,
        'geometry_data' => json_decode($problem->geometry_data, true),
        'difficulty' => $problem->difficulty,
        'created_at' => $problem->timecreated
    ];
}

/**
 * Get configuration for a course
 * @param int $courseid
 * @return object
 */
function block_3dinsight_get_config($courseid) {
    global $DB;

    $config = $DB->get_record('block_3dinsight_config', ['courseid' => $courseid]);

    if (!$config) {
        // Return default config
        return [
            'enable_rotation' => true,
            'enable_smartphone_view' => true,
            'default_camera_angle' => 'isometric',
            'smartphone_position' => 'bottom-right'
        ];
    }

    return [
        'enable_rotation' => (bool)$config->enable_rotation,
        'enable_smartphone_view' => (bool)$config->enable_smartphone_view,
        'default_camera_angle' => $config->default_camera_angle,
        'smartphone_position' => $config->smartphone_position
    ];
}

/**
 * Create or update configuration for a course
 * @param int $courseid
 * @param object $configdata
 * @return int
 */
function block_3dinsight_save_config($courseid, $configdata) {
    global $DB;

    $existing = $DB->get_record('block_3dinsight_config', ['courseid' => $courseid]);

    if ($existing) {
        $existing->enable_rotation = $configdata->enable_rotation;
        $existing->enable_smartphone_view = $configdata->enable_smartphone_view;
        $existing->default_camera_angle = $configdata->default_camera_angle;
        $existing->smartphone_position = $configdata->smartphone_position;
        $existing->timemodified = time();
        $DB->update_record('block_3dinsight_config', $existing);
        return $existing->id;
    } else {
        $config = new stdClass();
        $config->courseid = $courseid;
        $config->enable_rotation = $configdata->enable_rotation;
        $config->enable_smartphone_view = $configdata->enable_smartphone_view;
        $config->default_camera_angle = $configdata->default_camera_angle;
        $config->smartphone_position = $configdata->smartphone_position;
        $config->timecreated = time();
        $config->timemodified = time();
        return $DB->insert_record('block_3dinsight_config', $config);
    }
}

/**
 * Get student attempts for a problem
 * @param int $problemid
 * @param int $userid
 * @return array
 */
function block_3dinsight_get_attempts($problemid, $userid = null) {
    global $DB, $USER;

    $userid = $userid ?? $USER->id;

    $attempts = $DB->get_records('block_3dinsight_attempts',
        ['problemid' => $problemid, 'userid' => $userid],
        'timecreated DESC'
    );

    $result = [];
    foreach ($attempts as $attempt) {
        $result[] = [
            'id' => $attempt->id,
            'answer_data' => json_decode($attempt->answer_data, true),
            'rotation_count' => $attempt->rotation_count,
            'time_spent' => $attempt->time_spent,
            'score' => $attempt->score,
            'completed' => (bool)$attempt->completed,
            'created_at' => $attempt->timecreated
        ];
    }

    return $result;
}
