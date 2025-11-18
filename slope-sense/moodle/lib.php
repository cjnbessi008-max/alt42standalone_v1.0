<?php
/**
 * Slope Sense - Moodle Plugin Library Functions
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Add slope sense instance
 */
function slopesense_add_instance($slopesense) {
    global $DB;

    $slopesense->timecreated = time();
    $slopesense->timemodified = time();

    return $DB->insert_record('slopesense', $slopesense);
}

/**
 * Update slope sense instance
 */
function slopesense_update_instance($slopesense) {
    global $DB;

    $slopesense->timemodified = time();
    $slopesense->id = $slopesense->instance;

    return $DB->update_record('slopesense', $slopesense);
}

/**
 * Delete slope sense instance
 */
function slopesense_delete_instance($id) {
    global $DB;

    if (!$slopesense = $DB->get_record('slopesense', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('slopesense', array('id' => $id));

    return true;
}

/**
 * Return the list if Moodle features this module supports
 */
function slopesense_supports($feature) {
    switch ($feature) {
        case FEATURE_GROUPS:
            return true;
        case FEATURE_GROUPINGS:
            return true;
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_COMPLETION_HAS_RULES:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;

        default:
            return null;
    }
}

/**
 * Get slope sense instance from course module
 */
function slopesense_get_coursemodule_info($coursemodule) {
    global $DB;

    $slopesense = $DB->get_record('slopesense', array('id' => $coursemodule->instance), '*', MUST_EXIST);

    $info = new cached_cm_info();
    $info->name = $slopesense->name;

    if ($coursemodule->showdescription) {
        $info->content = format_module_intro('slopesense', $slopesense, $coursemodule->id, false);
    }

    return $info;
}

/**
 * Update grades
 */
function slopesense_update_grades($slopesense, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($grades = slopesense_get_user_grades($slopesense, $userid)) {
        slopesense_grade_item_update($slopesense, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        slopesense_grade_item_update($slopesense, $grade);
    } else {
        slopesense_grade_item_update($slopesense);
    }
}

/**
 * Get user grades
 */
function slopesense_get_user_grades($slopesense, $userid = 0) {
    global $DB;

    $params = array('slopesense_id' => $slopesense->id);
    if ($userid) {
        $params['userid'] = $userid;
    }

    $sql = "SELECT userid, AVG(is_correct * 100) as rawgrade
            FROM {slopesense_attempts}
            WHERE slopesense_id = :slopesense_id";

    if ($userid) {
        $sql .= " AND userid = :userid";
    }

    $sql .= " GROUP BY userid";

    return $DB->get_records_sql($sql, $params);
}

/**
 * Create or update grade item
 */
function slopesense_grade_item_update($slopesense, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = array('itemname' => $slopesense->name);

    if ($slopesense->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = $slopesense->grade;
        $params['grademin'] = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/slopesense', $slopesense->course, 'mod', 'slopesense',
                       $slopesense->id, 0, $grades, $params);
}
