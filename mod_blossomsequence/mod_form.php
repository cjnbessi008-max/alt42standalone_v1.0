<?php
/**
 * The main blossomsequence configuration form
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_blossomsequence_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('blossomsequencename', 'blossomsequence'), array('size'=>'64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields
        $this->standard_intro_elements();

        // Sequence type
        $mform->addElement('header', 'sequencesettings', get_string('sequencesettings', 'blossomsequence'));

        $sequencetypes = array(
            'fibonacci' => get_string('fibonacci', 'blossomsequence'),
            'arithmetic' => get_string('arithmetic', 'blossomsequence'),
            'geometric' => get_string('geometric', 'blossomsequence'),
            'square' => get_string('square', 'blossomsequence'),
            'prime' => get_string('prime', 'blossomsequence'),
            'custom' => get_string('custom', 'blossomsequence')
        );
        $mform->addElement('select', 'sequencetype', get_string('sequencetype', 'blossomsequence'), $sequencetypes);
        $mform->setDefault('sequencetype', 'fibonacci');
        $mform->addHelpButton('sequencetype', 'sequencetype', 'blossomsequence');

        // Petal count
        $mform->addElement('text', 'petalcount', get_string('petalcount', 'blossomsequence'), array('size'=>'10'));
        $mform->setType('petalcount', PARAM_INT);
        $mform->setDefault('petalcount', 8);
        $mform->addRule('petalcount', null, 'required', null, 'client');
        $mform->addRule('petalcount', null, 'numeric', null, 'client');
        $mform->addHelpButton('petalcount', 'petalcount', 'blossomsequence');

        // Difficulty level
        $difficulties = array();
        for ($i = 1; $i <= 5; $i++) {
            $difficulties[$i] = get_string('difficulty'.$i, 'blossomsequence');
        }
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'blossomsequence'), $difficulties);
        $mform->setDefault('difficulty', 1);
        $mform->addHelpButton('difficulty', 'difficulty', 'blossomsequence');

        // Custom sequence data (only visible when custom type is selected)
        $mform->addElement('textarea', 'sequencedata', get_string('sequencedata', 'blossomsequence'),
                          'wrap="virtual" rows="5" cols="50"');
        $mform->setType('sequencedata', PARAM_TEXT);
        $mform->addHelpButton('sequencedata', 'sequencedata', 'blossomsequence');
        $mform->disabledIf('sequencedata', 'sequencetype', 'neq', 'custom');

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Add any custom completion rules to the form.
     *
     * @return array Array of string IDs of added items, empty array if none
     */
    public function add_completion_rules() {
        $mform =& $this->_form;

        $mform->addElement('checkbox', 'completionsubmit', '', get_string('completionsubmit', 'blossomsequence'));
        return array('completionsubmit');
    }

    /**
     * Called during validation to determine if the completion rules are enabled.
     *
     * @param array $data Input data not yet validated.
     * @return bool True if one or more rules is enabled, false if none are.
     */
    public function completion_rule_enabled($data) {
        return !empty($data['completionsubmit']);
    }
}
