<?php
/**
 * Authentication Controller
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * Show login form
     */
    public function showLogin() {
        // If already logged in, redirect to dashboard
        if ($this->isLoggedIn()) {
            Router::redirect('/dashboard');
        }

        View::render('auth/login', [
            'title' => '로그인'
        ]);
    }

    /**
     * Handle login
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Router::redirect('/login');
        }

        // Verify CSRF token
        if (!View::verifyCsrf($_POST[CSRF_TOKEN_NAME] ?? '')) {
            View::flash('error', '잘못된 요청입니다.');
            Router::redirect('/login');
        }

        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        // Validation
        if (empty($username) || empty($password)) {
            View::flash('error', '사용자명과 비밀번호를 입력해주세요.');
            Router::redirect('/login');
        }

        // Find user
        $user = $this->userModel->findByUsername($username);

        if (!$user) {
            // Also try email
            $user = $this->userModel->findByEmail($username);
        }

        if (!$user || !$this->userModel->verifyPassword($user, $password)) {
            View::flash('error', '사용자명 또는 비밀번호가 일치하지 않습니다.');
            Router::redirect('/login');
        }

        // Login successful
        $this->createSession($user);
        $this->userModel->updateLastLogin($user['id']);

        View::flash('success', '환영합니다, ' . htmlspecialchars($user['full_name'] ?? $user['username']) . '님!');
        Router::redirect('/dashboard');
    }

    /**
     * Show registration form
     */
    public function showRegister() {
        // If already logged in, redirect to dashboard
        if ($this->isLoggedIn()) {
            Router::redirect('/dashboard');
        }

        View::render('auth/register', [
            'title' => '회원가입'
        ]);
    }

    /**
     * Handle registration
     */
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Router::redirect('/register');
        }

        // Verify CSRF token
        if (!View::verifyCsrf($_POST[CSRF_TOKEN_NAME] ?? '')) {
            View::flash('error', '잘못된 요청입니다.');
            Router::redirect('/register');
        }

        $username = trim($_POST['username'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $passwordConfirm = $_POST['password_confirm'] ?? '';
        $fullName = trim($_POST['full_name'] ?? '');
        $role = $_POST['role'] ?? 'student';

        // Validation
        $errors = [];

        if (empty($username) || strlen($username) < 3) {
            $errors[] = '사용자명은 3자 이상이어야 합니다.';
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = '유효한 이메일 주소를 입력해주세요.';
        }

        if (empty($password) || strlen($password) < PASSWORD_MIN_LENGTH) {
            $errors[] = '비밀번호는 ' . PASSWORD_MIN_LENGTH . '자 이상이어야 합니다.';
        }

        if ($password !== $passwordConfirm) {
            $errors[] = '비밀번호가 일치하지 않습니다.';
        }

        if ($this->userModel->usernameExists($username)) {
            $errors[] = '이미 사용 중인 사용자명입니다.';
        }

        if ($this->userModel->emailExists($email)) {
            $errors[] = '이미 사용 중인 이메일 주소입니다.';
        }

        if (!in_array($role, ['student', 'teacher'])) {
            $role = 'student';
        }

        if (!empty($errors)) {
            View::flash('error', implode('<br>', $errors));
            Router::redirect('/register');
        }

        // Create user
        $userId = $this->userModel->create([
            'username' => $username,
            'email' => $email,
            'password' => $password,
            'full_name' => $fullName,
            'role' => $role
        ]);

        if ($userId) {
            View::flash('success', '회원가입이 완료되었습니다. 로그인해주세요.');
            Router::redirect('/login');
        } else {
            View::flash('error', '회원가입 중 오류가 발생했습니다.');
            Router::redirect('/register');
        }
    }

    /**
     * Logout
     */
    public function logout() {
        $this->destroySession();
        View::flash('success', '로그아웃되었습니다.');
        Router::redirect('/login');
    }

    /**
     * Create user session
     */
    private function createSession($user) {
        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
    }

    /**
     * Destroy session
     */
    private function destroySession() {
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        session_destroy();
    }

    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }

    /**
     * Get current user
     */
    public static function getCurrentUser() {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'full_name' => $_SESSION['full_name']
        ];
    }

    /**
     * Check if current user has role
     */
    public static function hasRole($role) {
        return isset($_SESSION['role']) && $_SESSION['role'] === $role;
    }

    /**
     * Check if current user is teacher
     */
    public static function isTeacher() {
        return self::hasRole('teacher') || self::hasRole('admin');
    }

    /**
     * Check if current user is student
     */
    public static function isStudent() {
        return self::hasRole('student');
    }

    /**
     * Require authentication
     */
    public static function requireAuth() {
        if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            View::flash('error', '로그인이 필요합니다.');
            Router::redirect('/login');
        }
    }

    /**
     * Require teacher role
     */
    public static function requireTeacher() {
        self::requireAuth();

        if (!self::isTeacher()) {
            View::flash('error', '교사 권한이 필요합니다.');
            Router::redirect('/dashboard');
        }
    }
}
