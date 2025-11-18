<?php
/**
 * Library of interface functions and constants for Blossom Sequence module
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Return supported features
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function blossomsequence_supports($feature) {
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
 * Saves a new instance of the blossomsequence into the database
 *
 * @param stdClass $blossomsequence An object from the form
 * @param mod_blossomsequence_mod_form $mform The form
 * @return int The id of the newly inserted blossomsequence record
 */
function blossomsequence_add_instance(stdClass $blossomsequence, mod_blossomsequence_mod_form $mform = null) {
    global $DB;

    $blossomsequence->timecreated = time();
    $blossomsequence->timemodified = time();

    $blossomsequence->id = $DB->insert_record('blossomsequence', $blossomsequence);

    blossomsequence_grade_item_update($blossomsequence);

    return $blossomsequence->id;
}

/**
 * Updates an instance of the blossomsequence in the database
 *
 * @param stdClass $blossomsequence An object from the form
 * @param mod_blossomsequence_mod_form $mform The form
 * @return boolean Success/Fail
 */
function blossomsequence_update_instance(stdClass $blossomsequence, mod_blossomsequence_mod_form $mform = null) {
    global $DB;

    $blossomsequence->timemodified = time();
    $blossomsequence->id = $blossomsequence->instance;

    $result = $DB->update_record('blossomsequence', $blossomsequence);

    blossomsequence_grade_item_update($blossomsequence);

    return $result;
}

/**
 * Removes an instance of the blossomsequence from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function blossomsequence_delete_instance($id) {
    global $DB;

    if (!$blossomsequence = $DB->get_record('blossomsequence', array('id' => $id))) {
        return false;
    }

    // Delete any dependent records
    $DB->delete_records('blossomsequence_attempts', array('blossomsequenceid' => $blossomsequence->id));

    // Delete the instance
    $DB->delete_records('blossomsequence', array('id' => $blossomsequence->id));

    blossomsequence_grade_item_delete($blossomsequence);

    return true;
}

/**
 * Create/update grade item for given blossomsequence
 *
 * @param stdClass $blossomsequence object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function blossomsequence_grade_item_update($blossomsequence, $grades=null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $params = array('itemname' => $blossomsequence->name);
    $params['gradetype'] = GRADE_TYPE_VALUE;
    $params['grademax']  = 100;
    $params['grademin']  = 0;

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/blossomsequence', $blossomsequence->course, 'mod', 'blossomsequence',
                        $blossomsequence->id, 0, $grades, $params);
}

/**
 * Delete grade item for given blossomsequence
 *
 * @param stdClass $blossomsequence object
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, GRADE_UPDATE_MULTIPLE or GRADE_UPDATE_ITEM_LOCKED
 */
function blossomsequence_grade_item_delete($blossomsequence) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/blossomsequence', $blossomsequence->course, 'mod', 'blossomsequence',
                        $blossomsequence->id, 0, null, array('deleted' => 1));
}

/**
 * Return a list of page types
 *
 * @param string $pagetype current page type
 * @param stdClass $parentcontext Block's parent context
 * @param stdClass $currentcontext Current context of block
 * @return array
 */
function blossomsequence_page_type_list($pagetype, $parentcontext, $currentcontext) {
    $module_pagetype = array('mod-blossomsequence-*'=>get_string('page-mod-blossomsequence-x', 'blossomsequence'));
    return $module_pagetype;
}

/**
 * Generate a sequence based on type
 *
 * @param string $type Type of sequence
 * @param int $count Number of elements
 * @param array $params Additional parameters
 * @return array The generated sequence
 */
function blossomsequence_generate_sequence($type, $count = 8, $params = array()) {
    $sequence = array();

    switch($type) {
        case 'fibonacci':
            $sequence = array(1, 1);
            for ($i = 2; $i < $count; $i++) {
                $sequence[$i] = $sequence[$i-1] + $sequence[$i-2];
            }
            break;

        case 'arithmetic':
            $start = isset($params['start']) ? $params['start'] : 1;
            $step = isset($params['step']) ? $params['step'] : 2;
            for ($i = 0; $i < $count; $i++) {
                $sequence[$i] = $start + ($i * $step);
            }
            break;

        case 'geometric':
            $start = isset($params['start']) ? $params['start'] : 2;
            $ratio = isset($params['ratio']) ? $params['ratio'] : 2;
            for ($i = 0; $i < $count; $i++) {
                $sequence[$i] = $start * pow($ratio, $i);
            }
            break;

        case 'square':
            for ($i = 1; $i <= $count; $i++) {
                $sequence[$i-1] = $i * $i;
            }
            break;

        case 'prime':
            $primes = array(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53);
            $sequence = array_slice($primes, 0, $count);
            break;

        default:
            // Custom sequence from JSON
            if (isset($params['custom'])) {
                $sequence = json_decode($params['custom'], true);
            }
            break;
    }

    return $sequence;
}
