<?php
/**
 * 로깅 유틸리티 클래스
 */

class Logger {
    private static $logLevels = [
        'DEBUG' => 0,
        'INFO' => 1,
        'WARNING' => 2,
        'ERROR' => 3
    ];

    /**
     * 로그 기록
     */
    private static function log($level, $message, $context = []) {
        if (!LOG_ENABLED) {
            return;
        }

        $currentLevel = self::$logLevels[LOG_LEVEL] ?? 0;
        $messageLevel = self::$logLevels[$level] ?? 0;

        if ($messageLevel < $currentLevel) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        $logMessage = "[{$timestamp}] [{$level}] {$message}";

        if ($contextStr) {
            $logMessage .= " | Context: {$contextStr}";
        }

        $logMessage .= PHP_EOL;

        $logFile = LOG_PATH . date('Y-m-d') . '.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        // 디버그 모드일 때 에러는 화면에도 출력
        if (DEBUG_MODE && $level === 'ERROR') {
            error_log($logMessage);
        }
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
