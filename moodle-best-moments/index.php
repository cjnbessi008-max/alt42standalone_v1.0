<?php
/**
 * Best Moments Dashboard - Main entry point
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/bestmoments/lib.php');

// Get parameters
$courseid = optional_param('courseid', 0, PARAM_INT);
$view = optional_param('view', 'today', PARAM_ALPHA); // today, week, all

// Require login
require_login();

// Set up page
$PAGE->set_url('/local/bestmoments/index.php', array('courseid' => $courseid));
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('pluginname', 'local_bestmoments'));
$PAGE->set_heading(get_string('dashboard', 'local_bestmoments'));
$PAGE->set_pagelayout('standard');

// Check permissions
if ($courseid) {
    $context = context_course::instance($courseid);
    if (!local_bestmoments_can_view($courseid)) {
        print_error('nopermission', 'local_bestmoments');
    }
} else {
    $context = context_system::instance();
}

// Output header
echo $OUTPUT->header();

// Display navigation tabs
echo html_writer::start_tag('div', array('class' => 'bestmoments-tabs'));
echo html_writer::tag('a', get_string('todayview', 'local_bestmoments'),
    array('href' => '?view=today', 'class' => $view == 'today' ? 'active' : ''));
echo html_writer::tag('a', get_string('weekview', 'local_bestmoments'),
    array('href' => '?view=week', 'class' => $view == 'week' ? 'active' : ''));
echo html_writer::tag('a', get_string('allview', 'local_bestmoments'),
    array('href' => '?view=all', 'class' => $view == 'all' ? 'active' : ''));
echo html_writer::end_tag('div');

// Get data based on view
$days = ($view == 'today') ? 1 : (($view == 'week') ? 7 : 30);

if ($courseid) {
    $moments = local_bestmoments_get_course_moments($courseid, 20, $days);
    $stats = local_bestmoments_get_statistics($courseid);
} else {
    $moments = local_bestmoments_get_todays_featured(20);
    $stats = local_bestmoments_get_statistics();
}

// Display statistics summary
echo html_writer::start_tag('div', array('class' => 'bestmoments-stats'));

echo html_writer::start_tag('div', array('class' => 'stat-card'));
echo html_writer::tag('h3', $stats['total_moments']);
echo html_writer::tag('p', get_string('totalmoments', 'local_bestmoments'));
echo html_writer::end_tag('div');

echo html_writer::start_tag('div', array('class' => 'stat-card'));
echo html_writer::tag('h3', $stats['today_moments']);
echo html_writer::tag('p', get_string('todaymoments', 'local_bestmoments'));
echo html_writer::end_tag('div');

echo html_writer::start_tag('div', array('class' => 'stat-card'));
echo html_writer::tag('h3', round($stats['average_score'], 1));
echo html_writer::tag('p', get_string('averagescore', 'local_bestmoments'));
echo html_writer::end_tag('div');

echo html_writer::end_tag('div');

// Display moments
if (empty($moments)) {
    echo html_writer::tag('p', get_string('nomoments', 'local_bestmoments'),
        array('class' => 'alert alert-info'));
} else {
    echo html_writer::start_tag('div', array('class' => 'bestmoments-list'));

    foreach ($moments as $moment) {
        display_moment_card($moment);
    }

    echo html_writer::end_tag('div');
}

// Output footer
echo $OUTPUT->footer();

/**
 * Display a single moment card
 *
 * @param object $moment Moment object
 */
function display_moment_card($moment) {
    global $OUTPUT, $USER, $DB;

    // Get user info
    $user = $DB->get_record('user', array('id' => $moment->userid));
    $userpicture = $OUTPUT->user_picture($user, array('size' => 50));

    // Get course info
    $course = $DB->get_record('course', array('id' => $moment->courseid));

    // Format date
    $date = userdate($moment->momentdate, get_string('strftimedatetimeshort'));

    // Featured badge
    $featured_badge = '';
    if ($moment->is_featured) {
        $featured_badge = html_writer::tag('span', '⭐ ' . get_string('featured', 'local_bestmoments'),
            array('class' => 'badge badge-warning'));
    }

    // Activity type icon
    $activity_icons = array(
        'quiz' => '📝',
        'assignment' => '📄',
        'forum' => '💬',
        'lesson' => '📚',
        'workshop' => '🛠️'
    );
    $icon = isset($activity_icons[$moment->activitytype]) ? $activity_icons[$moment->activitytype] : '📋';

    // Score badge
    $score_class = 'success';
    if ($moment->score < 70) {
        $score_class = 'warning';
    } else if ($moment->score >= 85) {
        $score_class = 'info';
    }

    echo html_writer::start_tag('div', array('class' => 'moment-card'));

    // Header
    echo html_writer::start_tag('div', array('class' => 'moment-header'));
    echo $userpicture;
    echo html_writer::start_tag('div', array('class' => 'moment-user-info'));
    echo html_writer::tag('h4', fullname($user));
    echo html_writer::tag('small', $course->fullname . ' • ' . $date);
    echo html_writer::end_tag('div');
    echo $featured_badge;
    echo html_writer::end_tag('div');

    // Body
    echo html_writer::start_tag('div', array('class' => 'moment-body'));
    echo html_writer::tag('div', $icon . ' ' . ucfirst($moment->activitytype),
        array('class' => 'activity-type'));
    echo html_writer::tag('p', $moment->description, array('class' => 'moment-description'));

    // Scores breakdown
    echo html_writer::start_tag('div', array('class' => 'scores-breakdown'));
    echo create_score_bar('efficiency', $moment->efficiency_score);
    echo create_score_bar('creativity', $moment->creativity_score);
    echo create_score_bar('improvement', $moment->improvement_score);
    echo create_score_bar('persistence', $moment->persistence_score);
    echo create_score_bar('collaboration', $moment->collaboration_score);
    echo html_writer::end_tag('div');

    echo html_writer::end_tag('div');

    // Footer
    echo html_writer::start_tag('div', array('class' => 'moment-footer'));
    echo html_writer::tag('span', get_string('overallscore', 'local_bestmoments') . ': ',
        array('class' => 'score-label'));
    echo html_writer::tag('span', round($moment->score, 1),
        array('class' => 'badge badge-' . $score_class . ' score-value'));
    echo html_writer::end_tag('div');

    echo html_writer::end_tag('div');
}

/**
 * Create a score progress bar
 *
 * @param string $label Score label
 * @param float $value Score value (0-100)
 * @return string HTML
 */
function create_score_bar($label, $value) {
    $label_text = get_string('score_' . $label, 'local_bestmoments');
    $percentage = round($value);

    $color = 'success';
    if ($percentage < 50) {
        $color = 'danger';
    } else if ($percentage < 70) {
        $color = 'warning';
    }

    $html = html_writer::start_tag('div', array('class' => 'score-bar-container'));
    $html .= html_writer::tag('span', $label_text, array('class' => 'score-bar-label'));
    $html .= html_writer::start_tag('div', array('class' => 'progress'));
    $html .= html_writer::tag('div', $percentage . '%',
        array(
            'class' => 'progress-bar bg-' . $color,
            'role' => 'progressbar',
            'style' => 'width: ' . $percentage . '%',
            'aria-valuenow' => $percentage,
            'aria-valuemin' => '0',
            'aria-valuemax' => '100'
        ));
    $html .= html_writer::end_tag('div');
    $html .= html_writer::end_tag('div');

    return $html;
}

// Add CSS
$PAGE->requires->css('/local/bestmoments/styles.css');
