<?php
/**
 * Privacy Subsystem implementation for mod_selfexplanation.
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_selfexplanation\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\writer;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy Subsystem for mod_selfexplanation implementing metadata and plugin providers.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    /**
     * Returns meta data about this system.
     *
     * @param   collection $collection The initialised collection to add items to.
     * @return  collection A listing of user data stored through this system.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('selfexplanation_responses', [
            'userid' => 'privacy:metadata:selfexplanation_responses:userid',
            'responsetext' => 'privacy:metadata:selfexplanation_responses:responsetext',
            'wordcount' => 'privacy:metadata:selfexplanation_responses:wordcount',
            'timespent' => 'privacy:metadata:selfexplanation_responses:timespent',
            'grade' => 'privacy:metadata:selfexplanation_responses:grade',
            'feedback' => 'privacy:metadata:selfexplanation_responses:feedback',
            'timecreated' => 'privacy:metadata:selfexplanation_responses:timecreated',
            'timemodified' => 'privacy:metadata:selfexplanation_responses:timemodified',
        ], 'privacy:metadata:selfexplanation_responses');

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param   int $userid The user to search.
     * @return  contextlist The contextlist containing the list of contexts used in this plugin.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $sql = "SELECT c.id
                FROM {context} c
                INNER JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
                INNER JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                INNER JOIN {selfexplanation} se ON se.id = cm.instance
                INNER JOIN {selfexplanation_responses} ser ON ser.selfexplanationid = se.id
                WHERE ser.userid = :userid";

        $params = [
            'modname' => 'selfexplanation',
            'contextlevel' => CONTEXT_MODULE,
            'userid' => $userid,
        ];

        $contextlist->add_from_sql($sql, $params);

        return $contextlist;
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param   approved_contextlist $contextlist The approved contexts to export information for.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        list($contextsql, $contextparams) = $DB->get_in_or_equal($contextlist->get_contextids(), SQL_PARAMS_NAMED);

        $sql = "SELECT cm.id AS cmid,
                       ser.responsetext,
                       ser.wordcount,
                       ser.timespent,
                       ser.grade,
                       ser.feedback,
                       ser.status,
                       ser.timecreated,
                       ser.timemodified
                FROM {context} c
                INNER JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
                INNER JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                INNER JOIN {selfexplanation} se ON se.id = cm.instance
                INNER JOIN {selfexplanation_responses} ser ON ser.selfexplanationid = se.id
                WHERE c.id {$contextsql}
                  AND ser.userid = :userid
                ORDER BY cm.id";

        $params = ['modname' => 'selfexplanation', 'contextlevel' => CONTEXT_MODULE, 'userid' => $user->id] + $contextparams;

        $responses = $DB->get_recordset_sql($sql, $params);
        foreach ($responses as $response) {
            $context = \context_module::instance($response->cmid);
            $data = (object) [
                'responsetext' => $response->responsetext,
                'wordcount' => $response->wordcount,
                'timespent' => $response->timespent,
                'grade' => $response->grade,
                'feedback' => $response->feedback,
                'status' => $response->status,
                'timecreated' => \core_privacy\local\request\transform::datetime($response->timecreated),
                'timemodified' => \core_privacy\local\request\transform::datetime($response->timemodified),
            ];
            writer::with_context($context)->export_data([], $data);
        }
        $responses->close();
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param   \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;

        if (!$context instanceof \context_module) {
            return;
        }

        if ($cm = get_coursemodule_from_id('selfexplanation', $context->instanceid)) {
            $DB->delete_records('selfexplanation_responses', ['selfexplanationid' => $cm->instance]);
        }
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param   approved_contextlist $contextlist The approved contexts and user information to delete information for.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $userid = $contextlist->get_user()->id;
        foreach ($contextlist->get_contexts() as $context) {
            if (!$context instanceof \context_module) {
                continue;
            }
            $instanceid = $DB->get_field('course_modules', 'instance', ['id' => $context->instanceid], MUST_EXIST);
            $DB->delete_records('selfexplanation_responses', ['selfexplanationid' => $instanceid, 'userid' => $userid]);
        }
    }
}
