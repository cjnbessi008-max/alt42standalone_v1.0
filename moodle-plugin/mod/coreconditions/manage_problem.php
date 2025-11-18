<?php
/**
 * Page to add or edit a problem
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$cmid = required_param('cmid', PARAM_INT);
$problemid = optional_param('problemid', 0, PARAM_INT);

$cm = get_coursemodule_from_id('coreconditions', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$coreconditions = $DB->get_record('coreconditions', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/coreconditions:manageconditions', $context);

$PAGE->set_url('/mod/coreconditions/manage_problem.php', array('cmid' => $cmid, 'problemid' => $problemid));
$PAGE->set_title($problemid ? get_string('editproblem', 'coreconditions') : get_string('addproblem', 'coreconditions'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$problem = null;
if ($problemid) {
    $problem = $DB->get_record('coreconditions_problems', array('id' => $problemid), '*', MUST_EXIST);
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $data = new stdClass();
    $data->coreconditions_id = $coreconditions->id;
    $data->name = required_param('name', PARAM_TEXT);
    $data->description = required_param('description', PARAM_RAW);
    $data->problem_type = required_param('problem_type', PARAM_TEXT);
    $data->difficulty_level = required_param('difficulty_level', PARAM_INT);
    $data->correct_answer = required_param('correct_answer', PARAM_TEXT);
    $data->metadata = optional_param('metadata', '', PARAM_RAW);
    $data->timemodified = time();

    if ($problemid) {
        $data->id = $problemid;
        $DB->update_record('coreconditions_problems', $data);
        $redirectmsg = get_string('problemsaved', 'coreconditions');
    } else {
        $data->timecreated = time();
        $newproblemid = $DB->insert_record('coreconditions_problems', $data);
        $redirectmsg = get_string('problemsaved', 'coreconditions');

        // Redirect to condition management
        redirect(new moodle_url('/mod/coreconditions/manage_conditions.php',
            array('cmid' => $cmid, 'problemid' => $newproblemid)), $redirectmsg);
    }

    redirect(new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid)),
        $redirectmsg, null, \core\output\notification::NOTIFY_SUCCESS);
}

echo $OUTPUT->header();
echo $OUTPUT->heading($problemid ? get_string('editproblem', 'coreconditions') : get_string('addproblem', 'coreconditions'));

// Problem types
$problemtypes = array(
    'fraction' => get_string('problemtype_fraction', 'coreconditions'),
    'algebra' => get_string('problemtype_algebra', 'coreconditions'),
    'geometry' => get_string('problemtype_geometry', 'coreconditions'),
    'arithmetic' => get_string('problemtype_arithmetic', 'coreconditions'),
    'other' => get_string('problemtype_other', 'coreconditions'),
);

?>
<form method="post" action="" class="mform">
    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="name">
            <?php echo get_string('problemname', 'coreconditions'); ?> <span class="text-danger">*</span>
        </label>
        <div class="col-md-9">
            <input type="text" name="name" id="name" class="form-control"
                   value="<?php echo $problem ? s($problem->name) : ''; ?>" required>
        </div>
    </div>

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="description">
            <?php echo get_string('problemdescription', 'coreconditions'); ?>
        </label>
        <div class="col-md-9">
            <textarea name="description" id="description" class="form-control" rows="5"><?php
                echo $problem ? s($problem->description) : '';
            ?></textarea>
        </div>
    </div>

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="problem_type">
            <?php echo get_string('problemtype', 'coreconditions'); ?> <span class="text-danger">*</span>
        </label>
        <div class="col-md-9">
            <select name="problem_type" id="problem_type" class="form-control" required>
                <option value="">Select type...</option>
                <?php foreach ($problemtypes as $key => $label): ?>
                    <option value="<?php echo $key; ?>"
                        <?php echo ($problem && $problem->problem_type === $key) ? 'selected' : ''; ?>>
                        <?php echo $label; ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
    </div>

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="difficulty_level">
            <?php echo get_string('difficultylevel', 'coreconditions'); ?> <span class="text-danger">*</span>
        </label>
        <div class="col-md-9">
            <select name="difficulty_level" id="difficulty_level" class="form-control" required>
                <?php for ($i = 1; $i <= 10; $i++): ?>
                    <option value="<?php echo $i; ?>"
                        <?php echo ($problem && $problem->difficulty_level == $i) ? 'selected' : ''; ?>>
                        Level <?php echo $i; ?>
                    </option>
                <?php endfor; ?>
            </select>
        </div>
    </div>

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="correct_answer">
            <?php echo get_string('correctanswer', 'coreconditions'); ?> <span class="text-danger">*</span>
        </label>
        <div class="col-md-9">
            <input type="text" name="correct_answer" id="correct_answer" class="form-control"
                   value="<?php echo $problem ? s($problem->correct_answer) : ''; ?>" required>
        </div>
    </div>

    <div class="form-group row">
        <label class="col-md-3 col-form-label" for="metadata">
            Metadata (JSON)
        </label>
        <div class="col-md-9">
            <textarea name="metadata" id="metadata" class="form-control" rows="5"><?php
                echo $problem ? s($problem->metadata) : '';
            ?></textarea>
            <small class="form-text text-muted">
                Optional JSON metadata for additional problem data
            </small>
        </div>
    </div>

    <div class="form-group">
        <button type="submit" class="btn btn-primary">
            <?php echo $problemid ? 'Update Problem' : 'Create Problem'; ?>
        </button>
        <a href="<?php echo new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid)); ?>"
           class="btn btn-secondary">Cancel</a>
    </div>
</form>

<?php
echo $OUTPUT->footer();
