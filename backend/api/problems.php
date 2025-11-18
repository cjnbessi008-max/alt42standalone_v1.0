<?php
/**
 * Problems API
 * 문제 관리 API
 */

require_once __DIR__ . '/../config/config.php';

// Get request method and parameters
$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
$pathParts = array_filter(explode('/', $pathInfo));

try {
    $db = getDbConnection();

    switch ($method) {
        case 'GET':
            if (count($pathParts) > 0) {
                // Get specific problem
                $problemId = intval($pathParts[0]);
                getProblem($db, $problemId);
            } else {
                // Get list of problems
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $perPage = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;
                $category = isset($_GET['category']) ? $_GET['category'] : null;
                getProblems($db, $page, $perPage, $category);
            }
            break;

        case 'POST':
            // Create new problem
            $data = getRequestBody();
            createProblem($db, $data);
            break;

        case 'PUT':
            // Update problem
            if (count($pathParts) > 0) {
                $problemId = intval($pathParts[0]);
                $data = getRequestBody();
                updateProblem($db, $problemId, $data);
            } else {
                sendError('Problem ID required', 400);
            }
            break;

        case 'DELETE':
            // Delete problem
            if (count($pathParts) > 0) {
                $problemId = intval($pathParts[0]);
                deleteProblem($db, $problemId);
            } else {
                sendError('Problem ID required', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * Get list of problems
 */
function getProblems($db, $page, $perPage, $category) {
    $offset = ($page - 1) * $perPage;

    $sql = "SELECT * FROM problems WHERE 1=1";
    $params = [];

    if ($category) {
        $sql .= " AND category = :category";
        $params[':category'] = $category;
    }

    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM problems WHERE 1=1";
    if ($category) {
        $countSql .= " AND category = :category";
    }

    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];

    // Get problems with pagination
    $sql .= " ORDER BY id DESC LIMIT :limit OFFSET :offset";
    $params[':limit'] = $perPage;
    $params[':offset'] = $offset;

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        if ($key === ':limit' || $key === ':offset') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value);
        }
    }
    $stmt->execute();

    $problems = $stmt->fetchAll();

    // Decode JSON fields
    foreach ($problems as &$problem) {
        $problem['steps'] = json_decode($problem['steps'], true);
    }

    sendSuccess([
        'problems' => $problems,
        'total' => $total,
        'page' => $page,
        'perPage' => $perPage
    ]);
}

/**
 * Get specific problem
 */
function getProblem($db, $problemId) {
    $stmt = $db->prepare("SELECT * FROM problems WHERE id = :id");
    $stmt->execute([':id' => $problemId]);

    $problem = $stmt->fetch();

    if (!$problem) {
        sendError('Problem not found', 404);
    }

    // Decode JSON fields
    $problem['steps'] = json_decode($problem['steps'], true);

    sendSuccess($problem);
}

/**
 * Create new problem
 */
function createProblem($db, $data) {
    $required = ['title', 'description', 'initialExpression', 'targetExpression', 'steps'];
    $missing = validateRequiredFields($data, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $sql = "INSERT INTO problems (title, description, initial_expression, target_expression, steps, difficulty, category, created_at, updated_at)
            VALUES (:title, :description, :initial_expression, :target_expression, :steps, :difficulty, :category, NOW(), NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'],
        ':initial_expression' => $data['initialExpression'],
        ':target_expression' => $data['targetExpression'],
        ':steps' => json_encode($data['steps']),
        ':difficulty' => $data['difficulty'] ?? 'medium',
        ':category' => $data['category'] ?? 'algebra'
    ]);

    $problemId = $db->lastInsertId();

    sendSuccess(['id' => $problemId], 'Problem created successfully');
}

/**
 * Update problem
 */
function updateProblem($db, $problemId, $data) {
    // Check if problem exists
    $stmt = $db->prepare("SELECT id FROM problems WHERE id = :id");
    $stmt->execute([':id' => $problemId]);

    if (!$stmt->fetch()) {
        sendError('Problem not found', 404);
    }

    $sql = "UPDATE problems SET
            title = COALESCE(:title, title),
            description = COALESCE(:description, description),
            initial_expression = COALESCE(:initial_expression, initial_expression),
            target_expression = COALESCE(:target_expression, target_expression),
            steps = COALESCE(:steps, steps),
            difficulty = COALESCE(:difficulty, difficulty),
            category = COALESCE(:category, category),
            updated_at = NOW()
            WHERE id = :id";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id' => $problemId,
        ':title' => $data['title'] ?? null,
        ':description' => $data['description'] ?? null,
        ':initial_expression' => $data['initialExpression'] ?? null,
        ':target_expression' => $data['targetExpression'] ?? null,
        ':steps' => isset($data['steps']) ? json_encode($data['steps']) : null,
        ':difficulty' => $data['difficulty'] ?? null,
        ':category' => $data['category'] ?? null
    ]);

    sendSuccess(null, 'Problem updated successfully');
}

/**
 * Delete problem
 */
function deleteProblem($db, $problemId) {
    $stmt = $db->prepare("DELETE FROM problems WHERE id = :id");
    $stmt->execute([':id' => $problemId]);

    if ($stmt->rowCount() === 0) {
        sendError('Problem not found', 404);
    }

    sendSuccess(null, 'Problem deleted successfully');
}
