<?php
/**
 * The main mod_problemexplain configuration form
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_problemexplain_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('problemexplainname', 'problemexplain'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'problemexplainname', 'problemexplain');

        // Adding the standard "intro" and "introformat" fields.
        if ($CFG->branch >= 29) {
            $this->standard_intro_elements();
        } else {
            $this->add_intro_editor();
        }

        // Problem configuration fieldset
        $mform->addElement('header', 'problemconfig', get_string('problem_text', 'problemexplain'));

        // Problem text
        $mform->addElement('textarea', 'problem_text', get_string('problem_text', 'problemexplain'),
            array('rows' => 10, 'cols' => 80));
        $mform->setType('problem_text', PARAM_RAW);
        $mform->addRule('problem_text', null, 'required', null, 'client');
        $mform->addHelpButton('problem_text', 'problem_text', 'problemexplain');

        // Problem type
        $types = array(
            'arithmetic' => get_string('arithmetic', 'problemexplain'),
            'algebra' => get_string('algebra', 'problemexplain'),
            'geometry' => get_string('geometry', 'problemexplain'),
            'calculus' => get_string('calculus', 'problemexplain'),
            'statistics' => get_string('statistics', 'problemexplain'),
            'other' => get_string('other', 'problemexplain')
        );
        $mform->addElement('select', 'problem_type', get_string('problem_type', 'problemexplain'), $types);
        $mform->addHelpButton('problem_type', 'problem_type', 'problemexplain');

        // Explanation requirements fieldset
        $mform->addElement('header', 'requirements', get_string('requirements', 'core'));

        // Minimum steps
        $mform->addElement('text', 'min_steps', get_string('min_steps', 'problemexplain'), array('size' => '5'));
        $mform->setType('min_steps', PARAM_INT);
        $mform->setDefault('min_steps', 3);
        $mform->addRule('min_steps', null, 'required', null, 'client');
        $mform->addRule('min_steps', null, 'numeric', null, 'client');
        $mform->addHelpButton('min_steps', 'min_steps', 'problemexplain');

        // Maximum steps
        $mform->addElement('text', 'max_steps', get_string('max_steps', 'problemexplain'), array('size' => '5'));
        $mform->setType('max_steps', PARAM_INT);
        $mform->setDefault('max_steps', 10);
        $mform->addRule('max_steps', null, 'required', null, 'client');
        $mform->addRule('max_steps', null, 'numeric', null, 'client');
        $mform->addHelpButton('max_steps', 'max_steps', 'problemexplain');

        // AI and peer review settings fieldset
        $mform->addElement('header', 'feedback_settings', get_string('feedback', 'core'));

        // Enable AI evaluation
        $mform->addElement('advcheckbox', 'enable_ai_evaluation',
            get_string('enable_ai_evaluation', 'problemexplain'));
        $mform->setDefault('enable_ai_evaluation', 1);
        $mform->addHelpButton('enable_ai_evaluation', 'enable_ai_evaluation', 'problemexplain');

        // Enable peer review
        $mform->addElement('advcheckbox', 'enable_peer_review',
            get_string('enable_peer_review', 'problemexplain'));
        $mform->setDefault('enable_peer_review', 0);
        $mform->addHelpButton('enable_peer_review', 'enable_peer_review', 'problemexplain');

        // Peer reviews required
        $mform->addElement('text', 'peer_reviews_required',
            get_string('peer_reviews_required', 'problemexplain'), array('size' => '5'));
        $mform->setType('peer_reviews_required', PARAM_INT);
        $mform->setDefault('peer_reviews_required', 2);
        $mform->disabledIf('peer_reviews_required', 'enable_peer_review', 'notchecked');
        $mform->addHelpButton('peer_reviews_required', 'peer_reviews_required', 'problemexplain');

        // Grade settings
        $this->standard_grading_coursemodule_elements();

        // Standard coursemodule elements
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Add any custom completion rules
     *
     * @return array Array of string IDs of added items, empty array if none
     */
    public function add_completion_rules() {
        $mform = $this->_form;

        return array();
    }

    /**
     * Called during validation to see whether some module-specific completion rules are selected.
     *
     * @param array $data Input data not yet validated.
     * @return bool True if one or more rules is enabled, false if none are.
     */
    public function completion_rule_enabled($data) {
        return false;
    }

    /**
     * Enforce validation rules here
     *
     * @param array $data array of ("fieldname"=>value) of submitted data
     * @param array $files array of uploaded files "element_name"=>tmp_file_path
     * @return array of "element_name"=>"error_description" if there are errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Validate that min_steps <= max_steps
        if (isset($data['min_steps']) && isset($data['max_steps'])) {
            if ($data['min_steps'] > $data['max_steps']) {
                $errors['min_steps'] = get_string('error_minsteps', 'problemexplain', $data['max_steps']);
            }
        }

        // Validate that min_steps is at least 1
        if (isset($data['min_steps']) && $data['min_steps'] < 1) {
            $errors['min_steps'] = 'Minimum steps must be at least 1';
        }

        return $errors;
    }
}
