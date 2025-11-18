<?php
/**
 * Form for student to create/edit their problem explanation
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * Explanation submission form
 */
class explanation_form extends moodleform {

    /**
     * Define the form
     */
    public function definition() {
        $mform = $this->_form;
        $problemexplain = $this->_customdata['problemexplain'];
        $submission = $this->_customdata['submission'];

        // Explanation title
        $mform->addElement('text', 'explanation_title',
            get_string('explanation_title', 'problemexplain'),
            array('size' => '60'));
        $mform->setType('explanation_title', PARAM_TEXT);
        $mform->addRule('explanation_title', get_string('error_notitle', 'problemexplain'), 'required', null, 'client');
        $mform->addHelpButton('explanation_title', 'explanation_title', 'problemexplain');

        // Number of steps (hidden field that will be updated by JavaScript)
        $mform->addElement('hidden', 'num_steps', 0);
        $mform->setType('num_steps', PARAM_INT);

        // Steps container
        $mform->addElement('html', '<div id="steps-container">');

        // Add initial steps (minimum required)
        $initial_steps = max($problemexplain->min_steps, 3);
        for ($i = 1; $i <= $initial_steps; $i++) {
            $this->add_step_elements($i, $problemexplain);
        }

        $mform->addElement('html', '</div>');

        // Add step button
        if ($problemexplain->max_steps > $initial_steps) {
            $mform->addElement('html', '<div class="step-controls">');
            $mform->addElement('button', 'add_step_btn',
                get_string('addstep', 'problemexplain'),
                array('id' => 'add-step-btn', 'class' => 'btn btn-secondary'));
            $mform->addElement('html', '</div>');
        }

        // Hidden fields
        $mform->addElement('hidden', 'id');
        $mform->setType('id', PARAM_INT);

        $mform->addElement('hidden', 'submission_id');
        $mform->setType('submission_id', PARAM_INT);

        $mform->addElement('hidden', 'action', 'save');
        $mform->setType('action', PARAM_ALPHA);

        // Action buttons
        $buttonarray = array();
        $buttonarray[] = $mform->createElement('submit', 'savedraft',
            get_string('savechanges'), array('class' => 'btn-primary'));
        $buttonarray[] = $mform->createElement('submit', 'submitbutton',
            get_string('submitexplanation', 'problemexplain'), array('class' => 'btn-success'));
        $buttonarray[] = $mform->createElement('cancel');
        $mform->addGroup($buttonarray, 'buttonar', '', ' ', false);

        // Add JavaScript for dynamic step management
        $this->add_step_management_js($problemexplain);
    }

    /**
     * Add form elements for a single step
     *
     * @param int $stepnum Step number
     * @param stdClass $problemexplain Problem explanation instance
     */
    private function add_step_elements($stepnum, $problemexplain) {
        $mform = $this->_form;

        $mform->addElement('html', '<div class="step-group" data-step="' . $stepnum . '">');
        $mform->addElement('header', 'step_header_' . $stepnum,
            get_string('step', 'problemexplain', $stepnum));

        // Step title
        $mform->addElement('text', 'step_title_' . $stepnum,
            get_string('step_title', 'problemexplain'),
            array('size' => '60', 'class' => 'step-title'));
        $mform->setType('step_title_' . $stepnum, PARAM_TEXT);
        $mform->addRule('step_title_' . $stepnum, null, 'required', null, 'client');
        $mform->addHelpButton('step_title_' . $stepnum, 'step_title', 'problemexplain');

        // Step explanation
        $mform->addElement('textarea', 'step_explanation_' . $stepnum,
            get_string('step_explanation', 'problemexplain'),
            array('rows' => 5, 'cols' => 80, 'class' => 'step-explanation'));
        $mform->setType('step_explanation_' . $stepnum, PARAM_RAW);
        $mform->addRule('step_explanation_' . $stepnum, null, 'required', null, 'client');
        $mform->addHelpButton('step_explanation_' . $stepnum, 'step_explanation', 'problemexplain');

        // Step reasoning
        $mform->addElement('textarea', 'step_reasoning_' . $stepnum,
            get_string('step_reasoning', 'problemexplain'),
            array('rows' => 3, 'cols' => 80, 'class' => 'step-reasoning'));
        $mform->setType('step_reasoning_' . $stepnum, PARAM_RAW);
        $mform->addHelpButton('step_reasoning_' . $stepnum, 'step_reasoning', 'problemexplain');

        // Remove button (only for steps beyond minimum)
        if ($stepnum > $problemexplain->min_steps) {
            $mform->addElement('html',
                '<button type="button" class="btn btn-danger btn-sm remove-step-btn" data-step="' . $stepnum . '">' .
                get_string('removestep', 'problemexplain') . '</button>');
        }

        $mform->addElement('html', '</div>');
    }

    /**
     * Add JavaScript for dynamic step management
     *
     * @param stdClass $problemexplain Problem explanation instance
     */
    private function add_step_management_js($problemexplain) {
        global $PAGE;

        $js = <<<EOD
<script>
require(['jquery'], function($) {
    var currentSteps = {$problemexplain->min_steps};
    var maxSteps = {$problemexplain->max_steps};
    var minSteps = {$problemexplain->min_steps};

    // Add step functionality
    $('#add-step-btn').click(function(e) {
        e.preventDefault();
        if (currentSteps < maxSteps) {
            currentSteps++;
            addStepGroup(currentSteps);
            updateNumSteps();

            if (currentSteps >= maxSteps) {
                $(this).prop('disabled', true);
            }
        }
    });

    // Remove step functionality
    $(document).on('click', '.remove-step-btn', function(e) {
        e.preventDefault();
        var stepNum = $(this).data('step');
        $('.step-group[data-step="' + stepNum + '"]').remove();
        currentSteps--;
        updateNumSteps();
        $('#add-step-btn').prop('disabled', false);
        renumberSteps();
    });

    function addStepGroup(stepNum) {
        var html = '<div class="step-group" data-step="' + stepNum + '">' +
            '<div class="fitem"><div class="fitemtitle"><h3>' +
            M.util.get_string('step', 'problemexplain').replace('{$a}', stepNum) + '</h3></div></div>' +
            '<div class="fitem"><div class="fitemtitle"><label>Step Title</label></div>' +
            '<div class="felement"><input type="text" name="step_title_' + stepNum + '" ' +
            'class="step-title" size="60" required /></div></div>' +
            '<div class="fitem"><div class="fitemtitle"><label>Step Explanation</label></div>' +
            '<div class="felement"><textarea name="step_explanation_' + stepNum + '" ' +
            'class="step-explanation" rows="5" cols="80" required></textarea></div></div>' +
            '<div class="fitem"><div class="fitemtitle"><label>Why is this step necessary?</label></div>' +
            '<div class="felement"><textarea name="step_reasoning_' + stepNum + '" ' +
            'class="step-reasoning" rows="3" cols="80"></textarea></div></div>' +
            '<button type="button" class="btn btn-danger btn-sm remove-step-btn" data-step="' + stepNum + '">' +
            'Remove Step</button></div>';

        $('#steps-container').append(html);
    }

    function updateNumSteps() {
        $('input[name="num_steps"]').val(currentSteps);
    }

    function renumberSteps() {
        var stepNum = 1;
        $('.step-group').each(function() {
            $(this).attr('data-step', stepNum);
            $(this).find('h3').first().text('Step ' + stepNum);
            $(this).find('.remove-step-btn').attr('data-step', stepNum);
            stepNum++;
        });
    }

    // Initialize
    updateNumSteps();
});
</script>
EOD;

        $this->_form->addElement('html', $js);
    }

    /**
     * Validate form data
     *
     * @param array $data array of submitted data
     * @param array $files array of uploaded files
     * @return array of errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);
        $problemexplain = $this->_customdata['problemexplain'];

        // Count actual steps submitted
        $stepcount = 0;
        for ($i = 1; $i <= $problemexplain->max_steps; $i++) {
            if (isset($data['step_title_' . $i]) && !empty($data['step_title_' . $i])) {
                $stepcount++;

                // Validate that explanation is not empty
                if (empty($data['step_explanation_' . $i])) {
                    $errors['step_explanation_' . $i] = get_string('error_emptystep', 'problemexplain', $i);
                }
            }
        }

        // Validate step count
        if ($stepcount < $problemexplain->min_steps) {
            $errors['general'] = get_string('error_minsteps', 'problemexplain', $problemexplain->min_steps);
        }

        if ($stepcount > $problemexplain->max_steps) {
            $errors['general'] = get_string('error_maxsteps', 'problemexplain', $problemexplain->max_steps);
        }

        return $errors;
    }
}
