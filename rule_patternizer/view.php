<?php
// This file is part of Rule Patternizer

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course module ID
$n = optional_param('n', 0, PARAM_INT);   // Activity instance ID

if ($id) {
    $cm = get_coursemodule_from_id('rulepatternizer', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $rulepatternizer = $DB->get_record('rulepatternizer', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $rulepatternizer = $DB->get_record('rulepatternizer', array('id' => $n), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $rulepatternizer->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('rulepatternizer', $rulepatternizer->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

require_capability('mod/rulepatternizer:view', $context);

// Completion
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Page setup
$PAGE->set_url('/mod/rulepatternizer/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($rulepatternizer->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add JavaScript and CSS
$PAGE->requires->css('/mod/rulepatternizer/styles/smartphone.css');
$PAGE->requires->js('/mod/rulepatternizer/amd/src/app.js');

// MathJax for LaTeX rendering
$PAGE->requires->js(new moodle_url('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'));

echo $OUTPUT->header();

// Display intro
if ($rulepatternizer->intro) {
    echo $OUTPUT->box(format_module_intro('rulepatternizer', $rulepatternizer, $cm->id), 'generalbox mod_introbox', 'rulepatternizerintro');
}

// Main content
?>

<div id="rulepatternizer-container">
    <div id="smartphone-frame">
        <div id="smartphone-screen">
            <div id="app-header">
                <h2>Rule Patternizer</h2>
                <div id="progress-indicator">
                    <span id="mastery-display">Mastery: 0%</span>
                </div>
            </div>

            <div id="app-content">
                <!-- Welcome Screen -->
                <div id="welcome-screen" class="screen active">
                    <h3><?php echo get_string('welcome', 'rulepatternizer'); ?></h3>
                    <p>Learn differentiation rules through pattern recognition!</p>

                    <!-- Recommendation Box -->
                    <div id="recommendation-box" style="display: none;">
                        <div class="recommendation-content">
                            <h4>📊 Recommended for You</h4>
                            <p id="recommendation-text"></p>
                        </div>
                    </div>

                    <button id="start-btn" class="btn-primary"><?php echo get_string('start_learning', 'rulepatternizer'); ?></button>
                    <button id="smart-practice-btn" class="btn-success" style="display: none;">🎯 Smart Practice</button>
                    <button id="progress-btn" class="btn-secondary"><?php echo get_string('view_progress', 'rulepatternizer'); ?></button>
                    <button id="insights-btn" class="btn-info" style="display: none;">💡 Learning Insights</button>
                </div>

                <!-- Rule Selection Screen -->
                <div id="rule-selection-screen" class="screen">
                    <h3>Select a Rule</h3>
                    <div id="rule-list"></div>
                    <button class="btn-back">Back</button>
                </div>

                <!-- Practice Screen -->
                <div id="practice-screen" class="screen">
                    <!-- Recommendation Info -->
                    <div id="practice-recommendation" class="recommendation-badge" style="display: none;">
                        <span id="practice-recommendation-text"></span>
                    </div>

                    <div id="rule-info">
                        <h3 id="rule-name"></h3>
                        <div id="rule-formula" class="formula-display"></div>
                    </div>

                    <div id="problem-area">
                        <h4>Problem:</h4>
                        <div id="problem-display" class="formula-display"></div>

                        <div id="answer-area">
                            <label for="user-answer">Your Answer:</label>
                            <input type="text" id="user-answer" placeholder="Enter your answer">
                            <button id="submit-answer-btn" class="btn-primary">Submit</button>
                            <button id="hint-btn" class="btn-secondary">Show Hint</button>
                        </div>

                        <div id="feedback-area"></div>
                        <div id="hint-area" style="display: none;"></div>
                    </div>

                    <div id="problem-controls">
                        <button id="next-problem-btn" class="btn-primary" style="display: none;">Next Problem</button>
                        <button class="btn-back">Back to Rules</button>
                    </div>
                </div>

                <!-- Progress Screen -->
                <div id="progress-screen" class="screen">
                    <h3>Your Progress</h3>
                    <div id="overall-stats"></div>
                    <div id="progress-list"></div>
                    <button class="btn-back">Back</button>
                </div>

                <!-- Learning Insights Screen -->
                <div id="insights-screen" class="screen">
                    <h3>💡 Learning Insights</h3>
                    <div id="insights-content">
                        <div id="insights-overview" class="insights-section"></div>
                        <div id="insights-strengths" class="insights-section" style="display: none;"></div>
                        <div id="insights-weaknesses" class="insights-section" style="display: none;"></div>
                        <div id="insights-review" class="insights-section" style="display: none;"></div>
                    </div>
                    <button class="btn-back">Back</button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Initialize app with configuration
window.RulePatternizer = {
    instanceId: <?php echo $rulepatternizer->id; ?>,
    cmId: <?php echo $cm->id; ?>,
    userId: <?php echo $USER->id; ?>,
    wwwroot: '<?php echo $CFG->wwwroot; ?>'
};
</script>

<?php
echo $OUTPUT->footer();
