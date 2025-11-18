<?php
/**
 * Moodle 코스 및 모듈 관리 클래스
 *
 * Moodle 3.7의 코스, 카테고리, 모듈 데이터에 접근
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

namespace Alt42Standalone;

use Exception;

class MoodleCourseManager
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
     * MoodleCourseManager 생성자
     *
     * @param MoodleConnection|null $db 데이터베이스 연결
     */
    public function __construct($db = null)
    {
        $this->db = $db ?: MoodleConnection::getInstance();
        $this->config = require dirname(__DIR__) . '/config/moodle_config.php';
    }

    /**
     * 코스 정보 조회
     *
     * @param int $courseId 코스 ID
     * @return array|false 코스 정보
     */
    public function getCourse($courseId)
    {
        $sql = "SELECT * FROM " . $this->db->table('course') . "
                WHERE id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $courseId]);
    }

    /**
     * 모든 코스 조회
     *
     * @param array $filters 필터 조건 (예: ['visible' => 1])
     * @param int $limit 제한 개수
     * @param int $offset 시작 위치
     * @return array 코스 배열
     */
    public function getAllCourses($filters = [], $limit = 100, $offset = 0)
    {
        $sql = "SELECT * FROM " . $this->db->table('course') . " WHERE 1=1";
        $params = [];

        // 필터 적용
        if (isset($filters['visible'])) {
            $sql .= " AND visible = :visible";
            $params['visible'] = $filters['visible'];
        }

        if (isset($filters['category'])) {
            $sql .= " AND category = :category";
            $params['category'] = $filters['category'];
        }

        $sql .= " ORDER BY sortorder ASC, fullname ASC LIMIT :limit OFFSET :offset";
        $params['limit'] = $limit;
        $params['offset'] = $offset;

        return $this->db->select($sql, $params);
    }

    /**
     * 사용자의 코스 목록 조회
     *
     * @param int $userId 사용자 ID
     * @param string|null $role 역할 필터 (예: 'student', 'teacher')
     * @return array 코스 배열
     */
    public function getUserCourses($userId, $role = null)
    {
        $sql = "SELECT DISTINCT c.* FROM " . $this->db->table('course') . " c
                INNER JOIN " . $this->db->table('context') . " ctx ON c.id = ctx.instanceid AND ctx.contextlevel = 50
                INNER JOIN " . $this->db->table('role_assignments') . " ra ON ctx.id = ra.contextid
                WHERE ra.userid = :userid";

        $params = ['userid' => $userId];

        if ($role !== null) {
            $sql .= " AND ra.roleid IN (
                        SELECT id FROM " . $this->db->table('role') . "
                        WHERE shortname = :role
                      )";
            $params['role'] = $role;
        }

        $sql .= " ORDER BY c.fullname ASC";

        return $this->db->select($sql, $params);
    }

    /**
     * 코스의 모듈 목록 조회
     *
     * @param int $courseId 코스 ID
     * @param string|null $moduleType 모듈 타입 (예: 'quiz', 'assign', 'forum')
     * @return array 모듈 배열
     */
    public function getCourseModules($courseId, $moduleType = null)
    {
        $sql = "SELECT cm.*, m.name as modname
                FROM " . $this->db->table('course_modules') . " cm
                INNER JOIN " . $this->db->table('modules') . " m ON cm.module = m.id
                WHERE cm.course = :courseid";

        $params = ['courseid' => $courseId];

        if ($moduleType !== null) {
            $sql .= " AND m.name = :modname";
            $params['modname'] = $moduleType;
        }

        $sql .= " ORDER BY cm.section, cm.sequence";

        return $this->db->select($sql, $params);
    }

    /**
     * 특정 모듈 정보 조회
     *
     * @param int $moduleId 모듈 ID (course_modules.id)
     * @return array|false 모듈 정보
     */
    public function getModule($moduleId)
    {
        $sql = "SELECT cm.*, m.name as modname
                FROM " . $this->db->table('course_modules') . " cm
                INNER JOIN " . $this->db->table('modules') . " m ON cm.module = m.id
                WHERE cm.id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $moduleId]);
    }

    /**
     * 퀴즈 정보 조회 (예시)
     *
     * @param int $quizId 퀴즈 ID
     * @return array|false 퀴즈 정보
     */
    public function getQuiz($quizId)
    {
        $sql = "SELECT * FROM " . $this->db->table('quiz') . "
                WHERE id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $quizId]);
    }

    /**
     * 과제 정보 조회 (예시)
     *
     * @param int $assignId 과제 ID
     * @return array|false 과제 정보
     */
    public function getAssignment($assignId)
    {
        $sql = "SELECT * FROM " . $this->db->table('assign') . "
                WHERE id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $assignId]);
    }

    /**
     * 코스 카테고리 조회
     *
     * @param int $categoryId 카테고리 ID
     * @return array|false 카테고리 정보
     */
    public function getCategory($categoryId)
    {
        $sql = "SELECT * FROM " . $this->db->table('course_categories') . "
                WHERE id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $categoryId]);
    }

    /**
     * 모든 카테고리 조회
     *
     * @param int|null $parentId 부모 카테고리 ID (null이면 최상위)
     * @return array 카테고리 배열
     */
    public function getAllCategories($parentId = null)
    {
        $sql = "SELECT * FROM " . $this->db->table('course_categories') . "
                WHERE visible = 1";

        $params = [];

        if ($parentId !== null) {
            $sql .= " AND parent = :parent";
            $params['parent'] = $parentId;
        }

        $sql .= " ORDER BY sortorder ASC, name ASC";

        return $this->db->select($sql, $params);
    }

    /**
     * 코스 섹션 조회
     *
     * @param int $courseId 코스 ID
     * @return array 섹션 배열
     */
    public function getCourseSections($courseId)
    {
        $sql = "SELECT * FROM " . $this->db->table('course_sections') . "
                WHERE course = :courseid
                ORDER BY section ASC";

        return $this->db->select($sql, ['courseid' => $courseId]);
    }

    /**
     * 특정 섹션 조회
     *
     * @param int $sectionId 섹션 ID
     * @return array|false 섹션 정보
     */
    public function getSection($sectionId)
    {
        $sql = "SELECT * FROM " . $this->db->table('course_sections') . "
                WHERE id = :id
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $sectionId]);
    }

    /**
     * 코스 등록 정보 조회
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @return array|false 등록 정보
     */
    public function getUserEnrollment($userId, $courseId)
    {
        $sql = "SELECT ue.*, e.enrol, e.courseid
                FROM " . $this->db->table('user_enrolments') . " ue
                INNER JOIN " . $this->db->table('enrol') . " e ON ue.enrolid = e.id
                WHERE ue.userid = :userid
                AND e.courseid = :courseid
                LIMIT 1";

        return $this->db->selectOne($sql, [
            'userid' => $userId,
            'courseid' => $courseId
        ]);
    }

    /**
     * 코스의 모든 등록 학생 조회
     *
     * @param int $courseId 코스 ID
     * @return array 학생 배열
     */
    public function getCourseStudents($courseId)
    {
        $sql = "SELECT DISTINCT u.*
                FROM " . $this->db->table('user') . " u
                INNER JOIN " . $this->db->table('user_enrolments') . " ue ON u.id = ue.userid
                INNER JOIN " . $this->db->table('enrol') . " e ON ue.enrolid = e.id
                INNER JOIN " . $this->db->table('role_assignments') . " ra ON u.id = ra.userid
                INNER JOIN " . $this->db->table('context') . " ctx ON ra.contextid = ctx.id
                INNER JOIN " . $this->db->table('role') . " r ON ra.roleid = r.id
                WHERE e.courseid = :courseid
                AND ctx.instanceid = :courseid2
                AND ctx.contextlevel = 50
                AND r.shortname = 'student'
                AND u.deleted = 0
                AND u.suspended = 0
                ORDER BY u.lastname, u.firstname";

        return $this->db->select($sql, [
            'courseid' => $courseId,
            'courseid2' => $courseId
        ]);
    }

    /**
     * 코스의 모든 교사 조회
     *
     * @param int $courseId 코스 ID
     * @return array 교사 배열
     */
    public function getCourseTeachers($courseId)
    {
        $sql = "SELECT DISTINCT u.*
                FROM " . $this->db->table('user') . " u
                INNER JOIN " . $this->db->table('role_assignments') . " ra ON u.id = ra.userid
                INNER JOIN " . $this->db->table('context') . " ctx ON ra.contextid = ctx.id
                INNER JOIN " . $this->db->table('role') . " r ON ra.roleid = r.id
                WHERE ctx.instanceid = :courseid
                AND ctx.contextlevel = 50
                AND r.shortname IN ('teacher', 'editingteacher')
                AND u.deleted = 0
                ORDER BY u.lastname, u.firstname";

        return $this->db->select($sql, ['courseid' => $courseId]);
    }

    /**
     * 코스에 사용자 등록
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @param string $role 역할 (예: 'student', 'teacher')
     * @return bool 성공 여부
     */
    public function enrollUser($userId, $courseId, $role = 'student')
    {
        try {
            $this->db->beginTransaction();

            // 등록 인스턴스 찾기 또는 생성
            $sql = "SELECT id FROM " . $this->db->table('enrol') . "
                    WHERE courseid = :courseid
                    AND enrol = 'manual'
                    LIMIT 1";

            $enrol = $this->db->selectOne($sql, ['courseid' => $courseId]);

            if (!$enrol) {
                // 수동 등록 인스턴스 생성
                $sql = "INSERT INTO " . $this->db->table('enrol') . "
                        (enrol, status, courseid, sortorder, timecreated, timemodified)
                        VALUES ('manual', 0, :courseid, 0, :time, :time2)";

                $enrolId = $this->db->insert($sql, [
                    'courseid' => $courseId,
                    'time' => time(),
                    'time2' => time()
                ]);
            } else {
                $enrolId = $enrol['id'];
            }

            // 사용자 등록
            $sql = "INSERT INTO " . $this->db->table('user_enrolments') . "
                    (status, enrolid, userid, timestart, timeend, modifierid, timecreated, timemodified)
                    VALUES (0, :enrolid, :userid, :timestart, 0, 2, :time, :time2)";

            $this->db->insert($sql, [
                'enrolid' => $enrolId,
                'userid' => $userId,
                'timestart' => time(),
                'time' => time(),
                'time2' => time()
            ]);

            // 역할 할당
            $this->assignRole($userId, $courseId, $role);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            $this->log("사용자 등록 실패: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * 사용자에게 역할 할당
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @param string $roleShortName 역할 단축명
     * @return bool 성공 여부
     */
    private function assignRole($userId, $courseId, $roleShortName)
    {
        // 역할 ID 조회
        $sql = "SELECT id FROM " . $this->db->table('role') . "
                WHERE shortname = :shortname
                LIMIT 1";

        $role = $this->db->selectOne($sql, ['shortname' => $roleShortName]);

        if (!$role) {
            throw new Exception("역할을 찾을 수 없음: $roleShortName");
        }

        // 컨텍스트 ID 조회
        $sql = "SELECT id FROM " . $this->db->table('context') . "
                WHERE contextlevel = 50
                AND instanceid = :courseid
                LIMIT 1";

        $context = $this->db->selectOne($sql, ['courseid' => $courseId]);

        if (!$context) {
            throw new Exception("코스 컨텍스트를 찾을 수 없음: $courseId");
        }

        // 역할 할당
        $sql = "INSERT INTO " . $this->db->table('role_assignments') . "
                (roleid, contextid, userid, timemodified, modifierid)
                VALUES (:roleid, :contextid, :userid, :time, 2)";

        $this->db->insert($sql, [
            'roleid' => $role['id'],
            'contextid' => $context['id'],
            'userid' => $userId,
            'time' => time()
        ]);

        return true;
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
            $logMessage = "[$timestamp] [MoodleCourseManager] [$level] $message" . PHP_EOL;
            error_log($logMessage);
        }
    }
}
