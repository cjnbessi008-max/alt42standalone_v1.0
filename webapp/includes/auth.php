<?php
/**
 * Authentication Functions
 *
 * @package InvariantFinder
 */

defined('APP_ACCESS') or die('Direct access not permitted');

/**
 * Register a new user
 */
function registerUser($username, $email, $password, $fullName = null) {
    // Validate input
    if (strlen($username) < 3) {
        return ['success' => false, 'error' => 'Username must be at least 3 characters'];
    }

    if (!isValidEmail($email)) {
        return ['success' => false, 'error' => 'Invalid email address'];
    }

    if (strlen($password) < PASSWORD_MIN_LENGTH) {
        return ['success' => false, 'error' => 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters'];
    }

    // Check if username exists
    $existingUser = db()->fetchOne("SELECT id FROM users WHERE username = ? LIMIT 1", [$username]);
    if ($existingUser) {
        return ['success' => false, 'error' => 'Username already exists'];
    }

    // Check if email exists
    $existingEmail = db()->fetchOne("SELECT id FROM users WHERE email = ? LIMIT 1", [$email]);
    if ($existingEmail) {
        return ['success' => false, 'error' => 'Email already registered'];
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $userId = db()->insert('users', [
        'username' => $username,
        'email' => $email,
        'password' => $hashedPassword,
        'full_name' => $fullName,
        'role' => 'student'
    ]);

    if ($userId) {
        return ['success' => true, 'user_id' => $userId];
    }

    return ['success' => false, 'error' => 'Registration failed. Please try again.'];
}

/**
 * Login user
 */
function loginUser($username, $password, $remember = false) {
    // Find user by username or email
    $sql = "SELECT id, username, email, password, role, is_active
            FROM users
            WHERE (username = ? OR email = ?)
            LIMIT 1";

    $user = db()->fetchOne($sql, [$username, $username]);

    if (!$user) {
        return ['success' => false, 'error' => 'Invalid username or password'];
    }

    if (!$user['is_active']) {
        return ['success' => false, 'error' => 'Account is disabled. Please contact administrator.'];
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        return ['success' => false, 'error' => 'Invalid username or password'];
    }

    // Update last login
    db()->update('users', ['last_login' => date('Y-m-d H:i:s')], 'id = ?', [$user['id']]);

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();

    // Regenerate session ID for security
    session_regenerate_id(true);

    // Remember me functionality
    if ($remember) {
        $token = bin2hex(random_bytes(32));
        setcookie('remember_token', $token, time() + (86400 * 30), '/'); // 30 days

        // Store token in database (implement remember_tokens table if needed)
    }

    return ['success' => true, 'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role']
    ]];
}

/**
 * Logout user
 */
function logoutUser() {
    // Clear session
    $_SESSION = [];

    // Delete session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }

    // Delete remember me cookie
    if (isset($_COOKIE['remember_token'])) {
        setcookie('remember_token', '', time() - 3600, '/');
    }

    // Destroy session
    session_destroy();

    return true;
}

/**
 * Change password
 */
function changePassword($userId, $currentPassword, $newPassword) {
    // Get user
    $user = db()->fetchOne("SELECT password FROM users WHERE id = ? LIMIT 1", [$userId]);

    if (!$user) {
        return ['success' => false, 'error' => 'User not found'];
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password'])) {
        return ['success' => false, 'error' => 'Current password is incorrect'];
    }

    // Validate new password
    if (strlen($newPassword) < PASSWORD_MIN_LENGTH) {
        return ['success' => false, 'error' => 'New password must be at least ' . PASSWORD_MIN_LENGTH . ' characters'];
    }

    // Hash new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password
    $updated = db()->update('users', ['password' => $hashedPassword], 'id = ?', [$userId]);

    if ($updated) {
        return ['success' => true, 'message' => 'Password changed successfully'];
    }

    return ['success' => false, 'error' => 'Failed to change password'];
}

/**
 * Update user profile
 */
function updateProfile($userId, $data) {
    $allowedFields = ['full_name', 'email'];
    $updateData = [];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            if ($field === 'email' && !isValidEmail($data[$field])) {
                return ['success' => false, 'error' => 'Invalid email address'];
            }

            // Check if email is already used by another user
            if ($field === 'email') {
                $existing = db()->fetchOne("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
                    [$data[$field], $userId]);
                if ($existing) {
                    return ['success' => false, 'error' => 'Email already in use'];
                }
            }

            $updateData[$field] = $data[$field];
        }
    }

    if (empty($updateData)) {
        return ['success' => false, 'error' => 'No data to update'];
    }

    $updated = db()->update('users', $updateData, 'id = ?', [$userId]);

    if ($updated !== false) {
        return ['success' => true, 'message' => 'Profile updated successfully'];
    }

    return ['success' => false, 'error' => 'Failed to update profile'];
}

/**
 * Check if username is available
 */
function isUsernameAvailable($username, $excludeUserId = null) {
    $sql = "SELECT id FROM users WHERE username = ?";
    $params = [$username];

    if ($excludeUserId) {
        $sql .= " AND id != ?";
        $params[] = $excludeUserId;
    }

    $sql .= " LIMIT 1";

    $user = db()->fetchOne($sql, $params);
    return $user === false;
}

/**
 * Check if email is available
 */
function isEmailAvailable($email, $excludeUserId = null) {
    $sql = "SELECT id FROM users WHERE email = ?";
    $params = [$email];

    if ($excludeUserId) {
        $sql .= " AND id != ?";
        $params[] = $excludeUserId;
    }

    $sql .= " LIMIT 1";

    $user = db()->fetchOne($sql, $params);
    return $user === false;
}

/**
 * Get user by ID
 */
function getUserById($userId) {
    $sql = "SELECT id, username, email, full_name, role, created_at, last_login, is_active
            FROM users
            WHERE id = ?
            LIMIT 1";

    return db()->fetchOne($sql, [$userId]);
}

/**
 * Get user by username
 */
function getUserByUsername($username) {
    $sql = "SELECT id, username, email, full_name, role, created_at, last_login, is_active
            FROM users
            WHERE username = ?
            LIMIT 1";

    return db()->fetchOne($sql, [$username]);
}
