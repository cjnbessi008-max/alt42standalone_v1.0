<?php
/**
 * Logger Utility
 * 로깅 유틸리티
 */

namespace OverconfidenceDetector\Utils;

class Logger
{
    const DEBUG = 'DEBUG';
    const INFO = 'INFO';
    const WARNING = 'WARNING';
    const ERROR = 'ERROR';

    private static $logPath;
    private static $minLevel = self::INFO;
    private static $enabled = true;

    /**
     * 초기화
     */
    public static function init()
    {
        $config = require __DIR__ . '/../../config/app.php';
        self::$enabled = $config['logging']['enabled'];
        self::$logPath = $config['logging']['path'];
        self::$minLevel = strtoupper($config['logging']['level']);

        // 로그 디렉토리 생성
        $logDir = dirname(self::$logPath);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }

    /**
     * DEBUG 레벨 로그
     *
     * @param string $message 메시지
     * @param array $context 컨텍스트
     */
    public static function debug($message, array $context = [])
    {
        self::log(self::DEBUG, $message, $context);
    }

    /**
     * INFO 레벨 로그
     *
     * @param string $message 메시지
     * @param array $context 컨텍스트
     */
    public static function info($message, array $context = [])
    {
        self::log(self::INFO, $message, $context);
    }

    /**
     * WARNING 레벨 로그
     *
     * @param string $message 메시지
     * @param array $context 컨텍스트
     */
    public static function warning($message, array $context = [])
    {
        self::log(self::WARNING, $message, $context);
    }

    /**
     * ERROR 레벨 로그
     *
     * @param string $message 메시지
     * @param array $context 컨텍스트
     */
    public static function error($message, array $context = [])
    {
        self::log(self::ERROR, $message, $context);
    }

    /**
     * 로그 기록
     *
     * @param string $level 로그 레벨
     * @param string $message 메시지
     * @param array $context 컨텍스트
     */
    private static function log($level, $message, array $context = [])
    {
        if (!self::$enabled) {
            return;
        }

        if (!self::$logPath) {
            self::init();
        }

        if (!self::shouldLog($level)) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';

        $logEntry = sprintf(
            "[%s] [%s] %s%s\n",
            $timestamp,
            $level,
            $message,
            $contextStr
        );

        file_put_contents(self::$logPath, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * 로그 레벨 확인
     *
     * @param string $level 확인할 레벨
     * @return bool 로깅 여부
     */
    private static function shouldLog($level)
    {
        $levels = [
            self::DEBUG => 0,
            self::INFO => 1,
            self::WARNING => 2,
            self::ERROR => 3,
        ];

        return $levels[$level] >= $levels[self::$minLevel];
    }
}

// 초기화
Logger::init();
