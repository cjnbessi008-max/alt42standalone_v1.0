<?php
/**
 * Recommendation Engine
 * Multi-strategy recommendation system for personalized learning
 * Compatible with PHP 7.1.9
 */

require_once(__DIR__ . '/StudentProfileAnalyzer.php');

class RecommendationEngine {

    private $db;
    private $user_id;
    private $profile_analyzer;
    private $profile;

    // Recommendation strategies
    const STRATEGY_KNOWLEDGE_GAP = 'knowledge_gap';
    const STRATEGY_SEQUENTIAL = 'sequential';
    const STRATEGY_SPACED_REPETITION = 'spaced_repetition';
    const STRATEGY_CHALLENGE = 'challenge';
    const STRATEGY_REINFORCEMENT = 'reinforcement';

    // Recommendation types
    const TYPE_NEXT_TOPIC = 'next_topic';
    const TYPE_REVIEW = 'review';
    const TYPE_PRACTICE = 'practice';
    const TYPE_CHALLENGE = 'challenge';

    public function __construct($db, $user_id) {
        $this->db = $db;
        $this->user_id = $user_id;
        $this->profile_analyzer = new StudentProfileAnalyzer($db, $user_id);
        $this->profile = $this->profile_analyzer->get_profile();
    }

    /**
     * Get personalized recommendations for student
     * @param int $count Number of recommendations to generate
     * @return array Array of recommendations
     */
    public function get_recommendations($count = 3) {
        $recommendations = [];

        // 1. Check for concepts needing review (highest priority)
        $review_recs = $this->get_review_recommendations();
        $recommendations = array_merge($recommendations, $review_recs);

        // 2. Get next topic in learning path
        if (count($recommendations) < $count) {
            $next_recs = $this->get_next_topic_recommendations();
            $recommendations = array_merge($recommendations, $next_recs);
        }

        // 3. Get practice recommendations for weak concepts
        if (count($recommendations) < $count) {
            $practice_recs = $this->get_practice_recommendations();
            $recommendations = array_merge($recommendations, $practice_recs);
        }

        // 4. Get challenge for strong students
        if (count($recommendations) < $count &&
            $this->profile['accuracy_rate'] >= 0.75) {
            $challenge_recs = $this->get_challenge_recommendations();
            $recommendations = array_merge($recommendations, $challenge_recs);
        }

        // Sort by priority and limit
        usort($recommendations, function($a, $b) {
            return $b['priority'] - $a['priority'];
        });

        $recommendations = array_slice($recommendations, 0, $count);

        // Save recommendations to history
        foreach ($recommendations as &$rec) {
            $rec['id'] = $this->save_recommendation($rec);
        }

        return $recommendations;
    }

    /**
     * Get review recommendations (spaced repetition)
     */
    private function get_review_recommendations() {
        $concepts_to_review = $this->profile_analyzer->get_concepts_needing_review();
        $recommendations = [];

        foreach ($concepts_to_review as $concept_data) {
            $concept = $concept_data['concept'];

            // Find suitable review questions
            $questions = $this->find_questions_for_concept(
                $concept,
                0.3, // Lower difficulty for review
                0.5,
                1
            );

            if (!empty($questions)) {
                $question = $questions[0];

                $recommendations[] = [
                    'recommendation_type' => self::TYPE_REVIEW,
                    'recommended_item_type' => 'question',
                    'recommended_item_id' => $question['resource_id'],
                    'target_concept' => $concept,
                    'title' => $this->get_concept_title($concept) . ' 복습',
                    'description' => $this->get_concept_title($concept) . ' 개념을 복습하고 실력을 다지세요.',
                    'reasoning' => '이 개념의 숙련도가 낮아 복습이 필요합니다.',
                    'algorithm_used' => self::STRATEGY_SPACED_REPETITION,
                    'confidence' => 0.9,
                    'priority' => 10, // Highest priority
                    'estimated_time' => $question['estimated_time'],
                    'difficulty' => $question['difficulty']
                ];
            }
        }

        return $recommendations;
    }

    /**
     * Get next topic recommendations (learning path)
     */
    private function get_next_topic_recommendations() {
        // Get student's current learning path
        $path_progress = $this->get_active_learning_path();

        if (!$path_progress) {
            // Start default path based on level
            $path_progress = $this->start_default_learning_path();
        }

        if (!$path_progress) {
            return [];
        }

        $path = $this->get_learning_path($path_progress['path_id']);
        $concepts = json_decode($path['concepts_sequence'], true);
        $current_index = $path_progress['current_concept_index'];

        // Get next concept in sequence
        if ($current_index < count($concepts)) {
            $next_concept = $concepts[$current_index];

            // Find questions for this concept
            $questions = $this->find_questions_for_concept(
                $next_concept,
                max(0.3, $this->profile['preferred_difficulty'] - 0.1),
                min(0.9, $this->profile['preferred_difficulty'] + 0.2),
                2
            );

            $recommendations = [];
            foreach ($questions as $question) {
                $recommendations[] = [
                    'recommendation_type' => self::TYPE_NEXT_TOPIC,
                    'recommended_item_type' => 'question',
                    'recommended_item_id' => $question['resource_id'],
                    'target_concept' => $next_concept,
                    'title' => $this->get_concept_title($next_concept) . ' 학습',
                    'description' => '학습 경로의 다음 단계: ' . $this->get_concept_title($next_concept),
                    'reasoning' => '체계적인 학습 경로에 따른 다음 주제입니다.',
                    'algorithm_used' => self::STRATEGY_SEQUENTIAL,
                    'confidence' => 0.85,
                    'priority' => 8,
                    'estimated_time' => $question['estimated_time'],
                    'difficulty' => $question['difficulty']
                ];
            }

            return $recommendations;
        }

        return [];
    }

    /**
     * Get practice recommendations (knowledge gap)
     */
    private function get_practice_recommendations() {
        $weak_concepts = $this->profile_analyzer->get_weakest_concepts(2);
        $recommendations = [];

        foreach ($weak_concepts as $concept_data) {
            $concept = $concept_data['concept'];
            $mastery = $concept_data['mastery_score'];

            // Adjust difficulty based on current mastery
            $target_difficulty = 0.3 + ($mastery * 0.4); // Scale from 0.3 to 0.7

            $questions = $this->find_questions_for_concept(
                $concept,
                $target_difficulty - 0.1,
                $target_difficulty + 0.1,
                1
            );

            if (!empty($questions)) {
                $question = $questions[0];

                $recommendations[] = [
                    'recommendation_type' => self::TYPE_PRACTICE,
                    'recommended_item_type' => 'question',
                    'recommended_item_id' => $question['resource_id'],
                    'target_concept' => $concept,
                    'title' => $this->get_concept_title($concept) . ' 연습',
                    'description' => '취약한 개념을 집중 연습하여 실력을 향상하세요.',
                    'reasoning' => '이 개념의 숙련도(' . round($mastery * 100) . '%)를 높이기 위한 연습이 필요합니다.',
                    'algorithm_used' => self::STRATEGY_KNOWLEDGE_GAP,
                    'confidence' => 0.8,
                    'priority' => 7,
                    'estimated_time' => $question['estimated_time'],
                    'difficulty' => $question['difficulty']
                ];
            }
        }

        return $recommendations;
    }

    /**
     * Get challenge recommendations (for advanced students)
     */
    private function get_challenge_recommendations() {
        $strong_concepts = $this->profile_analyzer->get_strongest_concepts(1);

        if (empty($strong_concepts)) {
            return [];
        }

        $concept = $strong_concepts[0]['concept'];

        // Find harder questions
        $questions = $this->find_questions_for_concept(
            $concept,
            0.7,
            1.0,
            1
        );

        $recommendations = [];

        if (!empty($questions)) {
            $question = $questions[0];

            $recommendations[] = [
                'recommendation_type' => self::TYPE_CHALLENGE,
                'recommended_item_type' => 'question',
                'recommended_item_id' => $question['resource_id'],
                'target_concept' => $concept,
                'title' => $this->get_concept_title($concept) . ' 심화 문제',
                'description' => '도전적인 문제로 실력을 한 단계 높이세요!',
                'reasoning' => '이 개념을 잘 이해하고 있으니 더 어려운 문제에 도전해보세요.',
                'algorithm_used' => self::STRATEGY_CHALLENGE,
                'confidence' => 0.75,
                'priority' => 5,
                'estimated_time' => $question['estimated_time'],
                'difficulty' => $question['difficulty']
            ];
        }

        return $recommendations;
    }

    /**
     * Find questions for a specific concept and difficulty range
     */
    private function find_questions_for_concept($concept, $min_diff, $max_diff, $limit = 1) {
        $sql = "SELECT * FROM mdl_recommend_resource_meta
                WHERE resource_type = 'question'
                AND is_active = 1
                AND concepts LIKE :concept
                AND difficulty BETWEEN :min_diff AND :max_diff
                ORDER BY quality_score DESC, popularity_score DESC
                LIMIT :limit";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':concept', '%"' . $concept . '"%', PDO::PARAM_STR);
            $stmt->bindValue(':min_diff', $min_diff, PDO::PARAM_STR);
            $stmt->bindValue(':max_diff', $max_diff, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error finding questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get active learning path for student
     */
    private function get_active_learning_path() {
        $sql = "SELECT * FROM mdl_recommend_path_progress
                WHERE userid = :userid AND is_active = 1
                ORDER BY last_activity DESC
                LIMIT 1";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting learning path: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Start default learning path based on student level
     */
    private function start_default_learning_path() {
        $level = $this->profile['current_level'];

        // Get default path for this level
        $sql = "SELECT * FROM mdl_recommend_learning_path
                WHERE target_level = :level AND is_default = 1 AND is_active = 1
                LIMIT 1";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['level' => $level]);
            $path = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($path) {
                // Create progress record
                $sql = "INSERT INTO mdl_recommend_path_progress
                        (userid, path_id, current_concept_index, overall_progress,
                         started_at, last_activity, is_active)
                        VALUES (:userid, :path_id, 0, 0.0, :time, :time, 1)";

                $stmt = $this->db->prepare($sql);
                $time = time();
                $stmt->execute([
                    'userid' => $this->user_id,
                    'path_id' => $path['id'],
                    'time' => $time
                ]);

                return [
                    'id' => $this->db->lastInsertId(),
                    'userid' => $this->user_id,
                    'path_id' => $path['id'],
                    'current_concept_index' => 0,
                    'overall_progress' => 0.0,
                    'started_at' => $time,
                    'last_activity' => $time,
                    'is_active' => 1
                ];
            }
        } catch (PDOException $e) {
            error_log("Error starting learning path: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Get learning path details
     */
    private function get_learning_path($path_id) {
        $sql = "SELECT * FROM mdl_recommend_learning_path WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $path_id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting learning path details: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get concept title in Korean
     */
    private function get_concept_title($concept) {
        $titles = [
            'basics' => '벡터 기초',
            'components' => '벡터 성분',
            'addition' => '벡터 덧셈',
            'products' => '내적과 외적',
            'unit_vectors' => '단위 벡터',
            'applications' => '벡터 응용'
        ];

        return $titles[$concept] ?? $concept;
    }

    /**
     * Save recommendation to history
     */
    private function save_recommendation($rec) {
        $sql = "INSERT INTO mdl_recommend_history
                (userid, recommendation_type, recommended_item_type, recommended_item_id,
                 target_concept, reasoning, algorithm_used, confidence, priority, timecreated)
                VALUES (:userid, :rec_type, :item_type, :item_id, :concept, :reasoning,
                        :algorithm, :confidence, :priority, :time)";

        try {
            $stmt = $this->db->prepare($sql);
            $time = time();
            $stmt->execute([
                'userid' => $this->user_id,
                'rec_type' => $rec['recommendation_type'],
                'item_type' => $rec['recommended_item_type'],
                'item_id' => $rec['recommended_item_id'],
                'concept' => $rec['target_concept'],
                'reasoning' => $rec['reasoning'],
                'algorithm' => $rec['algorithm_used'],
                'confidence' => $rec['confidence'],
                'priority' => $rec['priority'],
                'time' => $time
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error saving recommendation: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mark recommendation as accepted
     */
    public function accept_recommendation($rec_id) {
        $sql = "UPDATE mdl_recommend_history
                SET was_viewed = 1, was_accepted = 1, time_accepted = :time
                WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'id' => $rec_id,
                'time' => time()
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Error accepting recommendation: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark recommendation as completed with result
     */
    public function complete_recommendation($rec_id, $score, $time_taken) {
        $sql = "UPDATE mdl_recommend_history
                SET time_completed = :time_completed,
                    result_score = :score,
                    completion_time = :time_taken
                WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'id' => $rec_id,
                'time_completed' => time(),
                'score' => $score,
                'time_taken' => $time_taken
            ]);

            // Update learning path progress if applicable
            $this->update_learning_path_progress($rec_id);

            return true;
        } catch (PDOException $e) {
            error_log("Error completing recommendation: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update learning path progress
     */
    private function update_learning_path_progress($rec_id) {
        // Get recommendation details
        $sql = "SELECT * FROM mdl_recommend_history WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $rec_id]);
        $rec = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rec || $rec['recommendation_type'] !== self::TYPE_NEXT_TOPIC) {
            return;
        }

        // Get active path
        $path_progress = $this->get_active_learning_path();
        if (!$path_progress) {
            return;
        }

        // Move to next concept
        $new_index = $path_progress['current_concept_index'] + 1;

        $path = $this->get_learning_path($path_progress['path_id']);
        $concepts = json_decode($path['concepts_sequence'], true);
        $total_concepts = count($concepts);

        $progress = min(1.0, $new_index / $total_concepts);

        $sql = "UPDATE mdl_recommend_path_progress
                SET current_concept_index = :index,
                    overall_progress = :progress,
                    last_activity = :time,
                    completed_at = :completed_at
                WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'index' => $new_index,
                'progress' => $progress,
                'time' => time(),
                'completed_at' => ($progress >= 1.0) ? time() : null,
                'id' => $path_progress['id']
            ]);
        } catch (PDOException $e) {
            error_log("Error updating path progress: " . $e->getMessage());
        }
    }

    /**
     * Get recommendation statistics
     */
    public function get_recommendation_stats() {
        $sql = "SELECT
                    COUNT(*) as total_recommendations,
                    SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END) as accepted,
                    SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpful,
                    AVG(CASE WHEN result_score IS NOT NULL THEN result_score ELSE NULL END) as avg_score
                FROM mdl_recommend_history
                WHERE userid = :userid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $this->user_id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting recommendation stats: " . $e->getMessage());
            return null;
        }
    }
}
