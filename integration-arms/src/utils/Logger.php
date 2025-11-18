<?php
/**
 * Logger Utility
 * Simple logging implementation
 */

class Logger {
    const DEBUG = 'DEBUG';
    const INFO = 'INFO';
    const WARNING = 'WARNING';
    const ERROR = 'ERROR';

    private $logFile;
    private $logLevel;
    private $maxFileSize;

    public function __construct($logFile = null, $logLevel = null) {
        $this->logFile = $logFile ?? LOG_FILE;
        $this->logLevel = $logLevel ?? LOG_LEVEL;
        $this->maxFileSize = LOG_MAX_SIZE;

        $this->ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    private function ensureLogDirectory() {
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
    }

    /**
     * Check if should rotate log file
     */
    private function checkRotation() {
        if (file_exists($this->logFile) && filesize($this->logFile) > $this->maxFileSize) {
            $rotatedFile = $this->logFile . '.' . date('Y-m-d_H-i-s');
            rename($this->logFile, $rotatedFile);
        }
    }

    /**
     * Write log message
     */
    private function write($level, $message, $context = []) {
        $levels = [
            self::DEBUG => 0,
            self::INFO => 1,
            self::WARNING => 2,
            self::ERROR => 3
        ];

        if ($levels[$level] < $levels[$this->logLevel]) {
            return;
        }

        $this->checkRotation();

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        $logMessage = "[$timestamp] [$level] $message$contextStr" . PHP_EOL;

        file_put_contents($this->logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }

    /**
     * Debug log
     */
    public function debug($message, $context = []) {
        $this->write(self::DEBUG, $message, $context);
    }

    /**
     * Info log
     */
    public function info($message, $context = []) {
        $this->write(self::INFO, $message, $context);
    }

    /**
     * Warning log
     */
    public function warning($message, $context = []) {
        $this->write(self::WARNING, $message, $context);
    }

    /**
     * Error log
     */
    public function error($message, $context = []) {
        $this->write(self::ERROR, $message, $context);
    }

    /**
     * Get recent logs
     */
    public function getRecentLogs($lines = 100) {
        if (!file_exists($this->logFile)) {
            return [];
        }

        $logs = [];
        $file = new SplFileObject($this->logFile);
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();
        $startLine = max(0, $lastLine - $lines);

        $file->seek($startLine);
        while (!$file->eof()) {
            $line = trim($file->current());
            if (!empty($line)) {
                $logs[] = $line;
            }
            $file->next();
        }

        return $logs;
    }
}
