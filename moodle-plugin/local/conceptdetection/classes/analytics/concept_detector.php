<?php
/**
 * Concept Detector for automated concept identification
 *
 * Automatically detects and creates concepts from course content
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_conceptdetection\analytics;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/conceptdetection/classes/api/moodle_connector.php');

use local_conceptdetection\api\moodle_connector;

class concept_detector {

    /**
     * Automatically detect and create concepts for a course
     *
     * @param int $courseid Course ID
     * @return array Created concepts
     */
    public static function auto_detect_concepts($courseid) {
        global $DB;

        $created_concepts = array();

        // Get concepts from Moodle API
        $raw_concepts = moodle_connector::get_course_concepts($courseid);

        foreach ($raw_concepts as $raw_concept) {
            // Check if concept already exists
            $existing = $DB->get_record('local_conceptdetection_concepts', array(
                'courseid' => $courseid,
                'name' => $raw_concept['name'],
                'moduletype' => $raw_concept['source']
            ));

            if (!$existing) {
                $concept = new \stdClass();
                $concept->name = $raw_concept['name'];
                $concept->description = '';
                $concept->courseid = $courseid;
                $concept->moduletype = $raw_concept['source'];
                $concept->moduleid = $raw_concept['sourceid'];
                $concept->parentid = null;
                $concept->keywords = json_encode($raw_concept['keywords']);
                $concept->difficulty = self::estimate_difficulty($raw_concept);
                $concept->timecreated = time();
                $concept->timemodified = time();

                $concept->id = $DB->insert_record('local_conceptdetection_concepts', $concept);
                $created_concepts[] = $concept;
            }
        }

        return $created_concepts;
    }

    /**
     * Estimate difficulty level of a concept
     *
     * @param array $concept_data Concept data
     * @return int Difficulty level (1-5)
     */
    private static function estimate_difficulty($concept_data) {
        // Simple heuristic based on question type and keywords
        $difficulty = 3;  // Default medium difficulty

        if (isset($concept_data['type'])) {
            switch ($concept_data['type']) {
                case 'truefalse':
                case 'multichoice':
                    $difficulty = 2;
                    break;
                case 'shortanswer':
                case 'numerical':
                    $difficulty = 3;
                    break;
                case 'essay':
                case 'calculated':
                    $difficulty = 4;
                    break;
            }
        }

        // Adjust based on keywords (can be enhanced with ML)
        $advanced_keywords = array('proof', 'derive', 'analyze', 'evaluate', 'integral', 'derivative');
        $basic_keywords = array('identify', 'define', 'list', 'basic', 'simple');

        if (isset($concept_data['keywords'])) {
            $keywords = array_map('strtolower', $concept_data['keywords']);

            foreach ($advanced_keywords as $keyword) {
                if (in_array($keyword, $keywords)) {
                    $difficulty = min(5, $difficulty + 1);
                    break;
                }
            }

            foreach ($basic_keywords as $keyword) {
                if (in_array($keyword, $keywords)) {
                    $difficulty = max(1, $difficulty - 1);
                    break;
                }
            }
        }

        return $difficulty;
    }

    /**
     * Create manual concept
     *
     * @param array $data Concept data
     * @return object Created concept
     */
    public static function create_concept($data) {
        global $DB;

        $concept = new \stdClass();
        $concept->name = $data['name'];
        $concept->description = isset($data['description']) ? $data['description'] : '';
        $concept->courseid = $data['courseid'];
        $concept->moduletype = isset($data['moduletype']) ? $data['moduletype'] : null;
        $concept->moduleid = isset($data['moduleid']) ? $data['moduleid'] : null;
        $concept->parentid = isset($data['parentid']) ? $data['parentid'] : null;
        $concept->difficulty = isset($data['difficulty']) ? $data['difficulty'] : 3;
        $concept->timecreated = time();
        $concept->timemodified = time();

        // Process keywords
        if (isset($data['keywords'])) {
            if (is_array($data['keywords'])) {
                $concept->keywords = json_encode($data['keywords']);
            } else {
                $keywords = array_map('trim', explode(',', $data['keywords']));
                $concept->keywords = json_encode($keywords);
            }
        } else {
            $concept->keywords = json_encode(array());
        }

        $concept->id = $DB->insert_record('local_conceptdetection_concepts', $concept);

        return $concept;
    }

    /**
     * Get concepts for a course
     *
     * @param int $courseid Course ID
     * @param bool $include_hierarchy Include parent-child relationships
     * @return array Concepts
     */
    public static function get_course_concepts($courseid, $include_hierarchy = false) {
        global $DB;

        $concepts = $DB->get_records('local_conceptdetection_concepts',
            array('courseid' => $courseid), 'name ASC');

        if ($include_hierarchy) {
            // Build hierarchy tree
            $tree = array();
            $concepts_by_id = array();

            foreach ($concepts as $concept) {
                $concepts_by_id[$concept->id] = $concept;
                $concept->children = array();
            }

            foreach ($concepts as $concept) {
                if ($concept->parentid && isset($concepts_by_id[$concept->parentid])) {
                    $concepts_by_id[$concept->parentid]->children[] = $concept;
                } else {
                    $tree[] = $concept;
                }
            }

            return $tree;
        }

        return $concepts;
    }

    /**
     * Get students who didn't understand a concept
     *
     * @param int $conceptid Concept ID
     * @return array Students with not_understood status
     */
    public static function get_struggling_students($conceptid) {
        global $DB;

        $sql = "SELECT t.*, u.firstname, u.lastname, u.email
                FROM {local_conceptdetection_tracking} t
                JOIN {user} u ON u.id = t.userid
                WHERE t.conceptid = :conceptid
                AND t.status IN ('not_understood', 'partially_understood')
                ORDER BY t.confidence ASC, t.timemodified DESC";

        return $DB->get_records_sql($sql, array('conceptid' => $conceptid));
    }

    /**
     * Get concepts a student didn't understand
     *
     * @param int $userid User ID
     * @param int $courseid Optional course ID filter
     * @return array Concepts with not_understood status
     */
    public static function get_student_misunderstood_concepts($userid, $courseid = null) {
        global $DB;

        $params = array('userid' => $userid);
        $course_filter = '';

        if ($courseid) {
            $course_filter = 'AND c.courseid = :courseid';
            $params['courseid'] = $courseid;
        }

        $sql = "SELECT t.*, c.name as conceptname, c.description, c.courseid, c.difficulty
                FROM {local_conceptdetection_tracking} t
                JOIN {local_conceptdetection_concepts} c ON c.id = t.conceptid
                WHERE t.userid = :userid
                AND t.status IN ('not_understood', 'partially_understood')
                $course_filter
                ORDER BY t.confidence ASC, c.difficulty DESC";

        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Generate course-wide report
     *
     * @param int $courseid Course ID
     * @return array Report data
     */
    public static function generate_course_report($courseid) {
        global $DB;

        $report = array(
            'course' => $DB->get_record('course', array('id' => $courseid)),
            'concepts' => array(),
            'student_summary' => array()
        );

        // Get all concepts
        $concepts = self::get_course_concepts($courseid);

        foreach ($concepts as $concept) {
            $tracking_stats = $DB->get_records_sql(
                "SELECT status, COUNT(*) as count, AVG(confidence) as avg_confidence
                 FROM {local_conceptdetection_tracking}
                 WHERE conceptid = :conceptid
                 GROUP BY status",
                array('conceptid' => $concept->id)
            );

            $stats = array(
                'understood' => 0,
                'partially_understood' => 0,
                'not_understood' => 0,
                'not_started' => 0,
                'avg_confidence' => 0
            );

            $total = 0;
            foreach ($tracking_stats as $stat) {
                $stats[$stat->status] = $stat->count;
                $total += $stat->count;
            }

            $report['concepts'][$concept->id] = array(
                'concept' => $concept,
                'stats' => $stats,
                'total_students' => $total,
                'struggling_students' => self::get_struggling_students($concept->id)
            );
        }

        return $report;
    }

    /**
     * Track event for concept detection
     *
     * @param array $event_data Event data
     * @return int Event ID
     */
    public static function track_event($event_data) {
        global $DB;

        $event = new \stdClass();
        $event->userid = $event_data['userid'];
        $event->conceptid = isset($event_data['conceptid']) ? $event_data['conceptid'] : null;
        $event->eventtype = $event_data['eventtype'];
        $event->contextid = isset($event_data['contextid']) ? $event_data['contextid'] : null;
        $event->moduletype = isset($event_data['moduletype']) ? $event_data['moduletype'] : null;
        $event->moduleid = isset($event_data['moduleid']) ? $event_data['moduleid'] : null;
        $event->duration = isset($event_data['duration']) ? $event_data['duration'] : null;
        $event->result = isset($event_data['result']) ? $event_data['result'] : null;
        $event->timecreated = time();

        // Encode event data as JSON
        if (isset($event_data['data'])) {
            $event->eventdata = json_encode($event_data['data']);
        }

        return $DB->insert_record('local_conceptdetection_events', $event);
    }
}
