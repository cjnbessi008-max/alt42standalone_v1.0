<?php
/**
 * Trails API Endpoints
 * Handles HTTP requests for trail operations
 *
 * Endpoints:
 * - POST   /api/trails          - Create new trail
 * - GET    /api/trails/:id      - Get trail by ID
 * - PUT    /api/trails/:id      - Update trail
 * - DELETE /api/trails/:id      - Delete trail
 * - POST   /api/trails/:id/interactions - Record interaction
 * - POST   /api/trails/:id/submit       - Submit trail
 * - POST   /api/trails/:id/validate     - Validate trail
 * - GET    /api/trails/student/:id      - Get student's trails
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../services/TrailService.php';
require_once __DIR__ . '/../utils/ResponseHelper.php';

// Initialize services
$trailService = new TrailService();
$response = new ResponseHelper();

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim($requestUri, '/'));

// Get trail ID from URI if present
$trailId = null;
$action = null;

// Parse URI: /api/trails/{id}/{action}
if (count($uriParts) >= 3 && $uriParts[1] === 'trails') {
    if (isset($uriParts[2]) && is_numeric($uriParts[2])) {
        $trailId = intval($uriParts[2]);
    }
    if (isset($uriParts[3])) {
        $action = $uriParts[3];
    }
}

// Get request body for POST/PUT
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

// Route requests
try {
    switch ($method) {
        case 'GET':
            handleGet($trailService, $response, $trailId, $action);
            break;

        case 'POST':
            handlePost($trailService, $response, $trailId, $action, $data);
            break;

        case 'PUT':
            handlePut($trailService, $response, $trailId, $data);
            break;

        case 'DELETE':
            handleDelete($trailService, $response, $trailId);
            break;

        default:
            $response->error('Method not allowed', HTTP_BAD_REQUEST);
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    $response->error('Internal server error', HTTP_INTERNAL_ERROR);
}

/**
 * Handle GET requests
 */
function handleGet($trailService, $response, $trailId, $action) {
    if ($trailId) {
        // GET /api/trails/:id - Get single trail
        $trail = $trailService->getTrailById($trailId);

        if ($trail) {
            $response->success($trail);
        } else {
            $response->error('Trail not found', HTTP_NOT_FOUND);
        }

    } elseif ($action === 'student' && isset($_GET['student_id'])) {
        // GET /api/trails/student/:id?problem_id=X - Get student's trails
        $studentId = intval($_GET['student_id']);
        $problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

        if ($problemId) {
            $trails = $trailService->getTrailsByProblemAndStudent($problemId, $studentId);
        } else {
            $trails = []; // Could implement getTrailsByStudent if needed
        }

        $response->success(['trails' => $trails]);

    } else {
        $response->error('Invalid request', HTTP_BAD_REQUEST);
    }
}

/**
 * Handle POST requests
 */
function handlePost($trailService, $response, $trailId, $action, $data) {
    if (!$data) {
        $response->error('Invalid JSON data', HTTP_BAD_REQUEST);
        return;
    }

    if ($trailId && $action === 'interactions') {
        // POST /api/trails/:id/interactions - Record interaction
        $result = $trailService->recordInteraction($trailId, $data);

        if ($result) {
            $response->success(['message' => 'Interaction recorded']);
        } else {
            $response->error('Failed to record interaction', HTTP_INTERNAL_ERROR);
        }

    } elseif ($trailId && $action === 'submit') {
        // POST /api/trails/:id/submit - Submit trail
        $result = $trailService->submitTrail($trailId, $data);

        if ($result) {
            $response->success(['message' => 'Trail submitted successfully']);
        } else {
            $response->error('Failed to submit trail', HTTP_INTERNAL_ERROR);
        }

    } elseif ($trailId && $action === 'validate') {
        // POST /api/trails/:id/validate - Validate trail
        $tolerance = isset($data['tolerance']) ? floatval($data['tolerance']) : 5.0;
        $problemId = isset($data['problem_id']) ? intval($data['problem_id']) : null;

        if (!$problemId) {
            $response->error('Problem ID required', HTTP_BAD_REQUEST);
            return;
        }

        $validation = $trailService->validateTrail($trailId, $problemId, $tolerance);
        $response->success($validation);

    } elseif (!$trailId) {
        // POST /api/trails - Create new trail
        $requiredFields = ['problem_id', 'student_id', 'vector_start_x', 'vector_start_y',
                           'vector_end_x', 'vector_end_y'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                $response->error("Missing required field: $field", HTTP_BAD_REQUEST);
                return;
            }
        }

        $result = $trailService->createTrail($data);

        if ($result['success']) {
            $response->success($result, HTTP_CREATED);
        } else {
            $response->error($result['error'], HTTP_INTERNAL_ERROR);
        }

    } else {
        $response->error('Invalid request', HTTP_BAD_REQUEST);
    }
}

/**
 * Handle PUT requests
 */
function handlePut($trailService, $response, $trailId, $data) {
    if (!$trailId) {
        $response->error('Trail ID required', HTTP_BAD_REQUEST);
        return;
    }

    // PUT /api/trails/:id - Update trail (could be extended)
    $response->error('Update operation not implemented', HTTP_BAD_REQUEST);
}

/**
 * Handle DELETE requests
 */
function handleDelete($trailService, $response, $trailId) {
    if (!$trailId) {
        $response->error('Trail ID required', HTTP_BAD_REQUEST);
        return;
    }

    // DELETE /api/trails/:id - Delete trail
    $result = $trailService->deleteTrail($trailId);

    if ($result) {
        $response->success(['message' => 'Trail deleted successfully']);
    } else {
        $response->error('Failed to delete trail', HTTP_INTERNAL_ERROR);
    }
}
