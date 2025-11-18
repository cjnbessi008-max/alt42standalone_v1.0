<?php
// This file is part of Moodle - http://moodle.org/
//
// Slope Sound - Problem Manager Class

namespace local_slopesound;

defined('MOODLE_INTERNAL') || die();

class problem_manager {

    /**
     * Get a single problem by ID
     *
     * @param int $problemid
     * @return object
     */
    public static function get_problem($problemid) {
        global $DB;

        $problem = $DB->get_record('slopesound_problems', ['id' => $problemid], '*', MUST_EXIST);
        return $problem;
    }

    /**
     * Get all problems or filter by quiz
     *
     * @param int|null $quizid
     * @return array
     */
    public static function get_problems($quizid = null) {
        global $DB;

        if ($quizid !== null) {
            return $DB->get_records('slopesound_problems', ['moodle_quiz_id' => $quizid]);
        }

        return $DB->get_records('slopesound_problems', null, 'difficulty_level ASC, id ASC');
    }

    /**
     * Create a new problem
     *
     * @param object $data
     * @return int Problem ID
     */
    public static function create_problem($data) {
        global $DB;

        $data->timecreated = time();
        $data->timemodified = time();

        return $DB->insert_record('slopesound_problems', $data);
    }

    /**
     * Update an existing problem
     *
     * @param int $problemid
     * @param object $data
     * @return bool
     */
    public static function update_problem($problemid, $data) {
        global $DB;

        $data->id = $problemid;
        $data->timemodified = time();

        return $DB->update_record('slopesound_problems', $data);
    }

    /**
     * Delete a problem
     *
     * @param int $problemid
     * @return bool
     */
    public static function delete_problem($problemid) {
        global $DB;

        return $DB->delete_records('slopesound_problems', ['id' => $problemid]);
    }
}
