<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Perspective management class
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_multiperspective;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing perspectives in multi-perspective practice
 */
class perspective {

    /** @var int Perspective ID */
    protected $id;

    /** @var int Problem ID */
    protected $problemid;

    /** @var string Perspective name */
    protected $perspective_name;

    /** @var string Perspective type */
    protected $perspective_type;

    /** @var string Content for this perspective */
    protected $content;

    /** @var int Content format */
    protected $content_format;

    /** @var string Hints for this perspective */
    protected $hints;

    /** @var string Media URL (image/video) */
    protected $media_url;

    /** @var int Sort order */
    protected $sort_order;

    /**
     * Constructor
     *
     * @param int $id Perspective ID (0 for new perspective)
     * @param stdClass|null $data Perspective data
     */
    public function __construct($id = 0, $data = null) {
        global $DB;

        if ($id > 0) {
            $this->id = $id;
            if ($data) {
                $this->load_from_object($data);
            } else {
                $this->load_from_db();
            }
        } elseif ($data) {
            $this->load_from_object($data);
        }
    }

    /**
     * Load perspective data from database
     */
    protected function load_from_db() {
        global $DB;

        $record = $DB->get_record('multiperspective_persp', array('id' => $this->id), '*', MUST_EXIST);
        $this->load_from_object($record);
    }

    /**
     * Load perspective data from object
     *
     * @param stdClass $data Perspective data
     */
    protected function load_from_object($data) {
        $this->id = isset($data->id) ? $data->id : 0;
        $this->problemid = $data->problemid;
        $this->perspective_name = $data->perspective_name;
        $this->perspective_type = $data->perspective_type;
        $this->content = $data->content;
        $this->content_format = isset($data->content_format) ? $data->content_format : FORMAT_HTML;
        $this->hints = isset($data->hints) ? $data->hints : null;
        $this->media_url = isset($data->media_url) ? $data->media_url : null;
        $this->sort_order = isset($data->sort_order) ? $data->sort_order : 0;
    }

    /**
     * Save perspective to database
     *
     * @return int Perspective ID
     */
    public function save() {
        global $DB;

        $data = new \stdClass();
        $data->problemid = $this->problemid;
        $data->perspective_name = $this->perspective_name;
        $data->perspective_type = $this->perspective_type;
        $data->content = $this->content;
        $data->content_format = $this->content_format;
        $data->hints = $this->hints;
        $data->media_url = $this->media_url;
        $data->sort_order = $this->sort_order;

        if ($this->id > 0) {
            $data->id = $this->id;
            $DB->update_record('multiperspective_persp', $data);
        } else {
            $data->timecreated = time();
            $this->id = $DB->insert_record('multiperspective_persp', $data);
        }

        return $this->id;
    }

    /**
     * Delete perspective and all related data
     *
     * @return bool Success
     */
    public function delete() {
        global $DB;

        if ($this->id <= 0) {
            return false;
        }

        // Delete view records
        $DB->delete_records('multiperspective_views', array('perspectiveid' => $this->id));

        // Delete perspective
        return $DB->delete_records('multiperspective_persp', array('id' => $this->id));
    }

    /**
     * Record that a user viewed this perspective
     *
     * @param int $userid User ID
     * @param int $timespent Time spent in seconds
     * @return bool Success
     */
    public function record_view($userid, $timespent = 0) {
        global $DB;

        $now = time();

        // Check if view record already exists
        $existing = $DB->get_record('multiperspective_views', array(
            'userid' => $userid,
            'perspectiveid' => $this->id
        ));

        if ($existing) {
            // Update existing record
            $existing->view_count++;
            $existing->time_spent += $timespent;
            $existing->last_viewed = $now;
            return $DB->update_record('multiperspective_views', $existing);
        } else {
            // Create new record
            $record = new \stdClass();
            $record->problemid = $this->problemid;
            $record->perspectiveid = $this->id;
            $record->userid = $userid;
            $record->view_count = 1;
            $record->time_spent = $timespent;
            $record->first_viewed = $now;
            $record->last_viewed = $now;
            return $DB->insert_record('multiperspective_views', $record);
        }
    }

    /**
     * Get view statistics for this perspective
     *
     * @return array Statistics array
     */
    public function get_view_statistics() {
        global $DB;

        $stats = array(
            'total_views' => 0,
            'unique_viewers' => 0,
            'average_time' => 0,
            'total_time' => 0
        );

        $sql = "SELECT SUM(view_count) as total_views,
                       COUNT(DISTINCT userid) as unique_viewers,
                       AVG(time_spent) as average_time,
                       SUM(time_spent) as total_time
                FROM {multiperspective_views}
                WHERE perspectiveid = ?";

        $record = $DB->get_record_sql($sql, array($this->id));

        if ($record && $record->total_views > 0) {
            $stats['total_views'] = $record->total_views;
            $stats['unique_viewers'] = $record->unique_viewers;
            $stats['average_time'] = round($record->average_time);
            $stats['total_time'] = round($record->total_time);
        }

        return $stats;
    }

    /**
     * Check if a user has viewed this perspective
     *
     * @param int $userid User ID
     * @return bool True if viewed
     */
    public function has_been_viewed_by($userid) {
        global $DB;

        return $DB->record_exists('multiperspective_views', array(
            'userid' => $userid,
            'perspectiveid' => $this->id
        ));
    }

    /**
     * Get the number of times a user has viewed this perspective
     *
     * @param int $userid User ID
     * @return int View count
     */
    public function get_view_count_by_user($userid) {
        global $DB;

        $record = $DB->get_record('multiperspective_views', array(
            'userid' => $userid,
            'perspectiveid' => $this->id
        ), 'view_count');

        return $record ? $record->view_count : 0;
    }

    // Getters and setters
    public function get_id() { return $this->id; }
    public function get_problemid() { return $this->problemid; }
    public function get_perspective_name() { return $this->perspective_name; }
    public function get_perspective_type() { return $this->perspective_type; }
    public function get_content() { return $this->content; }
    public function get_content_format() { return $this->content_format; }
    public function get_hints() { return $this->hints; }
    public function get_media_url() { return $this->media_url; }
    public function get_sort_order() { return $this->sort_order; }

    public function set_problemid($value) { $this->problemid = $value; }
    public function set_perspective_name($value) { $this->perspective_name = $value; }
    public function set_perspective_type($value) { $this->perspective_type = $value; }
    public function set_content($value) { $this->content = $value; }
    public function set_content_format($value) { $this->content_format = $value; }
    public function set_hints($value) { $this->hints = $value; }
    public function set_media_url($value) { $this->media_url = $value; }
    public function set_sort_order($value) { $this->sort_order = $value; }

    /**
     * Get all perspectives for a problem
     *
     * @param int $problemid Problem ID
     * @return array Array of perspective objects
     */
    public static function get_perspectives_by_problem($problemid) {
        global $DB;

        $perspectives = array();
        $records = $DB->get_records('multiperspective_persp',
            array('problemid' => $problemid), 'sort_order ASC');

        foreach ($records as $record) {
            $perspectives[] = new perspective(0, $record);
        }

        return $perspectives;
    }

    /**
     * Get perspective types
     *
     * @return array Array of perspective type options
     */
    public static function get_perspective_types() {
        return array(
            'visual' => get_string('perspective_type_visual', 'mod_multiperspective'),
            'algebraic' => get_string('perspective_type_algebraic', 'mod_multiperspective'),
            'geometric' => get_string('perspective_type_geometric', 'mod_multiperspective'),
            'real_world' => get_string('perspective_type_real_world', 'mod_multiperspective'),
            'conceptual' => get_string('perspective_type_conceptual', 'mod_multiperspective'),
            'numerical' => get_string('perspective_type_numerical', 'mod_multiperspective'),
        );
    }
}
