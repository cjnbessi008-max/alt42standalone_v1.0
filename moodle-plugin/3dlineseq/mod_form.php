<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_3dlineseq_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('sequencename', '3dlineseq'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Sequence type
        $sequencetypes = array(
            'arithmetic' => get_string('arithmetic', '3dlineseq'),
            'geometric' => get_string('geometric', '3dlineseq'),
            'fibonacci' => get_string('fibonacci', '3dlineseq'),
            'custom' => get_string('custom', '3dlineseq')
        );
        $mform->addElement('select', 'sequencetype', get_string('sequencetype', '3dlineseq'), $sequencetypes);
        $mform->addHelpButton('sequencetype', 'sequencetype', '3dlineseq');
        $mform->setDefault('sequencetype', 'arithmetic');

        // Sequence data
        $mform->addElement('textarea', 'sequencedata', get_string('sequencedata', '3dlineseq'),
            'wrap="virtual" rows="5" cols="50"');
        $mform->setType('sequencedata', PARAM_TEXT);
        $mform->addHelpButton('sequencedata', 'sequencedata', '3dlineseq');
        $mform->addRule('sequencedata', null, 'required', null, 'client');

        // Visual style
        $visualstyles = array(
            'line' => get_string('line', '3dlineseq'),
            'curve' => get_string('curve', '3dlineseq'),
            'spiral' => get_string('spiral', '3dlineseq'),
            'bars' => get_string('bars', '3dlineseq')
        );
        $mform->addElement('select', 'visualstyle', get_string('visualstyle', '3dlineseq'), $visualstyles);
        $mform->addHelpButton('visualstyle', 'visualstyle', '3dlineseq');
        $mform->setDefault('visualstyle', 'line');

        // Add standard elements.
        $this->standard_coursemodule_elements();

        // Add standard buttons.
        $this->add_action_buttons();
    }

    /**
     * Validates the form data
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Validate sequence data
        if (!empty($data['sequencedata'])) {
            $values = array_map('trim', explode(',', $data['sequencedata']));
            foreach ($values as $value) {
                if (!is_numeric($value)) {
                    $errors['sequencedata'] = get_string('error') . ': All values must be numeric';
                    break;
                }
            }

            if (count($values) < 2) {
                $errors['sequencedata'] = get_string('error') . ': At least 2 values are required';
            }
        }

        return $errors;
    }

    /**
     * Prepares data for editing
     */
    public function data_preprocessing(&$default_values) {
        parent::data_preprocessing($default_values);

        // Convert JSON to comma-separated values for textarea
        if (isset($default_values['sequencedata'])) {
            $data = json_decode($default_values['sequencedata'], true);
            if (is_array($data)) {
                $default_values['sequencedata'] = implode(', ', $data);
            }
        }
    }

    /**
     * Custom data processing before saving
     */
    public function data_postprocessing($data) {
        parent::data_postprocessing($data);

        // Convert comma-separated values to JSON array
        if (isset($data->sequencedata)) {
            $values = array_map('floatval', array_map('trim', explode(',', $data->sequencedata)));
            $data->sequencedata = json_encode($values);
        }

        return $data;
    }
}
