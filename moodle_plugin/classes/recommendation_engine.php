<?php
// Recommendation Engine for Dot Collector
// AI-based Adaptive Learning System

namespace mod_dotcollector;

defined('MOODLE_INTERNAL') || die();

/**
 * Recommendation Engine Class
 * Provides intelligent question recommendations based on student performance
 */
class recommendation_engine {

    private $db;
    private $userid;
    private $profile_id;

    /**
     * Constructor
     * @param mysqli $db Database connection
     * @param int $userid Moodle user ID
     */
    public function __construct($db, $userid) {
        $this->db = $db;
        $this->userid = $userid;
        $this->profile_id = $this->get_or_create_profile();
    }

    /**
     * Get or create student profile
     * @return int Profile ID
     */
    private function get_or_create_profile() {
        $stmt = $this->db->prepare("SELECT id FROM student_profiles WHERE moodle_user_id = ?");
        $stmt->bind_param("i", $this->userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();

        if ($profile) {
            return $profile['id'];
        }

        // Create new profile
        $stmt = $this->db->prepare("INSERT INTO student_profiles (moodle_user_id) VALUES (?)");
        $stmt->bind_param("i", $this->userid);
        $stmt->execute();
        $profile_id = $stmt->insert_id;
        $stmt->close();

        return $profile_id;
    }

    /**
     * Get recommended questions for student
     * @param int $count Number of questions to recommend
     * @param string $strategy Recommendation strategy (adaptive, collaborative, diverse)
     * @return array Array of recommended questions
     */
    public function get_recommended_questions($count = 5, $strategy = 'adaptive') {
        switch ($strategy) {
            case 'collaborative':
                return $this->collaborative_filtering($count);
            case 'diverse':
                return $this->diverse_recommendation($count);
            case 'skill_gap':
                return $this->skill_gap_recommendation($count);
            case 'adaptive':
            default:
                return $this->adaptive_recommendation($count);
        }
    }

    /**
     * Adaptive recommendation based on student's current skill level
     * @param int $count Number of questions
     * @return array Recommended questions
     */
    private function adaptive_recommendation($count) {
        // Get student's current skill level and performance
        $stmt = $this->db->prepare("
            SELECT
                current_skill_level,
                overall_accuracy_rate,
                strongest_shape_type,
                weakest_shape_type,
                preferred_difficulty
            FROM student_profiles
            WHERE id = ?
        ");
        $stmt->bind_param("i", $this->profile_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();

        if (!$profile) {
            return $this->get_beginner_questions($count);
        }

        $skill_level = $profile['current_skill_level'];
        $accuracy = $profile['overall_accuracy_rate'];
        $weakest_shape = $profile['weakest_shape_type'];

        // Calculate target difficulty
        $target_difficulty = $this->calculate_target_difficulty($skill_level, $accuracy);

        // Get questions not attempted recently
        $stmt = $this->db->prepare("
            SELECT
                q.*,
                (CASE
                    WHEN q.shape_type = ? THEN 2.0
                    ELSE 1.0
                END) as priority_boost,
                ABS(q.difficulty_level - ?) as difficulty_distance
            FROM questions q
            LEFT JOIN (
                SELECT question_id, MAX(attempted_at) as last_attempt
                FROM student_attempts
                WHERE moodle_user_id = ?
                GROUP BY question_id
            ) sa ON q.id = sa.question_id
            WHERE (sa.last_attempt IS NULL OR sa.last_attempt < DATE_SUB(NOW(), INTERVAL 1 DAY))
            AND q.difficulty_level BETWEEN ? AND ?
            ORDER BY
                priority_boost DESC,
                difficulty_distance ASC,
                RAND()
            LIMIT ?
        ");

        $min_diff = max(1, $target_difficulty - 1);
        $max_diff = min(5, $target_difficulty + 1);

        $stmt->bind_param("siiiii",
            $weakest_shape,
            $target_difficulty,
            $this->userid,
            $min_diff,
            $max_diff,
            $count
        );
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Log recommendations
        $this->log_recommendations($questions, 'adaptive', $accuracy);

        return $questions;
    }

    /**
     * Collaborative filtering recommendation
     * Based on similar students' performance
     * @param int $count Number of questions
     * @return array Recommended questions
     */
    private function collaborative_filtering($count) {
        // Find similar students
        $similar_students = $this->find_similar_students();

        if (empty($similar_students)) {
            return $this->adaptive_recommendation($count);
        }

        $similar_ids = array_column($similar_students, 'similar_student_profile_id');
        $placeholders = implode(',', array_fill(0, count($similar_ids), '?'));

        // Get questions that similar students succeeded at
        $query = "
            SELECT
                q.*,
                COUNT(DISTINCT la.moodle_user_id) as similar_success_count,
                AVG(la.was_correct) as avg_success_rate
            FROM questions q
            INNER JOIN learning_analytics la ON q.id = la.question_id
            WHERE la.student_profile_id IN ($placeholders)
            AND la.was_correct = 1
            AND q.id NOT IN (
                SELECT question_id
                FROM student_attempts
                WHERE moodle_user_id = ?
            )
            GROUP BY q.id
            ORDER BY similar_success_count DESC, avg_success_rate DESC
            LIMIT ?
        ";

        $stmt = $this->db->prepare($query);
        $types = str_repeat('i', count($similar_ids)) . 'ii';
        $params = array_merge($similar_ids, [$this->userid, $count]);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $this->log_recommendations($questions, 'collaborative', null);

        return $questions;
    }

    /**
     * Diverse recommendation - variety of shapes and difficulties
     * @param int $count Number of questions
     * @return array Recommended questions
     */
    private function diverse_recommendation($count) {
        $questions_per_shape = ceil($count / 3); // 3 main shapes

        $stmt = $this->db->prepare("
            (SELECT q.*, 'rectangle' as diversity_type
             FROM questions q
             WHERE q.shape_type = 'rectangle'
             AND q.id NOT IN (
                 SELECT question_id FROM student_attempts WHERE moodle_user_id = ?
             )
             ORDER BY RAND()
             LIMIT ?)
            UNION
            (SELECT q.*, 'triangle' as diversity_type
             FROM questions q
             WHERE q.shape_type = 'triangle'
             AND q.id NOT IN (
                 SELECT question_id FROM student_attempts WHERE moodle_user_id = ?
             )
             ORDER BY RAND()
             LIMIT ?)
            UNION
            (SELECT q.*, 'circle' as diversity_type
             FROM questions q
             WHERE q.shape_type = 'circle'
             AND q.id NOT IN (
                 SELECT question_id FROM student_attempts WHERE moodle_user_id = ?
             )
             ORDER BY RAND()
             LIMIT ?)
        ");

        $stmt->bind_param("iiiiii",
            $this->userid, $questions_per_shape,
            $this->userid, $questions_per_shape,
            $this->userid, $questions_per_shape
        );
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $this->log_recommendations($questions, 'diverse', null);

        return array_slice($questions, 0, $count);
    }

    /**
     * Skill gap recommendation - focus on weak areas
     * @param int $count Number of questions
     * @return array Recommended questions
     */
    private function skill_gap_recommendation($count) {
        // Identify skill gaps
        $stmt = $this->db->prepare("
            SELECT
                skill_name,
                proficiency_level
            FROM skill_progression
            WHERE student_profile_id = ?
            ORDER BY proficiency_level ASC
            LIMIT 3
        ");
        $stmt->bind_param("i", $this->profile_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $weak_skills = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (empty($weak_skills)) {
            return $this->adaptive_recommendation($count);
        }

        // Extract shape types from skill names
        $shape_types = [];
        foreach ($weak_skills as $skill) {
            if (strpos($skill['skill_name'], 'rectangle') !== false) {
                $shape_types[] = 'rectangle';
            } elseif (strpos($skill['skill_name'], 'triangle') !== false) {
                $shape_types[] = 'triangle';
            } elseif (strpos($skill['skill_name'], 'circle') !== false) {
                $shape_types[] = 'circle';
            }
        }

        if (empty($shape_types)) {
            return $this->adaptive_recommendation($count);
        }

        $placeholders = implode(',', array_fill(0, count($shape_types), '?'));
        $query = "
            SELECT q.*
            FROM questions q
            WHERE q.shape_type IN ($placeholders)
            AND q.id NOT IN (
                SELECT question_id
                FROM student_attempts
                WHERE moodle_user_id = ?
                AND is_correct = 1
            )
            ORDER BY q.difficulty_level ASC, RAND()
            LIMIT ?
        ";

        $stmt = $this->db->prepare($query);
        $types = str_repeat('s', count($shape_types)) . 'ii';
        $params = array_merge($shape_types, [$this->userid, $count]);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $this->log_recommendations($questions, 'skill_gap', null);

        return $questions;
    }

    /**
     * Get beginner questions for new students
     * @param int $count Number of questions
     * @return array Questions
     */
    private function get_beginner_questions($count) {
        $stmt = $this->db->prepare("
            SELECT * FROM questions
            WHERE difficulty_level <= 2
            ORDER BY difficulty_level ASC, RAND()
            LIMIT ?
        ");
        $stmt->bind_param("i", $count);
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        return $questions;
    }

    /**
     * Calculate target difficulty based on skill level and accuracy
     * @param float $skill_level Current skill level
     * @param float $accuracy Accuracy percentage
     * @return int Target difficulty (1-5)
     */
    private function calculate_target_difficulty($skill_level, $accuracy) {
        if ($accuracy >= 80) {
            // Student is excelling, increase challenge
            return min(5, ceil($skill_level) + 1);
        } elseif ($accuracy >= 60) {
            // Student is doing okay, maintain level
            return round($skill_level);
        } else {
            // Student is struggling, decrease difficulty
            return max(1, floor($skill_level) - 1);
        }
    }

    /**
     * Find similar students based on performance patterns
     * @return array Similar students
     */
    private function find_similar_students() {
        $stmt = $this->db->prepare("
            SELECT * FROM student_similarity
            WHERE student_profile_id = ?
            AND similarity_score >= 0.7
            ORDER BY similarity_score DESC
            LIMIT 5
        ");
        $stmt->bind_param("i", $this->profile_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $similar = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        return $similar;
    }

    /**
     * Log recommendations for analysis
     * @param array $questions Recommended questions
     * @param string $algorithm Algorithm used
     * @param float $predicted_rate Predicted success rate
     */
    private function log_recommendations($questions, $algorithm, $predicted_rate) {
        if (empty($questions)) {
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO question_recommendations
            (student_profile_id, moodle_user_id, question_id, recommendation_algorithm, predicted_success_rate, recommendation_reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($questions as $q) {
            $reason = $this->generate_recommendation_reason($q, $algorithm);
            $stmt->bind_param("iiisds",
                $this->profile_id,
                $this->userid,
                $q['id'],
                $algorithm,
                $predicted_rate,
                $reason
            );
            $stmt->execute();
        }

        $stmt->close();
    }

    /**
     * Generate human-readable recommendation reason
     * @param array $question Question data
     * @param string $algorithm Algorithm used
     * @return string Reason
     */
    private function generate_recommendation_reason($question, $algorithm) {
        $reasons = [
            'adaptive' => "Matched to your skill level (difficulty {$question['difficulty_level']})",
            'collaborative' => "Students similar to you succeeded with this",
            'diverse' => "Exploring different question types",
            'skill_gap' => "Practice area where you can improve"
        ];

        return $reasons[$algorithm] ?? 'Recommended for you';
    }

    /**
     * Update student profile after attempt
     * @param int $question_id Question ID
     * @param bool $is_correct Was answer correct
     * @param int $time_spent Time in seconds
     * @param int $difficulty Question difficulty
     * @param string $shape_type Shape type
     */
    public function update_after_attempt($question_id, $is_correct, $time_spent, $difficulty, $shape_type) {
        // Call stored procedure
        $stmt = $this->db->prepare("
            CALL update_student_profile(?, ?, ?, ?, ?, ?)
        ");
        $is_correct_int = $is_correct ? 1 : 0;
        $stmt->bind_param("iiiiiis",
            $this->userid,
            $question_id,
            $is_correct_int,
            $time_spent,
            $difficulty,
            $shape_type
        );
        $stmt->execute();
        $stmt->close();

        // Update skill progression
        $this->update_skill_progression($shape_type, $is_correct);
    }

    /**
     * Update skill progression for specific skill
     * @param string $shape_type Shape type
     * @param bool $is_correct Was correct
     */
    private function update_skill_progression($shape_type, $is_correct) {
        $skill_name = $shape_type . '_area';

        // Check if skill exists
        $stmt = $this->db->prepare("
            SELECT id, proficiency_level, questions_attempted
            FROM skill_progression
            WHERE student_profile_id = ? AND skill_name = ?
        ");
        $stmt->bind_param("is", $this->profile_id, $skill_name);
        $stmt->execute();
        $result = $stmt->get_result();
        $skill = $result->fetch_assoc();
        $stmt->close();

        if ($skill) {
            // Update existing skill
            $new_proficiency = $skill['proficiency_level'];
            if ($is_correct) {
                $new_proficiency = min(5.0, $new_proficiency + 0.1);
            } else {
                $new_proficiency = max(1.0, $new_proficiency - 0.05);
            }

            $stmt = $this->db->prepare("
                UPDATE skill_progression
                SET
                    proficiency_level = ?,
                    questions_attempted = questions_attempted + 1,
                    questions_mastered = questions_mastered + ?,
                    last_practiced = NOW()
                WHERE id = ?
            ");
            $mastered = $is_correct ? 1 : 0;
            $stmt->bind_param("dii", $new_proficiency, $mastered, $skill['id']);
            $stmt->execute();
            $stmt->close();
        } else {
            // Create new skill
            $initial_proficiency = $is_correct ? 1.5 : 1.0;
            $stmt = $this->db->prepare("
                INSERT INTO skill_progression
                (student_profile_id, moodle_user_id, skill_name, proficiency_level, questions_attempted, questions_mastered, last_practiced)
                VALUES (?, ?, ?, ?, 1, ?, NOW())
            ");
            $mastered = $is_correct ? 1 : 0;
            $stmt->bind_param("iisdi",
                $this->profile_id,
                $this->userid,
                $skill_name,
                $initial_proficiency,
                $mastered
            );
            $stmt->execute();
            $stmt->close();
        }
    }

    /**
     * Get student performance analytics
     * @return array Analytics data
     */
    public function get_analytics() {
        $stmt = $this->db->prepare("
            SELECT * FROM v_student_performance_summary
            WHERE moodle_user_id = ?
        ");
        $stmt->bind_param("i", $this->userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $analytics = $result->fetch_assoc();
        $stmt->close();

        // Get skill progression
        $stmt = $this->db->prepare("
            SELECT * FROM skill_progression
            WHERE student_profile_id = ?
            ORDER BY proficiency_level DESC
        ");
        $stmt->bind_param("i", $this->profile_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $skills = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        return [
            'summary' => $analytics,
            'skills' => $skills
        ];
    }
}
