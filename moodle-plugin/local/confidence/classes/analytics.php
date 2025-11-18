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
 * Analytics class for confidence scoring
 *
 * @package    local_confidence
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class analytics {

    /**
     * Get overall statistics for a course
     *
     * @param int $courseid Course ID
     * @return array Statistics array
     */
    public static function get_course_statistics($courseid) {
        global $DB;

        $context = \context_course::instance($courseid);

        // Get total students with capability
        $students = get_enrolled_users($context, 'local/confidence:submitconfidence');
        $total_students = count($students);

        // Get total concepts
        $total_concepts = $DB->count_records('local_confidence_concepts', array('courseid' => $courseid));

        // Get average confidence score
        $sql = "SELECT AVG(score) as avg_confidence
                FROM {local_confidence_scores}
                WHERE courseid = :courseid";
        $avg = $DB->get_record_sql($sql, array('courseid' => $courseid));

        // Get participation rate (students who have submitted at least one score)
        $sql = "SELECT COUNT(DISTINCT userid) as active_students
                FROM {local_confidence_scores}
                WHERE courseid = :courseid";
        $active = $DB->get_record_sql($sql, array('courseid' => $courseid));

        $participation_rate = $total_students > 0 ?
            ($active->active_students / $total_students) * 100 : 0;

        // Get students at risk count (avg score <= 2.5)
        $at_risk = self::get_at_risk_students($courseid);
        $at_risk_count = count($at_risk);

        return array(
            'total_students' => $total_students,
            'total_concepts' => $total_concepts,
            'avg_confidence' => $avg->avg_confidence ? round($avg->avg_confidence, 2) : 0,
            'participation_rate' => round($participation_rate, 1),
            'at_risk_count' => $at_risk_count
        );
    }

    /**
     * Get statistics for each concept in a course
     *
     * @param int $courseid Course ID
     * @return array Array of concept statistics
     */
    public static function get_concept_statistics($courseid) {
        global $DB;

        $sql = "SELECT c.id, c.conceptname, c.category,
                       AVG(s.score) as avg_score,
                       COUNT(s.id) as total_responses,
                       SUM(CASE WHEN s.score <= 2 THEN 1 ELSE 0 END) as low_confidence_count,
                       MIN(s.score) as min_score,
                       MAX(s.score) as max_score
                FROM {local_confidence_concepts} c
                LEFT JOIN {local_confidence_scores} s ON c.id = s.conceptid
                WHERE c.courseid = :courseid
                GROUP BY c.id, c.conceptname, c.category
                ORDER BY avg_score ASC NULLS LAST, c.conceptname ASC";

        $results = $DB->get_records_sql($sql, array('courseid' => $courseid));

        foreach ($results as $result) {
            $result->avg_score = $result->avg_score ? round($result->avg_score, 2) : null;
        }

        return $results;
    }

    /**
     * Get students who need attention (low average confidence)
     *
     * @param int $courseid Course ID
     * @param float $threshold Average score threshold (default 2.5)
     * @return array Array of student records
     */
    public static function get_at_risk_students($courseid, $threshold = 2.5) {
        global $DB;

        $sql = "SELECT u.id, u.firstname, u.lastname, u.email,
                       AVG(s.score) as avg_score,
                       COUNT(s.id) as concepts_rated,
                       COUNT(CASE WHEN s.score <= 2 THEN 1 END) as low_concepts_count
                FROM {user} u
                JOIN {local_confidence_scores} s ON u.id = s.userid
                JOIN {local_confidence_concepts} c ON s.conceptid = c.id
                WHERE s.courseid = :courseid
                GROUP BY u.id, u.firstname, u.lastname, u.email
                HAVING AVG(s.score) <= :threshold
                ORDER BY avg_score ASC";

        $students = $DB->get_records_sql($sql, array(
            'courseid' => $courseid,
            'threshold' => $threshold
        ));

        // Get low confidence concepts for each student
        foreach ($students as $student) {
            $low_concepts = \local_confidence\score_manager::get_low_confidence_concepts(
                $student->id,
                $courseid,
                2
            );

            $concept_names = array();
            foreach ($low_concepts as $concept) {
                $concept_names[] = $concept->conceptname;
            }

            $student->avg_score = round($student->avg_score, 2);
            $student->low_concepts = implode(', ', $concept_names);
        }

        return $students;
    }

    /**
     * Get detailed report for a specific concept
     *
     * @param int $conceptid Concept ID
     * @return array Report data
     */
    public static function get_concept_report($conceptid) {
        global $DB;

        $concept = $DB->get_record('local_confidence_concepts', array('id' => $conceptid), '*', MUST_EXIST);

        // Get score distribution
        $distribution = \local_confidence\concept_manager::get_score_distribution($conceptid);

        // Get average
        $stats = \local_confidence\concept_manager::get_concept_average($conceptid);

        // Get all student scores for this concept
        $sql = "SELECT s.*, u.firstname, u.lastname, u.email
                FROM {local_confidence_scores} s
                JOIN {user} u ON s.userid = u.id
                WHERE s.conceptid = :conceptid
                ORDER BY s.score ASC, u.lastname ASC, u.firstname ASC";

        $student_scores = $DB->get_records_sql($sql, array('conceptid' => $conceptid));

        return array(
            'concept' => $concept,
            'avg_score' => $stats->avg_score ? round($stats->avg_score, 2) : 0,
            'total_responses' => $stats->count,
            'distribution' => $distribution,
            'student_scores' => $student_scores
        );
    }

    /**
     * Get detailed report for a specific student
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Report data
     */
    public static function get_student_report($userid, $courseid) {
        global $DB;

        $user = $DB->get_record('user', array('id' => $userid), '*', MUST_EXIST);

        // Get all scores
        $scores = \local_confidence\score_manager::get_user_scores($userid, $courseid);

        // Calculate statistics
        $avg_score = \local_confidence\score_manager::get_user_average($userid, $courseid);

        // Get low confidence concepts
        $low_concepts = \local_confidence\score_manager::get_low_confidence_concepts($userid, $courseid, 2);

        // Count submitted scores
        $submitted_count = 0;
        $total_concepts = count($scores);
        foreach ($scores as $score) {
            if ($score->score !== null) {
                $submitted_count++;
            }
        }

        $completion_rate = $total_concepts > 0 ? ($submitted_count / $total_concepts) * 100 : 0;

        return array(
            'user' => $user,
            'avg_score' => $avg_score,
            'completion_rate' => round($completion_rate, 1),
            'submitted_count' => $submitted_count,
            'total_concepts' => $total_concepts,
            'scores' => $scores,
            'low_concepts' => $low_concepts
        );
    }

    /**
     * Get confidence trends over time for a course
     *
     * @param int $courseid Course ID
     * @param int $days Number of days to look back (default 30)
     * @return array Trend data
     */
    public static function get_confidence_trends($courseid, $days = 30) {
        global $DB;

        $cutoff = time() - ($days * 24 * 60 * 60);

        $sql = "SELECT DATE(FROM_UNIXTIME(h.timecreated)) as date,
                       AVG(h.newscore) as avg_score,
                       COUNT(*) as submission_count
                FROM {local_confidence_history} h
                JOIN {local_confidence_concepts} c ON h.conceptid = c.id
                WHERE c.courseid = :courseid AND h.timecreated >= :cutoff
                GROUP BY DATE(FROM_UNIXTIME(h.timecreated))
                ORDER BY date ASC";

        return $DB->get_records_sql($sql, array(
            'courseid' => $courseid,
            'cutoff' => $cutoff
        ));
    }

    /**
     * Export course data to array (for CSV/Excel export)
     *
     * @param int $courseid Course ID
     * @return array Export data
     */
    public static function export_course_data($courseid) {
        global $DB;

        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'local/confidence:submitconfidence');
        $concepts = \local_confidence\concept_manager::get_course_concepts($courseid);

        $export_data = array();

        // Header row
        $header = array('Student ID', 'Name', 'Email');
        foreach ($concepts as $concept) {
            $header[] = $concept->conceptname;
        }
        $header[] = 'Average';
        $export_data[] = $header;

        // Data rows
        foreach ($students as $student) {
            $row = array(
                $student->id,
                fullname($student),
                $student->email
            );

            $scores = \local_confidence\score_manager::get_user_scores($student->id, $courseid);
            $score_map = array();
            foreach ($scores as $score) {
                $score_map[$score->id] = $score->score !== null ? $score->score : '';
            }

            foreach ($concepts as $concept) {
                $row[] = isset($score_map[$concept->id]) ? $score_map[$concept->id] : '';
            }

            $avg = \local_confidence\score_manager::get_user_average($student->id, $courseid);
            $row[] = $avg > 0 ? $avg : '';

            $export_data[] = $row;
        }

        return $export_data;
    }
}
