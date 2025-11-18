<?php
/**
 * View Rendering Class
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

class View {
    /**
     * Render a view
     */
    public static function render($view, $data = [], $layout = 'default') {
        extract($data);

        // Start output buffering
        ob_start();

        // Include the view file
        $viewFile = VIEW_PATH . '/' . $view . '.php';

        if (!file_exists($viewFile)) {
            die("View not found: " . $view);
        }

        include $viewFile;

        // Get view content
        $content = ob_get_clean();

        // If layout is specified, wrap content in layout
        if ($layout !== null) {
            $layoutFile = VIEW_PATH . '/layouts/' . $layout . '.php';

            if (file_exists($layoutFile)) {
                include $layoutFile;
            } else {
                echo $content;
            }
        } else {
            echo $content;
        }
    }

    /**
     * Render JSON response
     */
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Escape HTML
     */
    public static function e($value) {
        return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
    }

    /**
     * Get CSRF token field
     */
    public static function csrf() {
        if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
            $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        }

        return '<input type="hidden" name="' . CSRF_TOKEN_NAME . '" value="' . $_SESSION[CSRF_TOKEN_NAME] . '">';
    }

    /**
     * Get CSRF token
     */
    public static function getCsrfToken() {
        if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
            $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        }

        return $_SESSION[CSRF_TOKEN_NAME];
    }

    /**
     * Verify CSRF token
     */
    public static function verifyCsrf($token) {
        return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
    }

    /**
     * Set flash message
     */
    public static function flash($key, $message) {
        $_SESSION['flash'][$key] = $message;
    }

    /**
     * Get and clear flash message
     */
    public static function getFlash($key) {
        if (isset($_SESSION['flash'][$key])) {
            $message = $_SESSION['flash'][$key];
            unset($_SESSION['flash'][$key]);
            return $message;
        }
        return null;
    }

    /**
     * Check if flash message exists
     */
    public static function hasFlash($key) {
        return isset($_SESSION['flash'][$key]);
    }

    /**
     * Format date
     */
    public static function formatDate($date, $format = 'Y-m-d H:i:s') {
        if ($date instanceof DateTime) {
            return $date->format($format);
        }

        $timestamp = is_numeric($date) ? $date : strtotime($date);
        return date($format, $timestamp);
    }

    /**
     * Time ago format
     */
    public static function timeAgo($timestamp) {
        if (!is_numeric($timestamp)) {
            $timestamp = strtotime($timestamp);
        }

        $diff = time() - $timestamp;

        if ($diff < 60) {
            return $diff . '초 전';
        }

        $diff = round($diff / 60);
        if ($diff < 60) {
            return $diff . '분 전';
        }

        $diff = round($diff / 60);
        if ($diff < 24) {
            return $diff . '시간 전';
        }

        $diff = round($diff / 24);
        if ($diff < 7) {
            return $diff . '일 전';
        }

        if ($diff < 30) {
            return round($diff / 7) . '주 전';
        }

        return self::formatDate($timestamp, 'Y-m-d');
    }

    /**
     * Include partial view
     */
    public static function partial($partial, $data = []) {
        extract($data);
        $partialFile = VIEW_PATH . '/partials/' . $partial . '.php';

        if (file_exists($partialFile)) {
            include $partialFile;
        }
    }
}
