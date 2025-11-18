<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Privacy API implementation
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_flowmoments\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy provider implementation
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider,
    \core_privacy\local\request\core_userlist_provider {

    /**
     * Get metadata about data stored by this plugin
     *
     * @param collection $collection
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'local_flowmoments_tracking',
            [
                'userid' => 'privacy:metadata:local_flowmoments_tracking:userid',
                'courseid' => 'privacy:metadata:local_flowmoments_tracking:courseid',
                'eventtype' => 'privacy:metadata:local_flowmoments_tracking:eventtype',
                'eventdata' => 'privacy:metadata:local_flowmoments_tracking:eventdata',
                'timestamp' => 'privacy:metadata:local_flowmoments_tracking:timestamp',
            ],
            'privacy:metadata:local_flowmoments_tracking'
        );

        $collection->add_database_table(
            'local_flowmoments_detected',
            [
                'userid' => 'privacy:metadata:local_flowmoments_detected:userid',
                'courseid' => 'privacy:metadata:local_flowmoments_detected:courseid',
                'flowscore' => 'privacy:metadata:local_flowmoments_detected:flowscore',
                'starttime' => 'privacy:metadata:local_flowmoments_detected:starttime',
                'duration' => 'privacy:metadata:local_flowmoments_detected:duration',
            ],
            'privacy:metadata:local_flowmoments_detected'
        );

        $collection->add_database_table(
            'local_flowmoments_summary',
            [
                'userid' => 'privacy:metadata:local_flowmoments_summary:userid',
                'courseid' => 'privacy:metadata:local_flowmoments_summary:courseid',
                'totalflowmoments' => 'privacy:metadata:local_flowmoments_summary:totalflowmoments',
                'avgflowscore' => 'privacy:metadata:local_flowmoments_summary:avgflowscore',
            ],
            'privacy:metadata:local_flowmoments_summary'
        );

        return $collection;
    }

    /**
     * Get contexts for a user
     *
     * @param int $userid
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $sql = "SELECT DISTINCT ctx.id
                FROM {context} ctx
                JOIN {course} c ON ctx.instanceid = c.id AND ctx.contextlevel = :contextlevel
                JOIN {local_flowmoments_tracking} fmt ON fmt.courseid = c.id
                WHERE fmt.userid = :userid";

        $contextlist->add_from_sql($sql, [
            'contextlevel' => CONTEXT_COURSE,
            'userid' => $userid,
        ]);

        return $contextlist;
    }

    /**
     * Export user data
     *
     * @param approved_contextlist $contextlist
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_COURSE) {
                continue;
            }

            $courseid = $context->instanceid;

            // Export flow moments
            $flow_moments = $DB->get_records('local_flowmoments_detected', [
                'userid' => $user->id,
                'courseid' => $courseid,
            ]);

            if (!empty($flow_moments)) {
                $data = [];
                foreach ($flow_moments as $moment) {
                    $data[] = [
                        'flowscore' => $moment->flowscore,
                        'starttime' => \core_privacy\local\request\transform::datetime($moment->starttime),
                        'duration' => $moment->duration,
                        'indicators' => $moment->indicators,
                    ];
                }

                writer::with_context($context)->export_data(
                    [get_string('flowmoments', 'local_flowmoments')],
                    (object)['flow_moments' => $data]
                );
            }

            // Export summary
            $summary = $DB->get_record('local_flowmoments_summary', [
                'userid' => $user->id,
                'courseid' => $courseid,
            ]);

            if ($summary) {
                writer::with_context($context)->export_data(
                    [get_string('flowmoments', 'local_flowmoments'), 'summary'],
                    $summary
                );
            }
        }
    }

    /**
     * Delete data for all users in context
     *
     * @param \context $context
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;

        if ($context->contextlevel != CONTEXT_COURSE) {
            return;
        }

        $courseid = $context->instanceid;

        $DB->delete_records('local_flowmoments_tracking', ['courseid' => $courseid]);
        $DB->delete_records('local_flowmoments_detected', ['courseid' => $courseid]);
        $DB->delete_records('local_flowmoments_summary', ['courseid' => $courseid]);
    }

    /**
     * Delete data for a user
     *
     * @param approved_contextlist $contextlist
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_COURSE) {
                continue;
            }

            $courseid = $context->instanceid;

            $DB->delete_records('local_flowmoments_tracking', [
                'userid' => $user->id,
                'courseid' => $courseid,
            ]);
            $DB->delete_records('local_flowmoments_detected', [
                'userid' => $user->id,
                'courseid' => $courseid,
            ]);
            $DB->delete_records('local_flowmoments_summary', [
                'userid' => $user->id,
                'courseid' => $courseid,
            ]);
        }
    }

    /**
     * Get list of users in context
     *
     * @param userlist $userlist
     */
    public static function get_users_in_context(userlist $userlist) {
        $context = $userlist->get_context();

        if ($context->contextlevel != CONTEXT_COURSE) {
            return;
        }

        $sql = "SELECT DISTINCT userid
                FROM {local_flowmoments_tracking}
                WHERE courseid = :courseid";

        $userlist->add_from_sql('userid', $sql, ['courseid' => $context->instanceid]);
    }

    /**
     * Delete data for users
     *
     * @param approved_userlist $userlist
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
        global $DB;

        $context = $userlist->get_context();

        if ($context->contextlevel != CONTEXT_COURSE) {
            return;
        }

        $courseid = $context->instanceid;
        $userids = $userlist->get_userids();

        foreach ($userids as $userid) {
            $DB->delete_records('local_flowmoments_tracking', [
                'userid' => $userid,
                'courseid' => $courseid,
            ]);
            $DB->delete_records('local_flowmoments_detected', [
                'userid' => $userid,
                'courseid' => $courseid,
            ]);
            $DB->delete_records('local_flowmoments_summary', [
                'userid' => $userid,
                'courseid' => $courseid,
            ]);
        }
    }
}
