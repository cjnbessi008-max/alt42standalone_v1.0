<?php
/**
 * Moodle 사용자 인증 및 세션 관리 클래스
 *
 * Moodle 3.7의 사용자 인증 시스템과 연동
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

namespace Alt42Standalone;

use Exception;

class MoodleAuth
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
     * @var array|null 현재 사용자 정보
     */
    private $currentUser = null;

    /**
     * MoodleAuth 생성자
     *
     * @param MoodleConnection|null $db 데이터베이스 연결 (null인 경우 자동 생성)
     */
    public function __construct($db = null)
    {
        $this->db = $db ?: MoodleConnection::getInstance();
        $this->config = require dirname(__DIR__) . '/config/moodle_config.php';
        $this->initSession();
    }

    /**
     * 세션 초기화
     */
    private function initSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_name($this->config['session']['name']);
            session_start();
        }
    }

    /**
     * 사용자 인증 (사용자명/비밀번호)
     *
     * @param string $username 사용자명
     * @param string $password 비밀번호
     * @return array|false 사용자 정보 또는 false
     */
    public function authenticate($username, $password)
    {
        try {
            // Moodle 사용자 조회
            $sql = "SELECT * FROM " . $this->db->table('user') . "
                    WHERE username = :username
                    AND deleted = 0
                    AND suspended = 0
                    LIMIT 1";

            $user = $this->db->selectOne($sql, ['username' => $username]);

            if (!$user) {
                $this->log("사용자를 찾을 수 없음: $username", 'WARNING');
                return false;
            }

            // Moodle 비밀번호 검증
            if ($this->verifyPassword($password, $user['password'])) {
                // 세션에 사용자 정보 저장
                $this->setCurrentUser($user);
                $this->updateLastLogin($user['id']);

                $this->log("사용자 인증 성공: $username (ID: {$user['id']})", 'INFO');
                return $user;
            }

            $this->log("비밀번호 불일치: $username", 'WARNING');
            return false;
        } catch (Exception $e) {
            $this->log("인증 오류: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * 토큰 기반 인증
     *
     * @param string $token 인증 토큰
     * @return array|false 사용자 정보 또는 false
     */
    public function authenticateByToken($token)
    {
        try {
            $sql = "SELECT u.* FROM " . $this->db->table('user') . " u
                    INNER JOIN " . $this->db->table('external_tokens') . " t ON u.id = t.userid
                    WHERE t.token = :token
                    AND u.deleted = 0
                    AND u.suspended = 0
                    AND (t.validuntil IS NULL OR t.validuntil > :current_time)
                    LIMIT 1";

            $user = $this->db->selectOne($sql, [
                'token' => $token,
                'current_time' => time()
            ]);

            if ($user) {
                $this->setCurrentUser($user);
                $this->log("토큰 인증 성공: {$user['username']} (ID: {$user['id']})", 'INFO');
                return $user;
            }

            $this->log("유효하지 않은 토큰", 'WARNING');
            return false;
        } catch (Exception $e) {
            $this->log("토큰 인증 오류: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * 사용자 ID로 인증
     *
     * @param int $userId 사용자 ID
     * @return array|false 사용자 정보 또는 false
     */
    public function authenticateById($userId)
    {
        try {
            $sql = "SELECT * FROM " . $this->db->table('user') . "
                    WHERE id = :id
                    AND deleted = 0
                    AND suspended = 0
                    LIMIT 1";

            $user = $this->db->selectOne($sql, ['id' => $userId]);

            if ($user) {
                $this->setCurrentUser($user);
                $this->log("ID 인증 성공: {$user['username']} (ID: {$user['id']})", 'INFO');
                return $user;
            }

            return false;
        } catch (Exception $e) {
            $this->log("ID 인증 오류: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Moodle 비밀번호 검증
     *
     * @param string $password 입력된 비밀번호
     * @param string $hash 저장된 해시
     * @return bool
     */
    private function verifyPassword($password, $hash)
    {
        // Moodle은 bcrypt를 사용 (PHP password_hash와 호환)
        if (password_verify($password, $hash)) {
            return true;
        }

        // 레거시 MD5 해시 지원 (Moodle 이전 버전 호환성)
        if (strlen($hash) === 32 && md5($password) === $hash) {
            return true;
        }

        return false;
    }

    /**
     * 현재 사용자 설정
     *
     * @param array $user 사용자 정보
     */
    private function setCurrentUser($user)
    {
        $this->currentUser = $user;
        $_SESSION['moodle_user_id'] = $user['id'];
        $_SESSION['moodle_username'] = $user['username'];
        $_SESSION['moodle_auth_time'] = time();
    }

    /**
     * 현재 사용자 조회
     *
     * @return array|null
     */
    public function getCurrentUser()
    {
        if ($this->currentUser !== null) {
            return $this->currentUser;
        }

        // 세션에서 사용자 정보 복원
        if (isset($_SESSION['moodle_user_id'])) {
            $userId = $_SESSION['moodle_user_id'];
            $this->currentUser = $this->getUserById($userId);
        }

        return $this->currentUser;
    }

    /**
     * 사용자 ID로 사용자 정보 조회
     *
     * @param int $userId 사용자 ID
     * @return array|false
     */
    public function getUserById($userId)
    {
        $sql = "SELECT * FROM " . $this->db->table('user') . "
                WHERE id = :id
                AND deleted = 0
                LIMIT 1";

        return $this->db->selectOne($sql, ['id' => $userId]);
    }

    /**
     * 사용자명으로 사용자 정보 조회
     *
     * @param string $username 사용자명
     * @return array|false
     */
    public function getUserByUsername($username)
    {
        $sql = "SELECT * FROM " . $this->db->table('user') . "
                WHERE username = :username
                AND deleted = 0
                LIMIT 1";

        return $this->db->selectOne($sql, ['username' => $username]);
    }

    /**
     * 사용자 역할 확인
     *
     * @param int $userId 사용자 ID
     * @param int $contextId 컨텍스트 ID
     * @return array 역할 정보 배열
     */
    public function getUserRoles($userId, $contextId = null)
    {
        $sql = "SELECT r.* FROM " . $this->db->table('role') . " r
                INNER JOIN " . $this->db->table('role_assignments') . " ra ON r.id = ra.roleid
                WHERE ra.userid = :userid";

        $params = ['userid' => $userId];

        if ($contextId !== null) {
            $sql .= " AND ra.contextid = :contextid";
            $params['contextid'] = $contextId;
        }

        return $this->db->select($sql, $params);
    }

    /**
     * 사용자가 특정 역할을 가지고 있는지 확인
     *
     * @param int $userId 사용자 ID
     * @param string $roleShortName 역할 단축명 (예: 'teacher', 'student')
     * @param int|null $contextId 컨텍스트 ID
     * @return bool
     */
    public function hasRole($userId, $roleShortName, $contextId = null)
    {
        $sql = "SELECT COUNT(*) as count FROM " . $this->db->table('role') . " r
                INNER JOIN " . $this->db->table('role_assignments') . " ra ON r.id = ra.roleid
                WHERE ra.userid = :userid
                AND r.shortname = :shortname";

        $params = [
            'userid' => $userId,
            'shortname' => $roleShortName
        ];

        if ($contextId !== null) {
            $sql .= " AND ra.contextid = :contextid";
            $params['contextid'] = $contextId;
        }

        $result = $this->db->selectOne($sql, $params);
        return $result && $result['count'] > 0;
    }

    /**
     * 사용자가 교사인지 확인
     *
     * @param int $userId 사용자 ID
     * @param int|null $courseId 코스 ID
     * @return bool
     */
    public function isTeacher($userId, $courseId = null)
    {
        $contextId = null;
        if ($courseId !== null) {
            $contextId = $this->getCourseContextId($courseId);
        }

        return $this->hasRole($userId, 'teacher', $contextId) ||
               $this->hasRole($userId, 'editingteacher', $contextId);
    }

    /**
     * 사용자가 학생인지 확인
     *
     * @param int $userId 사용자 ID
     * @param int|null $courseId 코스 ID
     * @return bool
     */
    public function isStudent($userId, $courseId = null)
    {
        $contextId = null;
        if ($courseId !== null) {
            $contextId = $this->getCourseContextId($courseId);
        }

        return $this->hasRole($userId, 'student', $contextId);
    }

    /**
     * 코스 컨텍스트 ID 조회
     *
     * @param int $courseId 코스 ID
     * @return int|null
     */
    private function getCourseContextId($courseId)
    {
        $sql = "SELECT id FROM " . $this->db->table('context') . "
                WHERE contextlevel = 50
                AND instanceid = :courseid
                LIMIT 1";

        $result = $this->db->selectOne($sql, ['courseid' => $courseId]);
        return $result ? $result['id'] : null;
    }

    /**
     * 마지막 로그인 시간 업데이트
     *
     * @param int $userId 사용자 ID
     */
    private function updateLastLogin($userId)
    {
        $sql = "UPDATE " . $this->db->table('user') . "
                SET lastlogin = :lastlogin, lastaccess = :lastaccess
                WHERE id = :id";

        $this->db->update($sql, [
            'lastlogin' => time(),
            'lastaccess' => time(),
            'id' => $userId
        ]);
    }

    /**
     * 로그아웃
     */
    public function logout()
    {
        $this->currentUser = null;
        unset($_SESSION['moodle_user_id']);
        unset($_SESSION['moodle_username']);
        unset($_SESSION['moodle_auth_time']);

        $this->log("사용자 로그아웃", 'INFO');
    }

    /**
     * 세션 유효성 확인
     *
     * @return bool
     */
    public function isSessionValid()
    {
        if (!isset($_SESSION['moodle_user_id']) || !isset($_SESSION['moodle_auth_time'])) {
            return false;
        }

        $sessionAge = time() - $_SESSION['moodle_auth_time'];
        $timeout = $this->config['session']['timeout'];

        if ($sessionAge > $timeout) {
            $this->logout();
            return false;
        }

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
            $logMessage = "[$timestamp] [MoodleAuth] [$level] $message" . PHP_EOL;
            error_log($logMessage);
        }
    }
}
