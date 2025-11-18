<?php
/**
 * Moodle 학생 진도 추적 클래스
 *
 * 학생의 코스/모듈 진행 상황, 성적, 완료 정보 추적
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

namespace Alt42Standalone;

use Exception;

class MoodleProgressTracker
{
    /**
     * @var MoodleConnection 데이터베이스 연결
     */
    private $db;

    /**
     * @var array 설정 배열
     */
    private $config;

    /**
     * MoodleProgressTracker 생성자
     *
     * @param MoodleConnection|null $db 데이터베이스 연결
     */
    public function __construct($db = null)
    {
        $this->db = $db ?: MoodleConnection::getInstance();
        $this->config = require dirname(__DIR__) . '/config/moodle_config.php';
    }

    /**
     * 학생의 코스 진행률 계산
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return array 진행률 정보
     */
    public function getCourseProgress($userId, $courseId)
    {
        // 코스의 활동 완료 정보 조회
        $sql = "SELECT
                    COUNT(cmc.id) as completed_activities,
                    (SELECT COUNT(*)
                     FROM " . $this->db->table('course_modules') . " cm
                     WHERE cm.course = :courseid2
                     AND cm.visible = 1
                     AND cm.deletioninprogress = 0
                     AND cm.completion > 0) as total_activities
                FROM " . $this->db->table('course_modules_completion') . " cmc
                INNER JOIN " . $this->db->table('course_modules') . " cm ON cmc.coursemoduleid = cm.id
                WHERE cmc.userid = :userid
                AND cm.course = :courseid
                AND cmc.completionstate > 0";

        $result = $this->db->selectOne($sql, [
            'userid' => $userId,
            'courseid' => $courseId,
            'courseid2' => $courseId
        ]);

        $completed = $result['completed_activities'] ?? 0;
        $total = $result['total_activities'] ?? 0;
        $percentage = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

        return [
            'user_id' => $userId,
            'course_id' => $courseId,
            'completed_activities' => $completed,
            'total_activities' => $total,
            'progress_percentage' => $percentage,
            'is_completed' => $percentage >= 100
        ];
    }

    /**
     * 모듈 완료 상태 조회
     *
     * @param int $userId 사용자 ID
     * @param int $moduleId 모듈 ID (course_modules.id)
     * @return array|false 완료 정보
     */
    public function getModuleCompletion($userId, $moduleId)
    {
        $sql = "SELECT cmc.*, cm.course
                FROM " . $this->db->table('course_modules_completion') . " cmc
                INNER JOIN " . $this->db->table('course_modules') . " cm ON cmc.coursemoduleid = cm.id
                WHERE cmc.userid = :userid
                AND cmc.coursemoduleid = :moduleid
                LIMIT 1";

        $completion = $this->db->selectOne($sql, [
            'userid' => $userId,
            'moduleid' => $moduleId
        ]);

        if (!$completion) {
            return [
                'user_id' => $userId,
                'module_id' => $moduleId,
                'is_completed' => false,
                'completion_state' => 0,
                'time_completed' => null
            ];
        }

        return [
            'user_id' => $userId,
            'module_id' => $moduleId,
            'course_id' => $completion['course'],
            'is_completed' => $completion['completionstate'] > 0,
            'completion_state' => $completion['completionstate'],
            'time_completed' => $completion['timemodified'],
            'viewed' => $completion['viewed'] ?? 0
        ];
    }

    /**
     * 모듈 완료 처리
     *
     * @param int $userId 사용자 ID
     * @param int $moduleId 모듈 ID
     * @param int $completionState 완료 상태 (1=완료, 2=합격 완료)
     * @return bool 성공 여부
     */
    public function markModuleCompleted($userId, $moduleId, $completionState = 1)
    {
        try {
            // 기존 완료 기록 확인
            $existing = $this->db->selectOne(
                "SELECT id FROM " . $this->db->table('course_modules_completion') . "
                 WHERE userid = :userid AND coursemoduleid = :moduleid",
                ['userid' => $userId, 'moduleid' => $moduleId]
            );

            $time = time();

            if ($existing) {
                // 업데이트
                $sql = "UPDATE " . $this->db->table('course_modules_completion') . "
                        SET completionstate = :state, timemodified = :time
                        WHERE id = :id";

                $this->db->update($sql, [
                    'state' => $completionState,
                    'time' => $time,
                    'id' => $existing['id']
                ]);
            } else {
                // 삽입
                $sql = "INSERT INTO " . $this->db->table('course_modules_completion') . "
                        (coursemoduleid, userid, completionstate, viewed, timemodified)
                        VALUES (:moduleid, :userid, :state, 1, :time)";

                $this->db->insert($sql, [
                    'moduleid' => $moduleId,
                    'userid' => $userId,
                    'state' => $completionState,
                    'time' => $time
                ]);
            }

            $this->log("모듈 완료 처리: User $userId, Module $moduleId", 'INFO');
            return true;
        } catch (Exception $e) {
            $this->log("모듈 완료 처리 실패: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * 퀴즈 시도 정보 조회
     *
     * @param int $userId 사용자 ID
     * @param int $quizId 퀴즈 ID
     * @return array 시도 정보 배열
     */
    public function getQuizAttempts($userId, $quizId)
    {
        $sql = "SELECT qa.*, qg.grade as final_grade
                FROM " . $this->db->table('quiz_attempts') . " qa
                LEFT JOIN " . $this->db->table('quiz_grades') . " qg
                    ON qa.quiz = qg.quiz AND qa.userid = qg.userid
                WHERE qa.userid = :userid
                AND qa.quiz = :quizid
                ORDER BY qa.attempt DESC";

        return $this->db->select($sql, [
            'userid' => $userId,
            'quizid' => $quizId
        ]);
    }

    /**
     * 최고 퀴즈 성적 조회
     *
     * @param int $userId 사용자 ID
     * @param int $quizId 퀴즈 ID
     * @return array|false 성적 정보
     */
    public function getQuizGrade($userId, $quizId)
    {
        $sql = "SELECT * FROM " . $this->db->table('quiz_grades') . "
                WHERE userid = :userid
                AND quiz = :quizid
                LIMIT 1";

        return $this->db->selectOne($sql, [
            'userid' => $userId,
            'quizid' => $quizId
        ]);
    }

    /**
     * 과제 제출 정보 조회
     *
     * @param int $userId 사용자 ID
     * @param int $assignId 과제 ID
     * @return array|false 제출 정보
     */
    public function getAssignmentSubmission($userId, $assignId)
    {
        $sql = "SELECT asub.*, ag.grade
                FROM " . $this->db->table('assign_submission') . " asub
                LEFT JOIN " . $this->db->table('assign_grades') . " ag
                    ON asub.assignment = ag.assignment AND asub.userid = ag.userid
                WHERE asub.userid = :userid
                AND asub.assignment = :assignid
                AND asub.latest = 1
                LIMIT 1";

        return $this->db->selectOne($sql, [
            'userid' => $userId,
            'assignid' => $assignId
        ]);
    }

    /**
     * 코스의 모든 성적 조회
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return array 성적 정보 배열
     */
    public function getCourseGrades($userId, $courseId)
    {
        $sql = "SELECT gi.itemname, gi.itemtype, gi.itemmodule, gi.grademax,
                       gg.finalgrade, gg.rawgrademax, gg.rawgrademin, gg.timemodified
                FROM " . $this->db->table('grade_grades') . " gg
                INNER JOIN " . $this->db->table('grade_items') . " gi ON gg.itemid = gi.id
                WHERE gg.userid = :userid
                AND gi.courseid = :courseid
                ORDER BY gi.sortorder";

        return $this->db->select($sql, [
            'userid' => $userId,
            'courseid' => $courseId
        ]);
    }

    /**
     * 코스 최종 성적 조회
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return array|false 최종 성적 정보
     */
    public function getCourseFinalGrade($userId, $courseId)
    {
        $sql = "SELECT gi.grademax, gg.finalgrade, gg.timemodified
                FROM " . $this->db->table('grade_grades') . " gg
                INNER JOIN " . $this->db->table('grade_items') . " gi ON gg.itemid = gi.id
                WHERE gg.userid = :userid
                AND gi.courseid = :courseid
                AND gi.itemtype = 'course'
                LIMIT 1";

        $result = $this->db->selectOne($sql, [
            'userid' => $userId,
            'courseid' => $courseId
        ]);

        if ($result) {
            $percentage = $result['grademax'] > 0
                ? round(($result['finalgrade'] / $result['grademax']) * 100, 2)
                : 0;

            return [
                'user_id' => $userId,
                'course_id' => $courseId,
                'final_grade' => $result['finalgrade'],
                'max_grade' => $result['grademax'],
                'percentage' => $percentage,
                'last_modified' => $result['timemodified']
            ];
        }

        return false;
    }

    /**
     * 학습 활동 로그 조회
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @param int $limit 조회 개수
     * @return array 로그 배열
     */
    public function getUserActivityLogs($userId, $courseId, $limit = 50)
    {
        $sql = "SELECT * FROM " . $this->db->table('logstore_standard_log') . "
                WHERE userid = :userid
                AND courseid = :courseid
                ORDER BY timecreated DESC
                LIMIT :limit";

        return $this->db->select($sql, [
            'userid' => $userId,
            'courseid' => $courseId,
            'limit' => $limit
        ]);
    }

    /**
     * 학습 시간 집계
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @param int $fromTime 시작 시간 (타임스탬프)
     * @param int $toTime 종료 시간 (타임스탬프)
     * @return array 학습 시간 정보
     */
    public function getStudyTime($userId, $courseId, $fromTime = null, $toTime = null)
    {
        $sql = "SELECT
                    COUNT(*) as total_actions,
                    MIN(timecreated) as first_access,
                    MAX(timecreated) as last_access
                FROM " . $this->db->table('logstore_standard_log') . "
                WHERE userid = :userid
                AND courseid = :courseid";

        $params = [
            'userid' => $userId,
            'courseid' => $courseId
        ];

        if ($fromTime !== null) {
            $sql .= " AND timecreated >= :fromtime";
            $params['fromtime'] = $fromTime;
        }

        if ($toTime !== null) {
            $sql .= " AND timecreated <= :totime";
            $params['totime'] = $toTime;
        }

        $result = $this->db->selectOne($sql, $params);

        if ($result && $result['total_actions'] > 0) {
            $duration = $result['last_access'] - $result['first_access'];

            return [
                'user_id' => $userId,
                'course_id' => $courseId,
                'total_actions' => $result['total_actions'],
                'first_access' => $result['first_access'],
                'last_access' => $result['last_access'],
                'duration_seconds' => $duration,
                'duration_minutes' => round($duration / 60, 2),
                'duration_hours' => round($duration / 3600, 2)
            ];
        }

        return [
            'user_id' => $userId,
            'course_id' => $courseId,
            'total_actions' => 0,
            'duration_seconds' => 0
        ];
    }

    /**
     * 코스 완료 인증서 정보 조회
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return array|false 인증서 정보
     */
    public function getCourseCertificate($userId, $courseId)
    {
        // Moodle의 완료 플러그인 확인
        $sql = "SELECT * FROM " . $this->db->table('course_completions') . "
                WHERE userid = :userid
                AND course = :courseid
                LIMIT 1";

        $completion = $this->db->selectOne($sql, [
            'userid' => $userId,
            'courseid' => $courseId
        ]);

        if ($completion && $completion['timecompleted']) {
            return [
                'user_id' => $userId,
                'course_id' => $courseId,
                'is_completed' => true,
                'time_completed' => $completion['timecompleted'],
                'time_started' => $completion['timestarted'] ?? null
            ];
        }

        return false;
    }

    /**
     * 코스 완료 처리
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return bool 성공 여부
     */
    public function markCourseCompleted($userId, $courseId)
    {
        try {
            $existing = $this->db->selectOne(
                "SELECT id FROM " . $this->db->table('course_completions') . "
                 WHERE userid = :userid AND course = :courseid",
                ['userid' => $userId, 'courseid' => $courseId]
            );

            $time = time();

            if ($existing) {
                // 업데이트
                $sql = "UPDATE " . $this->db->table('course_completions') . "
                        SET timecompleted = :time
                        WHERE id = :id";

                $this->db->update($sql, [
                    'time' => $time,
                    'id' => $existing['id']
                ]);
            } else {
                // 삽입
                $sql = "INSERT INTO " . $this->db->table('course_completions') . "
                        (userid, course, timeenrolled, timestarted, timecompleted)
                        VALUES (:userid, :courseid, :time, :time2, :time3)";

                $this->db->insert($sql, [
                    'userid' => $userId,
                    'courseid' => $courseId,
                    'time' => $time,
                    'time2' => $time,
                    'time3' => $time
                ]);
            }

            $this->log("코스 완료 처리: User $userId, Course $courseId", 'INFO');
            return true;
        } catch (Exception $e) {
            $this->log("코스 완료 처리 실패: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * 로그 기록
     *
     * @param string $message 로그 메시지
     * @param string $level 로그 레벨
     */
    private function log($message, $level = 'INFO')
    {
        if (!$this->config['debug']['enabled']) {
            return;
        }

        $logLevels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3];
        $currentLevel = $logLevels[$this->config['debug']['log_level']] ?? 1;
        $messageLevel = $logLevels[$level] ?? 1;

        if ($messageLevel >= $currentLevel) {
            $timestamp = date('Y-m-d H:i:s');
            $logMessage = "[$timestamp] [MoodleProgressTracker] [$level] $message" . PHP_EOL;
            error_log($logMessage);
        }
    }
}
