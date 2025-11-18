<?php
/**
 * Moodle Questions API Endpoint
 * Fetches question data from Moodle database
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

require_once __DIR__ . '/config.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(['status' => 'ok'], 200);
}

// Get request method and question ID
$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
$questionId = null;

if (preg_match('#^/(\d+)$#', $pathInfo, $matches)) {
    $questionId = (int)$matches[1];
}

// Route handling
switch ($method) {
    case 'GET':
        if ($questionId) {
            getQuestion($questionId);
        } else {
            getQuestions();
        }
        break;

    case 'POST':
        createQuestion();
        break;

    default:
        sendErrorResponse('Method not allowed', 405);
}

/**
 * Get single question by ID
 * @param int $id
 */
function getQuestion($id) {
    $pdo = getDbConnection();

    if (!$pdo) {
        sendErrorResponse('Database connection failed', 500);
    }

    try {
        // Fetch question from Moodle database
        $stmt = $pdo->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                q.defaultmark,
                q.generalfeedback,
                qc.name as category_name
            FROM " . MOODLE_PREFIX . "question q
            LEFT JOIN " . MOODLE_PREFIX . "question_categories qc ON q.category = qc.id
            WHERE q.id = :id
            LIMIT 1
        ");

        $stmt->execute(['id' => $id]);
        $question = $stmt->fetch();

        if (!$question) {
            // Return demo question if not found
            sendSuccessResponse(getDemoQuestion($id));
            return;
        }

        // Fetch answer options for multiple choice questions
        $options = [];
        if ($question['qtype'] === 'multichoice') {
            $stmt = $pdo->prepare("
                SELECT
                    answer,
                    fraction,
                    feedback
                FROM " . MOODLE_PREFIX . "question_answers
                WHERE question = :id
                ORDER BY id
            ");

            $stmt->execute(['id' => $id]);
            $options = $stmt->fetchAll();
        }

        // Format response
        $response = [
            'id' => (int)$question['id'],
            'text' => strip_tags($question['questiontext']),
            'type' => mapQuestionType($question['qtype']),
            'points' => (float)$question['defaultmark'],
            'category' => $question['category_name'],
            'options' => array_map(function($opt) {
                return strip_tags($opt['answer']);
            }, $options),
            'correctAnswer' => getCorrectAnswer($options),
        ];

        sendSuccessResponse($response);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendErrorResponse('Failed to fetch question', 500);
    }
}

/**
 * Get list of questions
 */
function getQuestions() {
    $pdo = getDbConnection();

    if (!$pdo) {
        // Return demo questions if DB connection fails
        sendSuccessResponse(getDemoQuestions());
        return;
    }

    try {
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 10;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $stmt = $pdo->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                q.defaultmark,
                qc.name as category_name
            FROM " . MOODLE_PREFIX . "question q
            LEFT JOIN " . MOODLE_PREFIX . "question_categories qc ON q.category = qc.id
            WHERE q.parent = 0
            ORDER BY q.id DESC
            LIMIT :limit OFFSET :offset
        ");

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $questions = $stmt->fetchAll();

        if (empty($questions)) {
            sendSuccessResponse(getDemoQuestions());
            return;
        }

        $response = array_map(function($q) {
            return [
                'id' => (int)$q['id'],
                'text' => strip_tags($q['questiontext']),
                'type' => mapQuestionType($q['qtype']),
                'points' => (float)$q['defaultmark'],
                'category' => $q['category_name'],
            ];
        }, $questions);

        sendSuccessResponse($response);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendSuccessResponse(getDemoQuestions());
    }
}

/**
 * Create new question (for testing)
 */
function createQuestion() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }

    // Validate required fields
    $required = ['text', 'type'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            sendErrorResponse("Missing required field: $field", 400);
        }
    }

    // Return demo response (actual creation would require Moodle API)
    sendSuccessResponse([
        'id' => rand(1000, 9999),
        'text' => $input['text'],
        'type' => $input['type'],
        'created' => true,
    ]);
}

/**
 * Map Moodle question type to simplified type
 * @param string $moodleType
 * @return string
 */
function mapQuestionType($moodleType) {
    $typeMap = [
        'multichoice' => 'multiple_choice',
        'truefalse' => 'true_false',
        'shortanswer' => 'short_answer',
        'essay' => 'essay',
        'numerical' => 'numerical',
        'matching' => 'matching',
    ];

    return isset($typeMap[$moodleType]) ? $typeMap[$moodleType] : 'unknown';
}

/**
 * Get correct answer from options
 * @param array $options
 * @return string|null
 */
function getCorrectAnswer($options) {
    foreach ($options as $opt) {
        if ((float)$opt['fraction'] > 0) {
            return strip_tags($opt['answer']);
        }
    }
    return null;
}

/**
 * Get demo question (fallback when DB is unavailable)
 * @param int $id
 * @return array
 */
function getDemoQuestion($id) {
    $demoQuestions = [
        [
            'id' => 1,
            'text' => '다음 중 분수 3/4를 소수로 나타내면?',
            'type' => 'multiple_choice',
            'options' => ['0.25', '0.5', '0.75', '1.0'],
            'correctAnswer' => '0.75',
            'points' => 1.0,
            'category' => 'Mathematics - Fractions',
        ],
        [
            'id' => 2,
            'text' => '원의 넓이를 구하는 공식은 무엇인가요?',
            'type' => 'multiple_choice',
            'options' => ['πr', 'πr²', '2πr', 'πd'],
            'correctAnswer' => 'πr²',
            'points' => 1.0,
            'category' => 'Mathematics - Geometry',
        ],
        [
            'id' => 3,
            'text' => '12 + 8 = ?',
            'type' => 'short_answer',
            'correctAnswer' => '20',
            'points' => 1.0,
            'category' => 'Mathematics - Arithmetic',
        ],
    ];

    $index = ($id - 1) % count($demoQuestions);
    $question = $demoQuestions[$index];
    $question['id'] = $id;

    return $question;
}

/**
 * Get demo questions list
 * @return array
 */
function getDemoQuestions() {
    return [
        getDemoQuestion(1),
        getDemoQuestion(2),
        getDemoQuestion(3),
    ];
}
