<?php
/**
 * Recommendation API
 * REST API for personalized learning recommendations
 * Compatible with PHP 7.1.9
 */

require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/RecommendationEngine.php');
require_once(__DIR__ . '/StudentProfileAnalyzer.php');

class RecommendationAPI {

    private $db;
    private $config;

    public function __construct($moodle_db = null) {
        $this->config = require(__DIR__ . '/../config/config.php');

        if ($moodle_db !== null) {
            $this->db = $moodle_db;
        } else {
            $this->connect_db();
        }
    }

    /**
     * Connect to database
     */
    private function connect_db() {
        try {
            $dsn = "mysql:host={$this->config['db']['host']};dbname={$this->config['db']['name']};charset=utf8mb4";
            $this->db = new PDO($dsn, $this->config['db']['user'], $this->config['db']['pass']);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            error_log("Recommendation API DB Connection Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get recommendations for user
     */
    public function get_recommendations($user_id, $count = 3) {
        try {
            $engine = new RecommendationEngine($this->db, $user_id);
            $recommendations = $engine->get_recommendations($count);

            return [
                'success' => true,
                'user_id' => $user_id,
                'count' => count($recommendations),
                'recommendations' => $recommendations
            ];
        } catch (Exception $e) {
            error_log("Error getting recommendations: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '추천을 생성하는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Get student profile
     */
    public function get_student_profile($user_id) {
        try {
            $analyzer = new StudentProfileAnalyzer($this->db, $user_id);
            $profile = $analyzer->get_profile();
            $concept_masteries = $analyzer->get_all_concept_masteries();

            return [
                'success' => true,
                'user_id' => $user_id,
                'profile' => $profile,
                'concept_masteries' => $concept_masteries,
                'strongest_concepts' => $analyzer->get_strongest_concepts(3),
                'weakest_concepts' => $analyzer->get_weakest_concepts(3),
                'concepts_needing_review' => $analyzer->get_concepts_needing_review()
            ];
        } catch (Exception $e) {
            error_log("Error getting student profile: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '프로필을 불러오는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Record learning activity
     */
    public function record_activity($user_id, $question_id, $is_correct, $time_spent,
                                    $score = null, $concepts = [], $digest_viewed = false) {
        try {
            // Update profile
            $analyzer = new StudentProfileAnalyzer($this->db, $user_id);
            $analyzer->update_from_activity($question_id, $is_correct, $time_spent, $concepts);

            // Record in learning history
            $sql = "INSERT INTO mdl_recommend_learning_history
                    (userid, questionid, concepts_involved, is_correct, score,
                     time_spent, digest_viewed, timecreated)
                    VALUES (:userid, :questionid, :concepts, :is_correct, :score,
                            :time_spent, :digest_viewed, :time)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'userid' => $user_id,
                'questionid' => $question_id,
                'concepts' => json_encode($concepts),
                'is_correct' => $is_correct ? 1 : 0,
                'score' => $score,
                'time_spent' => $time_spent,
                'digest_viewed' => $digest_viewed ? 1 : 0,
                'time' => time()
            ]);

            return [
                'success' => true,
                'activity_recorded' => true,
                'profile_updated' => true
            ];
        } catch (Exception $e) {
            error_log("Error recording activity: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '활동을 기록하는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Accept recommendation
     */
    public function accept_recommendation($user_id, $recommendation_id) {
        try {
            $engine = new RecommendationEngine($this->db, $user_id);
            $result = $engine->accept_recommendation($recommendation_id);

            return [
                'success' => $result,
                'recommendation_id' => $recommendation_id,
                'accepted' => $result
            ];
        } catch (Exception $e) {
            error_log("Error accepting recommendation: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '추천을 수락하는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Complete recommendation
     */
    public function complete_recommendation($user_id, $recommendation_id, $score, $time_taken) {
        try {
            $engine = new RecommendationEngine($this->db, $user_id);
            $result = $engine->complete_recommendation($recommendation_id, $score, $time_taken);

            return [
                'success' => $result,
                'recommendation_id' => $recommendation_id,
                'completed' => $result
            ];
        } catch (Exception $e) {
            error_log("Error completing recommendation: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '추천을 완료하는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Get recommendation statistics
     */
    public function get_stats($user_id) {
        try {
            $engine = new RecommendationEngine($this->db, $user_id);
            $stats = $engine->get_recommendation_stats();

            return [
                'success' => true,
                'user_id' => $user_id,
                'stats' => $stats
            ];
        } catch (Exception $e) {
            error_log("Error getting stats: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '통계를 불러오는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Get learning path progress
     */
    public function get_learning_path_progress($user_id) {
        try {
            $sql = "SELECT pp.*, lp.path_name, lp.description, lp.concepts_sequence
                    FROM mdl_recommend_path_progress pp
                    JOIN mdl_recommend_learning_path lp ON pp.path_id = lp.id
                    WHERE pp.userid = :userid AND pp.is_active = 1
                    ORDER BY pp.last_activity DESC
                    LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['userid' => $user_id]);
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($progress) {
                $concepts = json_decode($progress['concepts_sequence'], true);
                $current_index = $progress['current_concept_index'];

                return [
                    'success' => true,
                    'has_active_path' => true,
                    'path_name' => $progress['path_name'],
                    'description' => $progress['description'],
                    'overall_progress' => (float)$progress['overall_progress'],
                    'current_concept' => $current_index < count($concepts) ? $concepts[$current_index] : null,
                    'total_concepts' => count($concepts),
                    'completed_concepts' => $current_index,
                    'is_completed' => $progress['completed_at'] !== null
                ];
            } else {
                return [
                    'success' => true,
                    'has_active_path' => false
                ];
            }
        } catch (Exception $e) {
            error_log("Error getting learning path: " . $e->getMessage());
            return [
                'success' => false,
                'error' => '학습 경로를 불러오는 중 오류가 발생했습니다.'
            ];
        }
    }

    /**
     * Handle API requests
     */
    public function handle_request() {
        header('Content-Type: application/json');

        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        $user_id = (int)($_GET['userid'] ?? $_POST['userid'] ?? 0);

        if ($user_id === 0 && $action !== 'ping') {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            return;
        }

        switch ($action) {
            case 'ping':
                echo json_encode(['success' => true, 'message' => 'Recommendation API is running']);
                break;

            case 'get_recommendations':
                $count = (int)($_GET['count'] ?? $_POST['count'] ?? 3);
                echo json_encode($this->get_recommendations($user_id, $count));
                break;

            case 'get_profile':
                echo json_encode($this->get_student_profile($user_id));
                break;

            case 'record_activity':
                $question_id = (int)($_POST['questionid'] ?? 0);
                $is_correct = (bool)($_POST['is_correct'] ?? false);
                $time_spent = (int)($_POST['time_spent'] ?? 0);
                $score = $_POST['score'] ?? null;
                $concepts = json_decode($_POST['concepts'] ?? '[]', true);
                $digest_viewed = (bool)($_POST['digest_viewed'] ?? false);

                echo json_encode($this->record_activity(
                    $user_id, $question_id, $is_correct, $time_spent,
                    $score, $concepts, $digest_viewed
                ));
                break;

            case 'accept_recommendation':
                $rec_id = (int)($_POST['recommendation_id'] ?? 0);
                echo json_encode($this->accept_recommendation($user_id, $rec_id));
                break;

            case 'complete_recommendation':
                $rec_id = (int)($_POST['recommendation_id'] ?? 0);
                $score = (float)($_POST['score'] ?? 0);
                $time_taken = (int)($_POST['time_taken'] ?? 0);
                echo json_encode($this->complete_recommendation($user_id, $rec_id, $score, $time_taken));
                break;

            case 'get_stats':
                echo json_encode($this->get_stats($user_id));
                break;

            case 'get_learning_path':
                echo json_encode($this->get_learning_path_progress($user_id));
                break;

            default:
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid action',
                    'available_actions' => [
                        'ping', 'get_recommendations', 'get_profile', 'record_activity',
                        'accept_recommendation', 'complete_recommendation', 'get_stats', 'get_learning_path'
                    ]
                ]);
        }
    }
}

// API Endpoint handling
if (php_sapi_name() !== 'cli') {
    $api = new RecommendationAPI();
    $api->handle_request();
}
