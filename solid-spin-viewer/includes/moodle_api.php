<?php
/**
 * Moodle API Integration Class
 * Compatible with Moodle 3.7
 */

require_once __DIR__ . '/db.php';

class MoodleAPI {
    private $db;
    private $prefix;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->prefix = MOODLE_DB_PREFIX;
    }

    /**
     * Get question by ID from Moodle question bank
     * @param int $questionId Moodle question ID
     * @return array|false Question data or false
     */
    public function getQuestion($questionId) {
        $sql = "SELECT
                    q.id,
                    q.category,
                    q.parent,
                    q.name,
                    q.questiontext,
                    q.questiontextformat,
                    q.generalfeedback,
                    q.defaultmark,
                    q.penalty,
                    q.qtype,
                    q.length,
                    q.stamp,
                    q.timecreated,
                    q.timemodified,
                    q.createdby,
                    q.modifiedby,
                    qc.name as category_name,
                    qc.info as category_info
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :question_id";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([':question_id' => $questionId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error fetching question: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get question attempts by user
     * @param int $userId Moodle user ID
     * @param int $questionId Moodle question ID
     * @return array Question attempt history
     */
    public function getQuestionAttempts($userId, $questionId) {
        $sql = "SELECT
                    qa.id,
                    qa.questionusageid,
                    qa.slot,
                    qa.behaviour,
                    qa.questionid,
                    qa.variant,
                    qa.maxmark,
                    qa.minfraction,
                    qa.maxfraction,
                    qa.flagged,
                    qa.questionsummary,
                    qa.rightanswer,
                    qa.responsesummary,
                    qa.timemodified
                FROM {$this->prefix}question_attempts qa
                WHERE qa.questionid = :question_id
                ORDER BY qa.timemodified DESC";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([':question_id' => $questionId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching question attempts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user information
     * @param int $userId Moodle user ID
     * @return array|false User data or false
     */
    public function getUser($userId) {
        $sql = "SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.timecreated,
                    u.timemodified
                FROM {$this->prefix}user u
                WHERE u.id = :user_id AND u.deleted = 0";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error fetching user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get questions by category
     * @param int $categoryId Question category ID
     * @return array Questions in category
     */
    public function getQuestionsByCategory($categoryId) {
        $sql = "SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    q.timecreated,
                    q.timemodified
                FROM {$this->prefix}question q
                WHERE q.category = :category_id
                AND q.parent = 0
                ORDER BY q.name ASC";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([':category_id' => $categoryId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching questions by category: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get all question categories
     * @return array Question categories
     */
    public function getQuestionCategories() {
        $sql = "SELECT
                    id,
                    name,
                    contextid,
                    info,
                    infoformat,
                    stamp,
                    parent,
                    sortorder
                FROM {$this->prefix}question_categories
                ORDER BY sortorder ASC, name ASC";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching question categories: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Verify Moodle session token
     * @param string $token Session token
     * @return int|false User ID if valid, false otherwise
     */
    public function verifySessionToken($token) {
        $sql = "SELECT
                    s.userid,
                    s.timecreated,
                    s.timemodified
                FROM {$this->prefix}sessions s
                WHERE s.sid = :token
                AND s.timemodified > :expire_time";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([
                ':token' => $token,
                ':expire_time' => time() - SESSION_LIFETIME
            ]);
            $result = $stmt->fetch();
            return $result ? (int)$result['userid'] : false;
        } catch (PDOException $e) {
            error_log("Error verifying session token: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log activity in Moodle
     * @param int $userId User ID
     * @param string $action Action performed
     * @param int $objectId Object ID (e.g., question ID)
     * @param string $objectTable Object table name
     * @return bool Success
     */
    public function logActivity($userId, $action, $objectId, $objectTable = 'question') {
        $sql = "INSERT INTO {$this->prefix}logstore_standard_log
                (eventname, component, action, target, objecttable, objectid,
                 contextid, contextlevel, contextinstanceid, userid,
                 timecreated, origin, ip, realuserid)
                VALUES
                (:eventname, :component, :action, :target, :objecttable, :objectid,
                 1, 10, 0, :userid,
                 :timecreated, 'web', :ip, :realuserid)";

        try {
            $stmt = $this->db->getMoodleConnection()->prepare($sql);
            $stmt->execute([
                ':eventname' => '\\core\\event\\' . $action,
                ':component' => 'mod_quiz',
                ':action' => $action,
                ':target' => $objectTable,
                ':objecttable' => $objectTable,
                ':objectid' => $objectId,
                ':userid' => $userId,
                ':timecreated' => time(),
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                ':realuserid' => $userId
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Error logging activity: " . $e->getMessage());
            return false;
        }
    }
}
