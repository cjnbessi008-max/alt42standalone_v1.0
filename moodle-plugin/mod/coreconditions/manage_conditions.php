<?php
/**
 * Page to manage the 3 core conditions for a problem
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');
require_once($CFG->libdir.'/formslib.php');

$cmid = required_param('cmid', PARAM_INT);
$problemid = required_param('problemid', PARAM_INT);

$cm = get_coursemodule_from_id('coreconditions', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$coreconditions = $DB->get_record('coreconditions', array('id' => $cm->instance), '*', MUST_EXIST);
$problem = $DB->get_record('coreconditions_problems', array('id' => $problemid), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/coreconditions:manageconditions', $context);

$PAGE->set_url('/mod/coreconditions/manage_conditions.php', array('cmid' => $cmid, 'problemid' => $problemid));
$PAGE->set_title(get_string('selectconditions', 'coreconditions'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $conditionsdata = array();

    for ($i = 1; $i <= 3; $i++) {
        $conditionsdata[] = array(
            'type' => required_param("condition{$i}_type", PARAM_TEXT),
            'name' => required_param("condition{$i}_name", PARAM_TEXT),
            'description' => required_param("condition{$i}_description", PARAM_TEXT),
            'rule' => required_param("condition{$i}_rule", PARAM_TEXT),
            'weight' => optional_param("condition{$i}_weight", 33.33, PARAM_FLOAT),
        );
    }

    try {
        \mod_coreconditions\condition_manager::save_all_conditions($problemid, $conditionsdata);
        redirect(new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid)),
            get_string('conditionssaved', 'coreconditions'), null, \core\output\notification::NOTIFY_SUCCESS);
    } catch (Exception $e) {
        echo $OUTPUT->notification($e->getMessage(), \core\output\notification::NOTIFY_ERROR);
    }
}

// Get existing conditions
$existingconditions = $DB->get_records('coreconditions_conditions',
    array('problem_id' => $problemid), 'condition_order ASC');

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('selectconditions', 'coreconditions') . ': ' . format_string($problem->name));

echo '<p class="alert alert-info">' . get_string('mustselect3', 'coreconditions') . '</p>';

// Display form
?>
<form method="post" action="" class="mform">
    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">

    <?php
    $conditiontypes = \mod_coreconditions\condition_manager::get_condition_types();

    for ($i = 1; $i <= 3; $i++) {
        $condition = null;
        foreach ($existingconditions as $cond) {
            if ($cond->condition_order == $i) {
                $condition = $cond;
                break;
            }
        }
        ?>

        <fieldset class="card mb-4">
            <legend class="card-header"><?php echo get_string('condition', 'coreconditions', $i); ?></legend>
            <div class="card-body">

                <div class="form-group row">
                    <label class="col-md-3 col-form-label" for="condition<?php echo $i; ?>_type">
                        <?php echo get_string('conditiontype', 'coreconditions'); ?>
                    </label>
                    <div class="col-md-9">
                        <select name="condition<?php echo $i; ?>_type" id="condition<?php echo $i; ?>_type"
                                class="form-control" required>
                            <option value="">Select type...</option>
                            <?php foreach ($conditiontypes as $key => $label): ?>
                                <option value="<?php echo $key; ?>"
                                    <?php echo ($condition && $condition->condition_type === $key) ? 'selected' : ''; ?>>
                                    <?php echo $label; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-md-3 col-form-label" for="condition<?php echo $i; ?>_name">
                        <?php echo get_string('conditionname', 'coreconditions'); ?>
                    </label>
                    <div class="col-md-9">
                        <input type="text" name="condition<?php echo $i; ?>_name"
                               id="condition<?php echo $i; ?>_name" class="form-control"
                               value="<?php echo $condition ? s($condition->condition_name) : ''; ?>" required>
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-md-3 col-form-label" for="condition<?php echo $i; ?>_description">
                        <?php echo get_string('conditiondescription', 'coreconditions'); ?>
                    </label>
                    <div class="col-md-9">
                        <textarea name="condition<?php echo $i; ?>_description"
                                  id="condition<?php echo $i; ?>_description"
                                  class="form-control" rows="3" required><?php
                            echo $condition ? s($condition->condition_description) : '';
                        ?></textarea>
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-md-3 col-form-label" for="condition<?php echo $i; ?>_rule">
                        <?php echo get_string('conditionrule', 'coreconditions'); ?>
                    </label>
                    <div class="col-md-9">
                        <textarea name="condition<?php echo $i; ?>_rule"
                                  id="condition<?php echo $i; ?>_rule"
                                  class="form-control" rows="4" required><?php
                            echo $condition ? s($condition->condition_rule) : '';
                        ?></textarea>
                        <small class="form-text text-muted">
                            Enter the validation logic or rule expression
                        </small>
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-md-3 col-form-label" for="condition<?php echo $i; ?>_weight">
                        <?php echo get_string('conditionweight', 'coreconditions'); ?>
                    </label>
                    <div class="col-md-9">
                        <input type="number" step="0.01" min="0" max="100"
                               name="condition<?php echo $i; ?>_weight"
                               id="condition<?php echo $i; ?>_weight" class="form-control"
                               value="<?php echo $condition ? $condition->condition_weight : '33.33'; ?>">
                        <small class="form-text text-muted">
                            Weight for grading (default 33.33%)
                        </small>
                    </div>
                </div>

            </div>
        </fieldset>

        <?php
    }
    ?>

    <div class="form-group">
        <button type="submit" class="btn btn-primary">Save Core Conditions</button>
        <a href="<?php echo new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid)); ?>"
           class="btn btn-secondary">Cancel</a>
    </div>
</form>

<?php
echo $OUTPUT->footer();
