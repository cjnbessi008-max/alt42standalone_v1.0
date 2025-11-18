<?php
/**
 * Response Helper
 * Standardized JSON response formatting
 */

namespace DeviationBreeze\Utils;

class ResponseHelper
{
    /**
     * Send success response
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @return void
     */
    public static function success($data = null, $message = 'Success', $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        exit;
    }

    /**
     * Send error response
     *
     * @param string $message
     * @param int $statusCode
     * @param mixed $errors
     * @return void
     */
    public static function error($message = 'Error occurred', $statusCode = 400, $errors = null)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        exit;
    }

    /**
     * Send validation error response
     *
     * @param array $errors
     * @return void
     */
    public static function validationError($errors)
    {
        self::error('Validation failed', 422, $errors);
    }

    /**
     * Send not found response
     *
     * @param string $message
     * @return void
     */
    public static function notFound($message = 'Resource not found')
    {
        self::error($message, 404);
    }

    /**
     * Send unauthorized response
     *
     * @param string $message
     * @return void
     */
    public static function unauthorized($message = 'Unauthorized')
    {
        self::error($message, 401);
    }

    /**
     * Send server error response
     *
     * @param string $message
     * @return void
     */
    public static function serverError($message = 'Internal server error')
    {
        self::error($message, 500);
    }
}
