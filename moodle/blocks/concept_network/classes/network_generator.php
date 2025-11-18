<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace block_concept_network;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/blocks/concept_network/classes/data_collector.php');
require_once($CFG->dirroot . '/blocks/concept_network/classes/concept_extractor.php');

/**
 * Network Generator - Generates student concept networks
 *
 * @package    block_concept_network
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class network_generator {

    /** @var int Course ID */
    private $courseid;

    /** @var int Student ID */
    private $studentid;

    /** @var object Database instance */
    private $db;

    /** @var float Weight for co-occurrence */
    private $weight_cooccurrence;

    /** @var float Weight for temporal proximity */
    private $weight_temporal;

    /** @var float Weight for performance correlation */
    private $weight_performance;

    /** @var float Minimum relationship strength threshold */
    private $min_strength;

    /**
     * Constructor
     *
     * @param int $courseid Course ID
     * @param int $studentid Student ID
     */
    public function __construct($courseid, $studentid) {
        global $DB;
        $this->courseid = $courseid;
        $this->studentid = $studentid;
        $this->db = $DB;

        // Load settings or use defaults
        $this->weight_cooccurrence = get_config('block_concept_network', 'weight_cooccurrence') ?: 0.4;
        $this->weight_temporal = get_config('block_concept_network', 'weight_temporal') ?: 0.3;
        $this->weight_performance = get_config('block_concept_network', 'weight_performance') ?: 0.3;
        $this->min_strength = get_config('block_concept_network', 'min_relationship_strength') ?: 0.1;
    }

    /**
     * Get existing network or generate new one
     *
     * @return object Network data
     */
    public function get_or_generate_network() {
        // Try to get from cache first
        $cache = \cache::make('block_concept_network', 'networks');
        $cachekey = $this->courseid . '_' . $this->studentid;
        $cached = $cache->get($cachekey);

        if ($cached !== false) {
            return $cached;
        }

        // Try to get from database
        $network = $this->db->get_record('block_concept_network', array(
            'course_id' => $this->courseid,
            'student_id' => $this->studentid
        ));

        if ($network) {
            $networkdata = json_decode($network->network_data);
            // Check if network is recent (within cache TTL)
            $cachettl = get_config('block_concept_network', 'cache_ttl') ?: 3600;
            if (time() - $network->last_updated < $cachettl) {
                $cache->set($cachekey, $networkdata);
                return $networkdata;
            }
        }

        // Generate new network
        return $this->generate_network();
    }

    /**
     * Generate concept network for student
     *
     * @return object Network data with nodes and edges
     */
    public function generate_network() {
        // Step 1: Collect activity data
        $collector = new data_collector($this->courseid, $this->studentid);
        $activities = $collector->collect_all_activities();

        if (empty($activities)) {
            return $this->create_empty_network();
        }

        // Step 2: Extract concepts
        $extractor = new concept_extractor($this->courseid);
        $concepts = $extractor->extract_concepts($activities);

        if (empty($concepts)) {
            return $this->create_empty_network();
        }

        // Step 3: Create nodes
        $nodes = $this->create_nodes($concepts, $activities);

        // Step 4: Create edges (relationships)
        $edges = $this->create_edges($nodes, $activities);

        // Step 5: Calculate network statistics
        $stats = $this->calculate_statistics($nodes, $edges);

        // Step 6: Build network object
        $network = new \stdClass();
        $network->nodes = array_values($nodes);
        $network->edges = array_values($edges);
        $network->stats = $stats;

        // Step 7: Save to database
        $this->save_network($network);

        // Step 8: Cache the network
        $cache = \cache::make('block_concept_network', 'networks');
        $cachekey = $this->courseid . '_' . $this->studentid;
        $cache->set($cachekey, $network);

        return $network;
    }

    /**
     * Create nodes from concepts
     *
     * @param array $concepts Extracted concepts
     * @param array $activities Activity data
     * @return array Array of node objects
     */
    private function create_nodes($concepts, $activities) {
        $nodes = array();
        $nodeid = 1;

        foreach ($concepts as $conceptname => $conceptdata) {
            $node = new \stdClass();
            $node->id = $nodeid++;
            $node->name = $conceptname;
            $node->type = $conceptdata['type'];

            // Calculate mastery level
            $progress = $this->calculate_concept_mastery($conceptname, $activities);
            $node->mastery_level = $progress['mastery_level'];
            $node->total_attempts = $progress['total_attempts'];
            $node->successful_attempts = $progress['successful_attempts'];
            $node->avg_score = $progress['avg_score'];
            $node->first_encountered = $progress['first_encountered'];
            $node->last_practiced = $progress['last_practiced'];

            $nodes[$conceptname] = $node;
        }

        return $nodes;
    }

    /**
     * Calculate concept mastery for student
     *
     * @param string $conceptname Concept name
     * @param array $activities Activity data
     * @return array Mastery data
     */
    private function calculate_concept_mastery($conceptname, $activities) {
        $attempts = 0;
        $successful = 0;
        $scores = array();
        $timestamps = array();

        // Analyze quiz attempts
        if (isset($activities['quiz'])) {
            foreach ($activities['quiz'] as $quiz) {
                if ($this->activity_contains_concept($quiz, $conceptname)) {
                    $attempts++;
                    $scores[] = $quiz->maxscore > 0 ? ($quiz->score / $quiz->maxscore) * 100 : 0;
                    $timestamps[] = $quiz->timestamp;

                    if ($quiz->maxscore > 0 && ($quiz->score / $quiz->maxscore) >= 0.7) {
                        $successful++;
                    }
                }
            }
        }

        // Analyze assignments
        if (isset($activities['assign'])) {
            foreach ($activities['assign'] as $assign) {
                if ($this->activity_contains_concept($assign, $conceptname)) {
                    $attempts++;
                    if ($assign->score !== null && $assign->maxscore > 0) {
                        $scores[] = ($assign->score / $assign->maxscore) * 100;
                        if (($assign->score / $assign->maxscore) >= 0.7) {
                            $successful++;
                        }
                    }
                    $timestamps[] = $assign->timestamp;
                }
            }
        }

        // Calculate mastery level (0-100)
        $mastery = 0;
        if ($attempts > 0) {
            $successrate = $successful / $attempts;
            $avgscore = !empty($scores) ? array_sum($scores) / count($scores) : 0;
            // Mastery = 70% success rate + 30% average score
            $mastery = ($successrate * 70) + ($avgscore * 0.3);
        }

        return array(
            'mastery_level' => round($mastery, 2),
            'total_attempts' => $attempts,
            'successful_attempts' => $successful,
            'avg_score' => !empty($scores) ? round(array_sum($scores) / count($scores), 2) : 0,
            'first_encountered' => !empty($timestamps) ? min($timestamps) : null,
            'last_practiced' => !empty($timestamps) ? max($timestamps) : null
        );
    }

    /**
     * Check if activity contains concept
     *
     * @param object $activity Activity data
     * @param string $conceptname Concept name
     * @return bool True if contains concept
     */
    private function activity_contains_concept($activity, $conceptname) {
        // This would ideally check concept mappings
        // For now, simple name matching
        $activityid = isset($activity->quizid) ? $activity->quizid : (isset($activity->assignid) ? $activity->assignid : 0);
        $activitytype = isset($activity->quizid) ? 'quiz' : 'assign';

        if ($activityid == 0) {
            return false;
        }

        // Check database for mapping
        $mapping = $this->db->get_record('block_concept_mappings', array(
            'course_id' => $this->courseid,
            'activity_id' => $activityid,
            'activity_type' => $activitytype,
            'concept_name' => $conceptname
        ));

        return $mapping !== false;
    }

    /**
     * Create edges (relationships) between nodes
     *
     * @param array $nodes Node objects
     * @param array $activities Activity data
     * @return array Array of edge objects
     */
    private function create_edges($nodes, $activities) {
        $edges = array();
        $edgeid = 1;

        // Generate all concept pairs
        $concepts = array_keys($nodes);
        $pairs = array();

        for ($i = 0; $i < count($concepts); $i++) {
            for ($j = $i + 1; $j < count($concepts); $j++) {
                $pairs[] = array($concepts[$i], $concepts[$j]);
            }
        }

        // Calculate relationship strength for each pair
        foreach ($pairs as $pair) {
            list($concept_a, $concept_b) = $pair;

            $strength = $this->calculate_relationship_strength(
                $concept_a,
                $concept_b,
                $activities
            );

            if ($strength['total'] >= $this->min_strength) {
                $edge = new \stdClass();
                $edge->id = $edgeid++;
                $edge->source = $nodes[$concept_a]->id;
                $edge->target = $nodes[$concept_b]->id;
                $edge->source_name = $concept_a;
                $edge->target_name = $concept_b;
                $edge->strength = round($strength['total'], 2);
                $edge->type = $this->determine_relationship_type(
                    $nodes[$concept_a],
                    $nodes[$concept_b],
                    $strength
                );
                $edge->co_occurrence = $strength['co_occurrence_count'];
                $edge->temporal_distance = $strength['temporal_distance'];

                $edges[] = $edge;
            }
        }

        return $edges;
    }

    /**
     * Calculate relationship strength between two concepts
     *
     * @param string $concept_a First concept
     * @param string $concept_b Second concept
     * @param array $activities Activity data
     * @return array Strength components
     */
    private function calculate_relationship_strength($concept_a, $concept_b, $activities) {
        $cooccurrence = 0;
        $total_activities = 0;
        $timestamps_a = array();
        $timestamps_b = array();
        $scores_a = array();
        $scores_b = array();

        // Count co-occurrences in activities
        $allactivities = array_merge(
            isset($activities['quiz']) ? $activities['quiz'] : array(),
            isset($activities['assign']) ? $activities['assign'] : array()
        );

        foreach ($allactivities as $activity) {
            $total_activities++;
            $has_a = $this->activity_contains_concept($activity, $concept_a);
            $has_b = $this->activity_contains_concept($activity, $concept_b);

            if ($has_a && $has_b) {
                $cooccurrence++;
            }

            if ($has_a) {
                $timestamps_a[] = isset($activity->timestamp) ? $activity->timestamp : 0;
                if (isset($activity->score) && isset($activity->maxscore) && $activity->maxscore > 0) {
                    $scores_a[] = ($activity->score / $activity->maxscore) * 100;
                }
            }

            if ($has_b) {
                $timestamps_b[] = isset($activity->timestamp) ? $activity->timestamp : 0;
                if (isset($activity->score) && isset($activity->maxscore) && $activity->maxscore > 0) {
                    $scores_b[] = ($activity->score / $activity->maxscore) * 100;
                }
            }
        }

        // 1. Co-occurrence score
        $cooccurrence_score = $total_activities > 0 ? $cooccurrence / $total_activities : 0;

        // 2. Temporal proximity score
        $temporal_score = 0;
        if (!empty($timestamps_a) && !empty($timestamps_b)) {
            $avg_time_a = array_sum($timestamps_a) / count($timestamps_a);
            $avg_time_b = array_sum($timestamps_b) / count($timestamps_b);
            $time_diff = abs($avg_time_a - $avg_time_b);
            // Closer in time = higher score
            $temporal_score = 1 / (1 + log(1 + $time_diff / 86400)); // normalized by days
        }

        // 3. Performance correlation score
        $correlation_score = 0;
        if (count($scores_a) > 1 && count($scores_b) > 1) {
            // Align scores by matching indices
            $min_count = min(count($scores_a), count($scores_b));
            $aligned_a = array_slice($scores_a, 0, $min_count);
            $aligned_b = array_slice($scores_b, 0, $min_count);

            // Calculate Pearson correlation
            $correlation = $this->pearson_correlation($aligned_a, $aligned_b);
            $correlation_score = abs($correlation); // absolute value (0 to 1)
        }

        // Calculate total strength
        $total_strength = ($this->weight_cooccurrence * $cooccurrence_score) +
                         ($this->weight_temporal * $temporal_score) +
                         ($this->weight_performance * $correlation_score);

        return array(
            'total' => $total_strength,
            'co_occurrence_score' => $cooccurrence_score,
            'co_occurrence_count' => $cooccurrence,
            'temporal_score' => $temporal_score,
            'temporal_distance' => !empty($timestamps_a) && !empty($timestamps_b) ?
                abs(max($timestamps_a) - max($timestamps_b)) : 0,
            'correlation_score' => $correlation_score
        );
    }

    /**
     * Calculate Pearson correlation coefficient
     *
     * @param array $x First array of values
     * @param array $y Second array of values
     * @return float Correlation coefficient (-1 to 1)
     */
    private function pearson_correlation($x, $y) {
        $n = count($x);
        if ($n == 0 || $n != count($y)) {
            return 0;
        }

        $sum_x = array_sum($x);
        $sum_y = array_sum($y);
        $sum_xy = 0;
        $sum_x2 = 0;
        $sum_y2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sum_xy += $x[$i] * $y[$i];
            $sum_x2 += $x[$i] * $x[$i];
            $sum_y2 += $y[$i] * $y[$i];
        }

        $numerator = ($n * $sum_xy) - ($sum_x * $sum_y);
        $denominator = sqrt((($n * $sum_x2) - ($sum_x * $sum_x)) * (($n * $sum_y2) - ($sum_y * $sum_y)));

        if ($denominator == 0) {
            return 0;
        }

        return $numerator / $denominator;
    }

    /**
     * Determine relationship type
     *
     * @param object $node_a First node
     * @param object $node_b Second node
     * @param array $strength Strength data
     * @return string Relationship type
     */
    private function determine_relationship_type($node_a, $node_b, $strength) {
        // Prerequisite: one concept learned significantly before the other
        if ($node_a->first_encountered && $node_b->first_encountered) {
            $time_diff = abs($node_a->first_encountered - $node_b->first_encountered);
            if ($time_diff > 86400 * 7) { // More than 1 week apart
                return 'prerequisite';
            }
        }

        // Similar: high co-occurrence
        if ($strength['co_occurrence_score'] > 0.6) {
            return 'similar';
        }

        // Temporal: learned close in time
        if ($strength['temporal_score'] > 0.7) {
            return 'temporal';
        }

        // Difficulty: correlated performance
        if ($strength['correlation_score'] > 0.5) {
            return 'difficulty';
        }

        return 'related';
    }

    /**
     * Calculate network statistics
     *
     * @param array $nodes Nodes
     * @param array $edges Edges
     * @return object Statistics
     */
    private function calculate_statistics($nodes, $edges) {
        $stats = new \stdClass();
        $stats->total_concepts = count($nodes);
        $stats->total_relationships = count($edges);

        $mastery_levels = array_map(function($node) {
            return $node->mastery_level;
        }, $nodes);

        $stats->avg_mastery = count($mastery_levels) > 0 ?
            array_sum($mastery_levels) / count($mastery_levels) : 0;

        $stats->min_mastery = count($mastery_levels) > 0 ? min($mastery_levels) : 0;
        $stats->max_mastery = count($mastery_levels) > 0 ? max($mastery_levels) : 0;

        return $stats;
    }

    /**
     * Create empty network
     *
     * @return object Empty network
     */
    private function create_empty_network() {
        $network = new \stdClass();
        $network->nodes = array();
        $network->edges = array();
        $network->stats = new \stdClass();
        $network->stats->total_concepts = 0;
        $network->stats->total_relationships = 0;
        $network->stats->avg_mastery = 0;
        return $network;
    }

    /**
     * Save network to database
     *
     * @param object $network Network data
     * @return bool Success
     */
    private function save_network($network) {
        $time = time();

        // Save to main network table
        $record = $this->db->get_record('block_concept_network', array(
            'course_id' => $this->courseid,
            'student_id' => $this->studentid
        ));

        $networkrecord = new \stdClass();
        $networkrecord->course_id = $this->courseid;
        $networkrecord->student_id = $this->studentid;
        $networkrecord->network_data = json_encode($network);
        $networkrecord->last_updated = $time;
        $networkrecord->timemodified = $time;

        if ($record) {
            $networkrecord->id = $record->id;
            $this->db->update_record('block_concept_network', $networkrecord);
            $networkid = $record->id;

            // Delete old nodes and edges
            $this->db->delete_records('block_concept_edges', array('network_id' => $networkid));
            $this->db->delete_records('block_concept_nodes', array('network_id' => $networkid));
        } else {
            $networkrecord->timecreated = $time;
            $networkid = $this->db->insert_record('block_concept_network', $networkrecord);
        }

        // Save nodes
        $nodeidmap = array();
        foreach ($network->nodes as $node) {
            $noderecord = new \stdClass();
            $noderecord->network_id = $networkid;
            $noderecord->concept_name = $node->name;
            $noderecord->concept_type = $node->type;
            $noderecord->mastery_level = $node->mastery_level;
            $noderecord->total_attempts = $node->total_attempts;
            $noderecord->successful_attempts = $node->successful_attempts;
            $noderecord->avg_score = $node->avg_score;
            $noderecord->first_encountered = $node->first_encountered;
            $noderecord->last_practiced = $node->last_practiced;
            $noderecord->timecreated = $time;
            $noderecord->timemodified = $time;

            $dbid = $this->db->insert_record('block_concept_nodes', $noderecord);
            $nodeidmap[$node->id] = $dbid;
        }

        // Save edges
        foreach ($network->edges as $edge) {
            $edgerecord = new \stdClass();
            $edgerecord->network_id = $networkid;
            $edgerecord->source_node_id = $nodeidmap[$edge->source];
            $edgerecord->target_node_id = $nodeidmap[$edge->target];
            $edgerecord->relationship_type = $edge->type;
            $edgerecord->strength = $edge->strength;
            $edgerecord->co_occurrence_count = $edge->co_occurrence;
            $edgerecord->temporal_distance = $edge->temporal_distance;
            $edgerecord->timecreated = $time;
            $edgerecord->timemodified = $time;

            $this->db->insert_record('block_concept_edges', $edgerecord);
        }

        return true;
    }
}
