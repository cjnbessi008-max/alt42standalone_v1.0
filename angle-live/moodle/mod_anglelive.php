<?php
/**
 * Angle Live - Moodle Activity Module
 * Moodle 3.7 Compatible
 *
 * This file integrates Angle Live with Moodle LMS
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');
require_once($CFG->libdir . '/gradelib.php');

/**
 * Angle Live Module - Main Class
 */
class mod_anglelive {
    /**
     * Get module information
     */
    public static function get_module_info($cm, $course, $mod) {
        global $CFG, $DB;

        $info = new cached_cm_info();
        $info->name = $mod->name;

        // Get instance
        $anglelive = $DB->get_record('anglelive', array('id' => $cm->instance), '*', MUST_EXIST);

        // Set content
        $info->content = self::get_page_content($anglelive, $cm, $course);

        return $info;
    }

    /**
     * Get page content for Moodle
     */
    private static function get_page_content($anglelive, $cm, $course) {
        global $CFG, $USER;

        $content = '';

        // Build iframe URL with Moodle parameters
        $iframe_url = $CFG->wwwroot . '/mod/anglelive/view.php';
        $iframe_url .= '?id=' . $cm->id;
        $iframe_url .= '&course_id=' . $course->id;
        $iframe_url .= '&user_id=' . $USER->id;

        // Create iframe embed
        $content .= '<div class="anglelive-container">';
        $content .= '<iframe src="' . $iframe_url . '" ';
        $content .= 'width="100%" height="800px" frameborder="0" ';
        $content .= 'allowfullscreen></iframe>';
        $content .= '</div>';

        return $content;
    }

    /**
     * Update grades in Moodle gradebook
     */
    public static function update_grades($anglelive, $userid = 0) {
        global $CFG, $DB;

        require_once($CFG->libdir . '/gradelib.php');

        if ($anglelive->grade == 0) {
            return true;
        }

        $grades = self::get_user_grades($anglelive, $userid);

        if (empty($grades)) {
            return grade_update('mod/anglelive',
                $anglelive->course,
                'mod',
                'anglelive',
                $anglelive->id,
                0,
                null,
                array('deleted' => 1)
            );
        } else {
            return grade_update('mod/anglelive',
                $anglelive->course,
                'mod',
                'anglelive',
                $anglelive->id,
                0,
                $grades
            );
        }
    }

    /**
     * Get user grades from Angle Live database
     */
    private static function get_user_grades($anglelive, $userid = 0) {
        global $CFG;

        require_once($CFG->dirroot . '/mod/anglelive/locallib.php');

        $grades = array();

        // Connect to Angle Live database
        $anglelive_db = anglelive_get_database();

        if (!$anglelive_db) {
            return $grades;
        }

        // Build query
        $sql = "SELECT
                    mi.moodle_user_id as userid,
                    mi.grade as rawgrade,
                    up.completion_percentage as percentage
                FROM moodle_integration mi
                INNER JOIN user_progress up ON mi.angle_live_user_id = up.user_id
                WHERE mi.moodle_course_id = ?";

        $params = array($anglelive->course);

        if ($userid) {
            $sql .= " AND mi.moodle_user_id = ?";
            $params[] = $userid;
        }

        $stmt = $anglelive_db->prepare($sql);
        if (!$stmt) {
            return $grades;
        }

        $stmt->bind_param(str_repeat('i', count($params)), ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $grade = new stdClass();
            $grade->userid = $row['userid'];
            $grade->rawgrade = $row['rawgrade'];
            $grade->dategraded = time();
            $grade->datesubmitted = time();

            $grades[$row['userid']] = $grade;
        }

        $stmt->close();
        $anglelive_db->close();

        return $grades;
    }

    /**
     * Sync grades from Angle Live to Moodle
     */
    public static function sync_grades($course_id, $user_id = null) {
        global $DB;

        // Get all Angle Live activities in course
        $sql = "SELECT al.*, cm.id as cmid
                FROM {anglelive} al
                INNER JOIN {course_modules} cm ON cm.instance = al.id
                INNER JOIN {modules} m ON m.id = cm.module
                WHERE al.course = ? AND m.name = 'anglelive'";

        $activities = $DB->get_records_sql($sql, array($course_id));

        foreach ($activities as $activity) {
            self::update_grades($activity, $user_id);
        }

        return true;
    }
}

/**
 * Add Angle Live instance
 */
function anglelive_add_instance($anglelive) {
    global $DB;

    $anglelive->timecreated = time();
    $anglelive->timemodified = time();

    $anglelive->id = $DB->insert_record('anglelive', $anglelive);

    // Create grade item
    anglelive_grade_item_update($anglelive);

    return $anglelive->id;
}

/**
 * Update Angle Live instance
 */
function anglelive_update_instance($anglelive) {
    global $DB;

    $anglelive->timemodified = time();
    $anglelive->id = $anglelive->instance;

    $DB->update_record('anglelive', $anglelive);

    // Update grade item
    anglelive_grade_item_update($anglelive);

    return true;
}

/**
 * Delete Angle Live instance
 */
function anglelive_delete_instance($id) {
    global $DB;

    if (!$anglelive = $DB->get_record('anglelive', array('id' => $id))) {
        return false;
    }

    // Delete grade item
    anglelive_grade_item_delete($anglelive);

    // Delete instance
    $DB->delete_records('anglelive', array('id' => $anglelive->id));

    return true;
}

/**
 * Update grade item
 */
function anglelive_grade_item_update($anglelive, $grades = null) {
    global $CFG;

    require_once($CFG->libdir . '/gradelib.php');

    $params = array('itemname' => $anglelive->name);

    if ($anglelive->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = $anglelive->grade;
        $params['grademin'] = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/anglelive',
        $anglelive->course,
        'mod',
        'anglelive',
        $anglelive->id,
        0,
        $grades,
        $params
    );
}

/**
 * Delete grade item
 */
function anglelive_grade_item_delete($anglelive) {
    global $CFG;

    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/anglelive',
        $anglelive->course,
        'mod',
        'anglelive',
        $anglelive->id,
        0,
        null,
        array('deleted' => 1)
    );
}

/**
 * Cron function - sync grades periodically
 */
function anglelive_cron() {
    global $DB;

    mtrace('Angle Live: Starting grade sync...');

    // Get all courses with Angle Live activities
    $sql = "SELECT DISTINCT al.course
            FROM {anglelive} al
            INNER JOIN {course_modules} cm ON cm.instance = al.id
            WHERE cm.visible = 1";

    $courses = $DB->get_records_sql($sql);

    foreach ($courses as $course) {
        mtrace('  Syncing course: ' . $course->course);
        mod_anglelive::sync_grades($course->course);
    }

    mtrace('Angle Live: Grade sync completed');

    return true;
}

/**
 * Get user outline (for course overview)
 */
function anglelive_user_outline($course, $user, $mod, $anglelive) {
    global $CFG;

    require_once($CFG->dirroot . '/mod/anglelive/locallib.php');

    $outline = new stdClass();

    // Get user progress from Angle Live
    $progress = anglelive_get_user_progress($user->id, $course->id);

    if ($progress) {
        $outline->info = 'Completion: ' . round($progress['completion_percentage'], 2) . '%';
        $outline->time = $progress['last_activity'];
    }

    return $outline;
}

/**
 * Get user complete information
 */
function anglelive_user_complete($course, $user, $mod, $anglelive) {
    global $CFG;

    require_once($CFG->dirroot . '/mod/anglelive/locallib.php');

    $progress = anglelive_get_user_progress($user->id, $course->id);

    if ($progress) {
        echo '<div class="anglelive-progress">';
        echo '<p>Total Sessions: ' . $progress['total_sessions'] . '</p>';
        echo '<p>Angles Discovered: ' . $progress['angles_discovered'] . '</p>';
        echo '<p>Completion: ' . round($progress['completion_percentage'], 2) . '%</p>';
        echo '<p>Last Activity: ' . userdate($progress['last_activity']) . '</p>';
        echo '</div>';
    } else {
        echo '<p>No activity recorded</p>';
    }
}
