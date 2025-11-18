<?php
/**
 * Main analyzer class for extracting best thinking moments
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_bestmoments\analyzer;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/bestmoments/classes/analyzer/score_calculator.php');
require_once($CFG->dirroot . '/local/bestmoments/classes/collector/activity_collector.php');

/**
 * Moment Analyzer - Main analysis engine
 */
class moment_analyzer {

    /** @var \local_bestmoments\analyzer\score_calculator */
    private $calculator;

    /** @var \local_bestmoments\collector\activity_collector */
    private $collector;

    /**
     * Constructor
     */
    public function __construct() {
        $this->calculator = new score_calculator();
        $this->collector = new \local_bestmoments\collector\activity_collector();
    }

    /**
     * Run daily analysis for all active courses
     *
     * @return array Analysis results
     */
    public function run_daily_analysis() {
        global $DB;

        $start_time = time();
        $job_date = strtotime('today');

        // Create log entry
        $log_id = $this->create_log_entry($job_date, $start_time);

        try {
            // Get all active courses
            $courses = $DB->get_records('course', array('visible' => 1));

            $total_moments = 0;
            $total_activities = 0;

            foreach ($courses as $course) {
                if ($course->id == SITEID) {
                    continue; // Skip site course
                }

                $result = $this->analyze_course($course->id);
                $total_moments += $result['moments_extracted'];
                $total_activities += $result['activities_analyzed'];
            }

            // Update log entry
            $this->update_log_entry($log_id, 'completed', $total_activities, $total_moments, null, time());

            return array(
                'success' => true,
                'moments_extracted' => $total_moments,
                'activities_analyzed' => $total_activities,
                'execution_time' => time() - $start_time
            );

        } catch (\Exception $e) {
            // Update log entry with error
            $this->update_log_entry($log_id, 'failed', 0, 0, $e->getMessage(), time());

            throw $e;
        }
    }

    /**
     * Analyze a specific course
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time (default: today 00:00)
     * @param int $timeend End time (default: tomorrow 00:00)
     * @return array Analysis results
     */
    public function analyze_course($courseid, $timestart = null, $timeend = null) {
        global $DB;

        if ($timestart === null) {
            $timestart = strtotime('today');
        }
        if ($timeend === null) {
            $timeend = strtotime('tomorrow');
        }

        // Step 1: Collect activities
        $activities = $this->collector->collect_course_activities($courseid, $timestart, $timeend);

        // Step 2: Calculate scores for each activity
        $scored_activities = array();

        foreach ($activities as $activity) {
            $scores = $this->calculator->calculate_moment_score($activity);

            if ($scores['final_score'] >= BESTMOMENTS_MIN_SCORE) {
                $activity['scores'] = $scores;
                $scored_activities[] = $activity;
            }

            // Save to scores table
            $this->save_activity_score($activity, $scores);
        }

        // Step 3: Rank and select top moments
        usort($scored_activities, function($a, $b) {
            return $b['scores']['final_score'] <=> $a['scores']['final_score'];
        });

        $top_moments = array_slice($scored_activities, 0, BESTMOMENTS_MAX_MOMENTS_PER_DAY);

        // Step 4: Save moments
        $moments_saved = 0;
        foreach ($top_moments as $index => $moment) {
            $is_featured = ($index < 3) ? 1 : 0; // Top 3 are featured
            $this->save_moment($moment, $is_featured);
            $moments_saved++;
        }

        return array(
            'moments_extracted' => $moments_saved,
            'activities_analyzed' => count($activities)
        );
    }

    /**
     * Save activity score to database
     *
     * @param array $activity Activity data
     * @param array $scores Calculated scores
     * @return int Record ID
     */
    private function save_activity_score($activity, $scores) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $activity['userid'];
        $record->courseid = $activity['courseid'];
        $record->activitytype = $activity['type'];
        $record->activityid = $activity['activityid'];
        $record->attemptid = isset($activity['attemptid']) ? $activity['attemptid'] : null;
        $record->attempt_number = isset($activity['attempt_number']) ? $activity['attempt_number'] : 1;
        $record->time_spent = isset($activity['time_spent']) ? $activity['time_spent'] : 0;
        $record->success_rate = $scores['efficiency'] / 100;
        $record->improvement_from_previous = $scores['improvement'];
        $record->attempts_before_success = isset($activity['attempts']) ? $activity['attempts'] : 1;
        $record->collaboration_events = isset($activity['collaboration_count']) ? $activity['collaboration_count'] : 0;
        $record->raw_data = json_encode($activity);
        $record->timecreated = time();

        return $DB->insert_record('local_bestmoments_scores', $record);
    }

    /**
     * Save moment to database
     *
     * @param array $moment Moment data
     * @param int $is_featured Featured flag (0 or 1)
     * @return int Record ID
     */
    private function save_moment($moment, $is_featured = 0) {
        global $DB;

        $scores = $moment['scores'];

        $record = new \stdClass();
        $record->userid = $moment['userid'];
        $record->courseid = $moment['courseid'];
        $record->activitytype = $moment['type'];
        $record->activityid = $moment['activityid'];
        $record->momentdate = $moment['timestamp'];
        $record->score = $scores['final_score'];
        $record->efficiency_score = $scores['efficiency'];
        $record->creativity_score = $scores['creativity'];
        $record->improvement_score = $scores['improvement'];
        $record->persistence_score = $scores['persistence'];
        $record->collaboration_score = $scores['collaboration'];
        $record->description = $this->generate_description($moment);
        $record->context_data = json_encode($moment);
        $record->is_featured = $is_featured;
        $record->timecreated = time();
        $record->timemodified = time();

        return $DB->insert_record('local_bestmoments_moments', $record);
    }

    /**
     * Generate human-readable description of the moment
     *
     * @param array $moment Moment data
     * @return string Description
     */
    private function generate_description($moment) {
        $scores = $moment['scores'];

        // Find the strongest aspect
        $aspects = array(
            'efficiency' => $scores['efficiency'],
            'creativity' => $scores['creativity'],
            'improvement' => $scores['improvement'],
            'persistence' => $scores['persistence'],
            'collaboration' => $scores['collaboration']
        );

        arsort($aspects);
        $strongest = key($aspects);

        $descriptions = array(
            'efficiency' => '효율적인 문제 해결 능력을 보여주었습니다.',
            'creativity' => '창의적이고 독특한 접근 방법을 사용했습니다.',
            'improvement' => '이전 시도 대비 눈에 띄는 향상을 보였습니다.',
            'persistence' => '어려운 문제를 포기하지 않고 끈기있게 도전했습니다.',
            'collaboration' => '동료 학습자들에게 도움이 되는 기여를 했습니다.'
        );

        return $descriptions[$strongest];
    }

    /**
     * Create log entry for analysis job
     *
     * @param int $job_date Job date (Unix timestamp)
     * @param int $start_time Start time
     * @return int Log ID
     */
    private function create_log_entry($job_date, $start_time) {
        global $DB;

        $record = new \stdClass();
        $record->job_date = $job_date;
        $record->start_time = $start_time;
        $record->status = 'running';
        $record->activities_analyzed = 0;
        $record->moments_extracted = 0;
        $record->execution_time = 0;
        $record->timecreated = time();

        return $DB->insert_record('local_bestmoments_logs', $record);
    }

    /**
     * Update log entry with results
     *
     * @param int $log_id Log ID
     * @param string $status Status
     * @param int $activities_analyzed Activities count
     * @param int $moments_extracted Moments count
     * @param string $error_message Error message (if any)
     * @param int $end_time End time
     */
    private function update_log_entry($log_id, $status, $activities_analyzed,
                                     $moments_extracted, $error_message, $end_time) {
        global $DB;

        $record = $DB->get_record('local_bestmoments_logs', array('id' => $log_id));

        $record->status = $status;
        $record->activities_analyzed = $activities_analyzed;
        $record->moments_extracted = $moments_extracted;
        $record->error_message = $error_message;
        $record->end_time = $end_time;
        $record->execution_time = $end_time - $record->start_time;

        $DB->update_record('local_bestmoments_logs', $record);
    }
}
