<?php
/**
 * Moodle Integration API
 * Sync data with Moodle LMS (3.7)
 */

require_once '../config/database.php';
require_once '../utils/cors.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Call Moodle Web Service API
 */
function callMoodleAPI($function, $params = []) {
    // Moodle configuration (should be in config file)
    $moodle_url = getenv('MOODLE_URL') ?: 'http://localhost/moodle';
    $moodle_token = getenv('MOODLE_TOKEN') ?: '';

    if (empty($moodle_token)) {
        throw new Exception('Moodle token not configured');
    }

    $endpoint = $moodle_url . '/webservice/rest/server.php';

    $params['wstoken'] = $moodle_token;
    $params['wsfunction'] = $function;
    $params['moodlewsrestformat'] = 'json';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        throw new Exception('Moodle API request failed with status: ' . $http_code);
    }

    return json_decode($response, true);
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'get_users':
                    // Get Moodle users
                    $users = callMoodleAPI('core_user_get_users', [
                        'criteria' => [
                            ['key' => 'firstname', 'value' => '%']
                        ]
                    ]);

                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'data' => $users
                    ]);
                    break;

                case 'get_courses':
                    // Get Moodle courses
                    $courses = callMoodleAPI('core_course_get_courses');

                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'data' => $courses
                    ]);
                    break;

                case 'get_logs':
                    // Get Moodle activity logs
                    $course_id = $_GET['course_id'] ?? null;
                    $user_id = $_GET['user_id'] ?? null;

                    if (!$course_id) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'course_id is required'
                        ]);
                        exit;
                    }

                    $params = ['courseid' => $course_id];
                    if ($user_id) {
                        $params['userid'] = $user_id;
                    }

                    $logs = callMoodleAPI('report_log_get_logs', $params);

                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'data' => $logs
                    ]);
                    break;

                default:
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid action'
                    ]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Moodle API error',
                'error' => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';

        try {
            switch ($action) {
                case 'sync_users':
                    // Sync Moodle users to local database
                    $users = callMoodleAPI('core_user_get_users', [
                        'criteria' => [
                            ['key' => 'firstname', 'value' => '%']
                        ]
                    ]);

                    $synced = 0;
                    foreach ($users['users'] as $moodle_user) {
                        // Insert or update student
                        $query = "INSERT INTO students (student_id, name, email, moodle_user_id)
                                 VALUES (:student_id, :name, :email, :moodle_id)
                                 ON DUPLICATE KEY UPDATE
                                 name = :name, email = :email, moodle_user_id = :moodle_id";

                        $stmt = $db->prepare($query);
                        $stmt->execute([
                            ':student_id' => 'MDL' . $moodle_user['id'],
                            ':name' => $moodle_user['firstname'] . ' ' . $moodle_user['lastname'],
                            ':email' => $moodle_user['email'],
                            ':moodle_id' => $moodle_user['id']
                        ]);

                        $synced++;
                    }

                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => "Synced {$synced} users from Moodle"
                    ]);
                    break;

                case 'import_logs':
                    // Import Moodle logs as learning logs
                    $course_id = $data['course_id'] ?? null;

                    if (!$course_id) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'course_id is required'
                        ]);
                        exit;
                    }

                    $logs = callMoodleAPI('report_log_get_logs', ['courseid' => $course_id]);

                    // Process and import logs
                    // This is a simplified version - you would need to map Moodle activities to concepts

                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Logs import initiated',
                        'data' => $logs
                    ]);
                    break;

                default:
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid action'
                    ]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Moodle sync error',
                'error' => $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
        break;
}
