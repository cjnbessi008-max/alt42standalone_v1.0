<?php
/**
 * Area Fill Animation App - Get Problem API
 *
 * This API fetches math problem data from Moodle database
 * and returns it in JSON format for the animation app
 *
 * Moodle 3.7 compatible
 */

// Define constant for config.php
define('AREA_FILL_APP', true);

// Include configuration
require_once '../config.php';

// Set JSON header
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

/**
 * Send JSON response
 *
 * @param boolean $success Success status
 * @param mixed $data Response data
 * @param string $message Optional message
 */
function sendResponse($success, $data = null, $message = '') {
    $response = array(
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => time()
    );
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Get problem by ID from Moodle
 *
 * @param int $problemId Problem ID
 * @return array|null Problem data or null if not found
 */
function getProblemById($problemId) {
    try {
        $conn = getDBConnection();

        // Prepare statement to prevent SQL injection
        $stmt = $conn->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                qc.name as category,
                q.defaultmark,
                q.timecreated,
                q.timemodified
            FROM " . getTableName('question') . " q
            LEFT JOIN " . getTableName('question_categories') . " qc ON q.category = qc.id
            WHERE q.id = ?
        ");

        $stmt->bind_param("i", $problemId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $problem = $result->fetch_assoc();
            $stmt->close();
            return $problem;
        }

        $stmt->close();
        return null;
    } catch (Exception $e) {
        if (APP_DEBUG) {
            sendResponse(false, null, "Database error: " . $e->getMessage());
        } else {
            sendResponse(false, null, "Error fetching problem data");
        }
    }
}

/**
 * Get random area calculation problem
 *
 * @return array Random problem data
 */
function getRandomAreaProblem() {
    try {
        $conn = getDBConnection();

        // Get a random question related to area (filter by question text containing area-related keywords)
        $stmt = $conn->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                qc.name as category,
                q.defaultmark
            FROM " . getTableName('question') . " q
            LEFT JOIN " . getTableName('question_categories') . " qc ON q.category = qc.id
            WHERE q.questiontext LIKE '%넓이%'
               OR q.questiontext LIKE '%면적%'
               OR q.questiontext LIKE '%area%'
               OR q.name LIKE '%넓이%'
               OR q.name LIKE '%area%'
            ORDER BY RAND()
            LIMIT 1
        ");

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $problem = $result->fetch_assoc();
            $stmt->close();
            return $problem;
        }

        $stmt->close();
        return null;
    } catch (Exception $e) {
        if (APP_DEBUG) {
            sendResponse(false, null, "Database error: " . $e->getMessage());
        } else {
            sendResponse(false, null, "Error fetching random problem");
        }
    }
}

/**
 * Generate sample area problem (fallback if no Moodle data)
 *
 * @return array Sample problem data
 */
function getSampleAreaProblem() {
    $shapes = array(
        array(
            'id' => 'sample_1',
            'name' => '직사각형의 넓이',
            'questiontext' => '가로 8cm, 세로 5cm인 직사각형의 넓이를 구하세요.',
            'shape' => 'rectangle',
            'width' => 8,
            'height' => 5,
            'answer' => 40,
            'unit' => 'cm²'
        ),
        array(
            'id' => 'sample_2',
            'name' => '정사각형의 넓이',
            'questiontext' => '한 변이 6cm인 정사각형의 넓이를 구하세요.',
            'shape' => 'square',
            'side' => 6,
            'answer' => 36,
            'unit' => 'cm²'
        ),
        array(
            'id' => 'sample_3',
            'name' => '삼각형의 넓이',
            'questiontext' => '밑변 10cm, 높이 6cm인 삼각형의 넓이를 구하세요.',
            'shape' => 'triangle',
            'base' => 10,
            'height' => 6,
            'answer' => 30,
            'unit' => 'cm²'
        ),
        array(
            'id' => 'sample_4',
            'name' => '평행사변형의 넓이',
            'questiontext' => '밑변 9cm, 높이 4cm인 평행사변형의 넓이를 구하세요.',
            'shape' => 'parallelogram',
            'base' => 9,
            'height' => 4,
            'answer' => 36,
            'unit' => 'cm²'
        )
    );

    // Return random sample problem
    return $shapes[array_rand($shapes)];
}

// Main API logic
try {
    // Get request parameters
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $mode = isset($_GET['mode']) ? sanitizeInput($_GET['mode']) : 'sample';

    if ($mode === 'moodle' && $problemId > 0) {
        // Fetch specific problem from Moodle
        $problem = getProblemById($problemId);
        if ($problem) {
            sendResponse(true, $problem, 'Problem fetched successfully');
        } else {
            sendResponse(false, null, 'Problem not found');
        }
    } elseif ($mode === 'random') {
        // Fetch random area problem from Moodle
        $problem = getRandomAreaProblem();
        if ($problem) {
            sendResponse(true, $problem, 'Random problem fetched successfully');
        } else {
            // Fallback to sample if no Moodle data
            $problem = getSampleAreaProblem();
            sendResponse(true, $problem, 'Sample problem (no Moodle data available)');
        }
    } else {
        // Default: return sample problem
        $problem = getSampleAreaProblem();
        sendResponse(true, $problem, 'Sample problem loaded');
    }

} catch (Exception $e) {
    if (APP_DEBUG) {
        sendResponse(false, null, "Error: " . $e->getMessage());
    } else {
        sendResponse(false, null, "An error occurred");
    }
}
