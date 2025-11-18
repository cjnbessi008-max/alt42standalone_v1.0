<?php
/**
 * Student Profile Analyzer
 * Analyzes student learning patterns and builds comprehensive profiles
 * Compatible with PHP 7.1.9
 */

class StudentProfileAnalyzer {

    private $db;
    private $user_id;
    private $profile;

    const MASTERY_THRESHOLD = 0.75; // 75% mastery considered "learned"
    const REVIEW_THRESHOLD = 0.60;  // Below 60% needs review
    const MIN_ATTEMPTS_FOR_ASSESSMENT = 3; // Minimum attempts to assess mastery

    public function __construct($db, $user_id) {
        $this->db = $db;
        $this->user_id = $user_id;
        $this->profile = $this->load_or_create_profile();
    }

    /**
     * Load existing profile or create new one
     */
    private function load_or_create_profile() {
        $sql = "SELECT * FROM mdl_recommend_student_profile WHERE userid = :userid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['userid' => $this->user_id]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            // Create new profile
            $profile = $this->create_new_profile();
        }

        return $profile;
    }

    /**
     * Create new student profile with defaults
     */
    private function create_new_profile() {
        $sql = "INSERT INTO mdl_recommend_student_profile
                (userid, learning_style, current_level, preferred_difficulty,
                 study_pace, timecreated, timemodified)
                VALUES (:userid, 'balanced', 'beginner', 0.50, 'normal',
                        :time, :time)";

        try {
            $stmt = $this->db->prepare($sql);
            $time = time();
            $stmt->execute([
                'userid' => $this->user_id,
                'time' => $time
            ]);

            return [
                'id' => $this->db->lastInsertId(),
                'userid' => $this->user_id,
                'learning_style' => 'balanced',
                'current_level' => 'beginner',
                'preferred_difficulty' => 0.50,
                'study_pace' => 'normal',
                'total_study_time' => 0,
                'total_problems_attempted' => 0,
                'total_problems_correct' => 0,
                'accuracy_rate' => 0.0,
                'average_problem_time' => 0,
                'last_active' => $time,
                'timecreated' => $time,
                'timemodified' => $time
            ];
        } catch (PDOException $e) {
            error_log("Error creating student profile: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update profile with new learning activity
     */
    public function update_from_activity($question_id, $is_correct, $time_spent, $concepts = []) {
        // Update basic stats
        $this->profile['total_problems_attempted']++;
        if ($is_correct) {
            $this->profile['total_problems_correct']++;
        }
        $this->profile['total_study_time'] += $time_spent;

        // Recalculate accuracy
        $this->profile['accuracy_rate'] = $this->profile['total_problems_attempted'] > 0
            ? $this->profile['total_problems_correct'] / $this->profile['total_problems_attempted']
            : 0.0;

        // Update average time
        $this->profile['average_problem_time'] = $this->profile['total_problems_attempted'] > 0
            ? $this->profile['total_study_time'] / $this->profile['total_problems_attempted']
            : 0;

        // Update last active
        $this->profile['last_active'] = time();

        // Update level based on performance
        $this->update_level();

        // Update learning style based on patterns
        $this->detect_learning_style();

        // Update pace
        $this->detect_study_pace();

        // Save to database
        $this->save_profile();

        // Update concept mastery
        if (!empty($concepts)) {
            $this->update_concept_mastery($concepts, $is_correct, $time_spent);
        }
    }

    /**
     * Determine student level based on overall performance
     */
    private function update_level() {
        $avg_mastery = $this->get_average_concept_mastery();
        $accuracy = $this->profile['accuracy_rate'];

        if ($this->profile['total_problems_attempted'] < 5) {
            $this->profile['current_level'] = 'beginner';
        } elseif ($avg_mastery >= 0.80 && $accuracy >= 0.80) {
            $this->profile['current_level'] = 'advanced';
        } elseif ($avg_mastery >= 0.60 && $accuracy >= 0.65) {
            $this->profile['current_level'] = 'intermediate';
        } else {
            $this->profile['current_level'] = 'beginner';
        }
    }

    /**
     * Detect learning style from behavior patterns
     */
    private function detect_learning_style() {
        // Analyze Vector Digest usage
        $digest_usage = $this->get_digest_usage_stats();

        if ($digest_usage['view_rate'] > 0.8) {
            $this->profile['learning_style'] = 'visual';
        } elseif ($this->profile['average_problem_time'] > 180) {
            $this->profile['learning_style'] = 'analytical';
        } elseif ($this->profile['total_problems_attempted'] > 50 &&
                  $digest_usage['view_rate'] < 0.3) {
            $this->profile['learning_style'] = 'practical';
        } else {
            $this->profile['learning_style'] = 'balanced';
        }
    }

    /**
     * Detect study pace
     */
    private function detect_study_pace() {
        $avg_time = $this->profile['average_problem_time'];

        if ($avg_time < 60) {
            $this->profile['study_pace'] = 'fast';
        } elseif ($avg_time > 180) {
            $this->profile['study_pace'] = 'slow';
        } else {
            $this->profile['study_pace'] = 'normal';
        }
    }

    /**
     * Get average mastery across all concepts
     */
    private function get_average_concept_mastery() {
        $sql = "SELECT AVG(mastery_score) as avg_mastery
                FROM mdl_recommend_concept_mastery
                WHERE userid = :userid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (float)$result['avg_mastery'] : 0.0;
        } catch (PDOException $e) {
            error_log("Error getting average mastery: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Get digest usage statistics
     */
    private function get_digest_usage_stats() {
        $sql = "SELECT
                    COUNT(*) as total_problems,
                    SUM(CASE WHEN digest_viewed = 1 THEN 1 ELSE 0 END) as digests_viewed,
                    SUM(CASE WHEN digest_helpful = 1 THEN 1 ELSE 0 END) as digests_helpful
                FROM mdl_recommend_learning_history
                WHERE userid = :userid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result && $result['total_problems'] > 0) {
                return [
                    'view_rate' => $result['digests_viewed'] / $result['total_problems'],
                    'helpful_rate' => $result['digests_viewed'] > 0
                        ? $result['digests_helpful'] / $result['digests_viewed']
                        : 0
                ];
            }
        } catch (PDOException $e) {
            error_log("Error getting digest stats: " . $e->getMessage());
        }

        return ['view_rate' => 0, 'helpful_rate' => 0];
    }

    /**
     * Update concept mastery scores
     */
    private function update_concept_mastery($concepts, $is_correct, $time_spent) {
        foreach ($concepts as $concept) {
            $mastery = $this->get_or_create_concept_mastery($concept);

            // Update stats
            $mastery['problems_attempted']++;
            if ($is_correct) {
                $mastery['problems_correct']++;
            }
            $mastery['last_practiced'] = time();

            // Calculate new mastery score using exponential moving average
            $accuracy = $mastery['problems_attempted'] > 0
                ? $mastery['problems_correct'] / $mastery['problems_attempted']
                : 0;

            // Factor in time spent (faster = better understanding)
            $expected_time = $this->get_expected_time_for_concept($concept);
            $time_factor = $expected_time > 0
                ? min(1.0, $expected_time / max(1, $time_spent))
                : 1.0;

            // Weighted score: 70% accuracy, 30% time efficiency
            $new_score = (0.7 * $accuracy) + (0.3 * $time_factor);

            // Exponential moving average (alpha = 0.3)
            $mastery['mastery_score'] = (0.3 * $new_score) + (0.7 * $mastery['mastery_score']);

            // Update confidence (increases with more attempts)
            $mastery['confidence_score'] = min(1.0,
                $mastery['problems_attempted'] / self::MIN_ATTEMPTS_FOR_ASSESSMENT);

            // Determine if needs review
            $mastery['needs_review'] = ($mastery['mastery_score'] < self::REVIEW_THRESHOLD &&
                                        $mastery['confidence_score'] >= 0.5) ? 1 : 0;

            // Save concept mastery
            $this->save_concept_mastery($concept, $mastery);
        }
    }

    /**
     * Get or create concept mastery record
     */
    private function get_or_create_concept_mastery($concept) {
        $sql = "SELECT * FROM mdl_recommend_concept_mastery
                WHERE userid = :userid AND concept = :concept";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'userid' => $this->user_id,
                'concept' => $concept
            ]);
            $mastery = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$mastery) {
                // Create new
                $sql = "INSERT INTO mdl_recommend_concept_mastery
                        (userid, concept, mastery_score, confidence_score,
                         timecreated, timemodified)
                        VALUES (:userid, :concept, 0.0, 0.0, :time, :time)";

                $stmt = $this->db->prepare($sql);
                $time = time();
                $stmt->execute([
                    'userid' => $this->user_id,
                    'concept' => $concept,
                    'time' => $time
                ]);

                return [
                    'id' => $this->db->lastInsertId(),
                    'userid' => $this->user_id,
                    'concept' => $concept,
                    'mastery_score' => 0.0,
                    'confidence_score' => 0.0,
                    'problems_attempted' => 0,
                    'problems_correct' => 0,
                    'last_practiced' => $time,
                    'times_reviewed' => 0,
                    'digest_views' => 0,
                    'marked_helpful' => 0,
                    'needs_review' => 0,
                    'timecreated' => $time,
                    'timemodified' => $time
                ];
            }

            return $mastery;
        } catch (PDOException $e) {
            error_log("Error with concept mastery: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Save concept mastery to database
     */
    private function save_concept_mastery($concept, $mastery) {
        $sql = "UPDATE mdl_recommend_concept_mastery
                SET mastery_score = :mastery_score,
                    confidence_score = :confidence_score,
                    problems_attempted = :attempted,
                    problems_correct = :correct,
                    last_practiced = :last_practiced,
                    needs_review = :needs_review,
                    timemodified = :timemodified
                WHERE userid = :userid AND concept = :concept";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'mastery_score' => $mastery['mastery_score'],
                'confidence_score' => $mastery['confidence_score'],
                'attempted' => $mastery['problems_attempted'],
                'correct' => $mastery['problems_correct'],
                'last_practiced' => $mastery['last_practiced'],
                'needs_review' => $mastery['needs_review'],
                'timemodified' => time(),
                'userid' => $this->user_id,
                'concept' => $concept
            ]);
        } catch (PDOException $e) {
            error_log("Error saving concept mastery: " . $e->getMessage());
        }
    }

    /**
     * Get expected time for a concept (based on historical data)
     */
    private function get_expected_time_for_concept($concept) {
        $sql = "SELECT AVG(time_spent) as avg_time
                FROM mdl_recommend_learning_history
                WHERE concepts_involved LIKE :concept
                AND is_correct = 1";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['concept' => '%"' . $concept . '"%']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (int)$result['avg_time'] : 120; // Default 2 minutes
        } catch (PDOException $e) {
            return 120;
        }
    }

    /**
     * Save profile to database
     */
    private function save_profile() {
        $sql = "UPDATE mdl_recommend_student_profile
                SET learning_style = :learning_style,
                    current_level = :current_level,
                    study_pace = :study_pace,
                    total_study_time = :total_study_time,
                    total_problems_attempted = :attempted,
                    total_problems_correct = :correct,
                    accuracy_rate = :accuracy_rate,
                    average_problem_time = :avg_time,
                    last_active = :last_active,
                    timemodified = :timemodified
                WHERE userid = :userid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'learning_style' => $this->profile['learning_style'],
                'current_level' => $this->profile['current_level'],
                'study_pace' => $this->profile['study_pace'],
                'total_study_time' => $this->profile['total_study_time'],
                'attempted' => $this->profile['total_problems_attempted'],
                'correct' => $this->profile['total_problems_correct'],
                'accuracy_rate' => $this->profile['accuracy_rate'],
                'avg_time' => $this->profile['average_problem_time'],
                'last_active' => $this->profile['last_active'],
                'timemodified' => time(),
                'userid' => $this->user_id
            ]);
        } catch (PDOException $e) {
            error_log("Error saving profile: " . $e->getMessage());
        }
    }

    /**
     * Get current profile
     */
    public function get_profile() {
        return $this->profile;
    }

    /**
     * Get all concept masteries for this user
     */
    public function get_all_concept_masteries() {
        $sql = "SELECT * FROM mdl_recommend_concept_mastery
                WHERE userid = :userid
                ORDER BY mastery_score DESC";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting concept masteries: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get concepts that need review
     */
    public function get_concepts_needing_review() {
        $sql = "SELECT * FROM mdl_recommend_concept_mastery
                WHERE userid = :userid AND needs_review = 1
                ORDER BY last_practiced ASC";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting review concepts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get strongest concepts
     */
    public function get_strongest_concepts($limit = 3) {
        $sql = "SELECT * FROM mdl_recommend_concept_mastery
                WHERE userid = :userid AND confidence_score >= 0.5
                ORDER BY mastery_score DESC
                LIMIT :limit";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':userid', $this->user_id, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting strongest concepts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get weakest concepts
     */
    public function get_weakest_concepts($limit = 3) {
        $sql = "SELECT * FROM mdl_recommend_concept_mastery
                WHERE userid = :userid AND problems_attempted >= :min_attempts
                ORDER BY mastery_score ASC
                LIMIT :limit";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':userid', $this->user_id, PDO::PARAM_INT);
            $stmt->bindValue(':min_attempts', self::MIN_ATTEMPTS_FOR_ASSESSMENT, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting weakest concepts: " . $e->getMessage());
            return [];
        }
    }
}
