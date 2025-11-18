<?php
/**
 * Moodle Synchronization Service
 * Syncs questions and users from Moodle to local database
 */

require_once __DIR__ . '/MoodleClient.php';
require_once __DIR__ . '/../../utils/Database.php';

class MoodleSyncService {
    private $moodle;
    private $db;

    public function __construct() {
        $this->moodle = new MoodleClient();
        $this->db = Database::getInstance();
    }

    /**
     * Sync questions from Moodle
     */
    public function syncQuestions($categoryId = null) {
        $logId = $this->createSyncLog('questions');

        try {
            $questions = $this->moodle->getQuestions($categoryId);
            $totalQuestions = count($questions);

            $this->updateSyncLog($logId, 'in_progress', 0, $totalQuestions);

            $synced = 0;
            foreach ($questions as $question) {
                $this->saveQuestion($question);
                $synced++;

                if ($synced % 10 === 0) {
                    $this->updateSyncLog($logId, 'in_progress', $synced, $totalQuestions);
                }
            }

            $this->updateSyncLog($logId, 'completed', $totalQuestions, $totalQuestions);

            return [
                'success' => true,
                'synced' => $totalQuestions,
                'log_id' => $logId
            ];

        } catch (Exception $e) {
            $this->updateSyncLog($logId, 'failed', 0, 0, $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'log_id' => $logId
            ];
        }
    }

    /**
     * Save or update question in database
     */
    private function saveQuestion($question) {
        // Extract metadata
        $metadata = json_encode([
            'qtype' => $question['qtype'] ?? null,
            'options' => $question['options'] ?? null,
            'tags' => $question['tags'] ?? []
        ]);

        // Check if question exists
        $existing = $this->db->fetchOne(
            "SELECT id FROM problems WHERE moodle_question_id = ?",
            [$question['id']]
        );

        if ($existing) {
            // Update existing question
            $this->db->query(
                "UPDATE problems SET
                    title = ?,
                    question_text = ?,
                    question_type = ?,
                    metadata = ?,
                    updated_at = NOW()
                WHERE moodle_question_id = ?",
                [
                    $question['name'] ?? '',
                    $question['questiontext'] ?? '',
                    $question['qtype'] ?? '',
                    $metadata,
                    $question['id']
                ]
            );
            $problemId = $existing['id'];
        } else {
            // Insert new question
            $problemId = $this->db->insert(
                "INSERT INTO problems
                (moodle_question_id, title, question_text, question_type, metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
                [
                    $question['id'],
                    $question['name'] ?? '',
                    $question['questiontext'] ?? '',
                    $question['qtype'] ?? '',
                    $metadata
                ]
            );
        }

        // Extract and save filters
        $this->extractAndSaveFilters($problemId, $question);

        return $problemId;
    }

    /**
     * Extract filters from question metadata
     */
    private function extractAndSaveFilters($problemId, $question) {
        // Delete existing filters
        $this->db->query(
            "DELETE FROM problem_filters WHERE problem_id = ?",
            [$problemId]
        );

        $filters = [];

        // Extract grade level from tags or category
        if (isset($question['tags'])) {
            foreach ($question['tags'] as $tag) {
                if (preg_match('/grade[_-]?(\d+)/i', $tag, $matches)) {
                    $filters[] = ['grade_level', $matches[1]];
                }
            }
        }

        // Extract difficulty from question name or metadata
        if (isset($question['name'])) {
            if (preg_match('/(easy|medium|hard|expert)/i', $question['name'], $matches)) {
                $filters[] = ['difficulty_level', strtolower($matches[1])];
            }
        }

        // Extract topic from category name
        if (isset($question['category'])) {
            $filters[] = ['topic', $question['category']];
        }

        // Extract question type
        if (isset($question['qtype'])) {
            $filters[] = ['question_type', $question['qtype']];
        }

        // Save filters
        foreach ($filters as $filter) {
            $this->db->query(
                "INSERT INTO problem_filters (problem_id, filter_key, filter_value)
                VALUES (?, ?, ?)",
                [$problemId, $filter[0], $filter[1]]
            );
        }
    }

    /**
     * Sync users from Moodle
     */
    public function syncUsers($courseId = null) {
        $logId = $this->createSyncLog('users');

        try {
            $users = $courseId
                ? $this->moodle->getEnrolledUsers($courseId)
                : $this->moodle->getUsers();

            $totalUsers = count($users);
            $this->updateSyncLog($logId, 'in_progress', 0, $totalUsers);

            $synced = 0;
            foreach ($users as $user) {
                $this->saveUser($user);
                $synced++;
            }

            $this->updateSyncLog($logId, 'completed', $totalUsers, $totalUsers);

            return [
                'success' => true,
                'synced' => $totalUsers,
                'log_id' => $logId
            ];

        } catch (Exception $e) {
            $this->updateSyncLog($logId, 'failed', 0, 0, $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'log_id' => $logId
            ];
        }
    }

    /**
     * Save or update user in database
     */
    private function saveUser($user) {
        $existing = $this->db->fetchOne(
            "SELECT id FROM students WHERE moodle_user_id = ?",
            [$user['id']]
        );

        if ($existing) {
            $this->db->query(
                "UPDATE students SET
                    username = ?,
                    full_name = ?,
                    email = ?,
                    updated_at = NOW()
                WHERE moodle_user_id = ?",
                [
                    $user['username'] ?? '',
                    $user['fullname'] ?? '',
                    $user['email'] ?? '',
                    $user['id']
                ]
            );
        } else {
            $this->db->insert(
                "INSERT INTO students
                (moodle_user_id, username, full_name, email, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())",
                [
                    $user['id'],
                    $user['username'] ?? '',
                    $user['fullname'] ?? '',
                    $user['email'] ?? ''
                ]
            );
        }
    }

    /**
     * Create sync log entry
     */
    private function createSyncLog($syncType) {
        return $this->db->insert(
            "INSERT INTO moodle_sync_log (sync_type, sync_status, started_at)
            VALUES (?, 'started', NOW())",
            [$syncType]
        );
    }

    /**
     * Update sync log
     */
    private function updateSyncLog($logId, $status, $processed, $total, $error = null) {
        $this->db->query(
            "UPDATE moodle_sync_log SET
                sync_status = ?,
                items_processed = ?,
                items_total = ?,
                error_message = ?,
                completed_at = IF(? IN ('completed', 'failed'), NOW(), NULL)
            WHERE id = ?",
            [$status, $processed, $total, $error, $status, $logId]
        );
    }

    /**
     * Full sync (questions and users)
     */
    public function fullSync() {
        $results = [
            'questions' => $this->syncQuestions(),
            'users' => $this->syncUsers()
        ];

        return $results;
    }
}
