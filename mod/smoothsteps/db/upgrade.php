<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade code for the smoothsteps module.
 *
 * @param int $oldversion The old version of the smoothsteps module
 * @return bool
 */
function xmldb_smoothsteps_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2025111801) {
        // Define table smoothsteps_progress to be created.
        $table = new xmldb_table('smoothsteps_progress');

        // Adding fields to table smoothsteps_progress.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('smoothstepsid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('attempt', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('correct', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timespent', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('problemdata', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table smoothsteps_progress.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('smoothstepsid', XMLDB_KEY_FOREIGN, array('smoothstepsid'), 'smoothsteps', array('id'));
        $table->add_key('userid', XMLDB_KEY_FOREIGN, array('userid'), 'user', array('id'));

        // Adding indexes to table smoothsteps_progress.
        $table->add_index('smoothstepsid-userid', XMLDB_INDEX_NOTUNIQUE, array('smoothstepsid', 'userid'));

        // Conditionally launch create table for smoothsteps_progress.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Define table smoothsteps_interactions to be created.
        $table = new xmldb_table('smoothsteps_interactions');

        // Adding fields to table smoothsteps_interactions.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('smoothstepsid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('interactiontype', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, null);
        $table->add_field('interactiondata', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table smoothsteps_interactions.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('smoothstepsid', XMLDB_KEY_FOREIGN, array('smoothstepsid'), 'smoothsteps', array('id'));
        $table->add_key('userid', XMLDB_KEY_FOREIGN, array('userid'), 'user', array('id'));

        // Adding indexes to table smoothsteps_interactions.
        $table->add_index('smoothstepsid-userid', XMLDB_INDEX_NOTUNIQUE, array('smoothstepsid', 'userid'));
        $table->add_index('interactiontype', XMLDB_INDEX_NOTUNIQUE, array('interactiontype'));

        // Conditionally launch create table for smoothsteps_interactions.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Smoothsteps savepoint reached.
        upgrade_mod_savepoint(true, 2025111801, 'smoothsteps');
    }

    return true;
}
