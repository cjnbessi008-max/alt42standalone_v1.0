<?php
/**
 * View all student responses for teachers
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT); // Course module ID

$cm = get_coursemodule_from_id('selfexplanation', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$selfexplanation = $DB->get_record('selfexplanation', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/selfexplanation:viewresponses', $context);

$PAGE->set_url('/mod/selfexplanation/report.php', array('id' => $cm->id));
$PAGE->set_title(format_string($selfexplanation->name) . ' - ' . get_string('viewresponses', 'selfexplanation'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get all responses
$sql = "SELECT r.*, u.firstname, u.lastname, u.email, a.qualityscore, a.keywordcount
        FROM {selfexplanation_responses} r
        JOIN {user} u ON u.id = r.userid
        LEFT JOIN {selfexplanation_analytics} a ON a.responseid = r.id
        WHERE r.selfexplanationid = :selfexplanationid
        ORDER BY r.timemodified DESC";

$responses = $DB->get_records_sql($sql, array('selfexplanationid' => $selfexplanation->id));

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($selfexplanation->name));
echo $OUTPUT->heading(get_string('viewresponses', 'selfexplanation'), 3);

// Summary statistics
$totalresponses = count($responses);
$submitted = 0;
$graded = 0;
$avgquality = 0;

foreach ($responses as $response) {
    if ($response->status === 'submitted' || $response->status === 'graded') {
        $submitted++;
    }
    if ($response->status === 'graded') {
        $graded++;
    }
    if ($response->qualityscore) {
        $avgquality += $response->qualityscore;
    }
}

if ($totalresponses > 0) {
    $avgquality = round($avgquality / $totalresponses, 2);
}

// Display summary
echo html_writer::start_tag('div', array('class' => 'alert alert-info'));
echo html_writer::tag('p', get_string('numresponses', 'selfexplanation', $totalresponses));
echo html_writer::tag('p', 'Submitted: ' . $submitted . ' | Graded: ' . $graded);
echo html_writer::tag('p', get_string('qualityscore', 'selfexplanation') . ': ' . $avgquality);
echo html_writer::end_tag('div');

// Display responses in a table
if ($totalresponses > 0) {
    $table = new html_table();
    $table->head = array(
        get_string('studentname', 'selfexplanation'),
        get_string('response', 'selfexplanation'),
        get_string('wordcount', 'selfexplanation', ''),
        get_string('qualityscore', 'selfexplanation'),
        get_string('status', 'selfexplanation'),
        get_string('grade', 'selfexplanation'),
        'Actions'
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($responses as $response) {
        $studentname = fullname($response);
        $responsepreview = shorten_text(strip_tags($response->responsetext), 100);

        $statusbadge = html_writer::tag('span',
            get_string($response->status, 'selfexplanation'),
            array('class' => 'badge badge-' . ($response->status === 'submitted' ? 'success' : 'secondary'))
        );

        $viewlink = html_writer::link(
            new moodle_url('/mod/selfexplanation/viewresponse.php', array(
                'id' => $cm->id,
                'responseid' => $response->id
            )),
            'View',
            array('class' => 'btn btn-sm btn-primary')
        );

        $table->data[] = array(
            $studentname,
            $responsepreview,
            $response->wordcount,
            $response->qualityscore ? round($response->qualityscore, 1) : '-',
            $statusbadge,
            $response->grade !== null ? $response->grade : '-',
            $viewlink
        );
    }

    echo html_writer::table($table);
} else {
    echo html_writer::tag('p', get_string('noresponsesyet', 'selfexplanation'), array('class' => 'alert alert-warning'));
}

echo html_writer::tag('div',
    html_writer::link(
        new moodle_url('/mod/selfexplanation/view.php', array('id' => $cm->id)),
        get_string('back'),
        array('class' => 'btn btn-secondary')
    ),
    array('class' => 'mt-3')
);

echo $OUTPUT->footer();
