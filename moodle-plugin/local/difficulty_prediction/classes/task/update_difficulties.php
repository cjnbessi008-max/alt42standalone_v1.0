<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Scheduled task to update difficulty predictions
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction\task;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/performance_tracker.php');

/**
 * Scheduled task to update difficulty predictions based on new performance data
 */
class update_difficulties extends \core\task\scheduled_task {

    /**
     * Get task name
     *
     * @return string
     */
    public function get_name() {
        return get_string('task_update_difficulties', 'local_difficulty_prediction');
    }

    /**
     * Execute task
     */
    public function execute() {
        mtrace('Starting difficulty prediction updates...');

        // Update up to 500 questions per run.
        $updated = \local_difficulty_prediction\performance_tracker::batch_update_difficulties(500);

        mtrace("Updated difficulty predictions for $updated questions");

        return true;
    }
}
