<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade code for Chance Mood block
 *
 * @param int $oldversion The old version of the block
 * @return bool Always true
 */
function xmldb_block_chancemood_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2025011801) {

        // Define table block_chancemood_recommend to be created.
        $table = new xmldb_table('block_chancemood_recommend');

        // Adding fields to table block_chancemood_recommend.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('priority', XMLDB_TYPE_CHAR, '20', null, XMLDB_NOTNULL, null, 'medium');
        $table->add_field('weak_areas', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('recommended_problems', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('study_path', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('message', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table block_chancemood_recommend.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('userid', XMLDB_KEY_FOREIGN, array('userid'), 'user', array('id'));
        $table->add_key('courseid', XMLDB_KEY_FOREIGN, array('courseid'), 'course', array('id'));

        // Adding indexes to table block_chancemood_recommend.
        $table->add_index('userid_courseid', XMLDB_INDEX_UNIQUE, array('userid', 'courseid'));
        $table->add_index('priority', XMLDB_INDEX_NOTUNIQUE, array('priority'));

        // Conditionally launch create table for block_chancemood_recommend.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Define table block_chancemood_progress to be created.
        $table = new xmldb_table('block_chancemood_progress');

        // Adding fields to table block_chancemood_progress.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('recommendid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('problem_type', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, null);
        $table->add_field('completed_problems', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('target_problems', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '10');
        $table->add_field('current_success_rate', XMLDB_TYPE_NUMBER, '5,2', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('study_path_step', XMLDB_TYPE_INTEGER, '2', null, XMLDB_NOTNULL, null, '1');
        $table->add_field('resources_viewed', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('last_practice', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table block_chancemood_progress.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('userid', XMLDB_KEY_FOREIGN, array('userid'), 'user', array('id'));
        $table->add_key('courseid', XMLDB_KEY_FOREIGN, array('courseid'), 'course', array('id'));
        $table->add_key('recommendid', XMLDB_KEY_FOREIGN, array('recommendid'), 'block_chancemood_recommend', array('id'));

        // Adding indexes to table block_chancemood_progress.
        $table->add_index('userid_courseid', XMLDB_INDEX_NOTUNIQUE, array('userid', 'courseid'));

        // Conditionally launch create table for block_chancemood_progress.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Chancemood savepoint reached.
        upgrade_block_savepoint(true, 2025011801, 'chancemood');
    }

    return true;
}
