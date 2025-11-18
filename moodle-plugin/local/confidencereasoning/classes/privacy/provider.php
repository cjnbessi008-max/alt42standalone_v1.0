<?php
// This file is part of Moodle - http://moodle.org/

namespace local_confidencereasoning\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy Subsystem implementation for local_confidencereasoning.
 * Implements GDPR compliance (personal data export, deletion)
 */
class provider implements
        \core_privacy\local\metadata\provider,
        \core_privacy\local\request\core_userlist_provider,
        \core_privacy\local\request\plugin\provider {

    /**
     * Returns meta data about this system.
     *
     * @param collection $collection The initialised collection to add items to.
     * @return collection A listing of user data stored through this system.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'local_confidence_reasoning',
            [
                'userid' => 'privacy:metadata:local_confidence_reasoning:userid',
                'questionattemptid' => 'privacy:metadata:local_confidence_reasoning:questionattemptid',
                'quizid' => 'privacy:metadata:local_confidence_reasoning:quizid',
                'questionid' => 'privacy:metadata:local_confidence_reasoning:questionid',
                'confidencelevel' => 'privacy:metadata:local_confidence_reasoning:confidencelevel',
                'reasoning' => 'privacy:metadata:local_confidence_reasoning:reasoning',
                'reasoningcategory' => 'privacy:metadata:local_confidence_reasoning:reasoningcategory',
                'timecreated' => 'privacy:metadata:local_confidence_reasoning:timecreated',
                'timemodified' => 'privacy:metadata:local_confidence_reasoning:timemodified',
            ],
            'privacy:metadata:local_confidence_reasoning'
        );

        $collection->add_database_table(
            'local_confidence_stats',
            [
                'userid' => 'privacy:metadata:local_confidence_stats:userid',
                'quizid' => 'privacy:metadata:local_confidence_stats:quizid',
                'avgconfidence' => 'privacy:metadata:local_confidence_stats:avgconfidence',
                'totalattempts' => 'privacy:metadata:local_confidence_stats:totalattempts',
                'correctwithhighconfidence' => 'privacy:metadata:local_confidence_stats:correctwithhighconfidence',
                'incorrectwithhighconfidence' => 'privacy:metadata:local_confidence_stats:incorrectwithhighconfidence',
            ],
            'privacy:metadata:local_confidence_stats'
        );

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist The contextlist containing the list of contexts used in this plugin.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        // Get all quiz contexts where user has confidence data
        $sql = "SELECT ctx.id
                  FROM {context} ctx
                  JOIN {course_modules} cm ON cm.id = ctx.instanceid AND ctx.contextlevel = :contextlevel
                  JOIN {modules} m ON m.id = cm.module AND m.name = 'quiz'
                  JOIN {quiz} q ON q.id = cm.instance
                  JOIN {local_confidence_reasoning} cr ON cr.quizid = q.id
                 WHERE cr.userid = :userid";

        $params = [
            'contextlevel' => CONTEXT_MODULE,
            'userid' => $userid
        ];

        $contextlist->add_from_sql($sql, $params);

        return $contextlist;
    }

    /**
     * Get the list of users who have data within a context.
     *
     * @param userlist $userlist The userlist containing the list of users who have data in this context/plugin combination.
     */
    public static function get_users_in_context(userlist $userlist) {
        $context = $userlist->get_context();

        if (!$context instanceof \context_module) {
            return;
        }

        $sql = "SELECT cr.userid
                  FROM {course_modules} cm
                  JOIN {modules} m ON m.id = cm.module AND m.name = 'quiz'
                  JOIN {quiz} q ON q.id = cm.instance
                  JOIN {local_confidence_reasoning} cr ON cr.quizid = q.id
                 WHERE cm.id = :cmid";

        $params = ['cmid' => $context->instanceid];

        $userlist->add_from_sql('userid', $sql, $params);
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts to export information for.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('quiz', $context->instanceid);
            if (!$cm) {
                continue;
            }

            // Get confidence data for this quiz
            $records = $DB->get_records('local_confidence_reasoning', [
                'userid' => $user->id,
                'quizid' => $cm->instance
            ]);

            if ($records) {
                $data = [];
                foreach ($records as $record) {
                    $data[] = [
                        'question_attempt_id' => $record->questionattemptid,
                        'question_id' => $record->questionid,
                        'confidence_level' => $record->confidencelevel,
                        'reasoning' => $record->reasoning,
                        'reasoning_category' => $record->reasoningcategory,
                        'time_created' => \core_privacy\local\request\transform::datetime($record->timecreated),
                        'time_modified' => \core_privacy\local\request\transform::datetime($record->timemodified),
                    ];
                }

                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'local_confidencereasoning'), 'confidence_data'],
                    (object)['records' => $data]
                );
            }

            // Get stats data
            $stats = $DB->get_record('local_confidence_stats', [
                'userid' => $user->id,
                'quizid' => $cm->instance
            ]);

            if ($stats) {
                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'local_confidencereasoning'), 'statistics'],
                    (object)[
                        'average_confidence' => $stats->avgconfidence,
                        'total_attempts' => $stats->totalattempts,
                        'correct_with_high_confidence' => $stats->correctwithhighconfidence,
                        'incorrect_with_high_confidence' => $stats->incorrectwithhighconfidence,
                    ]
                );
            }
        }
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('quiz', $context->instanceid);
        if (!$cm) {
            return;
        }

        $DB->delete_records('local_confidence_reasoning', ['quizid' => $cm->instance]);
        $DB->delete_records('local_confidence_stats', ['quizid' => $cm->instance]);
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts and user information to delete information for.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('quiz', $context->instanceid);
            if (!$cm) {
                continue;
            }

            $DB->delete_records('local_confidence_reasoning', [
                'userid' => $user->id,
                'quizid' => $cm->instance
            ]);

            $DB->delete_records('local_confidence_stats', [
                'userid' => $user->id,
                'quizid' => $cm->instance
            ]);
        }
    }

    /**
     * Delete multiple users within a single context.
     *
     * @param approved_userlist $userlist The approved context and user information to delete information for.
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
        global $DB;

        $context = $userlist->get_context();

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('quiz', $context->instanceid);
        if (!$cm) {
            return;
        }

        $userids = $userlist->get_userids();

        list($insql, $inparams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $params = array_merge(['quizid' => $cm->instance], $inparams);

        $DB->delete_records_select('local_confidence_reasoning', "quizid = :quizid AND userid $insql", $params);
        $DB->delete_records_select('local_confidence_stats', "quizid = :quizid AND userid $insql", $params);
    }
}
