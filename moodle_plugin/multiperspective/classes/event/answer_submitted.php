<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Answer submitted event
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_multiperspective\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Answer submitted event class
 */
class answer_submitted extends \core\event\base {

    /**
     * Init method
     */
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'multiperspective_attempts';
    }

    /**
     * Get name
     */
    public static function get_name() {
        return get_string('eventanswersubmitted', 'mod_multiperspective');
    }

    /**
     * Get description
     */
    public function get_description() {
        $iscorrect = $this->other['is_correct'] ? 'correct' : 'incorrect';
        return "The user with id '$this->userid' submitted a $iscorrect answer for problem with id '{$this->other['problemid']}' " .
               "and achieved a score of {$this->other['score']}.";
    }

    /**
     * Get URL
     */
    public function get_url() {
        return new \moodle_url('/mod/multiperspective/view.php', array(
            'id' => $this->contextinstanceid,
            'p' => $this->other['problemid']
        ));
    }

    /**
     * Get objectid mapping
     */
    public static function get_objectid_mapping() {
        return array('db' => 'multiperspective_attempts', 'restore' => 'multiperspective_attempt');
    }

    /**
     * Custom validation
     */
    protected function validate_data() {
        parent::validate_data();

        if (!isset($this->other['problemid'])) {
            throw new \coding_exception('The \'problemid\' value must be set in other.');
        }

        if (!isset($this->other['score'])) {
            throw new \coding_exception('The \'score\' value must be set in other.');
        }

        if (!isset($this->other['is_correct'])) {
            throw new \coding_exception('The \'is_correct\' value must be set in other.');
        }
    }
}
