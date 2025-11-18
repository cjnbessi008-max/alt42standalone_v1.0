<?php
/**
 * Login Page
 * Authenticates users via Moodle or local database
 */

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/moodle_api.php';

ensureSession();

// Redirect if already logged in
if (isLoggedIn()) {
    $user = getCurrentUser();
    if ($user['role'] === 'teacher') {
        header('Location: /teacher/index.php');
    } else {
        header('Location: /student/index.php');
    }
    exit;
}

$errorMessage = '';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $username = sanitize($_POST['username']);
        $password = $_POST['password']; // Don't sanitize password
        $useMoodle = isset($_POST['use_moodle']) && $_POST['use_moodle'] === '1';

        if (empty($username) || empty($password)) {
            throw new Exception('Username and password are required');
        }

        $db = Database::getInstance();

        if ($useMoodle) {
            // Authenticate via Moodle
            $moodleApi = new MoodleAPI();
            $user = $moodleApi->authenticateUser($username, $password);

            if (!$user) {
                throw new Exception('Invalid Moodle credentials');
            }
        } else {
            // Local authentication (for testing)
            $user = $db->queryOne(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [$username, $username]
            );

            if (!$user) {
                throw new Exception('User not found');
            }

            // In production, you should use password_verify() with hashed passwords
            // For now, this is a simple demo
        }

        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];

        // Redirect based on role
        if ($user['role'] === 'teacher') {
            header('Location: /teacher/index.php');
        } else {
            header('Location: /student/index.php');
        }
        exit;

    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
    }
}

$title = 'Login';
require_once __DIR__ . '/templates/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
        <div class="card shadow-lg">
            <div class="card-header bg-primary text-white text-center">
                <h3 class="mb-0">
                    <i class="fas fa-sign-in-alt"></i> Login
                </h3>
            </div>
            <div class="card-body p-5">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger alert-dismissible fade show">
                        <i class="fas fa-exclamation-triangle"></i> <?php echo htmlspecialchars($errorMessage); ?>
                        <button type="button" class="close" data-dismiss="alert">&times;</button>
                    </div>
                <?php endif; ?>

                <form method="POST" action="">
                    <div class="form-group">
                        <label for="username"><i class="fas fa-user"></i> Username or Email</label>
                        <input type="text" class="form-control" id="username" name="username" required autofocus placeholder="Enter your username">
                    </div>

                    <div class="form-group">
                        <label for="password"><i class="fas fa-lock"></i> Password</label>
                        <input type="password" class="form-control" id="password" name="password" required placeholder="Enter your password">
                    </div>

                    <div class="form-group">
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="use_moodle" name="use_moodle" value="1">
                            <label class="custom-control-label" for="use_moodle">
                                <i class="fas fa-graduation-cap"></i> Login via Moodle
                            </label>
                        </div>
                        <small class="form-text text-muted">Check this if you want to authenticate using your Moodle credentials</small>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block btn-lg">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </form>

                <hr>

                <div class="alert alert-info mb-0">
                    <h6><i class="fas fa-info-circle"></i> Demo Accounts</h6>
                    <small>
                        <strong>Teacher:</strong> teacher1 / password<br>
                        <strong>Student:</strong> student1 / password
                    </small>
                </div>
            </div>
        </div>

        <div class="text-center mt-3">
            <a href="/" class="text-muted">
                <i class="fas fa-arrow-left"></i> Back to Home
            </a>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/templates/footer.php'; ?>
