<?php
/**
 * Application Configuration Loader
 * Loads environment variables from .env file
 */

class Config {
    private static $loaded = false;

    /**
     * Load environment variables from .env file
     */
    public static function load() {
        if (self::$loaded) {
            return;
        }

        $envFile = dirname(dirname(__DIR__)) . '/.env';

        if (!file_exists($envFile)) {
            // Try .env.example if .env doesn't exist
            $envFile = dirname(dirname(__DIR__)) . '/.env.example';
            if (!file_exists($envFile)) {
                throw new Exception('.env file not found');
            }
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remove quotes if present
                if (preg_match('/^(["\'])(.*)\\1$/', $value, $matches)) {
                    $value = $matches[2];
                }

                // Set environment variable
                if (!getenv($key)) {
                    putenv("{$key}={$value}");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }

        self::$loaded = true;
    }

    /**
     * Get configuration value
     */
    public static function get($key, $default = null) {
        self::load();
        return getenv($key) ?: $default;
    }

    /**
     * Get all Moodle configuration
     */
    public static function getMoodleConfig() {
        self::load();
        return [
            'url' => getenv('MOODLE_URL'),
            'token' => getenv('MOODLE_WS_TOKEN'),
            'service' => getenv('MOODLE_WS_SERVICE') ?: 'moodle_mobile_app'
        ];
    }

    /**
     * Get all Claude API configuration
     */
    public static function getClaudeConfig() {
        self::load();
        return [
            'api_key' => getenv('CLAUDE_API_KEY'),
            'model' => getenv('CLAUDE_MODEL') ?: 'claude-3-sonnet-20240229',
            'max_tokens' => (int) (getenv('CLAUDE_MAX_TOKENS') ?: 4000),
            'temperature' => (float) (getenv('CLAUDE_TEMPERATURE') ?: 0.7)
        ];
    }

    /**
     * Get database configuration
     */
    public static function getDatabaseConfig() {
        self::load();
        return [
            'host' => getenv('DB_HOST') ?: 'localhost',
            'port' => getenv('DB_PORT') ?: '3306',
            'name' => getenv('DB_NAME') ?: 'learning_summary',
            'user' => getenv('DB_USER') ?: 'root',
            'password' => getenv('DB_PASSWORD') ?: '',
            'charset' => getenv('DB_CHARSET') ?: 'utf8mb4'
        ];
    }

    /**
     * Check if in debug mode
     */
    public static function isDebug() {
        self::load();
        return getenv('APP_DEBUG') === 'true';
    }

    /**
     * Get application language
     */
    public static function getLanguage() {
        self::load();
        return getenv('APP_LANGUAGE') ?: 'ko';
    }
}

// Auto-load configuration on include
Config::load();
