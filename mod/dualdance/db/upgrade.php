<?php
// This file is part of Moodle - http://moodle.org/

/**
 * This file keeps track of upgrades to the dualdance module
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Execute dualdance upgrade from the given old version
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_dualdance_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    // Moodle v3.7.0 release upgrade line.
    // Put any upgrade step following this.

    if ($oldversion < 2025011800) {
        // Dualdance savepoint reached.
        upgrade_mod_savepoint(true, 2025011800, 'dualdance');
    }

    // Add future upgrade steps here

    return true;
}
