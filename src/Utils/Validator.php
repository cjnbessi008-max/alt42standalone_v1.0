<?php
/**
 * Input Validation Utility
 */

namespace ColorPattern\Utils;

class Validator {

    /**
     * Validate required fields
     */
    public static function required($value, $fieldName = 'Field') {
        if (empty($value) && $value !== '0' && $value !== 0) {
            throw new \InvalidArgumentException("{$fieldName} is required");
        }
        return true;
    }

    /**
     * Validate integer
     */
    public static function integer($value, $fieldName = 'Field') {
        if (!is_numeric($value) || (int)$value != $value) {
            throw new \InvalidArgumentException("{$fieldName} must be an integer");
        }
        return true;
    }

    /**
     * Validate positive integer
     */
    public static function positiveInteger($value, $fieldName = 'Field') {
        self::integer($value, $fieldName);
        if ((int)$value <= 0) {
            throw new \InvalidArgumentException("{$fieldName} must be a positive integer");
        }
        return true;
    }

    /**
     * Validate array
     */
    public static function isArray($value, $fieldName = 'Field') {
        if (!is_array($value)) {
            throw new \InvalidArgumentException("{$fieldName} must be an array");
        }
        return true;
    }

    /**
     * Validate JSON string
     */
    public static function json($value, $fieldName = 'Field') {
        if (!is_string($value)) {
            throw new \InvalidArgumentException("{$fieldName} must be a JSON string");
        }
        json_decode($value);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException("{$fieldName} must be valid JSON");
        }
        return true;
    }

    /**
     * Validate email
     */
    public static function email($value, $fieldName = 'Email') {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("{$fieldName} must be a valid email address");
        }
        return true;
    }

    /**
     * Validate string length
     */
    public static function length($value, $min, $max, $fieldName = 'Field') {
        $length = strlen($value);
        if ($length < $min || $length > $max) {
            throw new \InvalidArgumentException("{$fieldName} must be between {$min} and {$max} characters");
        }
        return true;
    }

    /**
     * Validate value is in array
     */
    public static function inArray($value, array $allowed, $fieldName = 'Field') {
        if (!in_array($value, $allowed, true)) {
            $allowedStr = implode(', ', $allowed);
            throw new \InvalidArgumentException("{$fieldName} must be one of: {$allowedStr}");
        }
        return true;
    }

    /**
     * Validate color hex code
     */
    public static function hexColor($value, $fieldName = 'Color') {
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
            throw new \InvalidArgumentException("{$fieldName} must be a valid hex color code (e.g., #FF6B6B)");
        }
        return true;
    }

    /**
     * Sanitize HTML input
     */
    public static function sanitizeHtml($value) {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize SQL input (basic)
     */
    public static function sanitizeSql($value) {
        return addslashes($value);
    }

    /**
     * Validate pattern type
     */
    public static function patternType($value) {
        $allowedTypes = ['arithmetic', 'geometric', 'fibonacci', 'quadratic', 'prime', 'exponential', 'custom'];
        return self::inArray($value, $allowedTypes, 'Pattern type');
    }

    /**
     * Validate sequence data
     */
    public static function sequenceData($sequence) {
        self::isArray($sequence, 'Sequence');

        $appConfig = require __DIR__ . '/../../config/app.php';
        $minLength = $appConfig['min_sequence_length'];
        $maxLength = $appConfig['max_sequence_length'];

        $length = count($sequence);
        if ($length < $minLength || $length > $maxLength) {
            throw new \InvalidArgumentException("Sequence must have between {$minLength} and {$maxLength} elements");
        }

        foreach ($sequence as $value) {
            if (!is_numeric($value)) {
                throw new \InvalidArgumentException("Sequence must contain only numeric values");
            }
        }

        return true;
    }

    /**
     * Validate session token
     */
    public static function sessionToken($token) {
        if (!preg_match('/^[a-zA-Z0-9]{64}$/', $token)) {
            throw new \InvalidArgumentException("Invalid session token format");
        }
        return true;
    }

    /**
     * Validate difficulty level
     */
    public static function difficultyLevel($level) {
        self::integer($level, 'Difficulty level');
        if ($level < 1 || $level > 5) {
            throw new \InvalidArgumentException("Difficulty level must be between 1 and 5");
        }
        return true;
    }
}
