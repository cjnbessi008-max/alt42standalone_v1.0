<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Scheduled task to clean up old performance data
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Scheduled task to archive or delete old performance data
 */
class cleanup_old_performance extends \core\task\scheduled_task {

    /**
     * Get task name
     *
     * @return string
     */
    public function get_name() {
        return get_string('task_cleanup_old_performance', 'local_difficulty_prediction');
    }

    /**
     * Execute task
     */
    public function execute() {
        global $DB;

        mtrace('Starting cleanup of old performance data...');

        // Delete performance records older than 2 years.
        $threshold = time() - (2 * 365 * 24 * 3600);

        $count = $DB->count_records_select('question_performance', 'timecreated < :threshold', array('threshold' => $threshold));

        if ($count > 0) {
            $DB->delete_records_select('question_performance', 'timecreated < :threshold', array('threshold' => $threshold));
            mtrace("Deleted $count old performance records");
        } else {
            mtrace('No old performance records to delete');
        }

        return true;
    }
}
