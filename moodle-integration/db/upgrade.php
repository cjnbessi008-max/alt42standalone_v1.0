<?php
/**
 * Database upgrade script
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

function xmldb_block_thinkroutine_consistency_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    // Future upgrade steps will go here
    // Example:
    // if ($oldversion < 2025111801) {
    //     // Upgrade steps
    //     upgrade_block_savepoint(true, 2025111801, 'thinkroutine_consistency');
    // }

    return true;
}
