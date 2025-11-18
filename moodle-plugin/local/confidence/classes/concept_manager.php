<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace local_confidence;

defined('MOODLE_INTERNAL') || die();

/**
 * Concept management class
 *
 * @package    local_confidence
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class concept_manager {

    /**
     * Create a new concept
     *
     * @param int $courseid Course ID
     * @param string $conceptname Concept name
     * @param string $description Description
     * @param string $category Category
     * @param int $displayorder Display order
     * @return object Created concept object
     */
    public static function create_concept($courseid, $conceptname, $description = '', $category = '', $displayorder = 0) {
        global $DB;

        $concept = new \stdClass();
        $concept->courseid = $courseid;
        $concept->conceptname = $conceptname;
        $concept->description = $description;
        $concept->category = $category;
        $concept->displayorder = $displayorder;
        $concept->timecreated = time();
        $concept->timemodified = time();

        $concept->id = $DB->insert_record('local_confidence_concepts', $concept);

        // Trigger event
        $event = \local_confidence\event\concept_created::create(array(
            'objectid' => $concept->id,
            'context' => \context_course::instance($courseid),
            'other' => array('conceptname' => $conceptname)
        ));
        $event->trigger();

        return $concept;
    }

    /**
     * Update an existing concept
     *
     * @param int $conceptid Concept ID
     * @param string $conceptname Concept name
     * @param string $description Description
     * @param string $category Category
     * @param int $displayorder Display order
     * @return bool Success
     */
    public static function update_concept($conceptid, $conceptname = null, $description = null, $category = null, $displayorder = null) {
        global $DB;

        $concept = $DB->get_record('local_confidence_concepts', array('id' => $conceptid), '*', MUST_EXIST);

        if ($conceptname !== null) {
            $concept->conceptname = $conceptname;
        }
        if ($description !== null) {
            $concept->description = $description;
        }
        if ($category !== null) {
            $concept->category = $category;
        }
        if ($displayorder !== null) {
            $concept->displayorder = $displayorder;
        }

        $concept->timemodified = time();

        $result = $DB->update_record('local_confidence_concepts', $concept);

        if ($result) {
            $event = \local_confidence\event\concept_updated::create(array(
                'objectid' => $concept->id,
                'context' => \context_course::instance($concept->courseid),
                'other' => array('conceptname' => $concept->conceptname)
            ));
            $event->trigger();
        }

        return $result;
    }

    /**
     * Delete a concept
     *
     * @param int $conceptid Concept ID
     * @return bool Success
     */
    public static function delete_concept($conceptid) {
        global $DB;

        $concept = $DB->get_record('local_confidence_concepts', array('id' => $conceptid), '*', MUST_EXIST);

        // Delete related scores first
        $DB->delete_records('local_confidence_scores', array('conceptid' => $conceptid));

        // Delete related alerts
        $DB->delete_records('local_confidence_alerts', array('conceptid' => $conceptid));

        // Delete the concept
        $result = $DB->delete_records('local_confidence_concepts', array('id' => $conceptid));

        if ($result) {
            $event = \local_confidence\event\concept_deleted::create(array(
                'objectid' => $conceptid,
                'context' => \context_course::instance($concept->courseid),
                'other' => array('conceptname' => $concept->conceptname)
            ));
            $event->trigger();
        }

        return $result;
    }

    /**
     * Get all concepts for a course
     *
     * @param int $courseid Course ID
     * @return array Array of concept objects
     */
    public static function get_course_concepts($courseid) {
        global $DB;

        return $DB->get_records('local_confidence_concepts',
            array('courseid' => $courseid),
            'displayorder ASC, conceptname ASC'
        );
    }

    /**
     * Get a single concept by ID
     *
     * @param int $conceptid Concept ID
     * @return object Concept object
     */
    public static function get_concept($conceptid) {
        global $DB;

        return $DB->get_record('local_confidence_concepts', array('id' => $conceptid), '*', MUST_EXIST);
    }

    /**
     * Get average score for a concept
     *
     * @param int $conceptid Concept ID
     * @return object Object with avg_score and count
     */
    public static function get_concept_average($conceptid) {
        global $DB;

        $sql = "SELECT AVG(score) as avg_score, COUNT(*) as count
                FROM {local_confidence_scores}
                WHERE conceptid = :conceptid";

        return $DB->get_record_sql($sql, array('conceptid' => $conceptid));
    }

    /**
     * Get score distribution for a concept
     *
     * @param int $conceptid Concept ID
     * @return array Distribution array (score => count)
     */
    public static function get_score_distribution($conceptid) {
        global $DB;

        $sql = "SELECT score, COUNT(*) as count
                FROM {local_confidence_scores}
                WHERE conceptid = :conceptid
                GROUP BY score
                ORDER BY score";

        $results = $DB->get_records_sql($sql, array('conceptid' => $conceptid));

        // Initialize distribution with all scores 1-5
        $distribution = array(1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0);

        foreach ($results as $result) {
            $distribution[$result->score] = $result->count;
        }

        return $distribution;
    }

    /**
     * Validate concept name is unique in course
     *
     * @param int $courseid Course ID
     * @param string $conceptname Concept name
     * @param int $excludeid Exclude this concept ID from check
     * @return bool True if unique
     */
    public static function is_concept_name_unique($courseid, $conceptname, $excludeid = 0) {
        global $DB;

        $params = array('courseid' => $courseid, 'conceptname' => $conceptname);
        $sql = "SELECT id FROM {local_confidence_concepts} WHERE courseid = :courseid AND conceptname = :conceptname";

        if ($excludeid > 0) {
            $sql .= " AND id != :excludeid";
            $params['excludeid'] = $excludeid;
        }

        return !$DB->record_exists_sql($sql, $params);
    }
}
