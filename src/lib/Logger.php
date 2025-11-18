<?php
/**
 * Simple Logger for Application
 */

class Logger {
    private static $levels = [
        'DEBUG' => 0,
        'INFO' => 1,
        'WARNING' => 2,
        'ERROR' => 3
    ];

    /**
     * Log message to file
     */
    private static function log($level, $message, $context = []) {
        if (self::$levels[$level] < self::$levels[LOG_LEVEL]) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $logFile = LOG_PATH . '/' . date('Y-m-d') . '.log';

        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        $logMessage = sprintf(
            "[%s] [%s] %s%s\n",
            $timestamp,
            $level,
            $message,
            $contextStr
        );

        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }

    public static function debug($message, $context = []) {
        self::log('DEBUG', $message, $context);
    }

    public static function info($message, $context = []) {
        self::log('INFO', $message, $context);
    }

    public static function warning($message, $context = []) {
        self::log('WARNING', $message, $context);
    }

    public static function error($message, $context = []) {
        self::log('ERROR', $message, $context);
    }
}
