<?php
/**
 * Moodle LMS Connector
 * Integrates with Moodle 3.7 to fetch questions and quiz data
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';

class MoodleConnector {
    private $db;
    private $moodle_url;
    private $token;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->moodle_url = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Fetch questions from Moodle using web services
     */
    public function fetchQuestionsAPI($course_id = null) {
        $service_url = $this->moodle_url . '/webservice/rest/server.php';

        $params = array(
            'wstoken' => $this->token,
            'wsfunction' => 'mod_quiz_get_quizzes_by_courses',
            'moodlewsrestformat' => 'json'
        );

        if ($course_id !== null) {
            $params['courseids[0]'] = $course_id;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $service_url . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code === 200) {
            return json_decode($response, true);
        }

        return array('error' => 'Failed to fetch from Moodle API', 'code' => $http_code);
    }

    /**
     * Fetch questions directly from database
     * More reliable for Moodle 3.7 with MySQL 5.7
     */
    public function fetchQuestionsDB($limit = 20, $category_id = null) {
        try {
            $sql = "SELECT
                        q.id,
                        q.name,
                        q.questiontext,
                        q.qtype,
                        q.defaultmark,
                        qc.name as category_name,
                        qc.id as category_id
                    FROM mdl_question q
                    LEFT JOIN mdl_question_categories qc ON q.category = qc.id
                    WHERE q.parent = 0";

            if ($category_id !== null) {
                $sql .= " AND qc.id = :category_id";
            }

            $sql .= " ORDER BY q.id DESC LIMIT :limit";

            $stmt = $this->db->prepare($sql);

            if ($category_id !== null) {
                $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
            }

            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            return array('error' => $e->getMessage());
        }
    }

    /**
     * Get question details with answers
     */
    public function getQuestionDetails($question_id) {
        try {
            // Get question
            $sql = "SELECT * FROM mdl_question WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $question_id, PDO::PARAM_INT);
            $stmt->execute();
            $question = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$question) {
                return array('error' => 'Question not found');
            }

            // Get answers based on question type
            $answers_sql = "SELECT * FROM mdl_question_answers WHERE question = :question_id";
            $stmt = $this->db->prepare($answers_sql);
            $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
            $stmt->execute();
            $answers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $question['answers'] = $answers;

            return $question;
        } catch(PDOException $e) {
            return array('error' => $e->getMessage());
        }
    }

    /**
     * Get quiz attempts for similarity analysis
     */
    public function getQuizAttempts($quiz_id, $limit = 50) {
        try {
            $sql = "SELECT
                        qa.id,
                        qa.quiz,
                        qa.userid,
                        qa.attempt,
                        qa.sumgrades,
                        qa.timestart,
                        qa.timefinish,
                        u.firstname,
                        u.lastname
                    FROM mdl_quiz_attempts qa
                    LEFT JOIN mdl_user u ON qa.userid = u.id
                    WHERE qa.quiz = :quiz_id
                    ORDER BY qa.timestart DESC
                    LIMIT :limit";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            return array('error' => $e->getMessage());
        }
    }

    /**
     * Get courses list
     */
    public function getCourses($limit = 20) {
        try {
            $sql = "SELECT
                        c.id,
                        c.fullname,
                        c.shortname,
                        c.summary,
                        c.timecreated,
                        c.timemodified
                    FROM mdl_course c
                    WHERE c.visible = 1
                    ORDER BY c.id DESC
                    LIMIT :limit";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            return array('error' => $e->getMessage());
        }
    }

    /**
     * Calculate similarity score between questions (for scaling visualization)
     */
    public function calculateQuestionSimilarity($question1_id, $question2_id) {
        try {
            $q1 = $this->getQuestionDetails($question1_id);
            $q2 = $this->getQuestionDetails($question2_id);

            if (isset($q1['error']) || isset($q2['error'])) {
                return 0;
            }

            // Simple text similarity using Levenshtein distance
            $text1 = strip_tags($q1['questiontext']);
            $text2 = strip_tags($q2['questiontext']);

            $max_len = max(strlen($text1), strlen($text2));
            if ($max_len === 0) return 0;

            $distance = levenshtein(substr($text1, 0, 255), substr($text2, 0, 255));
            $similarity = 1 - ($distance / $max_len);

            // Factor in question type similarity
            if ($q1['qtype'] === $q2['qtype']) {
                $similarity += 0.1;
            }

            return min(1, max(0, $similarity));
        } catch(Exception $e) {
            return 0;
        }
    }
}
?>
