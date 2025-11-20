<?php
/**
 * Response Helper
 * Standardized JSON response formatting
 */

class Response
{
    /**
     * Send success response
     *
     * @param mixed $data Data to return
     * @param string $message Optional message
     * @param int $code HTTP status code
     */
    public static function success($data = null, $message = 'Success', $code = 200)
    {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Send error response
     *
     * @param string $message Error message
     * @param int $code HTTP status code
     * @param array $details Additional error details
     */
    public static function error($message = 'Error', $code = 400, $details = [])
    {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error' => $details,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Send validation error response
     *
     * @param array $errors Validation errors
     */
    public static function validationError($errors)
    {
        self::error('Validation failed', 422, ['validation' => $errors]);
    }

    /**
     * Send unauthorized response
     *
     * @param string $message Optional message
     */
    public static function unauthorized($message = 'Unauthorized')
    {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     *
     * @param string $message Optional message
     */
    public static function forbidden($message = 'Forbidden')
    {
        self::error($message, 403);
    }

    /**
     * Send not found response
     *
     * @param string $message Optional message
     */
    public static function notFound($message = 'Resource not found')
    {
        self::error($message, 404);
    }
}
