<?php
/**
 * Submission handler for problem explanations
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_problemexplain;

defined('MOODLE_INTERNAL') || die();

/**
 * Class to handle submission saving and processing
 */
class submission_handler {

    /**
     * Save a submission
     *
     * @param stdClass $data Form data
     * @param stdClass $problemexplain Problem explanation instance
     * @param stdClass $submission Existing submission record
     * @return bool Success
     */
    public function save_submission($data, $problemexplain, $submission) {
        global $DB, $USER;

        $transaction = $DB->start_delegated_transaction();

        try {
            // Update submission record
            $submission->explanation_title = $data->explanation_title;
            $submission->timemodified = time();

            // Check if this is a final submission or just a save
            if (isset($data->submitbutton)) {
                $submission->status = 'submitted';
                $submission->timesubmitted = time();
            }

            $DB->update_record('problemexplain_submissions', $submission);

            // Delete existing steps
            $DB->delete_records('problemexplain_steps', array('submission_id' => $submission->id));

            // Save new steps
            $stepcount = 0;
            for ($i = 1; $i <= $problemexplain->max_steps; $i++) {
                $title_field = 'step_title_' . $i;
                $explanation_field = 'step_explanation_' . $i;
                $reasoning_field = 'step_reasoning_' . $i;

                if (isset($data->$title_field) && !empty($data->$title_field)) {
                    $step = new \stdClass();
                    $step->submission_id = $submission->id;
                    $step->step_number = $stepcount + 1;
                    $step->step_title = $data->$title_field;
                    $step->step_explanation = $data->$explanation_field;
                    $step->step_reasoning = isset($data->$reasoning_field) ? $data->$reasoning_field : '';
                    $step->timecreated = time();
                    $step->timemodified = time();

                    $DB->insert_record('problemexplain_steps', $step);
                    $stepcount++;
                }
            }

            $transaction->allow_commit();

            // If submitted, trigger AI evaluation
            if ($submission->status == 'submitted' && $problemexplain->enable_ai_evaluation) {
                $this->trigger_ai_evaluation($submission, $problemexplain);
            }

            return true;

        } catch (\Exception $e) {
            $transaction->rollback($e);
            return false;
        }
    }

    /**
     * Trigger AI evaluation for a submission
     *
     * @param stdClass $submission Submission record
     * @param stdClass $problemexplain Problem explanation instance
     */
    private function trigger_ai_evaluation($submission, $problemexplain) {
        // This can be done asynchronously using Moodle's task API
        // For now, we'll call it directly
        $evaluator = new ai_evaluator();
        $evaluator->evaluate_submission($submission->id, $problemexplain);
    }
}
