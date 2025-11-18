<?php
// API endpoint for Dot Collector webapp
// Handles AJAX requests from the embedded iframe

define('AJAX_SCRIPT', true);
require_once('../../config.php');
require_once('lib.php');
require_once('classes/recommendation_engine.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Get request parameters
$action = optional_param('action', '', PARAM_ALPHA);
$token = optional_param('token', '', PARAM_TEXT);
$data = file_get_contents('php://input');
$requestdata = json_decode($data, true);

// Validate session token
function validate_session($token) {
    $db = dotcollector_get_external_db();
    if (!$db) {
        return false;
    }

    $stmt = $db->prepare("SELECT * FROM sessions WHERE session_token = ? AND is_active = 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $session = $result->fetch_assoc();
    $stmt->close();
    $db->close();

    return $session;
}

// Response helper
function api_response($success, $data = null, $message = '') {
    echo json_encode(array(
        'success' => $success,
        'data' => $data,
        'message' => $message
    ));
    exit;
}

// Validate token
$session = validate_session($token);
if (!$session && $action !== 'ping') {
    api_response(false, null, 'Invalid or expired session');
}

// Route actions
switch ($action) {
    case 'ping':
        api_response(true, array('status' => 'ok'), 'Service is running');
        break;

    case 'get_questions':
        $questions = dotcollector_get_questions();
        api_response(true, $questions);
        break;

    case 'get_question':
        $questionid = $requestdata['question_id'] ?? 0;
        $db = dotcollector_get_external_db();
        $stmt = $db->prepare("SELECT * FROM questions WHERE id = ?");
        $stmt->bind_param("i", $questionid);
        $stmt->execute();
        $result = $stmt->get_result();
        $question = $result->fetch_assoc();
        $stmt->close();
        $db->close();
        api_response(true, $question);
        break;

    case 'submit_answer':
        $questionid = $requestdata['question_id'] ?? 0;
        $answer = $requestdata['answer'] ?? 0;
        $timespent = $requestdata['time_spent'] ?? 0;

        $db = dotcollector_get_external_db();

        // Get correct answer
        $stmt = $db->prepare("SELECT correct_answer FROM questions WHERE id = ?");
        $stmt->bind_param("i", $questionid);
        $stmt->execute();
        $result = $stmt->get_result();
        $question = $result->fetch_assoc();
        $stmt->close();

        $iscorrect = abs($answer - $question['correct_answer']) < 0.01 ? 1 : 0;

        // Insert attempt
        $userid = $session['moodle_user_id'];
        $sessionid = $session['id'];
        $stmt = $db->prepare("INSERT INTO student_attempts (session_id, question_id, moodle_user_id, student_answer, is_correct, time_spent_seconds, completed_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("iiidii", $sessionid, $questionid, $userid, $answer, $iscorrect, $timespent);
        $stmt->execute();
        $attemptid = $stmt->insert_id;
        $stmt->close();
        $db->close();

        api_response(true, array(
            'attempt_id' => $attemptid,
            'is_correct' => $iscorrect,
            'correct_answer' => $question['correct_answer']
        ));
        break;

    case 'save_dots':
        $questionid = $requestdata['question_id'] ?? 0;
        $attemptid = $requestdata['attempt_id'] ?? 0;
        $accumulatedarea = $requestdata['accumulated_area'] ?? 0;
        $dotcount = $requestdata['dot_count'] ?? 0;
        $dotpositions = json_encode($requestdata['dot_positions'] ?? array());
        $vizdata = json_encode($requestdata['visualization_data'] ?? array());

        $db = dotcollector_get_external_db();
        $userid = $session['moodle_user_id'];

        // Check if record exists
        $stmt = $db->prepare("SELECT id FROM dot_accumulations WHERE attempt_id = ?");
        $stmt->bind_param("i", $attemptid);
        $stmt->execute();
        $result = $stmt->get_result();
        $existing = $result->fetch_assoc();
        $stmt->close();

        if ($existing) {
            // Update
            $stmt = $db->prepare("UPDATE dot_accumulations SET accumulated_area = ?, dot_count = ?, dot_positions = ?, visualization_data = ? WHERE attempt_id = ?");
            $stmt->bind_param("dissi", $accumulatedarea, $dotcount, $dotpositions, $vizdata, $attemptid);
        } else {
            // Insert
            $stmt = $db->prepare("INSERT INTO dot_accumulations (attempt_id, question_id, moodle_user_id, accumulated_area, dot_count, dot_positions, visualization_data) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("iiidiss", $attemptid, $questionid, $userid, $accumulatedarea, $dotcount, $dotpositions, $vizdata);
        }

        $stmt->execute();
        $stmt->close();
        $db->close();

        api_response(true, array('saved' => true));
        break;

    case 'get_progress':
        $userid = $session['moodle_user_id'];
        $db = dotcollector_get_external_db();

        $stmt = $db->prepare("SELECT COUNT(*) as total, SUM(is_correct) as correct FROM student_attempts WHERE moodle_user_id = ?");
        $stmt->bind_param("i", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $progress = $result->fetch_assoc();
        $stmt->close();
        $db->close();

        api_response(true, $progress);
        break;

    case 'get_recommended_questions':
        $userid = $session['moodle_user_id'];
        $count = $requestdata['count'] ?? 5;
        $strategy = $requestdata['strategy'] ?? 'adaptive';

        $db = dotcollector_get_external_db();
        $engine = new \mod_dotcollector\recommendation_engine($db, $userid);
        $recommended = $engine->get_recommended_questions($count, $strategy);
        $db->close();

        api_response(true, $recommended);
        break;

    case 'update_after_attempt':
        $userid = $session['moodle_user_id'];
        $questionid = $requestdata['question_id'] ?? 0;
        $iscorrect = $requestdata['is_correct'] ?? false;
        $timespent = $requestdata['time_spent'] ?? 0;

        $db = dotcollector_get_external_db();

        // Get question details
        $stmt = $db->prepare("SELECT difficulty_level, shape_type FROM questions WHERE id = ?");
        $stmt->bind_param("i", $questionid);
        $stmt->execute();
        $result = $stmt->get_result();
        $question = $result->fetch_assoc();
        $stmt->close();

        if ($question) {
            $engine = new \mod_dotcollector\recommendation_engine($db, $userid);
            $engine->update_after_attempt(
                $questionid,
                $iscorrect,
                $timespent,
                $question['difficulty_level'],
                $question['shape_type']
            );
        }

        $db->close();
        api_response(true, array('updated' => true));
        break;

    case 'get_analytics':
        $userid = $session['moodle_user_id'];

        $db = dotcollector_get_external_db();
        $engine = new \mod_dotcollector\recommendation_engine($db, $userid);
        $analytics = $engine->get_analytics();
        $db->close();

        api_response(true, $analytics);
        break;

    case 'get_student_profile':
        $userid = $session['moodle_user_id'];

        $db = dotcollector_get_external_db();
        $stmt = $db->prepare("
            SELECT
                current_skill_level,
                preferred_difficulty,
                learning_pace,
                total_questions_attempted,
                total_correct_answers,
                overall_accuracy_rate,
                average_time_per_question,
                strongest_shape_type,
                weakest_shape_type
            FROM student_profiles
            WHERE moodle_user_id = ?
        ");
        $stmt->bind_param("i", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();
        $db->close();

        if (!$profile) {
            $profile = array(
                'current_skill_level' => 1.0,
                'preferred_difficulty' => 2,
                'learning_pace' => 'medium',
                'total_questions_attempted' => 0,
                'total_correct_answers' => 0,
                'overall_accuracy_rate' => 0.0,
                'is_new_student' => true
            );
        }

        api_response(true, $profile);
        break;

    case 'get_skill_progression':
        $userid = $session['moodle_user_id'];

        $db = dotcollector_get_external_db();

        // Get profile ID
        $stmt = $db->prepare("SELECT id FROM student_profiles WHERE moodle_user_id = ?");
        $stmt->bind_param("i", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();

        if ($profile) {
            $stmt = $db->prepare("
                SELECT
                    skill_name,
                    proficiency_level,
                    questions_attempted,
                    questions_mastered,
                    last_practiced
                FROM skill_progression
                WHERE student_profile_id = ?
                ORDER BY proficiency_level DESC
            ");
            $stmt->bind_param("i", $profile['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $skills = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
        } else {
            $skills = array();
        }

        $db->close();
        api_response(true, $skills);
        break;

    case 'set_learning_preference':
        $userid = $session['moodle_user_id'];
        $difficulty = $requestdata['preferred_difficulty'] ?? null;
        $pace = $requestdata['learning_pace'] ?? null;

        $db = dotcollector_get_external_db();

        // Get or create profile
        $stmt = $db->prepare("SELECT id FROM student_profiles WHERE moodle_user_id = ?");
        $stmt->bind_param("i", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();

        if (!$profile) {
            $stmt = $db->prepare("INSERT INTO student_profiles (moodle_user_id) VALUES (?)");
            $stmt->bind_param("i", $userid);
            $stmt->execute();
            $profileid = $stmt->insert_id;
            $stmt->close();
        } else {
            $profileid = $profile['id'];
        }

        // Update preferences
        $updates = array();
        $params = array();
        $types = '';

        if ($difficulty !== null) {
            $updates[] = "preferred_difficulty = ?";
            $params[] = $difficulty;
            $types .= 'i';
        }

        if ($pace !== null) {
            $updates[] = "learning_pace = ?";
            $params[] = $pace;
            $types .= 's';
        }

        if (!empty($updates)) {
            $query = "UPDATE student_profiles SET " . implode(', ', $updates) . " WHERE id = ?";
            $params[] = $profileid;
            $types .= 'i';

            $stmt = $db->prepare($query);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $stmt->close();
        }

        $db->close();
        api_response(true, array('updated' => true));
        break;

    default:
        api_response(false, null, 'Unknown action');
}
