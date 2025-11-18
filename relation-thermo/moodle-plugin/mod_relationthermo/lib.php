<?php
/**
 * Relation Thermo Activity Module - Core Library Functions
 *
 * @package    mod_relationthermo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Add a new relation thermo activity instance
 */
function relationthermo_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    return $DB->insert_record('relationthermo', $data);
}

/**
 * Update an existing relation thermo activity instance
 */
function relationthermo_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('relationthermo', $data);
}

/**
 * Delete a relation thermo activity instance
 */
function relationthermo_delete_instance($id) {
    global $DB;

    if (!$relationthermo = $DB->get_record('relationthermo', array('id' => $id))) {
        return false;
    }

    // Delete all related responses
    $DB->delete_records('relationthermo_responses', array('relationthermo_id' => $id));

    // Delete the instance
    $DB->delete_records('relationthermo', array('id' => $id));

    return true;
}

/**
 * Supported features
 */
function relationthermo_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Get user grade
 */
function relationthermo_get_user_grades($relationthermo, $userid = 0) {
    global $DB;

    $params = array('relationthermo_id' => $relationthermo->id);
    if ($userid) {
        $params['user_id'] = $userid;
    }

    $sql = "SELECT user_id,
                   COUNT(*) as total,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                   AVG(confidence_level) as avg_confidence
            FROM {relationthermo_responses}
            WHERE relationthermo_id = :relationthermo_id";

    if ($userid) {
        $sql .= " AND user_id = :user_id";
    }

    $sql .= " GROUP BY user_id";

    $grades = array();
    $records = $DB->get_records_sql($sql, $params);

    foreach ($records as $record) {
        $grade = new stdClass();
        $grade->userid = $record->user_id;
        $grade->rawgrade = ($record->correct / $record->total) * 100;
        $grades[$record->user_id] = $grade;
    }

    return $grades;
}

/**
 * Update grades in gradebook
 */
function relationthermo_update_grades($relationthermo, $userid = 0) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $grades = relationthermo_get_user_grades($relationthermo, $userid);

    if ($grades) {
        relationthermo_grade_item_update($relationthermo, $grades);
    } else if ($userid && !array_key_exists($userid, $grades)) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        relationthermo_grade_item_update($relationthermo, $grade);
    } else {
        relationthermo_grade_item_update($relationthermo);
    }
}

/**
 * Create/update grade item
 */
function relationthermo_grade_item_update($relationthermo, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = array('itemname' => $relationthermo->name);
    $params['gradetype'] = GRADE_TYPE_VALUE;
    $params['grademax'] = 100;
    $params['grademin'] = 0;

    return grade_update('mod/relationthermo',
                       $relationthermo->course,
                       'mod',
                       'relationthermo',
                       $relationthermo->id,
                       0,
                       $grades,
                       $params);
}
