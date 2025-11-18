<?php
/**
 * Configuration settings for Best Thinking Moments plugin
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Analysis Configuration
 */
// 분석 기준 가중치 (Analysis criteria weights)
define('BESTMOMENTS_WEIGHT_EFFICIENCY', 0.25);      // 문제 해결 효율성
define('BESTMOMENTS_WEIGHT_CREATIVITY', 0.20);      // 창의적 접근
define('BESTMOMENTS_WEIGHT_IMPROVEMENT', 0.25);     // 개선도
define('BESTMOMENTS_WEIGHT_PERSISTENCE', 0.15);     // 지속성
define('BESTMOMENTS_WEIGHT_COLLABORATION', 0.15);   // 협업

/**
 * Data Collection Settings
 */
// 분석할 활동 유형 (Activity types to analyze)
define('BESTMOMENTS_ANALYZE_QUIZ', true);
define('BESTMOMENTS_ANALYZE_ASSIGNMENT', true);
define('BESTMOMENTS_ANALYZE_FORUM', true);
define('BESTMOMENTS_ANALYZE_LESSON', true);
define('BESTMOMENTS_ANALYZE_WORKSHOP', true);

/**
 * Time Settings
 */
// 일일 분석 실행 시간 (Daily analysis execution time)
define('BESTMOMENTS_ANALYSIS_HOUR', 23);  // 23:00 (11 PM)
define('BESTMOMENTS_ANALYSIS_MINUTE', 0);

// 분석 기간 (Analysis period in seconds)
define('BESTMOMENTS_ANALYSIS_PERIOD', 86400);  // 24 hours

/**
 * Score Thresholds
 */
// 최소 점수 임계값 (Minimum score threshold to be considered)
define('BESTMOMENTS_MIN_SCORE', 60);

// 추출할 최대 순간 수 (Maximum moments to extract per day)
define('BESTMOMENTS_MAX_MOMENTS_PER_DAY', 10);

/**
 * Database Table Prefix
 */
define('BESTMOMENTS_TABLE_PREFIX', 'local_bestmoments_');

/**
 * Notification Settings
 */
// 알림 활성화 (Enable notifications)
define('BESTMOMENTS_NOTIFY_TEACHERS', true);
define('BESTMOMENTS_NOTIFY_STUDENTS', true);

/**
 * Logging
 */
// 디버그 로깅 (Debug logging)
define('BESTMOMENTS_DEBUG_MODE', false);
define('BESTMOMENTS_LOG_FILE', '/var/log/moodle/bestmoments.log');
