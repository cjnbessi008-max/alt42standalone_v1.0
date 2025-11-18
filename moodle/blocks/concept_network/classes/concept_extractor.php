<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace block_concept_network;

defined('MOODLE_INTERNAL') || die();

/**
 * Concept Extractor - Extracts concepts from activities
 *
 * @package    block_concept_network
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class concept_extractor {

    /** @var int Course ID */
    private $courseid;

    /** @var object Database instance */
    private $db;

    /**
     * Constructor
     *
     * @param int $courseid Course ID
     */
    public function __construct($courseid) {
        global $DB;
        $this->courseid = $courseid;
        $this->db = $DB;
    }

    /**
     * Extract concepts from all activities
     *
     * @param array $activities Activity data from data_collector
     * @return array Array of concepts with metadata
     */
    public function extract_concepts($activities) {
        $concepts = array();

        // Extract from quizzes
        if (isset($activities['quiz'])) {
            foreach ($activities['quiz'] as $quiz) {
                $quizconcepts = $this->extract_from_quiz($quiz);
                $concepts = $this->merge_concepts($concepts, $quizconcepts);
            }
        }

        // Extract from assignments
        if (isset($activities['assign'])) {
            foreach ($activities['assign'] as $assignment) {
                $assignconcepts = $this->extract_from_assignment($assignment);
                $concepts = $this->merge_concepts($concepts, $assignconcepts);
            }
        }

        // Extract from forums
        if (isset($activities['forum'])) {
            foreach ($activities['forum'] as $post) {
                $forumconcepts = $this->extract_from_forum($post);
                $concepts = $this->merge_concepts($concepts, $forumconcepts);
            }
        }

        // Load manual mappings from database
        $manualmappings = $this->get_manual_mappings();
        $concepts = $this->merge_concepts($concepts, $manualmappings);

        return $concepts;
    }

    /**
     * Extract concepts from quiz activity
     *
     * @param object $quiz Quiz data
     * @return array Array of concepts
     */
    private function extract_from_quiz($quiz) {
        $concepts = array();

        // 1. Check for manual concept mappings
        $mappings = $this->get_concept_mappings('quiz', $quiz->quizid);
        foreach ($mappings as $mapping) {
            $concepts[$mapping->concept_name] = array(
                'name' => $mapping->concept_name,
                'type' => 'knowledge',
                'source' => 'manual_mapping',
                'activity_type' => 'quiz',
                'activity_id' => $quiz->quizid,
                'weight' => $mapping->weight
            );
        }

        // 2. Extract from quiz name/description
        $nameconcepts = $this->extract_from_text($quiz->quizname);
        foreach ($nameconcepts as $concept) {
            if (!isset($concepts[$concept])) {
                $concepts[$concept] = array(
                    'name' => $concept,
                    'type' => 'knowledge',
                    'source' => 'quiz_name',
                    'activity_type' => 'quiz',
                    'activity_id' => $quiz->quizid,
                    'weight' => 0.5
                );
            }
        }

        // 3. Extract from question tags
        if (isset($quiz->questions)) {
            foreach ($quiz->questions as $question) {
                if (isset($question->tags)) {
                    foreach ($question->tags as $tag) {
                        $tagconcept = $this->normalize_concept_name($tag);
                        if (!isset($concepts[$tagconcept])) {
                            $concepts[$tagconcept] = array(
                                'name' => $tagconcept,
                                'type' => 'knowledge',
                                'source' => 'question_tag',
                                'activity_type' => 'quiz',
                                'activity_id' => $quiz->quizid,
                                'weight' => 0.8
                            );
                        }
                    }
                }

                // Extract from question name
                $questionconcepts = $this->extract_from_text($question->name);
                foreach ($questionconcepts as $concept) {
                    if (!isset($concepts[$concept])) {
                        $concepts[$concept] = array(
                            'name' => $concept,
                            'type' => 'skill',
                            'source' => 'question_name',
                            'activity_type' => 'quiz',
                            'activity_id' => $quiz->quizid,
                            'weight' => 0.6
                        );
                    }
                }
            }
        }

        return $concepts;
    }

    /**
     * Extract concepts from assignment activity
     *
     * @param object $assignment Assignment data
     * @return array Array of concepts
     */
    private function extract_from_assignment($assignment) {
        $concepts = array();

        // 1. Check for manual concept mappings
        $mappings = $this->get_concept_mappings('assign', $assignment->assignid);
        foreach ($mappings as $mapping) {
            $concepts[$mapping->concept_name] = array(
                'name' => $mapping->concept_name,
                'type' => 'practice',
                'source' => 'manual_mapping',
                'activity_type' => 'assign',
                'activity_id' => $assignment->assignid,
                'weight' => $mapping->weight
            );
        }

        // 2. Extract from assignment name
        $nameconcepts = $this->extract_from_text($assignment->assignname);
        foreach ($nameconcepts as $concept) {
            if (!isset($concepts[$concept])) {
                $concepts[$concept] = array(
                    'name' => $concept,
                    'type' => 'practice',
                    'source' => 'assignment_name',
                    'activity_type' => 'assign',
                    'activity_id' => $assignment->assignid,
                    'weight' => 0.5
                );
            }
        }

        return $concepts;
    }

    /**
     * Extract concepts from forum post
     *
     * @param object $post Forum post data
     * @return array Array of concepts
     */
    private function extract_from_forum($post) {
        $concepts = array();

        // Use extracted keywords from post
        if (isset($post->keywords)) {
            foreach ($post->keywords as $keyword) {
                $concept = $this->normalize_concept_name($keyword);
                if (!isset($concepts[$concept])) {
                    $concepts[$concept] = array(
                        'name' => $concept,
                        'type' => 'general',
                        'source' => 'forum_keywords',
                        'activity_type' => 'forum',
                        'activity_id' => $post->forumid,
                        'weight' => 0.3
                    );
                }
            }
        }

        return $concepts;
    }

    /**
     * Extract concepts from text using pattern matching
     *
     * @param string $text Text to analyze
     * @return array Array of concept names
     */
    private function extract_from_text($text) {
        $concepts = array();

        // Remove special characters
        $text = preg_replace('/[^\w\s가-힣]/', ' ', $text);

        // Split into words/phrases
        $words = preg_split('/\s+/', $text);

        // Mathematical concept patterns
        $mathpatterns = array(
            // English patterns
            'fraction', 'algebra', 'geometry', 'calculus', 'trigonometry',
            'equation', 'inequality', 'function', 'derivative', 'integral',
            'matrix', 'vector', 'probability', 'statistics', 'ratio',
            'proportion', 'percentage', 'exponent', 'logarithm', 'polynomial',
            // Korean patterns
            '분수', '대수', '기하', '미적분', '삼각법',
            '방정식', '부등식', '함수', '도함수', '적분',
            '행렬', '벡터', '확률', '통계', '비율',
            '비례', '백분율', '지수', '로그', '다항식'
        );

        foreach ($words as $word) {
            $word = strtolower(trim($word));
            if (strlen($word) > 2) {
                // Check if word matches known math concepts
                foreach ($mathpatterns as $pattern) {
                    if (stripos($word, $pattern) !== false || stripos($pattern, $word) !== false) {
                        $concept = $this->normalize_concept_name($word);
                        $concepts[] = $concept;
                        break;
                    }
                }
            }
        }

        return array_unique($concepts);
    }

    /**
     * Get concept mappings from database
     *
     * @param string $activitytype Activity type (quiz, assign, etc)
     * @param int $activityid Activity ID
     * @return array Array of mapping records
     */
    private function get_concept_mappings($activitytype, $activityid) {
        return $this->db->get_records('block_concept_mappings', array(
            'course_id' => $this->courseid,
            'activity_type' => $activitytype,
            'activity_id' => $activityid
        ));
    }

    /**
     * Get all manual mappings for the course
     *
     * @return array Array of concepts from manual mappings
     */
    private function get_manual_mappings() {
        $concepts = array();
        $mappings = $this->db->get_records('block_concept_mappings', array(
            'course_id' => $this->courseid
        ));

        foreach ($mappings as $mapping) {
            $concepts[$mapping->concept_name] = array(
                'name' => $mapping->concept_name,
                'type' => 'general',
                'source' => 'manual_mapping',
                'activity_type' => $mapping->activity_type,
                'activity_id' => $mapping->activity_id,
                'weight' => $mapping->weight
            );
        }

        return $concepts;
    }

    /**
     * Merge concept arrays
     *
     * @param array $concepts1 First concept array
     * @param array $concepts2 Second concept array
     * @return array Merged concepts
     */
    private function merge_concepts($concepts1, $concepts2) {
        foreach ($concepts2 as $key => $concept) {
            if (!isset($concepts1[$key])) {
                $concepts1[$key] = $concept;
            } else {
                // Update weight to highest value
                if ($concept['weight'] > $concepts1[$key]['weight']) {
                    $concepts1[$key]['weight'] = $concept['weight'];
                }
            }
        }
        return $concepts1;
    }

    /**
     * Normalize concept name
     *
     * @param string $name Raw concept name
     * @return string Normalized name
     */
    private function normalize_concept_name($name) {
        // Convert to lowercase
        $name = strtolower(trim($name));

        // Remove extra spaces
        $name = preg_replace('/\s+/', ' ', $name);

        // Capitalize first letter
        $name = ucfirst($name);

        return $name;
    }

    /**
     * Map activities to concepts and store in database
     *
     * @param int $activityid Activity ID
     * @param string $activitytype Activity type
     * @param array $concepts Array of concept names
     * @param float $weight Weight/importance
     * @param bool $autogenerated Whether auto-generated
     * @return bool Success
     */
    public function map_activity_to_concepts($activityid, $activitytype, $concepts, $weight = 1.0, $autogenerated = true) {
        global $USER;

        foreach ($concepts as $conceptname) {
            // Check if mapping already exists
            $existing = $this->db->get_record('block_concept_mappings', array(
                'course_id' => $this->courseid,
                'activity_id' => $activityid,
                'activity_type' => $activitytype,
                'concept_name' => $conceptname
            ));

            $mapping = new \stdClass();
            $mapping->course_id = $this->courseid;
            $mapping->activity_id = $activityid;
            $mapping->activity_type = $activitytype;
            $mapping->concept_name = $conceptname;
            $mapping->weight = $weight;
            $mapping->is_auto_generated = $autogenerated ? 1 : 0;
            $mapping->timemodified = time();

            if ($existing) {
                $mapping->id = $existing->id;
                $this->db->update_record('block_concept_mappings', $mapping);
            } else {
                $mapping->timecreated = time();
                $this->db->insert_record('block_concept_mappings', $mapping);
            }
        }

        return true;
    }
}
