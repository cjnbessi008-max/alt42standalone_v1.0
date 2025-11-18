<?php
/**
 * Number Memory Pulse - Game Functions
 * Core game logic and database operations
 */

require_once(__DIR__ . '/config.php');

/**
 * Get a random problem at specified difficulty
 * @param int $courseid Course ID
 * @param int $difficulty Difficulty level (1-5)
 * @return object|null Problem object or null
 */
function nmp_get_random_problem($courseid, $difficulty) {
    $db = nmp_get_db();

    $problems = $db->get_records(NMP_TABLE_PROBLEMS, array(
        'course_id' => $courseid,
        'difficulty_level' => $difficulty,
        'is_active' => 1
    ));

    if (empty($problems)) {
        return null;
    }

    // Get a random problem
    $problems = array_values($problems);
    return $problems[array_rand($problems)];
}

/**
 * Get user progress
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return object|null Progress object or null
 */
function nmp_get_user_progress($userid, $courseid) {
    $db = nmp_get_db();

    return $db->get_record(NMP_TABLE_PROGRESS, array(
        'user_id' => $userid,
        'course_id' => $courseid
    ));
}

/**
 * Initialize user progress
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return object Progress object
 */
function nmp_init_user_progress($userid, $courseid) {
    $db = nmp_get_db();
    $now = time();

    $progress = new stdClass();
    $progress->user_id = $userid;
    $progress->course_id = $courseid;
    $progress->current_level = 1;
    $progress->total_score = 0;
    $progress->total_attempts = 0;
    $progress->correct_attempts = 0;
    $progress->current_streak = 0;
    $progress->best_streak = 0;
    $progress->total_time_spent = 0;
    $progress->last_played_at = null;
    $progress->created_at = $now;
    $progress->updated_at = $now;

    $progress->id = $db->insert_record(NMP_TABLE_PROGRESS, $progress);

    return $progress;
}

/**
 * Calculate accuracy percentage
 * @param object $progress Progress object
 * @return float Accuracy percentage
 */
function nmp_calculate_accuracy($progress) {
    if ($progress->total_attempts == 0) {
        return 0;
    }

    return round(($progress->correct_attempts / $progress->total_attempts) * 100, 2);
}

/**
 * Update user level based on progress
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return bool Success
 */
function nmp_update_user_level($userid, $courseid) {
    $db = nmp_get_db();
    $progress = nmp_get_user_progress($userid, $courseid);

    if (!$progress) {
        return false;
    }

    // Level up criteria:
    // - Accuracy >= 80%
    // - At least 5 attempts at current level
    // - Score threshold based on level

    $accuracy = nmp_calculate_accuracy($progress);
    $scorethresholds = array(
        1 => 50,    // Level 1 -> 2: 50 points
        2 => 150,   // Level 2 -> 3: 150 points
        3 => 300,   // Level 3 -> 4: 300 points
        4 => 500,   // Level 4 -> 5: 500 points
        5 => 1000   // Level 5+: Stay at 5
    );

    $currentlevel = $progress->current_level;
    $threshold = isset($scorethresholds[$currentlevel]) ? $scorethresholds[$currentlevel] : 1000;

    if ($progress->total_score >= $threshold &&
        $accuracy >= 80 &&
        $progress->total_attempts >= 5 &&
        $currentlevel < 5) {

        $progress->current_level = $currentlevel + 1;
        $progress->updated_at = time();

        return $db->update_record(NMP_TABLE_PROGRESS, $progress);
    }

    return false;
}

/**
 * Get leaderboard
 * @param int $courseid Course ID
 * @param int $limit Number of entries to return
 * @return array Leaderboard entries
 */
function nmp_get_leaderboard($courseid, $limit = 10) {
    global $DB;
    $db = nmp_get_db();

    // First, update the leaderboard
    nmp_update_leaderboard($courseid);

    // Then fetch top entries
    $sql = "SELECT l.*, u.firstname, u.lastname, u.picture
            FROM {" . NMP_TABLE_LEADERBOARD . "} l
            JOIN {user} u ON l.user_id = u.id
            WHERE l.course_id = :courseid
            ORDER BY l.rank_position ASC
            LIMIT :limit";

    $entries = $DB->get_records_sql($sql, array(
        'courseid' => $courseid,
        'limit' => $limit
    ));

    $result = array();
    foreach ($entries as $entry) {
        $result[] = array(
            'rank' => $entry->rank_position,
            'user_id' => $entry->user_id,
            'name' => fullname($entry),
            'score' => $entry->total_score,
            'level' => $entry->current_level,
            'best_streak' => $entry->best_streak
        );
    }

    return $result;
}

/**
 * Update leaderboard for a course
 * @param int $courseid Course ID
 * @return bool Success
 */
function nmp_update_leaderboard($courseid) {
    global $DB;
    $db = nmp_get_db();

    // Delete existing entries for this course
    $db->delete_records(NMP_TABLE_LEADERBOARD, array('course_id' => $courseid));

    // Get top performers
    $sql = "SELECT user_id, course_id, total_score, current_level, best_streak
            FROM {" . NMP_TABLE_PROGRESS . "}
            WHERE course_id = :courseid
            ORDER BY total_score DESC, best_streak DESC, current_level DESC
            LIMIT " . NMP_MAX_LEADERBOARD_SIZE;

    $topusers = $DB->get_records_sql($sql, array('courseid' => $courseid));

    $rank = 1;
    $now = time();

    foreach ($topusers as $user) {
        $entry = new stdClass();
        $entry->user_id = $user->user_id;
        $entry->course_id = $courseid;
        $entry->rank_position = $rank;
        $entry->total_score = $user->total_score;
        $entry->current_level = $user->current_level;
        $entry->best_streak = $user->best_streak;
        $entry->updated_at = $now;

        $db->insert_record(NMP_TABLE_LEADERBOARD, $entry);
        $rank++;
    }

    return true;
}

/**
 * Get detailed user statistics
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return array Statistics
 */
function nmp_get_user_stats($userid, $courseid) {
    global $DB;

    $progress = nmp_get_user_progress($userid, $courseid);

    if (!$progress) {
        return array(
            'total_attempts' => 0,
            'correct_attempts' => 0,
            'accuracy' => 0,
            'total_score' => 0,
            'current_level' => 1,
            'attempts_by_difficulty' => array(),
            'recent_attempts' => array()
        );
    }

    // Get attempts by difficulty
    $sql = "SELECT p.difficulty_level, COUNT(*) as count,
                   SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count
            FROM {" . NMP_TABLE_ATTEMPTS . "} a
            JOIN {" . NMP_TABLE_PROBLEMS . "} p ON a.problem_id = p.id
            WHERE a.user_id = :userid AND p.course_id = :courseid
            GROUP BY p.difficulty_level
            ORDER BY p.difficulty_level";

    $bydifficulty = $DB->get_records_sql($sql, array(
        'userid' => $userid,
        'courseid' => $courseid
    ));

    $difficultystats = array();
    foreach ($bydifficulty as $stat) {
        $difficultystats[] = array(
            'difficulty' => $stat->difficulty_level,
            'attempts' => $stat->count,
            'correct' => $stat->correct_count,
            'accuracy' => $stat->count > 0 ? round(($stat->correct_count / $stat->count) * 100, 2) : 0
        );
    }

    // Get recent attempts
    $sql = "SELECT a.*, p.name, p.difficulty_level, p.pattern
            FROM {" . NMP_TABLE_ATTEMPTS . "} a
            JOIN {" . NMP_TABLE_PROBLEMS . "} p ON a.problem_id = p.id
            WHERE a.user_id = :userid AND p.course_id = :courseid
            ORDER BY a.attempted_at DESC
            LIMIT 10";

    $recentattempts = $DB->get_records_sql($sql, array(
        'userid' => $userid,
        'courseid' => $courseid
    ));

    $recent = array();
    foreach ($recentattempts as $attempt) {
        $recent[] = array(
            'problem_name' => $attempt->name,
            'difficulty' => $attempt->difficulty_level,
            'is_correct' => $attempt->is_correct == 1,
            'points_earned' => $attempt->points_earned,
            'time_spent' => $attempt->time_spent,
            'attempted_at' => $attempt->attempted_at
        );
    }

    return array(
        'total_attempts' => $progress->total_attempts,
        'correct_attempts' => $progress->correct_attempts,
        'accuracy' => nmp_calculate_accuracy($progress),
        'total_score' => $progress->total_score,
        'current_level' => $progress->current_level,
        'current_streak' => $progress->current_streak,
        'best_streak' => $progress->best_streak,
        'total_time_spent' => $progress->total_time_spent,
        'avg_time_per_attempt' => $progress->total_attempts > 0 ?
            round($progress->total_time_spent / $progress->total_attempts, 2) : 0,
        'attempts_by_difficulty' => $difficultystats,
        'recent_attempts' => $recent
    );
}

/**
 * Generate a random number pattern
 * @param int $length Pattern length
 * @return string Number pattern
 */
function nmp_generate_pattern($length) {
    $pattern = '';
    for ($i = 0; $i < $length; $i++) {
        $pattern .= rand(0, 9);
    }
    return $pattern;
}

/**
 * Create a new problem
 * @param array $data Problem data
 * @return int Problem ID
 */
function nmp_create_problem($data) {
    global $NMP_POINTS_CONFIG, $NMP_DURATION_CONFIG;
    $db = nmp_get_db();
    $now = time();

    $problem = new stdClass();
    $problem->course_id = $data['course_id'];
    $problem->name = $data['name'];
    $problem->description = isset($data['description']) ? $data['description'] : '';
    $problem->pattern = $data['pattern'];
    $problem->pattern_length = strlen($data['pattern']);
    $problem->difficulty_level = $data['difficulty_level'];
    $problem->display_duration = isset($data['display_duration']) ?
        $data['display_duration'] : $NMP_DURATION_CONFIG[$data['difficulty_level']];
    $problem->max_attempts = isset($data['max_attempts']) ? $data['max_attempts'] : null;
    $problem->points = isset($data['points']) ?
        $data['points'] : $NMP_POINTS_CONFIG[$data['difficulty_level']];
    $problem->time_limit = isset($data['time_limit']) ? $data['time_limit'] : null;
    $problem->is_active = 1;
    $problem->created_by = nmp_get_current_user_id();
    $problem->created_at = $now;
    $problem->updated_at = $now;

    return $db->insert_record(NMP_TABLE_PROBLEMS, $problem);
}

/**
 * Delete a problem
 * @param int $problemid Problem ID
 * @return bool Success
 */
function nmp_delete_problem($problemid) {
    $db = nmp_get_db();
    return $db->delete_records(NMP_TABLE_PROBLEMS, array('id' => $problemid));
}

/**
 * Get user's rank in course
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return int|null Rank position or null
 */
function nmp_get_user_rank($userid, $courseid) {
    $db = nmp_get_db();

    $entry = $db->get_record(NMP_TABLE_LEADERBOARD, array(
        'user_id' => $userid,
        'course_id' => $courseid
    ));

    return $entry ? $entry->rank_position : null;
}
