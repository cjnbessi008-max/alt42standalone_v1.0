<?php
/**
 * Response Helper
 * Standardized JSON API responses
 */

class ResponseHelper {
    /**
     * Send success response
     *
     * @param mixed $data Response data
     * @param int $statusCode HTTP status code
     */
    public function success($data, $statusCode = 200) {
        http_response_code($statusCode);

        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        exit();
    }

    /**
     * Send error response
     *
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     * @param array $errors Additional error details
     */
    public function error($message, $statusCode = 400, $errors = []) {
        http_response_code($statusCode);

        $response = [
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        exit();
    }

    /**
     * Send paginated response
     *
     * @param array $data Response data
     * @param int $total Total items
     * @param int $page Current page
     * @param int $perPage Items per page
     */
    public function paginated($data, $total, $page, $perPage) {
        http_response_code(200);

        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage)
            ],
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        exit();
    }
}
