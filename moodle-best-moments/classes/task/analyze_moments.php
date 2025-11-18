<?php
/**
 * Scheduled task for analyzing best thinking moments
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_bestmoments\task;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/bestmoments/lib.php');

/**
 * Scheduled task to run daily analysis
 */
class analyze_moments extends \core\task\scheduled_task {

    /**
     * Get task name
     *
     * @return string Task name
     */
    public function get_name() {
        return get_string('task_analyze', 'local_bestmoments');
    }

    /**
     * Execute the task
     */
    public function execute() {
        global $CFG;

        mtrace('========================================');
        mtrace('Best Thinking Moments - Daily Analysis');
        mtrace('========================================');
        mtrace('Start time: ' . date('Y-m-d H:i:s'));

        try {
            // Run the daily analysis
            $result = local_bestmoments_cron();

            if ($result) {
                mtrace('Analysis completed successfully!');
            } else {
                mtrace('Analysis completed with warnings.');
            }

        } catch (\Exception $e) {
            mtrace('ERROR: ' . $e->getMessage());
            mtrace('Stack trace: ' . $e->getTraceAsString());

            if (BESTMOMENTS_DEBUG_MODE) {
                error_log('Best Moments Analysis Error: ' . $e->getMessage());
                error_log($e->getTraceAsString());
            }

            throw $e;
        }

        mtrace('End time: ' . date('Y-m-d H:i:s'));
        mtrace('========================================');
    }
}
