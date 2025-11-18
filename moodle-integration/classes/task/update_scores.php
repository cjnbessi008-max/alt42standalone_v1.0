<?php
/**
 * Scheduled task to update consistency scores
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_thinkroutine_consistency\task;

use block_thinkroutine_consistency\consistency_calculator;

defined('MOODLE_INTERNAL') || die();

class update_scores extends \core\task\scheduled_task {

    /**
     * Get task name
     *
     * @return string
     */
    public function get_name() {
        return get_string('updatescores', 'block_thinkroutine_consistency');
    }

    /**
     * Execute task
     */
    public function execute() {
        global $DB;

        mtrace('Starting consistency score updates...');

        // Get all active courses
        $courses = $DB->get_records_select('course', 'visible = 1 AND id > 1');

        $periodend = time();
        $periodstart = $periodend - (30 * 24 * 60 * 60); // Last 30 days

        $total_users = 0;
        $total_courses = count($courses);

        foreach ($courses as $course) {
            // Get all enrolled users in this course
            $context = \context_course::instance($course->id);
            $enrolled_users = get_enrolled_users($context, '', 0, 'u.id');

            foreach ($enrolled_users as $user) {
                try {
                    consistency_calculator::update_scores(
                        $user->id,
                        $course->id,
                        $periodstart,
                        $periodend
                    );
                    $total_users++;
                } catch (\Exception $e) {
                    mtrace('Error updating scores for user ' . $user->id . ' in course ' . $course->id . ': ' . $e->getMessage());
                }
            }

            mtrace('Updated scores for course: ' . $course->fullname);
        }

        mtrace('Completed consistency score updates for ' . $total_users . ' users across ' . $total_courses . ' courses.');
    }
}
