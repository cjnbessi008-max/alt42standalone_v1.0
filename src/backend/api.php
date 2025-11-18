&lt;?php
/**
 * REST API Endpoints
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/StabilityAnalyzer.php';

$db = Database::getInstance();
$analyzer = new StabilityAnalyzer();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/src/backend/api.php', '', $path);
$pathParts = array_filter(explode('/', $path));

// Helper function to send JSON response
function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Helper function to get JSON input
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

try {
    // Route the request
    $endpoint = $pathParts[1] ?? '';

    switch ($endpoint) {
        // ========================================
        // Student Response Endpoints
        // ========================================
        case 'responses':
            if ($method === 'POST') {
                // Submit a student response
                $data = getJsonInput();

                $required = ['student_id', 'problem_id', 'answer', 'is_correct'];
                foreach ($required as $field) {
                    if (!isset($data[$field])) {
                        sendJson(['error' => "Missing required field: $field"], 400);
                    }
                }

                $sql = "
                    INSERT INTO student_responses (
                        student_id, problem_id, answer, is_correct,
                        time_spent_seconds, attempt_number, confidence_level, hesitation_score
                    ) VALUES (
                        :student_id, :problem_id, :answer, :is_correct,
                        :time_spent_seconds, :attempt_number, :confidence_level, :hesitation_score
                    )
                ";

                $db->execute($sql, [
                    ':student_id' => $data['student_id'],
                    ':problem_id' => $data['problem_id'],
                    ':answer' => $data['answer'],
                    ':is_correct' => $data['is_correct'] ? 1 : 0,
                    ':time_spent_seconds' => $data['time_spent_seconds'] ?? null,
                    ':attempt_number' => $data['attempt_number'] ?? 1,
                    ':confidence_level' => $data['confidence_level'] ?? null,
                    ':hesitation_score' => $data['hesitation_score'] ?? null
                ]);

                $responseId = $db->lastInsertId();

                // Update stability for all concepts related to this problem
                $conceptSql = "SELECT concept_id FROM problem_concepts WHERE problem_id = :problem_id";
                $concepts = $db->fetchAll($conceptSql, [':problem_id' => $data['problem_id']]);

                foreach ($concepts as $concept) {
                    $analyzer->updateStability($data['student_id'], $concept['concept_id']);
                }

                sendJson([
                    'success' => true,
                    'response_id' => $responseId,
                    'message' => 'Response recorded and stability updated'
                ], 201);
            }
            break;

        // ========================================
        // Stability Analysis Endpoints
        // ========================================
        case 'stability':
            if ($method === 'GET') {
                $studentId = $_GET['student_id'] ?? null;
                $conceptId = $_GET['concept_id'] ?? null;

                if ($studentId && $conceptId) {
                    // Get specific stability score
                    $score = $analyzer->calculateStabilityScore($studentId, $conceptId);
                    sendJson(['stability_score' => $score]);
                } elseif ($studentId) {
                    // Get all unstable concepts for student
                    $unstable = $analyzer->getUnstableConcepts($studentId);
                    sendJson(['unstable_concepts' => $unstable]);
                } elseif ($conceptId) {
                    // Get all students struggling with concept
                    $students = $analyzer->getStudentsWithUnstableConcept($conceptId);
                    sendJson(['students' => $students]);
                } else {
                    sendJson(['error' => 'student_id or concept_id required'], 400);
                }
            }
            break;

        // ========================================
        // Student Endpoints
        // ========================================
        case 'students':
            if ($method === 'GET') {
                if (isset($pathParts[2])) {
                    // Get specific student
                    $studentId = $pathParts[2];
                    $sql = "SELECT * FROM students WHERE id = :id";
                    $student = $db->fetchOne($sql, [':id' => $studentId]);

                    if (!$student) {
                        sendJson(['error' => 'Student not found'], 404);
                    }

                    // Get student's stability data
                    $unstable = $analyzer->getUnstableConcepts($studentId);

                    sendJson([
                        'student' => $student,
                        'unstable_concepts' => $unstable
                    ]);
                } else {
                    // Get all students
                    $sql = "SELECT s.*, COUNT(cs.id) as unstable_count
                            FROM students s
                            LEFT JOIN concept_stability cs ON s.id = cs.student_id AND cs.is_unstable = 1
                            GROUP BY s.id
                            ORDER BY unstable_count DESC, s.name";
                    $students = $db->fetchAll($sql);
                    sendJson(['students' => $students]);
                }
            }
            break;

        // ========================================
        // Concept Endpoints
        // ========================================
        case 'concepts':
            if ($method === 'GET') {
                if (isset($pathParts[2])) {
                    // Get specific concept
                    $conceptId = $pathParts[2];
                    $sql = "SELECT * FROM concepts WHERE id = :id";
                    $concept = $db->fetchOne($sql, [':id' => $conceptId]);

                    if (!$concept) {
                        sendJson(['error' => 'Concept not found'], 404);
                    }

                    // Get students struggling with this concept
                    $students = $analyzer->getStudentsWithUnstableConcept($conceptId);

                    sendJson([
                        'concept' => $concept,
                        'struggling_students' => $students
                    ]);
                } else {
                    // Get all concepts with struggle counts
                    $sql = "SELECT c.*, COUNT(cs.id) as struggling_count
                            FROM concepts c
                            LEFT JOIN concept_stability cs ON c.id = cs.concept_id AND cs.is_unstable = 1
                            GROUP BY c.id
                            ORDER BY struggling_count DESC, c.name";
                    $concepts = $db->fetchAll($sql);
                    sendJson(['concepts' => $concepts]);
                }
            }
            break;

        // ========================================
        // Problem Endpoints
        // ========================================
        case 'problems':
            if ($method === 'GET') {
                $sql = "SELECT p.*, GROUP_CONCAT(c.name SEPARATOR ', ') as concepts
                        FROM problems p
                        LEFT JOIN problem_concepts pc ON p.id = pc.problem_id
                        LEFT JOIN concepts c ON pc.concept_id = c.id
                        GROUP BY p.id
                        ORDER BY p.id";
                $problems = $db->fetchAll($sql);
                sendJson(['problems' => $problems]);
            }
            break;

        // ========================================
        // Dashboard Endpoints
        // ========================================
        case 'dashboard':
            if ($method === 'GET') {
                $type = $pathParts[2] ?? 'teacher';

                if ($type === 'teacher') {
                    // Teacher dashboard data
                    $stats = [
                        'total_students' => $db->fetchOne("SELECT COUNT(*) as count FROM students")['count'],
                        'total_concepts' => $db->fetchOne("SELECT COUNT(*) as count FROM concepts")['count'],
                        'students_with_unstable_concepts' => $db->fetchOne(
                            "SELECT COUNT(DISTINCT student_id) as count FROM concept_stability WHERE is_unstable = 1"
                        )['count'],
                        'total_unstable_instances' => $db->fetchOne(
                            "SELECT COUNT(*) as count FROM concept_stability WHERE is_unstable = 1"
                        )['count']
                    ];

                    // Recent alerts
                    $alerts = $db->fetchAll("
                        SELECT
                            cs.*,
                            s.name as student_name,
                            c.name as concept_name
                        FROM concept_stability cs
                        JOIN students s ON cs.student_id = s.id
                        JOIN concepts c ON cs.concept_id = c.id
                        WHERE cs.is_unstable = 1
                        ORDER BY cs.last_response_at DESC
                        LIMIT 10
                    ");

                    // Concepts needing attention
                    $troubleConcepts = $db->fetchAll("
                        SELECT
                            c.id,
                            c.name,
                            COUNT(cs.id) as struggling_count,
                            AVG(cs.stability_score) as avg_stability
                        FROM concepts c
                        JOIN concept_stability cs ON c.id = cs.concept_id
                        WHERE cs.is_unstable = 1
                        GROUP BY c.id
                        ORDER BY struggling_count DESC
                        LIMIT 5
                    ");

                    sendJson([
                        'stats' => $stats,
                        'recent_alerts' => $alerts,
                        'trouble_concepts' => $troubleConcepts
                    ]);
                } else {
                    sendJson(['error' => 'Invalid dashboard type'], 400);
                }
            }
            break;

        default:
            sendJson(['error' => 'Endpoint not found'], 404);
    }

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJson(['error' => $e->getMessage()], 500);
}
