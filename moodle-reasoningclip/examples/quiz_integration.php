<?php
/**
 * Example: How to integrate Reasoning Clip tracking into a Moodle quiz
 *
 * This file demonstrates how to add reasoning clip tracking to quiz questions
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/*
 * STEP 1: Add this code to your quiz attempt page (e.g., mod/quiz/attempt.php)
 * or create a local plugin that hooks into quiz attempts
 */

// Include Moodle config
require_once('../../../../config.php');

// Get quiz and attempt context
$attemptid = required_param('attempt', PARAM_INT);
$cmid = required_param('cmid', PARAM_INT);

require_login();

$PAGE->set_url('/mod/quiz/attempt.php', array('attempt' => $attemptid, 'cmid' => $cmid));

// Get course module and context
$cm = get_coursemodule_from_id('quiz', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

// Check if reasoning clip is enabled for this activity
$config = $DB->get_record('local_reasoningclip_config', array('cmid' => $cmid));

if ($config && $config->enabled) {

    // Initialize JavaScript tracking
    $PAGE->requires->js_call_amd('local_reasoningclip/tracker', 'init', array(
        array(
            'questionId' => 0,  // Will be set per question
            'userId' => $USER->id,
            'courseId' => $course->id,
            'cmId' => $cmid,
            'autoAnalyze' => true,
            'batchSize' => 10,
            'sendInterval' => 30000  // 30 seconds
        )
    ));
}

/*
 * STEP 2: For each question in the quiz, initialize tracking with specific question ID
 * Add this JavaScript code in your question rendering template
 */
?>

<script>
// Example: Initialize tracker for a specific question
require(['local_reasoningclip/tracker'], function(Tracker) {
    // Initialize tracker for question
    var tracker = Tracker.init({
        questionId: <?php echo $question->id; ?>,
        userId: <?php echo $USER->id; ?>,
        courseId: <?php echo $course->id; ?>,
        cmId: <?php echo $cmid; ?>,
        autoAnalyze: true
    });

    // Optional: Track answer changes with custom event
    document.querySelectorAll('.que.multichoice input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function(e) {
            // This will be automatically tracked, but you can add custom data
            tracker.recordEvent('answer_change', {
                question_id: <?php echo $question->id; ?>,
                selected_option: e.target.value,
                previous_option: e.target.dataset.previous || null
            });

            // Store for next change
            e.target.dataset.previous = e.target.value;
        });
    });

    // Track when student submits answer
    document.querySelector('input[name="next"]').addEventListener('click', function() {
        // Get selected answer
        var selected = document.querySelector('.que.multichoice input[type="radio"]:checked');

        tracker.recordEvent('answer_submit', {
            question_id: <?php echo $question->id; ?>,
            answer: selected ? selected.value : null,
            is_correct: false  // Will be updated by server
        });

        // Force send events before navigation
        tracker.sendEvents(true);
    });
});
</script>

<?php

/*
 * STEP 3: After answer is graded, update the event with correctness
 * Add this to your grading logic
 */

function update_answer_correctness($attemptid, $questionid, $is_correct) {
    global $DB, $USER;

    // Get the latest answer_submit event for this question
    $events = $DB->get_records_sql(
        "SELECT *
         FROM {local_reasoningclip_events}
         WHERE userid = :userid
           AND questionid = :questionid
           AND eventtype = 'answer_submit'
         ORDER BY timecreated DESC
         LIMIT 1",
        array(
            'userid' => $USER->id,
            'questionid' => $questionid
        )
    );

    if ($events) {
        $event = reset($events);
        $eventdata = json_decode($event->eventdata, true);
        $eventdata['data']['is_correct'] = $is_correct;

        $event->eventdata = json_encode($eventdata);
        $DB->update_record('local_reasoningclip_events', $event);

        // Trigger analysis for this session
        trigger_reasoning_analysis($event->sessionid, $questionid, $USER->id);
    }
}

function trigger_reasoning_analysis($sessionid, $questionid, $userid) {
    global $DB, $COURSE, $PAGE;

    // Get all events for this session
    $events = $DB->get_records(
        'local_reasoningclip_events',
        array(
            'sessionid' => $sessionid,
            'questionid' => $questionid
        ),
        'timecreated ASC'
    );

    // Convert to array format
    $events_array = array();
    foreach ($events as $event) {
        $events_array[] = array(
            'eventtype' => $event->eventtype,
            'eventdata' => $event->eventdata,
            'timecreated' => $event->timecreated
        );
    }

    // Detect reasoning moments
    $clips = \local_reasoningclip\reasoning_detector::detect_reasoning_moments(
        $events_array,
        $questionid,
        $userid
    );

    // Get CM ID from page context
    $cmid = $PAGE->cm->id;

    // Save clips
    foreach ($clips as $clip) {
        if ($clip['confidence'] >= 0.7) {  // Default threshold
            \local_reasoningclip\reasoning_detector::save_clip(
                $clip,
                $COURSE->id,
                $cmid
            );
        }
    }

    return count($clips);
}

/*
 * STEP 4: Optional - Display clips to students on review page
 */

function display_student_clips($questionid, $userid) {
    global $DB;

    $clips = $DB->get_records(
        'local_reasoningclip',
        array(
            'questionid' => $questionid,
            'userid' => $userid
        ),
        'timecreated DESC'
    );

    if (empty($clips)) {
        return '';
    }

    $output = html_writer::start_div('reasoning-clips-student-view card');
    $output .= html_writer::start_div('card-header');
    $output .= html_writer::tag('h5', get_string('your_reasoning_moments', 'local_reasoningclip'));
    $output .= html_writer::end_div();

    $output .= html_writer::start_div('card-body');

    foreach ($clips as $clip) {
        $output .= html_writer::start_div('clip-item mb-2');

        $cliptype_label = get_string('cliptype_' . $clip->cliptype, 'local_reasoningclip');
        $description = get_string('clip_description_' . $clip->cliptype, 'local_reasoningclip');

        $output .= html_writer::tag('strong', $cliptype_label);
        $output .= html_writer::tag('p', $description, array('class' => 'text-muted small'));
        $output .= html_writer::tag('small', 'Time spent: ' . format_time($clip->timespent));

        $output .= html_writer::end_div();
    }

    $output .= html_writer::end_div();
    $output .= html_writer::end_div();

    return $output;
}

?>

<!--
    EXAMPLE HTML TEMPLATE FOR QUIZ QUESTION WITH TRACKING

    Add this to your quiz question template (mod/quiz/templates/question.mustache)
-->

<div class="que multichoice" data-question-id="{{questionid}}">
    <div class="content">
        <div class="formulation">
            {{{questiontext}}}
        </div>

        <div class="ablock">
            <div class="answer">
                {{#answers}}
                <div class="r{{loop.index}}">
                    <input type="radio"
                           name="q{{questionid}}_answer"
                           value="{{id}}"
                           id="q{{questionid}}_answer_{{id}}"
                           data-question-tracker="true">
                    <label for="q{{questionid}}_answer_{{id}}">
                        {{{text}}}
                    </label>
                </div>
                {{/answers}}
            </div>
        </div>
    </div>
</div>

<script>
// Auto-initialize tracking when question is rendered
require(['local_reasoningclip/tracker'], function(Tracker) {
    var questionElement = document.querySelector('[data-question-id="{{questionid}}"]');
    if (questionElement) {
        var tracker = Tracker.init({
            questionId: {{questionid}},
            userId: {{userid}},
            courseId: {{courseid}},
            cmId: {{cmid}}
        });

        console.log('Reasoning clip tracker initialized for question {{questionid}}');
    }
});
</script>
