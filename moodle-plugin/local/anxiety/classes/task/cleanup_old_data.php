<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Scheduled task to cleanup old anxiety data
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_anxiety\task;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/anxiety/classes/collector.php');

/**
 * Class cleanup_old_data
 *
 * Scheduled task to clean up old anxiety metrics data
 */
class cleanup_old_data extends \core\task\scheduled_task {

    /**
     * Get task name
     *
     * @return string Task name
     */
    public function get_name() {
        return get_string('cleanup_old_data_task', 'local_anxiety');
    }

    /**
     * Execute task
     */
    public function execute() {
        // Clean up data older than 90 days
        $count = \local_anxiety\collector::cleanup_old_data(90);

        mtrace('Cleaned up ' . $count . ' old anxiety metrics records');
    }
}
