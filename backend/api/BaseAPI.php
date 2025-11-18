<?php
/**
 * Base API Class
 *
 * Provides common functionality for all API endpoints
 */

require_once __DIR__ . '/../config/Database.php';

class BaseAPI {
    protected $db;
    protected $config;
    protected $requestMethod;
    protected $requestData;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->config = $this->db->getConfig();
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];

        // Handle CORS
        $this->handleCORS();

        // Parse request data
        $this->parseRequestData();

        // Verify authentication if required
        if ($this->config['security']['api_key_required']) {
            $this->verifyAPIKey();
        }

        // Rate limiting
        if ($this->config['security']['rate_limiting']['enabled']) {
            $this->checkRateLimit();
        }
    }

    /**
     * Handle CORS preflight and headers
     */
    protected function handleCORS() {
        $cors = $this->config['cors'];

        if (!$cors['enabled']) {
            return;
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Check if origin is allowed
        if (in_array($origin, $cors['allowed_origins']) || in_array('*', $cors['allowed_origins'])) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }

        header('Access-Control-Allow-Methods: ' . implode(', ', $cors['allowed_methods']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $cors['allowed_headers']));
        header('Access-Control-Max-Age: ' . $cors['max_age']);

        // Handle preflight OPTIONS request
        if ($this->requestMethod === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    /**
     * Parse incoming request data
     */
    protected function parseRequestData() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (strpos($contentType, 'application/json') !== false) {
            $rawData = file_get_contents('php://input');
            $this->requestData = json_decode($rawData, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->sendError('Invalid JSON', 400);
            }
        } else {
            $this->requestData = $_REQUEST;
        }

        // Log request if enabled
        if ($this->config['logging']['log_api_requests']) {
            $this->logRequest();
        }
    }

    /**
     * Verify API key
     */
    protected function verifyAPIKey() {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $this->requestData['api_key'] ?? null;

        if (!$apiKey || !isset($this->config['security']['api_keys'][$apiKey])) {
            $this->sendError('Invalid or missing API key', 401);
        }
    }

    /**
     * Check rate limiting
     */
    protected function checkRateLimit() {
        $ip = $this->getClientIP();
        $cacheKey = 'rate_limit:' . $ip;
        $maxRequests = $this->config['security']['rate_limiting']['max_requests_per_minute'];

        // Simple file-based rate limiting (use Redis in production)
        $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip) . '.txt';
        $now = time();

        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true);
            $windowStart = $data['window_start'];
            $requestCount = $data['count'];

            if ($now - $windowStart < 60) {
                if ($requestCount >= $maxRequests) {
                    $this->sendError('Rate limit exceeded', 429);
                }
                $requestCount++;
            } else {
                $windowStart = $now;
                $requestCount = 1;
            }
        } else {
            $windowStart = $now;
            $requestCount = 1;
        }

        file_put_contents($cacheFile, json_encode([
            'window_start' => $windowStart,
            'count' => $requestCount
        ]));
    }

    /**
     * Get client IP address
     */
    protected function getClientIP() {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];

        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                return $ip;
            }
        }

        return '0.0.0.0';
    }

    /**
     * Get request parameter
     */
    protected function getParam($key, $default = null) {
        return $this->requestData[$key] ?? $default;
    }

    /**
     * Validate required parameters
     */
    protected function validateRequired($params) {
        $missing = [];

        foreach ($params as $param) {
            if (!isset($this->requestData[$param]) || $this->requestData[$param] === '') {
                $missing[] = $param;
            }
        }

        if (!empty($missing)) {
            $this->sendError('Missing required parameters: ' . implode(', ', $missing), 400);
        }

        return true;
    }

    /**
     * Send JSON response
     */
    protected function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send success response
     */
    protected function sendSuccess($data = null, $message = 'Success') {
        $response = [
            'success' => true,
            'message' => $message,
            'timestamp' => time(),
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        $this->sendResponse($response);
    }

    /**
     * Send error response
     */
    protected function sendError($message, $statusCode = 400, $errors = null) {
        $response = [
            'success' => false,
            'error' => $message,
            'timestamp' => time(),
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        // Log error
        if ($this->config['logging']['log_errors']) {
            $this->logError($message, $statusCode);
        }

        $this->sendResponse($response, $statusCode);
    }

    /**
     * Log request
     */
    protected function logRequest() {
        try {
            $this->db->insert('system_logs', [
                'level' => 'info',
                'category' => 'api',
                'message' => sprintf('%s %s', $this->requestMethod, $_SERVER['REQUEST_URI']),
                'ip_address' => $this->getClientIP(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'request_uri' => $_SERVER['REQUEST_URI'],
                'request_method' => $this->requestMethod
            ]);
        } catch (Exception $e) {
            // Silently fail
        }
    }

    /**
     * Log error
     */
    protected function logError($message, $code = null) {
        try {
            $this->db->insert('system_logs', [
                'level' => 'error',
                'category' => 'api',
                'message' => $message,
                'error_code' => $code,
                'ip_address' => $this->getClientIP(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
                'request_method' => $this->requestMethod
            ]);
        } catch (Exception $e) {
            // Silently fail
        }
    }

    /**
     * Validate session ID format
     */
    protected function validateSessionID($sessionID) {
        if (empty($sessionID) || strlen($sessionID) > 64) {
            return false;
        }
        // UUID format or alphanumeric
        return preg_match('/^[a-zA-Z0-9\-_]+$/', $sessionID);
    }

    /**
     * Generate UUID v4
     */
    protected function generateUUID() {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Get current timestamp in milliseconds
     */
    protected function getTimestampMs() {
        return round(microtime(true) * 1000);
    }

    /**
     * Sanitize input
     */
    protected function sanitize($value, $type = 'string') {
        switch ($type) {
            case 'int':
                return filter_var($value, FILTER_VALIDATE_INT);
            case 'float':
                return filter_var($value, FILTER_VALIDATE_FLOAT);
            case 'email':
                return filter_var($value, FILTER_VALIDATE_EMAIL);
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL);
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'string':
            default:
                return htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
        }
    }
}
