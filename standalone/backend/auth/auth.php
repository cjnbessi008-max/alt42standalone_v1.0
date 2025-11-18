<?php
/**
 * Next Term Vision - Standalone
 * Authentication System
 */

session_start();

require_once __DIR__ . '/../config.php';

class Auth {
    private $db;

    public function __construct($pdo) {
        $this->db = $pdo;
    }

    /**
     * 회원가입
     */
    public function register($username, $email, $password, $full_name, $grade_level = 1) {
        // 입력 검증
        if (strlen($username) < 3 || strlen($username) > 50) {
            return ['success' => false, 'message' => '사용자명은 3-50자 사이여야 합니다.'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => '유효한 이메일 주소를 입력하세요.'];
        }

        if (strlen($password) < 6) {
            return ['success' => false, 'message' => '비밀번호는 최소 6자 이상이어야 합니다.'];
        }

        // 중복 확인
        $stmt = $this->db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            return ['success' => false, 'message' => '이미 사용 중인 사용자명 또는 이메일입니다.'];
        }

        // 비밀번호 해시
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        // 사용자 생성
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO users (username, email, password_hash, full_name, grade_level, role)
                VALUES (?, ?, ?, ?, ?, 'student')
            ");
            $stmt->execute([$username, $email, $password_hash, $full_name, $grade_level]);

            $user_id = $this->db->lastInsertId();

            // 초기 진행 상황 생성
            $stmt = $this->db->prepare("
                INSERT INTO user_progress (user_id, current_level)
                VALUES (?, 1)
            ");
            $stmt->execute([$user_id]);

            $this->db->commit();

            return [
                'success' => true,
                'message' => '회원가입이 완료되었습니다.',
                'user_id' => $user_id
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Registration error: " . $e->getMessage());
            return ['success' => false, 'message' => '회원가입 중 오류가 발생했습니다.'];
        }
    }

    /**
     * 로그인
     */
    public function login($username, $password) {
        $stmt = $this->db->prepare("
            SELECT id, username, email, password_hash, full_name, grade_level, role, is_active
            FROM users
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return ['success' => false, 'message' => '사용자를 찾을 수 없습니다.'];
        }

        if (!$user['is_active']) {
            return ['success' => false, 'message' => '비활성화된 계정입니다.'];
        }

        if (!password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'message' => '비밀번호가 올바르지 않습니다.'];
        }

        // 마지막 로그인 시간 업데이트
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        // 세션 설정
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        unset($user['password_hash']);

        return [
            'success' => true,
            'message' => '로그인 성공',
            'user' => $user
        ];
    }

    /**
     * 로그아웃
     */
    public function logout() {
        session_destroy();
        return ['success' => true, 'message' => '로그아웃되었습니다.'];
    }

    /**
     * 현재 로그인한 사용자 확인
     */
    public function getCurrentUser() {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT id, username, email, full_name, grade_level, role
            FROM users
            WHERE id = ? AND is_active = 1
        ");
        $stmt->execute([$_SESSION['user_id']]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * 로그인 여부 확인
     */
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    /**
     * 권한 확인
     */
    public function hasRole($role) {
        if (!$this->isLoggedIn()) {
            return false;
        }

        return $_SESSION['role'] === $role;
    }

    /**
     * 인증 필요 (미들웨어)
     */
    public function requireAuth() {
        if (!$this->isLoggedIn()) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'code' => 'AUTH_REQUIRED'
            ]);
            exit;
        }
    }

    /**
     * 비밀번호 변경
     */
    public function changePassword($user_id, $old_password, $new_password) {
        $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($old_password, $user['password_hash'])) {
            return ['success' => false, 'message' => '현재 비밀번호가 올바르지 않습니다.'];
        }

        if (strlen($new_password) < 6) {
            return ['success' => false, 'message' => '새 비밀번호는 최소 6자 이상이어야 합니다.'];
        }

        $new_hash = password_hash($new_password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$new_hash, $user_id]);

        return ['success' => true, 'message' => '비밀번호가 변경되었습니다.'];
    }

    /**
     * 사용자 프로필 업데이트
     */
    public function updateProfile($user_id, $data) {
        $allowed_fields = ['full_name', 'email', 'grade_level', 'preferences'];
        $updates = [];
        $params = [];

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
            }
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => '업데이트할 데이터가 없습니다.'];
        }

        $params[] = $user_id;
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return ['success' => true, 'message' => '프로필이 업데이트되었습니다.'];
    }
}
