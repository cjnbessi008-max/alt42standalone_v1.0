<?php
/**
 * The mod_problemexplain submission created event.
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_problemexplain\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_problemexplain submission created event class.
 */
class submission_created extends \core\event\base {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'problemexplain_submissions';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Returns localised general event name.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('event_submission_created', 'problemexplain');
    }

    /**
     * Returns description of what happened.
     *
     * @return string
     */
    public function get_description() {
        return "The user with id '$this->userid' created a submission with id '$this->objectid' " .
            "for the problem explanation activity with course module id '$this->contextinstanceid'.";
    }

    /**
     * Returns relevant URL.
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/mod/problemexplain/view.php', array('id' => $this->contextinstanceid));
    }

    public static function get_objectid_mapping() {
        return array('db' => 'problemexplain_submissions', 'restore' => 'problemexplain_submission');
    }
}
