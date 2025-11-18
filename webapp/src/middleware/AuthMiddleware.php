<?php
/**
 * Authentication Middleware
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

class AuthMiddleware {
    /**
     * Handle middleware
     */
    public function handle() {
        // Check if user is logged in
        if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            View::flash('error', '로그인이 필요합니다.');
            Router::redirect('/login');
            return false;
        }

        // Check session timeout
        if (isset($_SESSION['login_time'])) {
            $elapsed = time() - $_SESSION['login_time'];

            if ($elapsed > SESSION_LIFETIME) {
                session_destroy();
                View::flash('error', '세션이 만료되었습니다. 다시 로그인해주세요.');
                Router::redirect('/login');
                return false;
            }
        }

        return true;
    }
}

/**
 * Teacher Role Middleware
 */
class TeacherMiddleware {
    public function handle() {
        if (!AuthController::isTeacher()) {
            View::flash('error', '교사 권한이 필요합니다.');
            Router::redirect('/dashboard');
            return false;
        }

        return true;
    }
}

/**
 * Guest Middleware (not logged in)
 */
class GuestMiddleware {
    public function handle() {
        if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
            Router::redirect('/dashboard');
            return false;
        }

        return true;
    }
}
