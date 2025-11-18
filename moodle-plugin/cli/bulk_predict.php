<?php
/**
 * CLI script to bulk predict difficulty for questions
 *
 * Usage:
 *   php bulk_predict.php --all
 *   php bulk_predict.php --courseid=10
 *   php bulk_predict.php --categoryid=5
 *   php bulk_predict.php --questionids=1,2,3,4,5
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');

use local_difficulty_prediction\difficulty_predictor;

// Get CLI options.
list($options, $unrecognized) = cli_get_params(
    array(
        'help' => false,
        'all' => false,
        'courseid' => null,
        'categoryid' => null,
        'questionids' => null,
        'force' => false,
    ),
    array(
        'h' => 'help',
        'a' => 'all',
        'c' => 'courseid',
        'f' => 'force',
    )
);

if ($unrecognized) {
    $unrecognized = implode("\n  ", $unrecognized);
    cli_error(get_string('cliunknowoption', 'admin', $unrecognized));
}

if ($options['help']) {
    $help = <<<EOT
Bulk predict difficulty for Moodle questions.

Options:
--help, -h            Print this help
--all, -a             Predict for all questions
--courseid=ID, -c     Predict for questions in a specific course
--categoryid=ID       Predict for questions in a specific category
--questionids=IDs     Predict for specific question IDs (comma-separated)
--force, -f           Force recalculation even if prediction exists

Examples:
  php bulk_predict.php --all
  php bulk_predict.php --courseid=10
  php bulk_predict.php --categoryid=5
  php bulk_predict.php --questionids=1,2,3,4,5 --force

EOT;
    echo $help;
    exit(0);
}

// Validate options.
if (!$options['all'] && !$options['courseid'] && !$options['categoryid'] && !$options['questionids']) {
    cli_error('Must specify one of: --all, --courseid, --categoryid, or --questionids');
}

// Get question IDs based on options.
$questionids = array();

if ($options['all']) {
    cli_heading('Predicting difficulty for ALL questions');
    $questions = $DB->get_records('question', null, '', 'id');
    $questionids = array_keys($questions);

} else if ($options['courseid']) {
    $courseid = intval($options['courseid']);
    cli_heading("Predicting difficulty for questions in course {$courseid}");

    $sql = "SELECT q.id
            FROM {question} q
            JOIN {question_categories} qc ON q.category = qc.id
            JOIN {context} ctx ON qc.contextid = ctx.id
            WHERE ctx.contextlevel = 50
              AND ctx.instanceid = :courseid";

    $questions = $DB->get_records_sql($sql, array('courseid' => $courseid));
    $questionids = array_keys($questions);

} else if ($options['categoryid']) {
    $categoryid = intval($options['categoryid']);
    cli_heading("Predicting difficulty for questions in category {$categoryid}");

    $questions = $DB->get_records('question', array('category' => $categoryid), '', 'id');
    $questionids = array_keys($questions);

} else if ($options['questionids']) {
    cli_heading('Predicting difficulty for specified questions');
    $questionids = explode(',', $options['questionids']);
    $questionids = array_map('intval', $questionids);
}

if (empty($questionids)) {
    cli_error('No questions found matching criteria');
}

$total = count($questionids);
cli_writeln("Found {$total} questions to process");

// Process questions.
$success = 0;
$failed = 0;
$skipped = 0;

$progressbar = new progress_bar('difficulty_prediction', 500, true);
$progressbar->update(0, $total, "Processing questions...");

foreach ($questionids as $index => $questionid) {
    try {
        // Check if prediction already exists.
        if (!$options['force']) {
            $existing = $DB->get_record('question_difficulty', array('questionid' => $questionid));
            if ($existing) {
                $skipped++;
                $progressbar->update($index + 1, $total, "Processed: {$success} | Failed: {$failed} | Skipped: {$skipped}");
                continue;
            }
        }

        // Predict difficulty.
        $prediction = difficulty_predictor::predict($questionid, $options['force']);

        cli_writeln("✓ Question {$questionid}: Level {$prediction->predicted_level} " .
                    "(Confidence: " . round($prediction->confidence_score * 100) . "%)");

        $success++;

    } catch (Exception $e) {
        cli_writeln("✗ Question {$questionid}: Error - " . $e->getMessage());
        $failed++;
    }

    $progressbar->update($index + 1, $total, "Processed: {$success} | Failed: {$failed} | Skipped: {$skipped}");
}

// Summary.
cli_heading('Summary');
cli_writeln("Total questions: {$total}");
cli_writeln("Successfully predicted: {$success}");
cli_writeln("Failed: {$failed}");
cli_writeln("Skipped (already predicted): {$skipped}");

if ($failed > 0) {
    cli_writeln("\nCheck Moodle logs for detailed error messages.");
    exit(1);
} else {
    cli_writeln("\n✓ Bulk prediction completed successfully!");
    exit(0);
}
