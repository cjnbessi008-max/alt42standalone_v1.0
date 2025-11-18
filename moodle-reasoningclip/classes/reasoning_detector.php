<?php
/**
 * Reasoning moment detection algorithm
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_reasoningclip;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for detecting key reasoning moments in student problem-solving
 */
class reasoning_detector {

    /**
     * Clip type constants
     */
    const CLIP_TYPE_BREAKTHROUGH = 'breakthrough';          // Aha moment - wrong to correct
    const CLIP_TYPE_STRUGGLE = 'struggle';                  // Extended struggle period
    const CLIP_TYPE_RAPID_SOLVE = 'rapid_solve';           // Quick correct answer
    const CLIP_TYPE_CORRECTION = 'correction';              // Self-correction
    const CLIP_TYPE_PAUSE_THINK = 'pause_think';           // Long pause before action
    const CLIP_TYPE_SYSTEMATIC = 'systematic';              // Systematic approach pattern
    const CLIP_TYPE_TRIAL_ERROR = 'trial_error';           // Trial and error pattern

    /**
     * Detection thresholds
     */
    const PAUSE_THRESHOLD = 5;           // 5 seconds pause
    const STRUGGLE_THRESHOLD = 30;       // 30 seconds of struggle
    const RAPID_THRESHOLD = 10;          // 10 seconds rapid solve
    const MIN_EVENTS = 3;                // Minimum events to analyze

    /**
     * Analyze a sequence of student events and detect reasoning moments
     *
     * @param array $events Array of student interaction events
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Array of detected clips with confidence scores
     */
    public static function detect_reasoning_moments($events, $questionid, $userid) {
        $clips = array();

        if (count($events) < self::MIN_EVENTS) {
            return $clips;
        }

        // Sort events by time
        usort($events, function($a, $b) {
            return $a['timecreated'] - $b['timecreated'];
        });

        // Detect different types of reasoning moments
        $clips = array_merge($clips, self::detect_breakthrough_moments($events, $questionid, $userid));
        $clips = array_merge($clips, self::detect_struggle_moments($events, $questionid, $userid));
        $clips = array_merge($clips, self::detect_rapid_solve($events, $questionid, $userid));
        $clips = array_merge($clips, self::detect_pause_think($events, $questionid, $userid));
        $clips = array_merge($clips, self::detect_systematic_approach($events, $questionid, $userid));
        $clips = array_merge($clips, self::detect_trial_error($events, $questionid, $userid));

        return $clips;
    }

    /**
     * Detect breakthrough moments (wrong answer → correct answer)
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_breakthrough_moments($events, $questionid, $userid) {
        $clips = array();
        $previous_incorrect = false;
        $incorrect_start = null;

        foreach ($events as $i => $event) {
            if ($event['eventtype'] === 'answer_submit') {
                $data = json_decode($event['eventdata'], true);

                if (isset($data['is_correct'])) {
                    if (!$data['is_correct']) {
                        if (!$previous_incorrect) {
                            $incorrect_start = $i;
                        }
                        $previous_incorrect = true;
                    } else if ($previous_incorrect && $data['is_correct']) {
                        // Breakthrough detected!
                        $time_spent = $event['timecreated'] - $events[$incorrect_start]['timecreated'];

                        $clips[] = array(
                            'userid' => $userid,
                            'questionid' => $questionid,
                            'cliptype' => self::CLIP_TYPE_BREAKTHROUGH,
                            'clipdata' => json_encode(array(
                                'start_event' => $incorrect_start,
                                'end_event' => $i,
                                'events' => array_slice($events, $incorrect_start, $i - $incorrect_start + 1),
                                'description' => 'Student had breakthrough after struggling',
                            )),
                            'timespent' => $time_spent,
                            'confidence' => self::calculate_breakthrough_confidence($events, $incorrect_start, $i),
                            'timecreated' => $event['timecreated']
                        );

                        $previous_incorrect = false;
                        $incorrect_start = null;
                    }
                }
            }
        }

        return $clips;
    }

    /**
     * Detect struggle moments (extended period of difficulty)
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_struggle_moments($events, $questionid, $userid) {
        $clips = array();
        $struggle_start = null;
        $incorrect_count = 0;

        foreach ($events as $i => $event) {
            if ($event['eventtype'] === 'answer_submit') {
                $data = json_decode($event['eventdata'], true);

                if (isset($data['is_correct']) && !$data['is_correct']) {
                    if ($struggle_start === null) {
                        $struggle_start = $i;
                    }
                    $incorrect_count++;

                    $time_spent = $event['timecreated'] - $events[$struggle_start]['timecreated'];

                    // If struggling for more than threshold
                    if ($time_spent > self::STRUGGLE_THRESHOLD && $incorrect_count >= 2) {
                        $clips[] = array(
                            'userid' => $userid,
                            'questionid' => $questionid,
                            'cliptype' => self::CLIP_TYPE_STRUGGLE,
                            'clipdata' => json_encode(array(
                                'start_event' => $struggle_start,
                                'end_event' => $i,
                                'events' => array_slice($events, $struggle_start, $i - $struggle_start + 1),
                                'incorrect_attempts' => $incorrect_count,
                                'description' => 'Student struggling with concept',
                            )),
                            'timespent' => $time_spent,
                            'confidence' => min(0.9, 0.6 + ($incorrect_count * 0.1)),
                            'timecreated' => $event['timecreated']
                        );

                        // Reset for next potential struggle
                        $struggle_start = $i;
                        $incorrect_count = 0;
                    }
                } else {
                    // Reset on correct answer
                    $struggle_start = null;
                    $incorrect_count = 0;
                }
            }
        }

        return $clips;
    }

    /**
     * Detect rapid solve (quick correct answer)
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_rapid_solve($events, $questionid, $userid) {
        $clips = array();
        $first_interaction = null;

        foreach ($events as $i => $event) {
            if ($first_interaction === null && in_array($event['eventtype'], ['input', 'click', 'focus'])) {
                $first_interaction = $i;
            }

            if ($event['eventtype'] === 'answer_submit') {
                $data = json_decode($event['eventdata'], true);

                if (isset($data['is_correct']) && $data['is_correct'] && $first_interaction !== null) {
                    $time_spent = $event['timecreated'] - $events[$first_interaction]['timecreated'];

                    if ($time_spent < self::RAPID_THRESHOLD) {
                        $clips[] = array(
                            'userid' => $userid,
                            'questionid' => $questionid,
                            'cliptype' => self::CLIP_TYPE_RAPID_SOLVE,
                            'clipdata' => json_encode(array(
                                'start_event' => $first_interaction,
                                'end_event' => $i,
                                'events' => array_slice($events, $first_interaction, $i - $first_interaction + 1),
                                'description' => 'Student solved quickly - strong understanding',
                            )),
                            'timespent' => $time_spent,
                            'confidence' => 0.8,
                            'timecreated' => $event['timecreated']
                        );
                    }
                }

                $first_interaction = null;
            }
        }

        return $clips;
    }

    /**
     * Detect pause-and-think moments (long pause before action)
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_pause_think($events, $questionid, $userid) {
        $clips = array();

        for ($i = 1; $i < count($events); $i++) {
            $time_gap = $events[$i]['timecreated'] - $events[$i-1]['timecreated'];

            if ($time_gap > self::PAUSE_THRESHOLD) {
                // Check if action after pause was significant (answer submit or major input)
                if (in_array($events[$i]['eventtype'], ['answer_submit', 'input'])) {
                    $clips[] = array(
                        'userid' => $userid,
                        'questionid' => $questionid,
                        'cliptype' => self::CLIP_TYPE_PAUSE_THINK,
                        'clipdata' => json_encode(array(
                            'before_event' => $i - 1,
                            'after_event' => $i,
                            'pause_duration' => $time_gap,
                            'events' => array($events[$i-1], $events[$i]),
                            'description' => 'Student paused to think before action',
                        )),
                        'timespent' => $time_gap,
                        'confidence' => min(0.9, 0.6 + (($time_gap - self::PAUSE_THRESHOLD) / 20)),
                        'timecreated' => $events[$i]['timecreated']
                    );
                }
            }
        }

        return $clips;
    }

    /**
     * Detect systematic approach patterns
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_systematic_approach($events, $questionid, $userid) {
        $clips = array();

        // Look for consistent, methodical patterns
        $input_events = array_filter($events, function($e) {
            return $e['eventtype'] === 'input';
        });

        if (count($input_events) >= 3) {
            $input_events = array_values($input_events);
            $intervals = array();

            for ($i = 1; $i < count($input_events); $i++) {
                $intervals[] = $input_events[$i]['timecreated'] - $input_events[$i-1]['timecreated'];
            }

            // Check for consistent intervals (systematic approach)
            $avg_interval = array_sum($intervals) / count($intervals);
            $variance = 0;
            foreach ($intervals as $interval) {
                $variance += pow($interval - $avg_interval, 2);
            }
            $variance /= count($intervals);
            $std_dev = sqrt($variance);

            // Low variance indicates systematic approach
            if ($std_dev < $avg_interval * 0.3 && $avg_interval > 2 && $avg_interval < 15) {
                $clips[] = array(
                    'userid' => $userid,
                    'questionid' => $questionid,
                    'cliptype' => self::CLIP_TYPE_SYSTEMATIC,
                    'clipdata' => json_encode(array(
                        'events' => $input_events,
                        'avg_interval' => $avg_interval,
                        'std_dev' => $std_dev,
                        'description' => 'Student showing systematic problem-solving approach',
                    )),
                    'timespent' => end($input_events)['timecreated'] - reset($input_events)['timecreated'],
                    'confidence' => 0.75,
                    'timecreated' => end($input_events)['timecreated']
                );
            }
        }

        return $clips;
    }

    /**
     * Detect trial-and-error patterns
     *
     * @param array $events Event sequence
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @return array Detected clips
     */
    private static function detect_trial_error($events, $questionid, $userid) {
        $clips = array();
        $rapid_changes = 0;
        $start_idx = null;

        for ($i = 1; $i < count($events); $i++) {
            if ($events[$i]['eventtype'] === 'input' && $events[$i-1]['eventtype'] === 'input') {
                $time_gap = $events[$i]['timecreated'] - $events[$i-1]['timecreated'];

                if ($time_gap < 3) {  // Rapid input changes
                    if ($start_idx === null) {
                        $start_idx = $i - 1;
                    }
                    $rapid_changes++;
                } else {
                    if ($rapid_changes >= 3) {
                        $clips[] = array(
                            'userid' => $userid,
                            'questionid' => $questionid,
                            'cliptype' => self::CLIP_TYPE_TRIAL_ERROR,
                            'clipdata' => json_encode(array(
                                'start_event' => $start_idx,
                                'end_event' => $i - 1,
                                'events' => array_slice($events, $start_idx, $i - $start_idx),
                                'rapid_changes' => $rapid_changes,
                                'description' => 'Student using trial-and-error approach',
                            )),
                            'timespent' => $events[$i-1]['timecreated'] - $events[$start_idx]['timecreated'],
                            'confidence' => min(0.85, 0.6 + ($rapid_changes * 0.05)),
                            'timecreated' => $events[$i-1]['timecreated']
                        );
                    }
                    $rapid_changes = 0;
                    $start_idx = null;
                }
            }
        }

        return $clips;
    }

    /**
     * Calculate confidence score for breakthrough detection
     *
     * @param array $events All events
     * @param int $start_idx Start index
     * @param int $end_idx End index
     * @return float Confidence score (0-1)
     */
    private static function calculate_breakthrough_confidence($events, $start_idx, $end_idx) {
        $time_spent = $events[$end_idx]['timecreated'] - $events[$start_idx]['timecreated'];
        $event_count = $end_idx - $start_idx;

        // Higher confidence for longer struggles and more attempts
        $confidence = 0.7;

        if ($time_spent > 20) {
            $confidence += 0.1;
        }
        if ($time_spent > 40) {
            $confidence += 0.1;
        }
        if ($event_count > 5) {
            $confidence += 0.1;
        }

        return min(0.95, $confidence);
    }

    /**
     * Save a detected clip to the database
     *
     * @param array $clip Clip data
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @param int $attemptid Attempt ID (optional)
     * @return int Clip ID
     */
    public static function save_clip($clip, $courseid, $cmid, $attemptid = null) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $clip['userid'];
        $record->courseid = $courseid;
        $record->cmid = $cmid;
        $record->questionid = $clip['questionid'];
        $record->attemptid = $attemptid;
        $record->cliptype = $clip['cliptype'];
        $record->clipdata = $clip['clipdata'];
        $record->timespent = $clip['timespent'];
        $record->confidence = $clip['confidence'];
        $record->timecreated = $clip['timecreated'];

        return $DB->insert_record('local_reasoningclip', $record);
    }

    /**
     * Get clips for a specific question
     *
     * @param int $questionid Question ID
     * @param int $userid User ID (optional)
     * @return array Array of clips
     */
    public static function get_clips($questionid, $userid = null) {
        global $DB;

        $params = array('questionid' => $questionid);
        if ($userid) {
            $params['userid'] = $userid;
        }

        return $DB->get_records('local_reasoningclip', $params, 'timecreated DESC');
    }
}
