<?php
// This file is part of Moodle - http://moodle.org/
//
// Dancing Line Sorting Visualization
// Main entry point for the application

require_once('../../config.php');

require_login();

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/dancingline/index.php'));
$PAGE->set_title(get_string('pluginname', 'local_dancingline'));
$PAGE->set_heading(get_string('pluginname', 'local_dancingline'));

// Include JavaScript and CSS
$PAGE->requires->css('/local/dancingline/styles/styles.css');
$PAGE->requires->js('/local/dancingline/js/sorting-algorithms.js', true);
$PAGE->requires->js('/local/dancingline/js/dancingline.js', true);

echo $OUTPUT->header();

?>

<div class="dancing-line-container">
    <!-- Mobile Phone Frame -->
    <div class="phone-frame">
        <div class="phone-screen">
            <div class="app-header">
                <h2><?php echo get_string('app_title', 'local_dancingline'); ?></h2>
                <div class="controls">
                    <select id="algorithm-select">
                        <option value="bubble"><?php echo get_string('bubble_sort', 'local_dancingline'); ?></option>
                        <option value="selection"><?php echo get_string('selection_sort', 'local_dancingline'); ?></option>
                        <option value="insertion"><?php echo get_string('insertion_sort', 'local_dancingline'); ?></option>
                        <option value="quick"><?php echo get_string('quick_sort', 'local_dancingline'); ?></option>
                    </select>
                </div>
            </div>

            <!-- Vertical Number Line Canvas -->
            <div class="visualization-area">
                <canvas id="dancing-line-canvas"></canvas>
                <div class="number-line-container">
                    <div id="vertical-line"></div>
                    <div id="numbers-container"></div>
                </div>
            </div>

            <div class="app-controls">
                <button id="generate-btn" class="btn btn-primary">
                    <?php echo get_string('generate_numbers', 'local_dancingline'); ?>
                </button>
                <button id="start-btn" class="btn btn-success" disabled>
                    <?php echo get_string('start_sorting', 'local_dancingline'); ?>
                </button>
                <button id="pause-btn" class="btn btn-warning" disabled>
                    <?php echo get_string('pause', 'local_dancingline'); ?>
                </button>
                <button id="reset-btn" class="btn btn-secondary">
                    <?php echo get_string('reset', 'local_dancingline'); ?>
                </button>

                <div class="speed-control">
                    <label><?php echo get_string('speed', 'local_dancingline'); ?>:</label>
                    <input type="range" id="speed-slider" min="1" max="10" value="5">
                    <span id="speed-value">5</span>
                </div>
            </div>

            <div class="stats-panel">
                <div class="stat-item">
                    <span class="stat-label"><?php echo get_string('comparisons', 'local_dancingline'); ?>:</span>
                    <span id="comparisons-count" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label"><?php echo get_string('swaps', 'local_dancingline'); ?>:</span>
                    <span id="swaps-count" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label"><?php echo get_string('time', 'local_dancingline'); ?>:</span>
                    <span id="time-elapsed" class="stat-value">0s</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Problem Data from Moodle -->
    <div class="problem-info">
        <h3><?php echo get_string('problem_info', 'local_dancingline'); ?></h3>
        <div id="problem-description"></div>
        <div id="problem-numbers"></div>
    </div>
</div>

<script>
// Pass PHP data to JavaScript
const moodleConfig = {
    wwwroot: '<?php echo $CFG->wwwroot; ?>',
    sesskey: '<?php echo sesskey(); ?>',
    userid: <?php echo $USER->id; ?>
};
</script>

<?php
echo $OUTPUT->footer();
