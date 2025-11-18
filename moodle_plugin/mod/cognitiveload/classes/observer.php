<?php
/**
 * Event observers for cognitive load analysis
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_cognitiveload;

defined('MOODLE_INTERNAL') || die();

/**
 * 이벤트 옵저버: Quiz 문제 생성/수정 시 자동 분석
 */
class observer {

    /**
     * 문제가 생성되었을 때 호출
     *
     * @param \core\event\question_created $event
     */
    public static function question_created(\core\event\question_created $event) {
        global $DB;

        $questionid = $event->objectid;
        $question = $DB->get_record('question', ['id' => $questionid]);

        if ($question && self::should_analyze($question)) {
            self::analyze_async($question);
        }
    }

    /**
     * 문제가 수정되었을 때 호출
     *
     * @param \core\event\question_updated $event
     */
    public static function question_updated(\core\event\question_updated $event) {
        global $DB;

        $questionid = $event->objectid;
        $question = $DB->get_record('question', ['id' => $questionid]);

        if ($question && self::should_analyze($question)) {
            // 캐시 무효화 후 재분석
            $DB->delete_records('cogload_cache', ['questionid' => $questionid]);
            self::analyze_async($question);
        }
    }

    /**
     * 퀴즈 시도가 제출되었을 때 호출
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function quiz_attempt_submitted(\mod_quiz\event\attempt_submitted $event) {
        global $DB;

        $attemptid = $event->objectid;
        $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);

        if ($attempt) {
            self::record_student_metrics($attempt);
        }
    }

    /**
     * 문제를 비동기로 분석
     *
     * @param object $question
     */
    private static function analyze_async($question) {
        // In production, use Moodle's ad-hoc task system
        // For now, analyze immediately
        $api_client = new api_client();
        $api_client->analyze_question($question);
    }

    /**
     * 문제를 분석해야 하는지 확인
     *
     * @param object $question
     * @return bool
     */
    private static function should_analyze($question) {
        // Only analyze certain question types
        $supported_types = ['numerical', 'multichoice', 'shortanswer', 'essay'];
        return in_array($question->qtype, $supported_types);
    }

    /**
     * 학생 행동 메트릭 기록
     *
     * @param object $attempt Quiz attempt object
     */
    private static function record_student_metrics($attempt) {
        global $DB;

        // 문제별 시도 정보 수집
        $question_attempts = $DB->get_records('question_attempts',
            ['questionusageid' => $attempt->uniqueid]);

        foreach ($question_attempts as $qa) {
            // 행동 데이터 계산
            $steps = $DB->get_records('question_attempt_steps',
                ['questionattemptid' => $qa->id], 'timecreated ASC');

            if (empty($steps)) {
                continue;
            }

            $first_step = reset($steps);
            $last_step = end($steps);

            $record = new \stdClass();
            $record->userid = $attempt->userid;
            $record->questionid = $qa->questionid;
            $record->quizattemptid = $attempt->id;
            $record->time_spent = $last_step->timecreated - $first_step->timecreated;
            $record->num_attempts = count($steps);
            $record->hints_used = 0; // TODO: Calculate from steps
            $record->is_correct = ($qa->responsesummary === $qa->rightanswer) ? 1 : 0;

            // Get expected cognitive load
            $cached_load = $DB->get_record('cogload_cache', ['questionid' => $qa->questionid]);
            $expected_load = $cached_load ? $cached_load->total_score : 50;

            // 경험한 인지 부하 추정
            $record->cognitive_load_experienced = self::estimate_experienced_load(
                $record->time_spent,
                $record->num_attempts,
                $record->is_correct,
                $expected_load
            );

            $record->timecreated = time();

            try {
                $DB->insert_record('cogload_student_metrics', $record);
            } catch (\Exception $e) {
                debugging('Failed to record student metrics: ' . $e->getMessage(), DEBUG_DEVELOPER);
            }
        }
    }

    /**
     * 경험한 인지 부하 추정
     *
     * @param int $time_spent Time in seconds
     * @param int $num_attempts Number of attempts
     * @param bool $is_correct Whether answer was correct
     * @param float $expected_load Expected cognitive load
     * @return float Experienced cognitive load
     */
    private static function estimate_experienced_load($time_spent, $num_attempts, $is_correct, $expected_load) {
        // 기본: 예상 부하에서 시작
        $experienced = $expected_load;

        // 예상 시간 계산 (부하 20 = 2분, 부하 100 = 15분)
        $expected_time = 120 + ($expected_load / 100) * 13 * 60;

        // 시간 비율
        $time_ratio = $expected_time > 0 ? $time_spent / $expected_time : 1;

        if ($time_ratio > 1.5) {
            $experienced += ($time_ratio - 1) * 10;
        } else if ($time_ratio < 0.5) {
            $experienced -= (1 - $time_ratio) * 10;
        }

        // 시도 횟수 패널티
        if ($num_attempts > 1) {
            $experienced += ($num_attempts - 1) * 5;
        }

        // 정답 여부
        if (!$is_correct) {
            $experienced += 10;
        }

        return max(0, min(100, round($experienced, 2)));
    }
}
