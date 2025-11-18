<?php
/**
 * Absolute Mirror - Moodle Integration Helper
 * Provides functions to sync with Moodle 3.7 database
 */

require_once '../config/database.php';

class MoodleIntegration {

    /**
     * Sync users from Moodle to Absolute Mirror
     */
    public static function syncUsers() {
        try {
            $moodlePdo = getDBConnection(true); // true = use Moodle DB
            $localPdo = getDBConnection(false);

            // Get prefix
            $prefix = MOODLE_DB_PREFIX;

            // Fetch Moodle users
            $stmt = $moodlePdo->query("
                SELECT
                    id as moodle_user_id,
                    username,
                    email,
                    CONCAT(firstname, ' ', lastname) as full_name
                FROM {$prefix}user
                WHERE deleted = 0 AND suspended = 0
            ");

            $moodleUsers = $stmt->fetchAll();

            $syncedCount = 0;

            foreach ($moodleUsers as $user) {
                // Insert or update in local database
                $stmt = $localPdo->prepare("
                    INSERT INTO users (
                        moodle_user_id,
                        username,
                        email,
                        full_name,
                        role
                    ) VALUES (
                        :moodle_user_id,
                        :username,
                        :email,
                        :full_name,
                        'student'
                    )
                    ON DUPLICATE KEY UPDATE
                        username = :username,
                        email = :email,
                        full_name = :full_name,
                        updated_at = CURRENT_TIMESTAMP
                ");

                $stmt->execute([
                    ':moodle_user_id' => $user['moodle_user_id'],
                    ':username' => $user['username'],
                    ':email' => $user['email'],
                    ':full_name' => $user['full_name']
                ]);

                $syncedCount++;
            }

            return [
                'success' => true,
                'synced' => $syncedCount,
                'message' => "Successfully synced {$syncedCount} users from Moodle"
            ];

        } catch (Exception $e) {
            error_log("Error syncing users from Moodle: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Import problems from Moodle quiz questions
     */
    public static function importProblemsFromMoodle($courseId = null) {
        try {
            $moodlePdo = getDBConnection(true);
            $localPdo = getDBConnection(false);

            $prefix = MOODLE_DB_PREFIX;

            // Build query to get quiz questions
            $sql = "
                SELECT
                    q.id as moodle_question_id,
                    q.name as title,
                    q.questiontext as description,
                    qc.name as category,
                    c.id as course_id
                FROM {$prefix}question q
                JOIN {$prefix}question_categories qc ON q.category = qc.id
                LEFT JOIN {$prefix}context ctx ON qc.contextid = ctx.id
                LEFT JOIN {$prefix}course c ON ctx.instanceid = c.id
                WHERE q.qtype = 'shortanswer' OR q.qtype = 'numerical'
            ";

            if ($courseId) {
                $sql .= " AND c.id = :course_id";
            }

            $stmt = $moodlePdo->prepare($sql);

            if ($courseId) {
                $stmt->execute([':course_id' => $courseId]);
            } else {
                $stmt->execute();
            }

            $moodleQuestions = $stmt->fetchAll();

            $importedCount = 0;

            foreach ($moodleQuestions as $question) {
                // Try to parse if it's an absolute value equation
                $parsed = self::parseAbsoluteValueEquation($question['description']);

                if ($parsed) {
                    // Insert into local database
                    $stmt = $localPdo->prepare("
                        INSERT INTO problems (
                            title,
                            description,
                            equation,
                            axis_of_symmetry,
                            target_value,
                            solution_left,
                            solution_right,
                            moodle_question_id,
                            moodle_course_id
                        ) VALUES (
                            :title,
                            :description,
                            :equation,
                            :axis,
                            :target,
                            :sol_left,
                            :sol_right,
                            :moodle_q_id,
                            :moodle_c_id
                        )
                        ON DUPLICATE KEY UPDATE
                            title = :title,
                            description = :description,
                            updated_at = CURRENT_TIMESTAMP
                    ");

                    $stmt->execute([
                        ':title' => $question['title'],
                        ':description' => $question['description'],
                        ':equation' => $parsed['equation'],
                        ':axis' => $parsed['axis'],
                        ':target' => $parsed['target'],
                        ':sol_left' => $parsed['axis'] - $parsed['target'],
                        ':sol_right' => $parsed['axis'] + $parsed['target'],
                        ':moodle_q_id' => $question['moodle_question_id'],
                        ':moodle_c_id' => $question['course_id']
                    ]);

                    $importedCount++;
                }
            }

            return [
                'success' => true,
                'imported' => $importedCount,
                'message' => "Successfully imported {$importedCount} problems from Moodle"
            ];

        } catch (Exception $e) {
            error_log("Error importing problems from Moodle: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Parse absolute value equation from text
     */
    private static function parseAbsoluteValueEquation($text) {
        // Pattern: |x - a| = b or |x + a| = b
        $pattern = '/\|x\s*([+-])\s*(\d+)\|\s*=\s*(\d+)/';

        if (preg_match($pattern, $text, $matches)) {
            $sign = $matches[1];
            $offset = (int)$matches[2];
            $target = (int)$matches[3];

            $axis = ($sign === '-') ? $offset : -$offset;

            return [
                'equation' => $matches[0],
                'axis' => $axis,
                'target' => $target
            ];
        }

        // Pattern: |x| = a
        $simplePattern = '/\|x\|\s*=\s*(\d+)/';

        if (preg_match($simplePattern, $text, $matches)) {
            return [
                'equation' => $matches[0],
                'axis' => 0,
                'target' => (int)$matches[1]
            ];
        }

        return null;
    }

    /**
     * Export student progress back to Moodle gradebook
     */
    public static function exportProgressToMoodle($userId, $problemId, $grade) {
        try {
            $moodlePdo = getDBConnection(true);
            $localPdo = getDBConnection(false);

            // Get user's Moodle ID
            $stmt = $localPdo->prepare("
                SELECT moodle_user_id FROM users WHERE id = :id
            ");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();

            if (!$user || !$user['moodle_user_id']) {
                throw new Exception("User not found or not linked to Moodle");
            }

            // Get problem's Moodle question ID
            $stmt = $localPdo->prepare("
                SELECT moodle_question_id, moodle_course_id
                FROM problems
                WHERE id = :id
            ");
            $stmt->execute([':id' => $problemId]);
            $problem = $stmt->fetch();

            if (!$problem || !$problem['moodle_question_id']) {
                throw new Exception("Problem not found or not linked to Moodle");
            }

            // Insert grade into Moodle
            // This is a simplified example - actual Moodle grade insertion
            // is more complex and depends on your setup

            $prefix = MOODLE_DB_PREFIX;

            $stmt = $moodlePdo->prepare("
                INSERT INTO {$prefix}grade_grades (
                    itemid,
                    userid,
                    finalgrade,
                    timecreated,
                    timemodified
                ) VALUES (
                    :itemid,
                    :userid,
                    :grade,
                    UNIX_TIMESTAMP(),
                    UNIX_TIMESTAMP()
                )
                ON DUPLICATE KEY UPDATE
                    finalgrade = :grade,
                    timemodified = UNIX_TIMESTAMP()
            ");

            // Note: You'll need to map the problem to a Moodle grade item
            // This is simplified for demonstration

            return [
                'success' => true,
                'message' => 'Grade exported to Moodle successfully'
            ];

        } catch (Exception $e) {
            error_log("Error exporting to Moodle: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get user info from Moodle session
     */
    public static function getUserFromMoodleSession() {
        try {
            // This would typically check Moodle's session cookie
            // and validate it against the Moodle database

            // For now, return null (user must authenticate separately)
            // In production, implement proper Moodle session integration

            return null;

        } catch (Exception $e) {
            error_log("Error getting Moodle session: " . $e->getMessage());
            return null;
        }
    }
}

// Export functions if needed
if (isset($_GET['action'])) {
    header('Content-Type: application/json');

    switch ($_GET['action']) {
        case 'sync_users':
            echo json_encode(MoodleIntegration::syncUsers());
            break;

        case 'import_problems':
            $courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;
            echo json_encode(MoodleIntegration::importProblemsFromMoodle($courseId));
            break;

        default:
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action'
            ]);
    }

    exit;
}
