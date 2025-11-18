<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Flow Moments Detection Algorithm
 *
 * Detects flow state (optimal learning state) based on student behavior patterns.
 * Based on Mihaly Csikszentmihalyi's Flow Theory.
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_flowmoments;

defined('MOODLE_INTERNAL') || die();

/**
 * Flow detection algorithm class
 */
class flow_detector {

    /** @var float Minimum flow score to be considered in flow state */
    const FLOW_THRESHOLD = 70.0;

    /** @var int Minimum duration (seconds) to qualify as a flow moment */
    const MIN_FLOW_DURATION = 120; // 2 minutes

    /** @var array Weights for different flow indicators */
    private $weights = [
        'time_consistency' => 0.25,      // Consistent time spent per action
        'error_rate' => 0.20,            // Optimal challenge level
        'continuity' => 0.15,            // No interruptions
        'input_rhythm' => 0.15,          // Steady input pattern
        'correction_rate' => 0.15,       // Appropriate self-correction
        'response_time' => 0.10,         // Consistent response times
    ];

    /**
     * Analyze behavior data and detect flow moments
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @param int $timestart Start time for analysis
     * @param int $timeend End time for analysis
     * @return array Array of detected flow moments
     */
    public function detect_flow_moments($userid, $courseid, $cmid, $timestart, $timeend) {
        global $DB;

        // Retrieve behavior tracking data for the time period
        $tracking_data = $DB->get_records_sql(
            "SELECT * FROM {local_flowmoments_tracking}
             WHERE userid = :userid
               AND courseid = :courseid
               AND cmid = :cmid
               AND timestamp >= :timestart
               AND timestamp <= :timeend
             ORDER BY timestamp ASC",
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'cmid' => $cmid,
                'timestart' => $timestart,
                'timeend' => $timeend,
            ]
        );

        if (empty($tracking_data)) {
            return [];
        }

        // Group data into time windows (5-minute windows)
        $windows = $this->create_time_windows($tracking_data, 300);

        // Analyze each window for flow indicators
        $flow_moments = [];
        $current_flow = null;

        foreach ($windows as $window) {
            $flow_score = $this->calculate_flow_score($window);
            $indicators = $this->get_flow_indicators($window);

            if ($flow_score >= self::FLOW_THRESHOLD) {
                // In flow state
                if ($current_flow === null) {
                    // Start new flow moment
                    $current_flow = [
                        'userid' => $userid,
                        'courseid' => $courseid,
                        'cmid' => $cmid,
                        'starttime' => $window['start_time'],
                        'endtime' => $window['end_time'],
                        'scores' => [$flow_score],
                        'indicators' => [$indicators],
                    ];
                } else {
                    // Continue existing flow moment
                    $current_flow['endtime'] = $window['end_time'];
                    $current_flow['scores'][] = $flow_score;
                    $current_flow['indicators'][] = $indicators;
                }
            } else {
                // Not in flow state
                if ($current_flow !== null) {
                    // End current flow moment
                    $duration = $current_flow['endtime'] - $current_flow['starttime'];
                    if ($duration >= self::MIN_FLOW_DURATION) {
                        $flow_moments[] = $this->finalize_flow_moment($current_flow);
                    }
                    $current_flow = null;
                }
            }
        }

        // Handle ongoing flow moment at the end
        if ($current_flow !== null) {
            $duration = $current_flow['endtime'] - $current_flow['starttime'];
            if ($duration >= self::MIN_FLOW_DURATION) {
                $flow_moments[] = $this->finalize_flow_moment($current_flow);
            }
        }

        return $flow_moments;
    }

    /**
     * Calculate overall flow score for a time window
     *
     * @param array $window Time window data
     * @return float Flow score (0-100)
     */
    private function calculate_flow_score($window) {
        $scores = [
            'time_consistency' => $this->calculate_time_consistency($window),
            'error_rate' => $this->calculate_error_rate($window),
            'continuity' => $this->calculate_continuity($window),
            'input_rhythm' => $this->calculate_input_rhythm($window),
            'correction_rate' => $this->calculate_correction_rate($window),
            'response_time' => $this->calculate_response_time($window),
        ];

        // Calculate weighted average
        $total_score = 0;
        foreach ($scores as $indicator => $score) {
            $total_score += $score * $this->weights[$indicator];
        }

        return round($total_score, 2);
    }

    /**
     * Calculate time consistency score
     * Measures if student spends consistent time on actions (not too fast/slow)
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_time_consistency($window) {
        $events = $window['events'];
        if (count($events) < 3) {
            return 50.0; // Not enough data
        }

        $time_diffs = [];
        for ($i = 1; $i < count($events); $i++) {
            $time_diffs[] = $events[$i]->timestamp - $events[$i - 1]->timestamp;
        }

        // Calculate coefficient of variation (CV)
        $mean = array_sum($time_diffs) / count($time_diffs);
        $variance = 0;
        foreach ($time_diffs as $diff) {
            $variance += pow($diff - $mean, 2);
        }
        $std_dev = sqrt($variance / count($time_diffs));
        $cv = ($mean > 0) ? ($std_dev / $mean) : 1.0;

        // Lower CV = more consistent = higher score
        // CV of 0.3 or less = excellent (100 points)
        // CV of 1.0 or more = poor (0 points)
        $score = max(0, min(100, 100 - ($cv * 100)));

        return $score;
    }

    /**
     * Calculate error rate score
     * Optimal challenge: 50-70% correctness (flow zone)
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_error_rate($window) {
        $events = $window['events'];
        $submit_events = array_filter($events, function($e) {
            return $e->eventtype === 'submit' || $e->eventtype === 'answer';
        });

        if (empty($submit_events)) {
            return 50.0; // No submissions, neutral score
        }

        $correct_count = 0;
        $total_count = 0;

        foreach ($submit_events as $event) {
            $data = json_decode($event->eventdata, true);
            if (isset($data['correct'])) {
                $total_count++;
                if ($data['correct']) {
                    $correct_count++;
                }
            }
        }

        if ($total_count === 0) {
            return 50.0;
        }

        $correctness = ($correct_count / $total_count) * 100;

        // Optimal zone: 50-70% correctness
        if ($correctness >= 50 && $correctness <= 70) {
            return 100.0; // Perfect flow zone
        } else if ($correctness < 50) {
            // Too difficult
            return max(0, $correctness * 2);
        } else {
            // Too easy
            return max(0, 100 - (($correctness - 70) * 2));
        }
    }

    /**
     * Calculate continuity score
     * Measures if there are long pauses/interruptions
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_continuity($window) {
        $events = $window['events'];
        if (count($events) < 2) {
            return 50.0;
        }

        $max_gap = 0;
        for ($i = 1; $i < count($events); $i++) {
            $gap = $events[$i]->timestamp - $events[$i - 1]->timestamp;
            $max_gap = max($max_gap, $gap);
        }

        // Long pauses indicate interruption
        // Gap of 60 seconds or less = excellent (100 points)
        // Gap of 180 seconds or more = poor (0 points)
        if ($max_gap <= 60) {
            return 100.0;
        } else if ($max_gap >= 180) {
            return 0.0;
        } else {
            return 100 - (($max_gap - 60) / 120 * 100);
        }
    }

    /**
     * Calculate input rhythm score
     * Measures steady, rhythmic interaction pattern
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_input_rhythm($window) {
        $events = $window['events'];
        $input_events = array_filter($events, function($e) {
            return in_array($e->eventtype, ['click', 'input', 'keypress', 'change']);
        });

        if (count($input_events) < 5) {
            return 50.0;
        }

        // Calculate inter-event intervals
        $intervals = [];
        $prev = null;
        foreach ($input_events as $event) {
            if ($prev !== null) {
                $intervals[] = $event->timestamp - $prev->timestamp;
            }
            $prev = $event;
        }

        // Rhythmic = low variance in intervals
        $mean = array_sum($intervals) / count($intervals);
        $variance = 0;
        foreach ($intervals as $interval) {
            $variance += pow($interval - $mean, 2);
        }
        $std_dev = sqrt($variance / count($intervals));

        // Lower standard deviation = more rhythmic
        $score = max(0, min(100, 100 - ($std_dev * 2)));

        return $score;
    }

    /**
     * Calculate correction rate score
     * Measures appropriate self-correction behavior
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_correction_rate($window) {
        $events = $window['events'];
        $correction_events = array_filter($events, function($e) {
            return $e->eventtype === 'correction' || $e->eventtype === 'undo' || $e->eventtype === 'backspace';
        });

        $total_events = count($events);
        if ($total_events === 0) {
            return 50.0;
        }

        $correction_ratio = count($correction_events) / $total_events;

        // Optimal correction rate: 10-30%
        // Too few = not thoughtful, too many = struggling
        if ($correction_ratio >= 0.10 && $correction_ratio <= 0.30) {
            return 100.0;
        } else if ($correction_ratio < 0.10) {
            return $correction_ratio * 1000; // Scale up low values
        } else {
            return max(0, 100 - (($correction_ratio - 0.30) * 200));
        }
    }

    /**
     * Calculate response time score
     * Measures consistent response times (not too fast/slow)
     *
     * @param array $window Time window data
     * @return float Score (0-100)
     */
    private function calculate_response_time($window) {
        $events = $window['events'];
        $response_events = array_filter($events, function($e) {
            return isset($e->timespent) && $e->timespent > 0;
        });

        if (count($response_events) < 3) {
            return 50.0;
        }

        $response_times = array_map(function($e) {
            return $e->timespent;
        }, $response_events);

        // Calculate coefficient of variation
        $mean = array_sum($response_times) / count($response_times);
        $variance = 0;
        foreach ($response_times as $time) {
            $variance += pow($time - $mean, 2);
        }
        $std_dev = sqrt($variance / count($response_times));
        $cv = ($mean > 0) ? ($std_dev / $mean) : 1.0;

        // Consistent response times = higher score
        $score = max(0, min(100, 100 - ($cv * 100)));

        return $score;
    }

    /**
     * Create time windows from tracking data
     *
     * @param array $tracking_data Raw tracking data
     * @param int $window_size Window size in seconds
     * @return array Array of time windows
     */
    private function create_time_windows($tracking_data, $window_size) {
        $windows = [];
        $events = array_values($tracking_data);

        if (empty($events)) {
            return $windows;
        }

        $start_time = $events[0]->timestamp;
        $end_time = $events[count($events) - 1]->timestamp;

        for ($t = $start_time; $t < $end_time; $t += $window_size) {
            $window_end = $t + $window_size;
            $window_events = array_filter($events, function($e) use ($t, $window_end) {
                return $e->timestamp >= $t && $e->timestamp < $window_end;
            });

            if (!empty($window_events)) {
                $windows[] = [
                    'start_time' => $t,
                    'end_time' => $window_end,
                    'events' => array_values($window_events),
                ];
            }
        }

        return $windows;
    }

    /**
     * Finalize flow moment data
     *
     * @param array $flow_data Raw flow moment data
     * @return array Finalized flow moment
     */
    private function finalize_flow_moment($flow_data) {
        $avg_score = array_sum($flow_data['scores']) / count($flow_data['scores']);

        // Merge all indicators
        $merged_indicators = [];
        foreach ($flow_data['indicators'] as $indicators) {
            foreach ($indicators as $key => $value) {
                if (!isset($merged_indicators[$key])) {
                    $merged_indicators[$key] = [];
                }
                $merged_indicators[$key][] = $value;
            }
        }

        // Average each indicator
        $final_indicators = [];
        foreach ($merged_indicators as $key => $values) {
            $final_indicators[$key] = array_sum($values) / count($values);
        }

        return [
            'userid' => $flow_data['userid'],
            'courseid' => $flow_data['courseid'],
            'cmid' => $flow_data['cmid'],
            'flowscore' => round($avg_score, 2),
            'starttime' => $flow_data['starttime'],
            'endtime' => $flow_data['endtime'],
            'duration' => $flow_data['endtime'] - $flow_data['starttime'],
            'indicators' => json_encode($final_indicators),
            'timecreated' => time(),
        ];
    }

    /**
     * Get detailed flow indicators for a time window
     *
     * @param array $window Time window data
     * @return array Flow indicators
     */
    private function get_flow_indicators($window) {
        return [
            'time_consistency' => $this->calculate_time_consistency($window),
            'error_rate' => $this->calculate_error_rate($window),
            'continuity' => $this->calculate_continuity($window),
            'input_rhythm' => $this->calculate_input_rhythm($window),
            'correction_rate' => $this->calculate_correction_rate($window),
            'response_time' => $this->calculate_response_time($window),
        ];
    }

    /**
     * Save detected flow moment to database
     *
     * @param array $flow_moment Flow moment data
     * @return int Inserted record ID
     */
    public function save_flow_moment($flow_moment) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $flow_moment['userid'];
        $record->courseid = $flow_moment['courseid'];
        $record->cmid = $flow_moment['cmid'];
        $record->attemptid = $flow_moment['attemptid'] ?? null;
        $record->questionid = $flow_moment['questionid'] ?? null;
        $record->flowscore = $flow_moment['flowscore'];
        $record->starttime = $flow_moment['starttime'];
        $record->endtime = $flow_moment['endtime'];
        $record->duration = $flow_moment['duration'];
        $record->indicators = $flow_moment['indicators'];
        $record->complexity = $flow_moment['complexity'] ?? 5;
        $record->timecreated = time();

        return $DB->insert_record('local_flowmoments_detected', $record);
    }
}
