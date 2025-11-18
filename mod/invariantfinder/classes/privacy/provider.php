<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Privacy Subsystem implementation for mod_invariantfinder.
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_invariantfinder\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\deletion_criteria;
use core_privacy\local\request\helper;
use core_privacy\local\request\writer;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy Subsystem for mod_invariantfinder implementing metadata and plugin providers.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    /**
     * Return the fields which contain personal data.
     *
     * @param collection $items a reference to the collection to use to store the metadata.
     * @return collection the updated collection of metadata items.
     */
    public static function get_metadata(collection $items) : collection {
        $items->add_database_table(
            'invariantfinder_attempts',
            [
                'userid' => 'privacy:metadata:invariantfinder_attempts:userid',
                'invariants_found' => 'privacy:metadata:invariantfinder_attempts:invariants_found',
                'scale_actions' => 'privacy:metadata:invariantfinder_attempts:scale_actions',
                'time_spent' => 'privacy:metadata:invariantfinder_attempts:time_spent',
                'score' => 'privacy:metadata:invariantfinder_attempts:score',
                'timecreated' => 'privacy:metadata:invariantfinder_attempts:timecreated',
                'timemodified' => 'privacy:metadata:invariantfinder_attempts:timemodified',
            ],
            'privacy:metadata:invariantfinder_attempts'
        );

        $items->add_database_table(
            'invariantfinder_interactions',
            [
                'action_type' => 'privacy:metadata:invariantfinder_interactions:action_type',
                'action_data' => 'privacy:metadata:invariantfinder_interactions:action_data',
                'timestamp' => 'privacy:metadata:invariantfinder_interactions:timestamp',
            ],
            'privacy:metadata:invariantfinder_interactions'
        );

        return $items;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid the userid.
     * @return contextlist the list of contexts containing user info for the user.
     */
    public static function get_contexts_for_userid(int $userid) : contextlist {
        $sql = "SELECT c.id
                  FROM {context} c
            INNER JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
            INNER JOIN {modules} m ON m.id = cm.module AND m.name = :modname
            INNER JOIN {invariantfinder} if ON if.id = cm.instance
            INNER JOIN {invariantfinder_attempts} ifa ON ifa.invariantfinder = if.id
                 WHERE ifa.userid = :userid";

        $params = [
            'modname'       => 'invariantfinder',
            'contextlevel'  => CONTEXT_MODULE,
            'userid'        => $userid,
        ];

        $contextlist = new contextlist();
        $contextlist->add_from_sql($sql, $params);

        return $contextlist;
    }

    /**
     * Export personal data for the given approved_contextlist. User and context information is contained within the contextlist.
     *
     * @param approved_contextlist $contextlist a list of contexts approved for export.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        list($contextsql, $contextparams) = $DB->get_in_or_equal($contextlist->get_contextids(), SQL_PARAMS_NAMED);

        $sql = "SELECT cm.id AS cmid,
                       ifa.*
                  FROM {context} c
            INNER JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
            INNER JOIN {modules} m ON m.id = cm.module AND m.name = :modname
            INNER JOIN {invariantfinder} if ON if.id = cm.instance
            INNER JOIN {invariantfinder_attempts} ifa ON ifa.invariantfinder = if.id
                 WHERE c.id {$contextsql}
                       AND ifa.userid = :userid
              ORDER BY cm.id";

        $params = ['modname' => 'invariantfinder', 'contextlevel' => CONTEXT_MODULE, 'userid' => $user->id] + $contextparams;

        $attempts = $DB->get_recordset_sql($sql, $params);
        foreach ($attempts as $attempt) {
            $context = \context_module::instance($attempt->cmid);
            $data = (object) [
                'invariants_found' => $attempt->invariants_found,
                'scale_actions' => $attempt->scale_actions,
                'time_spent' => $attempt->time_spent,
                'score' => $attempt->score,
                'timecreated' => \core_privacy\local\request\transform::datetime($attempt->timecreated),
                'timemodified' => \core_privacy\local\request\transform::datetime($attempt->timemodified),
            ];
            writer::with_context($context)->export_data([], $data);
        }
        $attempts->close();
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param \context $context the context to delete in.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;

        if (!$context instanceof \context_module) {
            return;
        }

        $cm = get_coursemodule_from_id('invariantfinder', $context->instanceid);
        if (!$cm) {
            return;
        }

        $invariantfinderid = $cm->instance;

        // Delete interactions
        $attempts = $DB->get_records('invariantfinder_attempts', ['invariantfinder' => $invariantfinderid]);
        foreach ($attempts as $attempt) {
            $DB->delete_records('invariantfinder_interactions', ['attempt_id' => $attempt->id]);
        }

        // Delete attempts
        $DB->delete_records('invariantfinder_attempts', ['invariantfinder' => $invariantfinderid]);
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist a list of contexts approved for deletion.
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

            $cm = get_coursemodule_from_id('invariantfinder', $context->instanceid);
            if (!$cm) {
                continue;
            }

            $invariantfinderid = $cm->instance;

            // Delete interactions
            $attempts = $DB->get_records('invariantfinder_attempts', [
                'invariantfinder' => $invariantfinderid,
                'userid' => $userid
            ]);
            foreach ($attempts as $attempt) {
                $DB->delete_records('invariantfinder_interactions', ['attempt_id' => $attempt->id]);
            }

            // Delete attempts
            $DB->delete_records('invariantfinder_attempts', [
                'invariantfinder' => $invariantfinderid,
                'userid' => $userid
            ]);
        }
    }
}
