<?php
/**
 * Displays the Perm-Comb Rhythm activity
 *
 * @package    mod_permcombrhythm
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course Module ID

$cm = get_coursemodule_from_id('permcombrhythm', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$permcombrhythm = $DB->get_record('permcombrhythm', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/permcombrhythm:view', $context);

// Set page details
$PAGE->set_url('/mod/permcombrhythm/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($permcombrhythm->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output starts here
echo $OUTPUT->header();

// Show activity description
if ($permcombrhythm->intro) {
    echo $OUTPUT->box(format_module_intro('permcombrhythm', $permcombrhythm, $cm->id), 'generalbox mod_introbox', 'permcombrhythmintro');
}

// Main app container
?>
<div id="permcomb-rhythm-app">
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <iframe
                    id="rhythm-app-iframe"
                    src="<?php echo new moodle_url('/mod/permcombrhythm/app/index.html', array('id' => $permcombrhythm->id)); ?>"
                    frameborder="0"
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    </div>
</div>

<style>
.smartphone-container {
    display: flex;
    justify-content: flex-end;
    padding: 20px;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.smartphone-frame {
    width: 320px;
    height: 568px;
    border: 12px solid #333;
    border-radius: 36px;
    background: #000;
    box-shadow: 0 10px 50px rgba(0,0,0,0.3);
    position: relative;
}

.smartphone-frame::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 6px;
    background: #444;
    border-radius: 3px;
}

.smartphone-screen {
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
}

#rhythm-app-iframe {
    width: 100%;
    height: 100%;
    border: none;
}
</style>

<?php
echo $OUTPUT->footer();
